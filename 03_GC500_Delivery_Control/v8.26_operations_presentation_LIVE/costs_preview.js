/* Author: Andrew Fisher. Native data and handlers retained; private presentation only. */
(function(){
 const originalRenderCosts=renderCosts;
 const openFolds=new Set();
 let printFolds=null;
 const sections=[
  ['pl752','Revenue and Direct costs by branch','Contract lines, card rates, dockets and known job costs','Partial costs'],
  ['pl770','P&L account lines and recovery','The business’s ledger lines, with the source and scope of each figure','Finance review'],
  ['costs764','Forecast to job end and missing costs','Remaining programme, estimates and the items still needing a rate','Forecast'],
  ['rehire766','Rehire by branch','Supplier costs, what we charge and whether known costs are covered','Cost gaps'],
  ['accruals761','Accruals for Finance','Work-month evidence, people, hours and the Finance review export','Review first'],
  ['finance745','Actuals, forecast and journals','Confirmed costs, forecast costs and external posting references','Record controls']
 ];
 function decorate(){
  const pane=document.getElementById('pane-costs'); if(!pane||!pane.querySelector('#costs765'))return;
  pane.classList.add('costs-audit-preview');
  const heading=pane.querySelector('.hubhead h2');if(heading)heading.textContent='Costs & charges';
  const sub=pane.querySelector('.hubhead .sub');if(sub)sub.textContent='Revenue charged to the V8s · Direct costs paid by Coates · AUD ex GST';
  const lead=pane.querySelector('.cj765-lead');if(lead)lead.textContent='Record and forecast remain separate. Missing costs stay visible; the difference is not a final margin.';
  const notes=pane.querySelectorAll('.cj765-note');
  if(notes[0])notes[0].textContent='Contracts, card rates and recorded dockets. Job end includes the remaining fencing programme; labour still to tick is excluded.';
  const costTile=pane.querySelectorAll('.cj765-tile')[1],wages=cj764Model().wages;
  if(costTile&&wages){
   const endLabel=costTile.querySelector('.cj765-end small');if(endLabel)endLabel.textContent='to job end · excluding wages';
   const note=costTile.querySelector('.cj765-note');if(note){
    const priced=document.createElement('b'),basis=document.createElement('small');
    priced.className='costs-audit-wages';priced.textContent='Priced wages + '+money0(wages.job);
    basis.textContent='Deducted in the job-end difference below. '+fmtNum(wages.unpricedHours)+' h still have no wage rate.';
    note.replaceChildren(priced,basis);
   }
  }
  const labels=pane.querySelectorAll('.cj765-tile>span');if(labels[2])labels[2].textContent='Difference so far';
  for(const [id,title,basis,status] of sections){
   const section=document.getElementById(id); if(!section||section.closest('.costs-audit-fold'))continue;
   const fold=document.createElement('details');fold.className='costs-audit-fold';fold.dataset.costsAudit=id;fold.open=printFolds!==null||openFolds.has(id);
   const summary=document.createElement('summary');const txt=document.createElement('span'),strong=document.createElement('b'),small=document.createElement('small'),badge=document.createElement('span');
   strong.textContent=title;small.textContent=basis;badge.textContent=status;badge.className='costs-audit-status';txt.append(strong,small);summary.append(txt,badge);fold.append(summary);section.before(fold);fold.append(section);
   fold.addEventListener('toggle',()=>{if(!fold.isConnected||printFolds!==null)return;fold.open?openFolds.add(id):openFolds.delete(id);});
  }
  pane.querySelectorAll('[data-jump765]').forEach(button=>button.onclick=()=>{
   const target=document.getElementById(button.dataset.jump765);if(!target)return;
   for(let el=target;el;el=el.parentElement)if(el.tagName==='DETAILS')el.open=true;
   target.scrollIntoView({behavior:'smooth',block:'start'});
  });
 }
 renderCosts=function(){const result=originalRenderCosts.apply(this,arguments);decorate();return result;};
 window.costsAuditDecorate=decorate;
 window.addEventListener('beforeprint',()=>{
  if(printFolds!==null)return;
  printFolds=new Set(openFolds);
  document.querySelectorAll('#pane-costs .costs-audit-fold').forEach(e=>{e.open?printFolds.add(e.dataset.costsAudit):printFolds.delete(e.dataset.costsAudit);e.open=true;});
 });
 window.addEventListener('afterprint',()=>{
  if(printFolds===null)return;
  openFolds.clear();printFolds.forEach(id=>openFolds.add(id));
  document.querySelectorAll('#pane-costs .costs-audit-fold').forEach(e=>{e.open=openFolds.has(e.dataset.costsAudit);});
  printFolds=null;
 });
 decorate();
})();
