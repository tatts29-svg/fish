/* Author: Andrew Fisher. Worker-only assignments with existing details retained. */
(function(){
'use strict';
function simplifyPerson(html){
 const t=document.createElement('template');t.innerHTML=html;
 const row=t.content.querySelector('[data-crew883-person]');if(!row)return html;
 row.querySelector('legend').textContent=row.querySelector('legend').textContent.replace('Person','Worker');
 const label=row.querySelector('[data-crew883-slot]').closest('label');label.firstChild.textContent='Worker ';
 const roles=[...row.querySelectorAll('[data-crew883-role]')];
 if(roles.some(input=>input.checked)){
  const history=document.createElement('details');history.dataset.workers975History='';
  history.innerHTML='<summary>Recorded roles</summary>';
  for(const input of roles){const l=input.closest('label');input.disabled=true;history.append(l);}
  row.append(history);
 }else roles.forEach(input=>input.closest('label').remove());
 const remove=row.querySelector('[data-crew883-remove]');if(remove)remove.textContent='Remove worker';
 return t.innerHTML;
}
const personBefore=crew883PersonHtml;
crew883PersonHtml=function(...args){return simplifyPerson(personBefore.apply(this,args));};
const editorBefore=crew883Editor;
crew883Editor=function(...args){
 const t=document.createElement('template');t.innerHTML=editorBefore.apply(this,args);
 const editor=t.content.querySelector('.crew883[data-workers911]');if(!editor)return t.innerHTML;
 const body=editor.querySelector('.crew883-body');
 const more=document.createElement('details');more.dataset.workers975Details='';more.innerHTML='<summary>More info</summary>';
 for(const attr of ['location','start','finish']){const input=editor.querySelector('[data-crew883-'+attr+']');if(input)more.append(input.closest('label'));}
 for(const p of [...body.children])if(p.tagName==='P'&&!p.classList.contains('staff910-message')||p.matches('[data-crew883-result]')||p.tagName==='DETAILS'&&!p.matches('[data-staff910-availability]'))more.append(p);
 body.append(more);
 return t.innerHTML;
};
})();
