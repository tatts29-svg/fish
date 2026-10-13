/* Author: Andrew Fisher. Map status never changes the physical record. */
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const here=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(here,'status1009.js'),'utf8');
const context={window:{},norm:s=>s.toUpperCase().replace(/[\s\-_.]+/g,' ').trim(),esc:s=>String(s).replace(/[&<>"']/g,'_'),ITEMS:[],COMPLETE897:new Set(),selected:null,DONE782_ON:false,dpr:1,canvas:{width:390,height:440},textWidth887:(c,s)=>c.measureText(s).width};
vm.createContext(context);vm.runInContext(source,context);
const checks=[];function test(name,fn){fn();checks.push({name,pass:true});}
const model=(state,label=state,available=true)=>context.statusModel1009({state,label},available);
test('Verified complete is green octagon white check',()=>{const r=model('complete');assert.equal(r.state,'complete');assert.equal(r.shape,'octagon');assert.equal(r.glyph,'check');});
test('Known open state uses distinct diamond and dash',()=>{const r=model('incomplete');assert.equal(r.label,'Not complete');assert.equal(r.shape,'diamond');assert.equal(r.glyph,'dash');});
test('Partial remains partial instead of whole-reference complete',()=>{const r=model('partial','1/2 installed');assert.equal(r.state,'partial');assert.equal(r.label,'Partial');assert.equal(r.detail,'1/2 installed');assert.notEqual(r.glyph,'check');});
test('Review is distinct triangle warning',()=>{const r=model('review');assert.equal(r.shape,'triangle');assert.equal(r.glyph,'!');});
test('Actual no delivery record is explicit',()=>assert.equal(model('unknown','NO DELIVERY RECORD').label,'No delivery record'));
test('Per-item exception is unavailable',()=>assert.equal(model('unknown','STATUS UNAVAILABLE').label,'Status unavailable'));
test('Unavailable batch clears an apparent complete claim',()=>{const r=model('complete','COMPLETE',false);assert.equal(r.state,'unknown');assert.equal(r.label,'Status unavailable');});
test('Missing reference is unavailable rather than incomplete',()=>assert.equal(context.statusModel1009(null,true).label,'Status unavailable'));
test('Cancelled and moved cannot get completion check',()=>{for(const s of ['cancelled','moved'])assert.notEqual(model(s).glyph,'check');});
test('Unrecognised status does not inherit object property',()=>{for(const s of ['__proto__','constructor','madeup'])assert.equal(model(s).state,'unknown');});
test('Unavailable snapshot discards all apparent complete rows',()=>assert.equal(context.statusSnapshot1009({available:false,states:[{key:'WC50',state:'complete'}]}).rows.size,0));
test('Duplicate contradictory reference is review',()=>{const r=context.statusSnapshot1009({available:true,states:[{key:'WC50',state:'complete'},{key:'wc50',state:'incomplete'}]});assert.equal(r.rows.size,1);assert.equal(r.rows.get('WC50').state,'review');});
test('Reference list order does not force changed snapshot',()=>{const rows=[{key:'WC50',state:'complete'},{key:'WC26',state:'incomplete'}];assert.equal(context.statusSnapshot1009({available:true,states:rows}).signature,context.statusSnapshot1009({available:true,states:rows.slice().reverse()}).signature);});
test('Malformed reference rows are ignored',()=>assert.equal(context.statusSnapshot1009({available:true,states:[null,{},{key:32},{key:''}]}).rows.size,0));
test('Older or absent parent supplies no verified status',()=>assert.equal(context.mapHostStatus1009(),null));
test('Throwing parent supplies no verified status',()=>{context.window.parent={gc500MapStatus1009(){throw Error('offline')}};assert.equal(context.mapHostStatus1009(),null);});
test('Available parent bridge passes snapshot',()=>{const snap={available:true,states:[]};context.window.parent={gc500MapStatus1009:()=>snap};assert.equal(context.mapHostStatus1009(),snap);});
test('Non-equipment map annotation gets no work status',()=>assert.equal(context.mapStatus1009({code:'A',cat:{host:'layer'}}),null));
test('SVG glyph is accessible decoration with distinct paths',()=>{const done=context.mapGlyph1009(model('complete')),pending=context.mapGlyph1009(model('incomplete'));assert(done.includes('aria-hidden="true"'));assert(done.includes('m9 16 5 5 10-11'));assert(pending.includes('M10 16h12'));assert(!pending.includes('m9 16 5 5 10-11'));});
function ctx(){const calls=[];return new Proxy({calls,measureText:s=>({width:s.length*7})},{get(t,k){if(k in t)return t[k];return (...v)=>calls.push([k,...v]);},set(t,k,v){calls.push(['set',k,v]);t[k]=v;return true;}});}
test('Canvas complete badge is 28px shape and white check',()=>{const c=ctx();context.badge1009(c,100,100,model('complete'));assert(c.calls.some(x=>x[0]==='lineTo'&&x[1]===14));assert(c.calls.some(x=>x[0]==='set'&&x[1]==='strokeStyle'&&x[2]==='#fff'));assert(c.calls.some(x=>x[0]==='lineTo'&&x[1]===8&&x[2]===-6));});
test('Canvas incomplete badge draws diamond dash not check',()=>{const c=ctx();context.badge1009(c,100,100,model('incomplete'));assert(c.calls.some(x=>x[0]==='moveTo'&&x[1]===0&&x[2]===-14));assert(c.calls.some(x=>x[0]==='moveTo'&&x[1]===-5&&x[2]===0));assert(!c.calls.some(x=>x[0]==='lineTo'&&x[1]===8&&x[2]===-6));});
test('Device pixel ratio changes resolution without CSS badge size',()=>{context.dpr=2;const c=ctx();context.badge1009(c,100,100,model('complete'));assert(c.calls.some(x=>x[0]==='lineTo'&&x[1]===28));context.dpr=1;});
const report={author:'Andrew Fisher',pass:true,checks};fs.writeFileSync(path.join(here,'evidence/status-controls.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({pass:true,checks:checks.length}));
