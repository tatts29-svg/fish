/* Author: Andrew Fisher. v8.44 read-only links beside existing fencing quantities.
 * This evidence sidecar does not calculate completion or allocate remaining work.
 * Native docket scope, named-area sign-offs and planned sections stay separate.
 */
function todayLinkedFencing844(typeId, asOf) {
  const text = value => String(value == null ? '' : value);
  let id = text(typeId);
  if (id.startsWith('type843-fence-')) { try { id = decodeURIComponent(id.slice(14)); } catch (_) { id = ''; } }
  const day = asOf || todayIso(), list = value => Array.isArray(value) ? value : [];
  const safeUrl = (value, thumbnail = false) => {
    if (typeof value !== 'string' || /[\u0000-\u001f\u007f]/.test(value)) return null;
    const url = value.trim();
    if (thumbnail && /^data:image\/(?:png|jpe?g|webp|gif|avif);base64,[A-Za-z0-9+/]+={0,2}$/i.test(url)) return url;
    try { const parsed = new URL(url, typeof location !== 'undefined' ? location.href : 'https://gc500.invalid/');
      return url && /^https?:$/.test(parsed.protocol) && !parsed.username && !parsed.password ? url : null;
    } catch (_) { return null; }
  };
  const health = typeof todayGroupHealth841 === 'function' ? todayGroupHealth841()
    : typeof todayWorkHealth840 === 'function' ? todayWorkHealth840() : {ready:false, basis:'Waiting for shared fencing records'};
  const result = {typeId:id, asOf:day, state:health.ready ? 'ready' : 'loading', unit:null,
    basis:'Supporting records for this work type; existing totals remain authoritative. Remaining programme quantity is not allocated to individual areas or fence sections.',
    qualifier:'Docket work is selected to this day. Reviewed map areas, source documents and photograph availability are current; an area link is not an exact fence section or proof of completion.',
    dockets:[], plannedLocations:[], areas:[], issues:[], fallbackAction:{kind:'fencing'}};
  if (!health.ready) { result.issues.push(health.basis || 'Shared fencing records are not ready.'); return result; }
  const allowed = ['clean','scrim','v_gates','ped_gates','ccb_event','ccb_demarc','relocation','removal','fence_blocks','labour'];
  const matches = (typeof FCOL === 'undefined' ? [] : FCOL).filter(column => column.key === id);
  const column = matches.length === 1 ? matches[0] : null;
  if (!allowed.includes(id) || !column || !['m','each','h','hr'].includes(column.unit)) {
    result.state = 'unavailable'; result.issues.push('This work type has no unique supported native column.'); return result;
  }
  result.unit = column.unit === 'hr' ? 'h' : column.unit;
  const number = value => value == null || text(value).trim() === '' || !Number.isFinite(Number(value)) ? null : Number(value);
  const weeks = list(DATA.weeks), build = weeks.filter(week => week.phase === 'Build'), buildNames = new Set(build.map(week => week.sheet));
  const records = allDockets();
  let catalogue = null, trace = {rows:[], unmapped:[], areas:[]};
  try { catalogue = typeof gc500FencingTraceCatalogue837 === 'function' ? gc500FencingTraceCatalogue837() : null;
    if (typeof fenceTraceCurrent837 === 'function') trace = fenceTraceCurrent837();
  } catch (_) { result.issues.push('Reviewed map links could not be checked; source records remain available in Fencing.'); }
  const core = typeof window !== 'undefined' ? window.GC500FencingTrace837 : null;
  const keyOf = record => core && typeof core.key === 'function' ? core.key(record) : null;
  const traceRows = list(trace.rows).concat(list(trace.unmapped));
  const geometries = list(catalogue && catalogue.geometry);
  const currentAreas = list(trace.areas).filter(area => area.state === 'current' && geometries.filter(g => g.id === area.geometry_id).length === 1);
  const named = new Map();
  let papersState = 'unchecked';
  try { if (typeof photoIndex === 'function') {
    const state = photoIndex().state;
    papersState = state === 'ready' ? 'ready' : state === 'loading' || state === 'unrequested' ? 'checking' : state === 'none' ? 'unavailable' : 'unchecked';
  } } catch (_) {}
  const areaStatus = name => {
    if (!name) return null;
    if (typeof fenceAreaDoneAsOf !== 'function') return {done:null, by:null, at:null, where:null};
    const status = fenceAreaDoneAsOf(name, day);
    return {done:!!status.done, by:status.by || null, at:status.at || null, where:status.where || null};
  };
  for (const [index, docket] of records.entries()) {
    // Keep identical inclusion rules to todayFencingSummary841; no display-name or map matching changes scope.
    if (!docket.date || !/^\d{4}-\d{2}-\d{2}$/.test(docket.date) || docket.date > day || !docket.usable) continue;
    const datedWeek = weeks.find(week => week.start && week.end && week.start <= docket.date && week.end >= docket.date);
    if (datedWeek && datedWeek.phase !== 'Build') continue;
    if (!buildNames.has(docket.week) || datedWeek && datedWeek.sheet !== docket.week || (docket.scope || 'programme') !== 'programme') continue;
    const quantity = number((docket.quantities || {})[column.key]);
    if (quantity == null || quantity <= 0 || column.unit === 'each' && !Number.isInteger(quantity)) continue;
    const traceKey = keyOf(docket), unique = traceKey && records.filter(row => keyOf(row) === traceKey).length === 1;
    const traced = unique ? traceRows.filter(row => row.key === traceKey) : [];
    const row = traced.length === 1 ? traced[0] : null;
    const location = text(docket.location).trim();
    const areas = row && row.state === 'current' ? currentAreas.filter(area => list(row.area_ids).includes(area.id)).map(area => ({
      id:area.id, label:area.label, geometryId:area.geometry_id, basis:area.basis || '', action:{kind:'fencing-map', id:area.geometry_id}
    })) : [];
    const pointers = [], seen = new Set();
    for (const pointer of [
      ...(typeof docketPapersOf === 'function' ? docketPapersOf(docket.id) : []),
      ...(typeof docketPapersByName === 'function' ? docketPapersByName(docket) : [])
    ]) {
      if (!pointer || !pointer.id || seen.has(text(pointer.id))) continue;
      seen.add(text(pointer.id));
      let media = {state:'unchecked'};
      try { if (typeof photoFor === 'function') media = photoFor(pointer); } catch (_) {}
      const paper = {id:text(pointer.id), name:text(media.file && (media.file.title || media.file.name) || pointer.name || pointer.id),
        state:media.state || 'unchecked', byName:!!pointer.byName, by:pointer.by || null, at:pointer.at || null};
      if (media.state === 'ready') {
        const url = safeUrl(media.url), thumb = safeUrl(media.thumb, true);
        if (url) { paper.url = url; if (thumb) paper.thumb = thumb; }
        else { paper.state = 'unavailable'; result.issues.push('A signed-paper link could not be safely opened; check its native source record.'); }
      }
      pointers.push(paper);
    }
    const status = areaStatus(location);
    if (location) { const key = typeof fenceAreaKey === 'function' ? fenceAreaKey(location) : location.trim().toLowerCase().replace(/\s+/g,' ');
      if (!named.has(key)) named.set(key, {key, name:location, status, source:'named docket area', action:{kind:'fencing'}});
    }
    result.dockets.push({key:unique ? traceKey : 'fencing-docket:' + text(docket.id) + ':' + index,
      id:text(docket.id), number:text(docket.docket_no || docket.id), date:docket.date, quantity, unit:result.unit,
      location, areaStatus:status, recordAction:row ? {kind:'fencing-docket', key:traceKey} : {kind:'fencing'},
      areas, papers:pointers, papersState, mapState:areas.length ? 'reviewed-area' : row && row.state && row.state !== 'current' ? 'needs-review' : 'unmapped',
      mapNote:row && row.reason || (areas.length ? 'Reviewed area association, not an exact fence section.' : 'No current reviewed map association.'),
      sourceLinks:row && row.state === 'current' ? list(row.links).filter(link => link && safeUrl(link.url)).map(link => ({label:link.label, url:safeUrl(link.url), kind:link.kind || 'source'})) : []});
  }
  result.areas = [...named.values()];
  // Source-authored planned locations provide context only. They do not reconcile
  // to an allocated residual, and lack of a section tick never means “left”.
  const sources = list(catalogue && catalogue.sources), seenTasks = new Set(), seenSheets = new Set();
  for (const week of build) {
    const sheet = typeof progSheetOf === 'function' ? progSheetOf(week.sheet) : null;
    if (!sheet || seenSheets.has(sheet.sheet)) continue;
    seenSheets.add(sheet.sheet);
    const plan = sheet.plan_update;
    if (!plan || !column.programme_type) continue;
    const bindings = sources.filter(source => text(source.sha256).slice(0,16) === plan.sha256_16 && (!plan.sha256 || source.sha256 === plan.sha256));
    if (bindings.length !== 1) { result.issues.push('A planned-location source revision is unavailable; no location is inferred.'); continue; }
      const source = bindings[0];
    for (const dated of list(plan.rows_by_day).filter(day => day && typeof day === 'object')) for (const [index, row] of list(dated.rows).entries()) {
      if (!row || typeof row !== 'object') continue;
      const quantity = number((row.fields || {})[column.programme_type]);
      if (quantity == null || quantity <= 0 || column.unit === 'each' && !Number.isInteger(quantity)) continue;
      const nativeId = text(row.id || dated.date + ':' + (row.page || 1) + ':' + index), key = source.id + ':' + nativeId;
      if (seenTasks.has(key)) continue; seenTasks.add(key);
      const page = Number(row.page || 1), sourceValid = Number.isInteger(page) && page > 0 && page <= source.pages;
      const mapIds = sourceValid ? geometries.filter(g => Array.isArray(g.task_ids) && g.task_ids.every(id => typeof id === 'string') && g.task_ids.includes(key) && g.source_sha256 === source.sha256 && /^[a-f0-9]{64}$/.test(catalogue.master_sha256) && g.master_sha256 === catalogue.master_sha256 &&
        geometries.filter(other => other.id === g.id).length === 1 && Number.isInteger(g.source_page) && g.source_page > 0 && g.source_page <= source.pages &&
        ['line','workarea','stockpile','anchor'].includes(g.kind) && ['main','inset'].includes(g.region) && (!g.category || ['clean','scrim','ccb','relocation','other','unclassified'].includes(g.category)) && g.confidence && g.alignment && typeof g.alignment.method === 'string' && g.alignment.method &&
        Array.isArray(g.points) && g.points.length >= (g.kind === 'line' ? 2 : g.kind === 'workarea' ? 3 : 1) && g.points.length <= 10000 &&
        g.points.every(point => Array.isArray(point) && point.length === 2 && point.every(Number.isFinite) && point[0] >= 0 && point[0] <= 2384 && point[1] >= 0 && point[1] <= 1684))
        .map(g => g.id) : [];
      const conflictText = conflict => {
        if (typeof conflict === 'string') {
          const found = list(plan.conflicts).filter(item => item && item.id === conflict);
          if (found.length !== 1) return 'Source conflict: ' + conflict + ' (details unavailable)';
          conflict = found[0];
        }
        return [...new Set([conflict.description, conflict.summary, conflict.detail, conflict.state].map(text).filter(Boolean))].join(' · ');
      };
      result.plannedLocations.push({id:key, date:row.date || dated.date || null, location:text(row.location), description:text(row.description),
        quantity, unit:result.unit, sourceId:source.id, sourceLabel:source.label || source.id, page, mapIds,
        sourceAction:sourceValid ? {kind:'fencing-source', id:source.id, page} : null,
        note:[...new Set([row.note, row.comment, row.flag].map(text).filter(Boolean))].join(' · '), requirements:list(row.requirements).filter(requirement => requirement && typeof requirement === 'object').map(requirement => ({text:text(requirement.text), kind:text(requirement.kind)})),
        conflicts:list(row.conflicts).filter(Boolean).map(conflictText),
        status:'planned-context', areaStatus:areaStatus(row.location)});
    }
  }
  result.issues = [...new Set(result.issues)];
  if (health.stale) result.issues.push(health.basis || 'Shared records are offline; last received evidence is shown.');
  return result;
}
function todayLinkedToiletSupplier844() {
  return {label:'Supplier plan and quantities without a WC allocation',
    basis:'The supplier plan and quote retain unallocated quantities and schedule discrepancies. They are separate from reference completion counts.',
    action:{kind:'toilet-supplier', tab:'timeline', anchor:'ep819', heading:'ep819h'}};
}
