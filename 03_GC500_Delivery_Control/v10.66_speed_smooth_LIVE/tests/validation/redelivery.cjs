/* Author: Andrew Fisher. Short read-only diagnosis of same-record redelivery, preserving every value and array order. */
'use strict';
const C=require('./common.cjs');const [pageFile,outFile]=process.argv.slice(2);if(!pageFile||!outFile)throw new Error('Usage: node redelivery.cjs page.html private-output.json');
(async()=>{const s=await C.launch({pageFile}),p=s.page,out={author:'Andrew Fisher',pageSha256:C.sha(C.fs.readFileSync(pageFile)),clock:C.CLOCK_ISO};
 try{await C.ready(s);await p.evaluate(()=>go('timeline'));await C.settled(p,2000);
  const before=await p.evaluate(()=>JSON.stringify(S));out.versionBefore=await p.evaluate(()=>SYNC.db.readVersion821());out.initialMerge=await C.mergeReport(p);
  await p.evaluate(()=>SYNC.backend.redeliver());await C.settled(p,2000);
  const after=await p.evaluate(()=>JSON.stringify(S));out.versionAfter=await p.evaluate(()=>SYNC.db.readVersion821());
  out.serializedUnchanged=before===after;out.changes=C.recordDelta(JSON.parse(before),JSON.parse(after));out.unchanged=!out.changes.length;
  await p.evaluate(()=>SYNC.backend.redeliver());await C.settled(p,1500);const twice=await p.evaluate(()=>JSON.stringify(S));out.secondChanges=C.recordDelta(JSON.parse(after),JSON.parse(twice));out.secondStable=!out.secondChanges.length;
  out.finalMerge=await C.mergeReport(p);out.health=C.errorsOf(s);C.assertClean(s);out.pass=out.unchanged&&out.secondStable&&out.finalMerge.complete&&out.versionBefore===out.versionAfter;if(!out.pass)process.exitCode=1;
 }catch(error){out.pass=false;out.error=String(error.stack||error);out.health=C.errorsOf(s);process.exitCode=1;}
 finally{C.writePrivate(outFile,out);await s.browser.close();}
 console.log(JSON.stringify({pass:out.pass,serializedUnchanged:out.serializedUnchanged,changedPaths:out.changes?.length,changedCollections:[...new Set((out.changes||[]).map(x=>x.path[0]))],secondStable:out.secondStable,error:out.error?.split('\n')[0]}));
})();
