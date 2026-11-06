// Author: Andrew Fisher. Uses the reviewed per-unit owner model; does not mark mixed references as supplier-owned.
function renderSubhired932(){
 const pane=document.getElementById('pane-subhired');if(!pane)return;
 const all=companyModel925();
 if(!all.some(c=>c.owner===companyChoice925))companyChoice925=all[0]?.owner||'';
 const external=o=>!['unknown','coates'].includes(o)&&o!=='other:supplier-not-named';
 pane.innerHTML=paneHeadingHtml('subhired')+'<section class="card nosfold supplier932-head"><h3>Companies</h3><p class="sub">Choose a company for its identified units, supplier delivery plan and original quotes. Ownership is recorded per unit; a location may contain more than one company.</p><div class="supplier932-tabs" role="group" aria-label="Choose a company">'+all.map(c=>'<button type="button" class="btn" data-supplier932-company="'+esc925(c.owner)+'" aria-pressed="'+(companyChoice925===c.owner)+'">'+esc925((external(c.owner)?'Sub-hired · ':'')+c.name)+'</button>').join('')+'</div></section>'+companyHtml925()+(companyChoice925==='event-portables'?ep819Html():'');
 pane.querySelector('[data-unit925-company]')?.closest('label')?.remove();
 const title=pane.querySelector('[data-unit925-companies] h3'),company=all.find(c=>c.owner===companyChoice925);
 if(title&&company)title.textContent=(external(company.owner)?'Sub-hired · ':'')+company.name;
 applyCapability();
}
window.renderSubhired932=renderSubhired932;
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-supplier932-company]');if(!b)return;e.preventDefault();companyChoice925=b.dataset.supplier932Company;renderSubhired932();paneFocus932(companyChoice925);});
function paneFocus932(owner){const b=[...document.querySelectorAll('[data-supplier932-company]')].find(b=>b.dataset.supplier932Company===owner);b?.focus({preventScroll:true});}
