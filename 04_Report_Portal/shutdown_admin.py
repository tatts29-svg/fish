"""Manager's controls for the MMG report archive and current consumables close-out."""

MANAGER_PANEL = """
<style>
#shut-admin{border:1px solid #46505b;border-radius:.65rem;margin-block:1.15rem;color:inherit}
#shut-admin summary{padding:.9rem 1rem;cursor:pointer;font-weight:700}
#shut-admin .shut-columns{padding:0 1rem 1rem;display:grid;gap:1.25rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr))}
#shut-admin h2{font-size:1.08rem;margin:.4rem 0}
#shut-admin p,#shut-admin label{font-size:.9rem;line-height:1.45}
#shut-admin label{display:block;margin:.65rem 0 .2rem}
#shut-admin input:not([type=checkbox]){display:block;width:100%;box-sizing:border-box;padding:.65rem;background:#17202a;color:#fafafa;border:1px solid #626c79;border-radius:.35rem;color-scheme:dark}
#shut-admin input[type=checkbox]{display:inline-block;width:1.1rem;height:1.1rem;vertical-align:middle}
#shut-admin button{margin-top:.7rem;width:100%}
#shut-admin .shut-dates{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem}
#shut-feedback{margin:0 1rem .8rem;font-weight:600}
</style>
<details id="shut-admin"><summary>Shutdown history and consumables close-out</summary>
<div class="shut-columns"><form id="archive-shut"><h2>Add a previous shutdown</h2>
<p>Choose an original MMG Sales Stock or Transactions workbook. Earlier shutdowns are stored separately from the daily uploads.</p>
<label for="shut-file">SiteIQ workbook</label><input type="file" accept=".xlsx" required id="shut-file">
<label for="shut-label">Shutdown month and year</label><input required maxlength="80" id="shut-label" placeholder="e.g. Jul 2026">
<div class="shut-dates"><div><label for="shut-start">First shift date</label><input type="date" required id="shut-start"></div>
<div><label for="shut-end">Last shift date</label><input type="date" required id="shut-end"></div></div>
<p>Enter the dates covered by the workbook. A transaction day runs from 05:00 AEST until 04:59 the next morning.</p>
<label><input type="checkbox" id="shut-complete"> This Sales Stock export covers the entire finished shutdown, including final returns.</label>
<button>Add shutdown history</button></form>
<div><h2>Final consumables report</h2>
<p id="closeout-state" role="status"></p>
<form id="confirm-shut" hidden><label><input type="checkbox" id="closeout-name" required> I am Andrew Fisher and confirm this is the closing Sales Stock export for MMG Dugald River.</label>
<button>Confirm closing export</button></form>
<p>The final report uses the available balance for handback to MMG. Physical receipt can be recorded separately by site.</p>
<button type="button" id="rebuild-shut" hidden>Rebuild from saved exports</button></div></div>
<p id="shut-feedback" role="status" aria-live="polite"></p></details>
<script>
(()=>{
 const find=id=>document.getElementById(id);
 const headers={'X-Portal':'1'};
 let salesStamp='', saving=false;
 const feedback=text=>{find('shut-feedback').textContent=text};
 async function readJson(response){
   if(!(response.headers.get('content-type')||'').includes('application/json')){
     throw Error(response.ok?'The portal returned an unexpected response.':'The request failed ('+response.status+'). Open uploads again to check your sign-in.');
   }
   const result=await response.json();
   if(!response.ok)throw Error(result.error||'The request could not be saved.');
   return result;
 }
 async function refreshCloseout(){
   const data=await readJson(await fetch('/upload/consumables-closeout',{headers,cache:'no-store'}));
   salesStamp=data.sales_as_at||'';
   find('closeout-state').textContent=data.message+(salesStamp?' · Sales export '+salesStamp+' AEST':'');
   find('confirm-shut').hidden=!(data.status==='ready' && data.eligible);
 }
 find('shut-admin').addEventListener('toggle',()=>{
   if(find('shut-admin').open)refreshCloseout().catch(e=>feedback(e.message));
 });
 async function rebuild(){
   const reply=await fetch('/upload/rebuild-current',{method:'POST',headers});
   if(!reply.ok)throw Error(reply.status===409?'A report rebuild is already running. Retry when it finishes.':'Could not start the rebuild. Retry from saved exports.');
   find('rebuild-shut').hidden=true;
   feedback('Report rebuild started. This page will show progress under Update the report.');
   if(typeof poll==='function')poll();
 }
 find('rebuild-shut').onclick=async()=>{
   const button=find('rebuild-shut');
   button.disabled=true;
   try{await rebuild()}catch(e){feedback(e.message)}finally{button.disabled=false}
 };
 async function save(form, action){
   if(saving)return;
   saving=true;
   const button=form.querySelector('button');
   button.disabled=true;
   try{
     feedback('Saving…');
     await action();
     find('rebuild-shut').hidden=false;
     await rebuild();
   }catch(e){feedback(e.message)}finally{button.disabled=false;saving=false}
 }
 find('archive-shut').onsubmit=event=>{
   event.preventDefault();
   const form=event.currentTarget,first=find('shut-start').value,last=find('shut-end').value;
   if(last<first){feedback('The last shift must fall on or after the first shift.');return}
   save(form,async()=>{
     const q=new URLSearchParams({label:find('shut-label').value.trim(),start:first,end:last,complete:find('shut-complete').checked?'1':'0'});
     await readJson(await fetch('/upload/shutdown-history?'+q,{method:'PUT',headers,body:find('shut-file').files[0]}));
     form.reset();
   });
 };
 find('confirm-shut').onsubmit=event=>{
   event.preventDefault();
   const form=event.currentTarget;
   save(form,async()=>{
     await readJson(await fetch('/upload/consumables-closeout',{method:'POST',headers:{...headers,'Content-Type':'application/json'},
       body:JSON.stringify({confirmed_by:'Andrew Fisher',confirmed_complete:find('closeout-name').checked,sales_as_at:salesStamp})}));
     find('confirm-shut').hidden=true;
     find('closeout-state').textContent='Closing export confirmed by Andrew Fisher.';
     form.reset();
   });
 };
})();
</script>
"""
