/* v8.87 map explorer START */
/* v8.87 - Author: Andrew Fisher. THE MAP EXPLORER SAYS WHAT HAS BEEN DONE, AND FENCING CLOSES LIKE EVERYTHING ELSE.
   Andrew, 7 Oct 2026: "maps need some work its very very clunky ... when you click on example building nothing is clearly saying
   what has been done. also yuou need to tap fencing or close fencing to close that."
   The explorer itself is in the machine set (explorer/), released with this page. This page's part:
   - gc500PlanCard, which the explorer's unit card asks, now carries the Timeline's own five-stage reading (timeline841State: Off site,
     In transit, On site, At location, Installed, Finished), who recorded each step and when, the due day and what is left, so the card
     never says "On site" for an on-hire record whose delivery is unconfirmed - it says what the Timeline says;
   - gc500ExplorerProgress opens the delivery progress dialog from the card's Progress button;
   - Escape with the focus in this page closes Fencing on the map, then a map selection, then the unit card (a dialog or the drawer
     keeps its own Escape). Nothing here changes a record. */
(function () {
  'use strict';
  const planCard0 = window.gc500PlanCard;
  if (typeof planCard0 !== 'function') return;
  const TONE = {green: '#39e07a', amber: '#ffb000', red: '#ff4d4d', none: '#9aa3ad', cx: '#9aa3ad'};
  const stamp = iso => { try { return iso && typeof fmtStamp === 'function' ? fmtStamp(iso) : (iso || ''); } catch (e) { return String(iso || ''); } };
  const who = (by, at) => [by || '', at ? stamp(at) : ''].filter(Boolean).join(' · ');
  const day = iso => { try { return typeof fmtDate === 'function' ? fmtDate(iso) : String(iso); } catch (e) { return String(iso); } };
  function progress887(key) {
    const a = allAssets().find(x => x.key === key); if (!a) return null;
    const d = deliveryOf(key), v = timeline841State(a), proof = typeof timeline841Proof === 'function' ? timeline841Proof(key) : null;
    const hire = !!(d.recorded && d.where === 'rental' && !d.done);
    const kind = typeof refKind === 'function' ? refKind(a) : 'other';
    const lines = [];
    if (d.moved) lines.push({k: 'Record', text: 'Moved to ' + d.moved.to + (d.moved.by ? ' by ' + d.moved.by : ''), done: false});
    else if (!d.recorded) lines.push({k: 'Delivery', text: 'No delivery record yet', done: false});
    else if (hire) lines.push({k: 'On hire', text: 'from ' + day(d.rental.from) + (d.rental.from_time ? ' ' + d.rental.from_time : '') + ' · the rental system · delivery not confirmed', done: false});
    else { const L = typeof LIGHT !== 'undefined' && LIGHT[d.state] ? LIGHT[d.state].label : (d.state || 'Recorded'); lines.push({k: L, text: who(d.by, d.set_at) || 'recorded', done: d.state === 'on site'}); }
    if (proof && proof.stage >= 3 && !d.moved) lines.push({k: proof.stage === 4 ? 'Installed' : 'At location', text: who(proof.by, proof.recorded_at || proof.at) || 'confirmed', done: true});
    if (kind === 'building' || kind === 'toilet') {
      lines.push({k: 'Levelled', text: d.levelled ? (who(d.levelled_by, d.levelled_at) || 'recorded') : 'not yet', done: !!d.levelled});
      lines.push({k: 'Steps', text: d.steps ? (who(d.steps_by, d.steps_at) || 'recorded') : 'not yet', done: !!d.steps});
    }
    lines.push({k: 'Finished', text: d.done ? (who(d.done_by, d.done_at) || 'Complete recorded') : 'Complete check still open', done: !!d.done});
    let due = ''; try { const eff = effectiveDates(a), dIn = (eff && eff.in) || a.first_date; if (dIn) due = 'Due ' + day(dIn) + (eff && eff.in_moved && eff.in_plan ? ' (moved from ' + day(eff.in_plan) + ')' : '') + (d.eta ? ' · ' + d.eta : ''); if (eff && eff.out) due += (due ? ' · ' : '') + 'Out ' + day(eff.out); } catch (e) {}
    const after = v.blocked ? [] : v.stage >= 5 ? [] : v.stage === 4 ? ['Finished'] : v.stage === 3 ? ['Installed', 'Finished'] : (v.stage === 2 && v.arrived) ? ['At location', 'Installed', 'Finished']
      : v.stage === 2 ? ['On site', 'At location', 'Installed', 'Finished'] : hire ? ['On site (confirm the delivery)', 'At location', 'Installed', 'Finished'] : ['In transit', 'On site', 'At location', 'Installed', 'Finished'];
    const left = v.blocked ? '' : v.conflict ? 'Resolve the short delivery before calling it finished.' : v.stage >= 5 ? 'Nothing left: finished.' : 'Still to come: ' + after.join(' → ');
    return {stage: {n: v.stage, label: v.label, tone: v.tone || 'none', why: v.why || '', arrived: !!v.arrived, lamps: [v.arrived ? 'On site' : 'Off site', 'Transit', 'Location', 'Installed', 'Finished']},
      status: v.label, statusColour: TONE[v.tone] || TONE.none, lines, due, left, hire, progress: typeof timeline841Dialog === 'function' && !a._cancelled};
  }
  window.gc500PlanCard = function (key) {
    const base = planCard0.apply(this, arguments);
    if (!base) return base;
    try { const p = progress887(key); if (p) Object.assign(base, p); } catch (e) {}
    return base;
  };
  window.gc500PlanProgress887 = key => { try { return progress887(key); } catch (e) { return null; } };
  window.gc500ExplorerProgress = function (key) {
    try { const k = String(key || ''); if (k && typeof timeline841Dialog === 'function' && typeof assetOf === 'function' && assetOf(k)) { timeline841Dialog(k); return true; } } catch (e) {}
    return false;
  };
  /* Escape with the focus in this page: Fencing on the map, then a map selection, then the unit card. The explorer's own frame handles
     the same key when the focus is inside it; a dialog, the drawer or the full-screen map keep their own Escape. */
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape' || ev.defaultPrevented) return;
    if (typeof state === 'undefined' || state.tab !== 'map') return;
    if (document.body.classList.contains('expfull-on')) return;
    if (document.querySelector('dialog[open]')) return;
    const dr = document.getElementById('drawer'); if (dr && dr.classList.contains('on')) return;
    const w = typeof expApi === 'function' ? expApi() : null; if (!w) return;
    try {
      const fm = w.GC500FencingMap;
      if (fm && (fm.active || (fm.state && fm.state.active))) { fm.close(); ev.preventDefault(); return; }
      const x = w.GC500Explorer864; if (x && x.state && x.state.clearShown) { x.clear(); ev.preventDefault(); return; }
      const c = w.document.getElementById('xcard'); if (c && !c.hidden) { c.hidden = true; ev.preventDefault(); }
    } catch (e) {}
  });
  window.gc500Map887 = true;
})();
/* v8.87 map explorer END */
