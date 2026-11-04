/* Author: Andrew Fisher. Read-only native phone viewport-resize diagnosis. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {open}=require('../../toolchain/harness/open_page');
const PAGE=process.env.PAGE,LIVE=process.env.LIVE==='1',OUT=process.env.OUT;assert((PAGE||LIVE)&&OUT&&path.isAbsolute(OUT),'PAGE or LIVE=1 and private absolute OUT required');
assert(!path.resolve(OUT).startsWith(path.resolve(__dirname,'../../..')+path.sep),'Evidence must stay outside repository');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 const s=await open({pageFile:LIVE?undefined:PAGE,hash:'#demob',W:390,H:844,mobile:true,dpr:1});
 const p=s.page,errors=[];p.on('console',message=>{if(message.type()==='error')errors.push(message.text().slice(0,200));});
 try{
  await p.waitForFunction(()=>window.WeatherStrip1002&&document.querySelector('#pane-demob .daystrip .day.on')&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:120000});
  await pause(500);
  const cases=[];
  for(const tab of ['demob','timeline']){
   await p.setViewportSize({width:390,height:844});
   if(tab!=='demob')await p.evaluate(()=>go('timeline'));
   await p.waitForFunction(tab=>document.querySelector('#pane-'+tab+'.on .daystrip .day.on'),tab,{timeout:60000});
   await pause(250);
   const before=await p.evaluate(tab=>{
    const strip=document.querySelector('#pane-'+tab+' .daystrip'),selected=strip.querySelector('.day.on');
    WeatherStrip1002.reveal(document.getElementById('pane-'+tab));
    const centred=strip.scrollLeft,max=strip.scrollWidth-strip.clientWidth;strip.scrollLeft=centred>max/2?0:max;
    return {scrollLeft:strip.scrollLeft,centred,max,viewportWidth:innerWidth,viewportHeight:innerHeight,selected:selected?.dataset.dday816||selected?.dataset.day||selected?.textContent.slice(0,30)};
   },tab);
   await p.setViewportSize({width:390,height:700});await pause(200);
   const afterHeight=await p.evaluate(tab=>{const strip=document.querySelector('#pane-'+tab+' .daystrip');return {scrollLeft:strip.scrollLeft,viewportWidth:innerWidth,viewportHeight:innerHeight};},tab);
   await p.setViewportSize({width:430,height:700});await pause(200);
   const afterWidth=await p.evaluate(tab=>{const strip=document.querySelector('#pane-'+tab+' .daystrip'),on=strip.querySelector('.day.on'),a=strip.getBoundingClientRect(),b=on.getBoundingClientRect();return {scrollLeft:strip.scrollLeft,centreError:b.left+b.width/2-a.left-strip.clientWidth/2,viewportWidth:innerWidth};},tab);
   cases.push({tab,before,afterHeight,afterWidth,heightSnapped:Math.abs(before.scrollLeft-afterHeight.scrollLeft)>.5});
  }
  const result={author:'Andrew Fisher',live:LIVE,candidate:LIVE?null:PAGE,cases,errors:s.errors,consoleErrors:errors,attemptedRecordWrites:s.counts.blocked};fs.writeFileSync(OUT,JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));assert.equal(s.counts.blocked,0);assert.deepEqual(s.errors,[]);assert.deepEqual(errors,[]);
  for(const item of cases){assert.equal(item.heightSnapped,process.env.BASELINE==='1',item.tab+' height-only resize');assert(Math.abs(item.afterWidth.centreError)<1,item.tab+' genuine width change must reveal selected day');}
 }finally{await s.browser.close();}
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
