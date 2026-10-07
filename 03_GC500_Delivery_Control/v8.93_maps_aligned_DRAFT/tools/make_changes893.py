# Author: Andrew Fisher. v8.93: the change list patch_v893.py applies - the new master picture, the three inset pins back on
# their 17 Sep positions (the inset did not move on the paper), and the re-made pin pictures.
#   python3 make_changes893.py <v8.89 page html> <new sheet webp> <thumbs893.json> <pt overrides json> <media out dir> <out changes893.json>
import hashlib, json, re, shutil, sys
from pathlib import Path
PAGE, SHEET, THUMBS, OVER, MEDIA, OUT = sys.argv[1:7]
MEDIA = Path(MEDIA); MEDIA.mkdir(parents=True, exist_ok=True)
s = Path(PAGE).read_text()
D = json.loads(re.search(r'const DATA = (\{.*?\});\n', s).group(1))
m = re.search(r'(const|var|let)\s+MASTER_LOC\s*=\s*', s); ML, _ = json.JSONDecoder().raw_decode(s[m.end():])
d1 = next(x for x in D['sheets'] if x['key'] == 'D001'); prev = d1['src']['media']
assert prev.startswith('fa5081d4'), 'expects the v8.89 page (its D001 picture is fa5081d4...)'
data = Path(SHEET).read_bytes(); sha = hashlib.sha256(data).hexdigest()
shutil.copyfile(SHEET, MEDIA / (sha + '.webp'))
sheet = {'file': sha + '.webp', 'sha256': sha, 'type': 'image/webp', 'bytes': len(data), 'scope': 'view'}
T = json.load(open(THUMBS)); over = json.load(open(OVER))
changes = {}
for ref, pt in over.items():
    v = ML[ref]; assert v['pt'] != pt
    changes[ref] = {'pt': pt, 'pt_was': v['pt'], 'why': 'the inset did not move on the 2 Oct paper; back to the 17 Sep position (v8.89 had moved it 28 px with the main plan)'}
for ref, t in T['pins'].items():
    assert ML[ref].get('img') == t['old_img'], ref
    ch = changes.setdefault(ref, {}); ch['img'] = t['img']; ch['img_was'] = t['old_img']
media = [sheet] + T['media']
for x in T['media']: assert (MEDIA / x['file']).exists(), x['file']
out = {'author': 'Andrew Fisher', 'what': 'v8.93: every map on the 2 Oct master, aligned the same way everywhere',
       'pdf_sha256': '8753d875cf90682e09afefae8c774144d9e9725ece87f726707882fb3711c56d', 'frame_pdf_sha256': '37792f0a9d32e829f34d28ab41197fd2cf689fb62cd60a755aa89106cb5a0a2f',
       'previous_sheet_sha256': prev, 'sheet_media': sheet, 'media': media, 'master_loc': changes,
       'pictures_kept_from_17_sep': T['kept_17_sep_pictures'], 'pins_with_new_pictures': len(T['pins']),
       'inset_pins_back_to_17_sep': sorted(over)}
Path(OUT).write_text(json.dumps(out, ensure_ascii=False, indent=1))
print('sheet', sha[:12], len(data), 'bytes | media', len(media), '| pins changed', len(changes), '| inset back:', sorted(over), '| kept 17 Sep pictures:', T['kept_17_sep_pictures'])
