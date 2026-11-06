/* Author: Andrew Fisher. Existing equipment references; review required before publication. */
(function (root) {
  'use strict';
  const BANK = typeof module === 'object' && module.exports ? require('./references1270.json') : __REFERENCES1270__;
  const normal = x => typeof x === 'string' ? x.trim().toLowerCase().replace(/[\u2010-\u2015-]/g, ' ').replace(/\s+/g, ' ') : '';
  const escape = x => String(x).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function match(item) {
    const t = normal(item).replace(/^(?:coates|supply)\s*:?\s*/, '');
    if (!t || /[<>]/.test(t)) return null;
    let m;
    if (/^(?:fwf|portable toilet|flush toilet) trailer$/.test(t)) return ['toilet_trailer'];
    if (/^(?:fwf|portable toilets?|fresh water flush(?: toilet)?|flush toilets?)$/.test(t)) return ['toilet_fwf'];
    if (/^(?:accessible|disabled)(?: portable)? toilet$/.test(t)) return ['toilet_access'];
    if (/^16\s*pan(?: toilet)? block$/.test(t)) return ['toilets_8door', 'Historical representative exception: the photograph is a smaller eight-door block, not a 16-pan unit.'];
    if (/^(?:8\s*(?:pan|door|cubicle)(?: toilet)? block|toilet block 8(?: door| cubicle)?)$/.test(t)) return ['toilets_8door'];
    if (/^(?:toilet blocks?(?: \d+(?:\.\d+)?\s*m)?|m\s*\/\s*f toilet block)$/.test(t)) return ['toilets_mf'];
    if (/^(?:waste|sewage|effluent) tanks?(?: \d+(?:\.\d+)?\s*(?:l|litres?))?$/.test(t)) return ['waste_tank'];
    if (/^(?:light(?:ing)? towers?|tower lights?)$/.test(t)) return ['light_tower'];
    if (/^(?:vms(?: (?:boards?|signs?))?|variable message (?:boards?|signs?))$/.test(t)) return ['vms_trailer'];
    if ((m=t.match(/^(?:generator\s+)?(\d+(?:\.\d+)?)\s*kva(?:\s*&\s*cables)?$/))) {
      const n=Number(m[1]), id=n<50?'gen_qas14':n<=100?'gen_qas80':n<200?'gen_qas150':'gen_qas200';
      return [id,'Historical catalogue size-band reference: pictured '+id.replace('gen_','').toUpperCase()+', not proof of the actual '+m[1]+' kVA model.'];
    }
    if ((m=t.match(/^(?:portable )?building\s+(3\.6|4\.8|6|9\.6|12)\s*m$/))) {
      const n=Number(m[1]), id=n===3.6?'buildings_3p6':n<=6?'buildings_6x3':'buildings_12x3';
      return [id, n===4.8||n===9.6?'Historical shared size reference; the original photo represents a larger building in this pair.':'Existing building reference; actual asset identity is not inferred.'];
    }
    if (/^ticket box(?: \d+(?:\.\d+)?\s*m)?$/.test(t)) return ['ticket_box'];
    if (/^(?:air conditioned )?event container$/.test(t)) return ['event_container'];
    if (/^(?:\d+(?:\.\d+)?\s*t )?forklift(?: \d+(?:\.\d+)?\s*t)? (?:rt|rough terrain)$/.test(t)) return ['forklift_rt'];
    if (/^(?:(?:2\.5|3(?:\.0)?|3\.5)\s*t forklift|forklift (?:2\.5|3(?:\.0)?|3\.5)\s*t)(?: std| standard)?$/.test(t)) return ['forklift_std','Historical standard-forklift class reference; not a 5 t forklift.'];
    if (/^(?:trakmat|track\s?mats?|ground protection(?: mats?)?)$/.test(t)) return ['trakmat'];
    if (/^(?:tl2|wfb|water(?: filled)? barriers?)$/.test(t)) return ['today_barriers','Existing Today illustration; proposed decorative reference, not a product photograph.'];
    if (/^(?:(?:temporary|temp|mesh) )?fenc(?:e|ing)(?: panels?)?$/.test(t)) return ['today_fencing','Existing Today illustration; proposed decorative reference, not a product photograph.'];
    if (/^distribution board(?: lifeguard(?: \d+)?)?$/.test(t)) return ['distribution_board','Andrew-supplied reference; private preview only until approved and packaged.'];
    return null;
  }
  function one(c) {
    if (!c || normal(c.owner)!=='coates') return {sources:[],reason:'Supplier or ownership not verified for this Coates reference.'};
    const result=match(c.item);
    if (!result) return {sources:[],reason:'No matching recovered reference for this item.'};
    const bank=Object.assign({},BANK,root&&root.Artwork1270ReviewSources||{}), source=bank[result[0]];
    if (!source || !source.src) return {sources:[],reason:'Reference requires private preview packaging.'};
    const sources=[Object.assign({},source,{note:result[1]||source.note})];
    if ((c.tankNo||c.tank) && /^toilets_/.test(source.id)) sources.push(Object.assign({},bank.waste_tank));
    return {sources,reason:''};
  }
  function describe(context) {
    if (!context || typeof context!=='object') return {sources:[],reason:'Explicit item and ownership required.'};
    if (Object.prototype.hasOwnProperty.call(context,'item')) return one(context);
    if (!Array.isArray(context.items)||!context.items.length) return {sources:[],reason:'Detailed item context unavailable.'};
    const each=context.items.map(one);
    if (each.some(x=>!x.sources.length)) return {sources:[],reason:'Mixed departure includes an unmatched item; no partial substitute.'};
    return {sources:[...new Map(each.flatMap(x=>x.sources).map(s=>[s.id,s])).values()],reason:''};
  }
  const resolveAll=context=>describe(context).sources.map(s=>s.id);
  const resolve=context=>{const ids=resolveAll(context);return ids.length===1?ids[0]:'';};
  function html(context) {
    const sources=describe(context).sources;
    if (!sources.length) return '';
    return '<span class="artwork1270-frame" aria-hidden="true" style="--photo1270-count:'+Math.min(sources.length,3)+'">'+sources.map(s=>'<img class="artwork1270-photo" data-photo1270="'+escape(s.id)+'" src="'+escape(s.src)+'" alt="" loading="lazy" decoding="async">').join('')+'</span>';
  }
  function reference(key) {
    try {
      const status=root&&root.Departure1211&&root.Departure1211.status(key);
      if (!status||!status.complete||(status.issues||[]).length||!root.Singles1238) return null;
      const cards=root.Singles1238.cardsOf(key);
      if (!cards.length||cards.some(c=>c.st.s!=='gone')) return null;
      return {items:cards.map(c=>({item:c.item,owner:c.owner,tankNo:c.tankNo,tank:c.tank}))};
    } catch (_) { return null; }
  }
  const api=Object.freeze({describe,resolveAll,resolve,html,reference,kinds:Object.freeze(Object.keys(BANK))});
  if (typeof module==='object'&&module.exports) module.exports=api;
  if (root) root.Artwork1268=root.Artwork1270=api;
})(typeof window==='object'?window:null);
