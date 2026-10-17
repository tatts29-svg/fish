// Author: Andrew Fisher. Isolated source execution only: no browser, network or operational writes.
// node source_cpu_checks.cjs <candidate.html> <base.html>
const fs=require('fs'), vm=require('vm'), crypto=require('crypto');
const page=fs.readFileSync(process.argv[2],'utf8'), base=fs.readFileSync(process.argv[3],'utf8');
const result=[]; function ok(name,pass,detail){result.push({name,pass:!!pass,detail});console.log((pass?'PASS ':'FAIL ')+name+(detail?' '+JSON.stringify(detail):''));}
function span(s,a,b){const i=s.indexOf(a),j=s.indexOf(b,i);if(i<0||j<0)throw Error('Missing source marker: '+a);return s.slice(i,j);}
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
console.log(JSON.stringify({author:'Andrew Fisher',candidate_sha256:sha(page),base_sha256:sha(base)}));
ok('DATA is byte preserved',page.match(/^const DATA = .*$/m)[0]===base.match(/^const DATA = .*$/m)[0]);
for(const [a,b] of [
 ['function attention(){','/* ------------------------------------------------------------------ the programme rail'],
 ['function exportRecord(){','let EXPORT_SEQ'],
 ['let EXPORT_SEQ','$(\'#importBtn\').onclick'],
 ['function programmeDays(){','function loadOf(l){'],
 ['function programmeDaysBefore801(){','/* v5.53 — EVERY DAY'],
 ['function unrefBlock(d, full){','function cancelledBlock('],
 ['function pack795(){','/* By branch, Money'],
 ["window.addEventListener('beforeprint', () => { /* registered before v7.95's",'function jump799(n){']]) {
  if(base.includes(b))ok('Existing path preserved: '+a,page.includes(span(base,a,b))); 
}
const tabs=span(page,'function renderTabs(){','/* v6.69 - THE REGISTER');
const badge=span(page,'function exportBadge814(n){','/* ================================================================== v6.78');
let count=5, html='';const classes=new Set();
const button={title:'',classList:{toggle(k,on){on?classes.add(k):classes.delete(k);}},get textContent(){return html.replace(/<[^>]*>/g,'');},set textContent(v){html=v;},get innerHTML(){return html;},set innerHTML(v){html=v;}};
const tabNode={innerHTML:'',onclick:null,onkeydown:null};
const sandbox={attention:()=>({export:count}),document:{getElementById:id=>id==='exportBtn'?button:null},$:s=>s==='#exportBtn'?button:s==='#tabs'?tabNode:null,TABS:[],TABS_OFF:new Set(),tabPrimary:()=>[],state:{tab:'today'}};
vm.createContext(sandbox);vm.runInContext(badge+'\n'+tabs,sandbox);
for(const n of [5,1,0,2]){count=n;vm.runInContext('renderTabs()',sandbox);ok('Export label follows '+n+' unexported changes',button.textContent===(n?'Export · '+n+' new':'Export'),{text:button.textContent,title:button.title,red:classes.has('due814')});ok('Export warning class follows '+n+' unexported changes',classes.has('due814')===!!n);}
const setup=span(page,'function renderToday_held(){',' const t = lightTally').replace('function renderToday_held(){','');
const start=page.indexOf(' ${dayNow ? `<div class="card hubcard"');const end=page.indexOf(' ${(() => { const v = adviceFor(today)',start);if(start<0||end<0)throw Error('Missing Due today source');
const card=page.slice(start,end);
const iso=span(page,'function isoIn(when){',"/* today's date on the Gold Coast");
const dates=[{stamp:'2026-10-02T13:59:59Z',want:'2026-10-02',show:true},{stamp:'2026-10-02T14:00:00Z',want:'2026-10-03',show:false},{stamp:'2026-10-06T14:00:00Z',want:'2026-10-07',show:true},{stamp:'2026-10-26T14:00:00Z',want:'2026-10-27',show:true},{stamp:'2026-10-27T14:00:00Z',want:'2026-10-28',show:false}];
for(const c of dates){
const d={EVENT_TZ:'Australia/Brisbane',ISO_FMT:null,Date,Intl,stamp:c.stamp,programmeDays:()=>['2026-10-02','2026-10-07','2026-10-27'].map(iso=>({iso,deliveries:[],removals:[],loads:[],notes:[],unref:[]})),esc:x=>String(x),fmtDate:x=>x,rows:[],line:()=>''};vm.createContext(d);
vm.runInContext(iso+'\nconst todayIso=()=>isoIn(stamp);'+setup+'\nglobalThis.day=today;globalThis.html=`'+card+'`;',d);
ok('Brisbane day at '+c.stamp,d.day===c.want,{day:d.day});ok('Due today gate at '+c.want,!!d.html.trim()===c.show,{rendered:!!d.html.trim()});if(c.show)ok('Due today link targets '+c.want,d.html.includes('data-day="'+c.want+'"'));
}
ok('No print-media widening is added',page.includes('@media screen and (min-width:900px){#pane-today .mas95 > .advicecard{grid-column:span 2}}'));
console.log(JSON.stringify({passed:result.filter(x=>x.pass).length,total:result.length,failures:result.filter(x=>!x.pass)},null,2));
process.exitCode=result.every(x=>x.pass)?0:1;
