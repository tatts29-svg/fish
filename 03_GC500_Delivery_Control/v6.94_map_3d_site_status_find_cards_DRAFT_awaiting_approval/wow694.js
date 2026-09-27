/* v6.94 - THE MAP, WOW (Andrew, 27 Sep 2026: "I want this to be a wow wow factor, so whoever uses it is like, how is
 this even possible"). All on the satellite map (Mapbox GL, the same key and library as before):
 - the city in 3D: Mapbox Standard Satellite, real 3D buildings, lit for the hour on the Gold Coast (dawn, day, dusk,
 night; AEST, no daylight saving), or chosen;
 - the site in 3D: every reference stands on the photograph as its own shape in its trade's colour - buildings as
 boxes, toilets as cubicles, generators as sets, light towers as 9 m masts with a lamp head - turned to the road;
 - the circuit: the track outline in Coates orange, so it is plain which side of the barrier each thing sits
 (Andrew, 27 Sep 2026: the lapping car "looks silly" - it is gone; the map is for the job);
 - colour by trade or by where each thing is (on site, in transit, not on site, no record);
 - find a reference: the camera sweeps there and the pin pulses;
 - a card on hover (desktop) with the master-plan picture; a tap still opens the drawer in one press;
 - zoomed out, the site glows as a heat haze; a fly-in on first open (not when motion is reduced).
 Positions are the master plan laid on the photograph by image registration (about 8 m), not a survey; the lap and the
 outline is the Showcase's lap line pulled onto the road centre lines. It comes from the machine set (/w/<token>/map/lap.json),
 fetched only when the map opens. Every frame's work stops when the map is closed or the tab is hidden. */
const WOW = {map: null, gl: null, raf: 0, lap: null, last: 0,
 colour: 'trade', light: 'auto', pulse: null, drawn: [], hoverPop: null};
const WOW_STATUS = {'on site': '#39e07a', 'in transit': '#ffb000', 'not on site': '#ff4d4d', 'unknown': '#9aa3ad'};
function wowReduced(){ try { return typeof motionOff === 'function' ? !!motionOff() : matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } }
function wowHourAEST(){ const d = new Date(Date.now() + 10 * 3600e3); return d.getUTCHours() + d.getUTCMinutes() / 60; }
function wowPreset(){ if (WOW.light !== 'auto') return WOW.light; const h = wowHourAEST(); return h < 5.3 ? 'night' : h < 6.6 ? 'dawn' : h < 17.3 ? 'day' : h < 18.6 ? 'dusk' : 'night'; }
function wowBase(){ let t = ''; try { t = typeof wxToken === 'function' ? wxToken() : ''; } catch (e) {} return t ? '/w/' + encodeURIComponent(t) + '/map/' : null; }
function wowStatus(a){ try { return deliveryView(a).semantic || 'unknown'; } catch (e) { return 'unknown'; } }
/* metres east/north of a point, and back */
function wowEN(lat0, lon0, lat, lon){ return [(lon - lon0) * 111320 * Math.cos(lat0 * Math.PI / 180), (lat - lat0) * 110574]; }
function wowLL(lat0, lon0, e, n){ return [lon0 + e / (111320 * Math.cos(lat0 * Math.PI / 180)), lat0 + n / 110574]; }
/* the shape each trade stands as: [width, length, height, base] in metres */
const WOW_SHAPE = {pb: [3.0, 6.0, 2.8, 0], wc: [1.3, 1.3, 2.3, 0], gen: [1.2, 2.8, 1.7, 0], wfb: [0.9, 2.0, 1.0, 0], acc: [1.8, 3.2, 2.0, 0], oth: [1.4, 1.4, 1.4, 0]};
function wowBox(lat, lon, w, l, h, base, bearing, props){
 const c = Math.cos(bearing), s = Math.sin(bearing), pts = [[-w / 2, -l / 2], [w / 2, -l / 2], [w / 2, l / 2], [-w / 2, l / 2], [-w / 2, -l / 2]]
 .map(([x, y]) => wowLL(lat, lon, x * c + y * s, -x * s + y * c));
 return {type: 'Feature', geometry: {type: 'Polygon', coordinates: [pts]}, properties: Object.assign({h, b: base}, props)};
}
function wowSite(drawn){
 const lap = WOW.lap, feats = [];
 drawn.forEach(d => {
 /* turned to the road: the heading of the nearest point of the lap, when the lap is within 60 m */
 let brg = 0;
 if (lap) { let bi = -1, bd = 3600; for (let i = 0; i < lap.n; i++) { const e = (lap.lon[i] - d.lon) * 98300, n = (lap.lat[i] - d.lat) * 110574, q = e * e + n * n; if (q < bd) { bd = q; bi = i; } }
 if (bi >= 0) brg = lap.hd[bi]; }
 const props = {key: d.key, c: d.c, sc: d.sc, g: d.g};
 if (d.g === 'lt') { feats.push(wowBox(d.lat, d.lon, .35, .35, 8.6, 0, brg, props)); feats.push(wowBox(d.lat, d.lon, 1.9, .55, 9.3, 8.6, brg, Object.assign({}, props, {lamp: 1}))); return; }
 const sh = WOW_SHAPE[d.g] || WOW_SHAPE.oth, big = /block|6m|6 m|team|office|double/i.test(d.name || '');
 feats.push(wowBox(d.lat, d.lon, sh[0] * (big && d.g === 'wc' ? 2 : 1), sh[1] * (big && d.g === 'wc' ? 4.5 : 1), sh[2], sh[3], brg, props));
 });
 return {type: 'FeatureCollection', features: feats};
}
async function wowLoadLap(){
 if (WOW.lap) return WOW.lap; const base = wowBase(); if (!base) return null;
 try { const r = await fetch(base + 'lap.json', {cache: 'force-cache'}); if (!r.ok) return null; const j = await r.json(), P = j.pts || [];
 const n = P.length, lat = new Float64Array(n), lon = new Float64Array(n), v = new Float32Array(n), cum = new Float64Array(n + 1), hd = new Float32Array(n);
 for (let i = 0; i < n; i++) { lat[i] = P[i][0]; lon[i] = P[i][1]; v[i] = P[i][3] || 30; }
 for (let i = 0; i < n; i++) { const j2 = (i + 1) % n, e = (lon[j2] - lon[i]) * 111320 * Math.cos(lat[i] * Math.PI / 180), nn = (lat[j2] - lat[i]) * 110574; cum[i + 1] = cum[i] + Math.hypot(e, nn); }
 for (let i = 0; i < n; i++) { const a = (i - 2 + n) % n, b = (i + 2) % n, e = (lon[b] - lon[a]) * 111320 * Math.cos(lat[i] * Math.PI / 180), nn = (lat[b] - lat[a]) * 110574; hd[i] = Math.atan2(e, nn); }
 WOW.lap = {n, lat, lon, v, cum, hd, L: cum[n], grid: j.grid || 0}; return WOW.lap; } catch (e) { return null; }
}
function wowLoad(map, gl, drawn){
 WOW.map = map; WOW.gl = gl; WOW.drawn = drawn; const std = !WOW.fallback;
 const emis = (id, prop) => { if (std) try { map.setPaintProperty(id, prop, 1); } catch (e) {} };
 ['sb-drawn', 'sb-extra'].forEach(id => emis(id, 'circle-emissive-strength')); ['sb-drawn-label', 'sb-extra-label'].forEach(id => emis(id, 'text-emissive-strength'));
 /* close in, the 3D shapes carry the colour and the pin steps back */
 try { map.setPaintProperty('sb-drawn', 'circle-opacity', ['interpolate', ['linear'], ['zoom'], 16.4, .96, 17.4, .22]); map.setPaintProperty('sb-drawn', 'circle-radius', ['interpolate', ['linear'], ['zoom'], 14, 3.2, 16, 5.5, 17, 7, 18.5, 4]); map.setPaintProperty('sb-drawn', 'circle-pitch-alignment', 'map'); } catch (e) {}
 /* zoomed out: the site as a heat haze */
 try { map.addLayer({id: 'sb-heat', type: 'heatmap', source: 'sb-drawn', maxzoom: 15.4, paint: {'heatmap-weight': 1, 'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 11, .6, 15, 1.6],
 'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 11, 6, 15, 26], 'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 13.6, .85, 15.4, 0],
 'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(255,106,19,0)', .25, 'rgba(255,106,19,.45)', .55, 'rgba(255,160,40,.75)', .85, 'rgba(255,214,90,.9)', 1, 'rgba(255,248,220,.95)']}}, 'sb-drawn'); } catch (e) {}
 wowLoadLap().then(lap => {
 if (WOW.map !== map) return;
 try {
 /* the site in 3D, turned to the road */
 map.addSource('sb-3d', {type: 'geojson', data: wowSite(drawn)});
 map.addLayer({id: 'sb-3d', type: 'fill-extrusion', source: 'sb-3d', minzoom: 15, paint: {'fill-extrusion-color': ['get', 'c'], 'fill-extrusion-height': ['get', 'h'], 'fill-extrusion-base': ['get', 'b'],
 'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 15, 0, 15.6, .95], ...(std ? {'fill-extrusion-emissive-strength': ['case', ['has', 'lamp'], 1, .35]} : {})}}, 'sb-drawn');
 satApplyChips(map);
 if (!lap) return;
 const line = {type: 'Feature', geometry: {type: 'LineString', coordinates: Array.from({length: lap.n + 1}, (_, i) => [lap.lon[i % lap.n], lap.lat[i % lap.n]])}};
 map.addSource('sb-lap', {type: 'geojson', data: line});
 map.addLayer({id: 'sb-lap-glow', type: 'line', source: 'sb-lap', layout: {'line-join': 'round', 'line-cap': 'round'}, paint: {'line-color': '#ff6a13', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 4, 17, 16], 'line-blur': ['interpolate', ['linear'], ['zoom'], 12, 3, 17, 12], 'line-opacity': .45, ...(std ? {'line-emissive-strength': 1} : {})}}, 'sb-heat');
 map.addLayer({id: 'sb-lap', type: 'line', source: 'sb-lap', layout: {'line-join': 'round', 'line-cap': 'round'}, paint: {'line-color': '#ffb070', 'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.2, 17, 2.6], 'line-opacity': .9, ...(std ? {'line-emissive-strength': 1} : {})}}, 'sb-heat');
 map.addSource('sb-pulse', {type: 'geojson', data: {type: 'FeatureCollection', features: []}});
 map.addLayer({id: 'sb-pulse', type: 'circle', source: 'sb-pulse', paint: {'circle-radius': 10, 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3, 'circle-stroke-opacity': 1, ...(std ? {'circle-emissive-strength': 1} : {})}});
 wowUI();
 } catch (e) { console.warn('map extras:', e && e.message); }
 });
 /* the card on hover, with the master's own picture of the place */
 if (window.matchMedia && matchMedia('(hover: hover)').matches) {
 WOW.hoverPop = new gl.Popup({closeButton: false, closeOnClick: false, offset: 14, maxWidth: '280px', className: 'wowcard'});
 map.on('mousemove', 'sb-drawn', ev => { const f = ev.features && ev.features[0]; if (!f) return; const k = f.properties.key; if (WOW.hoverKey === k) return; WOW.hoverKey = k; WOW.hoverPop.setLngLat(f.geometry.coordinates).setHTML(wowCard(k)).addTo(map); });
 map.on('mouseleave', 'sb-drawn', () => { WOW.hoverKey = null; WOW.hoverPop.remove(); });
 }
 wowFlyIn(map);
}
function wowCard(k){
 const a = allAssets().find(x => x.key === k); if (!a) return `<b>${esc(k)}</b>`;
 const m = typeof MASTER_LOC !== 'undefined' ? MASTER_LOC[k] : null, img = m && m.img && typeof DATA.media[m.img[0]] === 'string' ? DATA.media[m.img[0]] : null;
 const st = wowStatus(a), tr = (SAT_TRADES.find(x => x[0] === satTrade(a)) || [0, 'Other', '#ccc']);
 const stw = {'on site': 'On site', 'in transit': 'In transit', 'not on site': 'Not on site', 'unknown': 'No delivery record'}[st] || st;
 return `<div class="wowc">${img ? `<img src="${esc(img)}" alt="" decoding="async">` : ''}<div class="wowct"><b>${esc(k)}</b> <span>${esc(a.name || a.item || '')}</span></div>
 <div class="wowcm"><i style="background:${tr[2]}"></i>${esc(tr[1])} <i style="background:${WOW_STATUS[st] || '#999'};margin-left:8px"></i>${esc(stw)}</div><div class="wowcs">Click to open its record</div></div>`;
}
function wowFlyIn(map){
 if (wowReduced()) return; let seen = false; try { seen = sessionStorage.getItem('gc500-map-flyin') === '1'; sessionStorage.setItem('gc500-map-flyin', '1'); } catch (e) {}
 if (seen) return; const c = map.getCenter();
 map.jumpTo({center: [c.lng, c.lat], zoom: Math.max(11.5, map.getZoom() - 3.2), pitch: 0, bearing: 0});
 map.flyTo({center: [c.lng + .0006, c.lat - .0012], zoom: map.getZoom() + 3.6, pitch: 58, bearing: -28, duration: 6500, curve: 1.3, essential: false});
}
function wowUI(){
 const wrap = document.querySelector('.satwrap'); if (!wrap || wrap.querySelector('.wowbar')) return;
 const bar = document.createElement('div'); bar.className = 'wowbar';
 bar.innerHTML = `<label class="wowsel"><span>Light</span><select data-wow="light" aria-label="Light">${[['auto', 'Now (AEST)'], ['dawn', 'Dawn'], ['day', 'Day'], ['dusk', 'Dusk'], ['night', 'Night']].map(([v, n]) => `<option value="${v}"${WOW.light === v ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
 <label class="wowsel"><span>Colour</span><select data-wow="colour" aria-label="Colour by"><option value="trade">Trade</option><option value="status"${WOW.colour === 'status' ? ' selected' : ''}>Where it is</option></select></label>
 <input type="search" class="wowfind" data-wow="find" placeholder="Find: WC23, GN04…" aria-label="Find a reference on the map" autocomplete="off" spellcheck="false">`;
 wrap.appendChild(bar);
 bar.querySelector('[data-wow="light"]').onchange = e => { WOW.light = e.target.value; try { WOW.map.setConfigProperty('basemap', 'lightPreset', wowPreset()); } catch (er) {} };
 bar.querySelector('[data-wow="colour"]').onchange = e => { WOW.colour = e.target.value; const p = WOW.colour === 'status' ? 'sc' : 'c';
 try { WOW.map.setPaintProperty('sb-drawn', 'circle-color', ['get', p]); WOW.map.setPaintProperty('sb-3d', 'fill-extrusion-color', ['get', p]); } catch (er) {}
 const box = document.getElementById('satchips'); if (box) box.classList.toggle('bystatus', WOW.colour === 'status'); };
 const f = bar.querySelector('[data-wow="find"]');
 f.addEventListener('keydown', e => { if (e.key !== 'Enter') return; const q = f.value.trim().toUpperCase(); if (!q) return;
 const d = WOW.drawn.find(x => x.key.toUpperCase() === q) || WOW.drawn.find(x => x.key.toUpperCase().startsWith(q)) || WOW.drawn.find(x => (x.name || '').toUpperCase().includes(q));
 if (!d) { f.classList.add('miss'); setTimeout(() => f.classList.remove('miss'), 900); return; }
 WOW.map.flyTo({center: [d.lon, d.lat], zoom: 18.4, pitch: 60, bearing: WOW.map.getBearing(), curve: 1.5, speed: 1.1, essential: !wowReduced()});
 WOW.pulse = {lat: d.lat, lon: d.lon, t0: performance.now()}; wowStart(); });
}
function wowStart(){ if (!WOW.raf && WOW.map && WOW.pulse) { WOW.last = 0; WOW.raf = requestAnimationFrame(wowFrame); } }
function wowStop(){ if (WOW.raf) cancelAnimationFrame(WOW.raf); WOW.raf = 0; }
function wowFrame(now){
 WOW.raf = 0; const map = WOW.map; if (!map || !LIVEMAP.board || LIVEMAP.board !== map || document.hidden) return;
 const dt = Math.min(.05, WOW.last ? (now - WOW.last) / 1000 : 1 / 60); WOW.last = now;
 if (WOW.pulse) { const k = (now - WOW.pulse.t0) / 1000; if (k > 4.5) { WOW.pulse = null; try { map.getSource('sb-pulse').setData({type: 'FeatureCollection', features: []}); } catch (e) {} }
 else { const ph = (k % 1.1) / 1.1; try { map.getSource('sb-pulse').setData({type: 'Feature', geometry: {type: 'Point', coordinates: [WOW.pulse.lon, WOW.pulse.lat]}, properties: {}});
 map.setPaintProperty('sb-pulse', 'circle-radius', 8 + ph * 38); map.setPaintProperty('sb-pulse', 'circle-stroke-opacity', 1 - ph); } catch (e) {} } }
 if (WOW.pulse) WOW.raf = requestAnimationFrame(wowFrame);
}
