/* Author: Andrew Fisher. Pack the existing programme without copying its facts or controls. */
const TodayPlates907 = (() => {
 'use strict';
 let programmeOpen=false,printing=false,printOpen=null;
 function mount(){
  const board=document.getElementById('gc500-work-board840');
  if(board){
   board.querySelectorAll('.tw840-footer').forEach(footer=>{const status=footer.lastElementChild?.textContent.trim();footer.toggleAttribute('data-p907-redundant',status==='Shared record');});
   board.querySelectorAll('[data-tw847-plan-summary]').forEach(line=>{const label=line.querySelector('strong');if(label&&/^\s*On-site plan\b/.test(label.nextSibling?.textContent||''))label.setAttribute('data-p907-redundant','');});
  }
  const card=document.getElementById('where885');if(!card)return;
  const programme=card.querySelector('.w885-programme');
  if(!programme||programme.closest('.p907-programme'))return;
  const stats=programme.querySelector('.pgm > .pstats');if(!stats)return;
  const fold=document.createElement('details');fold.className='p907-programme';fold.open=programmeOpen;
  const summary=document.createElement('summary'),name=document.createElement('span');name.className='p907-name';name.textContent='Programme and key dates';summary.append(name,stats);
  const body=document.createElement('div');body.className='p907-body';
  programme.before(fold);body.append(programme);fold.append(summary,body);
  fold.addEventListener('toggle',()=>{if(!printing)programmeOpen=fold.open;});
 }
 if(typeof renderToday_held==='function'){const held=renderToday_held;renderToday_held=function(...args){const r=held.apply(this,args);mount();return r;};}
 window.addEventListener('beforeprint',()=>{const fold=document.querySelector('#where885 .p907-programme');if(fold){printing=true;printOpen=fold.open;fold.open=true;}});
 window.addEventListener('afterprint',()=>{const fold=document.querySelector('#where885 .p907-programme');if(fold&&printOpen!==null)fold.open=printOpen;printing=false;printOpen=null;});
 mount();return{mount,report:()=>({version:'v9.07',programmeOpen,folds:document.querySelectorAll('#where885 .p907-programme').length,stats:document.querySelectorAll('#where885 .pstats').length})};
})();
