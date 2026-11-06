/* Author: Andrew Fisher. v8.57: one financial area; operational records unchanged. */
function financeHome857() {
  for (const id of ['pricing','fencing']) {
    const node=document.getElementById('pane-'+id);
    if(node && node.closest('#pane-costs')) {
      document.querySelector('main').appendChild(node);
      node.classList.add('pane');node.classList.remove('on','arrive');node.hidden=true;
      node.setAttribute('role','tabpanel');
    }
  }
}
function financeTab857(tab) {
  financeHome857();
  if(tab==='pricing'){state.financeView857='pricing';return 'costs';}
  if(tab==='costs')state.financeView857='summary';
  return tab;
}
function financeLinks857() {
  return '<nav class="finance857-nav" aria-label="Costs and P&amp;L sections"><button class="btn" data-finance857="summary">Costs &amp; P&amp;L</button><button class="btn" data-finance857="pricing">Rates &amp; labour charges</button><button class="btn" data-finance857="fencing">Fencing costs &amp; dockets</button></nav>';
}
function financeSubView857() {
  const view=state.financeView857;
  if(!['pricing','fencing'].includes(view))return false;
  if(view==='pricing')renderPricing();else renderFencing();
  const node=document.getElementById('pane-'+view),costs=document.getElementById('pane-costs');
  costs.innerHTML=paneHeadingHtml('costs')+financeLinks857()+'<div id="finance857-section"></div>';
  node.classList.remove('pane','on','arrive');node.hidden=false;node.setAttribute('role','region');
  costs.querySelector('#finance857-section').appendChild(node);
  return true;
}
function financeOperational857() {
  const operational=['today','timeline','plant','demob','map','coatesway','fencing'];
  if(!operational.includes(state.tab))return;
  const root=document.getElementById('pane-'+state.tab);if(!root)return;
  root.querySelectorAll('.tw841-financial,.tw841-money,.tw841-comparison,.fp-money,.money,.money-grid,.mcard,.m805,.hubcard[data-go="costs"]').forEach(n=>n.remove());
  root.querySelectorAll('.fp-rate-lines').forEach(n=>{
    n.querySelectorAll('.fp-rate-line').forEach(r=>r.querySelectorAll('span').forEach(s=>s.remove()));
  });
  root.querySelectorAll('.jb95').forEach(n=>{if(/^Money$/i.test(n.textContent.trim()))n.remove();});
  root.querySelectorAll('details.fold95').forEach(n=>{if(/^Money\b/i.test(n.querySelector(':scope>summary')?.textContent.trim()||''))n.remove();});
  root.querySelectorAll('.tw841-group-notes li,.tw841-group-note').forEach(n=>{if(/\b(priced|pricing|revenue|direct costs|card rates|financial|charged on|costs on|paid to)\b/i.test(n.textContent))n.remove();});
  root.querySelectorAll('h4').forEach(n=>{if(n.textContent==='Source, schedule and costs')n.textContent='Source and schedule';});
  root.querySelectorAll('table').forEach(table=>{
    const indices=new Set();
    table.querySelectorAll('tr').forEach(r=>[...r.children].forEach((cell,i)=>{if(/\$\s*[\d,]+/.test(cell.textContent))indices.add(i);}));
    for(const i of [...indices].sort((a,b)=>b-a))table.querySelectorAll('tr').forEach(r=>{if(r.children[i])r.children[i].remove();});
  });
  root.querySelectorAll('dl dd').forEach(n=>{if(/\$\s*[\d,]+/.test(n.textContent)){const label=n.previousElementSibling;if(label?.tagName==='DT')label.remove();n.remove();}});
  root.querySelectorAll('.fm-trace-allocation837>b').forEach(n=>{n.textContent=n.textContent.replace(/\s*·\s*\$[\d,.]+/g,'');});
  root.querySelectorAll('.nocharge .chip').forEach(n=>{n.textContent=n.textContent.replace(/\s*·\s*\$[\d,.]+\s*\/\s*m/g,'');});
  // Remaining financial prose belongs with the original evidence in Costs.
  root.querySelectorAll('p,.kpi,.notice').forEach(n=>{if(/\$\s*[\d,]+/.test(n.textContent)&&!n.querySelector('input,button,a'))n.remove();});
}
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-finance857]');if(!button)return;
 e.preventDefault();e.stopPropagation();
 financeHome857();state.financeView857=button.dataset.finance857;
 if(state.tab!=='costs')go776Held('costs');else render();
},true);
