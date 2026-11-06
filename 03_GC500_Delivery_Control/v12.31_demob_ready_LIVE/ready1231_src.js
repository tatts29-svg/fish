<script id="ready1231-script">
/* Author: Andrew Fisher. v12.31 - the Demob tab: ready for collection, the pick-up date and time, picked up and when.
   Andrew, 26 Oct 2026, with trucks on site: "we have trucks in now so we need to know what is ready or not ready"; "its important
   we have a pickup date and time. we can have a not ready for collection ready for collection and a picked up and time and date
   it was picked up"; "lets utilise the current demob tab... as things are changed or leave this info can be added to the demob
   cards".
   One status per reference, read in this order:
     - Picked up: the departure record (DemobCollection996 / Departure1211) says every unit has left, with the date and time it left;
     - Ready for collection / Not ready for collection: the newest Ready or Not ready tick for this use of the unit (who, when and
       why, on the shared delivery record beside Emptied, merged on its own clock); a tick from before the unit last arrived on
       site belongs to an earlier use and counts for nothing;
     - a toilet or a waste tank is Ready only once it is emptied: the Emptied (pumped out) rule and its gate are unchanged, and an
       emptied unit with no newer Not ready tick reads Ready;
     - nothing recorded: Not ready for collection, not checked yet.
   The pick-up: the Demob plan's day for the reference (each portion's day when it is split) and the load it is on (trucks816):
   a Coates load's planned stop time, a supplier pick-up in site hours (07:00-17:00, their own transport), or the time still to
   be set; the day's chip says how firm it is. Picked up is the existing departure form, which asks for the date and time.
   The day's pick-up list is in two sections, "we need to have a Coates and a sub hired Section in the demob": Coates (our fleet) and
   Sub-hired (by supplier), each with a banner, its tally and a progress bar; the owner is read from the reference's own units. */
(function (W) {
  'use strict';
  const e1231 = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const ok = v => Number.isFinite(Date.parse(v));
  const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  /* a Queensland day and time from a stored stamp: "Mon 26 Oct 07:40" */
  function when(v) {
    if (!ok(v)) return '';
    const d = new Date(Date.parse(v) + 10 * 3600e3);
    return DOW[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MON[d.getUTCMonth()] + ' ' + String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
  }
  function day(iso) { const d = new Date(String(iso).slice(0, 10) + 'T12:00:00Z'); return isNaN(d) ? String(iso || '') : DOW[d.getUTCDay()] + ' ' + d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; }

  /* the newest Ready / Not ready tick for this use: this browser's copy or the shared one, the later stamp winning; the same
     moment with two answers keeps Not ready, as Emptied does */
  function mark(key) {
    const l = ((typeof S !== 'undefined' && S.delivery) || {})[key] || {}, c = ((typeof CROW !== 'undefined' && CROW.get(key)) || {}).delivery || {};
    const both = [l, c].filter(x => typeof x.ready1231 === 'boolean' && ok(x.ready1231_at)).sort((x, y) => String(y.ready1231_at).localeCompare(String(x.ready1231_at)));
    let s = both[0] || null;
    if (both.length === 2 && both[0].ready1231_at === both[1].ready1231_at && both[0].ready1231 !== both[1].ready1231) s = both.find(x => x.ready1231 === false);
    if (!s) return null;
    let on = null; try { on = lastOnSite816(key); } catch (e) { on = null; }
    if (on && Date.parse(s.ready1231_at) < Date.parse(on)) return null;
    return {on: s.ready1231 === true, by: String(s.ready1231_by || ''), at: s.ready1231_at, why: String(s.ready1231_why || '')};
  }
  /* what the departure record says: every unit gone (with the time it left), some gone, or none */
  function gone(key) {
    let st = null; try { st = W.Departure1211 ? W.Departure1211.status(key) : null; } catch (e) { st = null; }
    if (!st) return null;
    const ev = Array.isArray(st.events) ? st.events : [], last = ev[ev.length - 1] || null;
    return {complete: !!st.complete, collected: Number(st.collected) || 0, remaining: Number(st.remaining) || 0, review: !!(st.issues && st.issues.length),
      at: last && ok(last.departedAt1211) ? last.departedAt1211 : null, date: last && last.date || null, by: last && last.by || ''};
  }
  function empty(key) { try { return emptiedOf816(key); } catch (e) { return {on: false}; } }
  /* the one status */
  function state(r) {
    const key = r.key, g = gone(key);
    if (g && g.complete) return {s: 'gone', g};
    const part = g && g.collected > 0 ? g : null, m = mark(key);
    if (r.nothing) return {s: 'none', part};
    if (r.empty) {
      const e = empty(key);
      if (m && !m.on && (!e.on || Date.parse(m.at) >= Date.parse(e.at))) return {s: 'not', m, e, part};
      if (e.on) return {s: 'ready', m: m && m.on ? m : null, e, part};
      return {s: 'not', m, e, part, pump: true};
    }
    if (m) return {s: m.on ? 'ready' : 'not', m, part};
    return {s: 'not', part, unchecked: true};
  }

  /* the loads' stops for one day, worked out once per drawing of the plan */
  let memo = {M: null, days: new Map()};
  function stopsOn(iso) {
    let M = null; try { M = demob816(); } catch (e) { M = null; }
    if (memo.M !== M) memo = {M, days: new Map()};
    if (memo.days.has(iso)) return memo.days.get(iso);
    const out = new Map(); let L = [];
    try { L = trucks816(iso, 'all') || []; } catch (e) { L = []; }
    L.forEach(l => ((l.t && l.t.st) || []).forEach(x => { const s = x && x.s, r = s && s.r; if (!r) return;
      const sup = l.kind === 'supplier', list = out.get(r.key) || []; out.set(r.key, list);
      list.push({iso, time: sup || s.afterSupplier || x.at == null ? null : clock816(x.at), supplier: sup, after: !!s.afterSupplier, group: String(l.group || ''), load: l.n && l.of ? l.n + '/' + l.of : ''}); }));
    memo.days.set(iso, out);
    return out;
  }
  function pickups(r) {
    const days = [...new Set((r.portions && r.portions.length ? r.portions.map(p => p.iso) : [r.iso]).filter(Boolean))].sort();
    const lines = [];
    days.forEach(iso => { const ss = stopsOn(iso).get(r.key) || [];
      if (!ss.length) lines.push({iso, time: '', by: 'time to be set'});
      ss.forEach(s => lines.push(s.supplier ? {iso, time: '07:00–17:00', by: (s.group.split(' · ').pop() || 'Supplier') + ' collect · own transport'}
        : s.after ? {iso, time: 'after the supplier', by: s.group} : {iso, time: s.time || '', by: s.time ? s.group + (s.load ? ' · load ' + s.load : '') : 'time to be set'})); });
    return lines;
  }

  /* ---- the two cells and the buttons on the pick-up list */
  function pickHtml(r) {
    const lines = pickups(r);
    const chip = typeof srcChip816 === 'function' ? srcChip816(r.src) : '';
    if (!lines.length) return '<td data-label="Pick-up" class="pk1231"><span class="w">No pick-up day yet</span> ' + chip + '</td>';
    return '<td data-label="Pick-up" class="pk1231">' + lines.map(x => '<div class="pd1231"><b>' + e1231(day(x.iso)) + '</b>' + (x.time ? '<span class="tm1231">' + e1231(x.time) + '</span>' : '') +
      '<small>' + e1231(x.by) + '</small></div>').join('') + chip + '</td>';
  }
  /* the three lights (Andrew: "3 lights red not ready for collection another light for ready for collection and then another for
     Picked up", then "should green be last its complete"): one lit at a time, in traffic-light order - red not ready for
     collection, amber ready for collection, green picked up (complete). On the edit link each light is its own button; on the
     view link they only show. */
  function lampsHtml(r, x) {
    const ed = typeof canEdit === 'function' && canEdit() && x.s !== 'gone' && x.s !== 'none', k = e1231(r.key);
    const lamp = (s, cls, word, glyph, lit) => (ed ? '<button type="button" class="lp1231 ' + cls + (lit ? ' on' : '') + '" data-lamp1231="' + s + '" data-k1231="' + k + '"' + (lit ? ' aria-current="true"' : '') + ' title="' + e1231(word) + '">' : '<span class="lp1231 ' + cls + (lit ? ' on' : '') + '" title="' + e1231(word) + '">') +
      '<i>' + glyph + '</i><em>' + e1231(word) + '</em>' + (ed ? '</button>' : '</span>');
    return '<div class="lamps1231" role="group" aria-label="' + e1231(r.key + ': ' + (x.s === 'gone' ? 'picked up' : x.s === 'ready' ? 'ready for collection' : 'not ready for collection')) + '">' +
      lamp('not', 'red', 'Not ready', '✕', x.s === 'not') + lamp('ready', 'amber', 'Ready', '●', x.s === 'ready') + lamp('gone', 'green' + (x.part && x.s !== 'gone' ? ' part' : ''), 'Picked up', '✓', x.s === 'gone') + '</div>';
  }
  function statusHtml(r) {
    const x = state(r), L = lampsHtml(r, x);
    const line = (cls, word, note) => '<div class="sl1231"><p class="sw1231 ' + cls + '">' + e1231(word) + '</p>' + (note ? '<small>' + note + '</small>' : '') + '</div>';
    const part = x.part ? '<small class="pt1231">' + x.part.collected + ' picked up · ' + x.part.remaining + ' to go' + (x.part.at ? ' · last ' + e1231(when(x.part.at)) : '') + '</small>' : '';
    if (x.s === 'gone') return '<td data-label="Status" class="st1231 s-gone">' + L + line('gone', 'Picked up', '<b>' + e1231(when(x.g.at) || (x.g.date ? day(x.g.date) + ' · time not recorded' : 'time not recorded')) + '</b>' + (x.g.by ? ' · ' + e1231(x.g.by) : '')) + '</td>';
    if (x.s === 'none') return '<td data-label="Status" class="st1231"><span class="w">Nothing to collect</span>' + part + '</td>';
    if (x.s === 'ready') { const why = x.m ? x.m.by + ' · ' + when(x.m.at) : x.e && x.e.on ? 'emptied · ' + (x.e.by || '') + ' · ' + when(x.e.at) : '';
      return '<td data-label="Status" class="st1231 s-ready">' + L + line('ok', 'Ready for collection', e1231(why)) + part + '</td>'; }
    const why = x.m && !x.m.on ? (x.m.why ? x.m.why + ' · ' : '') + x.m.by + ' · ' + when(x.m.at) : x.pump ? 'pump it out first, then tick it' : 'not checked yet';
    return '<td data-label="Status" class="st1231 s-not">' + L + line('no', 'Not ready for collection', e1231(why)) + part + '</td>';
  }
  function cells(r) { return pickHtml(r) + statusHtml(r); }
  /* the lights are the buttons now; the Actions column keeps the page's own More menu */
  function actions(r) { return ''; }
  /* what it is (Andrew: "remember we need asset no. description . sizes dimensions weights"): the unit asset numbers and the size,
     weight and rating the page itself holds for the reference (Loading931: a recorded actual, the contract's footprint, the
     description's nominal size, the delivered rating, or the 2023 load restraint guide's listed model, which is a reference and
     says so). Nothing is worked out here and no figure is made up. */
  const LABEL = l => /^Recorded actual/.test(l) ? 'Actual' : /^Contract-listed/.test(l) ? 'Footprint (contract)' : /^Nominal/.test(l) ? 'Size (description)' : /^Delivered rating/i.test(l) ? 'Rating (delivered)' : /rating$/i.test(l) ? 'Rating' : /^Guide range/.test(l) ? 'Guide range' : /^Guide reference/.test(l) ? 'Guide model' : l;
  function specs(r) {
    let P = []; try { P = W.Loading931 ? W.Loading931.referenceProducts931(r.a || assetOf(r.key)) || [] : []; } catch (e) { P = []; }
    const nos = [], facts = [];
    P.forEach(p => { (p.units || []).forEach(u => { const n = String(u.assetNo || '').trim(); if (n && !/^MISCITEM|^SUB\b/i.test(n) && nos.indexOf(n) < 0) nos.push(n); });
      (p.facts || []).forEach(f => { const v = (f.values || []).join(' · '); if (!v) return; const s = {k: LABEL(String(f.label || '')), v, guide: /^Guide/.test(String(f.label || ''))}; if (!facts.some(x => x.k === s.k && x.v === s.v)) facts.push(s); }); });
    return {nos, facts};
  }
  function specHtml(r) {
    const s = specs(r); if (!s.nos.length && !s.facts.length) return '';
    const word = f => f.k === 'Guide model' ? 'guide ' + f.v : f.k === 'Guide range' ? 'guide range ' + f.v : f.k === 'Rating' ? f.v : f.v + ' (' + f.k.replace(/^Rating \(|^Size \(|^Footprint \(|\)$/g, '').toLowerCase() + ')';
    return '<div class="sp1231">' + (s.nos.length ? '<div class="an1231">Asset no. <b>' + e1231(s.nos.slice(0, 6).join(' · ')) + '</b>' + (s.nos.length > 6 ? ' <em>+' + (s.nos.length - 6) + ' more</em>' : '') + '</div>' : '') +
      (s.facts.length ? '<div class="fx1231">' + s.facts.slice(0, 3).map(f => e1231(word(f))).join(' · ') + '</div>' : '') + '</div>';
  }
  /* a chip for the loads' tables and anywhere else the plan shows a reference */
  function chip(r) {
    const x = state(r);
    if (x.s === 'gone') return '<span class="chip pill1231 gone sm1231">↗ picked up ' + e1231(when(x.g.at)) + '</span>';
    if (x.s === 'none') return '';
    if (x.s === 'ready') return '<span class="chip pill1231 ok sm1231">✓ ready for collection</span>';
    return '<span class="chip pill1231 no sm1231">' + (x.pump ? 'NOT READY: empty first' : '✕ not ready for collection') + '</span>';
  }

  /* ---- the tick: its own name, time and reason, on the shared delivery record like Emptied */
  function setReady(key, on, why) {
    if (!mayWrite('the ready for collection tick')) return false;
    if (!isRef(key)) { flash(String(key || '') + ' is not a reference in this file - nothing recorded.'); return false; }
    const who = whoAmI(); if (!who) return false;
    S.delivery = S.delivery || {};
    const d = S.delivery[key] || (S.delivery[key] = {}), now = new Date().toISOString(), w = on ? '' : String(why || '').trim().slice(0, 140);
    d.ready1231 = !!on; d.ready1231_by = who; d.ready1231_at = now; d.ready1231_why = w;
    d.ready1231_history = (d.ready1231_history || []).concat([{ready: !!on, at: now, by: who, why: w}]).slice(-400);
    bump(); try { buzz(on ? 50 : 20); } catch (e) {}
    flash(on ? key + ' ready for collection - recorded by ' + who + '.' : key + ' not ready for collection' + (w ? ' (' + w + ')' : '') + ' - recorded by ' + who + '.');
    return true;
  }
  function rowOf(key) { try { return demob816().refs.find(r => r.key === key) || null; } catch (e) { return null; } }
  function ready(key) {
    const r = rowOf(key); if (!r) return false;
    if (r.empty && !empty(key).on) {
      if (!W.confirm(key + ' has no Emptied (pumped out) tick.\n\nOK records it as pumped out and ready for collection, in your name, now.\nCancel leaves it as it is.')) return false;
      if (!setEmptied816(key, true)) return false;
    }
    return setReady(key, true);
  }
  function notReady(key) {
    if (!mayWrite('the ready for collection tick')) return false;
    const why = W.prompt(key + ' - not ready for collection. Why? (optional, e.g. still in use, contents inside, power on)', '');
    if (why === null) return false;
    return setReady(key, false, why);
  }
  function pickedUp(key) {
    const r = rowOf(key); if (!r) return false;
    if (r.empty && !empty(key).on) {
      if (!W.confirm(key + ' has no Emptied (pumped out) tick, and no toilet or waste tank is loaded until it is pumped out.\n\nOK records it as pumped out, in your name, now, then opens the pick-up form.\nCancel leaves it as it is.')) return false;
      if (!setEmptied816(key, true)) return false;
    }
    return collect816(key);
  }

  /* ---- Coates and Sub-hired (Andrew, 26 Oct 2026: "we need to have a Coates and a sub hired Section in the demob"). Who owns what
     is read from the reference's own units (gcUnits925): a reference holding both shows in both sections, each with its own units
     and the same status; one with no unit recorded stays with its Coates branch, owner to confirm. Sub-hired is grouped by supplier. */
  const coName = o => { try { if (W.Units925 && typeof W.Units925.company === 'function') return W.Units925.company(o); } catch (e) {}
    const k = String(o || ''); return {'coates': 'Coates', 'event-portables': 'Event Portables', 'prem-air-hire': 'Premiair Hire', 'unknown': 'Owner to confirm'}[k] || k.replace(/^other:/, '').split('-').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '); };
  function owners(r) {
    let us = []; try { us = gcUnits925(r.a || assetOf(r.key)) || []; } catch (e) { us = []; }
    const by = new Map(); us.filter(u => u && u.physical !== false).forEach(u => { const o = String(u.owner || 'unknown'); by.set(o, (by.get(o) || 0) + 1); });
    const subs = [...by].filter(([o]) => o !== 'coates' && o !== 'unknown').map(([o, n]) => ({o, co: coName(o), n}));
    if (!by.size && r.sub) subs.push({o: 'site', co: String(r.sub), n: 0});
    return {coates: by.get('coates') || 0, unknown: by.get('unknown') || 0, subs, any: by.size > 0};
  }
  const initials = c => String(c).split(/[\s/&]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  const units = n => n + (n === 1 ? ' unit' : ' units');
  function zones(rows, extra) {
    const body = DM816.order.map(z => { const rs = rows.filter(r => r.zone === z); if (!rs.length) return '';
      return '<tr class="zr1231"><th colspan="6">' + e1231(DM816.name[z]) + ' <span>' + rs.length + '</span></th></tr>' + rs.map(r => rowHtml816(r, extra(r))).join(''); }).join('');
    return body ? '<div class="tblwrap daywrap"><table class="daytbl dm816t dm1231">' + TH816 + '<tbody>' + body + '</tbody></table></div>' : '';
  }
  function headHtml(kind, title, sub, rows) {
    const n = {ready: 0, not: 0, gone: 0}; rows.forEach(r => { const s = state(r).s; if (n[s] != null) n[s]++; });
    const all = rows.length || 1, w = k => (Math.round(n[k] / all * 1000) / 10) + '%';
    return '<header class="sh1231"><div class="tt1231"><span class="mono1231">' + (kind === 'coates' ? 'C' : 'S') + '</span><div><b>' + e1231(title) + '</b><span>' + e1231(sub) + '</span></div></div>' +
      '<div class="cnt1231"><span class="c no"><b>' + n.not + '</b>not ready</span><span class="c ok"><b>' + n.ready + '</b>ready</span><span class="c gone"><b>' + n.gone + '</b>picked up</span></div>' +
      '<div class="bar1231" role="img" aria-label="' + e1231(n.gone + ' picked up, ' + n.ready + ' ready for collection, ' + n.not + ' not ready, of ' + rows.length) + '"><i class="g" style="width:' + w('gone') + '"></i><i class="r" style="width:' + w('ready') + '"></i><i class="n" style="width:' + w('not') + '"></i></div></header>';
  }
  function sections(rows) {
    const O = new Map(rows.map(r => [r.key, owners(r)]));
    const cRows = rows.filter(r => { const o = O.get(r.key); return o.coates > 0 || o.unknown > 0 || !o.subs.length; });
    const sup = new Map(); rows.forEach(r => O.get(r.key).subs.forEach(s => { if (!sup.has(s.co)) sup.set(s.co, []); sup.get(s.co).push(r); }));
    const cUnits = cRows.reduce((s, r) => s + O.get(r.key).coates + O.get(r.key).unknown, 0);
    const extraC = r => { const o = O.get(r.key);
      return specHtml(r) + (o.subs.length ? ' <span class="chip own1231">+ ' + e1231(o.subs.map(s => (s.n ? s.n + ' × ' : '') + s.co).join(', ')) + ' · under Sub-hired</span>' : '') +
        (!o.any ? ' <span class="chip cand">owner to confirm</span>' : o.unknown ? ' <span class="chip cand">' + o.unknown + ' owner to confirm</span>' : ''); };
    let html = '';
    if (cRows.length) html += '<section class="sec1231 coates" data-sec1231="coates">' + headHtml('coates', 'Coates', 'Our fleet · ' + cRows.length + ' to pick up · ' + units(cUnits), cRows) + '<div class="sb1231">' + zones(cRows, extraC) + '</div></section>';
    if (sup.size) {
      const sRows = [...new Set([].concat(...sup.values()))];
      const sUnits = sRows.reduce((s, r) => s + O.get(r.key).subs.reduce((a, x) => a + x.n, 0), 0);
      html += '<section class="sec1231 sub" data-sec1231="sub">' + headHtml('sub', 'Sub-hired', 'From our suppliers · ' + sRows.length + ' to pick up · ' + units(sUnits) + ' · ' + sup.size + (sup.size === 1 ? ' supplier' : ' suppliers'), sRows) + '<div class="sb1231">' +
        [...sup.keys()].sort().map(c => { const rs = sup.get(c), u = rs.reduce((s, r) => s + ((O.get(r.key).subs.find(x => x.co === c) || {}).n || 0), 0);
          const extraS = r => { const o = O.get(r.key), mine = o.subs.find(x => x.co === c);
            return specHtml(r) + (o.coates && mine && mine.n ? ' <span class="chip own1231 s">' + mine.n + ' × ' + e1231(c) + '</span> <span class="chip own1231">+ ' + o.coates + ' × Coates · under Coates</span>' : ''); };
          return '<div class="sup1231" data-sup1231="' + e1231(c) + '"><div class="suph1231"><span class="mono1231 s">' + e1231(initials(c)) + '</span><b>' + e1231(c) + '</b><span>' + rs.length + ' to pick up · ' + units(u) + '</span></div>' + zones(rs, extraS) + '</div>'; }).join('') +
        '</div></section>';
    }
    return html;
  }

  /* ---- the day cards, as per what we have (Andrew: "remember the day cards change as per what we have .. also have a picked up
     time and date"): Picked up counts what actually left that day by the departure record, whatever day it was planned for, with
     the last time; Ready for collection and Not ready count the day's planned references still on site. */
  let dmemo = {M: null, by: new Map()};
  const qDay = v => new Date(Date.parse(v) + 10 * 3600e3).toISOString().slice(0, 10);
  const hhmm = v => { const d = new Date(Date.parse(v) + 10 * 3600e3); return String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0'); };
  function departuresOn(iso) {
    let M = null; try { M = demob816(); } catch (e) { M = null; }
    if (dmemo.M !== M) { dmemo = {M, by: new Map()};
      ((M && M.refs) || []).forEach(r => { let st = null; try { st = W.Departure1211 ? W.Departure1211.status(r.key) : null; } catch (e) { st = null; }
        ((st && st.events) || []).forEach(ev => { const at = ok(ev.departedAt1211) ? ev.departedAt1211 : null, d = at ? qDay(at) : (ev.date || null); if (!d) return;
          const list = dmemo.by.get(d) || []; dmemo.by.set(d, list); const had = list.find(x => x.key === r.key);
          if (had) { if (at && (!had.at || at > had.at)) had.at = at; had.complete = !!st.complete; } else list.push({key: r.key, at, complete: !!st.complete}); }); }); }
    return (dmemo.by.get(iso) || []).slice().sort((a, b) => String(a.at || '').localeCompare(String(b.at || '')));
  }
  function dayRows(iso, refs, future) {
    const ev = departuresOn(iso), last = ev.reduce((m, x) => x.at && x.at > m ? x.at : m, '');
    const rs = (refs || []).filter(r => r && r.key && !r.nothing), still = rs.filter(r => state(r).s !== 'gone');
    if (!rs.length && !ev.length) return null;
    let ready = 0, not = 0; still.forEach(r => { const s = state(r).s; if (s === 'ready') ready++; else if (s === 'not') not++; });
    return [{label: 'Picked up', value: ev.length + (last ? ' · last ' + hhmm(last) : '')}, {label: 'Ready for collection', value: ready + ' of ' + still.length}, {label: 'Not ready', value: not}];
  }

  /* ---- after the tab draws: the day's tally and a filter over the pick-up list, and the buttons wired */
  let show = 'all';
  function paint() {
    const pane = document.getElementById('pane-demob'); if (!pane) return;
    const card = pane.querySelector('.dmday816'); if (!card) return;
    const rows = [...card.querySelectorAll('tr[data-row816]')];
    const byKey = new Map(); try { demob816().refs.forEach(r => byKey.set(r.key, r)); } catch (e) {}
    const n = {all: 0, ready: 0, not: 0, gone: 0}, seen = new Map();
    rows.forEach(tr => { const r = byKey.get(tr.dataset.row816); const s = r ? state(r).s : 'not'; tr.dataset.st1231 = s; seen.set(tr.dataset.row816, s); });
    n.all = seen.size; seen.forEach(s => { if (n[s] != null) n[s]++; });
    card.querySelectorAll('button[data-lamp1231]').forEach(b => b.onclick = ev => { ev.preventDefault(); ev.stopPropagation(); const k = b.dataset.k1231, s = b.dataset.lamp1231;
      if (b.classList.contains('on') && s !== 'not') { flash(k + ' is already ' + (s === 'ready' ? 'ready for collection' : 'picked up') + '.'); return; }
      if (s === 'ready') ready(k); else if (s === 'not') notReady(k); else pickedUp(k); });
    let bar = card.querySelector('.sum1231');
    const first = card.querySelector('.sec1231') || card.querySelector('h4.area816');
    if (!rows.length || !first) { if (bar) bar.remove(); return; }
    if (!bar) { bar = document.createElement('div'); bar.className = 'sum1231'; first.parentNode.insertBefore(bar, first); }
    const b = (k, label, c) => '<button type="button" class="f1231 ' + k + '" data-f1231="' + k + '" aria-pressed="' + (show === k) + '"><b>' + c + '</b> ' + label + '</button>';
    const ev = departuresOn(DM816.sel);
    bar.innerHTML = '<span class="h1231">This day · ' + n.all + ' to pick up</span>' + b('all', 'all', n.all) + b('not', 'not ready', n.not) + b('ready', 'ready for collection', n.ready) + b('gone', 'picked up', n.gone) +
      (ev.length ? '<div class="pu1231"><b>Picked up this day</b>' + ev.map(x => '<button type="button" class="linkish" data-pu1231="' + e1231(x.key) + '">' + e1231(x.key) + ' <span>' + e1231(x.at ? hhmm(x.at) : 'time not recorded') + (x.complete ? '' : ' · part') + '</span></button>').join('') + '</div>' : '');
    bar.querySelectorAll('[data-pu1231]').forEach(x => x.onclick = () => { try { openAsset(x.dataset.pu1231); } catch (e) {} });
    bar.querySelectorAll('[data-f1231]').forEach(x => x.onclick = () => { show = x.dataset.f1231; filter(card); bar.querySelectorAll('[data-f1231]').forEach(y => y.setAttribute('aria-pressed', String(y.dataset.f1231 === show))); });
    filter(card);
  }
  function filter(card) {
    card.querySelectorAll('tr[data-row816]').forEach(tr => { tr.hidden = show !== 'all' && tr.dataset.st1231 !== show; });
    card.querySelectorAll('h4.area816').forEach(h => { const wrap = h.nextElementSibling; if (!wrap) return;
      const any = [...wrap.querySelectorAll('tr[data-row816]')].some(tr => !tr.hidden); h.hidden = !any; wrap.hidden = !any; });
    card.querySelectorAll('tr.zr1231').forEach(z => { let n = z.nextElementSibling, any = false; while (n && !n.classList.contains('zr1231')) { if (n.matches('tr[data-row816]') && !n.hidden) any = true; n = n.nextElementSibling; } z.hidden = !any; });
    card.querySelectorAll('table.dm1231').forEach(tb => { const w = tb.closest('.tblwrap'); if (w) w.hidden = ![...tb.querySelectorAll('tr[data-row816]')].some(tr => !tr.hidden); });
    card.querySelectorAll('.sup1231, .sec1231').forEach(b => { b.hidden = ![...b.querySelectorAll('tr[data-row816]')].some(tr => !tr.hidden); });
  }

  if (typeof notReady816 === 'function') { const before = notReady816; notReady816 = function (r) { try { return chip(r); } catch (e) { return before.apply(this, arguments); } }; }
  if (typeof listHtml816 === 'function') { const before = listHtml816; listHtml816 = function (rows) { if (!rows || !rows.length) return before.apply(this, arguments); try { return sections(rows); } catch (e) { return before.apply(this, arguments); } }; }
  if (typeof renderDemob816 === 'function') { const before = renderDemob816; renderDemob816 = function () { const v = before.apply(this, arguments); try { paint(); } catch (x) {} return v; }; Object.assign(renderDemob816, before); }
  W.Ready1231 = Object.freeze({mark, gone, state, pickups, owners, sections, specs, departuresOn, cells, actions, chip, dayRows, setReady, ready, notReady, pickedUp, when, paint});
  try { const p = document.getElementById('pane-demob'); if (p && !p.hidden && typeof renderDemob816 === 'function') renderDemob816(); } catch (e) {}
})(window);
</script>
<style id="ready1231-style">
#pane-demob .pk1231{min-width:150px}
#pane-demob .pd1231{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 7px;margin-bottom:4px}
#pane-demob .pd1231 b{font:800 13px/1.25 Inter,Arial,sans-serif;color:var(--ink,#13202a);white-space:nowrap}
#pane-demob .pd1231 .tm1231{font:800 13px/1.25 Inter,Arial,sans-serif;color:#c2410c;font-variant-numeric:tabular-nums;white-space:nowrap}
#pane-demob .pd1231 small{flex-basis:100%;font:500 11px/1.3 Inter,Arial,sans-serif;color:var(--slate,#5b6b75)}
#pane-demob .st1231{min-width:180px}
#pane-demob .st1231 small{display:block;margin-top:4px;font:500 11px/1.35 Inter,Arial,sans-serif;color:var(--slate,#5b6b75)}
#pane-demob .st1231 small b{color:var(--ink,#13202a)}
#pane-demob .st1231 .pt1231{color:#9a3412;font-weight:700}
#pane-demob .pill1231{display:inline-flex;align-items:center;gap:6px;padding:5px 11px 5px 5px;border-radius:999px;font:800 12px/1.1 Inter,Arial,sans-serif;letter-spacing:.01em;white-space:nowrap}
#pane-demob .pill1231 i{display:inline-grid;place-items:center;width:19px;height:19px;border-radius:50%;font:900 11px/1 Inter,Arial,sans-serif;font-style:normal;color:#fff}
#pane-demob .pill1231.ok{background:#fff4dc;color:#92400e;box-shadow:inset 0 0 0 1px #fcd38d}
#pane-demob .pill1231.ok i{background:linear-gradient(180deg,#fbbf24,#d97706)}
#pane-demob .pill1231.no{background:#fdeceb;color:#b42318;box-shadow:inset 0 0 0 1px #f5b5b5}
#pane-demob .pill1231.no i{background:#d92d20}
#pane-demob .pill1231.gone{background:#e3f6ec;color:#0d6b3f;box-shadow:inset 0 0 0 1px #9fdcbc}
#pane-demob .pill1231.gone i{background:linear-gradient(180deg,#2fd387,#0f9b5a)}
#pane-demob .chip.pill1231.sm1231{padding:3px 8px;font-size:10.5px;gap:4px}
#pane-demob .ac1231{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}
#pane-demob .ac1231 .btn{min-height:36px;padding:6px 11px;font-weight:700}
#pane-demob .ac1231 .rd1231.on{background:#0f9b5a;border-color:#0b7a46;color:#fff}
#pane-demob .ac1231 .nr1231.on{background:#d92d20;border-color:#b42318;color:#fff}
#pane-demob .ac1231 .pu1231{background:#1f2c34;border-color:#0d161b;color:#fff}
#pane-demob .sum1231{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:4px 0 14px;padding:10px 12px;border-radius:10px;background:#13202a;color:#fff}
#pane-demob .sum1231 .h1231{font:800 12px/1.2 Inter,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#ffc79c;margin-right:6px}
#pane-demob .sum1231 .f1231{min-height:36px;padding:6px 12px;border-radius:999px;border:1px solid #3b4d58;background:#1d2d37;color:#e6eef2;font:600 12px/1.2 Inter,Arial,sans-serif;cursor:pointer}
#pane-demob .sum1231 .f1231 b{font-weight:900;margin-right:3px}
#pane-demob .sum1231 .f1231.ready b{color:#fcd34d}
#pane-demob .sum1231 .f1231.not b{color:#ff8a80}
#pane-demob .sum1231 .f1231.gone b{color:#5ff0a7}
#pane-demob .sum1231 .pu1231{flex-basis:100%;display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding-top:8px;border-top:1px solid #ffffff1f;font:600 12px/1.3 Inter,Arial,sans-serif}
#pane-demob .sum1231 .pu1231 b{font-weight:800;letter-spacing:.1em;text-transform:uppercase;font-size:11px;color:#5ff0a7}
#pane-demob .sum1231 .pu1231 .linkish{color:#fff;font-weight:800;text-decoration:none;padding:4px 9px;border-radius:999px;background:#0f9b5a33;border:1px solid #2fd38766}
#pane-demob .sum1231 .pu1231 .linkish span{margin-left:6px;font-weight:600;color:#c9f7dc}
#pane-demob .sum1231 .f1231[aria-pressed=true]{background:#fff;color:#13202a;border-color:#fff}
#pane-demob .sum1231 .f1231[aria-pressed=true] b{color:inherit}
#pane-demob tr[data-st1231=gone] td{background:#f3fbf6}
#pane-demob tr[data-st1231=ready] td.st1231{background:#fffaf0}
/* the three lights: a signal head, one lamp lit */
#pane-demob .lamps1231{display:inline-flex;gap:2px;padding:4px 5px;border-radius:12px;background:linear-gradient(180deg,#26323a,#141c21);box-shadow:inset 0 1px #ffffff1a,inset 0 -2px 6px #0007,0 3px 8px #0b141a33;margin-bottom:6px}
#pane-demob .lp1231{display:inline-flex;flex-direction:column;align-items:center;gap:3px;min-width:52px;padding:4px 3px 3px;border:0;border-radius:10px;background:transparent;color:#8a99a2;font:700 9.5px/1.1 Inter,Arial,sans-serif;letter-spacing:.04em;text-transform:uppercase;cursor:default}
#pane-demob button.lp1231{cursor:pointer}
#pane-demob .lp1231[aria-pressed]{border:0;outline:0;box-shadow:none;min-height:0}
#pane-demob .lp1231.on{background:#ffffff14}
#pane-demob button.lp1231:hover{background:#ffffff12}
#pane-demob button.lp1231:focus-visible{outline:3px solid #ffb472;outline-offset:1px}
#pane-demob .lp1231 i{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;font:900 14px/1 Inter,Arial,sans-serif;font-style:normal;color:#ffffff38;background:radial-gradient(circle at 35% 30%,#3a464e,#1c252b 70%);box-shadow:inset 0 2px 4px #0009,0 0 0 2px #0e1418}
#pane-demob .lp1231 em{font-style:normal;white-space:nowrap;font-size:8.5px}
#pane-demob .lp1231.on em{color:#fff}
#pane-demob .lp1231.red.on i{color:#fff;background:radial-gradient(circle at 35% 30%,#ff9a8f,#e5281b 60%,#a3150b);box-shadow:0 0 0 2px #0e1418,0 0 14px #ff3b2f,0 0 28px #ff3b2f66}
#pane-demob .lp1231.amber.on i{color:#fff;background:radial-gradient(circle at 35% 30%,#ffe29a,#f59e0b 60%,#b45309);box-shadow:0 0 0 2px #0e1418,0 0 14px #fbbf24,0 0 28px #fbbf2466}
#pane-demob .lp1231.green.on i{color:#fff;background:radial-gradient(circle at 35% 30%,#a7f7c9,#19c46a 60%,#0b7d41);box-shadow:0 0 0 2px #0e1418,0 0 14px #2ee582,0 0 28px #2ee58266}
#pane-demob .lp1231.green.part i{color:#bff5d6;box-shadow:inset 0 2px 4px #0009,0 0 0 2px #19c46a}
#pane-demob .sl1231{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 6px}
#pane-demob .st1231 .sl1231 small{display:inline;margin:0}
#pane-demob .sw1231{margin:0;font:800 12.5px/1.25 Inter,Arial,sans-serif}
#pane-demob .sw1231.no{color:#b42318}
#pane-demob .sw1231.ok{color:#b45309}
#pane-demob .sw1231.gone{color:#0d7a46}
/* what it is: asset numbers, size, weight and rating as the page holds them */
#pane-demob .sp1231{margin-top:5px;font:500 11.5px/1.45 Inter,Arial,sans-serif;color:#5b6b75}
#pane-demob .sp1231 .an1231 b{font-weight:700;color:#24323a;font-variant-numeric:tabular-nums}
#pane-demob .sp1231 em{font-style:normal;color:#9a3412}
/* one header per table, the areas as thin separator rows; the run is in the pick-up column, not repeated as a chip */
#pane-demob table.dm1231 tr.zr1231 th{padding:12px 4px 6px;background:transparent;border:0;text-align:left;font:800 12px/1.2 Inter,Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:#13202a}
#pane-demob table.dm1231 tr.zr1231 th span{margin-left:6px;padding:1px 7px;border-radius:99px;background:#e8edf0;color:#3d4d56;font-size:11px;letter-spacing:0}
#pane-demob table.dm1231 tr.zr1231[hidden]{display:none!important}
#pane-demob .sec1231 td[data-label="What"] .chip.ref{display:none}
@media (min-width:901px){#pane-demob table.dm1231{table-layout:fixed;width:100%}#pane-demob table.dm1231 th:nth-child(1){width:92px}#pane-demob table.dm1231 th:nth-child(3){width:76px}#pane-demob table.dm1231 th:nth-child(4){width:178px}#pane-demob table.dm1231 th:nth-child(5){width:268px}#pane-demob table.dm1231 th:nth-child(6){width:86px}}
@media (max-width:900px){#pane-demob table.dm1231 tbody tr.zr1231{display:block;padding:12px 4px 2px;border:0;background:transparent}#pane-demob table.dm1231 tbody tr.zr1231 th{display:block;padding:0}}
/* the two sections: Coates and Sub-hired, each with its own banner, tally and progress */
#pane-demob .sec1231{margin:0 0 18px;border-radius:14px;overflow:hidden;border:1px solid #d5dde2;background:#fff;box-shadow:0 8px 22px #0b141a17}
#pane-demob .sec1231>.sh1231{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px 18px;align-items:center;padding:16px 18px 15px;color:#fff}
#pane-demob .sec1231.coates>.sh1231{background:radial-gradient(120% 160% at 100% 0%,#ff6a1326 0%,transparent 55%),linear-gradient(120deg,#1d272d 0%,#121a1f 60%,#0c1317 100%);border-top:4px solid #ff6a13}
#pane-demob .sec1231.sub>.sh1231{background:radial-gradient(120% 160% at 100% 0%,#22c3e626 0%,transparent 55%),linear-gradient(120deg,#0f3b4b 0%,#0a2b37 60%,#072029 100%);border-top:4px solid #22c3e6}
#pane-demob .tt1231{display:flex;align-items:center;gap:13px;min-width:0}
#pane-demob .tt1231 b{display:block;font:italic 800 30px/1 'Barlow Condensed','Arial Narrow',Arial,sans-serif;letter-spacing:.03em;text-transform:uppercase;color:#fff}
#pane-demob .tt1231>div>span{display:block;margin-top:5px;font:600 12.5px/1.3 Inter,Arial,sans-serif;color:#c9d7de}
#pane-demob .tt1231 .mono1231,#pane-demob .mono1231{display:inline-grid;place-items:center;flex:0 0 auto;width:44px;height:44px;border-radius:12px;font:italic 800 22px/1 'Barlow Condensed','Arial Narrow',Arial,sans-serif;color:#fff;background:linear-gradient(180deg,#ff8a3d,#e8540c);box-shadow:inset 0 1px #ffffff47,0 5px 12px #0006}
#pane-demob .sec1231.sub .mono1231,#pane-demob .mono1231.s{background:linear-gradient(180deg,#3ad6f3,#0b8eaf)}
#pane-demob .cnt1231{display:flex;flex-wrap:wrap;gap:7px;justify-content:flex-end}
#pane-demob .cnt1231 .c{display:inline-flex;align-items:baseline;gap:6px;padding:7px 12px;border-radius:999px;background:#ffffff12;border:1px solid #ffffff29;font:600 12px/1 Inter,Arial,sans-serif;color:#dce7ec;white-space:nowrap}
#pane-demob .cnt1231 .c b{font:900 17px/1 Inter,Arial,sans-serif}
#pane-demob .cnt1231 .c.ok b{color:#fcd34d}
#pane-demob .cnt1231 .c.no b{color:#ff8a80}
#pane-demob .cnt1231 .c.gone b{color:#5ff0a7}
#pane-demob .bar1231{grid-column:1/-1;display:flex;height:8px;border-radius:99px;overflow:hidden;background:#ffffff21}
#pane-demob .bar1231 i{display:block;height:100%}
#pane-demob .bar1231 i.g{background:linear-gradient(90deg,#4ade80,#16a34a)}
#pane-demob .bar1231 i.r{background:linear-gradient(90deg,#fcd34d,#f59e0b)}
#pane-demob .bar1231 i.n{background:linear-gradient(90deg,#f87171,#dc2626)}
#pane-demob .sb1231{padding:12px 14px 6px}
#pane-demob .sup1231+.sup1231{margin-top:12px;padding-top:12px;border-top:1px dashed #c6dfe7}
#pane-demob .suph1231{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;margin:2px 0 8px}
#pane-demob .suph1231 .mono1231{width:34px;height:34px;border-radius:10px;font-size:16px}
#pane-demob .suph1231 b{font:800 17px/1.2 Inter,Arial,sans-serif;color:#0a3442}
#pane-demob .suph1231>span:not(.mono1231){font:600 12px/1.3 Inter,Arial,sans-serif;color:#4a6672}
#pane-demob .chip.own1231{background:#eef6f9;color:#0b4a5e;border:1px solid #bfe0ea}
#pane-demob .chip.own1231.s{background:#dff5fb;color:#075e75;border-color:#9fdcec;font-weight:800}
#pane-demob .sec1231[hidden],#pane-demob .sup1231[hidden]{display:none!important}
@media (max-width:700px){#pane-demob .sec1231>.sh1231{grid-template-columns:1fr;padding:14px 14px 13px}#pane-demob .cnt1231{justify-content:flex-start}#pane-demob .tt1231 b{font-size:26px}#pane-demob .sb1231{padding:10px 8px 4px}}
#pane-demob tr[data-row816][hidden],#pane-demob h4.area816[hidden],#pane-demob .tblwrap[hidden]{display:none!important}
/* on a phone each row is a card: the plate and what it is first, then its status and pick-up, the branch, and the buttons last */
@media (max-width:900px){#pane-demob .daywrap table.daytbl td.st1231{order:3}#pane-demob .daywrap table.daytbl td.pk1231{order:4}#pane-demob .daywrap table.daytbl td[data-label="Branch"]{order:5}#pane-demob .ac1231 .btn{min-height:42px;flex:1 1 auto}}
@media print{#pane-demob .sum1231,#pane-demob .ac1231{display:none}}
</style>
