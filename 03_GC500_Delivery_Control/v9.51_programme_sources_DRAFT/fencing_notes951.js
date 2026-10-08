/* Author: Andrew Fisher. Read-only programme notes; no native status/record hooks. */
function fencingNotes951(){
 const f=DATA.fencing, review=f.source_review951;
 if(!review)return '';
 const rowHtml=r=>{
  const quantity=Object.entries(r.quantities||{}).filter(([,n])=>n!==0).map(([k,n])=>`${k}: ${n}`).concat((r.unquantified||[]).map(x=>`${x.type}: ${x.written} — to confirm`));
  const notes=(r.notes||[]).map(x=>x.text).concat(r.source_warnings||[]);
  return `<tr><td>${esc(r.date||r.date_as_written||'Date to confirm')}</td><td><b>${esc(r.location)}</b><br>${esc(r.description)}<br><small>${esc(r.source_range)}</small>${r.included?'':`<br><b>Held for review</b><br>${esc((r.held_reasons||[]).join('; '))}`}</td><td>${quantity.length?quantity.map(esc).join('<br>'):'Quantity not stated'}</td><td>${notes.length?notes.map(esc).join('<br>'):'—'}</td></tr>`;
 };
 return `<details class="fp-evidence" id="fencing-source951"><summary>Programme source &amp; task notes · 09 Oct</summary><div class="fp-evidence-body"><p><b>Planned work movements, including reused stock.</b> Task quantities are counted once. Subtotals and unreliable SUMMARY caches are excluded; blank/TBC quantities remain to confirm. These figures do not establish unique hire stock, costs or completed work.</p><p>The supplied workbook matches the 07 Oct cells. Eight self-referencing formulas and inherited future completion marks are retained only in the source evidence. Existing installation-plan figures keep precedence on their covered dates; signed dockets and site completion remain unchanged.</p><p><b>Carryovers:</b> DECON WK2 rows 65–67, Residents Fencing and Works on Roads still carry 2025 dates. No Parking Bollards lists sequencing/coordination assumptions; it does not confirm dates, quantities or bookings. Traffic-control and gate notes below are requirements, not confirmation they are arranged.</p>${(f.week_sheets||[]).map(w=>`<details class="fp-evidence"><summary>${esc(w.sheet)} · ${(w.programme_rows951||[]).length} source tasks${w.held_rows951?.length?` · ${w.held_rows951.length} held for review`:''}</summary><div class="fp-evidence-body"><p>${esc(w.totals_basis||'')}</p><div class="tblwrap" tabindex="0" aria-label="${esc(w.sheet)} programme task notes"><table><thead><tr><th>Date</th><th>Task / source</th><th>Known quantities</th><th>Access, gates and scope notes</th></tr></thead><tbody>${(w.programme_rows951||[]).map(rowHtml).join('')}</tbody></table></div></div></details>`).join('')}</div></details>`;
}

/* A source task may precede the label's Monday start (demob starts Sunday 25 Oct).
 * Read dates only; never move the task, docket, week mapping or actual completion. */
function fencingWeekStarted951(week, asOf){
 if(week.start && week.start<=asOf)return true;
 const sheet=progSheetOf(week.week);
 return !!(sheet?.rolled_forward && sheet.year===2026 && (sheet.days||[]).some(d=>/^2026-\d{2}-\d{2}$/.test(d.date)&&d.date<=asOf));
}
