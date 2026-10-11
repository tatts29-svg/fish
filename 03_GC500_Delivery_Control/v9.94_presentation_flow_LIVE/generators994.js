/* Author: Andrew Fisher. Labels and delivery-docket joins; no operational record changes. */
function generatorRefLabel994(key) {
  const value = String(key == null ? '' : key);
  return value === 'GN?' ? 'Concert' : value;
}
function generatorBookingNumbers994(a, e, load, sourceRows) {
  const supplied = Array.isArray(load.asset_numbers) ? load.asset_numbers.slice() : [];
  if (supplied.length || !a || a.key !== 'GN?' || !e || e.task_id !== 'T0260') return supplied;
  const docket = String(load.dd || '').trim();
  if (!/^\d+$/.test(docket) || !Number.isInteger(load.quantity) || load.quantity < 1) return [];
  const rows = sourceRows || (DATA.rental_on_hire || {}).rows || [];
  const allocated = new Set((a.asset_numbers || []).map(String));
  const matches = rows.filter(row => row.match && row.match.key === a.key &&
    String(row.delivery_number || '').trim() === docket && row.asset_no_is_plant_number === true &&
    row.family === 'generator' && row.quantity === 1 && allocated.has(String(row.asset_no)) &&
    row.booked_delivery_date === e.date);
  const numbers = [...new Set(matches.map(row => String(row.asset_no)))];
  return numbers.length === load.quantity ? numbers : [];
}
function generatorReferenceNote994(a) {
  return a.key === 'GN?'
    ? 'Concert generators: two 200 kVA units. Original schedule reference GN?. The asset numbers and delivery dockets are matched; the issued plans do not identify their exact position.'
    : a.reference_state;
}
function generatorDestination994(a, destination) {
  if (!a || a.key !== 'GN13' || a._locationMoved) return destination;
  const target = dest782(a);
  // Name the already approved orange symbol. A future move/pin remains authoritative.
  if (!target || target.kind !== 'master' ||
      Math.abs(target.ll.lat - -27.9883915) > 0.0000001 ||
      Math.abs(target.ll.lon - 153.4300855) > 0.0000001) return destination;
  return Object.assign({}, destination, {
    text: 'SLS Equipment Compound · Narrowneck', known: true,
    confidence: 'drawing', source: 'master plan · orange generator symbol'
  });
}
