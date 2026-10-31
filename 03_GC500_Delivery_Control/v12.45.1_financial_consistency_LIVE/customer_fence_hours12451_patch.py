"""Author: Andrew Fisher. Project documented fencing hours once in the shared scope."""
from pathlib import Path
ROOT=Path(__file__).resolve().parent

def patch(text,rep,path):
    anchor='function scopeFigures(){'
    text=rep(text,anchor,(ROOT/'customer_fence_hours12451.js').read_text()+'\n'+anchor,'shared customer fencing hours',path)
    anchor=" const atV = safeNum((S.rates || {})['scope-at'], MAX_RATE);"
    source=""" /* The native documented-hours reader already uses RENDER_MEMO and its normal invalidation.
    Do not call RaceCrew1227.model here: that supplier model reads scopeFigures. */
 const fence12451=lines.findIndex(row=>row.key==='fence');
 if(fence12451>=0)lines[fence12451]=CustomerFenceHours12451.project(lines[fence12451],typeof Workforce1010!=='undefined'?EventCrew1237.model():null,EventCrew1237.product);
"""
    text=rep(text,anchor,source+anchor,'documented aggregate before scope totals',path)
    anchor='api.scopeRows=function(line,ro){'
    source="""api.scopeRows=function(line,ro){
 if(line.customer_hours12451||line.customer_hours_review12451){
  const original={...line,hours:line.scope_hours12451,amount:line.scope_amount12451,amount_exact:line.scope_amount_exact12451,customer_hours12451:false,customer_hours_review12451:null};
  const plan=api.scopeRows(original,true),columns=line.days.length+3;
  const rate=ro?esc(money(line.rate)):'<input class="rate scopein" inputmode="decimal" data-scope="rate|fence|" value="'+(line.rate_typed?esc(String(line.rate)):'')+'" placeholder="'+esc(String(line.rate))+'" aria-label="Customer fencing rate per person per hour">';
  const review=line.customer_hours_review12451;
  return '<tr data-scope-line="fence" data-customer-hours12451><td colspan="'+columns+'"><div style="max-width:19rem"><b>Fencing — '+(review?'customer hours need review':'documented contractor hours')+'</b><div class="ln" style="display:flex;justify-content:space-between;gap:.5rem;align-items:baseline"><span class="lb">Customer hours</span><span class="amt">'+(review?'—':esc(EventCrew1237.hoursText(line.hours))+' h')+'</span></div><div class="ln" style="display:flex;justify-content:space-between;gap:.5rem;align-items:baseline"><span class="lb">Charge to V8s</span><span class="amt"><b>'+(review?'Needs review':esc(money(line.amount)))+'</b></span></div><div class="ln" style="display:flex;justify-content:space-between;gap:.5rem;align-items:baseline"><span class="lb">Rate per hour</span><span class="amt">'+rate+'</span></div><p class="'+(review?'norate':'hint')+'">'+(review?esc(review):'Approved customer total from the recorded crew evidence. No daily or individual customer split is supplied.')+'</p></div></td></tr>'+
   '<tr><td colspan="'+columns+'"><details class="sfold" data-sfold="scope|fencing-plan12451"><summary>Original scope plan — reference only</summary><div class="sfoldbody"><p>These planned staffing hours are retained as source evidence. They are not the customer hours charged above.</p><div class="tblwrap"><table class="progtbl scopetbl"><tbody>'+plan+'</tbody></table></div></div></details></td></tr>';
 }
"""
    text=rep(text,anchor,source,'distinguish customer aggregate from retained staffing plan',path)
    old="${F.edits ? F.edits + ' change' + (F.edits === 1 ? '' : 's') : 'as the scope has it'}"
    new="${F.lines.some(line=>line.customer_hours_review12451) ? 'customer hours need review' : F.lines.some(line=>line.customer_hours12451) ? 'documented fencing hours' : F.edits ? F.edits + ' change' + (F.edits === 1 ? '' : 's') : 'as the scope has it'}"
    text=rep(text,old,new,'effective customer hours label',path)
    return text
