// Author: Andrew Fisher. Execute the restored navigation functions with inert dependencies.
// PARENT_HTML=<private v12.81> EXPLORER_JS=<restored Explorer source> node this-file.cjs
// No browser, network request, shared-record mutation or publication.
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict');
const parent=fs.readFileSync(process.env.PARENT_HTML,'utf8'), explorer=fs.readFileSync(process.env.EXPLORER_JS,'utf8');
const calls=[], context={EXP:{mode3d:false},state:{},SAT_EXPLORER:'synthetic-explorer',expOn:()=>true,
 go:x=>calls.push(['go',x]),renderMap:()=>calls.push(['render']),expFlush3d:()=>calls.push(['flush3d']),expFind:x=>{calls.push(['find',x]);return 'found';},
 expCancel3d813:()=>{context.EXP.mode3d=false;calls.push(['cancel3d']);}};
for(const name of ['expOpen2d','expOpen3d']) {
 const source=parent.match(new RegExp('^function '+name+'\\([^\\n]+$','m'));assert.ok(source,name+' source found');vm.runInNewContext(source[0],context);
}
let pass=0;const check=(name,fn)=>{fn();pass++;};
check('3D action enters 3D and dispatches the map',()=>{assert.equal(context.expOpen3d(),true);assert.equal(context.EXP.mode3d,true);assert.deepEqual(calls,[['go','map'],['render'],['flush3d']]);});
check('3D reference action retains its target',()=>{calls.length=0;assert.equal(context.expOpen3d('TEST-REF'),'found');assert.deepEqual(calls,[['find','TEST-REF']]);assert.equal(context.EXP.mode3d,true);});
check('2D action cancels 3D and returns to Explorer',()=>{calls.length=0;assert.equal(context.expOpen2d(),true);assert.equal(context.EXP.mode3d,false);assert.deepEqual(calls,[['cancel3d'],['go','map'],['render']]);});
const buttons=['original','hybrid','satellite'].map(mode=>({dataset:{mode},setAttribute(k,v){this[k]=v;}}));
const modeCalls=[], C={mode:'original',rotAnim:0,document:{querySelectorAll:()=>buttons},
 geoOn:()=>C.mode!=='original',dropVTQueue:()=>modeCalls.push('drop'),setSatState:()=>{},ensureKey:()=>{modeCalls.push('key');return Promise.resolve();},
 requestPaint:()=>{},cancelTiles:()=>modeCalls.push('cancelTiles'),setAttrib:()=>{},stopZoomAnim:()=>{},stopFling:()=>{},cancelAnimationFrame:()=>{},
 fit:()=>modeCalls.push('fit'),changeView:()=>modeCalls.push('changeView')};
const fn=explorer.match(/function setMode\(m\) \{\n[\s\S]*?\n\}/);assert.ok(fn,'native setMode source found');vm.runInNewContext(fn[0],C);
check('satellite selection reaches its provider path',()=>{C.setMode('satellite');assert.equal(C.mode,'satellite');assert.ok(modeCalls.includes('key'));assert.ok(modeCalls.includes('fit'));assert.equal(buttons[2]['aria-pressed'],'true');});
check('hybrid selection stays available in the same camera family',()=>{modeCalls.length=0;C.setMode('hybrid');assert.equal(C.mode,'hybrid');assert.ok(modeCalls.includes('key'));assert.ok(modeCalls.includes('changeView'));});
check('original plan selection cancels satellite fetching',()=>{modeCalls.length=0;C.setMode('original');assert.equal(C.mode,'original');assert.ok(modeCalls.includes('cancelTiles'));assert.ok(!modeCalls.includes('key'));});
console.log(JSON.stringify({pass,networkRequests:0,recordWrites:0,scope:'restored entrypoint execution with inert dependencies; live rendering untested'}));
