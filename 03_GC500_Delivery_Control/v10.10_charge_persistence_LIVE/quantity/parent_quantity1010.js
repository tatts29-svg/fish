/* Author: Andrew Fisher. Typed reference quantities; never count asset numbers as units. */
function mapQuantity1010(a,state){
 try{
 const groups=new Map(),lines=chargeLines(a)||[],valid=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
 for(const line of lines){const item=String(line.item||'').trim()||'Description to confirm';const key=item.toLowerCase().replace(/\s+/g,' '),q=qtyOf(line);
  if(!groups.has(key))groups.set(key,{item,quantity:0,completed:null,installed:null});
  const row=groups.get(key);row.quantity=row.quantity!=null&&valid(q)?row.quantity+q:null;
 }
 if(!groups.size)return {known:false,mixed:false,items:[]};
 let receipts=null;
 try{if(a.product==='Toilet'||a.discipline==='Toilets & amenities')receipts=toiletRows962(a,deliveryOf(a.key),lines,todayIso());}catch(_){}
 for(const row of groups.values()){
  if(state==='complete'&&valid(row.quantity))row.completed=row.quantity;
  const source=receipts&&receipts.rows.filter(r=>String(r.item||'').trim().toLowerCase().replace(/\s+/g,' ')===row.item.toLowerCase().replace(/\s+/g,' '));
  // An installation count is kept separate from the final Complete check.
  if(source&&source.length===1&&!source[0].conflict&&source[0].quantity===row.quantity&&valid(source[0].done)&&source[0].done<=row.quantity&&
    (source[0].done>0||source[0].explicitInstall||source[0].recordedComplete))row.installed=source[0].done;
 }
 const items=[...groups.values()];return {known:items.every(r=>r.quantity!=null),mixed:items.length>1,items};
 }catch(_){return {known:false,mixed:false,items:[]};}
}
