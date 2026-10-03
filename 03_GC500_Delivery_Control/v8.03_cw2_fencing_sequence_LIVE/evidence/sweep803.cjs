/* Author: Andrew Fisher. Run the unchanged shared sweep, recording its read-only
 * network guard counters and exact local candidate on browser shutdown.
 * PAGE=/absolute/build.html MOB=1 node sweep803.cjs > sweep803_phone.log
 */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const helper=require('../../toolchain/harness/open_page'),open=helper.open;
const hash=()=>crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex');
const before=hash(),device=process.env.MOB?'phone':'desktop';
helper.open=async options=>{
 const s=await open(options),close=s.browser.close.bind(s.browser);
 s.browser.close=async(...args)=>{
  await close(...args);
  const after=hash(),result={author:'Andrew Fisher',device,candidateSha256:before,candidateUnchanged:before===after,requests:{...s.counts},pageErrors:s.errors};
  fs.writeFileSync(path.join(__dirname,'sweep803_'+device+'_network.json'),JSON.stringify(result,null,2)+'\n');
  if(before!==after||s.counts.blocked||s.errors.length)process.exitCode=1;
 };
 return s;
};
require('../../toolchain/harness/sweep');
