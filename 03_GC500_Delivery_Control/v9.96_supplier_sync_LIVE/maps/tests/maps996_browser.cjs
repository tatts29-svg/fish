/* Author: Andrew Fisher. Current map identities and live refresh; all writes blocked. */
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('node:assert/strict');
const harness=path.resolve(__dirname,'../../../toolchain/harness/open_page.js');
const m=new Module(harness,module);m.filename=harness;m.paths=Module._nodeModulePaths(path.dirname(harness));
// Map transport is an explicit local fixture. Every operational write stays blocked.
let hs=fs.readFileSync(harness,'utf8').replace(/const okPost = [^;]+;/,`if(r.method()==='POST'&&new URL(u).origin==='https://tile.googleapis.com'&&new URL(u).pathname==='/v1/createSession'){counts.localMapSessions=(counts.localMapSessions||0)+1;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({session:'local-readonly-fixture',expiry:String(Math.floor(Date.now()/1000)+600),tileWidth:256,tileHeight:256,imageFormat:'png'})});} if(r.method()==='GET'&&new URL(u).origin==='https://tile.googleapis.com'&&new URL(u).pathname.startsWith('/v1/2dtiles/'))return route.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aPt8AAAAASUVORK5CYII=','base64')}); const okPost=false;`);
hs=hs.replace("const okPost=false;","const parts=new URL(u).pathname.split('/'),fileName=parts.at(-1);if(parts.at(-2)==='explorer'&&['index.html','explorer.js','explorer-merge.js'].includes(fileName)&&process.env.MAP_CODE){const file=require('path').join(process.env.MAP_CODE,fileName);return route.fulfill({status:200,contentType:fileName.endsWith('.html')?'text/html':'application/javascript',body:require('fs').readFileSync(file)});} const okPost=false;");
m._compile(hs,harness);require.cache[harness]=m;

const {open}=require(harness);const out=process.env.OUT||'/workspace/private-maps996/browser';fs.mkdirSync(out,{recursive:true});
const result={author:'Andrew Fisher',checks:[],writes:0,errors:[]};
function check(value,name){result.checks.push({name,pass:!!value});assert(value,name)}
(async()=>{let h,before;try{
 h=await open({pageFile:process.env.PAGE,hash:'#sheet/__explorer',W:process.env.MOB==='1'?390:1440,H:process.env.MOB==='1'?844:960,mobile:process.env.MOB==='1',dpr:process.env.MOB==='1'?2:1});const p=h.page;
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:60000});
 before=await p.evaluate(()=>JSON.stringify(S));
 await p.waitForFunction(()=>EXP.frame&&EXP.frame.contentWindow.__ready,null,{timeout:60000});
 const frame=p.frames().find(f=>f.url().includes('/explorer/index.html'));assert(frame);
 await frame.evaluate(()=>GC500Explorer.ready);
 const sources=await p.evaluate(()=>holdAssets(()=>({record:SYNC.backend.readVersion821(),wc61:gc500PlanItems().items.find(a=>a.key==='WC61'),spare:gc500PlanItems().unplaced.find(a=>a.key==='T0268'),pee:gc500PlanItems().items.find(a=>/quantity 6/.test(a.ownership||''))})));
 check(sources.wc61.assets.includes('0645')&&sources.wc61.ownership.includes('SUB-HIRED')&&sources.wc61.ownership.includes('Event Portables'),'Map parent carries current supplier numbers and ownership');
 check(sources.spare.assets==='1197215'&&sources.spare.location==='Coates compound','Unplaced spare retains known number and named destination');
 check(!!sources.pee,'Quantity-only pee panel ownership reaches map projection');
 result.initialMap=await frame.evaluate(()=>({wc61:ITEMS.find(a=>a.code==='WC61'),host61:HOST&&HOST.items.find(a=>a.key==='WC61'),hasRefresh:typeof GC500Explorer.refresh,searchReady:!!P,ready:__ready,files:[...document.scripts].map(s=>s.src).filter(s=>/explorer(?:-merge)?\.js/.test(s))}));
 const search=async q=>frame.evaluate(value=>{document.getElementById('q').value=value;search();return document.getElementById('results').textContent;},q);
 check((await search('0645')).includes('WC61'),'Embedded map finds leading-zero supplier number');
 check((await search('1197215')).includes('T0268'),'Embedded map finds unplaced asset number');
 result.coverage=await frame.evaluate(()=>{const model=window.parent.gc500PlanItems(),expected=[...new Set([...model.items,...model.unplaced,...(model.placed||[])].map(row=>norm(row.key)))],present=new Set(ITEMS.map(row=>row.code));return {parentReferences:expected.length,missing:expected.filter(key=>!present.has(key))};});
 check(result.coverage.missing.length===0,'Every current parent reference is present in embedded map items');
 await frame.evaluate(()=>GC500Explorer.find('WC61'));await frame.waitForFunction(()=>gotoAnim887===0&&zAnim===0,null,{timeout:5000});const camera=await frame.evaluate(()=>JSON.stringify(GC500Explorer.state.view));
 await p.evaluate(()=>{const input=document.getElementById('q');input.value='0645';finderOpen('0645');});
 if(process.env.MOB!=='1')await frame.evaluate(()=>document.getElementById('q').focus());
 await p.evaluate(()=>{S.units.WC61.units.find(u=>u.asset_no==='0645').asset_no='000996';sharedCache975();});
 check(!(await search('0645')).includes('WC61'),'Removed old supplier number disappears immediately');
 check((await search('000996')).includes('WC61'),'New supplier number is immediately searchable');
 await p.evaluate(()=>render());
 check(await p.evaluate(()=>!FINDER.list.some(row=>row.key==='WC61')&&document.getElementById('q').value==='0645'),'Already-open header search refreshes on the same record render');
 if(process.env.MOB!=='1')check(await frame.evaluate(()=>document.activeElement.id==='q'),'Map input retains focus after shared-record render');
 check(await frame.evaluate(()=>selected&&selected.code==='WC61'&&marks.filter(m=>m.it.code==='WC61').length===1),'Selected marker is retained once after number change');
 // Native map view/camera remains stable; record changes never call gotoRect.
 check(await frame.evaluate(c=>JSON.stringify(GC500Explorer.state.view)===c,camera),'Refresh preserves map camera');
 const card=await frame.evaluate(()=>document.getElementById('xcard').textContent);
 check(card.includes('000996')&&!card.includes('0645'),'Open map card follows the same current identity');
 result.searchTimingsMs=await frame.evaluate(()=>{const times=[];for(let i=0;i<3;i++){const t=performance.now();search();times.push(performance.now()-t);}return times;});
 await search('WC61');await p.screenshot({path:path.join(out,'map-current-search.png')});
 await p.evaluate(s=>{S=JSON.parse(s);sharedCache975();render();},before);
 check((await search('0645')).includes('WC61')&&!(await search('000996')).includes('WC61'),'Record restoration refreshes all search identities');
 check(await p.evaluate(s=>JSON.stringify(S)===s,before),'Native record is restored exactly');
 check(h.errors.length===0,'No page exceptions');check(h.counts.blocked===0,'No operational writes attempted');
 result.pass=true;result.recordVersion=sources.record;result.counts=h.counts;
}catch(e){result.pass=false;result.error=String(e.stack||e);process.exitCode=1;}
finally{if(h){if(before)try{await h.page.evaluate(s=>{S=JSON.parse(s);sharedCache975();},before)}catch(e){}result.errors=h.errors;result.writes=h.counts.blocked;await h.browser.close();}fs.writeFileSync(path.join(out,'maps996.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({pass:result.pass,checks:result.checks.length,out,error:result.error}));}})();
