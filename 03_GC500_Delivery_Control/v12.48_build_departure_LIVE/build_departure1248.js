/* Author: Andrew Fisher. Build card presentation from the existing departure model.
 * Does not change delivery/setup records, setters, money or historical progress.
 */
var BuildDeparture1248 = (function (root) {
 'use strict';
 function reliable(departure) {
  return !!departure && departure.known === true && !departure.unknown &&
   Array.isArray(departure.issues) && departure.issues.length === 0 &&
   Number.isFinite(departure.collected) && departure.collected > 0 &&
   Number.isFinite(departure.remaining) && departure.remaining >= 0;
 }
 function read(key) {
  try { return root.Departure1211 && root.Departure1211.status(key); }
  catch (error) { return null; }
 }
 function project(base, departure) {
  if (!base || base.blocked || !reliable(departure)) return base;
  if (departure.complete && departure.remaining === 0) {
   return Object.assign({}, base, {stage: 5, label: 'Left site', word: 'Left site',
    tone: 'green', c: 'green', arrived: false, departed1248: true,
    why: 'Left site · ' + departure.last, said: 'Left site · ' + departure.last});
  }
  if (!departure.complete && departure.remaining > 0) {
   const counts = departure.collected + ' of ' + (departure.collected + departure.remaining) + ' left';
   const label = (departure.arrival ? 'On site · ' : 'Partial departure · ') + counts;
   return Object.assign({}, base, {label, word: label, partialDeparture1248: true,
    arrived: !!departure.arrival, why: counts + ' · ' + departure.remaining + ' still to leave. ' + departure.last,
    said: counts + ' · ' + departure.remaining + ' still to leave. ' + departure.last});
  }
  return base;
 }
 function state(asset, base) {
  return asset && !asset._cancelled ? project(base, read(asset.key)) : base;
 }
 function activeRows(rows, lookup = read) {
  return (Array.isArray(rows) ? rows : []).filter(row => {
   const departure = row && row.a && lookup(row.a.key);
   return !(reliable(departure) && departure.complete && departure.remaining === 0);
  });
 }
 function bookingEntries(result, activeKeys) {
  if (!result) return result;
  const keep = new Set(activeKeys);
  // A text still ambiguous between an active and a departed reference cannot be
  // reassigned to the active one. Exact pairings and common shared windows stay.
  return Object.assign({}, result, {entries: result.entries.filter(entry =>
   !entry.of || entry.of.every(key => keep.has(String(key))))});
 }
 function stamp(asset, state) {
  if (!state || !state.departed1248 || !root.Stamp1232) return '';
  const departure = root.Stamp1232.left(asset.key);
  return departure ? '<span class="build1248-stamp">' + root.Stamp1232.html(departure) + '</span>' : '';
 }
 const api = Object.freeze({reliable, project, state, activeRows, bookingEntries, stamp});
 if (typeof module === 'object' && module.exports) module.exports = api;
 return api;
})(typeof window === 'object' ? window : globalThis);
