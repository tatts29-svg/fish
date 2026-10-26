/* Author: Andrew Fisher. Read-only candidate test harness; all HTTP writes denied.
 * Native setters may be rehearsed in page memory with their sender held.
 * The snapshot is frozen for one run so polling cannot change the fixture.
 */
'use strict';
const fs=require('fs'),path=require('path'),Module=require('module'),assert=require('node:assert/strict');
const H=path.resolve(__dirname,'../../toolchain/harness');
const hp=path.join(H,'open_page.js'),fetcher=require(path.join(H,'curlfetch')),fetch=fetcher.curlFetch;
const HOST='https://gc500-production.up.railway.app',VIEW='Coates-GC500-2026';
async function openCandidate(){
  assert(process.env.PAGE,'PAGE must name the candidate HTML');
  const frozen=process.env.STATE?JSON.parse(fs.readFileSync(process.env.STATE,'utf8')):await(async()=>{
    const r=await fetch(HOST+'/api/state',{'x-gc500-token':VIEW},'GET');
    assert.equal(r.status,200,'Record snapshot GET must succeed');return JSON.parse(r.body);
  })();
  assert(frozen.docs&&Number.isSafeInteger(frozen.version),'Complete native snapshot required');
  fetcher.curlFetch=async(url,headers,method,body)=>{
    assert.equal(method,'GET','Tests cannot send HTTP writes');
    const u=new URL(url);
    if(u.origin===HOST&&['/api/state','/api/version'].includes(u.pathname))return{status:200,headers:{'content-type':'application/json','cache-control':'no-store'},body:Buffer.from(JSON.stringify(u.pathname==='/api/state'?frozen:{version:frozen.version,updated:frozen.updated,level:'view'}))};
    return fetch(url,headers,method,body);
  };
  const h=new Module(hp,module);h.filename=hp;h.paths=Module._nodeModulePaths(path.dirname(hp));
  let code=fs.readFileSync(hp,'utf8');
  const guard="const okPost = r.method() === 'POST' && u.startsWith('https://tile.googleapis.com/v1/createSession');";
  assert(code.includes(guard),'Shared harness write guard changed; review required');
  code=code.replace(guard,'const okPost = false;');h._compile(code,hp);
  const mobile=process.env.MOB==='1';
  const s=await h.exports.open({pageFile:process.env.PAGE,hash:process.env.HASH||'#costs',W:mobile?390:1440,H:mobile?844:1000,mobile});
  try{await s.page.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});return s;}catch(error){await s.browser.close();throw error;}
}
module.exports={openCandidate};
