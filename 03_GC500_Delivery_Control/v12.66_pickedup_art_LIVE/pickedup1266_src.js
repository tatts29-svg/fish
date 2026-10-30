/* Author: Andrew Fisher. Decorative equipment-type artwork; no record inference. */
const PICKEDUP_ART1266_TOWER = 'data:image/webp;base64,__TOWER_WEBP__';
function pickedupArt1266(c) {
  const item = String(c && c.item || '').trim().toLowerCase().replace(/[\s-]+/g, ' ');
  if (!c || c.icon !== 'tower' || !['light tower', 'light towers', 'lighting tower', 'lighting towers', 'tower light', 'tower lights'].includes(item)) return '';
  return '<img class="pickedup1266-art" data-kind="tower" src="' + PICKEDUP_ART1266_TOWER + '" alt="" aria-hidden="true" decoding="async" loading="lazy" draggable="false">';
}
