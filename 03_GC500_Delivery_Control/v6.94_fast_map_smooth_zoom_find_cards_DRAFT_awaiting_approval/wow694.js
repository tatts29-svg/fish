/* v6.94 - THE MAP, FAST (Andrew, 27 Sep 2026: "when I say wow wow, it's using it - the feel. Smooth. Easy. No lag. It's the
 zooming. It's finding things with ease. It's fast. No lag. No freeze. That's wow wow").
 So nothing here is for show; every line is for speed or for finding things:
 - READY BEFORE YOU ASK. The map library, its key and the circuit outline are fetched quietly once the dashboard has settled,
 so pressing Map shows the map at once instead of waiting on api.mapbox.com. The map is kept when you go to another tab and
 is simply there again when you come back.
 - LESS TO DRAW. The light satellite style, with the shop, transit and landmark labels hidden (street names stay); the pins
 and their names are GPU layers; nothing runs every frame except a pulse for four seconds after a find. On a very sharp
 phone screen the map draws at twice the screen's point size rather than three times, which is where zoom lag comes from
 on phones, and the difference cannot be seen.
 - FIND ANYTHING. Type in the map's own find box: suggestions as you type (a reference, a name, a trade - "GN" lists the
 generators), arrows and Enter or a tap; the map glides there fast, the pin pulses and its card opens, on a phone too.
 - ONE LOOK. Colour by trade or by where each thing is (on site, in transit, not on site, no record); the circuit outline in
 Coates orange so it is plain which side of the barrier each thing sits; a card on hover with the master-plan picture.
 Positions are the master plan laid on the photograph by image registration (about 8 m), not a survey. */
const WOW = {map: null, gl: null, raf: 0, lap: null, colour: 'trade', pulse: null, drawn: [], hoverPop: null, pick: -1, hits: []};
const WOW_STATUS = {'on site': '#39e07a', 'in transit': '#ffb000', 'not on site': '#ff4d4d', 'unknown': '#9aa3ad'};
function wowReduced(){ try { return typeof motionOff === 'function' ? !!motionOff() : matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
function wowBase(){ let t = ''; try { t = typeof wxToken === 'function' ? wxToken() : ''; } catch (e) {} return t ? '/w/' + encodeURIComponent(t) + '/map/' : null; }
function wowStatus(a){ try { return deliveryView(a).semantic || 'unknown'; } catch (e) { return 'unknown'; } }
async function wowLoadLap(){
 if (WOW.lap) return WOW.lap; const base = wowBase(); if (!base) return null;
 try { const r = await fetch(base + 'lap.json', {cache: 'force-cache'}); if (!r.ok) return null; const j = await r.json(), P = j.pts || [];
 WOW.lap = {coords: P.map(p => [p[1], p[0]]).concat(P.length ? [[P[0][1], P[0][0]]] : [])}; return WOW.lap; } catch (e) { return null; }
}
/* ready before you ask: once the page has settled, on the hosted link only */
function wowWarm(){
 try { if (!liveMapPossible() || WOW.warmed) return; } catch (e) { return; } WOW.warmed = true;
 const go = () => { try { liveMapKeyFromService().then(() => loadMapboxGl()).catch(() => {}); wowLoadLap(); } catch (e) {} };
 if (window.requestIdleCallback) requestIdleCallback(go, {timeout: 4000}); else setTimeout(go, 1500);
}
function wowTidyStyle(map){
 /* fewer labels to place on every zoom step: shops, transit, landmarks and natural features off; roads and places stay */
 try { map.getStyle().layers.forEach(l => { if (l.type === 'symbol' && /poi|transit|airport|natural|waterway-label|water-point|building-number|housenum/i.test(l.id)) map.setLayoutProperty(l.id, 'visibility', 'none'); }); } catch (e) {}
}
function wowLoad(map, gl, drawn){
 WOW.map = map; WOW.gl = gl; WOW.drawn = drawn; wowTidyStyle(map);
 wowLoadLap().then(lap => {
 if (WOW.map !== map || !lap) return;
 try {
 map.addSource('sb-lap', {type: 'geojson', data: {type: 'Feature', geometry: {type: 'LineString', coordinates: lap.coords}}});
 map.addLayer({id: 'sb-lap', type: 'line', source: 'sb-lap', layout: {'line-join': 'round', 'line-cap': 'round'}, paint: {'line-color': '#ff6a13', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.4, 17, 3.2], 'line-opacity': .8}}, 'sb-drawn');
 } catch (e) {}
 });
 try { map.addSource('sb-pulse', {type: 'geojson', data: {type: 'FeatureCollection', features: []}});
 map.addLayer({id: 'sb-pulse', type: 'circle', source: 'sb-pulse', paint: {'circle-radius': 10, 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3, 'circle-stroke-opacity': 1}}); } catch (e) {}
 /* the card: on hover on a desktop, and opened by a find on any device */
 WOW.hoverPop = new gl.Popup({closeButton: false, closeOnClick: true, offset: 14, maxWidth: '280px', className: 'wowcard'});
 if (window.matchMedia && matchMedia('(hover: hover)').matches) {
 map.on('mousemove', 'sb-drawn', ev => { const f = ev.features && ev.features[0]; if (!f) return; const k = f.properties.key; if (WOW.hoverKey === k) return; WOW.hoverKey = k; WOW.hoverPop.setLngLat(f.geometry.coordinates).setHTML(wowCard(k)).addTo(map); });
 map.on('mouseleave', 'sb-drawn', () => { WOW.hoverKey = null; WOW.hoverPop.remove(); });
 }
 wowUI();
}
function wowCard(k, tap){
 const a = allAssets().find(x => x.key === k); if (!a) return `<b>${esc(k)}</b>`;
 const m = typeof MASTER_LOC !== 'undefined' ? MASTER_LOC[k] : null, img = m && m.img && typeof DATA.media[m.img[0]] === 'string' ? DATA.media[m.img[0]] : null;
 const st = wowStatus(a), tr = (SAT_TRADES.find(x => x[0] === satTrade(a)) || [0, 'Other', '#ccc']);
 const stw = {'on site': 'On site', 'in transit': 'In transit', 'not on site': 'Not on site', 'unknown': 'No delivery record'}[st] || st;
 return `<div class="wowc">${img ? `<img src="${esc(img)}" alt="" decoding="async">` : ''}<div class="wowct"><b>${esc(k)}</b> <span>${esc(a.name || a.item || '')}</span></div>
 <div class="wowcm"><i style="background:${tr[2]}"></i>${esc(tr[1])} <i style="background:${WOW_STATUS[st] || '#999'};margin-left:8px"></i>${esc(stw)}</div>${tap ? `<div class="wowcs"><button type="button" class="btn tiny" data-satopen="${esc(k)}">Open ${esc(k)}</button></div>` : '<div class="wowcs">Click to open its record</div>'}</div>`;
}
function wowMatches(q){
 q = q.trim().toUpperCase(); if (!q) return [];
 const tn = SAT_TRADES.find(x => x[1].toUpperCase().startsWith(q) || (q.length >= 3 && x[1].toUpperCase().includes(q)));
 const score = d => { const k = d.key.toUpperCase(), n = (d.name || '').toUpperCase();
 return k === q ? 0 : k.startsWith(q) ? 1 : n.startsWith(q) ? 2 : (n.includes(q) || k.includes(q)) ? 3 : tn && d.g === tn[0] ? 4 : 9; };
 return WOW.drawn.map(d => [score(d), d]).filter(x => x[0] < 9).sort((a, b) => a[0] - b[0] || a[1].key.localeCompare(b[1].key, 'en', {numeric: true})).slice(0, 8).map(x => x[1]);
}
function wowGo(d){
 const map = WOW.map; if (!map || !d) return; const box = document.querySelector('.wowsug'); if (box) box.hidden = true;
 const f = document.querySelector('.wowfind'); if (f) { f.value = d.key; f.blur(); }
 let far = map.getZoom() < 15; try { far = far || !map.getBounds().contains([d.lon, d.lat]); } catch (e) {}
 const opts = {center: [d.lon, d.lat], zoom: Math.max(map.getZoom(), 18), essential: true};
 if (wowReduced()) map.jumpTo(opts); else if (far) map.flyTo(Object.assign(opts, {speed: 2.2, curve: 1.3})); else map.easeTo(Object.assign(opts, {duration: 450}));
 map.once('moveend', () => { try { WOW.hoverKey = d.key; WOW.hoverPop.setLngLat([d.lon, d.lat]).setHTML(wowCard(d.key, true)).addTo(map); } catch (e) {} });
 WOW.pulse = {lat: d.lat, lon: d.lon, t0: performance.now()}; wowStart();
}
function wowUI(){
 const wrap = document.querySelector('.satwrap'); if (!wrap || wrap.querySelector('.wowbar')) return;
 const bar = document.createElement('div'); bar.className = 'wowbar';
 bar.innerHTML = `<div class="wowfindw"><input type="search" class="wowfind" placeholder="Find: GN04, WC23, generators…" aria-label="Find on the map" autocomplete="off" spellcheck="false" enterkeyhint="go" role="combobox" aria-expanded="false" aria-controls="wowsug"><div class="wowsug" id="wowsug" role="listbox" hidden></div></div>
 <label class="wowsel"><span>Colour</span><select data-wow="colour" aria-label="Colour by"><option value="trade">Trade</option><option value="status"${WOW.colour === 'status' ? ' selected' : ''}>Where it is</option></select></label>`;
 wrap.appendChild(bar);
 const f = bar.querySelector('.wowfind'), sug = bar.querySelector('.wowsug');
 const show = () => { const hits = wowMatches(f.value); WOW.hits = hits; WOW.pick = hits.length ? 0 : -1;
 sug.innerHTML = hits.map((d, i) => `<button type="button" role="option" data-i="${i}" aria-selected="${i === 0}"><i style="background:${WOW.colour === 'status' ? d.sc : d.c}"></i><b>${esc(d.key)}</b> <span>${esc(d.name || '')}</span></button>`).join('')
 || (f.value.trim() ? '<div class="wownone">Nothing by that name on the map</div>' : '');
 sug.hidden = !f.value.trim(); f.setAttribute('aria-expanded', String(!sug.hidden)); };
 f.addEventListener('input', show); f.addEventListener('focus', () => { if (f.value.trim()) show(); });
 f.addEventListener('keydown', e => { const n = WOW.hits.length;
 if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (!n) return; WOW.pick = (WOW.pick + (e.key === 'ArrowDown' ? 1 : n - 1)) % n; sug.querySelectorAll('[data-i]').forEach(b => b.setAttribute('aria-selected', String(+b.dataset.i === WOW.pick))); }
 else if (e.key === 'Enter') { e.preventDefault(); if (!WOW.hits.length) show(); if (WOW.hits.length) wowGo(WOW.hits[Math.max(0, WOW.pick)]); else { f.classList.add('miss'); setTimeout(() => f.classList.remove('miss'), 900); } }
 else if (e.key === 'Escape') { sug.hidden = true; f.blur(); } });
 sug.addEventListener('pointerdown', e => { const b = e.target.closest('[data-i]'); if (b) { e.preventDefault(); wowGo(WOW.hits[+b.dataset.i]); } });
 f.addEventListener('blur', () => setTimeout(() => { sug.hidden = true; }, 150));
 bar.querySelector('[data-wow="colour"]').onchange = e => { WOW.colour = e.target.value; const p = WOW.colour === 'status' ? 'sc' : 'c';
 try { WOW.map.setPaintProperty('sb-drawn', 'circle-color', ['get', p]); } catch (er) {}
 const box = document.getElementById('satchips'); if (box) box.classList.toggle('bystatus', WOW.colour === 'status'); };
}
function wowStart(){ if (!WOW.raf && WOW.map && WOW.pulse) WOW.raf = requestAnimationFrame(wowFrame); }
function wowStop(){ if (WOW.raf) cancelAnimationFrame(WOW.raf); WOW.raf = 0; }
function wowFrame(now){
 WOW.raf = 0; const map = WOW.map; if (!map || !LIVEMAP.board || LIVEMAP.board !== map || document.hidden || !WOW.pulse) return;
 const k = (now - WOW.pulse.t0) / 1000;
 if (k > 4) { WOW.pulse = null; try { map.getSource('sb-pulse').setData({type: 'FeatureCollection', features: []}); } catch (e) {} return; }
 const ph = k % 1; try { map.getSource('sb-pulse').setData({type: 'Feature', geometry: {type: 'Point', coordinates: [WOW.pulse.lon, WOW.pulse.lat]}, properties: {}});
 map.setPaintProperty('sb-pulse', 'circle-radius', 8 + ph * 34); map.setPaintProperty('sb-pulse', 'circle-stroke-opacity', 1 - ph); } catch (e) {}
 WOW.raf = requestAnimationFrame(wowFrame);
}
