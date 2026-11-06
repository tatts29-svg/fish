/* Author: Andrew Fisher. Summarise three alternating A/B pairs without concealing unmet targets. */
'use strict';
const fs=require('fs');const inputs=process.argv.slice(2);if(!inputs.length)throw new Error('Usage: node performance_summary.cjs base1.json candidate1.json base2.json candidate2.json base3.json candidate3.json');
if(inputs.length!==6)throw new Error('Exactly three A/B pairs are required');
const pairs=inputs.map(f=>JSON.parse(fs.readFileSync(f)));const base=pairs.filter((_,i)=>i%2===0),candidate=pairs.filter((_,i)=>i%2===1);
const median=x=>{x=x.slice().sort((a,b)=>a-b);return x[Math.floor(x.length/2)]},summarise=runs=>({
 usableMs:median(runs.map(r=>r.load.usableMs)),loadCls:median(runs.map(r=>r.load.cls)),postUsableMaxLongTaskMs:median(runs.map(r=>r.load.postUsableMaxLongTaskMs)),
 tabs:runs[0].tabs.map((t,i)=>({tab:t.tab,completedMs:median(runs.map(r=>r.tabs[i].completedMs)),feedbackFrameOpportunityMs:median(runs.map(r=>r.tabs[i].feedbackFrameOpportunityMs)),cls:median(runs.map(r=>r.tabs[i].cls))})),
 idle:runs[0].idle.map((t,i)=>({tab:t.tab,busyPercent:median(runs.map(r=>r.idle[i].busyPercent))}))
});
const A=summarise(base),B=summarise(candidate),mobile=candidate[0].mobile;
const validity=pairs.every(r=>r.pass&&Number.isFinite(r.load.usableMs)&&r.load.usableMs>0&&r.tabs.every(t=>t.correct)&&r.mobile===mobile&&r.mode===pairs[0].mode&&r.cpu===pairs[0].cpu)&&new Set(base.map(r=>r.pageSha256)).size===1&&new Set(candidate.map(r=>r.pageSha256)).size===1;
const loadComparable=pairs.every(r=>r.load.route==='today');
const targets={usable:B.usableMs<(mobile?8000:2000),postUsableLongTask:B.postUsableMaxLongTaskMs<=250,loadCls:B.loadCls<0.02,tabs:B.tabs.map(t=>({tab:t.tab,feedback:t.feedbackFrameOpportunityMs<=100,completed:t.completedMs<=500,cls:t.cls<0.02})),idle:B.idle.map(t=>({tab:t.tab,underTwoPercent:t.busyPercent<2}))};
console.log(JSON.stringify({author:'Andrew Fisher',measurementValid:validity,loadComparable,mobile,cpu:pairs[0].cpu,mode:pairs[0].mode,baseSha256:base[0].pageSha256,candidateSha256:candidate[0].pageSha256,base:A,candidate:B,targets,notes:['Feedback is a requestAnimationFrame opportunity, not independently observed pixels.','Targets describe measured medians; they are not implied by measurementValid.','A baseline that cold-loads the wrong tab is not a like-for-like load comparison; its route failure remains evidence.','TaskDuration idle metrics cover the top-level page main thread, not total device/GPU/frame CPU.']},null,2));
if(!validity)process.exitCode=1;
