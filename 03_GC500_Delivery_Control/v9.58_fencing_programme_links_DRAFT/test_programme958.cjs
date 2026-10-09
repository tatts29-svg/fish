// Author: Andrew Fisher. Native source guards and isolated forecast invariants.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(process.env.PAGE,'utf8'),base=fs.readFileSync(process.env.BASE_PAGE,'utf8');
const snap=JSON.parse(fs.readFileSync(process.env.SNAPSHOT,'utf8')),native=JSON.parse(fs.readFileSync(process.env.NATIVE_SNAPSHOT,'utf8'));
const clone=x=>JSON.parse(JSON.stringify(x));
function section(s,a,b){const i=s.indexOf(a),j=s.indexOf(b,i+a.length);assert(i>=0&&j>i);return s.slice(i,j);}
function data(s){return JSON.parse(s.slice(s.indexOf('const DATA = ')+13).split('\n')[0].trim().replace(/;$/,''));}
const DATA=data(html);DATA.fencing.week_sheets=DATA.fencing.week_sheets.map(p=>snap.programmes.find(q=>q.sheet===p.sheet)||p);
const ctx=vm.createContext({DATA,FCOL:clone(snap.cols),FENCE:DATA.fence,allDockets:()=>native.dockets,photoIndex:()=>({state:'ready',files}),fmtQty:(v,u)=>`${v} ${u}`,esc:String,photoFor:({id})=>({state:'ready',url:'https://example.test/'+encodeURIComponent(id)})});
vm.runInContext(section(html,'const FENCE_PROGRAMME958 =','function fenceByWeekBefore958(')+'\nglobalThis.catalogue958=FENCE_PROGRAMME958;',ctx);
const cat=ctx.catalogue958,files=Object.fromEntries(cat.sources.map(s=>[s.id,{sha256:s.sha256}]));
vm.runInContext(section(html,'function progSheet(week)','/* what the plan says up'),ctx);
vm.runInContext(section(html,'function fenceByWeekBefore958(dockets)','function fenceByArea(dockets)'),ctx);
const checkLog=[];function check(name,fn){fn();checkLog.push(name);}
const records=clone(native.dockets),options=()=>({files:clone(files),sheets:clone(DATA.fencing.week_sheets),catalogue:clone(cat),weeks:clone(DATA.weeks),week_map:clone(DATA.fence.week_map)});
const get=(rows,no)=>rows.find(r=>r.row.docket_no===no);
const reviews=()=>ctx.fenceProgrammeReviews958(records,options());
check('all eight exact native task associations have current evidence',()=>{assert.equal(reviews().length,8);assert(reviews().every(r=>r.state==='matched'));});
check('only two associations change forecast attribution',()=>assert.equal(reviews().filter(r=>r.attribution).length,2));
for(const row of cat.rows){
 const no=row.docket_no;
 for(const field of Object.keys(row.expected))check(no+' rejects changed '+field,()=>{
  const altered=clone(records),r=altered.find(d=>d.id===row.record_id);r[field]=typeof r[field]==='object'?{...r[field],changed:1}:String(r[field])+' changed';
  assert.equal(get(ctx.fenceProgrammeReviews958(altered,options()),no).state,'review');
 });
 for(const field of ['scope','usable'])check(no+' rejects unapproved '+field,()=>{const altered=clone(records);altered.find(d=>d.id===row.record_id)[field]=field==='usable'?false:'compound';assert.equal(get(ctx.fenceProgrammeReviews958(altered,options()),no).state,'review');});
 for(const mode of ['missing','duplicate id','duplicate number'])check(no+' rejects '+mode+' docket',()=>{
  const r=records.find(d=>d.id===row.record_id),altered=mode==='missing'?records.filter(d=>d!==r):records.concat({...clone(r),id:mode==='duplicate number'?'duplicate':r.id,docket_no:mode==='duplicate id'?'other':r.docket_no});
  assert.equal(get(ctx.fenceProgrammeReviews958(altered,options()),no).state,'review');
 });
 for(const id of row.source_ids)for(const mode of ['missing','changed'])check(no+' rejects '+mode+' source '+id,()=>{const o=options();if(mode==='missing')delete o.files[id];else o.files[id].sha256='0'.repeat(64);assert.equal(get(ctx.fenceProgrammeReviews958(records,o),no).state,'review');});
 for(const mode of ['missing','changed','duplicate'])check(no+' rejects '+mode+' programme row',()=>{const o=options(),p=o.sheets.find(p=>p.sheet===row.programme.sheet),r=p.programme_rows951.find(r=>r.source_row===row.programme.row);if(mode==='missing')p.programme_rows951=p.programme_rows951.filter(t=>t!==r);else if(mode==='changed')r.description+=' changed';else p.programme_rows951.push(clone(r));assert.equal(get(ctx.fenceProgrammeReviews958(records,o),no).state,'review');});
}
for(const row of cat.rows.filter(r=>r.attribution)){
 for(const mode of ['missing','duplicate','quantity','total','revision','hash','date'])check(row.docket_no+' rejects target '+mode,()=>{const o=options(),p=o.sheets.find(p=>p.sheet===row.programme.sheet),u=p.plan_update,day=u.rows_by_day.find(d=>d.rows.some(t=>t.id===row.attribution.target_id)),r=day.rows.find(t=>t.id===row.attribution.target_id);if(mode==='missing')day.rows=day.rows.filter(t=>t!==r);else if(mode==='duplicate')day.rows.push(clone(r));else if(mode==='quantity')r.fields.changed=1;else if(mode==='total')p.totals.changed=1;else if(mode==='revision')u.revision='changed';else if(mode==='hash')u.sha256='0'.repeat(64);else r.date='2026-10-16';assert.equal(get(ctx.fenceProgrammeReviews958(records,o),row.docket_no).state,'review');});
}
check('unavailable source index withholds all links and credits',()=>assert(ctx.fenceProgrammeReviews958(records,{...options(),files:null}).every(r=>r.state==='review'&&!r.attribution)));
check('duplicate catalogue records and target claims fail closed',()=>{const o=options();o.catalogue.rows.push(clone(cat.rows.find(r=>r.docket_no==='36588')));assert(get(ctx.fenceProgrammeReviews958(records,o),'36588').state==='review');const p=options(),r=p.catalogue.rows.find(r=>r.docket_no==='36592');r.attribution.target_id='cw1-programme-56';assert(get(ctx.fenceProgrammeReviews958(records,p),'36588').state==='review');});
for(const week of ['Week 1','Week 2'])for(const mode of ['missing','duplicate','changed'])check(week+' rejects '+mode+' native programme mapping',()=>{const o=options(),r=o.week_map.find(w=>w.week_2026===week);if(mode==='missing')o.week_map=o.week_map.filter(w=>w!==r);else if(mode==='duplicate')o.week_map.push(clone(r));else r.programme_sheet='CON WK3';const reviews=ctx.fenceProgrammeReviews958(records,o);assert.equal(get(reviews,'36588').state,'review');assert.equal(get(reviews,'36592').state,'review');});
const prior=clone(ctx.fenceByWeekBefore958(records)),after=clone(ctx.fenceByWeek(records));
const line=(rows,week,key)=>rows.find(w=>w.week===week).lines.find(l=>l.column===key);
check('full source quantities removed and capped target quantities applied',()=>{assert.equal(line(after,'Week 2','clean').forecastMovedOut,227.5);assert.equal(line(after,'Week 2','scrim').forecastMovedOut,95);assert.equal(line(after,'Week 1','clean').forecastMovedIn,217.5);assert.equal(line(after,'Week 1','scrim').forecastMovedIn,85);assert.equal(line(after,'Week 1','clean').remaining,2959.5);assert.equal(line(after,'Week 1','scrim').remaining,620);assert.equal(line(after,'Week 2','clean').remaining,-729.5);assert.equal(line(after,'Week 2','scrim').remaining,-76.5);});
check('Monster remainder and Club excess stay distinct, with no gate inference',()=>{const r=reviews();assert.deepEqual(clone(get(r,'36592').attribution.remaining),{clean:2.5,v_gates:1});assert.deepEqual(clone(get(r,'36588').attribution.variance),{clean:10,scrim:10});assert.equal(line(after,'Week 1','v_gates').remaining,line(prior,'Week 1','v_gates').remaining);assert.equal(get(r,'36587').attribution,null);});
check('every actual work and money field stays byte-equivalent',()=>{for(let i=0;i<prior.length;i++){const a=after[i],b=prior[i];for(const k of Object.keys(b).filter(k=>k!=='lines'))assert.deepEqual(a[k],b[k],k);for(let j=0;j<b.lines.length;j++){for(const k of Object.keys(b.lines[j]).filter(k=>k!=='remaining'))assert.deepEqual(a.lines[j][k],b.lines[j][k],k);assert(a.lines[j].offPlan>=0);}}});
check('remaining always equals planned minus forecast credit; unmatched columns unchanged',()=>{for(const w of after)for(const l of w.lines){assert.equal(l.remaining,l.planned==null?null:Math.round((l.planned-l.forecastOnPlan)*100)/100);if(!l.forecastMovedIn&&!l.forecastMovedOut)assert.deepEqual(l.remaining,line(prior,w.week,l.column).remaining);}});
check('failed guard removes both source and target adjustment together',()=>{const o=options();delete o.files['36588.jpg'];const r=ctx.fenceProgrammeReviews958(records,o),w=ctx.fenceProgrammeAdjust958(prior,r);assert.equal(line(w,'Week 2','clean').forecastMovedOut,132.5);assert.equal(line(w,'Week 2','scrim').forecastMovedOut,0);assert.equal(line(w,'Week 1','clean').forecastMovedIn,132.5);assert.equal(line(w,'Week 1','scrim').forecastMovedIn,0);});
check('input records, programme totals, state and actual calculations are not mutated',()=>{assert.deepEqual(records,native.dockets);assert.deepEqual(clone(DATA.fencing.week_sheets).filter(p=>snap.programmes.some(q=>q.sheet===p.sheet)),snap.programmes);assert.deepEqual(data(html),data(base));for(const[a,b]of[['function costDocket(d)','function docketProblems(d)'],['function fenceRateFor(key)','/* v5.80'],['function fenceCostFor(key)','/* One reading']])assert.equal(section(html,a,b),section(base,a,b));});
check('existing details and task rows expose source cells and scoped remaining basis',()=>{const d=records.find(d=>d.docket_no==='36592'),detail=ctx.fenceProgrammeDetail958(d);assert(detail.includes('F51')&&detail.includes('J51')&&detail.includes('2.5 m Clean'));assert(ctx.fenceProgrammeWeekBasis958(after.find(w=>w.week==='Week 1')).includes('Still to do uses'));assert(ctx.fenceProgrammeTask958({id:'cw1-programme-56'}).includes('10 m Clean, 10 m Scrim'));});
check('all inline scripts parse',()=>{for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))if(match[1].trim())new vm.Script(match[1]);});
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks:checkLog.length,details:checkLog,adjustments:{clean:217.5,scrim:85}},null,2));
