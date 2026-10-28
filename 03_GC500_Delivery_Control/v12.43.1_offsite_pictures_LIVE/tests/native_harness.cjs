/* Author: Andrew Fisher. Read-only candidate test harness; all operational record writes denied; only native Google map-session POST allowed.
 * Native setters may be rehearsed in page memory with their sender held.
 * The snapshot is frozen for one run so polling cannot change the fixture.
 */
'use strict';
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const H=path.resolve(__dirname,'../../toolchain/harness');
const hp=path.join(H,'open_page.js'),fetcher=require(path.join(H,'curlfetch')),fetch=fetcher.curlFetch;
const HOST='https://gc500-production.up.railway.app',VIEW='Coates-GC500-2026';
const same=require('node:util').isDeepStrictEqual;
const diffDocs=(before,after)=>{const changed=[];for(const c of new Set([...Object.keys(before),...Object.keys(after)]))for(const id of new Set([...Object.keys(before[c]||{}),...Object.keys(after[c]||{})]))if(!same((before[c]||{})[id]??null,(after[c]||{})[id]??null))changed.push(c+'/'+id);return changed.sort();};
async function openCandidate(){
  assert(process.env.PAGE,'PAGE must name the candidate HTML');
  let fixtureLevel='view';
  const frozen=process.env.STATE?JSON.parse(fs.readFileSync(process.env.STATE,'utf8')):await(async()=>{
    const r=await fetch(HOST+'/api/state',{'x-gc500-token':VIEW},'GET');
    assert.equal(r.status,200,'Record snapshot GET must succeed');return JSON.parse(r.body);
  })();
  assert(frozen.docs&&Number.isSafeInteger(frozen.version),'Complete native snapshot required');
  fetcher.curlFetch=async(url,headers,method,body)=>{
    const u=new URL(url);
    assert(method==='GET'||(method==='POST'&&u.origin==='https://tile.googleapis.com'&&u.pathname==='/v1/createSession'),'Tests cannot send operational record writes');
    if(u.origin===HOST&&['/api/state','/api/version'].includes(u.pathname))return{status:200,headers:{'content-type':'application/json','cache-control':'no-store'},body:Buffer.from(JSON.stringify(u.pathname==='/api/state'?frozen:{version:frozen.version,updated:frozen.updated,level:fixtureLevel}))};
    return fetch(url,headers,method,body);
  };
  const h=new Module(hp,module);h.filename=hp;h.paths=Module._nodeModulePaths(path.dirname(hp));
  let code=fs.readFileSync(hp,'utf8');
  const guard="const okPost = r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession');";
  assert(code.includes(guard),'Shared harness write guard changed; review required');
  // Preserve the native narrow Google basemap-session exception.
  code=code.replace("counts.blocked++; return route.abort();","counts.blocked++;(counts.blockedRequests||(counts.blockedRequests=[])).push({method:r.method(),origin:new URL(u).origin,path:new URL(u).pathname.replace(/\\/(e|edit)\\/[^/]+/g,'/$1/[redacted]')});return route.abort();");
  const contextOptions="{locale: 'en-AU', timezoneId: 'Australia/Brisbane'}";
  assert(code.includes(contextOptions),'Shared browser context settings changed; review required');
  code=code.replace(contextOptions,"{locale: 'en-AU', timezoneId: 'Australia/Brisbane', serviceWorkers: 'block'}");
  const errorInit='const page = await ctx.newPage(); const errors = [];';
  const returnSession='return {browser, page, errors, counts};';
  assert(code.includes(errorInit)&&code.includes(returnSession),'Shared harness error capture changed; review required');
  code=code.replace(errorInit,errorInit+" const consoleErrors=[];page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text().slice(0,300));});").replace(returnSession,'return {browser, page, errors, consoleErrors, counts};');
  h._compile(code,hp);
  const mobile=process.env.MOB==='1';
  const imageProbe=()=>{window.__svgLoaded=new WeakSet();const seen=new WeakSet();const hook=n=>{if(!(n instanceof SVGImageElement)||seen.has(n))return;seen.add(n);n.addEventListener('load',()=>window.__svgLoaded.add(n));};new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes){hook(n);if(n.querySelectorAll)n.querySelectorAll('image').forEach(hook);}}).observe(document,{subtree:true,childList:true});};
  const s=await h.exports.open({pageFile:process.env.PAGE,hash:process.env.INITIAL_HASH||'#costs',W:mobile?390:1440,H:mobile?844:1000,mobile,dpr:mobile?2:1,gl:true,init:process.env.MAP_NATIVE_LOAD_PROBE?'('+imageProbe.toString()+')();':''});
  try{
    await s.page.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
    const observed=await s.page.evaluate(()=>({docs:JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(SYNC_COLLS).map(k=>[k,toDocs(k)])))),version:SYNC.backend.readVersion821(),inflight:Object.keys(SYNC.inflight||{}).length,queuedDocuments:Object.values(SYNC.queue||{}).reduce((n,q)=>n+Object.keys(q).length,0)}));
    const differences=diffDocs(frozen.docs,observed.docs);
    assert.equal(differences.length,0,'Loaded record differs from pinned snapshot at '+differences.slice(0,8).join(', '));
    assert.equal(Number(observed.version),frozen.version,'Loaded native record version must equal the pinned snapshot');
    assert.equal(observed.inflight,0,'Pinned record must have no inflight writes');
    s.baseline={serviceWorkers:'block',version:frozen.version,docsMatch:true,inflight:observed.inflight,queuedDocuments:observed.queuedDocuments,
      stateSha256:crypto.createHash('sha256').update(process.env.STATE?fs.readFileSync(process.env.STATE):JSON.stringify(frozen)).digest('hex'),
      pageSha256:crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex')};
    s.setFixtureLevel=level=>{assert(['view','edit'].includes(level),'Unexpected test fixture role');fixtureLevel=level;};
    return s;
  }catch(error){await s.browser.close();throw error;}
}
module.exports={openCandidate};
