/* Author: Andrew Fisher. The dated source plan and its prerequisites; no implied completion. */
function cw2Plan803(u){
 const fieldWords = fields => Object.entries(fields || {}).map(([key, value]) => {
  const c = FCOL.find(x => x.programme_type === key);
  return esc(fmtQty(value, c ? c.unit : '')) + ' ' + esc(c ? c.name_as_written : key);
 }).join('<br>') || '<span class="todo">No quantity supplied</span>';
 const conflict = id => (u.conflicts || []).find(x => x.id === id);
 const checks = row => typeof sequence803TaskChecks === 'function' ? sequence803TaskChecks(row) : (row.requirements || []).map(x => '<li><b>' + (x.kind === 'hold' ? 'Before starting: ' : x.kind === 'condition' ? 'Condition: ' : 'Check: ') + '</b>' + esc(x.text) + ' <span class="w">(p. ' + esc(x.page) + ')</span></li>').join('');
 return `<style>[data-cw2-plan803] .tblwrap td:first-child,[data-cw2-plan803] .tblwrap th:first-child{position:static;box-shadow:none}</style><div class="planupd" data-cw2-plan803><h3>${esc(u.title)} — ${esc(u.created_display)}</h3>
 <p class="cw2basis803">${esc(u.basis)}</p>
 <p class="cw2source803"><a href="${esc(dpFileUrl('05_CW2_Fencing_Installation_Plan.pdf'))}" target="_blank" rel="noopener">${esc(u.file)}</a> · ${u.pages} pages. Work is grouped by its scheduled day. Only the dependencies stated in the plan determine the order within a day. A checklist confirmation is not a completion docket.</p>
 ${(u.rows_by_day || []).map(day => `<div class="sect">${esc(fmtDate(day.date))}</div>${day.date === '2026-10-05' ? '<p class="notice warn"><b>Public holiday — site closed.</b> No fencing works scheduled.</p>' : `<div class="tblwrap"><table class="daytbl"><thead><tr><th>Work</th><th>Planned quantity</th><th>Before starting / conditions</th></tr></thead><tbody>${day.rows.map(row => `<tr data-cw2-task803="${esc(row.id)}"><td><b>${esc(row.location)}</b><br>${esc(row.description)}<br><span class="w">Source p. ${esc(row.page)}</span></td><td>${fieldWords(row.fields)}${(row.conflicts || []).map(id => { const c=conflict(id); return c ? `<div class="notice warn"><b>Awaiting confirmation</b><br>${esc(c.summary)}<br>${esc(c.detail)}</div>` : ''; }).join('')}</td><td>${row.note ? `<p>${esc(row.note)}</p>` : ''}${(row.requirements || []).length ? `<ul class="hublist compact">${checks(row)}</ul>` : '<span class="w">No additional prerequisite stated.</span>'}</td></tr>`).join('')}</tbody></table></div>`}`).join('')}
 <details class="pdetail"><summary>Earlier programme totals — source history</summary><div class="tblwrap"><table class="daytbl"><thead><tr><th>Day</th><th>Earlier programme</th><th>Current weekly summary</th></tr></thead><tbody>${u.differences.map(x=>`<tr><td>${esc(fmtDate(x.date))}</td><td>${fieldWords(x.programme)}</td><td>${fieldWords(x.plan)}</td></tr>`).join('')}</tbody></table></div></details>
 </div>`;
}
function planUpdateCard(u){ return u && u.code === 'C2' && u.revision === '2026-10-02' ? cw2Plan803(u) : planUpdateCardBefore803(u); }
