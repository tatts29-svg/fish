/* Author: Andrew Fisher. Same-item supplier estimate, never an approved quote variation or invoice. */
const Supplier955 = (() => {
 const source={quote:'Q6845',file:'Q6845_2.pdf',page:1,sha256:'e5a86ee60344b8e483ce31605d1848b9bb1cd3545f234c8135b4380d6eab3b43',date:'2026-07-28',reviewed:'2026-10-09'};
 const cents=n=>Math.round((n+Number.EPSILON)*100)/100, token=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'');
 const integer=n=>typeof n==='number'&&Number.isSafeInteger(n)&&n>=0&&n<=10000;
 const money=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1e9;
 const date=s=>typeof s==='string'&&/^2026-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
 function coverage(cost,f){
  if(!cost||cost.side!=='ours'||cost.usable!==true||!money(cost.amount)||!cost.id||!String(cost.reference||cost.invoice_no||'').trim())return null;
  if(['forecast','estimate'].includes(cost.status)||cost.forecast===true)return null;
  if(!['eventportables','eventportablesaustralia'].includes(token(cost.supplier||cost.company||cost.vendor)))return null;
  if(String(cost.ref||'').toUpperCase()!=='WC31')return null;
  const text=[cost.description,cost.note,cost.reference].filter(Boolean).join(' '),quote=String(cost.quote||cost.quote_no||'').toUpperCase();
  if(quote!=='Q6845'&&!/\bQ6845\b/i.test(text))return null;
  if(!/\b16\s*-?\s*pan\s*(?:toilet\s*)?block\b/i.test(String(cost.item||'')+' '+text))return null;
  if(!/\b(?:second|additional|extra)\b/i.test(text)||!/\bhire\b/i.test(text))return null;
  // A transport/service line or the original quote alone never replaces the extra hire estimate.
  if(/\b(?:freight|transport|cartage|delivery|pickup|pick-up|demob|install(?:ation)?|cleaning|servicing)\b/i.test(String(cost.description||'')))return null;
  const period=text.match(/\bperiod\s+(2026-\d{2}-\d{2})\s*(?:to|→)\s*(2026-\d{2}-\d{2})\b/i);
  const from=cost.period_from||period&&period[1],to=cost.period_to||period&&period[2];
  const partial=/\b(?:deposit|partial|part[- ]payment|balance\s+only)\b/i.test(text);
  const whole=!partial&&(/\bwhole[- ]event\b/i.test(text)||(date(from)&&date(to)&&from<=f.from&&to>=f.to));
  const quantity=cost.quantity!=null?cost.quantity:/\bsecond\b/i.test(text)?1:null;
  return {id:String(cost.id),state:whole&&integer(quantity)&&quantity===f.additional?'covered':'held',quantity:integer(quantity)?quantity:null};
 }
 function calculate(input){
  const f={id:'supplier955|Q6845|WC31|16Pan Block',ref:'WC31',item:'16Pan Block',supplier:'Event Portables Australia',branch:input.branch||'KINP',required:0,quoted:0,additional:0,rate:null,estimate:0,month:null,from:null,to:null,held:false,coverage:[],source,state:'inactive',reason:''};
  if(!input.active)return f;
  const q=input.quote,lines=q&&Array.isArray(q.groups)?q.groups.flatMap(g=>g.lines||[]).filter(l=>l.description==='16 Pan Toilet Block'):[];
  if(!input.approved||!q||q.quote!=='Q6845'||lines.length!==1){f.held=true;f.state='held';f.reason='The matching approved quote line needs review.';return f;}
  const line=lines[0];
  if(!integer(line.qty)||!money(line.unit_price)||!money(line.total_price)||cents(line.qty*line.unit_price)!==cents(line.total_price)||!date(q.use_on)||!date(q.collect)||q.collect<q.use_on||q.use_on.slice(0,7)!==q.collect.slice(0,7)){
   f.held=true;f.state='held';f.reason='Quote quantity, rate or event period needs review.';return f;
  }
  f.quoted=line.qty;f.rate=line.unit_price;f.from=q.use_on;f.to=q.collect;f.month=q.use_on.slice(0,7);
  const units=(input.units||[]).filter(u=>u&&u.physical===true&&u.source!=='history'&&u.ref==='WC31'&&u.owner==='event-portables'&&u.item==='16Pan Block');
  if(units.some(u=>!u.id)||new Set(units.map(u=>u.id)).size!==units.length){f.held=true;f.state='held';f.reason='The physical supplier units need identity review.';return f;}
  f.required=units.length;f.additional=Math.max(0,f.required-f.quoted);
  if(!f.additional){f.state='covered-by-quote-quantity';return f;}
  f.coverage=(input.costs||[]).map(c=>coverage(c,f)).filter(Boolean);
  if(f.coverage.some(c=>c.state==='covered')){f.state='recorded-variation';f.reason='An exactly matched whole-event additional-hire cost replaces this estimate.';return f;}
  if(f.coverage.length){f.held=true;f.state='held';f.reason='A matching additional-hire cost has partial or unclear quantity/period coverage; reconcile it before restoring an estimate.';return f;}
  f.state='estimate';f.estimate=cents(f.additional*f.rate);return f;
 }
 const model=()=>heldMemo('supplier955Forecast',()=>{
  const a=assetOf('WC31'),rq=DATA.rehire_quotes||{};
  return calculate({active:!!(a&&!a._cancelled&&!movedAway(a.key)),quote:(rq.quotes||[]).find(q=>q.quote==='Q6845'),approved:rq.authorisation&&rq.authorisation.state==='approved',units:a?gcUnits925(a):[],costs:ourCosts(),branch:pl760ToiletBranch()});
 });
 const words=f=>{f=f||model();return f.state==='estimate'?`WC31 additional 16-pan block hire: ${moneyText(f.rate)} × ${f.additional} once = ${moneyText(f.estimate)} ex GST, estimated from Q6845 page 1 for the same item. ${f.required} current identified Event Portables units; ${f.quoted} quoted. This is a forecast allowance, not an approved variation or invoice. Original approved quote totals are unchanged. Additional transport remains unconfirmed.`:f.state==='recorded-variation'?`WC31 additional 16-pan block hire: ${f.reason} Original approved quotes are unchanged; any additional transport still needs confirmation.`:f.held?`WC31 additional 16-pan block hire: estimate held. ${f.reason} Additional transport remains unconfirmed.`:'WC31 has no additional identified Event Portables 16-pan block above the current quoted quantity. Unidentified demand and supplier transport coverage still need review.';};
 const moneyText=n=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD'}).format(n);
 const month=(f,m)=>f&&f.month===m?f.estimate:0;
 function gap(add){const f=model();if(f.additional||f.held)add('WC31 — additional hire forecast and transport review',words(f),'Event Portables — confirm the additional hire and transport variation');}
 function owner(row,units){
  if(!row||String(row.rental_contract)!=='9968955'||Number(row.line)!==98||row.branch_code!=='KINP'||row.item!=='MISCITEM'||row.description!=='WC31 16 Pan Block'||row.register_type!=='16Pan Block'||row.family!=='toilet'||row.quantity!==2||row.charge_line||row.supplier_sub_rental||row.match&&row.match.key&&row.match.key!=='WC31')return null;
  const current=(units||[]).filter(u=>u&&u.physical===true&&u.source!=='history'&&u.ref==='WC31'&&u.item==='16Pan Block');
  if(current.length!==2||current.some(u=>u.owner!=='event-portables'||!u.id)||new Set(current.map(u=>u.id)).size!==2||current.map(u=>String(u.assetNo)).sort().join('|')!=='12|74')return null;
  return {owner:'event-portables',rehire:true,source955:true,basis:'WC31 contract 9968955 line 98 names two 16-pan blocks; current physical units 12 and 74 are recorded as Event Portables. The original unmatched contract fields are retained.'};
 }
 const ownerForRow=row=>{if(!row||String(row.rental_contract)!=='9968955'||Number(row.line)!==98)return null;const a=assetOf('WC31');return a&&!a._cancelled&&!movedAway(a.key)?owner(row,gcUnits925(a)):null;};
 const ownerWords=()=>{const row=ONHIRE_ROWS.find(r=>String(r.rental_contract)==='9968955'&&Number(r.line)===98),o=ownerForRow(row);return o?o.basis+' Existing customer hire is classified as Rehire Revenue once; the amount is unchanged.':'';};
 const ownerHtml=row=>{const o=ownerForRow(row);return o?'<div class="w supplier955-evidence" style="font-size:12px;color:var(--mute);white-space:normal">'+esc(o.basis)+' Existing customer hire is Rehire Revenue; no extra charge.</div>':'';};
 return {source,coverage,calculate,model,words,month,gap,owner,ownerForRow,ownerWords,ownerHtml};
})();
if(typeof module!=='undefined'&&module.exports)module.exports=Supplier955;
