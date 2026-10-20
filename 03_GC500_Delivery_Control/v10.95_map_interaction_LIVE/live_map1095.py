"""Author: Andrew Fisher. Legacy live-map display uses existing approved pins without editing records."""

def apply(text, replace_once):
    text = replace_once(text,
        "async function mountLiveMap(box, a, pt){\n if (!box || !pt) return;\n const ll = lonLatOf(pt.ax, pt.ay);",
        "async function mountLiveMap(box, a, pt){\n if (!box || !pt) return;\n const approved1095 = andrewPin1084(a);\n const ll = approved1095 ? {lat: approved1095.place.lat, lon: approved1095.place.lon} : lonLatOf(pt.ax, pt.ay);")
    text = replace_once(text,
        "const PN = pinsNow(), mine = Object.keys(PN).filter(k => fixParse(k).ref === a.key && PN[k] && PN[k].lat != null).map(k => Object.assign({key: k}, PN[k]));\n const fx = mine[0] || null;\n const centre = fx ? [fx.lon, fx.lat] : [ll.lon, ll.lat];",
        "const PN = pinsNow(), mine = Object.keys(PN).filter(k => fixParse(k).ref === a.key && PN[k] && PN[k].lat != null && (!approved1095 || !PN[k].master)).map(k => Object.assign({key: k}, PN[k]));\n // Display-only: retain real unit pins, replace only superseded synthetic master markers.\n const approvedAround1095 = new Map(holdAssets(() => allAssets().filter(x => !x._cancelled).map(x => [x.key, andrewPin1084(x)]).filter(x => x[1])));\n const fx = mine[0] || null;\n const centre = approved1095 ? [ll.lon, ll.lat] : fx ? [fx.lon, fx.lat] : [ll.lon, ll.lat];")
    text = replace_once(text,
        ".setPopup(new gl.Popup({offset: 22, closeButton: false}).setText(a.key + ' — where the drawing puts it (callout, not a survey)')).addTo(map);",
        ".setPopup(new gl.Popup({offset: 22, closeButton: false}).setText(a.key + (approved1095 ? ' — Andrew’s pin · reference location' : ' — where the drawing puts it (callout, not a survey)'))).addTo(map);")
    text = replace_once(text,
        " const putHere = (!mine.length) ? bestPlaceFor(a) : null;",
        " const putHere = (!approved1095 && !mine.length) ? bestPlaceFor(a) : null;")
    text = replace_once(text,
        ".setPopup(new gl.Popup({offset: 22, closeButton: false}).setText(fixLabel(f.key) + ' — recorded by ' + (f.by || 'somebody') + ' standing at it, ' + fixQuality(f.acc).word)).addTo(map));",
        ".setPopup(new gl.Popup({offset: 22, closeButton: false}).setText(fixLabel(f.key) + (f.master ? ' — master plan position, not a site measurement' : ' — recorded by ' + (f.by || 'somebody') + ' standing at it, ' + fixQuality(f.acc).word))).addTo(map));")
    text = replace_once(text,
        " const f = PN[k]; if (fixParse(k).ref === a.key || !f || f.lat == null) return;\n new gl.Marker({color: '#8a9096', scale: 0.6}).setLngLat([f.lon, f.lat])\n.setPopup(new gl.Popup({offset: 14, closeButton: false}).setText(fixLabel(k) + ' — recorded by ' + (f.by || 'somebody') + ', ' + fixQuality(f.acc).word)).addTo(map);\n });",
        " const f = PN[k], ref = fixParse(k).ref; if (ref === a.key || !f || f.lat == null || (f.master && approvedAround1095.has(ref))) return;\n new gl.Marker({color: '#8a9096', scale: 0.6}).setLngLat([f.lon, f.lat])\n.setPopup(new gl.Popup({offset: 14, closeButton: false}).setText(fixLabel(k) + (f.master ? ' — master plan position, not a site measurement' : ' — recorded by ' + (f.by || 'somebody') + ', ' + fixQuality(f.acc).word))).addTo(map);\n });\n approvedAround1095.forEach((p, ref) => {\n if (ref === a.key) return;\n new gl.Marker({color: '#8a9096', scale: 0.6}).setLngLat([p.place.lon, p.place.lat])\n.setPopup(new gl.Popup({offset: 14, closeButton: false}).setText(ref + ' — Andrew’s pin · reference location')).addTo(map);\n });")
    text = replace_once(text,
        " const t = navTargetFor(a);\nif (t && t.pinned && t.fix && t.fix.master && locSrc782(a && a.key))",
        " const t = navTargetFor(a);\n if (t && t.andrew) return 'Opens your maps app with driving directions to Andrew’s saved pin for ' + a.key + '. This is the reference destination; individual units may have separate positions.';\nif (t && t.pinned && t.fix && t.fix.master && locSrc782(a && a.key))")
    return text
