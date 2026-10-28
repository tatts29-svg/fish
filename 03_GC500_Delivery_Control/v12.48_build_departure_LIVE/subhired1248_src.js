/* Author: Andrew Fisher. Read-only supplier-unit departure presentation. */
(function (root) {
  'use strict';
  const list = value => Array.isArray(value) ? value : [];
  const text = value => String(value == null ? '' : value);
  const norm = value => text(value).trim().toLowerCase().replace(/\s+/g, ' ');
  const escape = value => text(value).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const count = value => Number.isSafeInteger(value) && value >= 0;

  function create(dependencies) {
    const departures = () => dependencies.departures();
    function status(ref) {
      if (!text(ref).trim()) return null;
      try { return departures()?.status(ref) || null; } catch (_) { return null; }
    }
    function review() { return {kind: 'review', label: 'Departure record needs review'}; }
    function unit(ref, id, item, physical) {
      if (physical !== true || !text(id).trim() || !norm(item)) return null;
      const current = status(ref);
      if (!current) return null;
      if (list(current.issues).length) return review();
      let event = null;
      try { event = departures()?.unit(ref, id, undefined, item) || null; } catch (_) { return null; }
      if (event) return {kind: 'left', label: 'Left site', event};
      if (current.collected > 0) return {kind: 'reference', label: 'Reference: ' + text(current.label) + (current.unknown ? ' · quantity to confirm' : '')};
      return null;
    }
    function quantity(ref, item) {
      if (!norm(item)) return null;
      const current = status(ref);
      if (!current) return null;
      if (list(current.issues).length) return review();
      const taken = list(current.taken1229).filter(row => norm(row?.type) === norm(item));
      const remaining = list(current.items).filter(row => norm(row?.type) === norm(item));
      if (!taken.length || !taken.some(row => row.n > 0)) return null;
      if (taken.length !== 1 || remaining.length !== 1 || !count(taken[0].n) || !count(remaining[0].n)) return review();
      const collected = taken[0].n, left = remaining[0].n;
      const events = list(current.events).filter(event => list(event?.items).some(row => norm(row?.type) === norm(item) && row.n > 0));
      const event = events[events.length - 1] || null;
      if (!event) return review();
      if (current.unknown || taken[0].unknown || remaining[0].unknown) return {kind: 'reference', label: collected + ' left · remaining quantity to confirm'};
      return left === 0
        ? {kind: 'left', label: 'Left site · ' + collected + ' of ' + collected, event}
        : {kind: 'partial', label: collected + ' of ' + (collected + left) + ' left · ' + left + ' to leave', event};
    }
    function html(model) {
      if (!model) return '';
      let detail = '';
      if (model.kind === 'left') {
        try {
          const stamp = dependencies.stamp();
          if (stamp?.html) detail = stamp.html({at: model.event?.departedAt1211 || null, date: model.event?.date || null, by: model.event?.by || ''});
        } catch (_) { /* The native words remain available if the stamp cannot render. */ }
      } else if (model.kind === 'partial') {
        try { detail = '<span class="sh1248-note">Last departure · ' + escape(departures()?.stamp(model.event) || 'time not recorded') + '</span>'; } catch (_) {}
      }
      return '<span class="sh1248-status" data-subhired1248="' + escape(model.kind) + '"><strong>' + (model.kind === 'left' ? '↗ ' : '') + escape(model.label) + '</strong>' + detail + '</span>';
    }
    return Object.freeze({unit, quantity, html, unitHtml: (ref, id, item, physical) => html(unit(ref, id, item, physical)), quantityHtml: (ref, item) => html(quantity(ref, item))});
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {create};
  if (root) root.Subhired1248 = create({departures: () => root.Departure1211, stamp: () => root.Stamp1232});
})(typeof window === 'undefined' ? null : window);
