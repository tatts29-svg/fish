/* Author: Andrew Fisher. v12.43.1: bounded card pictures; sharing owns separate URLs. */
function createPicCache12431(PIC, PFAIL, PQ, FLY, LBY, D, W, request, budget) {
 const cards = new Map(), images = new Map(), near = new Set(), pending = new Set(), latest = new Map(), obsolete = new Set(), awaiting = new Set();
 let observer = null, root = null, watched = null, mutation = null, timer = null, rebuild = false;
 const slot = id => { const end = id.lastIndexOf('|'), start = id.lastIndexOf('|', end - 1); return id.slice(0, start) + id.slice(end); };
 const active = () => { const pane = D.getElementById('pane-demob'); return !!pane && !D.hidden && D.visibilityState !== 'hidden' && !pane.hidden && pane.classList.contains('on'); };
 const present = a => a.isConnected && !a.hidden && !a.closest('[hidden]');
 const revoke = url => { try { W.URL.revokeObjectURL(url); } catch (x) {} };
 function wanted(id) {
  if (!active()) return false;
  for (const im of images.get(id) || []) { const a = im.closest('article.sg1238'); if (im.isConnected && near.has(a) && present(a)) return true; }
  return false;
 }
 function pins() {
  const ids = new Set(FLY), urls = new Set();
  if (active()) for (const a of new Set([...near, ...pending])) {
   if (!present(a)) continue;
   for (const im of cards.get(a) || []) if (im.isConnected) {
    ids.add(im.getAttribute('data-pi1238'));
    if (im.currentSrc) urls.add(im.currentSrc);
    if (im.getAttribute('src')) urls.add(im.getAttribute('src'));
   }
  }
  return {ids, urls};
 }
 function drop(id) {
  const url = PIC.get(id); if (!url) return;
  for (const im of images.get(id) || []) if (im.isConnected && im.getAttribute('src') === url) {
   im.removeAttribute('src'); im.classList.remove('on');
   const frame = im.parentNode;
   if (frame && !frame.querySelector('.w1238')) frame.insertAdjacentHTML('afterbegin', '<span class="w1238"></span>');
  }
  PIC.delete(id); revoke(url);
 }
 function pruneQueue() { for (let i = PQ.length - 1; i >= 0; i--) if (!wanted(PQ[i])) PQ.splice(i, 1); }
 function sweep() {
  for (const [a] of cards) if (!a.isConnected) { if (observer) observer.unobserve(a); cards.delete(a); near.delete(a); pending.delete(a); }
  for (const [id, set] of images) { for (const im of set) if (!im.isConnected) set.delete(im); if (!set.size) images.delete(id); }
  pruneQueue();
  const keep = pins(), removable = (id, url) => !keep.ids.has(id) && !keep.urls.has(url);
  for (const id of obsolete) { const url = PIC.get(id); if (url && removable(id, url)) drop(id); }
  /* Connected pictures outside the observer margin are reloadable. Visible/in-flight URLs are never sacrificed to the budget. */
  for (const [id, url] of PIC) { if (PIC.size <= budget) break; if (removable(id, url)) drop(id); }
  for (const id of LBY.keys()) if (!images.has(id) && !awaiting.has(id) && !FLY.has(id) && !PIC.has(id) && PQ.indexOf(id) < 0) LBY.delete(id);
  for (const id of obsolete) if (!LBY.has(id) && !PIC.has(id) && !FLY.has(id)) obsolete.delete(id);
  for (const [key, id] of latest) if (!LBY.has(id) && !PIC.has(id) && !FLY.has(id)) latest.delete(key);
  for (const [id, at] of PFAIL) if (!FLY.has(id) && (Date.now() - at >= 60000 || (PFAIL.size > budget && !wanted(id)))) PFAIL.delete(id);
 }
 function schedule(index) {
  rebuild = rebuild || !!index; if (timer !== null) return;
  timer = W.setTimeout(() => { timer = null; const all = rebuild; rebuild = false; if (all) arm(root); else sweep(); }, 0);
 }
 function remember(id, L) { const key = slot(id), old = latest.get(key); if (old && old !== id) obsolete.add(old); latest.set(key, id); obsolete.delete(id); awaiting.add(id); LBY.set(id, L); schedule(true); }
 function get(id) { const url = PIC.get(id); if (url) { PIC.delete(id); PIC.set(id, url); } return url; }
 function put(id, url) {
  /* A duplicate result for the same place must not replace a URL an image is still decoding. */
  const old = get(id); if (old) { if (old !== url) revoke(url); return old; }
  PIC.set(id, url); return url;
 }
 function requestNear() { const ids = new Set(); for (const a of near) if (present(a)) for (const im of cards.get(a) || []) ids.add(im.getAttribute('data-pi1238')); ids.forEach(id => { if (wanted(id)) request(id); }); }
 function watch(pane) {
  if (watched === pane) return;
  if (mutation) mutation.disconnect(); watched = pane;
  if (!pane || !W.MutationObserver) return;
  const carries = n => n.nodeType === 1 && (n.matches('img[data-pi1238],article.sg1238,.sgv1238') || !!n.querySelector('img[data-pi1238]'));
  mutation = new W.MutationObserver(ms => {
   if (ms.some(m => m.type === 'attributes' ? m.target === pane || m.attributeName === 'hidden' : [...m.addedNodes, ...m.removedNodes].some(carries))) schedule(true);
  });
  mutation.observe(pane, {childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden']});
 }
 function arm(nextRoot) {
  const pane = D.getElementById('pane-demob'); watch(pane);
  if (observer && root !== nextRoot) { observer.disconnect(); observer = null; near.clear(); pending.clear(); cards.clear(); }
  root = nextRoot;
  if (!observer && W.IntersectionObserver) { const current = new W.IntersectionObserver(entries => {
   if (observer !== current) return;
   for (const en of entries) { if (!cards.has(en.target)) continue; pending.delete(en.target); if (en.isIntersecting) near.add(en.target); else near.delete(en.target); }
   requestNear(); sweep();
  }, {root, rootMargin: '500px 0px'}); observer = current; }
  const found = new Set(pane ? pane.querySelectorAll('article.sg1238') : []);
  for (const [a] of cards) if (!found.has(a)) { if (observer) observer.unobserve(a); cards.delete(a); near.delete(a); pending.delete(a); }
  images.clear();
  for (const a of found) {
   const fresh = !cards.has(a), list = [...a.querySelectorAll('img[data-pi1238]')]; cards.set(a, list);
   for (const im of list) { const id = im.getAttribute('data-pi1238'); if (!images.has(id)) images.set(id, new Set()); images.get(id).add(im); }
   if (fresh) { if (observer) { pending.add(a); observer.observe(a); } else near.add(a); }
  }
  awaiting.clear(); requestNear(); sweep();
 }
 if (D.addEventListener) D.addEventListener('visibilitychange', () => schedule(true));
 if (D.addEventListener) D.addEventListener('load', ev => { if (ev.target && ev.target.matches && ev.target.matches('img[data-pi1238]')) schedule(false); }, true);
 return Object.freeze({remember, get, put, wanted, pruneQueue, sweep, arm});
}
const PicCache12431 = createPicCache12431(PIC, PFAIL, PQ, FLY, LBY, D, W, want, 96);
