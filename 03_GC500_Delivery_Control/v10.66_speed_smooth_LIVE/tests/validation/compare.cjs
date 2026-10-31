/* Author: Andrew Fisher. Exact ordered text comparison; no dropped numeric/cost/progress fields. */
'use strict';
const fs=require('fs'),crypto=require('crypto'); const [aFile,bFile,aFocus,bFocus]=process.argv.slice(2);
if(!aFile||!bFile)throw new Error('Usage: node compare.cjs private-base.json private-candidate.json');
const A=JSON.parse(fs.readFileSync(aFile)),B=JSON.parse(fs.readFileSync(bFile));
const focused=[];
if(aFocus||bFocus){
 if(!aFocus||!bFocus)throw new Error('Both focused recaptures are required');
 for(const [capture,file] of [[A,aFocus],[B,bFocus]]){
  const f=JSON.parse(fs.readFileSync(file));
  if(!f.pass||f.method!=='settled-native-screen-report-v1'||f.pageSha256!==capture.pageSha256||f.mobile!==capture.mobile||f.clock!==capture.clock||f.version!==capture.version||f.recordSha256!==capture.fixtureSetup.recordSha256||JSON.stringify(Object.keys(f.panes))!==JSON.stringify(['today','progress']))throw new Error('Focused recapture provenance does not match the full capture');
  capture.panes={...capture.panes,...f.panes};focused.push({pageSha256:f.pageSha256,method:f.method,panes:Object.keys(f.panes)});
 }
}
const norm=x=>String(x??'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const diffs=[],checks=[];
function compare(name,a,b,footer=false){a=norm(a);b=norm(b);if(footer){a=a.replace(/ · v10\.65(?= |Shared record|$)/g,' · RELEASE');b=b.replace(/ · v10\.66(?= |Shared record|$)/g,' · RELEASE');}checks.push(name);if(a!==b){let i=0;while(i<a.length&&a[i]===b[i])i++;diffs.push({name,firstDifference:i,baseLength:a.length,candidateLength:b.length,baseSha256:hash(a),candidateSha256:hash(b)});}}
for(const key of ['mobile','clock','version','versionAfter','tabs','dayKeys','drawerKeys'])compare(key,JSON.stringify(A[key]),JSON.stringify(B[key]));
compare('hydrated fixture record',A.fixtureSetup?.recordSha256,B.fixtureSetup?.recordSha256);
for(const [index,capture] of [A,B].entries())if(!capture.fixtureSetup?.merge?.complete||capture.fixtureSetup?.secondChanges?.length)diffs.push({name:'incomplete or unstable fixture merge',arm:index===0?'baseline':'candidate'});
for(const group of ['panes','days','drawers']){
 compare(group+'.keys',JSON.stringify(Object.keys(A[group])),JSON.stringify(Object.keys(B[group])));
 for(const [index,key] of Object.keys(A[group]).entries())for(const field of ['visible','full'])compare(group+'.'+(group==='panes'?key:'sample'+index)+'.'+field,A[group][key]?.[field],B[group][key]?.[field]);
}
for(const field of ['visible','full']){compare('header.'+field,A.header?.[field],B.header?.[field]);compare('footer.'+field,A.footer?.[field],B.footer?.[field],true);}
for(const [index,capture] of [A,B].entries())if(!capture.pass)diffs.push({name:'capture failed',arm:index===0?'baseline':'candidate',detail:'See private capture for the failure reason'});
if(B.initial?.tab!=='today'||B.initial?.selected!=='today')diffs.push({name:'initial route',tab:B.initial?.tab,selected:B.initial?.selected,hashSha256:hash(B.initial?.hash||'')});
console.log(JSON.stringify({author:'Andrew Fisher',pass:!diffs.length,checks:checks.length,baseSha256:A.pageSha256,candidateSha256:B.pageSha256,focusedRecaptures:focused,differences:diffs},null,2));
if(diffs.length)process.exitCode=1;
