/* Author: Andrew Fisher. Current, read-only reference context for Today count details.
   Count scope and selected-day completion stay in the existing progress models.
   A recorded identifier or photograph does not identify which units remain unfinished. */
function todayLinkedReferences844(keys, options) {
  const run = () => {
    const opts = options || {}, currentDay = todayIso(), asOf = opts.asOf || currentDay;
    const itemName = typeof opts.itemName === 'string' ? opts.itemName : null;
    const issues = [], hosted = typeof DATA !== 'undefined' && DATA.edition === 'hosted';
    const base = typeof todayWorkHealth840 === 'function' ? todayWorkHealth840() : {ready: !hosted, status: hosted ? 'connecting' : 'file'};
    // These are the native SYNC_COLLS keys, not separate stores owned by this view.
    const required = ['photoLinks', 'dropPhotos', 'fixes', 'places', 'units', 'subhire', 'locations', 'supplied'];
    const missing = hosted ? required.filter(k => typeof SYNC === 'undefined' || !SYNC.first || !SYNC.first.has(k)) : [];
    const ready = !!base.ready && !missing.length;
    const loading = !ready && !['unreachable', 'revoked'].includes(base.status);
    if (!ready) issues.push(loading ? 'Waiting for shared reference details.' : 'Shared reference details are unavailable.');
    if (base.stale) issues.push('Showing the last received shared records; the connection is unavailable.');
    const call = (fn, args, fallback, list, label) => {
      try { return typeof fn === 'function' ? fn(...args) : fallback; }
      catch (e) { if (list && label) list.push(label + ' could not be read.'); return fallback; }
    };
    const list = call(typeof allAssets === 'function' ? allAssets : null, [], [], issues, 'Reference list');
    const assets = new Map((list || []).filter(a => a && a.key != null).map(a => [String(a.key), a]));
    const uniqueKeys = [...new Set((Array.isArray(keys) ? keys : []).filter(k => typeof k === 'string' && k.length))];
    const safeURL = value => {
      if (typeof value !== 'string' || !value.trim()) return null;
      const s = value.trim();
      if (/^data:/i.test(s)) return /^data:image\/(?:jpeg|png|webp|gif|bmp);base64,/i.test(s) ? s : null;
      try { return ['https:', 'http:'].includes(new URL(s, 'https://gc500.invalid/').protocol) ? s : null; }
      catch (e) { return null; }
    };
    const rows = uniqueKeys.map(key => {
      const a = assets.get(key), rowIssues = [];
      const row = {key, name: a ? a.name || a.product || key : key, found: !!a,
        destination: {known: false, text: '', source: 'not recorded', fallback: 'Destination not recorded — confirm before dispatch.', kind: 'unknown', approx: false, label: 'Destination not recorded', note: '', hasMap: false},
        current: {label: ready ? 'Shared status unavailable' : loading ? 'Waiting for shared reference details' : 'Shared reference details unavailable', state: null, recorded: false, done: false, review: null, stage: null, tone: 'none', basis: 'Current shared record · ' + currentDay},
        identifiers: [], identifierBasis: 'Identifiers are recorded against this reference. Native inventory associations may allocate numbers by order capacity; neither identifies which units remain unfinished.',
        photos: [], photoCount: 0, readyPhotoCount: 0, photoState: ready ? 'unavailable' : loading ? 'loading' : 'failed',
        photoNote: 'Current photographs of this reference are context, not proof of the selected type or which units remain unfinished.',
        issues: rowIssues, actions: {referenceKey: a ? key : null, mapKey: null}};
      if (!a) { rowIssues.push(ready ? 'This exact reference is not in the current shared list.' : 'The shared reference list has not finished loading.'); return row; }
      if (!ready) return row;

      const w = call(typeof destinationOf === 'function' ? destinationOf : null, [a], {}, rowIssues, 'Written destination') || {};
      const d = call(typeof dest782 === 'function' ? dest782 : null, [a], null, rowIssues, 'Qualified destination');
      const map = call(typeof mapPlaceFor === 'function' ? mapPlaceFor : null, [a], null, rowIssues, 'Map position');
      const sheet = map ? null : call(typeof mapSheetFor === 'function' ? mapSheetFor : null, [a], null, rowIssues, 'Drawing');
      const master = call(typeof masterLoc === 'function' ? masterLoc : null, [key], null, rowIssues, 'Master position');
      const masterText = master ? call(typeof masterWords === 'function' ? masterWords : null, [master], '', rowIssues, 'Master position wording') : '';
      const dest = row.destination;
      dest.hasMap = !!(map || sheet); row.actions.mapKey = dest.hasMap ? key : null;
      dest.known = !!w.known; dest.text = w.known ? w.text || '' : '';
      dest.source = w.source || 'not recorded'; dest.fallback = w.fallback || dest.fallback;
      dest.kind = w.known ? w.confidence || 'written' : 'unknown';
      dest.label = w.known ? 'Recorded destination' : 'Destination not recorded';
      const notes = [w.quote || '', w.also || ''];
      if (d) {
        dest.kind = d.kind || dest.kind; dest.approx = !!d.approx;
        const labels = {master: 'Master plan position', confirmed: 'Confirmed position', unverified: 'Drawing position — not verified',
          pinned: 'Recorded phone pin', placed: 'Placed on map — not checked', area: 'Planned area — not an exact spot',
          report: 'Report point — final drop-off not set', desc: d.approx ? 'Description position — approximate' : 'Position from the description'};
        dest.label = labels[d.kind] || d.label || dest.label;
        dest.source = {master: 'master plan', confirmed: 'confirmed position', unverified: 'unverified drawing position',
          pinned: 'phone pin', placed: 'map placement', area: 'planned area', report: 'native reporting instruction', desc: 'reference description'}[d.kind] || dest.source;
        if (d.kind === 'report') {
          dest.known = false; dest.text = 'Report to the pit lane; site directs the final drop-off.';
          dest.fallback = d.nav || dest.text;
          if (w.known && w.text) notes.push('Schedule wording: ' + w.text + '. This is not a confirmed drop-off.');
        } else if (['master', 'confirmed', 'unverified'].includes(d.kind)) {
          dest.known = d.kind !== 'unverified';
          dest.text = masterText || (d.kind === 'master' ? 'Master plan position for ' + key : d.nav || dest.label + ' for ' + key);
          if (w.known && w.text && w.text !== dest.text) notes.push('Schedule wording: ' + w.text);
        } else {
          dest.known = !d.approx && !['placed', 'area'].includes(d.kind);
          dest.text = w.known && w.text || d.nav || dest.label + ' for ' + key;
        }
        if (d.nav) notes.push(d.nav); else if (d.sms) notes.push(d.sms);
      }
      if (!dest.text) dest.text = dest.fallback;
      if (dest.known) dest.fallback = '';
      dest.note = [...new Set(notes.filter(Boolean))].join(' · ');

      const delivery = call(typeof deliveryOf === 'function' ? deliveryOf : null, [key], {}, rowIssues, 'Delivery status') || {};
      const stage = call(typeof timeline841State === 'function' ? timeline841State : null, [a], null, rowIssues, 'Current work status');
      row.current = {label: stage && stage.label || (delivery.done ? 'Complete recorded' : delivery.where === 'rental' ? 'On hire · delivery unconfirmed' : delivery.recorded ? delivery.state || 'Status recorded' : 'No delivery record'),
        state: delivery.state || null, recorded: !!delivery.recorded, done: !!delivery.done,
        review: stage ? !!delivery.done && stage.stage !== 5 : null, stage: stage ? stage.stage : null, tone: stage && stage.tone || 'none',
        where: delivery.where || null, recordedAt: delivery.set_at || null, completeAt: delivery.done_at || null,
        note: stage && stage.why || '', basis: 'Current shared record · ' + currentDay + (asOf !== currentDay ? ' · separate from completion as of ' + asOf : '')};

      const ids = new Map();
      const addId = (value, label, source) => {
        if (value == null || !String(value).trim()) return;
        const valueText = String(value).trim(); if (/^MISCITEM$/i.test(valueText)) return;
        if (!ids.has(valueText)) ids.set(valueText, {value: valueText, label, source, scope: 'reference', itemName: null});
      };
      const units = call(typeof unitsOf === 'function' ? unitsOf : null, [key], [], rowIssues, 'Recorded unit identifiers') || [];
      units.forEach(u => { if (u) addId(u.asset_no || u.label, u.asset_no ? u.label || 'Recorded unit number' : 'Recorded unit label', 'Unit recorded against this reference'); });
      const rehired = call(typeof subOf === 'function' ? subOf : null, [key], [], rowIssues, 'Rehire identifiers') || [];
      rehired.forEach(u => { if (u) addId(u.no, u.co ? u.co + ' fleet number' : 'Rehire fleet number', u.source || 'Native rehire record against this reference'); });
      const numbers = call(typeof assetNumbersOf === 'function' ? assetNumbersOf : null, [a], [], rowIssues, 'Reference identifiers') || [];
      numbers.forEach(n => addId(n, 'Number recorded against this reference', 'Schedule, supplied or rental record'));
      if (itemName !== null) {
        const associations = call(typeof itemNumbersOf === 'function' ? itemNumbersOf : null, [a], null, rowIssues, 'Native inventory association');
        // Exact source item name only. Do not fuzzy-match a neighbouring type or infer a split.
        if (associations && Object.prototype.hasOwnProperty.call(associations, itemName)) (associations[itemName] || []).forEach(value => {
          addId(value, 'Native inventory association', 'Native item mapping; may allocate numbers by order capacity');
          const id = ids.get(String(value).trim());
          if (id) { id.scope = 'native-item-association'; id.itemName = itemName; id.source += ' · native item mapping may allocate by order capacity'; }
        });
      }
      row.identifiers = [...ids.values()];

      const stored = call(typeof dropPhotosOf === 'function' ? dropPhotosOf : null, [key], [], rowIssues, 'Drop photographs') || [];
      const filed = call(typeof filedPhotosOf === 'function' ? filedPhotosOf : null, [key], {state: 'none', files: []}, rowIssues, 'Filed photographs') || {state: 'none', files: []};
      const pointers = new Map();
      stored.filter(p => p && p.id && !p.removed).forEach(p => { if (!pointers.has(String(p.id))) pointers.set(String(p.id), {pointer: p, source: 'drop'}); });
      // A removed drop pointer stays removed. A separately filed photo is only reference context.
      (filed.files || []).filter(f => f && f.id && f.kind === 'photo' && String(f.ref || '') === key).forEach(f => {
        if (!pointers.has(String(f.id))) pointers.set(String(f.id), {pointer: {id: f.id, name: f.name}, source: 'filed', file: f});
      });
      row.photos = [...pointers.entries()].map(([id, entry]) => {
        const p = entry.pointer, resolved = call(typeof photoFor === 'function' ? photoFor : null, [p], {state: 'unchecked'}, rowIssues, 'Photograph availability') || {state: 'unchecked'};
        const available = resolved.state === 'ready';
        const slotNumber = Number.isInteger(p.slot) ? p.slot : null;
        const slot = slotNumber !== null && typeof DROP_SLOTS !== 'undefined' ? DROP_SLOTS[slotNumber] : null;
        const thumb = available ? safeURL(resolved.thumb) : null, fullSrc = available ? safeURL(resolved.url) : null;
        const kind = entry.source === 'filed' ? 'reference' : slot && slot.aerial ? 'aerial' : 'drop';
        const caption = entry.source === 'filed' ? 'Photo filed against ' + key : key + ' · ' + (slot && slot.lab || 'drop photograph') + (p.unit ? ' · recorded for unit ' + p.unit : '');
        return {id, src: thumb, thumb, fullSrc, availability: resolved.state || 'unchecked', caption, kind,
          unit: p.unit == null ? null : String(p.unit), slot: slotNumber, source: entry.source,
          previewAvailable: !!thumb, capturedAt: p.capturedAt || p.captured_at || null, recordedAt: p.recordedAt || p.at || entry.file && entry.file.uploaded || null};
      });
      row.photoCount = row.photos.length;
      row.readyPhotoCount = row.photos.filter(p => p.availability === 'ready' && p.fullSrc).length;
      row.photoState = filed.state === 'ready' ? 'ready' : ['loading', 'checking'].includes(filed.state) ? 'loading' : filed.state === 'failed' ? 'failed' : 'unavailable';
      if (row.photoState === 'loading') row.photoNote += ' Checking the service for filed photographs.';
      else if (row.photoState === 'failed') row.photoNote += ' Filed photographs could not be checked; this does not mean none exist.';
      else if (row.photoState === 'unavailable') row.photoNote += ' The hosted photograph registry is unavailable.';
      else if (!row.photoCount) row.photoNote += ' No current drop photographs or filed reference photographs are recorded.';
      return row;
    });
    return {asOf, currentDay, ready, loading, missing, issues, rows, rowsByKey: Object.fromEntries(rows.map(r => [r.key, r]))};
  };
  // Native helpers may resolve a reference internally. One hold makes all of them use one built list.
  return typeof holdAssets === 'function' ? holdAssets(run) : run();
}
