#!/usr/bin/env python3
"""v5.97 - NO "ANDREW FISHER SAID" ON THE PAGE (Andrew Fisher, 25 Sep 2026: remove this info). The page said who
decided what and when in its own words — "(Andrew Fisher, 25 Sep 2026)", "Andrew Fisher's rule, 11 Sep 2026",
"Ask Andrew Fisher for the editing link". Those attributions are lifted from every string the page shows: the
dated parentheticals go, the dated prefixes go, and the name in prose becomes "the project manager". The record's
own facts are untouched: who recorded a docket, who levelled a building, who is on the workforce list, the
author credit in the footer. Code comments are left alone (nobody sees them). Applied to a built page."""
import re, sys, json
p = sys.argv[1]; s = open(p, encoding='utf-8-sig').read(); bom = open(p, encoding='utf-8').read(1) == '﻿'; n0 = len(s)
NAME = 'Andrew Fisher'
DATED = r"Andrew Fisher(?:'s)?,? ?(?:\(|—|–|-)? ?(?:\w{3} )?\d{1,2} \w{3} 2026"
def scrub_text(t):
    if NAME not in t: return t
    t = re.sub(r"\s*\((?:Andrew Fisher|Andrew Fisher's (?:rule|guide|word|instruction))(?:,)? \d{1,2} \w{3} 2026(?:: [^)]*)?\)", '', t)   # (Andrew Fisher, 25 Sep 2026) / (…: hours only)
    t = re.sub(r"\s*[—–-]\s*Andrew Fisher,? \d{1,2} \w{3} 2026\b\.?", '', t)                       # — Andrew Fisher, 25 Sep 2026
    t = re.sub(r"\bAndrew Fisher,? (?:\w{3} )?\d{1,2} \w{3} 2026:\s*", '', t)                        # Andrew Fisher, 18 Sep 2026: …
    t = re.sub(r"\b(?:confirmed|settled|approved|answered|stated|reported|recorded) by Andrew Fisher(?:,)? (?:on )?(\d{1,2} \w{3} 2026)", lambda m: m.group(0).split(' by ')[0] + ' ' + m.group(1), t)
    t = re.sub(r"\bAnswered — Andrew Fisher, \d{1,2} \w{3} 2026:", 'Answered:', t)
    t = re.sub(r"\bAndrew Fisher's (rule|guide|word|instructions?|request|tracker|labour|TomTom account|own hand)(?: of \d{1,2} \w{3} 2026| \(\d{1,2} \w{3} 2026\)|, \d{1,2} \w{3} 2026)?", lambda m: {'rule': 'the site rule', 'guide': 'the branch guide', 'word': 'the instruction', 'instruction': 'the instruction', 'instructions': 'the instructions', 'request': 'request', 'tracker': 'the tracker', 'labour': 'the labour', 'TomTom account': 'the TomTom account', 'own hand': 'the hand on the plan'}[m.group(1)], t)
    t = re.sub(r"\bAndrew Fisher's\b", "the project manager's", t)
    t = re.sub(r"\bAndrew Fisher\b", 'the project manager', t)
    t = re.sub(r"\bthe the\b", 'the', t); t = re.sub(r"  +", ' ', t); t = t.replace(' .', '.').replace(' ,', ',')
    return t
# 1. the page's code: only string and template text, never comments; the author-credit fallbacks are kept
KEEP = re.compile(r"(DATA\.brand\.author \|\| )'Andrew Fisher'")
def scrub_code(js):
    js = KEEP.sub(r"\1'§AUTHOR§'", js).replace('Author: Andrew Fisher', 'Author: §AUTHOR§')
    return scrub_text(js).replace('§AUTHOR§', 'Andrew Fisher')
def scrub_code_old(js):
    js = KEEP.sub(r"\1'§AUTHOR§'", js)
    out = []; i = 0; n = len(js); state = None
    while i < n:
        c = js[i]
        if state is None:
            if js.startswith('/*', i): j = js.find('*/', i + 2); j = n if j < 0 else j + 2; out.append(js[i:j]); i = j; continue
            if js.startswith('//', i): j = js.find('\n', i); j = n if j < 0 else j; out.append(js[i:j]); i = j; continue
            if c in '\'"`': state = c; start = i; i += 1; continue
            out.append(c); i += 1; continue
        # inside a string or template: find its end, honouring escapes
        j = i
        while j < n:
            if js[j] == '\\': j += 2; continue
            if js[j] == state: break
            if state != '`' and js[j] == '\n': break
            j += 1
        seg = js[start:j + 1]
        out.append(scrub_text(seg) if NAME in seg else seg); i = j + 1; state = None
    return ''.join(out).replace('§AUTHOR§', 'Andrew Fisher')
# 2. the record data: narrative fields only; the who-fields stay
PERSON_KEYS = {'footer', 'recorded_by', 'by', 'person', 'supplied_by', 'done_by', 'stated_by', 'signed_by', 'settled_by', 'levelled_by', 'said_by', 'name', 'author', 'chosen_by', 'confirmed_by', 'steps_by', 'date_by', 'out_by', 'people', 'given_by', 'taken_by', 'updated_by', 'created_by', 'found_by', 'default_by', 'shape_by', 'end_by', 'who', 'operator', 'reporter', 'moved_by', 'set_by'}
def scrub_data(o, key=None):
    if isinstance(o, dict): return {k: scrub_data(v, k) for k, v in o.items()}
    if isinstance(o, list): return [scrub_data(v, key) for v in o]
    if isinstance(o, str) and NAME in o and key not in PERSON_KEYS: return scrub_text(o)
    return o
def scrub_script(js):
    m = re.search(r'^const DATA = (\{.*\});?$', js, re.M)
    if m:
        D = json.loads(m.group(1)); D2 = scrub_data(D); data = json.dumps(D2, ensure_ascii=False, separators=(',', ':'))
        return scrub_code(js[:m.start(1)]) + data + scrub_code(js[m.end(1):])
    return scrub_code(js)
parts = re.split(r'(<script(?![^>]*type="application/json")[^>]*>)([\s\S]*?)(</script>)', s)
# re.split with 3 groups yields [text, open, body, close, text, ...]
for k in range(2, len(parts), 4): parts[k] = scrub_script(parts[k])
s2 = ''.join(parts)
# 3. anything left in plain HTML outside scripts and styles (not comments)
def scrub_html(h):
    return re.sub(r'(?<!<!--)([^<>]*?)Andrew Fisher', lambda m: m.group(0) if 'Author:' in m.group(0) else scrub_text(m.group(0)), h)
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s2)
# report what is left where a reader could see it
scripts = [m.group(1) for m in re.finditer(r'<script(?![^>]*type="application/json")[^>]*>([\s\S]*?)</script>', s2)]
left = 0
for js in scripts:
    for line in js.split('\n'):
        if len(line) < 20000 and NAME in line: left += line.count(NAME); print('LEFT:', line.strip()[:200])
print('scrubbed', p, n0, '->', len(s2), '| visible code mentions left:', left)
