// Author: Andrew Fisher. Behaviour tests for revised drawing provenance and map projection; no browser or network.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const page=fs.readFileSync(process.argv[2],'utf8'),machine=process.argv[3];
const source=['v10.20_gate6_compound_LIVE','v10.20_gate6_compound_DRAFT'].map(name=>path.join(__dirname,'../..',name,'gate6_positions_1020.json')).find(file=>fs.existsSync(file));
if(!source)throw Error('Gate 6 reviewed positions not found in LIVE or DRAFT');
const pos=JSON.parse(fs.readFileSync(source,'utf8'));
const refs=Object.keys(pos.refs);let checks=0;
const ok=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const functionSource=name=>{const i=page.indexOf('function '+name+'(');assert(i>=0,name);const j=page.indexOf('\n}',i);assert(j>i,name);return page.slice(i,j+2);};
const loc=Object.fromEntries(refs.map(ref=>[ref,{ll:pos.refs[ref].new.ll,pt:pos.refs[ref].new.pt,prec:'unit'}]));loc.P33={ll:[-27.98,153.42],pt:[.3,.2],prec:'unit'};
const shapes=Object.fromEntries(refs.map(ref=>[ref,pos.refs[ref].shape]));
const ctx={window:{},MASTER_LOC:loc,MASTER_SHAPES926_DATA:{shapes},S:{},SRCW816:{},REPORT_REF782:'P33',frameOf:()=>null,
 movedFor:()=>false,descLoc782:()=>null,report782:()=>null,
 navTargetFor:a=>({ll:{lat:loc[a.key].ll[0],lon:loc[a.key].ll[1]},pinned:true,fix:{master:true}})};
vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'provenance1021.js'),'utf8'),ctx);
vm.runInContext(functionSource('gate6Revision1021'),ctx);
for(const name of ['masterLoc','masterUnit','masterFixFor','locSrc782','noDrop782','dest782','srcWords816'])vm.runInContext(functionSource(name),ctx);
for(const ref of refs){
 ok(ref+' keeps revised coordinates and says approximate',()=>{const d=ctx.dest782({key:ref});assert.equal(d.kind,'revised');assert.equal(d.approx,true);assert.deepEqual([d.ll.lat,d.ll.lon],pos.refs[ref].new.ll);assert.match(d.nav,/14 Oct 2026/);assert.match(d.nav,/confirm placement on site/);});
 ok(ref+' does not redirect a revised drawing to the pit lane',()=>assert.equal(ctx.noDrop782({key:ref}),false));
 ok(ref+' drawer uses revised source, not master on-unit claim',()=>assert.equal(ctx.srcWords816({key:ref},ctx.dest782({key:ref})),'Revised Gate 6 · approximate'));
 ok(ref+' source timestamp is not backdated or presented as an onsite pin',()=>{const f=ctx.masterFixFor(ref);assert.equal(f.at,null);assert.match(f.by,/14 Oct 2026/);assert.match(f.by,/master plan|\bD0\d\d-|drawing/i);});
}
ok('unaffected master reference retains existing navigation',()=>{const d=ctx.dest782({key:'P33'});assert.equal(d.kind,'master');assert.equal(d.approx,false);assert.deepEqual([d.ll.lat,d.ll.lon],loc.P33.ll);});
ok('host overlay reads actual shared shapes and pins',()=>{const rows=ctx.window.gc500Gate6Revision1021();for(const row of rows){assert.deepEqual(Array.from(row.pt),pos.refs[row.ref].new.pt);assert.equal(row.polygons[0],shapes[row.ref].c[0].p);}});
const js=fs.readFileSync(path.join(machine,'explorer/explorer.js'),'utf8');
const model=/const GATE6_SNAPSHOT1021=([^\n]+);\nconst GATE6_OLD1021=([^\n]+);/.exec(js);assert(model,'snapshot declarations');
const overlay={window:{parent:ctx.window},GATE6_SNAPSHOT1021:JSON.parse(model[1]),GATE6_OLD1021:JSON.parse(model[2]),
 SHEET_W:2384,SHEET_H:1684,toGeo:(x,y)=>({x,y}),applyM:(M,x,y)=>({x:M[0]*x+M[2]*y+M[4],y:M[1]*x+M[3]*y+M[5]}),marks:[],mode:'hybrid'};
vm.createContext(overlay);vm.runInContext(fs.readFileSync(path.join(__dirname,'overlay1021.js'),'utf8'),overlay);
ok('parent data takes priority over the standalone snapshot',()=>assert.equal(overlay.gate6Rows1021()[0].polygons[0],shapes.P60.c[0].p));
for(const M of [[5,0,0,5,-10250,-1000],[0,5,-5,0,1400,-10250]])ok('overlay projects revised centres under rotation '+M.slice(0,4),()=>{
 const out=overlay.gate6Projected1021(overlay.gate6Rows1021(),M,1000,700);assert.equal(out.length,5);
 for(const row of out){const p=pos.refs[row.ref].new.pt,x=p[0]*2384,y=p[1]*1684;assert.deepEqual(Array.from(row.centre),[M[0]*x+M[2]*y+M[4],M[1]*x+M[3]*y+M[5]]);}
});
ok('standalone fallback has the same five revised footprints',()=>{overlay.window.parent=null;assert.deepEqual(JSON.parse(JSON.stringify(overlay.gate6Rows1021())),refs.map(ref=>({ref,pt:pos.refs[ref].new.pt,polygons:shapes[ref].c.map(x=>x.p)})));});
ok('map export hook uses the same projection as the screen',()=>{assert.match(js,/drawGate6Revision1021\(ctx,S2D,dpr\)/);assert.match(js,/drawGate6Revision1021\(g,EX,width\/sw\)/);});
ok('standalone 2D and 3D coordinates agree with the page revision',()=>{
 const plan=JSON.parse(fs.readFileSync(path.join(machine,'explorer/assets/plan_items.json'))),three=JSON.parse(fs.readFileSync(path.join(machine,'poc3d/units3d.json')));
 for(const ref of refs){assert.deepEqual(plan.items.find(x=>x.key===ref).pt,pos.refs[ref].new.pt);assert.deepEqual(three.pins.find(x=>x.k===ref).ll,pos.refs[ref].new.ll);}
});
console.log(checks+'/'+checks+' PASS');
