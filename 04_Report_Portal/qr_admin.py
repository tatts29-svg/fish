"""Staff print station for MMG's two independent QR reports."""
from html import escape


def _milestones(notes):
    items = []
    for note in notes:
        pending = note["status"] == "pending"
        buttons = (("publish", "Publish"), ("decline", "Decline")) if pending else (("withdraw", "Withdraw"),)
        actions = "".join(f'<button type="button" data-action="{key}">{label}</button>' for key, label in buttons)
        items.append(f'<article class="milestone" data-id="{int(note["id"])}"><small>{escape(note["company_name"])} · '
                     f'{escape(note["date"])} · {"For review" if pending else "Published"}</small>'
                     f'<h3>{escape(note["title"])}</h3><p>{escape(note["description"])}</p>'
                     f'<div class="review-actions">{actions}</div></article>')
    return ('<section id="milestones"><h2>Company work milestones</h2>'
            '<p>Check the company, work date and description before publishing to its company report.</p>'
            + ("".join(items) or "<p>No milestones have been submitted.</p>")
            + '<p role="status" id="note-result"></p></section>')


def page(role, roster, notes=()):
    linked = int(roster.get("linked") or 0)
    if linked:
        status = f"{linked:,} worker{'s' if linked != 1 else ''} linked to a barcode."
    else:
        status = "The personal report is waiting for the MMG worker barcode roster."
    manager_form = """
      <form id="roster">
        <label for="file">MMG SiteIQ hirer roster (.xlsx)</label>
        <input id="file" type="file" required accept=".xlsx">
        <label class="confirm"><input type="checkbox" id="confirm" required>
          <span>I confirm this file is from MMG Dugald River and the badge numbers belong to these workers.</span></label>
        <button type="submit">Update worker barcodes</button>
        <p role="status" id="result"></p>
      </form>
      <details><summary>Which file can I use?</summary>
        <p>The MMG hirer roster needs the worker’s name, employer and card barcode or external ID. When the roster has no project sheet, only workers matched to the MMG records can be linked. A full roster replaces the earlier list.</p>
        <p>A SiteIQ On Hire export with the MMG project schedule and borrower barcodes can add workers currently holding gear. This updates barcode access and leaves the daily stock uploads separate.</p>
      </details>""" if role == "manager" else ""
    return ("""<!doctype html>
<html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>QR reports and posters · MMG Dugald River</title>
<style>
*{box-sizing:border-box}html{color-scheme:dark;font:100%/1.5 system-ui,sans-serif;background:#101621;color:#f1f4f7}body{margin:0}
header{border-bottom:2px solid #ff792c;background:#17202c}header div,main{max-width:62rem;margin:auto;padding:1rem clamp(1.1rem,4vw,2.5rem)}
header div{display:flex;gap:1rem;align-items:center;justify-content:space-between;flex-wrap:wrap}.brand{font-size:.9rem;font-weight:800;letter-spacing:.12em;color:#ffa36c}.site{color:#c7d4e2}
a{color:#ffad79;text-underline-offset:.2em}h1{font-size:clamp(2rem,5vw,3.25rem);line-height:1.1;letter-spacing:-.04em;margin:1.2rem 0 .6rem}h2{font-size:1.3rem;line-height:1.2;margin:0}
main>p,article p,.intro,details,.confirm{color:#c5d0df}.posters{display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,17rem),1fr));margin:1.5rem 0}
article,section{border:1px solid #394659;border-radius:.85rem;padding:1.35rem;background:#1a2430}article{display:flex;align-items:flex-start;flex-direction:column;border-top:4px solid #ff813b}article.personal{border-top-color:#72d9cb}article p{flex:1}
.button,button{display:inline-block;background:#ff8b45;color:#161b22;text-decoration:none;border:0;padding:.68rem 1rem;min-height:44px;line-height:1.3;font:inherit;font-weight:700;border-radius:.45rem;cursor:pointer}button:disabled{opacity:.65}
.personal .button{background:#8ae3d6}form{display:grid;gap:.7rem;justify-items:start;margin-top:1rem}form>label:first-child{font-weight:650}input[type=file]{font:inherit;max-width:100%}.confirm{display:flex;align-items:baseline;gap:.45rem}.confirm input{accent-color:#ff813b}
summary{cursor:pointer}details{margin-top:.75rem}#result:empty{display:none}#result{margin:.15rem 0}.roster-state{font-weight:650}.footer{margin:1.5rem 0 3rem}#milestones{margin-top:1rem}.milestone{margin-top:.8rem;background:#111923;border-top-width:1px}.milestone>*{margin:.3rem 0}.milestone p{overflow-wrap:anywhere}.review-actions{display:flex;gap:.5rem}.review-actions button:not([data-action=publish]){background:#354150;color:#e7ecf2}
</style></head><body><header><div><span class="brand">COATES <span class="site">/ MMG</span></span><span class="site">Dugald River · Shutdown Tool Store</span></div></header>
<main><h1>QR reports and posters</h1><p>Print each poster in colour on A4 at actual size. Each code opens its own report area.</p>
<div class="posters"><article><h2>Company on-hire report</h2><p>Scan the poster, choose a company and see its equipment and work history.</p><a class="button" href="/upload/report-qr/company.pdf">Download company poster</a></article>
<article class="personal"><h2>Personal on-hire report</h2><p>Workers scan the poster and enter their own barcode to see their gear and tool-store history.</p><a class="button" href="/upload/report-qr/personal.pdf">Download personal poster</a></article></div>
<section><h2>Worker barcode access</h2><p class="roster-state" id="roster-state">""" + escape(status) + """</p>""" + manager_form + """</section>""" + (_milestones(notes) if role == "manager" else "") + """
<p class="footer"><a href="/upload">Return to Update data</a></p></main>
<script>
const milestones=document.getElementById('milestones');
if(milestones)milestones.addEventListener('click',async event=>{
 const button=event.target.closest('button[data-action]');
 if(!button)return;
 const entry=button.closest('.milestone'), status=document.getElementById('note-result');
 const controls=entry.querySelectorAll('button');
 controls.forEach(b=>b.disabled=true);
 try{
  const response=await fetch('/upload/qr-work-review',{method:'POST',headers:{'Content-Type':'application/json','X-Portal':'1'},body:JSON.stringify({id:Number(entry.dataset.id),action:button.dataset.action})});
  const result=await response.json();
  if(!response.ok)throw Error(result.error||'Review could not be recorded.');
  location.reload();
 }catch(error){status.textContent=error.message;controls.forEach(b=>b.disabled=false)}
});
const form=document.getElementById('roster');
if(form)form.addEventListener('submit',async event=>{
 event.preventDefault();
 const button=form.querySelector('button'), result=document.getElementById('result');
 button.disabled=true;result.textContent='Checking roster…';
 try{
  const response=await fetch('/upload/qr-roster.xlsx',{method:'PUT',headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','X-Portal':'1','X-Confirm-MMG':document.getElementById('confirm').checked?'1':'0'},body:document.getElementById('file').files[0]});
  const answer=await response.json();
  if(!response.ok)throw Error(answer.error||'The roster could not be loaded.');
  document.getElementById('roster-state').textContent=answer.linked.toLocaleString('en-AU')+' workers linked to a barcode.';
  result.textContent='Roster saved.'+(answer.skipped?' '+answer.skipped+' rows could not be linked to a worker in the MMG records.':'');
  form.reset();
 }catch(error){result.textContent=error.message||'Upload did not finish. Please try again.'}finally{button.disabled=false}
});
</script></body></html>""").encode("utf-8")
