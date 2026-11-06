// packs the drawing's tile pyramid one file per level (assets/vt/L{L}.bin) so the hosted service, which keeps at most
// 600 files, can carry it; the manifest gains each tile's byte range; the viewer fetches a tile with a Range request.
const fs = require('fs'), path = require('path'); const VT = path.join(__dirname, 'explorer', 'assets', 'vt');
const m = JSON.parse(fs.readFileSync(path.join(VT, 'manifest.json'), 'utf8')); m.packed = true; let total = 0, count = 0;
for (const lv of m.levels) {
  const dir = path.join(VT, 'L' + lv.L), names = fs.readdirSync(dir).filter(n => n.endsWith('.webp')).sort(); const parts = [], idx = {}; let off = 0;
  for (const n of names) { const b = fs.readFileSync(path.join(dir, n)); idx[n.slice(0, -5)] = [off, b.length]; parts.push(b); off += b.length; }
  fs.writeFileSync(path.join(VT, 'L' + lv.L + '.bin'), Buffer.concat(parts)); lv.file = 'L' + lv.L + '.bin'; lv.bytes = off; lv.tiles = idx; total += off; count += names.length;
}
fs.writeFileSync(path.join(VT, 'manifest.json'), JSON.stringify(m)); console.log('packed', count, 'tiles', (total / 1048576).toFixed(1), 'MB in', m.levels.length, 'files; manifest', (fs.statSync(path.join(VT, 'manifest.json')).size / 1024).toFixed(0), 'KB');
