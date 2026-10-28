/* Author: Andrew Fisher. P&L presentation preview; no pricing or record changes. */
(function (W) {
'use strict';
if (W.PL1251Preview || typeof renderCosts!=='function') return;
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const h=s=>esc(String(s==null?'':s));
const dollars=n=>finite(n)?h(money(n)):'<span class="pl1251-unknown">Unpriced</span>';
const name=s=>String(s||'').replace(/\s*[—·]\s*allocation pending/ig,'').trim();
function snapshot(){return holdAssets(()=>{const ledger=pl770Model(),summary=moneySummary(),contractBranches=pl752Rows(),m={ledger,summary,contractBranches,branches:branchFinancial978(contractBranches,summary)};m.matrix=PL1251Branches.model(m);return m;});}
function cell(pair,label,unknownNow=false,unknownJob=false){return '<td class="num pl1251-pair" data-label="'+h(label)+'"><strong data-pl1251-value="now">'+dollars(unknownNow?null:pair.now/100)+'</strong><small data-pl1251-value="job">'+dollars(unknownJob?null:pair.job/100)+'</small></td>';}
function line(row,kind,m){
 const unknown=!finite(row.now)||!finite(row.job),unassigned=!row.code||row.code==='—',r=m.matrix.rows[kind+':'+row.key];
 const allocated=kind==='cost'&&['transport','overheads'].includes(row.key);
 return '<tr data-pl1251-line="'+h(kind+':'+row.key)+'"><td><span class="pl1251-code">'+h(unassigned?'Unassigned':row.code)+'</span><strong>'+h(name(row.line))+'</strong>'+(unknown?'<span class="chip warn">Unpriced</span>':'')+(allocated?'<small class="pl1251-basis">Allocated · existing Finance basis</small>':kind==='cost'&&row.key==='wages'?'<small class="pl1251-basis">Existing KINP labour allocation</small>':'')+'</td>'+m.matrix.codes.map(b=>cell(r.branches[b]||{now:0,job:0},b,!finite(row.now),!finite(row.job))).join('')+cell({now:Math.round(row.now*100),job:Math.round(row.job*100)},'Total',!finite(row.now),!finite(row.job))+'</tr>';
}
function total(label,now,job,key,m){return '<tr class="pl1251-total" data-pl1251-total="'+h(key)+'"><th scope="row">'+h(label)+'</th>'+m.matrix.codes.map(b=>cell(m.matrix.totals[key][b],b)).join('')+cell({now:Math.round(now*100),job:Math.round(job*100)},'Total')+'</tr>';}
function ledgerTable(m){
 const p=m.ledger,b=m.branches.total,group=label=>'<tr class="pl1251-group"><th colspan="'+(m.matrix.codes.length+2)+'">'+label+'</th></tr>';
 return '<div class="pl1251-ledger"><table><thead><tr><th>Business line</th>'+m.matrix.codes.map(b=>'<th class="num">'+h(b)+'</th>').join('')+'<th class="num">Total</th></tr></thead><tbody>'+
 group('Revenue')+p.rev.map(r=>line(r,'revenue',m)).join('')+total('Total revenue',p.revNow,p.revJob,'revenue',m)+
 group('Direct costs <small>Includes estimates</small>')+p.cost.map(r=>line(r,'cost',m)).join('')+total('Direct costs on ledger',p.direct,p.directJob,'direct',m)+
 group('Overheads')+line({key:'overheads',code:'Multiple',line:'Travel, accommodation, meals and printing',now:p.over,job:p.overJob},'cost',m)+total('Costs before wages',p.costNow,p.costJob,'costs-before-wages',m)+
 group('Priced wages')+line({key:'wages',code:'Multiple',line:'Labour hire and salary allowance',now:p.wages.toDate,job:p.wages.job},'cost',m)+
 total('Costs including priced wages',b.cost,b.costJob,'costs',m)+total('Difference after priced costs',b.contribution,b.contributionJob,'difference',m)+'</tbody></table></div>';
}
function branchTable(m){return '<section class="card pl1251-branches" aria-labelledby="pl1251-branches-title"><div class="pl1251-sectionhead"><h3 id="pl1251-branches-title">By branch</h3><span>Current record · includes priced wages</span></div><div class="pl1251-ledger"><table><thead><tr><th>Branch</th><th class="num">Revenue</th><th class="num">Priced costs</th><th class="num">Difference</th></tr></thead><tbody>'+m.branches.rows.map(b=>'<tr data-pl1251-branch="'+h(b.code)+'"><th scope="row">'+h(b.code)+'</th><td class="num" data-label="Revenue">'+dollars(b.revenue)+'</td><td class="num" data-label="Priced costs">'+dollars(b.cost)+'</td><td class="num" data-label="Difference">'+dollars(b.contribution)+'</td></tr>').join('')+'</tbody></table></div></section>';}
function card(m){
 const p=m.ledger,b=m.branches.total;
 const checks=[...Object.values(p.checks||{}),...Object.values(m.branches.checks||{})];
 if(checks.some(v=>v===false))throw Error('Native financial reconciliation failed; original display retained');
 const kpi=(label,value)=>'<div><span>'+h(label)+'</span><strong>'+dollars(value)+'</strong></div>';
 return '<section id="pl1251-preview" class="pl1251-preview" aria-label="P&L presentation preview">'+
 '<div class="pl1251-meta"><span>Coates · GC500</span><span>AUD ex GST · '+h(fmtDate(p.asAt))+'</span><span class="chip">Preview</span></div>'+
 '<div class="pl1251-summary">'+kpi('Recorded revenue',p.revNow)+kpi('Costs before wages',p.costNow)+kpi('Difference before wages',m.summary.difference)+'</div>'+
 '<div class="pl1251-status"><span class="chip">Coates wages · job hours: '+h(finite(p.wages.hoursOnly)?fmtNum(p.wages.hoursOnly):'Unconfirmed')+' h · unpriced</span></div>'+
 '<section class="card pl1251-statement" aria-labelledby="pl1251-ledger-title"><div class="pl1251-sectionhead"><h3 id="pl1251-ledger-title">P&L lines</h3><span><b>Current record</b> · job forecast beneath</span></div>'+ledgerTable(m)+'<p class="pl1251-allocation-note">Revenue follows the existing contract and reference branches; event people retain the existing responsible-branch allocation. Supplier costs retain their cost branch. Transport and overheads include the existing Finance allocations; these are not confirmed branch-coded costs. Unpriced costs remain excluded.</p></section>'+branchTable(m)+'</section>';
}
function apply(){
 const pane=document.getElementById('pane-costs');
 if(!pane)return;
 if(state.tab!=='costs'||state.financeView857&&state.financeView857!=='summary'){pane.removeAttribute('data-pl1251-preview');return;}
 if(typeof SYNC!=='undefined'&&SYNC.status!=='live')return;
 const existing=pane.querySelector('#pl1251-preview'),sourcesExisting=pane.querySelector('[data-pl1251-sources]');
 if(existing&&sourcesExisting){
  [...pane.children].forEach(n=>{if(n===existing||n===sourcesExisting||n.matches('.hubhead,.finance857-nav,.rochip,.panehead'))return;sourcesExisting.append(n);});
  return;
 }
 if(!pane.querySelector('#pl770'))return;
 let m,markup;try{m=snapshot();markup=card(m);}catch(_){pane.removeAttribute('data-pl1251-preview');return;}
 const header=pane.querySelector(':scope > .hubhead'),nav=pane.querySelector(':scope > .finance857-nav'),ro=pane.querySelector(':scope > .rochip'),heading=pane.querySelector(':scope > .panehead');
 if(!header||!nav)return;
 // Omit only the requested accrual presentation. Its model, exports and shared functions remain untouched.
 pane.querySelector('[data-costs-audit="accruals761"]')?.remove();
 pane.querySelector('#accruals761')?.remove();
 const sources=document.createElement('details');sources.className='plfold765 pl1251-sources';sources.setAttribute('data-pl1251-sources','');sources.dataset.sfold='pl1251|sources';sources.open=SFOLD_OPEN.has('pl1251|sources');
 const summary=document.createElement('summary');summary.textContent='Source records, checks and controls';sources.append(summary);
 const keep=new Set([header,nav,ro,heading]);
 [...pane.children].forEach(n=>{if(!keep.has(n))sources.append(n);});
 // Move existing nodes, retaining original event handlers, drill-downs and all source figures.
 const fragment=document.createElement('template');fragment.innerHTML=markup;
 for(const n of [ro,heading,header,nav])if(n)pane.append(n);
 pane.append(fragment.content,sources);
 pane.setAttribute('data-pl1251-preview','');
}
let installed=false;
function install(){
 if(installed)return;installed=true;
 // Native cards install load-time wrappers; this scoped preview runs after all of them.
 const priorCosts=renderCosts;renderCosts=function(){const receiver=this,args=arguments;return holdAssets(()=>{const r=priorCosts.apply(receiver,args);apply();return r;});};
 const priorRender=render;render=function(){const r=priorRender.apply(this,arguments);apply();return r;};
 apply();
}
W.PL1251Preview=Object.freeze({snapshot,card,apply,baseVersion:'12.50',previewOnly:true});
if(document.readyState==='complete')install();else window.addEventListener('load',install,{once:true});
})(window);
