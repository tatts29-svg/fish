/* Author: Andrew Fisher. The revised Gate 6 drawing is an approximate layout, not a surveyed master position. */
function gate6Revision1021(ref) {
 if (!['P60','P62','P63','WC49','GN06'].includes(String(ref))) return null;
 return {kind:'revised',sms:'revised Gate 6 layout · approximate',
  nav:'approximate position for '+ref+' from the iEDM Gate 6 layout of 14 Oct 2026; confirm placement on site',
  by:'iEDM Gate 6 drawing, 14 Oct 2026',took:'position read from the revised layout; not surveyed',
  label:'Revised Gate 6 · approximate',line:'iEDM layout · 14 Oct 2026 · approximate; master D001 not reissued'};
}
window.gc500Gate6Revision1021 = function () {
 return ['P60','P62','P63','WC49','GN06'].map(ref => {
  const m=MASTER_LOC[ref],shape=MASTER_SHAPES926_DATA.shapes[ref];
  return {ref,pt:m.pt,polygons:shape.c.map(unit=>unit.p)};
 });
};
