/* Author: Andrew Fisher. A described item is one unless a quantity is explicitly recorded. */
function descriptionQuantity1012(line,contextDescription){
 const l=line||{},blank=v=>v==null||String(v).trim()==='',clean=v=>String(v==null?'':v).trim();
 const legacy=!/^typed/i.test(clean(l.quantity_state))&&(!!(l.quantity_auto&&('quantity_on_the_schedule' in l)&&blank(l.quantity_on_the_schedule))||!!l.quantity_inferred1012);
 if(!legacy&&!blank(l.quantity)){
  const n=Number(l.quantity);return {quantity:Number.isFinite(n)&&n>=0?n:null,inferred:false,basis:Number.isFinite(n)&&n>=0?'recorded quantity':'invalid recorded quantity'};
 }
 if(l.quantity_invalid1012)return {quantity:null,inferred:false,basis:l.quantity_state||'invalid recorded quantity'};
 const texts=[l.item,l.description,contextDescription===undefined?l.quantity_description1012:contextDescription].map(clean).filter(Boolean);
 if(!texts.length)return {quantity:null,inferred:false,basis:'no item description'};
 const amounts=[],number='(?:(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?)',count=s=>Number(s.replace(/,/g,'')),measure=/^(?:kva|kw|kwh|v|a|mm|cm|m|metres?|meters?|ft|feet|inches?|kg|tonnes?|tons?|t|l|litres?|liters?|pan)\b/i;
 let invalid=false;
 for(const text of texts){
  // Explicit quantity labels. A malformed label cannot fall through to the default of one.
  const labels=[...text.matchAll(/\b(?:qty|quantity)\.?\s*[:=]?\s*([^;)\s]+)/gi)];
  for(const m of labels){const token=m[1].replace(/[.,]$/,'');if(!new RegExp('^'+number+'$').test(token))invalid=true;else amounts.push(count(token));}
  if(/\b(?:qty|quantity)\s*[:=]?\s*$/i.test(text))invalid=true;
  // Multiplication marks must join a count to an item, never dimension to dimension.
  const leading=text.match(new RegExp('^('+number+')\\s*[x×]\\s*(.+)$','i'));
  if(leading&&/[A-Za-z]/.test(leading[2])&&!/^\d/.test(leading[2])&&!measure.test(leading[2]))amounts.push(count(leading[1]));
  const trailing=text.match(new RegExp('^(.+?)\\s*[x×]\\s*('+number+')$','i'));
  const itemWords=trailing&&trailing[1].replace(/\d+(?:\.\d+)?\s*(?:kva|kw|kwh|mm|cm|metres?|meters?|m|ft|kg|tonnes?|litres?|l|t)?\b/gi,'').replace(/[x×]/gi,'').trim();
  if(trailing&&/[A-Za-z]/.test(itemWords)&&!/[\d.]\s*$/.test(trailing[1])&&!/\d\s*(?:mm|cm|m|ft)?\s*[x×]\s*\d/i.test(trailing[1]))amounts.push(count(trailing[2]));
 }
 const unique=[...new Set(amounts)];
 if(invalid||unique.length>1)return {quantity:null,inferred:false,basis:'invalid or conflicting description quantity'};
 return {quantity:unique.length?unique[0]:1,inferred:true,basis:unique.length?'quantity stated in the item description':'one per described item'};
}
function descriptionLine1012(line,contextDescription){
 const result=descriptionQuantity1012(line,contextDescription);
 if(!result.inferred)return result.quantity==null?Object.assign({},line,{quantity:null,priceable:false,quantity_original1012:'quantity_original1012' in line?line.quantity_original1012:line.quantity,quantity_invalid1012:/invalid/.test(result.basis),quantity_state:result.basis}):line;
 return Object.assign({},line,{quantity:result.quantity,priceable:true,quantity_auto:true,quantity_inferred1012:true,
  quantity_on_the_schedule:'quantity_on_the_schedule' in line?line.quantity_on_the_schedule:line.quantity,
  quantity_state_on_the_schedule:line.quantity_state_on_the_schedule||line.quantity_state,
  quantity_description1012:contextDescription===undefined?line.quantity_description1012:contextDescription,
  quantity_state:result.basis+' — the project manager’s quantity rule'});
}
function descriptionEvent1012(event,lines,events,contextDescription){
 const e=event||{};
 if(e.quantity_raw!=null&&String(e.quantity_raw).trim()!=='')return e;
 const display=String(e.quantity_display==null?'':e.quantity_display).trim();
 if(display&&display.toLowerCase()!=='blank'){
  const n=Number(display);return Number.isFinite(n)&&n>=0?Object.assign({},e,{quantity_raw:n}):e;
 }
 const own=(lines||[]).filter(l=>l.item===e.item),same=(events||[]).filter(x=>x.item===e.item&&(x.movement==='remove')===(e.movement==='remove'));
 const itemTypes=new Set((lines?.length?lines:events||[]).map(l=>l.item).filter(Boolean));
 const known=own.map(l=>descriptionQuantity1012(l).quantity),shared=same.length===1&&known.length&&known.every(n=>n!=null);
 const result=descriptionQuantity1012({item:e.item,description:e.description},!shared&&same.length===1&&itemTypes.size===1?contextDescription:null);
 if(result.quantity==null)return e;
 const q=result.basis==='one per described item'&&shared?known.reduce((s,n)=>s+n,0):result.quantity;
 return Object.assign({},e,{quantity_raw:q,quantity_display:String(q),quantity_flag:null,quantity_on_the_schedule:e.quantity_raw??null,quantity_display_on_the_schedule:e.quantity_display??null,quantity_auto:'the project manager’s described-item quantity rule'});
}
