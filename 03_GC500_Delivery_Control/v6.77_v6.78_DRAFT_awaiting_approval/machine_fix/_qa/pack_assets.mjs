// v5.86 asset packing (M3). Input: the live (v5.85) coates-23.glb and studio.hdr. Output, in the machine set:
//   assets/machine/coates-23.glb         the same model, geometry in EXT_meshopt_compression (lossless: vertex codec on the
//                                        float data as it is, index codec on the triangles; no quantisation, no filters)
//   assets/machine/coates-23.glb.gz.bin  that file gzipped (the page unpacks it with DecompressionStream)
//   assets/machine/studio.hdr.gz.bin     studio.hdr gzipped, byte-identical once unpacked
// Then it decodes everything back with the shipped decoder and proves every attribute byte-identical and every triangle
// the same (same three vertices, same winding). Run: node pack_assets.mjs <live dir> <out dir>   (needs `npm i meshoptimizer@1.3.0`)
import {MeshoptEncoder as E, MeshoptDecoder as D} from 'meshoptimizer';
import fs from 'fs'; import zlib from 'zlib'; import path from 'path';
const [src, out] = process.argv.slice(2); await E.ready; await D.ready;
const b = fs.readFileSync(path.join(src, 'assets/machine/coates-23.glb'));
const jl = b.readUInt32LE(12), j = JSON.parse(b.slice(20, 20 + jl)), bin = b.subarray(20 + jl + 8, 20 + jl + 8 + b.readUInt32LE(20 + jl));
const byView = new Map(j.accessors.map(a => [a.bufferView, a]));
const chunks = []; let off = 0; const pad4 = n => (n + 3) & ~3;
const views = j.bufferViews.map((v, i) => {
  const a = byView.get(i), data = bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength);
  if (!a) { const o = off; chunks.push(data, Buffer.alloc(pad4(data.length) - data.length)); off += pad4(data.length); return {...v, buffer: 0, byteOffset: o}; }   /* the artwork PNG: stored as it is */
  const size = {SCALAR: 1, VEC2: 2, VEC3: 3}[a.type] * 4, mode = a.type === 'SCALAR' ? 'TRIANGLES' : 'ATTRIBUTES';
  if (a.type === 'SCALAR' && a.componentType !== 5125) throw Error('indices expected as uint32');
  const enc = Buffer.from(E.encodeGltfBuffer(new Uint8Array(data), a.count, size, mode)), o = off;
  chunks.push(enc, Buffer.alloc(pad4(enc.length) - enc.length)); off += pad4(enc.length);
  return {buffer: 1, byteOffset: v.byteOffset || 0, byteLength: v.byteLength, ...(v.target ? {target: v.target} : {}),
    extensions: {EXT_meshopt_compression: {buffer: 0, byteOffset: o, byteLength: enc.length, byteStride: size, count: a.count, mode}}};
});
const nj = {...j, extensionsUsed: [...(j.extensionsUsed || []), 'EXT_meshopt_compression'], extensionsRequired: [...(j.extensionsRequired || []), 'EXT_meshopt_compression'],
  buffers: [{byteLength: off}, {byteLength: bin.length, extensions: {EXT_meshopt_compression: {fallback: true}}}], bufferViews: views};
let js = Buffer.from(JSON.stringify(nj)); js = Buffer.concat([js, Buffer.alloc(pad4(js.length) - js.length, 0x20)]);
const body = Buffer.concat(chunks), head = Buffer.alloc(12), jh = Buffer.alloc(8), bh = Buffer.alloc(8);
head.writeUInt32LE(0x46546c67, 0); head.writeUInt32LE(2, 4); head.writeUInt32LE(12 + 8 + js.length + 8 + body.length, 8);
jh.writeUInt32LE(js.length, 0); jh.writeUInt32LE(0x4e4f534a, 4); bh.writeUInt32LE(body.length, 0); bh.writeUInt32LE(0x004e4942, 4);
const glb = Buffer.concat([head, jh, js, bh, body]);
// round trip with the decoder the page ships
let attrs = 0, tris = 0;
nj.bufferViews.forEach((v, i) => { const x = v.extensions && v.extensions.EXT_meshopt_compression; if (!x) return;
  const t = new Uint8Array(x.count * x.byteStride); D.decodeGltfBuffer(t, x.count, x.byteStride, body.subarray(x.byteOffset, x.byteOffset + x.byteLength), x.mode);
  const o = bin.subarray(v.byteOffset, v.byteOffset + v.byteLength);
  if (x.mode === 'ATTRIBUTES') { if (Buffer.compare(Buffer.from(t), o) !== 0) throw Error('attribute view ' + i + ' differs'); attrs++; }
  else { const A = new Uint32Array(t.buffer), B = new Uint32Array(o.buffer.slice(o.byteOffset, o.byteOffset + o.byteLength));
    const key = (a, b, c) => { const m = Math.min(a, b, c); return m === a ? [a, b, c] : m === b ? [b, c, a] : [c, a, b]; };   /* same triangle, same winding, any rotation */
    for (let k = 0; k < A.length; k += 3) { const p = key(A[k], A[k + 1], A[k + 2]), q = key(B[k], B[k + 1], B[k + 2]); if (p[0] !== q[0] || p[1] !== q[1] || p[2] !== q[2]) throw Error('triangle ' + k / 3 + ' of view ' + i + ' differs'); }
    tris += A.length / 3; } });
const hdr = fs.readFileSync(path.join(src, 'assets/machine/studio.hdr'));
const gzGlb = zlib.gzipSync(glb, {level: 9}), gzHdr = zlib.gzipSync(hdr, {level: 9});
if (Buffer.compare(zlib.gunzipSync(gzHdr), hdr) || Buffer.compare(zlib.gunzipSync(gzGlb), glb)) throw Error('gzip round trip');
fs.writeFileSync(path.join(out, 'assets/machine/coates-23.glb'), glb);
fs.writeFileSync(path.join(out, 'assets/machine/coates-23.glb.gz.bin'), gzGlb);
fs.writeFileSync(path.join(out, 'assets/machine/studio.hdr.gz.bin'), gzHdr);
console.log(JSON.stringify({glbBefore: b.length, glbMeshopt: glb.length, glbMeshoptGz: gzGlb.length, hdrBefore: hdr.length, hdrGz: gzHdr.length, attributeViewsIdentical: attrs, trianglesIdentical: tris}));
