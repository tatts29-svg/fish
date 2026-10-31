/* v6.97 - THE COATES INSTALLS PRE-START, PREFILLED, IN THE FORM THE CREW ALREADY USE.
 Andrew Fisher, 27 Sep 2026: "The prestart can you not use ones we are currently using. Use our current style of
 prestarts ... Not go into where u have it going." So this is the "Pre-start - Coates Installs - <day>" page the
 Pre-starts page already carries for 14 to 25 Sep (print/render_prestart.py, GC500-PS-INS-01): the same sections in
 the same order, the same hazards with their SWMS references, the same site rules, the Coates Life Saving Rules, the
 same contacts and the same print style - read out of that renderer, not retyped - prefilled for the day ahead, and
 listed on the Pre-starts page beside the ones before it. Nothing goes on the Timeline.

 WHEN (his rule of 27 Sep): Sunday prefills Monday, Tuesday and Wednesday; Wednesday prefills Thursday and Friday
 (Saturday only when work is on it); never more than three days; on the Gold Coast's own date; nobody presses anything.

 WHAT IS FILLED AND WHAT IS NOT - the form's own rule. The day, the drops, the loads and the work ticks come off the
 record (the same schedule the Timeline shows). The names of the crew are written in. The attendance tick, FIT Y/N and
 the signature are never filled: they are each person's own, on the morning. The hazards, rules and Life Saving Rules
 are ticked at the pre-start as they are talked through. */
const PS7 = __PS7_DATA__;
const PS7_CSS = __PS7_CSS__;
function ps7Iso(dt){ return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0'); }
function ps7Add(iso, n){ const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + n); return ps7Iso(d); }
function ps7Dow(iso){ return new Date(iso + 'T00:00:00').getDay(); }
function ps7Words(iso){ try { return preDayWords(iso); } catch (e) { return String(iso); } }   /* the Pre-starts page's own "Mon 14 Sep 2026" */
function ps7WorkOn(d){ return !!(d && ((d.deliveries || []).length || (d.removals || []).length || (d.loads || []).length)); }
/* the batch a day belongs to: Monday to Wednesday are Sunday's, Thursday to Saturday are Wednesday's */
function ps7BatchOf(iso){ const w = ps7Dow(iso); if (w >= 1 && w <= 3) return ps7Add(iso, -w); if (w >= 4) return ps7Add(iso, -(w - 3)); return null; }
function ps7State(d){
 if (!d) return {state: 'none'};
 const today = todayIso(), w = ps7Dow(d.iso);
 if (w === 0) return ps7WorkOn(d) ? {state: d.iso < today ? 'past' : d.iso === today ? 'ready' : 'later', batch: d.iso} : {state: 'none'};
 if (w === 6 && !ps7WorkOn(d)) return {state: 'none'};
 const b = ps7BatchOf(d.iso);
 if (d.iso < today) return {state: 'past', batch: b};
 return b <= today ? {state: 'ready', batch: b} : {state: 'later', batch: b};
}
const PS7_B = 'Portable buildings', PS7_T = 'Toilets & amenities', PS7_W = 'Water-filled barriers', PS7_G = 'Generators', PS7_L = 'Lighting towers';
function ps7Disc(rows){ const m = {}; (rows || []).forEach(r => { const k = r.a && r.a.discipline; if (k) m[k] = (m[k] || 0) + 1; }); return m; }
/* ticks_for() in render_prestart.py, the same rule off the same kind of record: the day's own drops by trade */
function ps7Ticks(d){
 const on = ps7Disc(d.deliveries), off = ps7Disc(d.removals), n = o => o && Object.keys(o).length;
 if (!n(on) && !n(off)) return {t: new Set(PS7.work.map(w => w[0])), basis: 'no scope'};
 const t = new Set(), add = (...k) => k.forEach(x => t.add(x));
 if (on[PS7_B]) add('unload_building', 'level', 'blocks', 'stairs', 'power');
 if (off[PS7_B]) add('load_building');
 if (on[PS7_B] && off[PS7_B]) add('relocate');
 if (on[PS7_T]) add('unload_toilets');
 if (off[PS7_T]) add('load_toilets');
 if (on[PS7_T] && off[PS7_T]) add('move_toilets');
 if (on[PS7_W] || off[PS7_W]) add('barriers');
 if (on[PS7_G] || on[PS7_L] || off[PS7_G] || off[PS7_L]) add('power');
 add('forklift', 'spotting', 'drive', 'escort');          /* every load needs a spotter and a way in */
 return {t, basis: 'scope'};
}
function ps7Counts(d){
 const on = ps7Disc(d.deliveries), off = ps7Disc(d.removals), bits = [];
 [[PS7_B, 'building', 'buildings'], [PS7_T, 'toilet', 'toilets'], [PS7_W, 'water barrier', 'water barriers'], [PS7_G, 'generator', 'generators'], [PS7_L, 'light tower', 'light towers']].forEach(([k, one, many]) => {
  if (on[k]) bits.push(`${on[k]} ${on[k] === 1 ? one : many} on`); if (off[k]) bits.push(`${off[k]} ${off[k] === 1 ? one : many} off`); });
 return bits.join(' · ');
}
function ps7Sectors(d){ const m = new Map(); (d.deliveries || []).concat(d.removals || []).forEach(r => { const L = typeof MASTER_LOC !== 'undefined' && r.a ? MASTER_LOC[r.a.key] : null; if (L && L.sec) m.set(L.sec, (m.get(L.sec) || 0) + 1); }); return [...m.entries()].sort((a, b) => b[1] - a[1]); }
function ps7Loads(d){ return (d.loads || []).slice().sort((a, b) => String(a.load_time_24h || a.time_24h || a.time || '').localeCompare(String(b.load_time_24h || b.time_24h || b.time || ''))); }
const ps7Box = on => `<i class="bx${on ? ' checked' : ''}"></i>`;
function ps7Story(d){
 const on = ps7Disc(d.deliveries), off = ps7Disc(d.removals), L = ps7Loads(d), counts = ps7Counts(d), secs = ps7Sectors(d), bits = [];
 if (L.length) { const t = x => x.load_time_24h || x.time_24h || x.time || '', eta = x => x.site_eta_planning || x.site_eta || '';
  const early = L.filter(x => x.early).length;
  bits.push(`<li><b>Traffic and the run in.</b> ${L.length} load${L.length === 1 ? '' : 's'} off Kingston, first away ${esc(t(L[0]))} and last ${esc(t(L[L.length - 1]))}${eta(L[0]) ? `, due on site ${esc(eta(L[0]))} to ${esc(eta(L[L.length - 1]))}` : ''}. ${early} of them leave before the site opens, so the run in works around live traffic on the Gold Coast Highway and the park roads, with the escort ahead.</li>`); }
 else bits.push('<li><b>Traffic and the run in.</b> No loads are held against this day in the transport plan; movement on the front is local and works around live traffic as every day does.</li>');
 if (counts) bits.push(`<li><b>Plant movement and the drops.</b> ${esc(counts)} — crane and forklift on the front, exclusion zone up under the hook, nothing walked under a suspended load.</li>`);
 else bits.push('<li><b>Plant movement.</b> The record holds no drop dated this day; plant moves on the front for positioning and access only.</li>');
 if (on[PS7_B] || off[PS7_B]) bits.push(`<li><b>Moving buildings.</b> ${on[PS7_B] || 0} in and ${off[PS7_B] || 0} out — positioned and levelled, blocks and packers under the skids, stairs and landings fitted, power-on checked with the electrician where one is due.</li>`);
 if (on[PS7_T] || off[PS7_T]) bits.push(`<li><b>Toilets and amenities.</b> ${on[PS7_T] || 0} in and ${off[PS7_T] || 0} out, forklifted into place and set down clear of the running lane.</li>`);
 if (on[PS7_W] || off[PS7_W]) bits.push(`<li><b>Water-filled barriers.</b> ${on[PS7_W] || 0} in and ${off[PS7_W] || 0} out, to the barrier line on iEDM's drawing.</li>`);
 if (secs.length) bits.push(`<li><b>Where on the circuit.</b> ${secs.slice(0, 10).map(([s, n]) => `${esc(s)} (${n})`).join(', ')}${secs.length > 10 ? ' and more' : ''} — off the master plan.</li>`);
 bits.push('<li><b>Spotting.</b> A spotter on every reverse and every lift near the public line, in sight of the operator, and the load stopped the moment sight is lost.</li>');
 return '<ul class="story">' + bits.join('') + '</ul>';
}
function ps7LoadsTable(d){
 const rows = ps7Loads(d);
 if (!rows.length) return '<p class="none">No loads are held against this day in the transport plan.</p>';
 return `<table class="lds"><thead><tr><th class="n">#</th><th>LOAD</th><th>LEFT KINGSTON</th><th>DUE ON SITE</th><th></th><th>REFERENCES ON THE LOAD</th><th>DROP POINT</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td class="n">${esc(r.n || i + 1)}</td><td>${esc(r.item || r.product || '')}</td><td>${esc(r.load_time_24h || r.time_24h || r.time || '')}</td><td>${esc(r.site_eta_planning || r.site_eta || '')}</td><td>${r.early ? 'early' : ''}</td><td>${esc((r.candidate_refs || r.refs || []).join(', '))}</td><td>${esc(r.drop_point || r.drop_point_state || '')}</td></tr>`).join('')}</tbody></table>`;
}
function ps7Attend(){
 const items = PS7.crew.concat([null, null, null]), half = Math.ceil(items.length / 2);
 const row = (i, w) => w ? `<tr><td class="n">${i}</td><td><b>${esc(w.name)}</b>${w.role ? `<span class="rl2"> · ${esc(w.role)}</span>` : ''}</td><td class="fit">${ps7Box(false)}</td><td class="fit">${ps7Box(false)}<span>Y</span>${ps7Box(false)}<span>N</span></td><td></td></tr>`
  : `<tr><td class="n">${i}</td><td></td><td class="fit">${ps7Box(false)}</td><td class="fit">${ps7Box(false)}<span>Y</span>${ps7Box(false)}<span>N</span></td><td></td></tr>`;
 const table = (chunk, start) => `<table class="so"><colgroup><col style="width:7%"><col style="width:45%"><col style="width:13%"><col style="width:17%"><col style="width:18%"></colgroup><thead><tr><th class="n">#</th><th>NAME (PRINT)</th><th>AT</th><th>FIT · Y/N</th><th>SIGNATURE</th></tr></thead><tbody>${chunk.map((w, i) => row(start + i, w)).join('')}</tbody></table>`;
 return '<div class="sotwo">' + table(items.slice(0, half), 1) + table(items.slice(half), half + 1) + '</div>';
}
function ps7Page(d, batch){
 const {t, basis} = ps7Ticks(d), L = ps7Loads(d), counts = ps7Counts(d), words = ps7Words(d.iso);
 const cols = [[], [], [], []]; PS7.work.forEach(([k, label, c]) => cols[c].push(`<label class="wk">${ps7Box(t.has(k))}${esc(label)}</label>`));
 const q = Math.ceil(PS7.rules.length / 4), rc = [0, 1, 2, 3].map(i => PS7.rules.slice(i * q, i * q + q));
 const lede = '<b>Coates install team</b> · unloading and loading, levelling, stairs, escorts — driving the track and Macintosh Park <span class="tag">FIELD OPERATIONS</span>';
 return `<section class="ps ps7 fen">
 <header class="psh"><div class="psh-l"><b>Coates</b><span>INDUSTRIAL SOLUTIONS</span></div>
 <div class="psh-m"><span class="kicker">DAILY PRE-START — PREFILLED FROM THE RECORD</span><h1>Buildings &amp; toilets — installers</h1></div>
 <div class="psh-r"><b>GC500 · 2026</b><span>SUPERCARS GOLD COAST 500</span><span>SURFERS PARADISE STREET CIRCUIT</span></div></header>
 <p class="lede">${lede}</p>
 <h2><i>01</i> THE DAY <em>As the record holds it · prefilled ${esc(ps7Words(batch || d.iso))}</em></h2>
 <div class="today">
 <div><label>DATE</label><b>${esc(words)}</b></div>
 <div><label>CREW</label><b>Coates Installs</b></div>
 <div><label>FIRST LOAD AWAY</label><b>${L.length ? esc(L[0].load_time_24h || L[0].time_24h || L[0].time || '—') : '—'}</b><span>${L.length ? 'last ' + esc(L[L.length - 1].load_time_24h || L[L.length - 1].time_24h || L[L.length - 1].time || '') : 'no loads held for this day'}</span></div>
 <div><label>START TIME · WEATHER · WIND</label><b></b><span>Crane lifts stop when wind exceeds the chart</span></div>
 <div><label>DROPS ON THIS DAY</label><b>${esc(counts || 'none dated this day')}</b></div>
 </div>
 <h2><i>02</i> HOW THE DAY WILL RUN <em>Traffic · plant movement · buildings · spotting · the loads</em></h2>
 ${ps7Story(d)}
 <h2><i>03</i> THE WORK <em>${basis === 'scope' ? 'Ticked from the record for this day.' : 'The record holds no scope for this day, so the whole list is ticked — strike out what is not on.'}</em></h2>
 <div class="work">${cols.map(c => '<div>' + c.join('') + '</div>').join('')}</div>
 <h2><i>04</i> THE LOADS ON THIS DAY <em>Off the transport plan, load by load</em></h2>
 ${ps7LoadsTable(d)}
 <h2><i>05</i> COATES LIFE SAVING RULES <em>Read out at the pre-start — every one, every day</em></h2>
 <div class="lsr">${PS7.life.map(([n, c, w]) => `<div class="lsrow"><span class="lsrn ${esc(c)}">${esc(n)}</span><span class="lsrt">${ps7Box(false)}${esc(w)}</span></div>`).join('')}</div>
 <h2><i>06</i> HAZARDS AND CONTROLS <em>Talked through at the pre-start, then ticked</em></h2>
 <div class="hzs hz4">${PS7.hazards.map(([h, b, s]) => `<div class="hz"><label>${ps7Box(false)}<b>${esc(h)}</b></label><p>${b}</p><span>${esc(s)}</span></div>`).join('')}</div>
 <h2><i>07</i> SITE RULES AND PAPERWORK <em>iEDM induction · Coates HSEQ plan · the GC500 page</em></h2>
 <div class="rules rl4">${rc.map(c => '<div>' + c.map(x => `<label class="rl">${ps7Box(false)}<span>${x}</span></label>`).join('') + '</div>').join('')}</div>
 <h2><i>08</i> EMERGENCY <em>Muster points as drawn on ${esc(PS7.evac)}</em></h2>
 <div class="emg"><div class="emg-000"><div class="emg-h">ALL EMERGENCIES</div><div class="emg-n">${esc(PS7.emg_primary)}</div>
 <div class="emg-s">Say: <b>${esc(PS7.venue)}</b>, nearest gate or corner, what you can see.</div>
 ${PS7.emg.map(c => `<div class="emg-r"><span>${esc(c.name)}</span><b>${esc(c.phone)}</b></div>`).join('')}
 <div class="emg-s">Nearest muster point to this front: <span class="rule"></span></div></div>
 <div class="emg-c"><div class="emg-h">COATES ON SITE</div>${PS7.coates.map(p => `<div class="emg-r"><span>${esc(p.name)} · ${esc(p.role)}</span><b>${esc(p.mobile)}</b></div>`).join('')}<div class="emg-r"><span>Coates</span><b>13 15 52</b></div></div>
 <div class="emg-c"><div class="emg-h">iEDM</div>${PS7.iedm.map(c => `<div class="emg-r"><span>${esc(c.name)} · ${esc(c.role)}</span><b>${esc(c.phone)}</b></div>`).join('')}</div></div>
 <div class="hold"><h2><i>09</i> WHO ATTENDED — COATES INSTALLS <em>Print your name, tick that you are here and fit for work, then sign</em></h2>
 ${ps7Attend()}</div>
 <p class="confirm"><b>What this page is.</b> The daily pre-start for the Coates Installs crew on ${esc(words)}, prefilled
 automatically from the project record on ${esc(ps7Words(batch || d.iso))} — the day, the drops, the loads and the work off the
 same schedule as the Timeline. The supervisor adds the morning's changes and the weather, and the hazards, rules and Life Saving
 Rules are ticked as they are talked through. <b>By signing you confirm</b> you attended, understand the work and the controls, have
 done the iEDM induction, have signed the SWMS and are fit for work. Attendance, FIT and the signature are each person's own and are
 never filled in for them. <b>If you're unsure, ask the question — everyone has the right to stop the job.</b></p>
 <p class="foot">Coates Industrial Solutions · GC500 2026 · Coates Installs daily pre-start, prefilled · Author: Andrew Fisher ·
 GC500-PS-INS-01 v2 · for ${esc(ps7Words(d.iso).replace(/^\w+ /, ''))} · ${basis === 'scope' ? 'ticked from the record' : 'no scope held for this day — the whole work list shown'}</p>
 </section>`;
}
/* a working day the schedule holds nothing for still gets its pre-start, with the whole list ticked (the form's own rule,
 20 Sep 2026: "where there is no scope, everything is prefilled"); the Timeline only lists days with something on them */
function ps7Day(iso){
 let days = []; try { days = programmeDays(); } catch (e) { return null; }
 if (!days.length || iso < days[0].iso || iso > days[days.length - 1].iso) return null;
 return days.find(x => x.iso === iso) || {iso, deliveries: [], removals: [], loads: [], empty: true};
}
/* the days on the Pre-starts page: prefilled and ready, and the next batch with the day it will fill in */
function ps7Rows(){
 const today = todayIso(), ready = [], later = [];
 for (let i = 0; i <= 7; i++) { const d = ps7Day(ps7Add(today, i)); if (!d) continue; const s = ps7State(d);
  if (s.state === 'ready') ready.push({d, s}); else if (s.state === 'later') later.push({d, s}); }
 return {ready, later};
}
function ps7ListHtml(){
 const {ready, later} = ps7Rows();
 const row = ({d, s}) => { const c = ps7Counts(d), n = (d.deliveries || []).length + (d.removals || []).length;
  return `<li class="prerow ps7row"><span class="preday">${esc(ps7Words(d.iso))}</span>
 <span class="pretitle">Pre-start — Coates Installs — ${esc(ps7Words(d.iso))}<span class="w">prefilled automatically ${esc(ps7Words(s.batch))} from the record · ${n ? esc(c || n + ' on the schedule') : 'no drops on the schedule — the whole work list shown'}</span></span>
 <span class="preopen"><button class="btn tiny primary" type="button" data-ps7="${esc(d.iso)}">Print</button></span></li>`; };
 const nextB = later.length ? later[0].s.batch : null, nextDays = later.filter(x => x.s.batch === nextB).map(x => ps7Words(x.d.iso).replace(/ 20\d\d$/, ''));
 return `<div class="ps7head"><b>Prefilled for the days ahead</b><span>The same Coates Installs pre-start as the days before, filled in from the record automatically: Sunday for Monday to Wednesday, Wednesday for Thursday and Friday. Print, run it, and the signed sheet is uploaded below as that day's record.</span></div>
 ${ready.length ? `<ul class="prelist ps7list">${ready.map(row).join('')}</ul>` : '<p class="norate">None ready yet for the days ahead.</p>'}
 ${nextB ? `<p class="norate">Next: ${esc(nextDays.join(', '))} — prefilled ${esc(ps7Words(nextB))}.</p>` : ''}`;
}
function ps7Print(iso){
 const d = ps7Day(iso);
 if (!d) { flash('That day is outside the programme.'); return; }
 const s = ps7State(d);
 const wrap = document.getElementById('dayprint') || (() => { const e = document.createElement('div'); e.id = 'dayprint'; document.body.appendChild(e); return e; })();
 wrap.innerHTML = ps7Page(d, s.batch); wrap.classList.add('ps7wrap');
 const st = document.createElement('style'); st.id = 'dayPage';
 st.textContent = '@page{size:A4 portrait;margin:7mm}\n#dayprint.ps7wrap{width:196mm;font:inherit;background:#fff}\n' + PS7_CSS;
 document.head.appendChild(st);
 /* one A4 sheet, always: measured at the paper's width before the dialog opens, and brought in by exactly as much as a
    busy day runs over (a long loads table, a long day) - never more, and never on a day that already fits */
 const sec = wrap.querySelector('.ps7'), keep = wrap.getAttribute('style'), ruler = document.createElement('div');
 wrap.setAttribute('style', 'display:block;position:absolute;left:-10000px;top:0;visibility:hidden');
 ruler.style.cssText = 'position:absolute;left:-10000px;top:0;height:283mm;width:1px'; document.body.appendChild(ruler);
 const avail = ruler.getBoundingClientRect().height, h = sec ? sec.getBoundingClientRect().height : 0; ruler.remove();
 if (keep === null) wrap.removeAttribute('style'); else wrap.setAttribute('style', keep);
 if (sec && h > avail * 0.985) sec.style.zoom = String(Math.max(0.8, Math.floor(avail * 0.985 / h * 1000) / 1000));
 document.body.classList.add('printing-day');
 const done = () => { st.remove(); wrap.classList.remove('ps7wrap'); document.body.classList.remove('printing-day'); };
 window.addEventListener('afterprint', done, {once: true});
 (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { try { window.print(); } catch (e) { done(); } });
}
