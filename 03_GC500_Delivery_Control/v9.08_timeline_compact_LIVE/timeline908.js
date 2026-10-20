/* Author: Andrew Fisher. Rearrange native load-card elements; no record or action semantics change. */
function timeline908Arrange(html){
 const t=document.createElement('template');t.innerHTML=html;
 const card=t.content.querySelector('.ld.tl846'),layout=card&&card.querySelector('.tl846-layout'),main=layout&&layout.querySelector(':scope>.ldl'),controls=layout&&layout.querySelector(':scope>.tl846-controls');
 if(!card||!main||!controls||card.classList.contains('compact908'))return html;
 card.classList.add('compact908');controls.classList.add('timeline908-utility');
 const plans=document.createElement('div');plans.className='timeline908-plans';plans.setAttribute('role','group');plans.setAttribute('aria-label','Load planning');
 const time=controls.querySelector(':scope>.ld-t');if(time)main.append(time);
 // Keep the existing action group, its labels, unknown extension children and every delegated action attribute.
 // Only move the existing native details into a common planning row; never duplicate a form or its inputs.
 controls.querySelectorAll(':scope > details, :scope > .tl841-actions > details').forEach(e=>plans.append(e));
 if(plans.children.length)layout.append(plans);
 return t.innerHTML;
}
const ldLineBefore908=ldLine;
ldLine=function(...args){return timeline908Arrange(ldLineBefore908(...args));};
