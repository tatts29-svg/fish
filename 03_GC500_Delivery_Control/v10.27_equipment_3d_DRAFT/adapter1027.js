/* Author: Andrew Fisher. Read-only equipment projection for the 3D map.
 * No new record keys, inferred receipts, financial calculations or writes.
 * The explorer supplies its existing sheet-to-world projector; one registration
 * therefore places both the flat plan and its equipment representation.
 */
(function () {
  'use strict';
  const PILOT = Object.freeze(['P60', 'P62', 'P63', 'WC49', 'GN06']);
  const KINDS = new Set(['building', 'toilet', 'generator', 'tower', 'barrier']);
  const SHAPE_KINDS = new Set(['building', 'container', 'toilet', 'toilet_block', 'accessible_toilet',
    'fwf_trailer', 'pee_panel', 'generator', 'light_tower', 'water_barrier']);
  const known = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  const positive = n => known(n) && n > 0;
  const normal = s => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const sumKnown = rows => rows.length && rows.every(known) ? rows.reduce((a, b) => a + b, 0) : null;
  const copy = o => JSON.parse(JSON.stringify(o));
  const point = value => Array.isArray(value) && value.length >= 2 &&
    typeof value[0] === 'number' && typeof value[1] === 'number' &&
    Number.isFinite(value[0]) && Number.isFinite(value[1]) &&
    Math.abs(value[0]) <= 90 && Math.abs(value[1]) <= 180 ? {lat: value[0], lon: value[1]} : null;

  function mappedLocation(a) {
    const m = typeof masterUnit === 'function' ? masterUnit(a.key) : null, master = point(m?.ll);
    if (master) return {...master, kind: 'master', source: gate6Revision1021(a.key)?.line || String(m.how || 'Master plan position'), approximate: true, areaOnly: false};
    const target = typeof navTargetFor === 'function' ? navTargetFor(a) : null;
    const location = point(target?.ll ? [target.ll.lat, target.ll.lon] : null);
    if (location && (target.pinned || target.placed)) return {...location, kind: target.pinned ? 'pin' : 'place',
      source: target.pinned ? 'Recorded site pin' : 'Recorded map placement', approximate: true, areaOnly: false};
    const area = MASTER_LOC[a.key], areaPoint = point(area?.ll);
    return areaPoint ? {...areaPoint, kind: 'area', source: String(area.how || 'Named area only'), approximate: true, areaOnly: true} : null;
  }
  const eligible = a => !!a && KINDS.has(refKind(a)) && !!mappedLocation(a);

  function catalogue() {
    const run = () => {
      if (!health()) return [];
      const rows = [];
      for (const a of allAssets()) {
        const kind = refKind(a);
        if (!KINDS.has(kind)) continue;
        const location = mappedLocation(a);
        if (location) rows.push({ref: a.key, kind, location,
          active: !a._cancelled && !movedAway(a.key), extrudable: !location.areaOnly});
      }
      return rows;
    };
    try { return typeof holdAssets === 'function' ? holdAssets(run) : run(); } catch (_) { return []; }
  }

  function health() {
    try {
      return !!todayWorkHealth840().ready &&
        !(DATA.edition === 'hosted' && ['subhire', 'loads'].some(k => !SYNC.first.has(k)));
    } catch (_) { return false; }
  }

  function dimensions(product) {
    const actual = product?.actualVerified === true ? product.record?.actual : null;
    const fromContract = product?.source?.nominal || {};
    const contractListed = Object.values(fromContract).some(positive);
    const nominal = contractListed ? fromContract : window.Loading931?.nominal931(product?.item || '') || {};
    const chosen = actual || nominal;
    return {
      lengthMm: positive(chosen.lengthMm) ? chosen.lengthMm : null,
      widthMm: positive(chosen.widthMm) ? chosen.widthMm : null,
      heightMm: actual && positive(actual.heightMm) ? actual.heightMm : null,
      source: actual ? String(actual.source || '') : contractListed ? String(product?.source?.source || '') : '',
      basis: actual ? 'Verified transport dimensions' : contractListed ? 'Contract-listed footprint' : 'Nominal description',
      verified: !!actual
    };
  }

  function components(ref, projectPoint) {
    const shape = MasterShapes926.shape(ref);
    if (!shape || !shape.placed || shape.cancelled) return [];
    const sheet = MASTER_SHAPES926_DATA.sheet;
    if (!Array.isArray(sheet) || !sheet.every(positive)) return [];
    return shape.components.filter(c => c.geometry === 'polygon' &&
      SHAPE_KINDS.has(c.kind) && !c.drawn_as).map((c, index) => {
      const project = p => {
        if (typeof projectPoint !== 'function' || !Array.isArray(p) || !p.every(Number.isFinite)) return null;
        try { return point(projectPoint(p[0] * sheet[0], p[1] * sheet[1])); } catch (_) { return null; }
      };
      const polygon = (c.poly || []).map(project);
      return {
        id: ref + ':' + index, kind: c.kind, label: c.label,
        polygon: polygon.length >= 3 && polygon.every(Boolean) ? polygon : [],
        sheetPolygon: copy(c.poly || []), sheetSize: sheet.slice(),
        centre: project(c.centroid),
        sizeM: Array.isArray(c.size_m) ? c.size_m.slice() : null,
        angleDeg: Number.isFinite(c.angle_deg) ? c.angle_deg : null,
        source: String(c.source || ''), sizeBasis: String(c.size_state || ''),
        approximate: true, confirm: !!c.confirm,
        doorBearingDeg: Number.isFinite(c.door?.bearing_deg) ? c.door.bearing_deg : null,
        doorEdge: Number.isInteger(c.door?.edge_index) ? c.door.edge_index : null,
        doorBasis: String(c.door_note || '')
      };
    });
  }

  function read(a, projectPoint) {
    if (!eligible(a)) return null;
    const d = deliveryOf(a.key), timeline = timeline841State(a);
    const status = mapStatus1009Classify(a, d, timeline, window.gc500IsComplete897(a.key));
    const quantities = mapQuantity1010(a, status.state);
    const lines = chargeLines(a) || [];
    const receipts = toiletRows962(a, d, lines, todayIso());
    const ownership = ItemOwnership969.read(a);
    const products = window.Loading931?.referenceProducts931(a) || [];
    const items = quantities.items.map(row => {
      const matchingLines = lines.filter(l => normal(l.item) === normal(row.item));
      const receipt = receipts?.rows.find(r => normal(r.item) === normal(row.item));
      const received = receipt ? receipt.arrived : sumKnown(matchingLines.map(l => receivedChargeQty1006(a, l)));
      const owners = ownership.rows.filter(o => normal(o.item) === normal(row.item));
      const supplierCodes = [...new Set(owners.map(o => o.owner).filter(Boolean))];
      const matchingProducts = products.filter(p => normal(p.item) === normal(row.item));
      const names = supplierCodes.map(owner => window.Units925.company(owner));
      // An absent ownership record must never silently turn a supplier's unit into Coates equipment.
      if (!names.length) matchingProducts.forEach(p => {
        if (p.owner && p.owner !== 'unknown') names.push(window.Units925.company(p.owner));
      });
      const sizes = matchingProducts.map(dimensions);
      const consistent = sizes.length && sizes.every(s => JSON.stringify(s) === JSON.stringify(sizes[0]));
      const family = window.Loading931?.family931(row.item) || 'other';
      const itemKind = family === 'other' && /\bcont(?:ainer)?\b/i.test(row.item) ? 'container' : family;
      return {
        description: row.item, kind: itemKind,
        quantity: row.quantity, received: known(received) ? received : null,
        installed: status.state === 'complete' ? row.completed : row.installed,
        completed: row.completed, suppliers: [...new Set(names)],
        dimensions: consistent ? sizes[0] : null,
        capacityKva: matchingProducts.length && matchingProducts.every(p => p.source?.capacityKva === matchingProducts[0].source?.capacityKva)
          ? matchingProducts[0].source?.capacityKva || null : null
      };
    });
    const quantity = sumKnown(items.map(i => i.quantity));
    const installed = sumKnown(items.map(i => i.installed));
    const received = sumKnown(items.map(i => i.received));
    const suppliers = [...new Set(items.flatMap(i => i.suppliers))];
    const photos = typeof dropPhotosOf === 'function' ? dropPhotosOf(a.key) : [];
    const uniquePhotos = [...new Map(photos.filter(p => p?.id).map(p => [String(p.id), p])).values()];
    const readyPhotos = uniquePhotos.filter(p => { try { return photoFor(p).state === 'ready'; } catch (_) { return false; } });
    const location = mappedLocation(a);
    const revision = gate6Revision1021(a.key);
    const complete = status.state === 'complete';
    return {
      ref: a.key, name: String(a.name || ''), kind: refKind(a),
      description: items.map(i => i.description).join(' · '), items,
      quantity, received, installed, complete,
      status: status.state, statusLabel: status.label,
      quantityLabel: a.key + (quantity == null ? '' : ' (' + quantity + ')'),
      completionLabel: status.label + (quantity == null ? '' : complete ? ' · ' + quantity + '/' + quantity :
        installed == null ? ' · ' + quantity + ' planned' : ' · ' + installed + '/' + quantity + ' installed'),
      supplier: suppliers.join(' · '), suppliers,
      dimensions: items.length === 1 ? items[0].dimensions : null,
      location, extrudable: !!location && !location.areaOnly,
      // A newer site pin can supersede an area label; do not resurrect the old
      // drawing polygon at its previous position. The pin keeps its own location.
      components: status.state === 'cancelled' || status.state === 'moved' || location?.kind !== 'master' ? [] : components(a.key, projectPoint),
      photos: {available: typeof photoIndex === 'function' && photoIndex().state === 'ready',
        count: readyPhotos.length, recorded: uniquePhotos.length},
      sourceNote: revision?.line || location?.source || 'Drawing-derived equipment position; not a survey.',
      visualNote: 'Equipment shape and height are illustrative unless a verified dimension is shown.'
    };
  }

  function snapshot(projectPoint, refs) {
    const run = () => {
      if (!health()) return {schema: 1, available: false, pilot: PILOT.slice(), items: []};
      // The viewer asks only for nearby references plus its selection. Offscreen
      // records are not repeatedly projected while the user moves the camera.
      const wanted = [...new Set((Array.isArray(refs) ? refs : PILOT).map(r => String(r || '').trim().toUpperCase()))].slice(0, 32);
      const keys = new Set(wanted);
      const assets = new Map(allAssets().filter(a => keys.has(a.key)).map(a => [a.key, a]));
      const items = wanted.map(ref => read(assets.get(ref), projectPoint)).filter(Boolean);
      return {schema: 1, available: true, pilot: PILOT.slice(), items};
    };
    try { return typeof holdAssets === 'function' ? holdAssets(run) : run(); }
    catch (_) { return {schema: 1, available: false, pilot: PILOT.slice(), items: []}; }
  }

  function open(ref, action) {
    ref = String(ref || '').trim().toUpperCase();
    if (!eligible(assetOf(ref)) || !['details', 'photos'].includes(action || 'details')) return false;
    openAsset(ref);
    if (action === 'photos') requestAnimationFrame(() => {
      if (state.sel !== ref) return;
      const body = document.querySelector('#drawer.on .db');
      if (!body) return;
      const group = body.querySelector('.fwf1010-gallery') || body.querySelector('.item933-gallery') ||
        body.querySelector('.item933-location') || body.querySelector('[data-f816="photos"]');
      if (!group) return;
      for (let el = group; el && el !== body; el = el.parentElement) if (el.tagName === 'DETAILS') el.open = true;
      group.hidden = false;
      const card = group.closest('[data-unit925-id]');
      card?.querySelectorAll('[data-item933-view]').forEach(b => b.setAttribute('aria-expanded', 'true'));
      group.scrollIntoView({block: 'nearest', behavior: 'auto'});
    });
    return true;
  }

  window.GC500Equipment1027 = Object.freeze({
    snapshot, catalogue,
    get: (ref, projectPoint) => snapshot(projectPoint, [ref]).items.find(i => i.ref === String(ref || '').trim().toUpperCase()) || null,
    open
  });
})();
