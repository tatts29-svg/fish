// Author: Andrew Fisher. Behavioural fixtures for dashboard viewport and pending 3D openings.
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..'),checks=[];
function ok(name,fn){fn();checks.push({name,pass:true});}
function pending(){
 const timers=new Map();let id=0;
 const c={EXP:{mode3d:true},state:{tab:'map',sheet:'__explorer'},SAT_EXPLORER:'__explorer',setTimeout:f=>{timers.set(++id,f);return id},clearTimeout:i=>timers.delete(i),flash:m=>c.message=m};
 vm.createContext(c);vm.runInContext(fs.readFileSync(root+'/map_pending813_src.js','utf8'),c);
 c.tick=()=>{for(const [i,f] of [...timers]){timers.delete(i);f()}};c.timers=timers;return c;
}
ok('Repeated 3D requests share one timer',()=>{const c=pending();for(let i=0;i<5;i++)c.expFlush3d();assert.equal(c.timers.size,1)});
ok('Opening completes once when the map becomes ready',()=>{const c=pending();let opens=0;c.expFlush3d();c.EXP.frame={contentWindow:{__ready:true,GC500Explorer:{mode3d:()=>opens++}}};c.tick();c.expFlush3d();assert.equal(opens,1);assert.equal(c.timers.size,0);assert.equal(c.EXP.mode3d,false)});
ok('Navigation away cancels a pending opening',()=>{const c=pending();c.expFlush3d();c.state.tab='today';c.tick();assert.equal(c.timers.size,0);assert.equal(c.EXP.mode3d,false)});
ok('Choosing another drawing cancels hidden 3D startup',()=>{const c=pending();c.expFlush3d();c.state.sheet='D002';c.tick();assert.equal(c.timers.size,0);assert.equal(c.EXP.mode3d,false)});
ok('Explicit 2D selection cancels its timer',()=>{const c=pending();c.expFlush3d();c.expCancel3d813();assert.equal(c.timers.size,0);assert.equal(c.EXP.mode3d,false)});
ok('A failed opening stops and gives a retry instruction',()=>{const c=pending();c.expFlush3d();for(let i=0;i<150;i++)c.tick();assert.equal(c.timers.size,0);assert.match(c.message,/retry/);assert.equal(c.EXP.mode3dTries,0)});
ok('A subsequent retry can complete',()=>{const c=pending();c.expFlush3d();for(let i=0;i<150;i++)c.tick();let opens=0;c.EXP.mode3d=true;c.EXP.frame={contentWindow:{__ready:true,GC500Explorer:{mode3d:()=>opens++}}};c.expFlush3d();assert.equal(opens,1)});
function viewport({top=300,bottom=860,scroll=0,vh=900,pad=16,full=false,hidden=false}={}){
 const mn={scrollTop:scroll,getBoundingClientRect:()=>({bottom})},foot={getBoundingClientRect:()=>({top:bottom,height:40})};
 const wrap={style:{},getClientRects:()=>hidden?[]:[{}],getBoundingClientRect:()=>({top:top-scroll}),closest:s=>s==='main'?mn:full?{}:null};
 const c={EXP:{},Math,parseFloat,window:{innerHeight:vh},document:{getElementById:()=>wrap,querySelector:s=>s==='main'?mn:foot},getComputedStyle:()=>({paddingBottom:String(pad)})};
 vm.createContext(c);vm.runInContext(fs.readFileSync(root+'/map_viewport813_src.js','utf8'),c);c.expSize();return {c,wrap};
}
ok('Desktop map ends above the footer and main padding',()=>assert.equal(viewport().wrap.style.height,'544px'));
ok('Phone uses its actual map top',()=>assert.equal(viewport({top:290,bottom:874,vh:915,pad:10}).wrap.style.height,'574px'));
ok('Host scrolling cannot progressively enlarge the map',()=>assert.equal(viewport({scroll:170}).wrap.style.height,viewport().wrap.style.height));
ok('Full screen reserves its own bottom edge',()=>assert.equal(viewport({top:10,full:true}).wrap.style.height,'880px'));
ok('Hidden tab is not resized to an invalid area',()=>assert.equal(viewport({hidden:true}).wrap.style.height,undefined));
ok('Short viewport keeps a usable minimum without a fixed 420px CSS minimum',()=>assert.equal(viewport({top:220,bottom:410,vh:450}).wrap.style.height,'200px'));
fs.writeFileSync(__dirname+'/host813_checks.json',JSON.stringify({author:'Andrew Fisher',checks,scope:'CPU behavioural fixtures; real desktop and phone geometry is checked separately in the browser.'},null,2)+'\n');
console.log(checks.length+' host checks pass');
