// Author: Andrew Fisher. Exact source binding to the independently reviewed final v7.98.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const root=path.resolve(__dirname,'../..'),candidate=fs.readFileSync(process.env.PAGE,'utf8');
const reviewed=fs.readFileSync('/workspace/private-v798-review/reviewed_798_9a52ec22.html','utf8');
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
assert.strictEqual(sha(candidate),process.env.CANDIDATE_SHA256);
assert.strictEqual(sha(reviewed),'9a52ec22c794a514d44936ef84335b62a6876c2664fa54f211a35f1315666d95');
function take(s,a,b){const i=s.indexOf(a),j=s.indexOf(b,i);assert(i>=0&&j>i,a);return s.slice(i,j);}
const scopes=[
 ['drawer helpers and delivery note','function drawerSync798Word(){','function precisionTags(a){'],
 ['initial drawer badge','function precisionTags(a){','/* ------------------------------------------------------------------ the delivery card'],
 ['status refresh hook','function syncFooter(){','/* ------------------------------------------------------------------ the record strip'],
 ['toolbar height after width fit','function dpZoomFit(){','/* v7.82 - a short check'],
 ['driver and installer delivery note hook','function dpPage(d, g, doc, i, n){','/* ---------- cutting the pictures'],
 ['print rebuild scale reset','function dpPrint(iso, doc, o){','function dpBarSay('],
 ['toolbar status, close and initial setup','function dpBarSay(','function dayPrint('],
 ['font preflight','function printPages(','function printAsk(']
];
const checks=scopes.map(([name,a,b])=>{const before=take(reviewed,a,b),after=take(candidate,a,b);assert.strictEqual(after,before,name);return{name,sha256:sha(after),identical:true};});
for(const text of ['body.dpbar-on{padding-top:var(--dpbar-height798,64px)}',"document.querySelector('#drawer.on .ptag.sync b')","'#drv782 .box{"]){assert(reviewed.includes(text)&&candidate.includes(text),text);checks.push({name:text,identical:true});}
const print=JSON.parse(fs.readFileSync(path.join(root,'v7.98_control_state_reliability_DRAFT/evidence/print_notes_browser_results.json')));
assert.strictEqual(print.candidateSha256,sha(reviewed));
assert(print.runs.length===2&&print.runs.every(r=>r.checks.length===31&&r.checks.every(c=>c.pass)));
const result={author:'Andrew Fisher',candidateSha256:sha(candidate),reviewed798Sha256:sha(reviewed),checks,allSourcesIdentical:true,priorPrintChecks:print.runs.map(r=>({mode:r.mode,passed:r.checks.length})),scope:'The corrected final 798 status, font, note hook, preview scale and toolbar sources are byte-identical. Full final801 standing and actual-drawer tests run separately. Booking changes to print load composition receive their own final browser checks; this binding does not substitute for those.',liveWrites:0};
fs.writeFileSync(path.join(__dirname,'review801_control_binding.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({candidateSha256:sha(candidate),sourceChecks:checks.length,identical:true}));
