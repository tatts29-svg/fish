/* Author: Andrew Fisher. Exact ordered text comparison; no dropped numeric/cost/progress fields. */
'use strict';
const fs=require('fs'),crypto=require('crypto'); const [aFile,bFile]=process.argv.slice(2);
if(!aFile||!bFile)throw new Error('Usage: node compare.cjs private-base.json private-candidate.json');
const A=JSON.parse(fs.readFileSync(aFile)),B=JSON.parse(fs.readFileSync(bFile));
const norm=x=>String(x??'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const diffs=[],checks=[];
function compare(name,a,b,footer=false){a=norm(a);b=norm(b);if(footer){a=a.replace(/ · v10\.65(?= |$)/g,' · RELEASE');b=b.replace(/ · v10\.66(?= |$)/g,' · RELEASE');}checks.push(name);if(a!==b){let i=0;while(i<a.length&&a[i]===b[i])i++;diffs.push({name,firstDifference:i,baseLength:a.length,candidateLength:b.length,baseSha256:hash(a),candidateSha256:hash(b)});}}
for(const key of ['mobile','clock','version','versionAfter','tabs','dayKeys','drawerKeys'])compare(key,JSON.stringify(A[key]),JSON.stringify(B[key]));
for(const group of ['panes','days','drawers']){
 compare(group+'.keys',JSON.stringify(Object.keys(A[group])),JSON.stringify(Object.keys(B[group])));
 for(const key of Object.keys(A[group]))for(const field of ['visible','full'])compare(group+'.'+key+'.'+field,A[group][key]?.[field],B[group][key]?.[field]);
}
for(const field of ['visible','full']){compare('header.'+field,A.header?.[field],B.header?.[field]);compare('footer.'+field,A.footer?.[field],B.footer?.[field],true);}
for(const capture of [A,B])if(!capture.pass)diffs.push({name:'capture failed',error:capture.error?.split('\n')[0]});
if(B.initial?.tab!=='today'||B.initial?.selected!=='today')diffs.push({name:'initial route',got:B.initial});
console.log(JSON.stringify({author:'Andrew Fisher',pass:!diffs.length,checks:checks.length,baseSha256:A.pageSha256,candidateSha256:B.pageSha256,differences:diffs},null,2));
if(diffs.length)process.exitCode=1;
