/* Author: Andrew Fisher. C004 invoice categories matched to responsible 2026 contract branches. */
function scopeBranchAllocation978(){
 const F=scopeFigures();if(!F)return [];
 const roles={pm:'KINP',gentech:'NVAC',fence:'STPS',toilets:'KINP',vms:'STPS',gentech_ent:'NVAC',toilets_ent:'KINP'},weights={};
 for(const l of F.lines||[]){const b=roles[l.key];if(!b)continue;weights[b]=(weights[b]||0)+(l.amount_exact==null?l.amount:l.amount_exact);}
 const people=fh866Split(F.people,weights),out=Object.entries(people).map(([branch,amount])=>({branch,recorded:amount,job:amount,source:'C004 staffing invoice category; responsible 2026 Coates contract branch'}));
 out.push({branch:'KINP',recorded:F.at,job:F.at,source:'C004 row68: half Portable Building Hire3.14; half ToiletHire3.16; bothKINP'});return out;
}

/* Author: Andrew Fisher. Allocation view only; preserves every combined ledger amount. */
(function(root){'use strict';
const cents=v=>Math.round((Number(v)||0)*100)/100,valid=b=>b&&b!=='no branch'&&b!=='the job';
function model(input){
 const rows=new Map(), get=code=>{if(!rows.has(code))rows.set(code,{code,revenue:0,revenueJob:0,cost:0,costJob:0});return rows.get(code);};
 function add(code,key,amount){if(valid(code)){const r=get(code);r[key]=cents(r[key]+amount);}}
 for(const b of input.branches||[]){const t=(input.ticks.byBranch||{})[b.code]||{},off=(b.code===input.toiletBranch?input.servicing:0)+(input.fencingByBranch[b.code]||0),tick=['install','cleaning','fire_ext','other'].reduce((s,k)=>s+(Number((t[k]||{}).amount)||0),0),rev=cents(b.total+off+tick);add(b.code,'revenue',rev);add(b.code,'revenueJob',rev);}
 add(input.fencingBranch,'revenueJob',input.fencingRemaining);
 for(const r of input.costRows||[])if(r.inPl&&valid(r.branch)){add(r.branch,'cost',r.toDate);add(r.branch,'costJob',r.job);}
 for(const r of input.costAllocations||[]){add(r.branch,'cost',r.recorded);add(r.branch,'costJob',r.job);}
 for(const r of input.revenueAllocations||[]){add(r.branch,'revenue',r.recorded);add(r.branch,'revenueJob',r.job);}
 for(const r of input.revenueForecastRows||[])add(r.branch,'revenueJob',r.amount);
 const total={code:'Combined job',revenue:cents(input.total.revenue),revenueJob:cents(input.total.revenueJob),cost:cents(input.total.cost),costJob:cents(input.total.costJob)},shared={code:'Shared job / allocation pending'};
 for(const key of ['revenue','revenueJob','cost','costJob'])shared[key]=cents(total[key]-[...rows.values()].reduce((s,r)=>s+r[key],0));
 const out=[...rows.values()].sort((a,b)=>a.code.localeCompare(b.code));if(Object.values(shared).some(v=>typeof v==='number'&&v!==0))out.push(shared);
 for(const r of [...out,total]){r.contribution=cents(r.revenue-r.cost);r.contributionJob=cents(r.revenueJob-r.costJob);}
 const checks=Object.fromEntries(['revenue','revenueJob','cost','costJob'].map(k=>[k,cents(out.reduce((s,r)=>s+r[k],0))===total[k]]));return {rows:out,total,checks};
}
const api={model};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root)root.Branch978=api;
})(typeof window!=='undefined'?window:null);
/* Keep the existing detailed branch working available under More info. */
if(typeof window!=='undefined'&&typeof pl760BranchTable==='function'){
 const detailBranch978=pl760BranchTable;
 function branchFinancial978(B,M){
  const P=pl770Model(),X=cj764Model(),c=M.charge||{},H=legacyFinance978(),T=transport888Core(),LP=labourPlan(),labW={};
  LP.slots.filter(sl=>['install','steps','levelling','demob'].includes(sl.key)&&sl.value!=null&&sl.branch).forEach(sl=>{labW[sl.branch]=((labW[sl.branch]||0)+sl.value);});
  const costAllocations=[];H.costs.forEach(r=>{let weights;if(r.kind==='fencing')weights={[pl760FencingBranch()]:1};else if(r.kind==='toilets')weights={[pl760ToiletBranch()]:1};else if(r.kind==='labour')weights={KINP:1};else if(r.kind==='rehire'){const src=X.rows.find(x=>x.stream.split(' — ')[0]===r.stream&&x.toDate===r.toDate&&x.toCome===r.toCome);weights={[src&&src.branch||'—']:1};}else if(r.kind==='transport')weights=Object.keys(T.weights.toDate).length?T.weights.toDate:labW;else weights=labW;
   const recorded=fh866Split(r.toDate,weights);[...new Set([...Object.keys(recorded),...Object.keys(r.by)])].forEach(branch=>costAllocations.push({branch,recorded:recorded[branch]||0,job:r.by[branch]||0}));});
  const revenueForecastRows=[];LP.slots.filter(sl=>sl.state!=='charged'&&sl.value!=null&&['install','steps','levelling','demob','cleaning'].includes(sl.key)).forEach(sl=>revenueForecastRows.push({branch:sl.branch,amount:sl.value}));
  (X.buildingTransport.rows||[]).filter(r=>r.additional>0).forEach(r=>revenueForecastRows.push({branch:branchOf(r.ref).code,amount:r.additional}));
  return Branch978.model({branches:B,ticks:pl760Ticks(),toiletBranch:pl760ToiletBranch(),servicing:Number(c.servicing)||0,fencingByBranch:pl760FencingByBranch(),fencingBranch:pl760FencingBranch(),fencingRemaining:X.fencing&&X.fencing.revenue,costRows:[],costAllocations,revenueForecastRows,revenueAllocations:scopeBranchAllocation978(),
   total:{revenue:P.revNow,revenueJob:P.revJob,cost:P.costNow+(P.wages.toDate||0),costJob:P.costJob+(P.wages.job||0)}});
 }
 window.branchFinancial978=branchFinancial978;
 pl760BranchTable=function(B,M,RH){
  const m=branchFinancial978(B,M),cell=n=>'<td class="num">'+esc(money(n))+'</td>',row=r=>'<tr'+(r===m.total?' class="tot pl-grand"':'')+'><td><b>'+esc(r.code)+'</b></td>'+[r.revenue,r.cost,r.contribution,r.revenueJob,r.costJob,r.contributionJob].map(cell).join('')+'</tr>';
  const phone=r=>'<article class="card branch978-phone"><h4>'+esc(r.code)+'</h4><div class="branch978-grid"><span></span><b>Current record</b><b>Job forecast</b><span>V8 charges</span><span>'+esc(money(r.revenue))+'</span><span>'+esc(money(r.revenueJob))+'</span><span>Allocated costs</span><span>'+esc(money(r.cost))+'</span><span>'+esc(money(r.costJob))+'</span><span>Provisional contribution</span><b>'+esc(money(r.contribution))+'</b><b>'+esc(money(r.contributionJob))+'</b></div></article>';
  return '<section data-branch978><h4>Branch split · charges to V8 Supercars and Coates costs</h4><div class="branch978-desktop tblwrap"><table class="pl-tbl"><thead><tr><th rowspan="2">Branch</th><th colspan="3">Current record</th><th colspan="3">Job forecast</th></tr><tr><th class="num">Revenue</th><th class="num">Allocated costs</th><th class="num">Provisional contribution</th><th class="num">Revenue</th><th class="num">Allocated costs</th><th class="num">Provisional contribution</th></tr></thead><tbody>'+m.rows.map(row).join('')+row(m.total)+'</tbody></table></div><div class="branch978-mobile">'+[...m.rows,m.total].map(phone).join('')+'</div>'+
  (Object.values(m.checks).every(Boolean)?'<span class="chip ok">Branch split reconciles to combined job</span>':'<div class="notice warn">Branch reconciliation needs review</div>')+
  '<details class="units925-edit"><summary>More info · branch working and allocation</summary><dl><dt>Coates</dt><dd>Hire supplier and coordinator</dd><dt>V8 Supercars</dt><dd>Client</dd><dt>Advanced Fencing</dt><dd>Fencing subcontractor</dd><dt>Subhire</dt><dd>Equipment hired from external suppliers</dd><dt>Third-party transport</dt><dd>External carrier cost to Coates; client transport charges kept separate</dd></dl><p>Costs include overheads and priced wages. Cost allocation follows the Finance model. Event-scope invoice categories are matched to the responsible 2026 contract branch: KINP portables and toilets; NVAC generator support; STPS fencing and VMS. Accommodation and travel remain outside labour. Contribution uses priced costs; unpriced costs remain in the existing cost checks.</p>'+detailBranch978.apply(this,arguments)+'</details></section>';
 };
}

if(typeof window!=='undefined') { const previousCosts978=renderCosts; renderCosts=function(){const out=previousCosts978.apply(this,arguments);const pane=document.getElementById('pane-costs'), branch=pane?.querySelector('[data-branch978]'),pl=pane?.querySelector('#pl770');if(branch&&pl)pl.after(branch);return out;};}

/* The same branch allocation feeds Finance invoice preparation; totals and billed values are retained. */
let legacyFinance978;
if(typeof window!=='undefined'){
 legacyFinance978=fh866Model;
 fh866Model=function(){
  const H=legacyFinance978(),B=branchFinancial978(pl752Rows(),moneySummary()),prior=new Map(H.inv.map(r=>[r.branch,r]));
  const inv=B.rows.map(r=>{const billed=prior.get(r.code)?.billed||0;return {branch:r.code,onRecord:r.revenue,toCome:Math.round((r.revenueJob-r.revenue)*100)/100,job:r.revenueJob,billed,unbilled:Math.round((r.revenue-billed)*100)/100};});
  const r2=n=>Math.round(n*100)/100;
  const sum=k=>r2(inv.reduce((n,r)=>n+r[k],0));
  const invTotal={onRecord:sum('onRecord'),toCome:sum('toCome'),job:sum('job'),billed:sum('billed'),unbilled:sum('unbilled')};
  return {...H,inv,invTotal,transportForecast978:cj764Model().revenue.transportToCome,invCheck:{record:invTotal.onRecord===H.invTotal.onRecord,job:invTotal.job===H.invTotal.job}};
 };
}
