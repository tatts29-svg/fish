/* Author: Andrew Fisher. Display native item quantities beside their descriptions. */
const Description998 = (() => {
 'use strict';
 function label(item, quantity) {
  const known = typeof quantity === 'number' && Number.isFinite(quantity) && quantity >= 0;
  return (known ? quantity + ' × ' : '') + String(item || 'Description to confirm');
 }
 return {label};
})();
if (typeof module !== 'undefined' && module.exports) module.exports = Description998;
