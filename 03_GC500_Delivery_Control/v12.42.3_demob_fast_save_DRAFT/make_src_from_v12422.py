"""Make the v12.42.3 cards module (Demob saves quicker) from the v12.42.2 module.

    python3 make_src_from_v12422.py <v12.42.2 singles1238_src.js> <out singles1238_src.js>

What changes (Andrew, 27 Oct 2026, on site: "Delay when saving in demob can we make this quicker"), see README.md:
  1. the model of the cards is built inside the page's own asset hold, so the asset list is built once for it, not once per lookup;
     a model under 4 s old is reused only when nothing was saved since and the day's plan is the very one it was built from, as before
  2. a unit's Ready tick and a booking save through the page's own bump() inside that hold, and the Demob redraw bump() asks for
     puts right, in place, what that save changed (the cards of the references it wrote, and everything counted from them), instead
     of drawing all 401 cards again; any other redraw, and any save while the tab is not as last drawn, draws the whole tab as before
  3. the taps that read the model (the lights, Book pick-up, Book this load, the booking sheet's day, time and Save) run in that hold

Author: Andrew Fisher.
"""
import sys
src, out = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()

QUICK = r"""
/* ---- v12.42.3 - a quick save on the Demob tab (Andrew, 27 Oct 2026, on site: "Delay when saving in demob can we make this quicker").
   A unit's Ready tick and a booking write only that reference's unit ticks or bookings. The save is still the page's own bump(): the
   change is stored in this browser first and queued for the shared record, and its "Not saved" answer is read as before. The redraw
   bump() then asks for puts right, in place, the cards of the references that save wrote and everything counted from them: the
   counts, the group and section heads, the truck loads, the booked pick-ups, the day cards and today's Ready figure. It does that only
   while the tab shows the cards exactly as last drawn (the same view, day, branch and link, the same cards in the same places) and
   every other card's light and booking are as drawn; otherwise the whole tab is drawn as before. ---- */
let QUICK = null, DRAWN = null;
const cardSig = c => [c.st && c.st.s, c.st && c.st.at, c.st && c.st.by, c.st && c.st.why, c.book ? [c.book.at, c.book.set, c.book.note, c.book.by].join('^') : '', c.half || '', c.unk || 0].join('~');
const viewSig = day => (day ? 'day:' + day : 'all') + '|' + ((typeof DM816 === 'object' && DM816 && DM816.branch) || 'all') + '|' + (canEd() ? 'edit' : 'view');
/* what the cards were drawn from: the view and each card's light and booking */
function seen(list, day) { DRAWN = {sig: viewSig(day), cards: new Map(list.map(c => [c.key + '#' + c.uid, cardSig(c)]))}; }
/* the page's own save, inside the asset hold, with the references it writes named for the redraw */
function saveQuick(keys) { QUICK = {keys: new Set(keys)}; try { hold(() => bump()); } finally { QUICK = null; } }
const tpl = html => { const t = D.createElement('template'); t.innerHTML = html; return t.content; };
/* the shape of a list: its sections, suppliers, groups and cards, in page order */
const shape = (root, card, idOf) => [...root.querySelectorAll('section.sx1238,div.sp1238,div.gp1238,' + card)].map(el => el.matches(card) ? 'c' + idOf(el) : el.matches('section') ? 's' + el.dataset.sx1238 : el.matches('.sp1238') ? 'p' + el.dataset.sup1238 : 'g' + el.dataset.cat1238).join('\n');
/* a card as drawn, less what changes on its own after drawing (its two pictures loading, the filter hiding it) */
const plain = html => html.replace(/<div class="ph1238">[\s\S]*?<\/div>/, '').replace(/^(<article\b[^>]*?) hidden=""/, '$1');
/* make a drawn element read as a fresh one, keeping its nodes where the two have the same shape: the button just pressed keeps its place
   and its focus, a card's two pictures are left as they are, and only what differs is written */
function morph(a, b) {
 if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) { a.replaceWith(b); return; }
 if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
 if (a.classList.contains('ph1238') && b.classList.contains('ph1238')) return;
 const names = el => [...el.attributes].map(at => at.name).join(' ');
 if (names(a) !== names(b)) { [...a.attributes].forEach(at => a.removeAttribute(at.name)); [...b.attributes].forEach(at => a.setAttribute(at.name, at.value)); } /* in b's order, as a fresh one reads */
 else for (const at of [...b.attributes]) if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
 const x = [...a.childNodes], y = [...b.childNodes];
 if (x.length !== y.length) { a.replaceChildren(...y); return; }
 x.forEach((n, i) => morph(n, y[i]));
}
/* a quick save wrote only these references' unit ticks or bookings: their cards' light and booking are read again from the record, in
   the model as it was drawn, when nothing else was saved since it was built and it is under 4 s old (model()'s own window); otherwise
   the model is built again */
function refreshed(keys) {
 const m = MEMO.model;
 if (!m || MEMO.v !== VER - 1 || Date.now() - MEMO.at >= 4000) return model();
 for (const key of keys) { const list = m.byKey.get(key); if (!list || !list.length || list[0].board) continue; const r = list[0].r;
  let mark = null, emp = null, on = null; try { mark = Ready1231.mark(key); } catch (x) { mark = null; } try { emp = r.empty ? emptiedOf816(key) : null; } catch (x) { emp = null; } try { on = lastOnSite816(key); } catch (x) { on = null; }
  const ctx = {mark, emp, on, oneOwner: new Set(list.map(c => c.owner)).size === 1, ticks: umap(key, 'ready1238_units', 'at')}, books = umap(key, 'pickup1238_units', 'set');
  list.forEach(c => { c.st = stateOf(c, ctx); const b = pickOf(books, c, 'set'); c.book = b && ok(b.at) ? b : null; }); }
 let M = null; try { M = demob816(); } catch (x) { M = null; }
 MEMO = {M, at: MEMO.at, v: VER, model: m};
 return m;
}
function put(view, cls, html, after) { const old = view.querySelector(':scope > .' + cls); if (!html) { if (old) old.remove(); return; } const n = tpl(html).firstElementChild; if (old) { if (old.outerHTML !== n.outerHTML) old.replaceWith(n); } else after.after(n); }
function quickDraw() {
 const Q = QUICK, pane = D.getElementById('pane-demob'), view = pane && pane.querySelector('.sgv1238'), lst = view && view.querySelector(':scope > .sgl1238'), bar = view && view.querySelector(':scope > .tb1238');
 if (!Q || !lst || !bar || !DRAWN || typeof DM816 !== 'object' || !DM816) return false;
 const day = DM816.view === ALLV ? null : selDay();
 if (view.dataset.sgv1238 !== (day ? 'day' : 'all') || DRAWN.sig !== viewSig(day)) return false;
 const m = refreshed(Q.keys), list = day ? dayList(m, day) : allCards(m), id = c => c.key + '#' + c.uid;
 if (!list.length || list.length !== DRAWN.cards.size) return false;
 for (const c of list) { const was = DRAWN.cards.get(id(c)); if (was === undefined || (!Q.keys.has(c.key) && was !== cardSig(c))) return false; }
 /* everything new is worked out before anything on screen changes: the lists with each card as a marker, the bar, the trucks, the
    booked pick-ups and the written references' cards */
 const sk = tpl(sectionsHtml(list, day, c => '<i data-ph1238="' + e(id(c)) + '"></i>'));
 if (shape(lst, 'article.sg1238', a => a.dataset.sg1238 + '#' + a.dataset.u1238) !== shape(sk, 'i[data-ph1238]', x => x.dataset.ph1238)) return false;
 const heads = ['.sh1238', '.gh1238', '.sp1238 > h4'].map(sel => [[...lst.querySelectorAll(sel)], [...sk.querySelectorAll(sel)]]);
 if (heads.some(([a, b]) => a.length !== b.length)) return false;
 const nb = tpl(barHtml(list, day)).firstElementChild, fr = bar.querySelector(':scope > .fr1238'), lab = fr && fr.querySelector(':scope > label.fd1238'), nfr = nb && nb.querySelector(':scope > .fr1238');
 const cn = bar.querySelector(':scope > .cn1238'), ncn = nb && nb.querySelector(':scope > .cn1238'), th = bar.querySelector(':scope > .th1238'), nth = nb && nb.querySelector(':scope > .th1238');
 if (!nb || !fr || !lab || !nfr || !th || !nth || !!cn !== !!ncn) return false;
 const lh = day ? '' : loadsHtml(list), bh = day ? '' : bookedHtml(list);
 const fresh = list.filter(c => Q.keys.has(c.key)).map(c => ({c, n: tpl(cardHtml(c)).firstElementChild}));
 /* then only what changed is put right */
 const swap = (a, b) => { if (a && b && a.outerHTML !== b.outerHTML) a.replaceWith(b); };
 heads.forEach(([a, b]) => a.forEach((x, i) => swap(x, b[i])));
 swap(th, nth);
 const fa = [...fr.querySelectorAll(':scope > button.f1238')], fb = [...nfr.querySelectorAll(':scope > button.f1238')];
 if (fa.map(x => x.outerHTML).join('') !== fb.map(x => x.outerHTML).join('')) { fa.forEach(x => x.remove()); fb.forEach(x => fr.insertBefore(x, lab)); } /* the find box stays as it is, with what is typed in it */
 swap(cn, ncn);
 if (!day) { put(view, 'ld1238', lh, bar); put(view, 'bp1238', bh, view.querySelector(':scope > .ld1238') || bar); }
 fresh.forEach(({c, n}) => { const a = lst.querySelector('article.sg1238[data-sg1238="' + cssq(c.key) + '"][data-u1238="' + cssq(c.uid) + '"]'); if (a && n && plain(a.outerHTML) !== plain(n.outerHTML)) morph(a, n); DRAWN.cards.set(id(c), cardSig(c)); });
 try { decorate(); } catch (x) {}
 try { todayRows(); } catch (x) {}
 return true;
}
/* the day cards' figures read from the cards (today's "Ready for collection N units now"), put right in place after a quick save */
function todayRows() {
 const pane = D.getElementById('pane-demob'); if (!pane) return;
 pane.querySelectorAll('.dc996-day[data-dday816]').forEach(card => { const rows = dayRows(card.dataset.dday816);
  card.querySelectorAll('.bc986-work-row').forEach((row, i) => { const r = rows[i], l = row.querySelector('.bc986-work-label'), v = row.querySelector('.bc986-work-value');
   if (r && l && v && l.textContent === r.label && v.textContent !== String(r.value)) v.textContent = String(r.value); }); });
}
"""

reps = [
 ("REL = 'v12.42.2'", "REL = 'v12.42.3'"),
 # 1. the model: reused without building anything when it still stands; built again inside the page's asset hold
 ("""/* ---- the model, worked out once per drawing ---- */
let MEMO = {M: null, at: 0, v: -1, model: null}, VER = 0;
function model() {
 let M = null; try { M = demob816(); } catch (x) { M = null; }
 const now = Date.now();""",
  """/* ---- the model, worked out once per drawing ---- */
let MEMO = {M: null, at: 0, v: -1, model: null}, VER = 0;
/* v12.42.3: the model kept from the last drawing still stands while nothing was saved since, it is under 4 s old and the day's plan
   (demob816) is the very one it was built from. That is checked without building anything: the plan is asked for only while the
   drawing memo still holds it (otherwise it would be a new plan, and the model is built again anyway). Building it again is done
   inside the page's own asset hold, so the asset list is built once for the whole model and not once per lookup (outside a hold a
   model took 7.6 s on a 4x-throttled phone, inside 0.55 s) */
const planHeld = () => { try { return typeof RENDER_MEMO !== 'undefined' && RENDER_MEMO instanceof Map && RENDER_MEMO.has('demob816'); } catch (x) { return false; } };
function model() {
 if (MEMO.model && MEMO.v === VER && Date.now() - MEMO.at < 4000 && planHeld()) { let M = null; try { M = demob816(); } catch (x) { M = null; } if (MEMO.M === M) return MEMO.model; }
 return hold(buildModel);
}
function buildModel() {
 let M = null; try { M = demob816(); } catch (x) { M = null; }
 const now = Date.now();"""),
 # the lists can be drawn with each card as a marker (for the quick save's check of what is on screen)
 ("function groupsHtml(list) {", "function groupsHtml(list, cardFn) {"),
 ("'</em></div><div class=\"gg1238\">' + cs.map(cardHtml).join('') + '</div></div>'; }).join('');",
  "'</em></div><div class=\"gg1238\">' + cs.map(c => (cardFn || cardHtml)(c)).join('') + '</div></div>'; }).join('');"),
 ("function sectionsHtml(list, day) {", "function sectionsHtml(list, day, cardFn) {"),
 ("headHtml('coates', 'Coates · our list', 'Our fleet · ' + word(ours), ours) + groupsHtml(ours) + '</section>';",
  "headHtml('coates', 'Coates · our list', 'Our fleet · ' + word(ours), ours) + groupsHtml(ours, cardFn) + '</section>';"),
 ("units(sup.get(k).length) + '</small></h4>' + groupsHtml(sup.get(k)) + '</div>').join('') + '</section>';",
  "units(sup.get(k).length) + '</small></h4>' + groupsHtml(sup.get(k), cardFn) + '</div>').join('') + '</section>';"),
 # what a view is drawn from is kept (for the quick save); a day's list is one function
 ("""function viewHtml(day) {
 const m = model();
 if (!day) { const all = allCards(m);
""",
  """/* a day shows what left on it (by the day it left, and a run part-collected that day) and what is booked for it */
const dayList = (m, day) => m.cards.filter(c => (c.st.s === 'gone' ? goneDay(c) === day : !!(c.book && qDay(c.book.at) === day)) || !!(c.group && c.G && c.G.events.some(ev => evDay(ev) === day)));
function viewHtml(day) {
 const m = model();
 if (!day) { const all = allCards(m); seen(all, null);
"""),
 (" const list = m.cards.filter(c => (c.st.s === 'gone' ? goneDay(c) === day : !!(c.book && qDay(c.book.at) === day)) || !!(c.group && c.G && c.G.events.some(ev => evDay(ev) === day)));\n",
  " const list = dayList(m, day); seen(list, day);\n"),
 # 2. the three writers save through saveQuick (the page's bump(), in the hold, the references named); the "Not saved" answer is unchanged
 (" VER++; bump(); if (bump.kept === false) { try { flash('Not saved · keep this page open.'); } catch (x) {} return false; } /* a refusal is said out loud, as on every writer in the page */",
  " VER++; saveQuick([key]); if (bump.kept === false) { try { flash('Not saved · keep this page open.'); } catch (x) {} return false; } /* a refusal is said out loud, as on every writer in the page */"),
 (" const n = String(note || '').trim().slice(0, 80); gs.forEach(g => putBooking(g.key, g.uids, v, n, who, mark));\n VER++; bump(); if (bump.kept === false) { try { flash('Not saved · keep this page open.'); } catch (x) {} return false; }",
  " const n = String(note || '').trim().slice(0, 80); gs.forEach(g => putBooking(g.key, g.uids, v, n, who, mark));\n VER++; saveQuick(gs.map(g => g.key)); if (bump.kept === false) { try { flash('Not saved · keep this page open.'); } catch (x) {} return false; }"),
 (" VER++; bump(); if (bump.kept === false) { try { flash('Not saved · keep this page open.'); } catch (x) {} return false; } /* the sheet stays open */",
  " VER++; saveQuick([key]); if (bump.kept === false) { try { flash('Not saved · keep this page open.'); } catch (x) {} return false; } /* the sheet stays open */"),
 # 3. the taps that read the model run in the asset hold
 (" if ((b = pick('[data-lamp1238]'))) { ev.preventDefault(); ev.stopPropagation(); lamp(b.dataset.k1238, b.dataset.u1238, b.dataset.lamp1238); return; }\n if ((b = pick('[data-book1238]'))) { ev.preventDefault(); ev.stopPropagation(); open(b.dataset.book1238, b.dataset.u1238); return; }",
  " if ((b = pick('[data-lamp1238]'))) { ev.preventDefault(); ev.stopPropagation(); const k = b.dataset.k1238, u = b.dataset.u1238, s = b.dataset.lamp1238; hold(() => lamp(k, u, s)); return; } /* v12.42.3: in the asset hold */\n if ((b = pick('[data-book1238]'))) { ev.preventDefault(); ev.stopPropagation(); const k = b.dataset.book1238, u = b.dataset.u1238; hold(() => open(k, u)); return; }"),
 (" if ((b = pick('[data-ldbook1238]'))) { ev.preventDefault(); ev.stopPropagation(); openLoad(loadOf(b) || Number(b.dataset.ldbook1238)); return; }",
  " if ((b = pick('[data-ldbook1238]'))) { ev.preventDefault(); ev.stopPropagation(); const t = loadOf(b) || Number(b.dataset.ldbook1238); hold(() => openLoad(t)); return; }"),
 ("  if (act === 'save') save();\n", "  if (act === 'save') hold(save); /* v12.42.3: the clash check, the save and the truck found again, in the asset hold */\n"),
 (" let cx = null; if (ok2 && SEL.key) { try { cx = sheetClash(SEL.day + 'T' + SEL.time + ':00+10:00'); } catch (x) { cx = null; } }",
  " let cx = null; if (ok2 && SEL.key) { try { cx = hold(() => sheetClash(SEL.day + 'T' + SEL.time + ':00+10:00')); } catch (x) { cx = null; } }"),
 # the Demob redraw during a quick save is done in place when it can be; any other redraw draws the whole tab as before
 ("  try { if (typeof DM816 === 'object' && DM816 && ['toilets', 'pump', 'trucks'].indexOf(DM816.view) >= 0) DM816.view = 'list'; } catch (x) {}\n",
  "  try { if (typeof DM816 === 'object' && DM816 && ['toilets', 'pump', 'trucks'].indexOf(DM816.view) >= 0) DM816.view = 'list'; } catch (x) {}\n"
  "  if (QUICK) { let done = false; try { done = hold(quickDraw); } catch (x) { done = false; try { console.error('v12.42.3 quick redraw', x); } catch (y) {} } if (done) return; } /* v12.42.3: anything it cannot put right in place is drawn whole below */\n"),
 # exports for the tests
 ("keepUnits, pickOf, parseTime, notePairs,", "keepUnits, pickOf, parseTime, notePairs, quick: () => DRAWN ? {sig: DRAWN.sig, cards: DRAWN.cards.size} : null,"),
]
for o, n in reps:
    c = s.count(o)
    if c != 1: raise SystemExit(f'expected once, found {c}: {o[:90]!r}')
    s = s.replace(o, n)
j = s.find('\n/* ---- the hooks: the list, the drawing, v12.36\'s count ---- */'); assert j > 0 and s.count('\n/* ---- the hooks: the list, the drawing, v12.36\'s count ---- */') == 1
s = s[:j] + QUICK + s[j:]
open(out, 'w', encoding='utf-8').write(s)
print('made', out)
