/* Author: Andrew Fisher. Complete selected-date geometry after native DOM decoration. */
(function (root) {
'use strict';
const before = root.render;
if (typeof before !== 'function' || !root.Performance1241) throw new Error('Native rendering is required.');
const wrapped = function () {
  const receiver = this, args = arguments;
  return Performance1241.pageDraw(() => Reflect.apply(before, receiver, args));
};
Object.assign(wrapped, before);
root.render = wrapped;
})(window);
