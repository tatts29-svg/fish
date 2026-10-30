/* Author: Andrew Fisher. Equipment-type illustrations only; never operational inference. */
(function (root) {
  'use strict';
  const ATLAS = Object.freeze({
    generator: ['a', 0], vms: ['a', 1], tower: ['a', 2], boom: ['a', 3], scissor: ['a', 4], forklift: ['a', 5],
    'portable-toilet': ['b', 0], 'accessible-toilet': ['b', 1], urinal: ['b', 2], 'toilet-block': ['b', 3], 'waste-tank': ['b', 4], 'block-tank': ['b', 5],
    building: ['c', 0], 'ticket-box': ['c', 1], container: ['c', 2], fridge: ['c', 3], freezer: ['c', 4], mats: ['c', 5],
    'water-barrier': ['d', 0], fence: ['d', 1], 'crowd-barrier': ['d', 2], chair: ['d', 3], stool: ['d', 4], laser: ['d', 5],
    'toilet-trailer': ['e', 0], 'distribution-board': ['e', 1], 'tyne-rotator': ['e', 2], 'fork-extensions': ['e', 3], 'refrigerated-container': ['e', 4], 'straight-boom': ['e', 5]
  });
  const normal = value => typeof value === 'string' ? value.trim().toLowerCase().replace(/[\u2010-\u2015-]/g, ' ').replace(/\s+/g, ' ').replace(/^(?:coates|supply)\s*:?\s*/, '').trim() : '';
  function ownType(value) {
    const t = normal(value);
    if (!t || /[<>]/.test(t)) return '';
    // Attachments are their own equipment; they must never inherit a machine's image.
    if (/^(?:forklift\s+)?t(?:y|i)ne rotator(?:\s+attachment)?$/.test(t)) return 'tyne-rotator';
    if (/^fork(?:lift)? extensions?(?:\s+\d+(?:\.\d+)?\s*m)?$/.test(t)) return 'fork-extensions';
    if (/^distribution board(?:\s+lifeguard(?:\s+\d+)?)?$/.test(t)) return 'distribution-board';
    if (/^(?:fwf|portable toilet|flush toilet) trailer$/.test(t)) return 'toilet-trailer';
    if (/^(?:\d+(?:\.\d+)?\s*m\s+)?(?:refrigerator|refrigerated|reefer) cont(?:ainer)?$/.test(t)) return 'refrigerated-container';
    if (/\b(?:cables?|leads?|filters?|chargers?|lamps?|parts?|spares?|hoses?|extension leads?)\b/.test(t) && !/^\d+(?:\.\d+)?\s*kva\s*&\s*cables$/.test(t)) return '';
    if (/^(?:\d+(?:\.\d+)?\s*kva(?:\s*&\s*cables)?|generators?(?:\s+\d+(?:\.\d+)?\s*kva)?)(?:\s+(?:diesel|petrol))?$/.test(t)) return 'generator';
    if (/^(?:vms(?:\s+(?:boards?|signs?))?|variable message (?:boards?|signs?)|message (?:boards?|signs?))$/.test(t)) return 'vms';
    if (/^(?:light(?:ing)? towers?|tower lights?)$/.test(t)) return 'tower';
    if (/^(?:straight|telescopic) boom(?:\s+lift)?(?:\s+\d+(?:\.\d+)?\s*(?:ft|m))?(?:\s*\(\d+(?:\.\d+)?\s*m\))?(?:\s+diesel)?$/.test(t)) return 'straight-boom';
    if (/^(?:(?:knuckle|articulat(?:ed|ing))\s+)?boom(?:\s+lift)?(?:\s+\d+(?:\.\d+)?\s*(?:ft|m))?(?:\s*\(\d+(?:\.\d+)?\s*m\))?(?:\s+diesel)?$/.test(t)) return 'boom';
    if (/^scissor lift(?:\s+with operator protection)?(?:\s+\d+(?:\.\d+)?\s*(?:ft|m))?(?:\s*\(\d+(?:\.\d+)?\s*m\))?(?:\s+(?:diesel|electric))?$/.test(t)) return 'scissor';
    if (/^(?:\d+(?:\.\d+)?\s*t\s+)?fork\s?lift(?:\s+\d+(?:\.\d+)?\s*t)?(?:\s+(?:std|standard|rt|rough terrain|diesel|electric))?$/.test(t)) return 'forklift';
    if (/^(?:accessible|disabled)(?:\s+portable)? toilet$/.test(t)) return 'accessible-toilet';
    if (/^(?:pee panels?|urinals?)$/.test(t)) return 'urinal';
    if (/^(?:\d+\s*pan(?:\s+toilet)? block|toilet blocks?(?:\s+\d+(?:\.\d+)?\s*m)?|amenit(?:y|ies) block)$/.test(t)) return 'toilet-block';
    if (/^(?:waste|sewage|effluent) tanks?(?:\s+\d+(?:\.\d+)?\s*(?:l|litres?))?$/.test(t)) return 'waste-tank';
    if (/^(?:fwf|portable toilets?|flush toilets?|portaloo|chemical toilet|recirc(?:ulating)? toilet)$/.test(t)) return 'portable-toilet';
    if (/^(?:ticket boxes?|ticket box(?:\s+\d+(?:\.\d+)?\s*m)?|kiosk|ticket booth)$/.test(t)) return 'ticket-box';
    if (/^(?:event\s+|shipping\s+|\d+(?:\.\d+)?\s*m\s+)?cont(?:ainer)?s?$/.test(t)) return 'container';
    if (/^(?:fridge|refrigerator)(?:\s+(?:lge|large|small|bar))?$/.test(t)) return 'fridge';
    if (/^(?:chest\s+)?freezer(?:\s+(?:lge|large|small))?$/.test(t)) return 'freezer';
    if (/^(?:pad\s+|plastic\s+|folding\s+)?chairs?$/.test(t)) return 'chair';
    if (/^(?:bar\s+)?stools?$/.test(t)) return 'stool';
    if (/^(?:tl2|wfb|water(?: filled)? barriers?|armorzone(?: barrier)?)$/.test(t)) return 'water-barrier';
    if (/^(?:crowd control barriers?|ccb|pedestrian barriers?)$/.test(t)) return 'crowd-barrier';
    if (/^(?:(?:temporary|temp|mesh|chain link)\s+)?fenc(?:e|ing)(?:\s+panels?)?$/.test(t)) return 'fence';
    if (/^(?:trakmat|track\s?mats?|ground mats?|ground protection(?: mats?)?)$/.test(t)) return 'mats';
    if (/^(?:laserplane|laser plane|laser level|rotary laser(?: level)?)$/.test(t)) return 'laser';
    if (/^(?:portable\s+)?buildings?(?:\s+\d+(?:\.\d+)?\s*m)?$/.test(t)) return 'building';
    return '';
  }
  function resolveAll(context) {
    if (typeof context === 'string') context = {item: context};
    if (!context || typeof context !== 'object') return [];
    if (Object.prototype.hasOwnProperty.call(context, 'item')) {
      let kind = ownType(context.item);
      if (kind === 'toilet-block' && (context.tankNo || context.tank)) kind = 'block-tank';
      return kind ? [kind] : [];
    }
    if (!Array.isArray(context.types) || !context.types.length) return [];
    const types = context.types.map(ownType);
    if (types.some(type => !type)) return [];
    const kinds = Array.from(new Set(types));
    if (kinds.length === 2 && kinds.includes('toilet-block') && kinds.includes('waste-tank')) return ['block-tank'];
    return kinds;
  }
  function resolve(context) { const kinds = resolveAll(context); return kinds.length === 1 ? kinds[0] : ''; }
  function tile(kind) {
    const cell = ATLAS[kind];
    return '<span class="artwork1268-cell"><span class="artwork1268 art1268-' + cell[0] + ' art1268-cell-' + cell[1] + '" data-artwork1268="' + kind + '"></span></span>';
  }
  function html(context) {
    const kinds = resolveAll(context);
    if (!kinds.length) return '';
    return '<span class="artwork1268-frame' + (kinds.length > 1 ? ' artwork1268-group' : '') + '" aria-hidden="true" style="--art1268-cols:' + Math.min(3, kinds.length) + '">' + kinds.map(tile).join('') + '</span>';
  }
  // Only explicit departure item types are used for a whole-reference stamp.
  // The helper reads the same departure model as the original stamp and writes nothing.
  function reference(key) {
    try {
      const status = root && root.Departure1211 && root.Departure1211.status(key);
      if (!status || !status.complete || (status.issues || []).length) return null;
      const rows = (status.events || []).flatMap(event => Array.isArray(event.items) ? event.items : []);
      if (!rows.length || rows.some(row => !row || typeof row.type !== 'string' || !row.type.trim())) return null;
      return {types: Array.from(new Set(rows.map(row => row.type)))};
    } catch (_) { return null; }
  }
  const api = Object.freeze({resolve, resolveAll, html, reference, kinds: Object.freeze(Object.keys(ATLAS))});
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.Artwork1268 = api;
})(typeof window === 'object' ? window : null);
