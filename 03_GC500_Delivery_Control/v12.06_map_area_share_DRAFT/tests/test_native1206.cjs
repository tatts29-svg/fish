/* Author: Andrew Fisher. Read-only browser checks. All share, clipboard and download actions are captured locally. */
const fs=require('fs'),path=require('path'),assert=require('assert'),{open}=require('../../toolchain/harness/open_page');
(async()=>{
 const mobile=process.env.MOB==='1',out=process.env.OUT,checks=[],h=await open({pageFile:process.env.PAGE,hash:'#sheet/__explorer',W:mobile?390:1440,H:mobile?844:1000,dpr:mobile?2:1,mobile}),p=h.page;
 const check=(name,ok)=>{checks.push({name,ok:!!ok});assert(ok,name);};if(out)fs.mkdirSync(out,{recursive:true});
 try{
 await p.waitForFunction(()=>document.querySelector('#pane-map.on #expFrame')?.contentWindow?.GC500Area1206&&SYNC.status==='live',null,{timeout:180000});
 await p.locator('#expFull').click();const f=p.frames().find(f=>f.url().includes('/explorer/index.html'));
 await f.waitForFunction(()=>ITEMS.some(i=>i.code==='WC41'),null,{timeout:180000});
 await f.evaluate(()=>{window.test1206={downloads:0,shares:[],copies:[],mode:'files'};Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>test1206.mode!=='text'});Object.defineProperty(navigator,'share',{configurable:true,value:async d=>{if(test1206.mode==='abort')throw new DOMException('Cancelled','AbortError');test1206.shares.push(d);}});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{test1206.copies.push(t);}}});const click=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(this.download){test1206.downloads++;return;}return click.call(this);};});
 const focus=async code=>{await f.evaluate(code=>{GC500Spot1117.clear();const it=ITEMS.find(i=>i.code===code),b=it.places[0],q=toGeo((b[0]+b[2])/2,(b[1]+b[3])/2);gotoRect([q.x-45,q.y-45,q.x+45,q.y+45],'Area sharing check');},code);await p.waitForTimeout(950);return await f.evaluate(code=>{const b=ITEMS.find(i=>i.code===code).places[0],q=toGeo((b[0]+b[2])/2,(b[1]+b[3])/2),z=applyM(sheetToDevice(currentView().scale,sw,sh),q.x,q.y),r=stage.getBoundingClientRect();return {x:z.x,y:z.y,cx:z.x+r.left,cy:z.y+r.top};},code);};
 const pin=async code=>{const q=await focus(code);await f.evaluate(q=>GC500Spot1117.drop(q.x,q.y),q);await ready();};
 const ready=()=>f.waitForFunction(()=>GC500Area1206.state.ready||GC500Area1206.state.error,null,{timeout:180000});
 const q=await focus('WC41');
 // Real DOM gesture path; synthetic pointer events avoid the runner's OS context menu.
 await f.evaluate(q=>{stage.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,isPrimary:true,pointerId:17,button:0,clientX:q.cx,clientY:q.cy}));stage.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,isPrimary:true,pointerId:17,button:0}));},q);await p.waitForTimeout(650);
 check('quick tap does not drop a share pin',await f.evaluate(()=>!GC500Spot1117.state.pin));
 await f.evaluate(q=>{stage.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,isPrimary:true,pointerId:18,button:0,clientX:q.cx,clientY:q.cy}));stage.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,isPrimary:true,pointerId:18,clientX:q.cx+20,clientY:q.cy}));},q);await p.waitForTimeout(650);await f.evaluate(()=>stage.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,isPrimary:true,pointerId:18})));
 check('drag does not become a share pin',await f.evaluate(()=>!GC500Spot1117.state.pin));
 if(mobile){await f.evaluate(q=>stage.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,isPrimary:true,pointerId:19,button:0,clientX:q.cx,clientY:q.cy})),q);await p.waitForTimeout(650);await f.evaluate(()=>stage.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,isPrimary:true,pointerId:19})));}
 else await f.evaluate(q=>stage.dispatchEvent(new MouseEvent('contextmenu',{bubbles:true,cancelable:true,clientX:q.cx,clientY:q.cy,button:2})),q);
 await ready();let state=await f.evaluate(()=>GC500Area1206.state);
 check(mobile?'long press makes area and picture':'right-click makes area and picture',state.ready&&!state.error);
 check('chevron-marked toilet doors retained',state.rows.find(r=>r.code==='WC41')?.parts.flatMap(x=>x.doors).length===10);
 check('square visible on map',await f.locator('#area1206-boundary polygon').count()===2);
 check('share button enabled when picture is ready',await f.locator('[data-sp="share"]').isEnabled());
 check('all mapped entries appear in share text',await f.evaluate(()=>GC500Area1206.state.rows.every(r=>GC500Spot1117.words().includes(r.code)&&r.descriptions.every(d=>GC500Spot1117.words().includes(d)))));
 check('capture time and quantity limitations explicit',await f.evaluate(()=>/Captured .* AEST/.test(GC500Spot1117.words())&&GC500Spot1117.words().includes('Reference quantities')));
 check('icons loaded and unknown direction explicit',await f.evaluate(()=>document.fonts.check('48px GC500MapUnits1147')&&GC500Area1206.state.rows.some(r=>r.symbols.some(s=>s.glyph))&&/not recorded/.test(GC500Area1206.doorWords({parts:[],loading:[],symbols:[{label:'Building'}]}))));
 const stable=await f.evaluate(()=>{const p=GC500Spot1117.state.pin,pin={ll:{lat:p.lat,lon:p.lon}},before=GC500Area1206.snapshot(pin).rows.map(r=>r.code).join('|');showCategory(ITEMS.find(i=>i.code==='WC41').cat.id);const filtered=GC500Area1206.snapshot(pin).rows.map(r=>r.code).join('|');showCategory(null);const hidden=GC500Area1206.snapshot(pin).rows.map(r=>r.code).join('|');return before===filtered&&before===hidden;});
 check('contents independent of visible category filters',stable);
 const geometry=await f.evaluate(()=>{const s=GC500Area1206.snapshot({ll:{lat:GC500Spot1117.state.pin.lat,lon:GC500Spot1117.state.pin.lon}}),A=parent.MapArea1206.core,F=s.F;let crossing=false;
 for(const r of s.rows)for(const part of r.parts)for(const p of part.poly){const offset=[p[0]+24,p[1]],w=F.world(offset),ll={lon:w[0]/(512*2**18)*360-180,lat:Math.atan(Math.sinh(Math.PI*(1-2*w[1]/(512*2**18))))*180/Math.PI},hit=GC500Area1206.snapshot({ll}).rows.find(x=>x.code===r.code);if(hit&&hit.parts.length&&!hit.points.length)crossing=true;}
 const width=F.world([25,0])[0]-F.world([-25,0])[0];return {width:width*F.mpp,crossing,unique:new Set(s.rows.map(r=>r.code)).size===s.rows.length};});
 check('square spans 50 ground metres',Math.abs(geometry.width-50)<.001);check('crossing footprint included with reference marker outside',geometry.crossing);check('references deduplicated',geometry.unique);
 const cam=await f.evaluate(()=>JSON.stringify(camera));await f.evaluate(async()=>{const s=GC500Area1206.snapshot({ll:{lat:GC500Spot1117.state.pin.lat,lon:GC500Spot1117.state.pin.lon}});await GC500Area1206.picture(s);});check('export does not change camera or zoom',cam===await f.evaluate(()=>JSON.stringify(camera)));
 await f.locator('[data-sp="copy"]').click();check('Copy returns complete area text',await f.evaluate(()=>test1206.copies.at(-1)===GC500Spot1117.words()));
 check('native file sharing used',await f.evaluate(()=>GC500Spot1117.share())==='files');
 let file=await f.evaluate(async()=>{const d=test1206.shares.at(-1),v=new DataView(await d.files[0].arrayBuffer());return {width:v.getUint32(16),height:v.getUint32(20),type:d.files[0].type,all:d.text===GC500Spot1117.words(),title:d.title};});
 check('shared PNG is 3840 by 4160 with full contents',file.width===3840&&file.height===4160&&file.type==='image/png'&&file.all);
 await f.evaluate(()=>test1206.mode='abort');check('cancelled native share never reports delivery',await f.evaluate(()=>GC500Spot1117.share())==='aborted'&&await f.evaluate(()=>test1206.downloads===0));
 await f.evaluate(()=>test1206.mode='text');check('text-only native share saves picture separately',await f.evaluate(()=>GC500Spot1117.share())==='text'&&await f.evaluate(()=>test1206.downloads===1));
 await f.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:undefined}));check('desktop fallback saves picture and copies full list',await f.evaluate(()=>GC500Spot1117.share())==='copied'&&await f.evaluate(()=>test1206.downloads===2));
 await f.locator('[data-area1206] details').first().evaluate(e=>e.open=true);await f.locator('[data-sp="share"]').scrollIntoViewIfNeeded();
 check('phone/desktop dialog and share controls fit window',await f.evaluate(()=>{const c=document.querySelector('#spot1117'),r=c.getBoundingClientRect(),b=c.querySelector('[data-sp="share"]').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1&&b.bottom<=r.bottom+1&&c.scrollWidth<=c.clientWidth+1;}));
 if(out){await p.screenshot({path:path.join(out,'area-dialog.png')});const data=await f.evaluate(async()=>{const b=await(await fetch(document.querySelector('[data-area1206] img').src)).blob();return await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result.split(',')[1]);f.readAsDataURL(b);});});fs.writeFileSync(path.join(out,'area.png'),Buffer.from(data,'base64'));}
 await pin('P33');state=await f.evaluate(()=>GC500Area1206.state);check('recorded building doors appear with compass directions',state.rows.some(r=>r.code==='P33'&&r.parts.some(p=>p.doors.some(d=>d.faces==='north-west'))));
 const moved=await f.evaluate(()=>{const it=ITEMS.find(i=>i.code==='P33'),old=it.placedHow,p=GC500Spot1117.state.pin;try{it.placedHow="Andrew's pin";return GC500Area1206.snapshot({ll:{lat:p.lat,lon:p.lon}}).rows.find(r=>r.code==='P33')?.parts.every(p=>!p.doors.length);}finally{it.placedHow=old;}});check('manually moved pin cannot inherit old plan doors',moved);
 if(!mobile){
 const inset=await f.evaluate(()=>ITEMS.find(it=>it.places.some(b=>{const x=(b[0]+b[2])/2,y=(b[1]+b[3])/2,r=GEO.inset.sheet_region_pts;return x>r[0]+2&&x<r[2]-2&&y>r[1]+2&&y<r[3]-2;}))?.code);check('registered inset fixture available',!!inset);await pin(inset);check('registered inset exports without error',(await f.evaluate(()=>GC500Area1206.state)).ready);
 }
 // Rendering failure must leave useful text and recover on the next selection.
 await f.evaluate(()=>{window.svg1206original=svgFromWorker;svgFromWorker=()=>Promise.reject(new Error('Simulated drawing unavailable'));});const qFail=await focus('WC41');await f.evaluate(q=>GC500Spot1117.drop(q.x,q.y),qFail);await ready();
 check('render error leaves Copy available and disables picture share',await f.evaluate(()=>!!GC500Area1206.state.error&&!document.querySelector('[data-sp="copy"]').disabled&&document.querySelector('[data-sp="share"]').disabled));
 await f.evaluate(()=>svgFromWorker=window.svg1206original);await pin('WC41');check('repinning recovers from rendering failure',(await f.evaluate(()=>GC500Area1206.state)).ready);
 await f.evaluate(()=>{svgFromWorker=async(...a)=>{await new Promise(r=>setTimeout(r,250));return svg1206original(...a);};const c=document.querySelector('#spot1117'),p=GC500Spot1117.state.pin;GC500Area1206.update({ll:{lat:p.lat,lon:p.lon}},c);GC500Area1206.update({ll:{lat:p.lat+.0001,lon:p.lon}},c);GC500Spot1117.clear();});await p.waitForTimeout(1500);
 check('clear cancels queued area and cannot revive stale share',await f.evaluate(()=>!GC500Spot1117.state.pin&&!GC500Area1206.state.ready&&!GC500Area1206.state.entries&&!document.querySelector('#area1206-boundary polygon')));
 check('no page errors or attempted writes',!h.errors.length&&!h.counts.blocked);
 console.log(JSON.stringify({author:'Andrew Fisher',mobile,actual_public_page:!process.env.PAGE,checks,passed:checks.length,errors:h.errors,attempted_writes:h.counts.blocked}));
 }finally{await h.browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
