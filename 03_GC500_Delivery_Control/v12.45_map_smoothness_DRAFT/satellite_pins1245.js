/* v12.45: current pin data is regenerated on every native apply; only identical
 * SVG markup skips reparsing and replacing the existing pin nodes. */
const pinMarkup1245 = new WeakMap();
function paintPins1245(group, markup){
 if (pinMarkup1245.get(group) === markup) return;
 group.innerHTML = markup;
 pinMarkup1245.set(group, markup);
}
