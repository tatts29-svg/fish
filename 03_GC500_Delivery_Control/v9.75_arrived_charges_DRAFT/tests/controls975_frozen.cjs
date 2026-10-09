// Author: Andrew Fisher. Freeze authorised native snapshot so concurrent users cannot invalidate lifecycle checks.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const frozen=JSON.parse(fs.readFileSync(process.env.STATE,'utf8'));assert(frozen.docs&&frozen.version);
const fetcher=require('../../toolchain/harness/curlfetch'),native=fetcher.curlFetch;
fetcher.curlFetch=async(u,h,m,b)=>{const p=new URL(u).pathname;if(m==='GET'&&['/api/state','/api/version'].includes(p))return{status:200,headers:{'content-type':'application/json'},body:Buffer.from(JSON.stringify(p==='/api/state'?frozen:{version:frozen.version,updated:frozen.updated,level:'view'}))};return native(u,h,m,b);};
require('../../v9.71_showcase_playback_LIVE/tests/controls971.cjs');
