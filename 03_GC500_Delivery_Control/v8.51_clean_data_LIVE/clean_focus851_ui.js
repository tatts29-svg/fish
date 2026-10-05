/* Author: Andrew Fisher. Preserve active note disclosures through native refresh. */
function captureFenceComponents849(scope) {
  const active = document.activeElement, form = active?.closest?.('[data-fc849-guide]');
  const note = active?.matches?.('summary[data-tw840-focus]') ? active.closest('[data-fc851-notes]') : null;
  const section = (form || note)?.closest('[data-fc849-scope]');
  if (!section || section.dataset.fc849Scope !== scope || (!active?.name && !note)) return null;
  for (const fold of section.querySelectorAll('[data-fc849-fold]')) FENCE_COMPONENTS_VIEW849.folds.set(scope + ':' + fold.dataset.fc849Fold, fold.open);
  const main = section.closest('main');
  return {scope, name:active.name || null, token:note ? active.dataset.tw840Focus : null, top:main?.scrollTop || 0, left:main?.scrollLeft || 0, x:window.scrollX, y:window.scrollY};
}
function restoreFenceComponents849(saved) {
  if (!saved) return;
  const section = [...document.querySelectorAll('[data-fc849-scope]')].find(node => node.dataset.fc849Scope === saved.scope);
  const field = saved.token
    ? [...(section?.querySelectorAll('[data-fc851-notes] > summary[data-tw840-focus]') || [])].find(node => node.dataset.tw840Focus === saved.token)
    : [...(section?.querySelectorAll('[data-fc849-guide] [name]') || [])].find(node => node.name === saved.name);
  if (!field || field.disabled) return;
  field.focus({preventScroll:true});
  section.closest('main')?.scrollTo({top:saved.top,left:saved.left,behavior:'instant'});
  window.scrollTo({top:saved.y,left:saved.x,behavior:'instant'});
}
