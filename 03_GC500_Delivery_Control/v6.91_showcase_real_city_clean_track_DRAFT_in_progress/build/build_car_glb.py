#!/usr/bin/env python3
"""The #26 race car, out of the show scene's own model, as one binary glTF (car26.glb) for the real-city showcase.
   Geometry, normals and UVs are the scene's own (GC3D.raceCarModel('high') and raceCarDecals), unchanged.
   - Body parts carry _KIND (the scene's material kind) and _PANEL, so the page can paint the livery with the
     scene's own rules (ported shader), not an approximation.
   - The four wheels are their own nodes, centred on their hubs, so the page can turn them.
   - The lettering (Coates, INDUSTRIAL SOLUTIONS, 26, Fisher) is the scene's typeset atlas as an alpha mask.
   Model units are the scene's car units; the root node scales them to metres (carS x metres per key-plan point)."""
import json, struct, sys, zlib, io, math
from PIL import Image
d = json.load(open(sys.argv[1])); out = sys.argv[2]
M_PER_UNIT = d['carS'] * 5.937552372855356
MATS = {'paint': ([.020, .026, .033], .26, .035, 1), 'glass': ([.012, .035, .055], .13, .05, 2), 'rubber': ([.018, .021, .024], .84, 0, 3),
        'alloy': ([.12, .14, .16], .36, .78, 4), 'carbon': ([.009, .012, .014], .43, .08, 5), 'grille': ([.012, .014, .016], .62, .25, 5),
        'lampWhite': ([1, 1, 1], .22, 0, 6), 'lampRed': ([.8, .01, .003], .22, 0, 7), 'interior': ([.025, .028, .033], .86, 0, 3), 'decal': ([.93, .95, .96], .4, 0, 8)}
bin_ = bytearray(); views = []; accessors = []
def pad():
    while len(bin_) % 4: bin_.append(0)
def add_view(b, target=None):
    pad(); o = len(bin_); bin_.extend(b); v = {'buffer': 0, 'byteOffset': o, 'byteLength': len(b)}
    if target: v['target'] = target
    views.append(v); return len(views) - 1
def acc(arr, comps, ctype=5126, target=34962, minmax=False):
    fmt = {5126: 'f', 5125: 'I'}[ctype]; b = struct.pack('<%d%s' % (len(arr), fmt), *arr); vi = add_view(b, target)
    a = {'bufferView': vi, 'componentType': ctype, 'count': len(arr) // comps, 'type': {1: 'SCALAR', 2: 'VEC2', 3: 'VEC3'}[comps]}
    if minmax: a['min'] = [min(arr[i::comps]) for i in range(comps)]; a['max'] = [max(arr[i::comps]) for i in range(comps)]
    accessors.append(a); return len(accessors) - 1
materials = []; matidx = {}
def material(name, color=None):
    key = (name, tuple(color or []))
    if key in matidx: return matidx[key]
    base, rough, metal, kind = MATS[name]; c = color or base
    m = {'name': name, 'pbrMetallicRoughness': {'baseColorFactor': [c[0], c[1], c[2], 1], 'roughnessFactor': rough, 'metallicFactor': metal}, 'doubleSided': name in ('glass', 'decal')}
    if name == 'glass': m['alphaMode'] = 'BLEND'; m['pbrMetallicRoughness']['baseColorFactor'][3] = .72
    if name == 'decal': m['alphaMode'] = 'MASK'; m['alphaCutoff'] = .35; m['pbrMetallicRoughness']['baseColorTexture'] = {'index': 0}
    if name in ('lampWhite', 'lampRed'): m['emissiveFactor'] = [1, 1, 1] if name == 'lampWhite' else [.8, .02, .01]
    materials.append(m); matidx[key] = len(materials) - 1; return matidx[key]
def prim(p, centre=(0, 0, 0)):
    v = p['v']; n = len(v) // 8; pos = []; nor = []; uv = []
    for i in range(n):
        x, y, z, nx, ny, nz, u, w = v[i * 8:i * 8 + 8]; pos += [x - centre[0], y - centre[1], z - centre[2]]; nor += [nx, ny, nz]; uv += [u, w]
    kind = MATS[p['material']][3]; panel = 2 if p['name'] == 'wing-endplates' else 1 if p['name'] == 'roof-and-pillars' else 0
    attrs = {'POSITION': acc(pos, 3, minmax=True), 'NORMAL': acc(nor, 3), 'TEXCOORD_0': acc(uv, 2), '_KIND': acc([float(kind)] * n, 1), '_PANEL': acc([float(panel)] * n, 1)}
    return {'attributes': attrs, 'indices': acc(p['i'], 1, 5125, 34963), 'material': material(p['material'], p.get('color'))}
body = [p for p in d['parts'] if not p['wheel']] + [dict(p, material='decal') for p in d['dec']]
meshes = [{'name': 'body', 'primitives': [prim(p) for p in body]}]
nodes = [{'name': 'car26', 'scale': [M_PER_UNIT] * 3, 'children': [1]}, {'name': 'body', 'mesh': 0}]
for corner in ('front-left', 'front-right', 'rear-left', 'rear-right'):
    ps = [p for p in d['parts'] if p['wheel'] and p['name'].startswith(corner)]; w = ps[0]['wheel']; c = (w['x'], w['y'], w['z'])
    meshes.append({'name': corner + '-wheel', 'primitives': [prim(p, c) for p in ps]})
    nodes.append({'name': corner + '-wheel', 'mesh': len(meshes) - 1, 'translation': list(c)}); nodes[0]['children'].append(len(nodes) - 1)
# the lettering: the scene's R8 atlas as the alpha of a white texture (the decal's own colour tints it)
a = d['atlas']; im = Image.new('LA', (a['w'], a['h'])); im.putdata([(255, x) for x in a['data']]); im = im.convert('RGBA')
bio = io.BytesIO(); im.save(bio, 'PNG', optimize=True); iv = add_view(bio.getvalue())
g = {'asset': {'version': '2.0', 'generator': 'GC500 build_car_glb.py (from the show scene\'s own race car)', 'copyright': 'Original model, Coates Industrial Solutions GC500 show scene'},
     'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': nodes, 'meshes': meshes, 'materials': materials, 'accessors': accessors, 'bufferViews': views,
     'images': [{'bufferView': iv, 'mimeType': 'image/png'}], 'samplers': [{'magFilter': 9729, 'minFilter': 9987, 'wrapS': 33071, 'wrapT': 33071}], 'textures': [{'source': 0, 'sampler': 0}],
     'extras': {'metresPerUnit': M_PER_UNIT, 'axes': 'x forward, y up, z right (scene car axes)'}}
pad(); g['buffers'] = [{'byteLength': len(bin_)}]
js = json.dumps(g, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
glb = struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(js) + 8 + len(bin_)) + struct.pack('<II', len(js), 0x4E4F534A) + js + struct.pack('<II', len(bin_), 0x004E4942) + bytes(bin_)
open(out, 'wb').write(glb); print('glb', len(glb), 'bytes', 'm/unit', round(M_PER_UNIT, 4), 'prims', sum(len(m['primitives']) for m in meshes))
