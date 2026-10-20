/* Author: Andrew Fisher. Actual public read-back; no local page or API substitution. */
'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
if(process.env.PAGE)throw Error('PAGE substitution is forbidden for the public read-back');
if(process.env.EXPECT_PIN_FIX==='1')throw Error('Synthetic source changes belong to the local candidate test');
const expected=process.env.GC500_EXPECTED_PAGE_SHA;
assert.match(expected||'',/^[a-f0-9]{64}$/,'Exact expected release hash required');
const transport=require('../toolchain/harness/curlfetch'),original=transport.curlFetch;
let publicReads=0;
transport.curlFetch=async function(url,headers,method,body){
 const u=new URL(url),main=u.origin==='https://gc500-production.up.railway.app'&&/^\/v\/Coates-GC500-2026\/?$/.test(u.pathname);
 const response=await original(url,main?{...headers,'cache-control':'no-cache'}:headers,method,body);
 if(main&&method==='GET'){
  assert.equal(response.status,200,'Public page is available');
  const hash=crypto.createHash('sha256').update(response.body).digest('hex');
  assert.equal(hash,expected,'Actual public response matches the released bytes');
  process.env.GC500_VERIFIED_PUBLIC_SHA=hash;publicReads++;
 }
 return response;
};
process.on('beforeExit',()=>{if(!publicReads){console.error('No verified public-page response was loaded');process.exitCode=1;}});
require('./test_interactions1095.cjs');
