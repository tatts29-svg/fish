# Author: Andrew Fisher. v8.68 Home branch: every person carries the branch code they belong to, and the Finance handover shows
# the wages by home branch and where each branch's labour cost belongs (the branch the revenue is in).
# Andrew (6 Oct 2026): "Every person belongs to a branch code ... KINP is the branch code, I've got more coming."
import hashlib, os, sys
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep as replace
p = Path(sys.argv[1])
BASES = {'5a2dd2183464b488bc1c04577d4831c78f2e898846e0af9c5464953318bbd6a5': 'v8.67'}  # live v8.67
h = hashlib.sha256(p.read_bytes()).hexdigest()
assert h in BASES, 'Wrong live base ' + h
s = p.read_text(encoding='utf-8-sig')
def rep(a, b, what):
    global s
    s = replace(s, a, b, what, str(p))

# B1. A PERSON LINE CARRIES A HOME BRANCH. A branch-typed field on the person (normBranch on save), so the Costs tab's person
# form, the running sheet and the Finance handover all read the one value.
rep(" {name: 'charged_as', label: 'Charged as on race weekend', type: 'role'},\n {name: 'note', label: 'Note', type: 'text', wide: true}]},\n];",
    " {name: 'charged_as', label: 'Charged as on race weekend', type: 'role'},\n {name: 'branch', label: 'Home branch', type: 'branch'}, /* v8.68 */\n {name: 'note', label: 'Note', type: 'text', wide: true}]},\n];", 'B1 person field')

# B2. THE RUNNING SHEET. Under each person's employment group, the home branch: a box for the edit link (a list of the job's
# branch codes, any code can be typed), the code itself for a view link. The whole-job roster table prints it beside the group.
rep("<td>${ed ? `<select data-rstype=\"${n}\" aria-label=\"Type for ${n}\">${['', 'cna', 'hire', 'salary'].map(t => `<option value=\"${t}\"${r.type === t ? ' selected' : ''}>${t ? RUN_TYPE_WORD[t] : '—'}</option>`).join('')}</select>` : esc(RUN_TYPE_WORD[r.type])}</td>",
    "<td>${ed ? `<select data-rstype=\"${n}\" aria-label=\"Type for ${n}\">${['', 'cna', 'hire', 'salary'].map(t => `<option value=\"${t}\"${r.type === t ? ' selected' : ''}>${t ? RUN_TYPE_WORD[t] : '—'}</option>`).join('')}</select><br><input data-rsbranch=\"${n}\" list=\"rsBranches868\" value=\"${esc(personBranch868(r.name) || '')}\" placeholder=\"branch\" maxlength=\"6\" style=\"width:70px;margin-top:3px;text-transform:uppercase\" aria-label=\"Home branch for ${n}\">` : esc(RUN_TYPE_WORD[r.type]) + (personBranch868(r.name) ? `<br><b class=\"mono\">${esc(personBranch868(r.name))}</b>` : '')}</td>",
    'B2a day cell')
rep('<th>Employment group</th><th>Start</th>', '<th>Employment group · home branch<datalist id="rsBranches868">${fh866Branches().map(b => `<option value="${esc(b)}">`).join(\'\')}</datalist></th><th>Start</th>', 'B2b day header')
rep("${T.rows.map(x => `<tr><td><b>${esc(x.name)}</b></td><td>${esc(RUN_TYPE_WORD[x.type])}</td>",
    "${T.rows.map(x => `<tr><td><b>${esc(x.name)}</b></td><td>${esc(RUN_TYPE_WORD[x.type])}${personBranch868(x.name) ? ` · <b class=\"mono\">${esc(personBranch868(x.name))}</b>` : ''}</td>", 'B2c roster totals')
rep("pane.querySelectorAll('[data-rstype]').forEach(s => s.onchange = () => { setOurPerson(s.dataset.rstype, {type: RUN_TYPE_STORE[s.value] || ''}); render(); });",
    "pane.querySelectorAll('[data-rstype]').forEach(s => s.onchange = () => { setOurPerson(s.dataset.rstype, {type: RUN_TYPE_STORE[s.value] || ''}); render(); });\n pane.querySelectorAll('[data-rsbranch]').forEach(i => i.onchange = () => { const b = normBranch(i.value); if (b && !/^[A-Z]{2,6}$/.test(b)) { flash('A branch code is 2 to 6 letters, for example KINP.'); return; } if (setOurPerson(i.dataset.rsbranch, {branch: b || ''})) render(); }); /* v8.68 */",
    'B2d handler')

# B3. THE HELPERS AND THE HANDOVER. Wages by person with each person's home branch, and the labour cost moved from the home
# branch to the branch the revenue is in (the labour per piece on each branch) - the journal Finance asked for.
rep("function fh866Branches(){", r"""/* v8.68 HOME BRANCH */
function personBranch868(name){ const n = String(name || '').trim().toLowerCase(); const P = ourCosts().find(c => c.kind === 'person' && String(c.person || '').trim().toLowerCase() === n); return P ? (normBranch(P.branch || '') || null) : null; }
function fh868People(labW){
 const today = todayIso(), r2 = n => Math.round((n + Number.EPSILON) * 100) / 100, by = new Map();
 const get = n => { if (!by.has(n)) by.set(n, {person: n, home: personBranch868(n), paid: 0, unpriced: 0, toDate: 0, toCome: 0}); return by.get(n); };
 try { fin745Rows(today).forEach(r => { const g = get(r.person), cost = r.status === 'confirmed' && r.actualCost != null ? r.actualCost : r.calculatedCost, past = r.date && r.date <= today && r.status !== 'forecast';
 g.paid += Number(r.paid) || 0; if (cost == null) g.unpriced += Number(r.paid) || 0; else if (past) g.toDate += cost; else g.toCome += cost; }); } catch (e) {}
 const allow = typeof labourAllowance858 === 'function' ? labourAllowance858() : 0;
 if (allow) { const who = [...by.keys()].find(n => typeof rosterAllowance859 === 'function' && rosterAllowance859(n)); const g = who ? by.get(who) : get('Salary allowance'); g.allowance = allow; g.toCome += allow; }
 const rows = [...by.values()].map(g => Object.assign(g, {paid: r2(g.paid), unpriced: r2(g.unpriced), toDate: r2(g.toDate), toCome: r2(g.toCome), job: r2(g.toDate + g.toCome)})).filter(g => g.paid || g.job).sort((a, b) => b.job - a.job || a.person.localeCompare(b.person));
 const homes = [...new Set(rows.map(g => g.home || '—'))].sort((a, b) => a === '—' ? 1 : b === '—' ? -1 : a.localeCompare(b));
 const byHome = {}; rows.forEach(g => { const k = g.home || '—'; byHome[k] = r2((byHome[k] || 0) + g.job); });
 const move = {}; rows.forEach(g => { const k = g.home || '—'; const sp = fh866Split(g.job, labW); move[k] = move[k] || {}; Object.entries(sp).forEach(([b, v]) => { move[k][b] = r2((move[k][b] || 0) + v); }); });
 const revCols = [...new Set(Object.values(move).flatMap(o => Object.keys(o)))].sort((a, b) => a === '—' ? 1 : b === '—' ? -1 : a.localeCompare(b));
 const total = r2(rows.reduce((s, g) => s + g.job, 0)), set = rows.filter(g => g.home).length;
 return {rows, homes, byHome, move, revCols, total, set, toDate: r2(rows.reduce((s, g) => s + g.toDate, 0)), toCome: r2(rows.reduce((s, g) => s + g.toCome, 0))};
}
function fh866Branches(){""", 'B3a helpers')
rep("s.add('NOIS');", "s.add('NOIS'); try { ourCosts().forEach(c => { if (c.kind === 'person' && c.branch) s.add(normBranch(c.branch)); }); } catch (e) {} /* v8.68 - every person's home branch */", 'B3b branch list')
rep(" const costCheck = near(costTotal.job, r2((X.job || 0) + (W.job || 0))) && costs.every(r => near(r.job, r2(Object.values(r.by).reduce((s, v) => s + v, 0))));",
    " const costCheck = near(costTotal.job, r2((X.job || 0) + (W.job || 0))) && costs.every(r => near(r.job, r2(Object.values(r.by).reduce((s, v) => s + v, 0))));\n const people = fh868People(labW), peopleCheck = near(people.total, r2(W.job || 0)); /* v8.68 */", 'B3c model')
rep(" return {asAt: today, pos, poSum, receiptedSum, notConfirmed, counts, noValue, cols, FBR, TBR, labShare, costs,",
    " return {asAt: today, people, peopleCheck, pos, poSum, receiptedSum, notConfirmed, counts, noValue, cols, FBR, TBR, labShare, costs,", 'B3d model out')
rep('<p class="fin745-basis">Fencing on ${esc(H.FBR)}',
    r"""${(() => { const P = H.people; if (!P || !P.rows.length) return ''; const hn = b => b === '—' ? 'Not set' : b;
 return `<h4 class="fh868-h">Wages by person — home branch</h4><div class="fin745-table fh866-table"><table><thead><tr><th>Person</th><th>Home branch</th><th class="num">Paid hours</th><th class="num">Hours not priced</th><th class="num">To date</th><th class="num">To come</th><th class="num">To job end</th></tr></thead><tbody>
 ${P.rows.map(g => `<tr><td><b>${esc(g.person)}</b>${g.allowance ? `<br><span class="w fh866-mute">incl. salary allowance ${esc(money0(g.allowance))}</span>` : ''}</td><td>${g.home ? `<b class="mono">${esc(g.home)}</b>` : '—'}</td><td class="num">${esc(fmtNum(g.paid))}</td><td class="num">${g.unpriced ? esc(fmtNum(g.unpriced)) : '—'}</td><td class="num">${g.toDate ? esc(money0(g.toDate)) : '—'}</td><td class="num">${g.toCome ? esc(money0(g.toCome)) : '—'}</td><td class="num"><b>${g.job ? esc(money0(g.job)) : '—'}</b></td></tr>`).join('')}
 <tr class="acc761-tot"><td colspan="4">Total — ${esc(fmtNum(P.set))} of ${esc(fmtNum(P.rows.length))} with a home branch</td><td class="num"><b>${esc(money0(P.toDate))}</b></td><td class="num"><b>${esc(money0(P.toCome))}</b></td><td class="num"><b>${esc(money0(P.total))}</b></td></tr>
 </tbody></table></div>
 <h4 class="fh868-h">Wages — from the home branch to the branch the revenue is in</h4><div class="fin745-table fh866-table"><table><thead><tr><th>Home branch</th>${P.revCols.map(b => `<th class="num">${esc(hn(b))}</th>`).join('')}<th class="num">Total</th></tr></thead><tbody>
 ${P.homes.filter(k => P.byHome[k]).map(k => `<tr><td><b>${esc(hn(k))}</b></td>${P.revCols.map(b => { const v = (P.move[k] || {})[b]; return `<td class="num${k === b ? ' fh868-same' : ''}">${v ? esc(money0(v)) : '—'}</td>`; }).join('')}<td class="num"><b>${esc(money0(P.byHome[k] || 0))}</b></td></tr>`).join('')}
 <tr class="acc761-tot"><td>Total</td>${P.revCols.map(b => `<td class="num"><b>${esc(money0(P.homes.reduce((s, k) => s + ((P.move[k] || {})[b] || 0), 0)))}</b></td>`).join('')}<td class="num"><b>${esc(money0(P.total))}</b></td></tr>
 </tbody></table></div>`; })()}
 <p class="fin745-basis">Fencing on ${esc(H.FBR)}""", 'B3e page')
rep(" rows.push(['3. Demob forecast by branch', 'Demob cost'].concat(H.cols.map(cn), ['Total']));",
    r""" if (H.people && H.people.rows.length) { rows.push(['2b. Wages by person', 'Person', 'Home branch', 'Paid hours', 'Hours not priced', 'To date AUD', 'To come AUD', 'To job end AUD']);
 H.people.rows.forEach(g => rows.push(['Wages', g.person, g.home || '', g.paid, g.unpriced, g.toDate, g.toCome, g.job]));
 rows.push(['Wages total', '', '', '', '', H.people.toDate, H.people.toCome, H.people.total], []);
 rows.push(['2c. Wages from home branch to revenue branch', 'Home branch'].concat(H.people.revCols.map(cn), ['Total']));
 H.people.homes.filter(k => H.people.byHome[k]).forEach(k => rows.push(['Wages move', k === '—' ? 'Not set' : k].concat(H.people.revCols.map(b => (H.people.move[k] || {})[b] || 0), [H.people.byHome[k] || 0]))); rows.push([]); }
 rows.push(['3. Demob forecast by branch', 'Demob cost'].concat(H.cols.map(cn), ['Total']));""", 'B3f csv')
rep(" L.push(''); L.push(`3. Demob forecast by branch ${money(H.demobTotal)}",
    r""" if (H.people && H.people.rows.length) { L.push(''); L.push(`Wages by home branch, to job end ${money(H.people.total)}: ${H.people.homes.filter(k => H.people.byHome[k]).map(k => `${k === '—' ? 'Not set' : k} ${money(H.people.byHome[k] || 0)}`).join(' · ')}`);
 H.people.rows.forEach(g => L.push(`  ${g.person} — ${g.home || 'home branch not set'} — ${money(g.job)}`)); }
 L.push(''); L.push(`3. Demob forecast by branch ${money(H.demobTotal)}""", 'B3g copy text')

rep('<style id="flicker863">', """<style id="homebranch868">
/* v8.68 Home branch */
#handover866 .fh868-h{margin:16px 0 4px;font-size:14px}
#handover866 td.fh868-same{background:#eef6f0}
</style>
<style id="flicker863">""", 'B4 style')
rep('· v8.67', '· v8.68', 'footer version')
p.write_text(s, encoding='utf-8-sig')
