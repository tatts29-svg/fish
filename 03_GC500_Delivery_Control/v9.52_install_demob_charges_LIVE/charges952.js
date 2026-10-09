/* Author: Andrew Fisher. Customer labour is independent of equipment ownership. */
function charges952Html(a){
 if(!a||capability()!=='edit')return '';
 const slots=labourPlan().slots.filter(s=>s.ref===a.key), groups=chargeLines(a);
 if(!slots.length)return '';
 const sum=list=>Math.round(list.reduce((n,s)=>n+(s.value||0),0)*100)/100;
 const unknown=slots.some(s=>s.value==null)?'<p><b>Incomplete amount:</b> some labour has no readable quantity or confirmed rate; figures below show known charges only.</p>':'';
 const charged=slots.filter(s=>s.state==='charged'), later=slots.filter(s=>s.state==='later'), pending=slots.filter(s=>s.state==='expected'||s.state==='tocome');
 const rows=groups.map(l=>{const ss=slots.filter(s=>s.disc===l.discipline&&s.item===l.item);if(!ss.length)return '';return '<p><b>'+esc(l.item)+'</b> — recorded '+esc(money(sum(ss.filter(s=>s.state==='charged'))))+' · install/work remaining '+esc(money(sum(ss.filter(s=>s.state==='expected'||s.state==='tocome'))))+' · demob/cleaning forecast '+esc(money(sum(ss.filter(s=>s.state==='later'))))+'</p>';}).join('');
 return '<section class="notice charges952" data-charges952="'+esc(a.key)+'"><b>Customer install and demob charges</b>'+unknown+'<p>Recorded '+esc(money(sum(charged)))+' · work remaining '+esc(money(sum(pending)))+' · demob/cleaning forecast '+esc(money(sum(later)))+' — ex GST.</p>'+rows+'<p>Same card rates for Coates and sub-hired equipment. Recorded charges are completed labour ticks; arriving or allocating a number does not confirm installation. Supplier invoices stay in Costs.</p></section>';
}
