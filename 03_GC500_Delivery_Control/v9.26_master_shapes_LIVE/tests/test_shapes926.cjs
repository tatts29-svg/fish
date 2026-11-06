/* Author: Andrew Fisher. Source geometry, native identity and door-save regressions. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const HERE=path.resolve(__dirname,'..'), PAGE=process.argv[2]||'/workspace/private-shapes926/candidate.html';
const text=fs.readFileSync(PAGE,'utf8');
const data=JSON.parse(text.match(/const MASTER_SHAPES926_DATA = (.*?);<\/script>/)[1]);
const ctx={MASTER_SHAPES926_DATA:data,window:{}};vm.createContext(ctx);vm.runInContext(text.match(/<script id="shapes926-script">([\s\S]*?)<\/script>/)[1],ctx);const G=ctx.window.MasterShapes926,A=ctx.window.Shapes926;
let pass=0;function test(name,fn){fn();pass++;console.log('PASS '+name);}
const pc=JSON.parse(fs.readFileSync(path.join(HERE,'source/pdf_check926.json'))),raw=JSON.parse(fs.readFileSync(path.join(HERE,'source/shapes_v915.json')));
const toPdf=(f,inset)=>[f[0]*2384-(inset?0:25.5),f[1]*1684-(inset?.06:.12)];
const near=(v,points)=>Math.min(...points.map(p=>Math.hypot(v[0]-p[0],v[1]-p[1])));
test('Original PDF checksum matches evidence',()=>assert.equal(pc.master_sha256,data.master_sha256));
let vertices=0,doors=0,pieces=0,worstV=0,worstD=0,worstLeaf=0,worstPiece=0;
for(const ref of G.refs())for(const [i,c] of G.shape(ref).components.entries()){
 if(c.source!=='master')continue;
 const q=pc.refs[ref][i];assert(q,ref+'#'+i);
 if(c.geometry==='polygon'){
  assert(q.seq_ok);for(const p of c.poly){vertices++;worstV=Math.max(worstV,near(toPdf(p,q.inset),q.corners_pt));}
  c.doors.forEach((d,j)=>{doors++;const source=q.doors[j];assert(source.arc_seq_ok);assert.equal(d.swing.arcs.length,source.cubics);
   d.swing.arcs.forEach((curve,jj)=>curve.forEach((p,k)=>{worstD=Math.max(worstD,Math.hypot(...toPdf(p,q.inset).map((v,n)=>v-source.arc_segments_pt[jj][k][n])));}));
   d.swing.leaves.flat().forEach(p=>worstLeaf=Math.max(worstLeaf,near(toPdf(p,q.inset),source.leaf_pt)));
   const mid=toPdf(d.mid,q.inset),center=toPdf(c.centroid,q.inset);assert((mid[0]-center[0])*d.outward[0]+(mid[1]-center[1])*d.outward[1]>0,'door must point out');
  });
 }else if(c.geometry==='polyline')c.marks.filter(m=>m.type==='piece').forEach((m,j)=>{pieces++;for(const p of m.poly)worstPiece=Math.max(worstPiece,near(toPdf(p,q.inset),q.pieces[j].points_pt));});
}
test('All traced outline vertices are original PDF corners, below .01pt',()=>{assert(vertices>1200);assert(worstV<.01,worstV);});
test('121 complete door arcs and leaves agree point-for-point with original PDF',()=>{assert.equal(doors,121);assert(worstD<.01,worstD);assert(worstLeaf<.01,worstLeaf);});
test('White/yellow barrier pieces match actual master polygons',()=>{assert(pieces>=240);assert(worstPiece<.01,worstPiece);assert(/ms926-piece-w|ms926-piece/.test(G.svg('WB01')));});
test('Door direction comes from the arc, not the callout or sheet up',()=>{assert.equal(G.shape('P67').components[0].door.faces,'north');assert.equal(G.shape('P25').components[0].door.faces,'south');assert.equal(G.shape('P66').components[0].door.faces,'north');});
test('WC31 preserves doors on both long sides',()=>assert(new Set(G.shape('WC31').components[0].doors.map(d=>d.edge_index)).size>1));
test('FWF directional chevrons do not become door swings',()=>{for(const r of G.refs())for(const c of G.shape(r).components)if(c.kind==='toilet')assert.equal(c.doors.length,0);});
test('Native camera projection preserves every selected polygon and door point',()=>{const angle=.72,scale=41,project=p=>{const x=p[0]*2384,y=p[1]*1684;return [scale*(Math.cos(angle)*x-Math.sin(angle)*y)+310,scale*(Math.sin(angle)*x+Math.cos(angle)*y)-91];};const L=G.layout('P67',{components:[0],minPx:0,project}),c=G.shape('P67').components[0],at=project(L.at);assert.equal(L.scale,1);c.poly.forEach((p,i)=>{const want=project(p).map((x,j)=>x-at[j]);assert(Math.hypot(...want.map((x,j)=>x-L.components[0].poly[i][j]))<1e-8);});});
test('Inset double-swing SVG preserves both actual curves',()=>{const s=G.shape('T0258'),ci=s.components.findIndex(c=>c.doors.length),svg=G.svg('T0258',{components:[ci],door:'master'}),paths=[...svg.matchAll(/class="ms926-swing" d="([^"]+)"/g)];assert(paths.length);assert(paths.every(m=>(m[1].match(/C/g)||[]).length===2));});
test('Frozen asset numbers and unit inventory are absent from embedded evidence',()=>{assert(!JSON.stringify(data).includes('1327228'));assert(G.refs().every(r=>G.units(r).length===0));});
test('No inferred transport fields are exported',()=>{assert(!('transport' in A));assert(!('mass' in A));});
test('Every source waste tank sits at its block footprint',()=>{for(const r of G.refs())for(const c of G.shape(r).components)if(c.kind==='waste_tank')assert.deepEqual(c.poly,G.shape(r).components[c.under].poly);});
test('Waste tank is grey and labelled, without shifted map location',()=>{const s=G.shape('WC20'),i=s.components.findIndex(c=>c.kind==='waste_tank'),svg=G.svg('WC20',{components:[i],sizePx:140});assert(svg.includes('#c5ccd0'));assert(svg.includes('WASTE TANK'));assert(!svg.includes('translate(4,4)'));assert.equal(G.layout('WC20',{components:[i]}).tankOff,0);});
test('Standard catalogue model mismatch remains explicitly uncertain',()=>{assert(G.shape('LT01').components[0].confirm);assert(/size to confirm/.test(A.evidence('LT01',{item:'Light Tower'},G).note));});
test('Grouped block outline cannot invent a numbered building location',()=>{const e=A.evidence('P26',{item:'Building 6m'},G);assert(e.ambiguous);assert(!e.exact);assert.equal(e.door,'none');});
const asset={key:'WC20'},physical=[{id:'coates/toilet',physical:true,assetNo:'1327228',item:'Toilet block 6m',loadingId:'u1327228'},{id:'coates/tank',physical:true,assetNo:'1311341',item:'Waste tank',loadingId:null}];
let stored='',writes=0,can=true,kept=true;const env={asset:r=>r==='WC20'?asset:null,units:()=>physical,rows:()=>[{id:'u1327228',no:'1327228'}],side:()=>stored,set:(r,id,v)=>{writes++;stored=v;return true;},can:()=>can,kept:()=>kept,shapes:G};
test('Current WC20 correction wins over stale source mapping',()=>{const m=A.unitModel(asset,env);assert.equal(m[0].evidence.kind,'toilet_block');assert.equal(m[1].evidence.kind,'waste_tank');assert.equal(m[1].loadingId,null);});
test('Viewing and model projection never write or choose a loading side',()=>{A.unitModel(asset,env);assert.equal(writes,0);assert.equal(stored,'');});
test('Two same-kind units never bind by array order',()=>{const units=[{id:'a',physical:true,item:'Building 6m'},{id:'b',physical:true,item:'Building 6m'}],m=A.unitModel({key:'P67'},{...env,units:()=>units});assert(m.every(u=>!u.evidence.exact&&u.evidence.door==='none'));});
test('An empty booked allocation stays empty despite having a master outline',()=>assert.equal(A.unitModel({key:'P67'},{...env,units:()=>[]}).length,0));
test('Only real stable physical unit identities are included',()=>{const m=A.unitModel(asset,{...env,units:()=>[...physical,physical[0],{id:'planned',physical:false,item:'FWF'},{physical:true,item:'FWF'}]});assert.equal(m.length,2);});
test('No loading row is guessed from index or asset number',()=>{const m=A.unitModel(asset,{...env,units:()=>[{...physical[0],loadingId:null}]});assert.equal(m[0].loadingId,null);});
test('Waste tanks never inherit a toilet loading row even when a stale adapter binds one',()=>{const m=A.unitModel(asset,{...env,units:()=>[{...physical[0],item:'Waste tank'}]});assert.equal(m[0].loadingId,null);});
test('Two owner identities sharing a legacy loading key cannot edit one another',()=>{const m=A.unitModel(asset,{...env,units:()=>[physical[0],{...physical[0],id:'event-portables/same-number',owner:'event-portables'}]});assert(m.every(u=>u.loadingId===null));});
test('Generic item rows cannot be repeated as per-personal-unit loading choices',()=>{const m=A.unitModel(asset,{...env,units:()=>[{id:'anonymous',physical:true,item:'FWF',loadingId:'item:FWF'}],rows:()=>[{id:'item:FWF',no:'',item:'FWF'}]});assert.equal(m[0].loadingId,null);});
test('One explicit change calls the native setter once',()=>{assert.deepEqual(A.saveDoor('WC20','coates/toilet','driver','',env),{accepted:true,kept:true,reason:''});assert.equal(writes,1);assert.equal(stored,'driver');});
test('Saved side survives independent master geometry',()=>{A.unitModel(asset,env);G.svg('WC20');assert.equal(stored,'driver');assert.equal(writes,1);});
test('No-op selection does not write',()=>{assert(A.saveDoor('WC20','coates/toilet','driver','driver',env).unchanged);assert.equal(writes,1);});
test('Stale side refuses write',()=>{assert(!A.saveDoor('WC20','coates/toilet','passenger','',env).accepted);assert.equal(writes,1);});
test('Read only selection refuses write',()=>{can=false;assert(!A.saveDoor('WC20','coates/toilet','passenger','driver',env).accepted);assert.equal(writes,1);can=true;});
test('Tank has no truck door picker',()=>assert(!A.saveDoor('WC20','coates/tank','driver','',env).accepted));
test('Invalid and removed identities refuse writes',()=>{assert(!A.saveDoor('WC20','coates/toilet','north','driver',env).accepted);assert(!A.saveDoor('WC20','old-id','driver','',env).accepted);assert(!A.saveDoor('old-ref','coates/toilet','driver','',env).accepted);});
test('Native persistence failure is pending with no rollback or second save',()=>{kept=false;const r=A.saveDoor('WC20','coates/toilet','passenger','driver',env);assert(r.accepted&&!r.kept&&r.reason.includes('not saved'));assert.equal(stored,'passenger');assert.equal(writes,2);kept=true;});
test('No-op after an unkept native save keeps explicit pending feedback',()=>{kept=false;const r=A.saveDoor('WC20','coates/toilet','passenger','passenger',env);assert(r.accepted&&!r.kept&&r.reason.includes('not saved'));assert.equal(writes,2);kept=true;});
test('Native missing operator/rejection causes no success',()=>assert(!A.saveDoor('WC20','coates/toilet','driver','passenger',{...env,set:()=>false}).accepted));
test('Unknown size still has an explicit equipment representation',()=>{const e=A.evidence('T0265',{item:'Fridge'},G);assert.equal(e.components.length,0);assert.equal(e.note,'Shape and size to confirm');});
test('Reference unit model order follows authoritative adapter order',()=>assert.deepEqual(A.unitModel(asset,{...env,units:()=>physical.slice().reverse()}).map(u=>u.id),['coates/tank','coates/toilet']));
test('Second split load receives highlight before shared-reference geometry dedup',()=>{const ref={key:'P67',point:[.72,.16],source:'Master-plan unit position'},model={loads:[{id:'first',refs:[ref]},{id:'second',refs:[ref]}]},parts=A.overlayModels(model,'second',{...env,asset:()=>({key:'P67'}),units:()=>[]});assert.equal(parts.length,1);assert.equal(parts[0].load.id,'second');});
test('Recorded moved pins cannot inherit an old master outline',()=>{const model={loads:[{id:'moved',refs:[{key:'P67',point:[.9,.4],source:'Recorded position on master plan'}]}]};assert.equal(A.overlayModels(model,'moved',env).length,0);});
test('Unconfirmed catalogue footprints do not become map geometry',()=>{const model={loads:[{id:'tower',refs:[{key:'LT01',point:[.4,.4],source:'Master-plan unit position'}]}]};assert.equal(A.overlayModels(model,'tower',env).length,0);});
if(!process.env.INTEGRATED_PAGE)test('Page patch adds only the two native hooks, monotonic footer and its own source blocks',()=>{const base=fs.readFileSync(process.env.BASE||'/workspace/private-shapes926/base-units.html','utf8');const stripped=text.replace(/\n<style id="shapes926-style">[\s\S]*?<script id="shapes926-script">[\s\S]*?<\/script>\n/,'').replace("\n  if (typeof Shapes926 !== 'undefined') Shapes926.panel(el,current,ui.selected);",'').replace("\n  if (typeof Shapes926 !== 'undefined') Shapes926.overlay(view,map,current,ui.selected);",'').replace(" · v9.26'; /* v8.19"," · v9.25'; /* v8.19");assert.equal(stripped,base);});
test('Patch refuses a second application without changing bytes',()=>{const tmp='/tmp/shapes926-repeat-'+process.pid+'.html';fs.writeFileSync(tmp,text);try{const r=require('child_process').spawnSync('python3',[path.join(HERE,'patch_v926.py'),tmp],{encoding:'utf8'});assert.notEqual(r.status,0);assert.equal(fs.readFileSync(tmp,'utf8'),text);}finally{fs.unlinkSync(tmp);}});
test('Patch refuses a base without authoritative physical-unit adapter',()=>{const tmp='/tmp/shapes926-base-'+process.pid+'.html',before=fs.readFileSync('/workspace/private-restraint-status-09Oct2026/page-live.html','utf8');fs.writeFileSync(tmp,before);try{const r=require('child_process').spawnSync('python3',[path.join(HERE,'patch_v926.py'),tmp],{encoding:'utf8'});assert.notEqual(r.status,0);assert.equal(fs.readFileSync(tmp,'utf8'),before);}finally{fs.unlinkSync(tmp);}});
console.log(JSON.stringify({pass,vertices,doors,pieces,worstV,worstD,worstLeaf,worstPiece}));
