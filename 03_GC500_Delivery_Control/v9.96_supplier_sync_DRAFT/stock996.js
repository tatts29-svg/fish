/* Author: Andrew Fisher. Current stock is separate from cumulative receipts and charges. */
const CurrentStock996 = (() => {
 'use strict';
 const normal = value => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
 function reading(a, day) {
  return a && typeof DemobCollection996 !== 'undefined' ? DemobCollection996.read(a.key, day) : null;
 }
 function quantity(a, item, day, received) {
  const r = reading(a, day);
  if (!r || !r.recorded || r.issues?.length || !Number.isFinite(received)) return received;
  const collected = r.collected.find(row => normal(row.type) === normal(item));
  return collected ? Math.max(0, received - collected.n) : received;
 }
 function departed(a, day) {
  const r = reading(a, day);
  return !!r?.complete && !r.issues?.length;
 }
 return {quantity, departed};
})();
