function place(svg){
 svg = svg || el(); if (!svg) return;
 const g = svg.querySelector('g.tiles'), gs = svg.querySelector('g.satw');
 if (base === 'sat') {
  if (g) g.innerHTML = '';
  if (gs) { const t = satTiles(svg); gs.setAttribute('data-z', t.z); gs.innerHTML = t.tiles.map(t => '<image href="' + t.url + '" x="' + t.x + '" y="' + t.y + '" width="' + t.span + '" height="' + t.span + '" preserveAspectRatio="none"/>').join(''); }
  return;
 }
 if (gs) gs.innerHTML = '';
 if (!g) return; let h = '';
 wanted(svg).forEach(t => { const u = cache[t.key]; if (u) h += '<image href="' + u + '" x="' + t.x + '" y="' + t.y + '" width="' + t.span + '" height="' + t.span + '" preserveAspectRatio="none"/>'; else if (u === undefined && navigator.onLine !== false) { cache[t.key] = null; queue.push(t); } });
 g.innerHTML = h; pump();
}