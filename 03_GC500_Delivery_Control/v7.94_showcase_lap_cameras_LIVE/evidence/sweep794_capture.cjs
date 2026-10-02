/* Author: Andrew Fisher. Metadata-only preload for the unmodified official navigation sweep. */
'use strict';
const fs=require('fs'),crypto=require('crypto');
const root=require('path').resolve(__dirname,'../..');
const harnessPath=root+'/toolchain/harness/open_page.js',sweepPath=root+'/toolchain/harness/sweep.js';
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const expected=process.env.GC500_SWEEP_EXPECTED_SHA,candidate=process.env.PAGE;
if(!/^[a-f0-9]{64}$/.test(expected||''))throw Error('Set GC500_SWEEP_EXPECTED_SHA to the final candidate hash');
const before=sha(candidate),startedAt=new Date().toISOString();
if(before!==expected)throw Error('Candidate hash differs from final build');
const harness=require(harnessPath),open=harness.open;let counts=null;
harness.open=async function(options){const scene=await open(options);counts=scene.counts;return scene;};
const log=console.log;
console.log=function(first,...rest){
 if(typeof first==='string'){
  let result;try{result=JSON.parse(first);}catch(e){}
  if(result&&result.tabs&&result.hashes){
   const after=sha(candidate);if(after!==before)throw Error('Candidate changed during sweep');
   result.author='Andrew Fisher';result.metadata={candidate,sha256:before,sha256After:after,mode:process.env.MOB?'phone':'desktop',startedAt,finishedAt:new Date().toISOString(),metadataPreloadSha256:sha(__filename),officialSweepSha256:sha(sweepPath),officialHarnessSha256:sha(harnessPath),networkCounts:counts,recordWriteGuard:'Official harness aborts non-GET requests except Google map-session creation; no live record writes permitted.'};
   return log.call(console,JSON.stringify(result));
  }
 }
 return log.call(console,first,...rest);
};
