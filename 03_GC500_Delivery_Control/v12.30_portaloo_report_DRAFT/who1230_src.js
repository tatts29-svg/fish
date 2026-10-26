/* ---- v12.30 every portaloo on the night: who serviced it and, on the final night, ready to be picked up and when.
   Andrew, 26 Oct 2026: "lets do a report on all last nights portaloos that also mentiones who confirmed locked and cleaned too
   please add thi into the report"; "can we also mention or have a Tick of Ready to be picked up please. and then next to it a
   date when it will be picked up and time. we want this to look really good please".
   Who: the crew group each job was saved under (the crew card records the group, not each person) and, for the lock-up, the
   named person who declared the doors locked (SvcLock1221's own reading). Ready to be picked up: every job of the final night
   (pump out, clean and restock, lock-up) saved for every unit at the location. When: the Demob plan's day for the reference and
   the load it is on (demob816, trucks816): a Coates run's planned stop time; a supplier collects with its own transport and has
   no time planned here, so the site hours are shown; the day says how firm it is. Read only. */
function pickups1230() {
  const out = new Map(); if (typeof demob816 !== 'function') return out;
  const held = f => (typeof holdAssets === 'function' ? holdAssets(f) : f());
  try { held(() => { const M = demob816();
    (M.refs || []).forEach(r => out.set(r.key, {src: r.src || null, iso: r.iso || null, stops: []}));
    (M.days || []).forEach(iso => { let L = []; try { L = trucks816(iso, 'all') || []; } catch (e) { L = []; }
      L.forEach(l => ((l.t && l.t.st) || []).forEach(x => { const s = x && x.s, r = s && s.r, o = r && out.get(r.key); if (!o) return;
        const sup = l.kind === 'supplier', n = (s.parts || []).reduce((a, p) => a + (Number(p.n) || 0), 0);
        o.stops.push({iso, time: sup || s.afterSupplier || x.at == null ? null : clock816(x.at), supplier: sup, after: !!s.afterSupplier, group: String(l.group || ''), n}); })); }); }); } catch (e) {}
  out.forEach(o => o.stops.sort((a, b) => (a.iso + (a.time || '99')).localeCompare(b.iso + (b.time || '99'))));
  return out;
}
function who1230(I, cfg, day, st, final) {
  const S = I.S, D = I.D, C = I.C, crewData = I.crewData || {};
  const crewOf = id => { const l = String(C ? C.label(crewData, id) : id), m = l.split(/\s+[—–-]\s+/); return m.length > 1 ? m.slice(1).join(' – ') : l; };
  const lock = typeof SvcLock1221 === 'object' ? SvcLock1221.report(I, day) : {rows: []}, decl = new Map();
  (lock.rows || []).forEach(r => { if (r.status !== 'Recorded' && r.status !== 'Pending sync') return; if (!decl.has(r.line)) decl.set(r.line, []); decl.get(r.line).push(r); });
  const pick = final ? pickups1230() : null, add = (list, v) => { if (list.indexOf(v) < 0) list.push(v); };
  const groups = D.areas.map(a => ({n: a.n || '', area: a.name, refs: a.refs.map(r => {
    const o = {ref: r.ref, units: 0, jobs: {}, ready: false, missing: [], pickup: null};
    r.lines.forEach(l => { const ts = S.countedFor(cfg, l, day); if (!ts.length) return; o.units += l.qty;
      ts.forEach(t => { const s = st[S.jobKey(l.id, t, day)], j = o.jobs[t] || (o.jobs[t] = {due: 0, done: 0, first: 0, last: 0, crews: [], by: [], unnamed: 0});
        j.due += l.qty; if (!s) return; j.done += l.qty;
        if (!j.first || s.at < j.first) j.first = s.at; if (s.at > j.last) j.last = s.at;
        (s.crews || []).forEach(id => add(j.crews, crewOf(id))); if (s.unassigned) add(j.crews, 'no crew group');
        if (t === 'lockup') { const ds = decl.get(l.id) || []; if (!ds.length) j.unnamed += l.qty; ds.forEach(d => add(j.by, /[A-Za-z]/.test(d.by || '') ? d.by : 'no name given')); } }); });
    Object.keys(o.jobs).forEach(t => { if (o.jobs[t].done < o.jobs[t].due) o.missing.push(t); });
    o.ready = !!final && Object.keys(o.jobs).length > 0 && !o.missing.length;
    o.pickup = pick ? pick.get(r.ref) || null : null;
    return o; }).filter(r => r.units > 0)})).filter(g => g.refs.length);
  const all = [].concat(...groups.map(g => g.refs)), days = new Map();
  let supplier = '';
  if (final) all.forEach(r => { const p = r.pickup, ds = p && p.stops.length ? [...new Set(p.stops.map(s => s.iso))] : p && p.iso ? [p.iso] : [];
    ds.forEach(d => { const x = days.get(d) || {iso: d, refs: 0}; x.refs++; days.set(d, x); });
    (p && p.stops || []).forEach(s => { if (s.supplier && !supplier) supplier = String(s.group || '').split(' · ').pop() || 'the supplier'; }); });
  return {final: !!final, groups, supplier, locations: all.length, ready: all.filter(r => r.ready).length, units: all.reduce((s, r) => s + r.units, 0),
    readyUnits: all.filter(r => r.ready).reduce((s, r) => s + r.units, 0), days: [...days.values()].sort((a, b) => a.iso < b.iso ? -1 : 1),
    proposed: all.filter(r => r.pickup && r.pickup.src === 'proposed').length};
}
/* the section, a heading block per area and a block per location, so whole rows move to the next A4 as the report's pager works
   and no page is left half empty; the area heading (a .hd block) never stays behind at the foot of a page */
function whoBlocks1230(R) {
  const W = R.who1230; if (!W || !W.groups.length) return '';
  const H = R.hm, order = ['pump', 'clean', 'refill', 'lockup'].filter(t => W.groups.some(g => g.refs.some(r => r.jobs[t])));
  const NAME = {pump: 'Pumped out', clean: 'Cleaned & restocked', refill: 'Water', lockup: 'Locked'};
  const SHORT = {pump: 'pump-out', clean: 'clean', refill: 'water', lockup: 'lock-up'};
  const FIRM = {confirmed: 'Confirmed', plan: 'Planned', contract: 'Off-hire date', proposed: 'Proposed'};
  const grid = W.final ? 'g1230 fin' : 'g1230', k = ' style="--k:' + order.length + '"';
  const cell = (r, t) => { const j = r.jobs[t], c = JOBC[t] || '#5d6c77'; if (!j) return '<div class="na">—</div>';
    if (!j.done) return '<div class="wn"><span class="wx">✕</span>Not recorded</div>';
    const time = j.first === j.last ? H(j.first) : H(j.first) + '–' + H(j.last), part = j.done < j.due ? '<em>' + n(j.done) + ' of ' + n(j.due) + '</em>' : '';
    const who = t === 'lockup' ? (j.by.length ? '<b>' + esc(j.by.join(', ')) + '</b>' : '') + (j.unnamed ? '<b class="warn">no named declaration</b>' : '') + (j.crews.length ? '<small>' + esc(j.crews.join(', ')) + '</small>' : '')
      : '<b>' + esc(j.crews.join(', ') || 'no crew group') + '</b>';
    return '<div><span class="wk" style="--c:' + c + '">✓</span><span class="tm">' + esc(time) + '</span>' + part + '<span class="wh">' + who + '</span></div>'; };
  const ready = r => r.ready ? '<div class="rd"><span class="rp"><i>✓</i>Ready</span></div>'
    : '<div class="rd"><span class="rp no"><i>✕</i>Not ready</span><small>' + esc(r.missing.map(t => SHORT[t] || t).join(', ')) + ' not recorded</small></div>';
  const pick = r => { const p = r.pickup; if (!p) return '<div class="pk"><small>Not in the demob plan</small></div>';
    const stops = p.stops.length ? p.stops : p.iso ? [{iso: p.iso, time: null, supplier: false, after: false, group: '', n: 0}] : [];
    if (!stops.length) return '<div class="pk"><small>No pick-up day yet</small></div>';
    const sup = stops.every(s => s.supplier), by = sup ? (String(stops[0].group || '').split(' · ').pop() || 'Supplier') + ' collect' : (stops[0].group || 'Coates');
    return '<div class="pk">' + stops.map(s => '<span class="pd"><b>' + esc(shortDay(s.iso)) + '</b><span>' + esc(s.time || (s.supplier ? '07:00–17:00' : s.after ? 'after the supplier' : 'time to be set')) + '</span>' + (stops.length > 1 && s.n ? '<em>' + n(s.n) + ' units</em>' : '') + '</span>').join('') +
      '<small' + (p.src === 'proposed' ? ' class="pp"' : '') + '>' + esc((FIRM[p.src] || 'Planned') + ' · ' + by) + '</small></div>'; };
  const cols = '<div class="gh ' + grid + '"' + k + '><span>Location</span>' + order.map(t => '<span>' + esc(NAME[t] || t) + '</span>').join('') + (W.final ? '<span>Ready to be picked up</span><span>Pick-up</span>' : '') + '</div>';
  const day = d => { const x = dt(d.iso); return '<span class="cd"><b>' + esc(x.wd.slice(0, 3)) + ' ' + x.d + '</b><span>' + esc(x.m.slice(0, 3)) + '</span><em>' + n(d.refs) + '</em></span>'; };
  const head = W.final
    ? '<div class="blk hd"><h2><i></i>Every portaloo · ready to be picked up</h2><div class="rb1230"><div class="rbt"><span class="rbk' + (W.ready === W.locations ? '' : ' part') + '">' + (W.ready === W.locations ? '✓' : '!') + '</span><div><b>' + n(W.ready) + ' of ' + n(W.locations) + '</b><span>locations ready to be picked up · ' + n(W.readyUnits) + ' of ' + n(W.units) + ' units</span></div></div>' +
      (W.days.length ? '<div class="cal1230"><span class="cl">Pick-up days · locations</span>' + W.days.map(day).join('') + '</div>' : '') + '</div>' +
      '<div class="how"><p><b>Ready to be picked up</b> means every job of the final night (pump out, clean and restock, lock-up) is saved for every unit at the location. <b>Who</b>: each job shows the crew group it was saved under, as the crew card records it; Locked shows the named person who declared the doors locked, with their crew. <b>Pick-up</b>: the Demob plan’s day and the load’s planned time' +
      (W.supplier ? '; ' + esc(W.supplier) + ' collect with their own transport between 07:00 and 17:00' : '') + '.' + (W.proposed ? ' ' + n(W.proposed) + ' of the pick-up days are proposed, not yet confirmed bookings.' : '') + '</p></div></div>'
    : '<div class="blk hd"><h2><i></i>Every portaloo · who serviced it</h2><div class="how"><p>Each location on the night, the time each job was saved and the crew group it was saved under, as the crew card records it' + (order.indexOf('lockup') >= 0 ? '; Locked shows the named person who declared the doors locked' : '') + '.</p></div></div>';
  return head + W.groups.map(g => '<div class="blk hd wh1230"><div class="lga"><span class="no">' + esc(g.n || '–') + '</span><span class="lgn"><b>' + esc(g.area) + '</b> <em>' + n(g.refs.length) + (g.refs.length === 1 ? ' location' : ' locations') + '</em></span></div>' + cols + '</div>' +
    g.refs.map((r, i) => '<div class="blk gr ' + grid + (i % 2 ? ' alt' : '') + (i === g.refs.length - 1 ? ' end' : '') + (W.final && !r.ready ? ' nr' : '') + '"' + k + ' data-ref1230="' + esc(r.ref) + '"><div class="rf"><b>' + esc(r.ref) + '</b><small>' + n(r.units) + (r.units === 1 ? ' unit' : ' units') + '</small></div>' +
      order.map(t => cell(r, t)).join('') + (W.final ? ready(r) + pick(r) : '') + '</div>').join('')).join('');
}
/* the door-lock declarations (SvcLock1221's own reading and statement), one row each: every fact the entry carried - location, units,
   area, what and line, who declared it, the crew, when it was declared and received, its status and any withdrawal */
function lockTable1230(R) {
  const d = R.lockDeclarations; if (!d || (!R.day.final && !d.rows.length && !d.legacy)) return '';
  const H = R.hm, day = v => new Date(v + 36e6).toISOString().slice(0, 10);
  const tm = (v, ref) => { const t = Date.parse(v); if (!Number.isFinite(t)) return 'not recorded'; const r = Date.parse(ref); return Number.isFinite(r) && day(r) !== day(t) ? shortDay(day(t)).replace(/^\w+ /, '') + ' ' + H(t) : H(t); };
  const head = '<div class="blk hd"><h2><i></i>Door-lock declarations · ' + n(d.rows.length) + '</h2><div class="how"><p><b>' + esc(d.statement) + '</b></p><p>One named person confirms the units listed for each entry. The selected crew is recorded alongside them. Pump-out and cleaning completion ticks remain separate.</p>' +
    (d.legacy ? '<p>' + d.legacy + ' lock completion line(s) have no named declaration recorded.</p>' : '') + (!d.rows.length ? '<p>No named door-lock declarations recorded for this service night.</p>' : '') + '</div>' +
    (d.rows.length ? '<div class="gh gl1230"><span>Location</span><span>Area · units · line</span><span>Declared by</span><span>Crew</span><span>Declared</span><span>Received</span><span>Status</span></div>' : '') + '</div>';
  return head + d.rows.map((r, i) => '<div class="blk gr gl1230 lock1221-entry' + (i % 2 ? ' alt' : '') + (i === d.rows.length - 1 ? ' end' : '') + '"><div class="rf"><b>' + esc(r.ref) + '</b><small>' + esc(r.units) + (Number(r.units) === 1 ? ' unit' : ' units') + '</small></div>' +
    '<div>' + esc(r.area) + '<small>' + esc(r.label) + ' · line ' + esc(r.line) + '</small></div><div><b>' + esc(/[A-Za-z]/.test(r.by || '') ? r.by : '“' + (r.by || '') + '” · no name given') + '</b></div><div>' + esc(r.crew) + '</div>' +
    '<div class="tm">' + esc(tm(r.declaredAt, r.declaredAt)) + '</div><div class="tm">' + esc(tm(r.receivedAt, r.declaredAt)) + '</div><div>' + esc(r.status) + (r.withdrawnAt ? '<small>withdrawn ' + esc(tm(r.withdrawnAt, r.declaredAt)) + '</small>' : '') + '</div></div>').join('');
}
