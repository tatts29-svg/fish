/* Author: Andrew Fisher. Phone chrome resize preserves manual day-strip exploration. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../weather_resize1300_src.js'),'utf8');
function fixture(tab,legacy=false){
 const events={},root={innerWidth:390,innerHeight:844,addEventListener(name,fn){events[name]=fn;}},strip={scrollLeft:0},selected={day:tab==='demob'?'2026-11-05':'2026-10-22'},calls=[];
 const reveal=()=>{calls.push({width:root.innerWidth,selected:selected.day});strip.scrollLeft=tab==='demob'?3152:17730;};
 vm.runInNewContext(legacy?source.replaceAll('root.','window.'):source,{root,window:root,reveal});return {root,events,strip,selected,calls,reveal};
}
for(const tab of ['demob','timeline'])test(tab+' preserves manual scroll and selected date through phone height-only resize',()=>{
 const f=fixture(tab),selected=f.selected.day;
 for(const height of [700,620,844,700]){f.root.innerHeight=height;f.events.resize();assert.equal(f.strip.scrollLeft,0);}
 assert.equal(f.calls.length,0);assert.equal(f.selected.day,selected);
});
test('a real viewport-width change still reveals the selected card once',()=>{
 const f=fixture('demob');f.root.innerWidth=430;f.events.resize();assert.equal(f.strip.scrollLeft,3152);assert.equal(f.calls.length,1);
 f.strip.scrollLeft=120;f.root.innerHeight=700;f.events.resize();f.events.resize();assert.equal(f.strip.scrollLeft,120);assert.equal(f.calls.length,1);
 f.root.innerWidth=390;f.events.resize();assert.equal(f.strip.scrollLeft,3152);assert.equal(f.calls.length,2);assert.equal(f.selected.day,'2026-11-05');
});
test('native explicit date or navigation reveals remain available',()=>{
 const f=fixture('timeline');f.selected.day='2026-10-20';f.reveal();assert.equal(f.calls.length,1);assert.equal(f.calls[0].selected,'2026-10-20');assert.equal(f.strip.scrollLeft,17730);
});
test('the legacy Build listener also ignores height-only resize and handles real width changes',()=>{
 const f=fixture('timeline',true);f.root.innerHeight=700;f.events.resize();assert.equal(f.strip.scrollLeft,0);assert.equal(f.calls.length,0);
 f.root.innerWidth=430;f.events.resize();assert.equal(f.strip.scrollLeft,17730);assert.equal(f.calls.length,1);
 f.strip.scrollLeft=120;f.root.innerHeight=844;f.events.resize();assert.equal(f.strip.scrollLeft,120);assert.equal(f.calls.length,1);
});
