  /* Author: Andrew Fisher. v9.96: changed identity and position reach the existing map views together. */
  const planSigOf = h => JSON.stringify(h ? [h.items || [], h.unplaced || [], h.placed || [], h.trades || [], h.layers || []] : null);
  let planSig = null, cardSig996 = null;
  /* the list line of a placed reference says how it got there */
  if (typeof buildItems === 'function' && !buildItems.__placed) {
    const origBuild = buildItems;
    buildItems = function () {
      const r = origBuild.apply(this, arguments);
      try { planSig = planSigOf(HOST);
        const byKey = new Map(((HOST && HOST.items) || []).filter(i => i.placedHow).map(i => [norm(i.key), i.placedHow]));
        ITEMS.forEach(it => { if (byKey.has(it.code)) { it.placedHow = byKey.get(it.code); it.reg = Object.assign({}, it.reg, {sec: ''}); } }); } catch (e) {}
      return r;
    };
    buildItems.__placed = true;
  }
  if (typeof placeWord === 'function' && !placeWord.__placed) {
    const origWord = placeWord;
    placeWord = function (it) { return it && it.placedHow ? it.placedHow : origWord.apply(this, arguments); };
    placeWord.__placed = true;
  }
  function refreshCard996() {
    const el = $$('xcard');
    if (!el || el.hidden) { cardSig996 = null; return false; }
    const open = el.querySelector('[data-xopen]'), code = open && open.dataset.xopen || selected && selected.code;
    let host = null, info = null;
    try { host = window.parent && window.parent !== window ? window.parent : null;
      if (code && host && typeof host.gc500PlanCard === 'function') info = host.gc500PlanCard(code);
    } catch (_) { return false; }
    if (!code || !info || typeof window.GC500ExplorerRefreshCard897 !== 'function') return false;
    const signature = JSON.stringify([code, info]);
    if (signature === cardSig996) return false;
    const changed = window.GC500ExplorerRefreshCard897();
    if (changed) cardSig996 = signature;
    return !!changed;
  }
  /* Reuse native lists, search and card rendering. Refresh data without reloading the map or moving its camera. */
  function refresh(noSearch996 = false) {
    if (!window.__ready || typeof buildItems !== 'function') return false;
    let h = null; try { h = hostPlan(); } catch (e) { return false; }
    if (planSigOf(h) === planSig) return refreshCard996();
    const on = document.querySelector('#chips .chip[aria-pressed="true"]'), onName = on ? (CATS_NOW.find(c => c.id === on.dataset.cat) || {}).name : null;
    const selCode = selected && selected.code, markedCodes = marks.map(m => m.it.code);
    const focused = document.activeElement, focusList = focused && focused.closest && focused.closest('#results,#findList'), focusCode = focused && focused.dataset && focused.dataset.code;
    const positions = ['results', 'findList'].map(id => { const el = $$(id); return [id, el ? el.scrollTop : 0]; });
    buildItems();
    const byCode = new Map(ITEMS.map(it => [it.code, it]));
    marks = markedCodes.map(code => byCode.get(code)).filter(it => it && it.places.length).map(it => ({it, c: it.cat ? it.cat.c : '#ff6a13'}));
    selected = selCode ? byCode.get(selCode) || null : null;
    const cat = onName ? CATS_NOW.find(c => c.name === onName) : null;
    if (cat) {
      const b = document.querySelector('#chips .chip[data-cat="' + cat.id + '"]'); if (b) b.setAttribute('aria-pressed', 'true');
      const keep = gotoRect; gotoRect = function () {}; try { showCategory(cat.id); } finally { gotoRect = keep; }
    } else if (onName) { showCategory(null); }
    if (selected && !marks.some(m => m.it === selected) && selected.places.length) marks.push({it: selected, c: selected.cat ? selected.cat.c : '#ff6a13'});
    if (selCode && !selected) { stopPulse(); const card = $$('xcard'); if (card) card.hidden = true; cardSig996 = null; }
    const q = $$('q'); if (!noSearch996 && q && q.value.trim() && typeof search === 'function') search();
    positions.forEach(([id, top]) => { const el = $$(id); if (el) el.scrollTop = top; });
    if (focusList && focusCode) {
      const target = [...focusList.querySelectorAll('[data-code]')].find(b => b.dataset.code === focusCode);
      if (target) target.focus({preventScroll:true}); else if (q) q.focus({preventScroll:true});
    }
    refreshCard996();
    try { window.GC500ExplorerRepin(); } catch (e) {}
    requestPaint();
    return true;
  }
  // A warmed frame can build its first item list while the parent's initial record is still arriving.
  // Reconcile once the native map is usable; subsequent record renders use the same refresh path.
  if (window.GC500Explorer && window.GC500Explorer.ready) window.GC500Explorer.ready.then(() => refresh()).catch(() => {});
