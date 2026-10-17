/* Author: Andrew Fisher. v8.21 proposal, local only.
 * Input is one resolved programmeDays() day selected by exact ISO date.
 * Event.date intentionally remains the source date on rescheduled deliveries.
 * Do not mutate native schedule functions or discard split loads by reference.
 */
function dailyDeliveryGroups821(d) {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(String(d.iso))) throw new Error('A resolved programme day is required');
  const deliveryDay = Object.assign({}, d, {
    deliveries: (d.deliveries || []).filter(r => r && r.a && !rowOff(r.a.key)).map(r => Object.assign({}, r, {
      events: (r.events || []).filter(e => e && e.movement !== 'remove')
    })).filter(r => r.events.length),
    removals: [], cancelled: [], unref: [],
    loads: (d.loads || []).filter(l => l && (!l.date || l.date === d.iso))
  });
  const booked = bookingGroups801(deliveryDay);
  const remaining = Object.assign({}, deliveryDay, {
    deliveries: deliveryDay.deliveries.map(r => Object.assign({}, r, {
      events: r.events.filter(e => !e.booking801 || e.bookingMoved801)
    })).filter(r => r.events.length),
    loads: deliveryDay.loads.filter(l => !l.booking801)
  });
  return booked.concat(dpLoadsBefore801(remaining));
}
if (typeof module === 'object') module.exports = {dailyDeliveryGroups821};
