/* Author: Andrew Fisher. Read-only map search metadata and same-origin viewer enhancement. */
(function () {
 'use strict';
 const oldPlan = window.gc500PlanItems;
 const cache = new WeakMap();
 window.gc500PlanItems = function () {
  const base = oldPlan.apply(this, arguments);
  if (!base) return base;
  if (cache.has(base)) return cache.get(base);
  const model = holdAssets(() => {
   const details = new Map();
   allAssets().filter(a => !a._cancelled && !movedAway(a.key)).forEach(a => {
    const units = gcUnits925(a,{loading:false}).filter(u => u.physical && u.ref === a.key);
    const boards = typeof vms913BoardsOn === 'function' ? vms913BoardsOn(a) || [] : [];
    const regos = units.map(u => u.registration).concat(boards.map(b => vms913Of(b).rego)).filter(Boolean);
    details.set(a.key, {
     identifiers:[...new Set(units.map(u => u.assetNo).concat(regos).filter(Boolean))],
     terms:[a.name,a.item,a.product,a.discipline,...units.map(u => u.item)].filter(Boolean),
     regos:[...new Set(regos)]
    });
   });
   const copy = {...base};
   for (const group of ['items','unplaced','placed']) copy[group] = (base[group] || []).map(row => ({...row,search1096:details.get(row.key) || null}));
   // VMS positions use the tracker-independent, existing board identity model.
   const vms = new Map();
   if (window.VMS1024) VMS1024.boards().forEach(b => {
    const identity = VMS1024.identity(b);
    vms.set(VMS1024.label(b).toUpperCase().replace(/[^A-Z0-9]/g,''), {
     identifiers:[identity.asset,identity.rego,identity.board].filter(Boolean),
     terms:['VMS','Variable message sign',identity.co].filter(Boolean),
     regos:identity.rego ? [identity.rego] : []
    });
   });
   copy.layers = (base.layers || []).map(layer => ({...layer,marks:(layer.marks || []).map(mark => ({
    ...mark,search1096:vms.get(String(mark.face || mark.label || '').toUpperCase().replace(/[^A-Z0-9]/g,'')) || null
   }))}));
   return copy;
  });
  cache.set(base,model);
  return model;
 };
 const installed = new WeakSet();
 function install(frame) {
  if (!frame) return;
  const load = () => {
   try {
    const w = frame.contentWindow;
    if (!w || !w.GC500Explorer || installed.has(w.document)) return;
    installed.add(w.document);
    w.GC500Explorer.ready.then(() => {
     if (!frame.contentDocument || frame.contentDocument !== w.document) return;
     const style = w.document.createElement('style');style.id='map1096-style';style.textContent=__MAP1096_CSS__;w.document.head.appendChild(style);
     const script = w.document.createElement('script');script.id='map1096-script';script.textContent=__MAP1096_JS__;w.document.body.appendChild(script);
    });
   } catch (_) { /* A replaced or cross-origin frame remains native. */ }
  };
  frame.addEventListener('load',load);load();
 }
 const beforeFrame = expFrame;
 expFrame = function () { const frame = beforeFrame.apply(this,arguments);if(!frame.dataset.map1096){frame.dataset.map1096='1';install(frame);}return frame; };
 if (EXP.frame) install(EXP.frame);
})();
