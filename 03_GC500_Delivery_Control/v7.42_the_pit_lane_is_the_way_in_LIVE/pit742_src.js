/* ------------------------------------------------------------------ v7.42 - THE PIT LANE IS THE WAY IN
 Andrew Fisher, 29 Sep 2026: "Anywhere in the park the truck entry point is going to be pit lane. From the road they
 go into the pit lane. This is the entry point." And: "You're driving from the left, the same way the race cars go."

 The park is Macintosh Island Park, where the paddock is. Every reference standing inside it comes in the same way:
 off the Gold Coast Highway into the pit lane at the lane's north-west end, then down the lane the way the race cars
 run (south-east; the race runs anticlockwise, so the pit straight is driven southbound) with the park on the left.
 That is one rule, kept once, and every one of those references reads it - the drawer's Way in row, the driver
 sheet, Navigate and the maps. A way in somebody PINS standing at a turn-in still wins for that reference, as a
 pin always does; take the pin off and the rule applies again.

 The lane is OpenStreetMap's service road on Macintosh Island tagged for motor sport (way 179722656), which is the
 same line iEDM's key plan draws and the Showcase drives; the park is OpenStreetMap way 414608857. Both
 © OpenStreetMap contributors, ODbL. The lane leaves the highway at its north-west node and dead-ends in the
 paddock at its south-east node; a short link half-way down (way 501847689) joins it to the highway at the paddock
 ramps, which is where a truck would come in if the race ran the other way - so the end can be switched on the
 record without a rebuild, and nothing else about the rule changes. */
const PIT_LANE_LINE = [[-27.983284, 153.424946], [-27.98337, 153.425099], [-27.983829, 153.425529], [-27.984057, 153.425733], [-27.984547, 153.426202], [-27.984933, 153.426564], [-27.985144, 153.426729], [-27.98535, 153.426926], [-27.985481, 153.427041], [-27.98565, 153.427169], [-27.985926, 153.42736], [-27.986299, 153.427588], [-27.986575, 153.427687], [-27.987159, 153.427928], [-27.98785, 153.428195]];
const PARK_OUTLINE = [[-27.98791, 153.428262], [-27.988498, 153.428332], [-27.988685, 153.428379], [-27.988768, 153.428396], [-27.988735, 153.428462], [-27.988692, 153.428495], [-27.98863, 153.428496], [-27.988551, 153.428485], [-27.988422, 153.428547], [-27.987489, 153.428769], [-27.987288, 153.428808], [-27.987031, 153.428773], [-27.986459, 153.428695], [-27.986057, 153.428664], [-27.986057, 153.428558], [-27.985641, 153.428459], [-27.985559, 153.428505], [-27.985513, 153.428505], [-27.985452, 153.42847], [-27.985426, 153.428454], [-27.985357, 153.428445], [-27.985282, 153.428477], [-27.985226, 153.428458], [-27.985121, 153.428496], [-27.984982, 153.42853], [-27.984766, 153.42852], [-27.984371, 153.428339], [-27.984201, 153.428264], [-27.984049, 153.428179], [-27.983753, 153.4279], [-27.98349, 153.427655], [-27.983217, 153.427393], [-27.983087, 153.427244], [-27.982998, 153.427051], [-27.98295, 153.426881], [-27.982902, 153.426603], [-27.982882, 153.426397], [-27.982921, 153.426192], [-27.98303, 153.425901], [-27.98306, 153.425009], [-27.98378, 153.425667], [-27.983821, 153.425705], [-27.984858, 153.426691], [-27.984889, 153.426721], [-27.985184, 153.426929], [-27.985359, 153.427068], [-27.985388, 153.42724], [-27.985501, 153.427309], [-27.986198, 153.427753], [-27.986462, 153.427802], [-27.986847, 153.427933], [-27.987852, 153.428284], [-27.98791, 153.428262]];
/* the two ways a truck can leave the highway for the lane, and which way it then drives */
const PIT_LANE_ENDS = {
 north: {at: PIT_LANE_LINE[0], drive: 'south-east', bearing: 148, side: 'left',
 how: 'off the Gold Coast Highway into the pit lane at its north-west end, then down the lane the way the race cars go (south-east), with the park on your left'},
 south: {at: PIT_LANE_LINE[12], drive: 'north-west', bearing: 328, side: 'right',
 how: 'off the Gold Coast Highway at the paddock ramps into the pit lane, then up the lane (north-west), with the park on your right'}};
const PIT_LANE_DEFAULT = {on: true, end: 'north', by: 'Andrew Fisher', at: '2026-09-29T07:30:00.000Z', said: 'Anywhere in the park the truck entry point is going to be pit lane. From the road they go into the pit lane. Driving from the left, the same way the race cars go.'};
function pitLaneRule(){
 const g = (S.gates || {}).pitlane;
 const r = Object.assign({}, PIT_LANE_DEFAULT, g && typeof g === 'object' ? g : {});
 if (!PIT_LANE_ENDS[r.end]) r.end = 'north';
 return r;
}
function pitLaneRuleSet(patch){
 if (!mayWrite('the pit lane rule')) return null;
 const who = whoAmI(); if (!who) return null;
 S.gates = S.gates || {};
 S.gates.pitlane = Object.assign({}, pitLaneRule(), patch || {}, {by: who, at: new Date().toISOString()});
 stampIt('gates', 'pitlane', who); bump();
 return S.gates.pitlane;
}
/* inside the park outline, or not: a ray cast on the point's longitude */
function inPark(lat, lon){
 if (!(isFinite(lat) && isFinite(lon))) return false;
 const P = PARK_OUTLINE; let ins = false;
 for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
 const yi = P[i][0], xi = P[i][1], yj = P[j][0], xj = P[j][1];
 if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi + 1e-12) + xi) ins = !ins;
 }
 return ins;
}
/* where a reference stands, best first: somebody stood at it, somebody placed it, the master plan's tag, the drawing */
function refLatLon(a){
 if (!a) return null;
 const best = bestPinFor(a);
 if (best && best.fix && best.fix.lat != null) return {lat: best.fix.lat, lon: best.fix.lon, basis: 'pinned'};
 const put = typeof bestPlaceFor === 'function' ? bestPlaceFor(a) : null;
 if (put && put.place && put.place.lat != null) return {lat: put.place.lat, lon: put.place.lon, basis: 'placed'};
 const m = typeof MASTER_LOC !== 'undefined' && MASTER_LOC[a.key];
 if (m && Array.isArray(m.ll)) return {lat: m.ll[0], lon: m.ll[1], basis: 'master plan'};
 const pt = aerialPointFor(a), ll = pt ? lonLatOf(pt.ax, pt.ay) : null;
 return ll ? {lat: ll.lat, lon: ll.lon, basis: 'drawing'} : null;
}
function refInPark(ref){
 const a = assetOf(ref); if (!a) return false;
 const ll = refLatLon(a);
 return !!ll && inPark(ll.lat, ll.lon);
}
/* the way in the rule gives a reference in the park, shaped like a pinned entry so everything that reads one reads
 this: no accuracy (nobody measured it), `gate` says where it came from, `how` says it in words */
function pitLaneWayIn(ref){
 const r = pitLaneRule(); if (!r.on) return null;
 if (!refInPark(ref)) return null;
 const end = PIT_LANE_ENDS[r.end], fr = frameOf(end.at[0], end.at[1]);
 const onFrame = !!fr && fr.ax >= -0.25 && fr.ax <= 1.25 && fr.ay >= -0.25 && fr.ay <= 1.25;
 return {lat: end.at[0], lon: end.at[1], acc: null, at: r.at, by: r.by, ax: onFrame ? fr.ax : null, ay: onFrame ? fr.ay : null,
 off: null, outside: null, away_m: null, ref: ref, unit: null, n: 0, took: 'the pit lane rule',
 gate: 'pitlane', end: r.end, how: end.how, drive: end.drive, bearing: end.bearing};
}
function entryOf(ref){
 const e = (S.entries || {})[ref];
 if (e) return e;                       /* somebody stood at the turn-in: that wins, as a pin always does */
 return pitLaneWayIn(ref);
}
function pitLaneWords(e){
 const end = PIT_LANE_ENDS[(e && e.end) || pitLaneRule().end];
 return 'The pit lane is the way in: ' + end.how + '.';
}
function pitLaneRuleWords(){
 const r = pitLaneRule();
 return 'The rule for everything in Macintosh Island Park, set by ' + (r.by || 'the project manager') + (r.at ? ' on ' + fmtStamp(r.at) : '') + '. A way in pinned at the turn-in for one reference still wins for that one.';
}
/* the drawer's Way in row when the rule applies */
function pitLaneRow(a, e){
 const ll = {lat: e.lat, lon: e.lon}, d = entryToDrop(a.key), can = !SYNC.readonly && typeof canEdit === 'function' && canEdit();
 const other = e.end === 'north' ? 'south' : 'north';
 return `<div class="pinrow on pitlane"><div class="pinwho"><b>Way in</b><span class="w">the pit lane, like everything in the park</span></div>
 <div class="pinwhat">
 <span class="pitlanehow">${esc(pitLaneWords(e))}</span>
 <span class="mono">${e.lat.toFixed(6)}, ${e.lon.toFixed(6)}</span>
 <span class="chip act" title="${esc(pitLaneRuleWords())}">the rule, not a measurement</span>
 ${d ? `<span class="chip ref" title="Measured on the ground from the lane entry to ${esc(d.basis)} - not a driving distance and not a route.">${d.m} m from ${esc(d.basis)}</span>` : ''}
 <span class="w pinby">${esc(e.by || 'unnamed')}${e.at ? ' · ' + fmtStamp(e.at) : ''}</span>
 <span class="pinacts">
 <a class="btn ghost" href="${navUrl(ll)}" target="_blank" rel="noopener noreferrer" title="Driving directions to the pit lane entry - this is the one for a truck.">Drive to the pit lane entry</a>
 <a class="btn ghost" href="${earthUrl(ll)}" target="_blank" rel="noopener noreferrer" title="Google Earth, tilted over the lane entry.">Earth</a>
 <button class="btn ghost pinbtn" data-pinentry="${esc(a.key)}" title="Stand at a different turn-in and press this: a pin taken on site wins over the rule for ${esc(a.key)}">Pin a different way in</button>
 ${can ? `<button class="btn ghost" data-pitlaneend="${other}" title="Trucks would enter at the lane's ${other} end instead and drive it the other way - for every reference in the park">Enter at the ${other} end instead</button>` : ''}
 </span>
 </div></div>`;
}
/* the map: one mark for the lane entry, never forty-seven on top of each other */
function pitLaneWayFeatures(feat){
 const r = pitLaneRule(); if (!r.on) return [];
 const end = PIT_LANE_ENDS[r.end];
 return [feat(end.at[1], end.at[0], {ref: 'Pit lane entry', by: r.by || 'unnamed', at: r.at ? fmtStamp(r.at) : '', acc: 'the rule for the park', away: 'drive the lane ' + end.drive})];
}
function pitLanePopup(key, ed){
 return 'Way in to ' + key + ' - ' + pitLaneWords() + (ed ? ' ' + ed.m + ' m from ' + ed.basis + '.' : '');
}
