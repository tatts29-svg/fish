function tilesHtml(M, svg){
 const b = box(M, svg), z = satZoom(M, svg), span = 256 / Math.pow(2, z - 19);
 const cs = [toZ18(b.x, b.y), toZ18(b.x + b.w, b.y), toZ18(b.x, b.y + b.h), toZ18(b.x + b.w, b.y + b.h)];
 const xs = cs.map(c => c[0]), ys = cs.map(c => c[1]);
 const x0 = Math.floor(Math.min(...xs) / span), x1 = Math.floor(Math.max(...xs) / span), y0 = Math.floor(Math.min(...ys) / span), y1 = Math.floor(Math.max(...ys) / span); let h = '';
 if ((x1 - x0 + 1) * (y1 - y0 + 1) > 220) return {z: z, html: ''};
 for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) h += '<image href="' + SAT + z + '/' + ty + '/' + tx + '" x="' + (tx * span - SO[0]) + '" y="' + (ty * span - SO[1]) + '" width="' + span + '" height="' + span + '" preserveAspectRatio="none"/>';
 return {z: z, html: h};
}