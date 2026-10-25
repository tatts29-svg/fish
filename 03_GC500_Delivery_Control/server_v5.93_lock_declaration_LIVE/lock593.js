/* Author: Andrew Fisher. Optional, explicit door-lock declarations; never inferred from old ticks. */
function trackLockValid(t) {
  if (t.lock_declaration == null) return true;
  const d = t.lock_declaration;
  const text = (v, max) => typeof v === 'string' && v.length > 0 && v.length <= max && v === v.trim() && !/[\x00-\x1f\x7f<>]/.test(v);
  return t.done === true && t.task === 'lockup' && trackCrewValid(t.crew_group) && plainObject(d)
    && Object.keys(d).sort().join(',') === 'by,crew,units,version'
    && d.version === 1 && text(d.by, 100) && text(d.crew, 240)
    && Number.isInteger(d.units) && d.units > 0 && d.units <= 10000;
}
function trackLockField(t) {
  const d = t.lock_declaration;
  return d == null ? {} : { lock_declaration: { version: d.version, by: d.by, crew: d.crew, units: d.units } };
}
function trackLockSame(a, b) {
  return JSON.stringify(trackLockField(a)) === JSON.stringify(trackLockField(b));
}
