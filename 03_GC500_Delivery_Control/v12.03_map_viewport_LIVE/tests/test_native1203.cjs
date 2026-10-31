/* Author: Andrew Fisher. Actual desktop map size, user controls and keyboard exit. Read only. */
const fs=require('fs'),path=require('path'),assert=require('assert'),{open}=require('../../toolchain/harness/open_page');
(async()=>{const h=await open({pageFile:process.env.PAGE,W:2560,H:1080,dpr:1}),p=h.page,checks=[];const out=process.env.OUT;if(out)fs.mkdirSync(out,{recursive:true});
const check=(name,ok,detail)=>{checks.push({name,ok:!!ok,detail});console.log((ok?'PASS ':'FAIL ')+name);assert(ok,name);};
const measure=()=>p.evaluate(()=>{const f=document.querySelector('#expFrame'),stage=f.contentDocument.getElementById('stage');const r=e=>{const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom};};return {viewport:[innerWidth,innerHeight],stage:r(stage),wrap:r(document.querySelector('#expwrap')),frame:r(f),full:r(document.querySelector('#expFull')),header:r(document.querySelector('header.top')),overflow:document.documentElement.scrollWidth>innerWidth+1,mainScroll:document.querySelector('main').scrollTop};});
try{
 await p.waitForFunction(()=>SYNC.status==='live',null,{timeout:180000});const record=await p.evaluate(()=>JSON.stringify(S));
 check('map still loads only when opened',await p.evaluate(()=>!EXP.frame));
 await p.evaluate(()=>go('map'));await p.waitForFunction(()=>document.querySelector('#expFrame')?.contentDocument?.getElementById('stage'),null,{timeout:180000});await p.waitForTimeout(600);await p.evaluate(()=>{document.querySelector('main').scrollTop=0;expSize();});
 let m=await measure();check('ultrawide map stage exceeds 500px instead of 282px',m.stage.height>=500&&m.wrap.bottom<=1080&&!m.overflow,m);
 check('height choice and Full screen are visible above the map',await p.locator('#mapSize1203').isVisible()&&m.full.height>=44&&m.full.bottom<=m.wrap.y);
 await p.evaluate(()=>{document.querySelector('#expFrame').contentWindow.__viewportTest1203=true;});
 if(out)await p.screenshot({path:path.join(out,'wide-fit.png')});
 const fit=m.wrap.height;await p.locator('#mapSize1203').selectOption('large');await p.waitForTimeout(400);m=await measure();check('Large increases the map by at least 200px',m.wrap.height>=fit+200,m);
 await p.locator('#mapSize1203').selectOption('tall');await p.waitForTimeout(300);m=await measure();check('Extra tall gives a larger scrollable map',m.wrap.height>=1080&&m.wrap.height>fit+400,m);
 check('height change retains the same explorer and device preference',await p.evaluate(()=>document.querySelector('#expFrame').contentWindow.__viewportTest1203===true&&localStorage.getItem('gc500.map.height1203')==='tall'));
 const stable=m.wrap.height;await p.evaluate(()=>{document.querySelector('main').scrollTop=250;for(let i=0;i<5;i++)expSize();});await p.waitForTimeout(300);m=await measure();check('scrolling and repeated sizing do not grow the map',Math.abs(m.wrap.height-stable)<2,m);
 await p.locator('#mapSize1203').selectOption('auto');await p.evaluate(()=>{document.querySelector('main').scrollTop=0;expSize();});await p.waitForTimeout(300);m=await measure();check('Fit screen restores the original usable height',Math.abs(m.wrap.height-fit)<2,m);
 for(const [width,height,min]of [[1280,720,250],[1920,1080,500],[3440,1440,850]]){await p.setViewportSize({width,height});await p.waitForTimeout(400);await p.evaluate(()=>expSize());m=await measure();check(width+'px screen fits a usable map',m.stage.height>=min&&m.wrap.bottom<=height+1&&!m.overflow,m);}
 await p.locator('#expFull').click();await p.waitForTimeout(400);m=await measure();check('Full screen fills the window without clipping',await p.evaluate(()=>document.body.classList.contains('expfull-on'))&&m.stage.height>=1200&&m.frame.bottom<=1440,m);
 if(out)await p.screenshot({path:path.join(out,'ultrawide-full.png')});
 check('exit remains visible and height choice is hidden in Full screen',await p.locator('#expFull').innerText()==='Exit full screen'&&!(await p.locator('#mapSize1203').isVisible()));
 await p.evaluate(()=>document.querySelector('#expFrame').contentWindow.focus());await p.keyboard.press('Escape');check('Escape inside the embedded map exits and returns focus',await p.evaluate(()=>!document.body.classList.contains('expfull-on')&&document.activeElement.id==='expFull'));
 const zoom=p.frameLocator('#expFrame').locator('#zoomInput'),zoomBefore=await zoom.inputValue();
 await p.frameLocator('#expFrame').locator('#zoomIn').click();await p.waitForTimeout(300);
 check('native zoom control remains usable',Number.parseFloat(await zoom.inputValue())>Number.parseFloat(zoomBefore));
 await p.locator('#mapSize1203').selectOption('large');await p.evaluate(()=>go('today'));check('other tabs restore the event header',await p.locator('header.top .hzcluster').isVisible());await p.evaluate(()=>go('map'));await p.waitForTimeout(300);check('returning to Map retains chosen height',await p.locator('#mapSize1203').inputValue()==='large');
 await p.reload({waitUntil:'load',timeout:180000});await p.waitForFunction(()=>SYNC.status==='live',null,{timeout:180000});await p.evaluate(()=>go('map'));await p.waitForFunction(()=>document.querySelector('#expFrame')?.contentDocument?.getElementById('stage'),null,{timeout:180000});await p.waitForTimeout(500);check('reloading retains the device-only height preference',await p.locator('#mapSize1203').inputValue()==='large');
 await p.locator('#mapSize1203').selectOption('auto');await p.setViewportSize({width:390,height:844});await p.waitForTimeout(400);m=await measure();check('phone keeps its existing map workspace',m.stage.height>=330&&!m.overflow&&!(await p.locator('#mapSize1203').isVisible()),m);if(out)await p.screenshot({path:path.join(out,'phone-map.png')});
 await p.locator('#expFull').click();await p.waitForTimeout(300);m=await measure();check('phone full-screen still fits',m.stage.height>=650&&m.frame.bottom<=844,m);await p.evaluate(()=>document.querySelector('#expFrame').contentWindow.focus());await p.keyboard.press('Escape');check('phone embedded-map Escape closes expanded view',await p.evaluate(()=>!document.body.classList.contains('expfull-on')));
 check('shared record unchanged',record===await p.evaluate(()=>JSON.stringify(S)));check('zero page errors and attempted writes',!h.errors.length&&!h.counts.blocked,{errors:h.errors,writes:h.counts.blocked});
}finally{await h.browser.close();if(out)fs.writeFileSync(path.join(out,'native1203.json'),JSON.stringify({author:'Andrew Fisher',checks},null,2));}console.log(checks.length+'/'+checks.length);
})().catch(e=>{console.error(e);process.exit(1)});
