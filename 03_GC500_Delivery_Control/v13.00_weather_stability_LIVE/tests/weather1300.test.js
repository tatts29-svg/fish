/* Author: Andrew Fisher. Weather continuity without stale facts or native record changes. */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../weather1300_src');
function fixture(){
 let now=1000;const target={},oldAnimation={effect:{target},animationName:'sun',currentTime:6500,playbackRate:1,playState:'running'},newAnimation={effect:{target},animationName:'sun',currentTime:0,playbackRate:1,playState:'paused'};
 const old={name:'old sky',animation:oldAnimation},reading={name:'old reading'},fresh={name:'fresh sky'},freshReading={name:'fresh reading'};
 const map=new Map([['.bc984-card>.wm-card-scene',fresh],['.bc984-weather-reading',freshReading]]);
 fresh.replaceWith=n=>{map.set('.bc984-card>.wm-card-scene',n);n.animation=newAnimation;};freshReading.replaceWith=n=>map.set('.bc984-weather-reading',n);
 const previous={dataset:{dday816:'2026-11-05'},querySelector:s=>s==='.bc984-card>.wm-card-scene'?old:s==='.bc984-weather-reading'?reading:null};
 const card={dataset:{dday816:'2026-11-05'},querySelector:s=>map.get(s)||null};
 const keeper=create({now:()=>now,animations:n=>n.animation?[n.animation]:[]});
 const weather={kind:'sun',hi:29,lo:20,tag:'FORECAST',source:{date:'2026-11-05'}};
 return {keeper,previous,card,old,reading,fresh,map,oldAnimation,newAnimation,weather,advance:ms=>{now+=ms;}};
}
test('unchanged weather keeps both artwork and reading through a native card replacement, continuing elapsed phase',()=>{
 const x=fixture();x.keeper.remember(x.previous,x.weather);x.keeper.capture([x.previous]);x.advance(340);
 assert.equal(x.keeper.restore(x.card,x.weather),true);assert.equal(x.newAnimation.currentTime,0,'phase reads and writes wait until all cards are mounted');x.keeper.finish();assert.equal(x.card.querySelector('.bc984-card>.wm-card-scene'),x.old);assert.equal(x.card.querySelector('.bc984-weather-reading'),x.reading);assert.equal(x.newAnimation.currentTime,6840);assert.equal(x.newAnimation.playState,'paused','native CSS owns pause state');assert.equal(x.keeper.report().pending,0);
});
test('a genuine new weather fact retains the newly rendered artwork and text',()=>{
 const x=fixture();x.keeper.remember(x.previous,x.weather);x.keeper.capture([x.previous]);assert.equal(x.keeper.restore(x.card,{...x.weather,hi:31}),false);assert.equal(x.card.querySelector('.bc984-card>.wm-card-scene'),x.fresh);assert.equal(x.keeper.report().changed,1);
});
test('paused or reduced-motion phase does not advance while a native redraw runs',()=>{
 const x=fixture();x.oldAnimation.playState='paused';x.keeper.remember(x.previous,x.weather);x.keeper.capture([x.previous]);x.advance(900);x.keeper.restore(x.card,x.weather);x.keeper.finish();assert.equal(x.newAnimation.currentTime,6500);
});
test('a changed artwork structure never restores only part of a previous scene',()=>{
 const x=fixture();x.keeper.remember(x.previous,x.weather);x.keeper.capture([x.previous]);x.map.delete('.bc984-weather-reading');assert.equal(x.keeper.restore(x.card,x.weather),false);assert.equal(x.card.querySelector('.bc984-card>.wm-card-scene'),x.fresh);
});
test('untracked or released cards cannot carry stale weather into another draw',()=>{
 const x=fixture();x.keeper.capture([x.previous]);assert.equal(x.keeper.restore(x.card,x.weather),false);x.keeper.remember(x.previous,x.weather);x.keeper.capture([x.previous]);x.keeper.release();assert.equal(x.keeper.restore(x.card,x.weather),false);assert.equal(x.keeper.report().pending,0);
});
