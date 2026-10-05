/* Author: Andrew Fisher. Presentation only; retain native figures and controls. */
(function(){
 const saved = new Set();
 function fold(node,label,key){
  if(!node || node.closest('.costs-note854')) return;
  const d=document.createElement('details');d.className='costs-note854';d.dataset.costNote=key;d.open=saved.has(key);
  const summary=document.createElement('summary');summary.textContent=label;d.append(summary);
  node.before(d);d.append(node);
  d.addEventListener('toggle',()=>{if(d.open)saved.add(key);else saved.delete(key)});
 }
 function tidy(){
  const pane=document.querySelector('#costs765')?.parentElement;if(!pane)return;
  pane.querySelectorAll('#pl770 .fin745-heading p:not(.fin745-eyebrow), #pl770 .fin745-basis').forEach((n,i)=>fold(n,'Source and calculation notes','pl-heading-'+i));
  pane.querySelectorAll('#pl770 td.acc761-why').forEach((cell,i)=>{
   if(cell.querySelector('.costs-note854'))return;
   const warning=cell.querySelector('.rh766-miss');if(warning)warning.remove();
   const content=document.createElement('div');while(cell.firstChild)content.append(cell.firstChild);cell.append(content);
   fold(content,'View calculation','pl-row-'+i);if(warning)cell.append(warning);
  });
  pane.querySelectorAll('#pl770 td:nth-child(2) > .acc761-w').forEach((n,i)=>fold(n,'Account detail','pl-account-'+i));
  pane.querySelectorAll('.cj765-tile').forEach((tile,i)=>{
   const note=tile.querySelector('.cj765-note');if(!note)return;
   if(i===1){
    const W=cj764Model().wages;note.textContent='Priced wages: '+money(W.job)+'. '+fmtNum(W.unpricedHours||0)+' h remain unpriced. Job-end difference deducts priced wages.';
   }
   if(i!==2 && i!==1)fold(note,i===3?'Finance proposal details':'Revenue basis','headline-'+i);
  });
 }
 let paper=[];
 window.addEventListener('beforeprint',()=>{paper=[...document.querySelectorAll('#pane-costs details.costs-note854')].map(d=>[d,d.open]);paper.forEach(([d])=>d.open=true);});
 window.addEventListener('afterprint',()=>{paper.forEach(([d,open])=>d.open=open);paper=[];});
 const native=renderCosts;
 renderCosts=function(){const main=document.querySelector('main'),y=main?.scrollTop||0;const result=native.apply(this,arguments);tidy();if(y>0)requestAnimationFrame(()=>main.scrollTo({top:y,behavior:"instant"}));return result;};
 const prev=window.costsAuditDecorate;
 window.costsAuditDecorate=function(){prev?.apply(this,arguments);tidy();};
})();
