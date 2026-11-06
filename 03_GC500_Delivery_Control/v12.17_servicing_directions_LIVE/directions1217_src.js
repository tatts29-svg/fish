/* Author: Andrew Fisher. Preserve recorded directions when publishing an otherwise unplaced crew reference. */
var SvcDirections1217 = (function () {
  'use strict';
  function apply(data, locations) {
    var d = JSON.parse(JSON.stringify(data));
    (d.areas || []).forEach(function (area) {
      (area.refs || []).forEach(function (ref) {
        if (ref.pin || String(ref.where || '').trim() || String(ref.drop || '').trim()) return;
        if (!locations || !Object.prototype.hasOwnProperty.call(locations, ref.ref)) return;
        var text = locations[ref.ref];
        if (typeof text === 'string' && text.trim()) ref.where = text.trim();
      });
    });
    return d;
  }
  return {apply: apply};
})();
if (typeof module === 'object' && module && module.exports) module.exports = SvcDirections1217;
