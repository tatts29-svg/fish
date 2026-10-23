"""Author: Andrew Fisher. v11.54 - the Coates Event Labour Scope C004-26003-01 (23 Oct 2026) replaces the 2025 document
on the page: the 2026 access plan's times, the workbook's rate cells ($150.11 / $91.14) and its shifts, every line
reproduced by the page's own rules to the cent (scope2026.py checks the transcription against the workbook).

Andrew, 23 Oct 2026 12:35, with the workbook: "please analyse these costs and update where we need to this is what we charge
the v8'S".

What changes: DATA.event_scope only (the page's scope engine, the Customer rates & charges card, the P&L race line and the
text export all read it). The provisional caveat ("event labour times still to be updated") goes, because the 2026 access
plan is in. People $36,714.96 -> $37,642.87, accommodation and travel $19,101.60 unchanged, the race weekend charge
$55,816.56 -> $56,744.47 (+$927.91). No record change; the scope stays editable on the page as before. Footer v11.53 -> v11.54.

    python3 patch_v1154.py page.html      (in place, on the live v11.53 page)
"""
import hashlib, json, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()
SCOPE = json.loads((HERE / 'event_scope_2026.json').read_text(encoding='utf-8'))
KEY = '"event_scope":'


def find_object(text, start):
    """the JSON object that begins at text[start] == '{', string-aware"""
    depth = 0; j = start; q = False
    while j < len(text):
        ch = text[j]
        if q:
            if ch == '\\': j += 2; continue
            if ch == '"': q = False
        else:
            if ch == '"': q = True
            elif ch == '{': depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0: return j + 1
        j += 1
    raise ValueError('unterminated object')


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.54 requires the live v11.53 page ' + BASE_SHA256)
    if text.count(KEY + '{') != 1: raise ValueError('event_scope is not on the page once')
    i = text.index(KEY + '{') + len(KEY); j = find_object(text, i)
    old = json.loads(text[i:j])
    if old.get('document') != 'C004-25003-01 Coates Event Labour Scope' or old.get('schema') != SCOPE['schema']: raise ValueError('the page does not carry the 2025 scope: ' + str(old.get('document')))
    if SCOPE['document'] != 'C004-26003-01 Coates Event Labour Scope' or len(SCOPE['lines']) != 7 or [l['key'] for l in SCOPE['lines']] != [l['key'] for l in old['lines']]: raise ValueError('the 2026 transcription is not the seven lines of the 2025 one')
    for bad in ('Claude', 'Codex', 'GPT', 'Gemini'):
        if bad in json.dumps(SCOPE): raise ValueError('an agent name in the scope: ' + bad)
    new = json.dumps(SCOPE, separators=(',', ':'), ensure_ascii=True)
    text = text[:i] + new + text[j:]
    text = rep(text, "+' · v11.53'; /* v8.19 release922", "+' · v11.54'; /* v8.19 release922", 'release footer', 'page')
    for needle, n in [('C004-26003-01 Coates Event Labour Scope', 1), ('C004-25003-01', 0), ('"gc500-event-labour-scope-1"', 1), ('TO BE UPDATED OFF ACCESS PLAN', 0), ("+' · v11.54'; /* v8.19 release922", 1)]:
        if text.count(needle) != n: raise ValueError('v11.54 did not land cleanly: ' + needle + ' x' + str(text.count(needle)) + ' (expected ' + str(n) + ')')
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1154 applied: the 2026 Event Labour Scope on the page; footer v11.53 -> v11.54')
