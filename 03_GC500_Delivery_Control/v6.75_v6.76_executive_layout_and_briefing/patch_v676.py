#!/usr/bin/env python3
"""v6.76 - THE EXECUTIVE BRIEFING (the executive audit, section 8): five scenes for the CEO, from one frozen snapshot.

  1 The job at a glance      - what Coates is delivering, the reporting time, three defensible outcomes, exceptions
  2 Progress on the ground   - the latest drop photographs from the record, each with its reference and when it was
                               recorded (the illustrative banner is never passed off as evidence)
  3 The next seven days      - the days, what is due in and out, fencing types behind, the next milestone
  4 Commercial control       - client charges, known supplier costs, the difference so far - called forecast
                               incomplete, never margin - what is missing and the lines to settle
  5 The team and the ask     - who is running it and who is putting it in, then at most three decisions

  * Every figure is read once, when the briefing opens, and the time is printed on every scene; a record that
    changes while it is open does not change a number halfway through.
  * Manual advance by default (arrows, space, the buttons); Escape or Close returns focus where it was. No sound,
    no 3D, no live third-party call - it works on any screen. The ten-scene showcase stays as it was.

  python3 patch_v676.py <page.html> [builder.py]
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from patch_v669 import rep  # noqa: E402

JS = r"""/* v6.76 - THE EXECUTIVE BRIEFING. Five scenes, one frozen snapshot, advanced by hand. */
const BRIEF = {open: false, i: 0, snap: null, ret: null, onKey: null, inert: []};
const BRIEF_TITLES = ['The job at a glance', 'Progress on the ground', 'The next seven days', 'Commercial control', 'The team and the ask'];
function briefSnapshot(){
 const at = new Date(), asOf = todayIso();
 const F = execFacts(asOf), C = F.C, A = F.A, M = F.M;
 const stamp = `${fmtDate(asOf)} · ${timeOfStamp(at.toISOString())} Gold Coast time`;
 const pd = programmeDay(asOf);
 const Fm = fenceMetres(F.P);
 const exc = F.gaps.length + (A.overdue ? 1 : 0) + F.bdOpen.length;
 const big = (v, l, s) => `<div class="brfig"><b>${v}</b><span>${esc(l)}</span>${s ? `<em>${esc(s)}</em>` : ''}</div>`;
 const scenes = [];
 /* 1 - the job at a glance */
 scenes.push(`<p class="brk">${esc(DATA.brand.org)} · ${esc(DATA.event.name)}</p>
 <h2 class="brh">Where the job stands</h2>
 <p class="brl">${esc(pd ? pd.short : '')}${(DATA.race_days || [])[0] ? ` · event opens ${esc(fmtDate(DATA.race_days[0]))}` : ''}</p>
 <div class="brfigs">
 ${big(C.plan ? `${fmtNum(C.onDue)}<small>/${fmtNum(C.plan)}</small>` : '—', 'units due by today recorded on site', `${fmtNum(A.onsite)} of ${fmtNum(A.due)} references`)}
 ${big(fmtNum(C.on), 'units recorded on site so far', C.refsNoQty ? `of ${fmtNum(C.quantified)} quantified + ${fmtNum(C.refsNoQty)} references awaiting quantity` : `of ${fmtNum(C.all)} on the job`)}
 ${big(`${fmtNum(Fm.done)}<small> m</small>`, 'fence work on dockets', `of ${fmtNum(Fm.total)} m on the 2026 programme`)}
 </div>
 <p class="brnote${exc ? ' bad' : ''}"><b>${fmtNum(exc)}</b> exception${exc === 1 ? '' : 's'} today — ${esc([F.gaps.length ? `${F.gaps.length} fencing type${F.gaps.length === 1 ? '' : 's'} behind the programme` : 'fencing on the programme', `${fmtNum(A.overdue || 0)} overdue reference${A.overdue === 1 ? '' : 's'}`, `${F.bdOpen.length} open breakdown${F.bdOpen.length === 1 ? '' : 's'}`].join(' · '))}</p>`);
 /* 2 - progress on the ground: the record's own photographs, newest first, one per reference */
 const seen = new Set(), shots = Object.entries(S.dropPhotos || {}).flatMap(([k, r]) => (r.photos || []).filter(p => p && p.id).map(p => ({k, p})))
 .sort((x, y) => String(y.p.at || '').localeCompare(String(x.p.at || ''))).filter(x => { if (seen.has(x.k)) return false; const u = dropPhotoUrl(x.p); if (!u) return false; x.u = u; seen.add(x.k); return true; }).slice(0, 3);
 scenes.push(`<p class="brk">Evidence behind the numbers</p><h2 class="brh">Progress on the ground</h2>
 ${shots.length ? `<div class="brshots">${shots.map(x => { const a = assetOf(x.k) || {}; return `<figure><img src="${esc(x.u)}" alt="${esc(x.k + ' on site')}" loading="eager" decoding="async"><figcaption><b>${esc(x.k)}</b> ${esc((a.item_types || []).join(', ') || a.product || '')}<br><span>recorded ${esc(fmtStamp(x.p.at || ''))}${x.p.by ? ' by ' + esc(x.p.by) : ''}</span></figcaption></figure>`; }).join('')}</div>
 <p class="brl sm">The latest drop photographs on the record, one per reference. The time is when the photograph was recorded here.</p>`
 : `<p class="brl">No drop photograph is available to this page yet. The record holds ${fmtNum(Object.values(S.dropPhotos || {}).reduce((s, r) => s + ((r.photos || []).length), 0))} photograph${Object.keys(S.dropPhotos || {}).length === 1 ? '' : 's'} — open Documents › Photos on the hosted page.</p>`}`);
 /* 3 - the next seven days */
 scenes.push(`<p class="brk">How the team is controlling delivery</p><h2 class="brh">The next seven days</h2>
 <div class="brcols"><div>${execNext7(asOf)}</div>
 <div><h4>Fencing behind the programme</h4>${F.gaps.length ? `<ul class="brlist">${F.gaps.map(g => `<li><b>${esc(fenceGapName(g))}</b> ${esc(fmtNum(g.short))}${g.unit === 'm' ? ' m' : ''} short <span>${esc(fmtNum(g.done))} of ${esc(fmtNum(g.planned))}${g.unit === 'm' ? ' m' : ''} due by today</span></li>`).join('')}</ul>` : '<p class="brl sm">Every fencing type is on the programme by today.</p>'}</div></div>`);
 /* 4 - commercial control */
 scenes.push(`<p class="brk">What is known, and what needs settling</p><h2 class="brh">Commercial control</h2>
 ${M ? `<div class="brfigs">
 ${big(esc(money0(M.charge.total) || '—'), 'client charges (ex GST)', 'the contracts by the rate, fencing dockets, event labour scope')}
 ${big(esc(money0(M.cost.known) || '—'), 'supplier costs known so far', 'recorded costs — not every cost is in yet')}
 ${big(esc(M.difference0 < 0 ? '−' + money0(-M.difference0) : money0(M.difference0)), 'difference so far', 'not a margin: forecast incomplete')}
 </div>
 <p class="brnote"><b>Forecast incomplete.</b> ${esc(M.missing_short.join(' · '))}.</p>
 ${M.charge.contracts_differs ? `<p class="brl sm">${M.charge.contracts_differs} contract lines where Baseplan's prebill differs from the rule: ${esc(money0(M.charge.differs_charge))} by the rule, ${esc(money0(M.charge.differs_prebill))} prebilled — counted by the rule until each is settled, not netted.</p>` : ''}` : '<p class="brl">The commercial summary could not be read.</p>'}`);
 /* 5 - the team and the ask */
 const people = (DATA.team || {}).people || [], crew = crewCount();
 const lead = people.filter(p => p.group !== 'fencing' && p.group !== 'other').slice(0, 4);
 const D = execDecisions(F);
 scenes.push(`<p class="brk">Coates on the Gold Coast</p><h2 class="brh">The team, and the ask</h2>
 <div class="brcols"><div><h4>Running it</h4><ul class="brlist">${lead.map(p => `<li><b>${esc(p.name)}</b> <span>${esc(p.title || p.role || '')}</span></li>`).join('')}</ul>
 <p class="brl sm">${fmtNum(crew.coates)} Coates people and ${fmtNum(crew.fencing)} from Advanced Temporary Fencing on the record.</p></div>
 <div><h4>Decisions needed</h4>${D.length ? `<ol class="brlist">${D.map(d => `<li><b>${esc(d.what)}</b> <span>${esc(d.why)}</span><span>Owner to confirm · due to confirm</span></li>`).join('')}</ol>` : '<p class="brl sm">No decision is waiting on this record.</p>'}</div></div>`);
 return {at, asOf, stamp, scenes};
}
function briefEl(){
 let el = document.getElementById('brief'); if (el) return el;
 el = document.createElement('div'); el.id = 'brief'; el.className = 'brief'; el.hidden = true;
 el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'briefT');
 el.innerHTML = `<div class="brtop"><span class="brbrand">GC500 <i>2026</i> · Executive briefing</span><span class="brstamp" id="briefStamp"></span><button type="button" class="brx" id="briefClose">Close</button></div>
 <div class="brstage"><h1 class="vh" id="briefT">Executive briefing</h1><div class="brbody" id="briefBody" tabindex="-1"></div></div>
 <div class="brnav"><button type="button" class="brb" id="briefPrev">← Back</button><span class="brpos" id="briefPos" aria-live="polite"></span><button type="button" class="brb pri" id="briefNext">Next →</button></div>`;
 document.body.appendChild(el);
 el.querySelector('#briefClose').onclick = briefClose;
 el.querySelector('#briefPrev').onclick = () => briefMove(-1);
 el.querySelector('#briefNext').onclick = () => briefMove(1);
 return el;
}
function briefRender(){
 const el = briefEl(), s = BRIEF.snap, n = s.scenes.length;
 const body = el.querySelector('#briefBody');
 body.classList.remove('in'); body.innerHTML = s.scenes[BRIEF.i]; void body.offsetWidth; body.classList.add('in');
 el.querySelector('#briefStamp').textContent = 'Snapshot ' + s.stamp + ' — figures frozen for this briefing';
 el.querySelector('#briefPos').textContent = `${BRIEF.i + 1} / ${n} · ${BRIEF_TITLES[BRIEF.i] || ''}`;
 el.querySelector('#briefPrev').disabled = BRIEF.i === 0;
 const nx = el.querySelector('#briefNext'); nx.textContent = BRIEF.i === n - 1 ? 'Finish' : 'Next →';
 try { body.focus({preventScroll: true}); } catch (e) {}
}
function briefMove(d){ const n = BRIEF.snap.scenes.length, to = BRIEF.i + d; if (to >= n) { briefClose(); return; } if (to < 0) return; BRIEF.i = to; briefRender(); }
function briefOpen(){
 if (BRIEF.open) return;
 try { BRIEF.snap = briefSnapshot(); } catch (e) { flash('The briefing could not be put together: ' + ((e && e.message) || e)); return; }
 BRIEF.open = true; BRIEF.i = 0; BRIEF.ret = (document.activeElement && document.activeElement !== document.body) ? document.activeElement : (window.event && window.event.target && window.event.target.closest ? window.event.target.closest('[data-brief]') : null);
 const el = briefEl(); el.hidden = false; document.body.classList.add('briefing');
 BRIEF.inert = [...document.body.children].filter(x => x !== el && x.id !== 'flash' && x.tagName !== 'SCRIPT' && !x.hasAttribute('inert'));
 BRIEF.inert.forEach(x => { try { x.setAttribute('inert', ''); } catch (e) {} });
 BRIEF.onKey = ev => { if (!BRIEF.open) return;
 if (ev.key === 'Escape') { ev.preventDefault(); briefClose(); return; }
 if (ev.key === 'ArrowRight' || ev.key === 'PageDown' || (ev.key === ' ' && !/^(BUTTON|A)$/.test((ev.target || {}).tagName || ''))) { ev.preventDefault(); briefMove(1); return; }
 if (ev.key === 'ArrowLeft' || ev.key === 'PageUp') { ev.preventDefault(); briefMove(-1); } };
 document.addEventListener('keydown', BRIEF.onKey);
 briefRender();
}
function briefClose(){
 if (!BRIEF.open) return;
 BRIEF.open = false; const el = briefEl(); el.hidden = true; document.body.classList.remove('briefing');
 BRIEF.inert.forEach(x => { try { x.removeAttribute('inert'); } catch (e) {} }); BRIEF.inert = [];
 if (BRIEF.onKey) { document.removeEventListener('keydown', BRIEF.onKey); BRIEF.onKey = null; }
 let r = BRIEF.ret; BRIEF.ret = null; if (!r || r === document.body || !document.contains(r)) r = document.querySelector('.pane.on [data-brief]');
 if (r && r.focus) try { r.focus({preventScroll: true}); } catch (e) {}
}
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-brief]'); if (b) { e.preventDefault(); briefOpen(); } });
function renderToday(){"""

CSS = """
/* v6.76 - the executive briefing */
.brief{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;background:#f7f4f1;color:var(--ink)}
.brief[hidden]{display:none}
.brtop{display:flex;align-items:center;gap:16px;padding:12px 22px;background:linear-gradient(180deg,var(--hdr),var(--hdr-2));color:#f3ece6;border-bottom:3px solid var(--orange)}
.brbrand{font-weight:800;letter-spacing:.04em} .brbrand i{font-style:normal;color:var(--orange)}
.brstamp{font-size:12.5px;color:#d9cfc6;margin-left:auto}
.brx,.brb{font:inherit;font-size:14px;border-radius:8px;padding:8px 16px;cursor:pointer;border:1px solid var(--rule);background:#fff;color:var(--ink)}
.brx{background:transparent;color:#f3ece6;border-color:rgba(255,255,255,.35)}
.brb.pri{background:var(--orange-ink);border-color:var(--orange-ink);color:#fff;font-weight:700}
.brb:disabled{opacity:.4;cursor:default}
.brx:focus-visible,.brb:focus-visible{outline:3px solid var(--orange);outline-offset:2px}
.brstage{flex:1 1 auto;overflow:auto;display:flex;justify-content:center;padding:4vh 4vw}
.brbody{width:min(1180px,100%);outline:none}
.brbody.in{animation:brin .18s ease-out}
@keyframes brin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.brbody.in{animation:none}}
body.motion-off .brbody.in{animation:none}
.brk{margin:0 0 6px;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--orange-ink);font-weight:800}
.brh{margin:0 0 10px;font-size:clamp(28px,4.2vw,52px);line-height:1.05;font-weight:800;letter-spacing:-.01em}
.brl{font-size:clamp(15px,1.5vw,19px);color:var(--ink2);margin:0 0 18px;max-width:70ch} .brl.sm{font-size:14px;color:var(--mute)}
.brfigs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin:10px 0 18px}
.brfig{background:#fff;border:1px solid var(--rule);border-top:4px solid var(--orange);border-radius:12px;padding:16px 18px}
.brfig b{display:block;font-size:clamp(30px,4vw,54px);line-height:1.05;font-weight:800;font-variant-numeric:tabular-nums}
.brfig b small{font-size:.5em;font-weight:700;color:var(--ink2)}
.brfig span{display:block;font-size:15px;color:var(--ink);margin-top:4px}
.brfig em{display:block;font-style:normal;font-size:13px;color:var(--mute);margin-top:4px}
.brnote{font-size:16px;padding:12px 16px;border-radius:10px;background:#fff;border:1px solid var(--rule);border-left:4px solid #9aa1a8}
.brnote.bad{border-left-color:var(--red)}
.brcols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px;margin-top:8px}
.brcols h4{margin:0 0 8px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--slate)}
.brcols .xn7{font-size:16px} .brcols .xn7 td{padding:8px 8px}
.brlist{margin:0;padding-left:20px;font-size:16px} .brlist li{margin:0 0 10px} .brlist span{display:block;font-size:13.5px;color:var(--mute)}
.brshots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.brshots figure{margin:0;background:#fff;border:1px solid var(--rule);border-radius:12px;overflow:hidden}
.brshots img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover;background:var(--rule2)}
.brshots figcaption{padding:10px 12px;font-size:14px} .brshots figcaption span{font-size:12.5px;color:var(--mute)}
.brnav{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 22px;border-top:1px solid var(--rule);background:#fff}
.brpos{font-size:14px;color:var(--ink2);font-weight:600}
@media (max-width:760px){ .brfigs,.brcols,.brshots{grid-template-columns:1fr} .brstamp{display:none} .brstage{padding:18px 16px} }
.livediag{margin-top:6px;font-size:12px} .livediag summary{cursor:pointer;color:var(--mute)}
.showgo.briefgo{background:#fff;color:var(--ink);border:1px solid var(--rule)}
</style>"""


def patch(path, need):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    R = lambda old, new, what: rep(t, old, new, what, path, need)
    t = R("function renderToday(){", JS, 'brief js')
    t = R("""<button class="showgo" id="showStart" data-ro title="the job on a screen, for a room — it changes nothing">Start showcase <i>${SHOW_ORDER.length} scenes</i></button>""",
          """<button class="showgo briefgo" type="button" data-brief data-ro title="five scenes for an executive audience — one frozen snapshot, advanced by hand, no sound">Executive briefing <i>5 scenes</i></button>
 <button class="showgo" id="showStart" data-ro title="the job on a screen, for a room — it changes nothing">Start showcase <i>${SHOW_ORDER.length} scenes</i></button>""", 'brief button')
    t = R("""<button class="btn" role="menuitem" id="showcaseBtn\"""",
          """<button class="btn" role="menuitem" data-brief title="five scenes for an executive audience — one frozen snapshot, advanced by hand, no sound">Executive briefing</button>
       <button class="btn" role="menuitem" id="showcaseBtn\"""", 'brief menu')
    # S3 - a view that cannot start says so plainly; the setup detail is for editors (audit, section 9, item 5)
    t = R("""function liveMapNote(box, html, cls){
 let n = box.querySelector('.livenote');""", """function liveMapNote(box, html, cls){
 /* v6.76 - a viewer is told what it means for them, not how to configure a key; the raw reason stays one press away */
 if (cls === 'warn' && typeof capability === 'function' && capability() !== 'edit')
 html = '<b>This view is unavailable on this device right now.</b> The drawings and the 2D plan are unaffected — use them, or try again later. <details class="livediag"><summary>Technical detail</summary>' + html + '</details>';
 let n = box.querySelector('.livenote');""", 'liveMapNote')
    i = t.find('</style>')
    if i >= 0: t = t[:i] + CSS + t[i + len('</style>'):]
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))


if __name__ == '__main__':
    patch(sys.argv[1], True)
    if len(sys.argv) > 2: patch(sys.argv[2], False)
