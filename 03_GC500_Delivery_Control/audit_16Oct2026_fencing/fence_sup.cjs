const {open}=require('/home/user/fish/03_GC500_Delivery_Control/toolchain/harness/open_page.js');
(async()=>{const h=await open({pageFile:process.argv[2],hash:'#fencing'});try{
await h.page.waitForFunction(()=>typeof SYNC==='object'&&SYNC.status==='live'&&SYNC.first&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
await h.page.waitForTimeout(2500);
const r=await h.page.evaluate(()=>{
 const out=[];const R=n=>Math.round(n*100)/100;
 allDockets().forEach(d=>{
  const sl=d.supplier_lines||[];const q=d.quantities||{};const sup={},ours={};
  sl.forEach(l=>{sup[l.column]=(sup[l.column]||0)+(Number(l.qty)||0);});
  Object.keys(q).forEach(k=>{const n=Number(q[k])||0;if(n)ours[k]=n;});
  const keys=new Set(Object.keys(sup).concat(Object.keys(ours)));const diffs=[];
  if(sl.length>0){keys.forEach(k=>{const a=R(sup[k]||0),b=R(ours[k]||0);if(a!==b)diffs.push(k+': supplier '+a+' / ours '+b);});}
  if(diffs.length>0)out.push({id:d.id,no:d.docket_no,date:d.date,loc:d.location,charged:d.cost_total,paid:d.paid_total,basis:d.supplier_pricing_basis||null,diffs:diffs});
 });
 const noSup=allDockets().filter(d=>!(d.supplier_lines||[]).length);
 return {diffs:out,withSupplier:allDockets().length-noSup.length,noSupplierLines:noSup.map(d=>d.docket_no+' '+d.date+' paid '+d.paid_total)};
});
console.log(JSON.stringify(r,null,1));
}finally{await h.browser.close();}})().catch(e=>{console.error(e.message);process.exit(1)});
