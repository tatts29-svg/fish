/* Author: Andrew Fisher. Read-only operational component ledger and planning guide.
 * Neither function writes records, reads rates or changes existing work totals.
 */
function fenceComponents849(asOf, supplied) {
  const input = supplied || {}, own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const day = asOf || (typeof todayIso === 'function' ? todayIso() : null);
  const validDay = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(new Date(value + 'T00:00:00Z').getTime()) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
  const count = value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
  const definitions = [
    ['mesh_panel', 'Fence panels'], ['base', 'Feet / blocks'], ['clamp', 'Clamps'],
    ['brace', 'Braces / stays'], ['wheels', 'Gate wheels'], ['cc_barrier', 'Crowd-control barriers']
  ];
  const health = own(input, 'health') ? input.health : typeof todayWorkHealth840 === 'function' ? todayWorkHealth840() : {ready:false, loading:true, basis:'Waiting for shared fencing records'};
  const empty = () => definitions.map(([id, label]) => ({id, label, unit:'each', quantity:null, sourceRecordCount:0, missingRecordCount:0, invalidRecordCount:0, explicitZeroRecordCount:0, notApplicableRecordCount:0}));
  const result = {asOf:day, health, state:health?.ready ? 'ready' : 'unavailable', scope:'Dated Build + Event records', recorded:empty(), collections:empty(), rows:[], collectionRows:[], excluded:[], issues:[], basis:'Gross component counts written on numbered hire agreements and collection forms are separate activities. They are not unique standing stock. Separately charged fence-block quantities are not added to component bases.'};
  if (!validDay(day)) { result.state = 'unavailable'; result.issues.push('A valid selected date is required.'); return result; }
  if (!health?.ready) { result.issues.push(health?.basis || 'Shared fencing records are unavailable.'); return result; }
  const records = own(input, 'records') ? input.records : typeof allDockets === 'function' ? allDockets() : null;
  const collections = own(input, 'collections') ? input.collections : typeof collectionRows === 'function' ? collectionRows() : null;
  if (!Array.isArray(records) || !Array.isArray(collections)) { result.state = 'unavailable'; result.issues.push('Hire agreements and collection records must both be available.'); return result; }
  const canonical = value => JSON.stringify(value && typeof value === 'object' ? Array.isArray(value) ? value.map(v => JSON.parse(canonical(v))) : Object.fromEntries(Object.keys(value).sort().map(k => [k, JSON.parse(canonical(value[k] === undefined ? null : value[k]))])) : value);
  const recordState = record => {
    if (!validDay(record.date)) return 'undated-or-invalid-date';
    if (record.date > day) return 'future';
    if (record.usable === false) return 'unusable';
    if (typeof input.recordState === 'function') return input.recordState(record, day);
    if (typeof fenceInstallationDocketState848 === 'function') return fenceInstallationDocketState848({...record, usable:record.usable !== false, scope:record.scope || 'programme'}, day);
    return 'scope-unconfirmed';
  };
  const consume = (source, book, totals, destination) => {
    const numberKey = book === 'red' ? 'docket_no' : 'collection_no', componentKey = book === 'red' ? 'components' : 'collected';
    const byNumber = new Map();
    for (const record of source) {
      if (!record || typeof record !== 'object') { result.issues.push('An invalid ' + book + '-book record is excluded.'); continue; }
      const number = String(record[numberKey] == null ? '' : record[numberKey]).trim();
      if (!number) { result.excluded.push({book, recordId:String(record.id || ''), number:null, state:'unnumbered', date:record.date || null}); continue; }
      if (!byNumber.has(number)) byNumber.set(number, []);
      byNumber.get(number).push(record);
    }
    for (const [number, matches] of byNumber) {
      const snapshot = record => Object.fromEntries(['date','week','scope','usable','location',componentKey,'quantities','note'].map(k => [k, record[k] == null ? null : record[k]]));
      const fingerprints = new Set(matches.map(record => canonical(snapshot(record))));
      if (fingerprints.size !== 1) {
        result.issues.push('Conflicting copies of ' + (book === 'red' ? 'hire agreement ' : 'collection form ') + number + ' are excluded pending review.');
        result.excluded.push({book, number, recordIds:matches.map(record => String(record.id || '')), state:'conflicting-duplicate'}); continue;
      }
      if (matches.length > 1) result.issues.push('Repeated identical copies of ' + (book === 'red' ? 'hire agreement ' : 'collection form ') + number + ' are counted once.');
      const record = matches[0], state = recordState(record);
      if (state !== 'included') { result.excluded.push({book, recordId:String(record.id || ''), number, state, date:record.date || null}); continue; }
      const raw = record[componentKey] && typeof record[componentKey] === 'object' && !Array.isArray(record[componentKey]) ? record[componentKey] : {};
      const work = record.quantities || {}, has = id => own(raw, id) && raw[id] != null && raw[id] !== '';
      const meshWork = count(raw.mesh_panel) > 0 || work.clean > 0, braceWork = count(raw.brace) > 0 || work.scrim > 0;
      const applicable = id => has(id) || (id === 'mesh_panel' ? meshWork : id === 'brace' ? braceWork : id === 'base' || id === 'clamp' ? meshWork || braceWork : id === 'wheels' ? work.v_gates > 0 : id === 'cc_barrier' ? work.ccb_event > 0 || work.ccb_demarc > 0 : false);
      const row = {book, recordId:String(record.id || ''), number, date:record.date, week:record.week || null, location:String(record.location || ''), scope:record.scope || 'programme', components:{}, invalid:[], missing:[], source:String(record.source || ''), note:String(record.note || '')};
      for (const total of totals) {
        const value = count(raw[total.id]);
        row.components[total.id] = value;
        if (value != null) { total.quantity = (total.quantity || 0) + value; total.sourceRecordCount++; if (!value) total.explicitZeroRecordCount++; }
        else if (raw[total.id] == null || raw[total.id] === '') { if (applicable(total.id)) { total.missingRecordCount++; row.missing.push(total.id); } else total.notApplicableRecordCount++; }
        else { total.invalidRecordCount++; row.invalid.push(total.id); }
      }
      if (row.invalid.length) result.issues.push('Invalid component counts on ' + (book === 'red' ? 'hire agreement ' : 'collection form ') + number + ' remain uncounted.');
      destination.push(row);
    }
    destination.sort((a, b) => a.date.localeCompare(b.date) || a.number.localeCompare(b.number, undefined, {numeric:true}));
  };
  consume(records, 'red', result.recorded, result.rows);
  consume(collections, 'blue', result.collections, result.collectionRows);
  for (const total of [...result.recorded, ...result.collections]) total.completeCoverage = total.sourceRecordCount > 0 && !total.missingRecordCount && !total.invalidRecordCount;
  if (health.stale) result.issues.push(health.basis || 'The shared record may be stale.');
  if (result.excluded.some(row => row.state === 'conflicting-duplicate' || row.state === 'scope-unconfirmed')) result.state = 'partial';
  result.issues = [...new Set(result.issues)];
  return result;
}

function fenceGuide849(supplied) {
  const input = supplied || {}, integer = value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 100000;
  const positive = value => typeof value === 'number' && Number.isFinite(value) && value > 0;
  const roundUp = value => value === 0 ? 0 : Math.max(1, Math.ceil(value - Number.EPSILON * Math.max(1, Math.abs(value)) * 4));
  const output = {state:'ready', quantities:{}, assumptions:[], issues:[], basis:'Planning allowance only. Recorded component counts, existing work totals, Revenue and Direct costs remain unchanged.'};
  const q = (id, min, max, basis) => { const known = Number.isSafeInteger(min) && Number.isSafeInteger(max) && min >= 0 && max >= min; output.quantities[id] = {quantity:known && min === max ? min : null, min:known ? min : null, max:known ? max : null, unit:'each', basis}; return output.quantities[id]; };
  const unknown = (id, basis) => q(id, null, null, basis);
  const invalid = message => { output.state = 'invalid'; output.issues.push(message); return output; };
  const width = input.panelWidth == null ? 2.4 : input.panelWidth;
  if (!positive(width)) return invalid('Panel width must be a positive number.');
  output.panelWidth = width;
  let panels;
  if (input.panels != null) { if (!integer(input.panels)) return invalid('Panel count must be a non-negative whole number.'); panels = input.panels; output.assumptions.push('The supplied panel count takes precedence over a length conversion.'); }
  else if (input.length === 0) panels = 0;
  else if (positive(input.length)) {
    const ratio = input.length / width;
    // Decimal panel multiples such as 16.8 / 2.4 can land one binary bit above 7.
    panels = roundUp(ratio);
  }
  else return invalid('Enter a non-negative total panel count or fence-line length.');
  if (!integer(panels)) return invalid('The calculated panel count is outside the supported range.');
  q('panels', panels, panels, input.panels != null ? 'Supplied panel count, including gate leaves.' : 'Total fence-line length divided by ' + width + ' m, rounded up; the length includes gate openings.');
  if (input.panelWidth == null) output.assumptions.push('2.4 m is the supplied planning guide, not a replacement for an actual supplier panel width.');
  if (!integer(input.gatePanels) || input.gatePanels > panels) return invalid('Gate panels must be stated as whole leaves between zero and the total panel count.');
  if (!integer(input.gateOpenings) || input.gateOpenings > input.gatePanels || input.gatePanels > input.gateOpenings * 2) return invalid('State the gate openings separately: each opening has one or two gate panels.');
  const gates = input.gatePanels, openings = input.gateOpenings, fixed = panels - gates;
  q('gatePanels', gates, gates, 'A double gate has two panel leaves.');
  q('gateOpenings', openings, openings, 'Each single or double opening breaks the fixed fence runs.');
  q('fixedPanels', fixed, fixed, 'Total panels less gate-panel leaves.');
  if (!fixed && gates) return invalid('A gate without adjacent fixed fence needs a separately specified support arrangement.');
  const closed = input.layout === 'closed', straight = input.layout === 'straight';
  let runs = null, jointsMin, jointsMax, feetMin, feetMax, runPanels = null;
  if (input.runPanels != null) {
    if (!Array.isArray(input.runPanels) || input.runPanels.length > 100000 || input.runPanels.some(n => !integer(n) || !n) || input.runPanels.reduce((sum, n) => sum + n, 0) !== fixed) return invalid('Fixed run panel counts must be positive whole numbers adding to the fixed-panel total.');
    runPanels = input.runPanels.slice(); runs = runPanels.length;
  } else if (input.fixedRuns != null) { if (!integer(input.fixedRuns)) return invalid('Fixed runs must be a non-negative whole number.'); runs = input.fixedRuns; }
  const endGates = input.endGateOpenings == null ? 0 : input.endGateOpenings;
  if (!integer(endGates) || endGates > Math.min(2, openings)) return invalid('End gate openings must be between zero and two and cannot exceed all gate openings.');
  if (closed && endGates) return invalid('A closed perimeter has no end gate openings.');
  if (straight && input.endGateOpenings == null && openings) output.assumptions.push('Gate openings are assumed to be in the middle of the straight line.');
  const derivedRuns = !panels ? 0 : closed ? openings : straight ? openings + 1 - endGates : null;
  if (derivedRuns != null && runs != null && derivedRuns !== runs) return invalid('The fixed-run count conflicts with the stated layout and gate positions.');
  if (runs == null) runs = derivedRuns;
  if (runs != null && (runs > fixed || fixed > 0 && runs === 0 && !(closed && !openings))) return invalid('The stated layout requires fixed runs that the panel count cannot support.');
  if (!fixed) { runs = 0; feetMin = feetMax = jointsMin = jointsMax = 0; }
  else if (closed && !openings) { feetMin = feetMax = jointsMin = jointsMax = fixed; output.assumptions.push('A wholly fixed closed loop has one foot and one fixed joint per panel; it has no open run ends.'); }
  else if (runs != null) { feetMin = feetMax = fixed + runs; jointsMin = jointsMax = fixed - runs; }
  else { feetMin = fixed; feetMax = fixed * 2; jointsMin = 0; jointsMax = fixed; output.state = 'partial'; output.issues.push('Run and loop topology is unknown; feet and fixed clamps are bounded rather than exact.'); }
  q('fixedRuns', runs, runs, 'Separate linear sections of fixed fence. A wholly fixed closed loop has no open fixed runs.');
  const ownHingeFeet = input.ownHingeFeet === true ? gates : 0;
  q('lineFeet', feetMin + ownHingeFeet, feetMax + ownHingeFeet, 'Fixed panels plus open fixed runs, or one per panel in a wholly fixed loop; shared hinge foot adds none.');
  q('fixedClamps', jointsMin, jointsMax, 'One clamp per fixed joint under the supplied guide; supplier arrangements may differ.');
  q('hingeClamps', gates * 2, gates * 2, 'Two hinge clamps per gate-panel leaf, subject to the supplier gate kit.');
  if (gates) output.assumptions.push(input.ownHingeFeet === true ? 'Each gate hinge leg has its own extra foot; free gate ends have no foot.' : 'Each gate hinge shares an adjacent fixed-panel foot; free gate ends have no foot.');
  let ends = input.openLineEnds == null ? closed ? 0 : straight ? panels ? 2 : 0 : null : input.openLineEnds;
  if (ends != null && !integer(ends)) return invalid('Open line ends must be a non-negative whole number.');
  if (closed && ends !== 0 || straight && ends !== (panels ? 2 : 0)) return invalid('The open-line-end count conflicts with the layout.');
  if (ends != null && runs != null && !(closed && !openings && fixed)) {
    // Two ends per complete open line. Moving an opening to an end removes a
    // fixed run, while its free gate end remains an end of the full fence line.
    const impliedEndGates = (ends - runs * 2 + openings * 2) / 2;
    if (!integer(impliedEndGates) || impliedEndGates > Math.min(openings, ends) || ends % 2) return invalid('The open ends, fixed runs and gate openings cannot form the stated fence lines.');
    if (impliedEndGates > openings * 2 - gates) return invalid('A double gate at a line end lacks an adjacent fixed hinge support for its second leaf; specify its separate support arrangement.');
  }
  q('openLineEnds', ends, ends, 'Both ends of one open fence line count separately.');
  const corners = input.corners == null ? 0 : input.corners;
  if (!integer(corners)) return invalid('Corner allowance must be a non-negative whole number.');
  if (input.corners == null) output.assumptions.push('No extra corner stays are included until corners are stated.');
  const braced = input.braced === true;
  if (!braced) {
    unknown('stays', 'The supplied every-second-joint rule applies to scrim; clean-fence bracing is not established by it.');
    unknown('stayFeet', 'Requires a bracing layout.');
  } else if (ends == null || runs == null && !(closed && !openings)) {
    output.state = 'partial'; unknown('stays', 'Scrim coverage, fixed runs and open line ends must be known to apply the bracing guide.'); unknown('stayFeet', 'Requires a bracing allowance.');
  } else {
    const jointStaysMin = runPanels ? runPanels.reduce((sum, n) => sum + Math.ceil((n - 1) / 2), 0) : Math.ceil(jointsMin / 2);
    const jointStaysMax = runPanels || closed && !openings ? jointStaysMin : Math.min(jointsMax, Math.floor((jointsMax + runs) / 2));
    const extra = openings * 2 + ends * 2 + corners;
    q('guideStays', Math.ceil(jointsMin / 2) + extra, Math.ceil(jointsMax / 2) + extra, 'Written guide: round total fixed joints / 2 up, then add two per gate opening, two per open line end and one per stated corner.');
    q('stays', jointStaysMin + extra, jointStaysMax + extra, runPanels ? 'Every-second-joint rounding is applied separately to each known fixed run, with the stated gate/end/corner allowances.' : 'Run lengths are unstated; rounding separately in each run can require more stays than rounding the total joint count once.');
    q('stayFeet', jointStaysMin + extra, jointStaysMax + extra, 'One separate foot or ballast allowance per stay, subject to the engineered layout.');
  }
  output.assumptions.push('Slopes over 3 degrees and site-specific bracing are outside this allowance; supplier or engineered requirements may add stays and ballast.');
  const spareRate = input.spareRate == null ? 0.05 : input.spareRate;
  if (typeof spareRate !== 'number' || !Number.isFinite(spareRate) || spareRate < 0 || spareRate > 1) return invalid('Spare allowance must be between zero and one.');
  output.spareRate = spareRate; output.spares = {};
  for (const key of ['panels','lineFeet','fixedClamps','hingeClamps','stays','stayFeet']) {
    const value = output.quantities[key];
    output.spares[key] = {quantity:value.quantity == null ? null : roundUp(value.quantity * spareRate), min:value.min == null ? null : roundUp(value.min * spareRate), max:value.max == null ? null : roundUp(value.max * spareRate), unit:'each'};
  }
  output.assumptions.push('Spare stock is shown separately and is not added to recorded or installed quantities.');
  return output;
}
