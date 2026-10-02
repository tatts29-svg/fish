import {PARTS,COG_REFERENCES} from './parts.js';
const $=id=>document.getElementById(id);
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');

export function initPartsRegister({drive,selectPart,graphicsReady}){
 let tab='parts';
 const categories=[...new Set(PARTS.map(p=>p.category))];
 $('register-category').innerHTML+='<option>'+categories.map(escape).join('</option><option>')+'</option>';
 function render(){
  const q=$('register-search').value.trim().toLowerCase(),category=$('register-category').value;
  const records=tab==='parts'?PARTS.map(p=>({part:p.index,ref:p.ref,label:p.name,search:p.search})):COG_REFERENCES.map(r=>({...r,search:(r.ref+' '+r.label).toLowerCase()}));
  const hits=records.filter(r=>(!q||r.search.includes(q))&&(!category||PARTS[r.part].category===category));
  $('register-count').textContent=`${hits.length} ${tab==='parts'?'physical component':'wording reference'}${hits.length===1?'':'s'}${tab==='cog'?' · Located on the four original cog plates':''}`;
  $('register-rows').innerHTML=hits.length?hits.map(r=>{const p=PARTS[r.part];return `<button class="register-row" data-part="${r.part}" aria-label="Inspect ${escape(r.ref+' '+r.label)}"><code>${escape(r.ref)}</code><span><strong>${escape(r.label)}</strong><small>${escape(tab==='parts'?p.category:'On '+p.ref+' · '+p.name)}</small></span><em>${tab==='cog'?'Locate ↗':!graphicsReady()?'Inspect ↗':drive.connected(r.part)?'Connected':'Open ↗'}</em></button>`;}).join(''):'<p class="register-empty">No matching references. Try a part name or another assembly.</p>';
 }
 function open(which='parts'){tab=which;$('register-search').value='';$('register-category').value='';$('parts-dialog').showModal();setTab(which);$('register-search').focus();}
 function setTab(which){tab=which;$('register-search').value='';if(tab==='cog')$('register-category').value='';document.querySelectorAll('[data-register-tab]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.registerTab===tab));$('register-category').hidden=tab==='cog';render();}
 $('part-register').addEventListener('click',()=>open());$('cog-register').addEventListener('click',()=>open('cog'));
 $('register-close').addEventListener('click',()=>$('parts-dialog').close());
 $('parts-dialog').addEventListener('click',e=>{if(e.target===$('parts-dialog')){const b=e.target.getBoundingClientRect();if(e.clientX<b.left||e.clientX>b.right||e.clientY<b.top||e.clientY>b.bottom)e.target.close();}});
 document.querySelectorAll('[data-register-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.registerTab)));
 $('register-search').addEventListener('input',render);$('register-category').addEventListener('change',render);
 $('register-rows').addEventListener('click',e=>{const row=e.target.closest('[data-part]');if(!row)return;$('parts-dialog').close();selectPart(+row.dataset.part,{focus:true});});
 return {open};
}
