function toZ18(x, y){ const A = GEO.A; return [A[0][0] * x + A[0][1] * y + A[0][2], A[1][0] * x + A[1][1] * y + A[1][2]]; }
/* Keep SVG positions near the site; absolute world coordinates exceed native layout precision. */
const SO1245 = (() => { const o = toZ18(GEO.main[0], GEO.main[1]); return [Math.floor(o[0]), Math.floor(o[1])]; })();
function satTiles(svg){
 const b = box(svg), z = satZoom(svg), span = 256 / Math.pow(2, z - 19);
 const cs = [toZ18(b.x, b.y), toZ18(b.x + b.w, b.y), toZ18(b.x, b.y + b.h), toZ18(b.x + b.w, b.y + b.h)];
 const xs = cs.map(c => c[0]), ys = cs.map(c => c[1]);
 const x0 = Math.floor(Math.min(...xs) / span), x1 = Math.floor(Math.max(...xs) / span), y0 = Math.floor(Math.min(...ys) / span), y1 = Math.floor(Math.max(...ys) / span), out = [];
 if ((x1 - x0 + 1) * (y1 - y0 + 1) > 120) return {z: z, tiles: out};
 for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) out.push({z: z, tx: tx, ty: ty, x: tx * span - SO1245[0], y: ty * span - SO1245[1], span: span, url: SAT + z + '/' + ty + '/' + tx});
 return {z: z, tiles: out};
}
