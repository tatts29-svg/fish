"""Author: Andrew Fisher. v11.71 - the two McAvoys spelt the same.

Andrew, 24 Oct 2026, on Hayden's record line reading "Mcavoy" beside Alonzo's "McAvoy" (v11.69): "Match them". Hayden's
name in DATA.team becomes "Hayden McAvoy", as the race call already says it and as Alonzo's is written. Nothing else in his
line changes (role, company, "added by the project manager on 8 Oct 2026"). It was the only "Mcavoy" on the page.
Footer -> v11.71. No record, broadcast, media, servicing, crew-card bundle, tracker or printed-code change.

    python3 patch_v1171.py page.html      (in place, on the live page after Codex's v11.70, or v11.69)
"""
import json, re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def patch(text, page_path):
    m = re.findall(r"\+' · (v11\.(?:69|70))'; /\* v8\.19 release922", text)
    if len(m) != 1: raise ValueError('v11.71 is built on the live v11.70 (or v11.69) page')
    base = m[0]
    i = text.find('const DATA = '); j = text.find('\n', i); line = text[i:j]
    obj = json.loads(line[len('const DATA = '):-1])
    if json.dumps(obj, ensure_ascii=False, separators=(',', ':')) != line[len('const DATA = '):-1]: raise ValueError('DATA does not round-trip')
    if text.count('Mcavoy') != 1: raise ValueError('expected exactly one "Mcavoy" on the page, found %d' % text.count('Mcavoy'))
    fence = [p for p in obj['team']['people'] if p.get('group') == 'fencing']
    hits = [p for p in fence if p['name'] == 'Hayden Mcavoy']
    if len(hits) != 1 or len(fence) != 10 or fence[-1]['name'] != 'Alonzo McAvoy': raise ValueError('the fencing crew is not the ten of v11.69')
    hits[0]['name'] = 'Hayden McAvoy'
    text = text[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + text[j:]
    if 'Mcavoy' in text: raise ValueError('a "Mcavoy" is left')
    text = rep(text, "+' · %s'; /* v8.19 release922" % base, "+' · v11.71'; /* v8.19 release922", 'release footer', 'page')
    print('v11.71 on %s: Hayden Mcavoy -> Hayden McAvoy; fencing crew %d names' % (base, len(fence)))
    return text


if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text(encoding='utf-8'), page), encoding='utf-8')
