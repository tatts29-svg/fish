#!/usr/bin/env python3
# Author: Andrew Fisher. v9.00 part A - the fencing crew: one name added.
#
# Andrew, 8 Oct 2026 about 11:15 AEST, asked to add a new member to the fencing team. He joins the page's fencing crew
# group (Advanced Temporary Fencing), after the eight names from the crew's sign-on sheet of 17 Sep 2026, with only his
# name and company: the role every crew member on the sheet carries ("Fencing crew") and nothing else - no title, number
# or email, because none was given. The name never enters git: it reaches the build as the private input V900_TEAM, bound
# here by SHA-256, and every check reads it from there.
#
# What changes:
#  - DATA.team.people: the input's person, inserted straight after the last fencing person (so the sheet's eight keep the
#    sheet's order and the new name comes last), with exactly the keys every other person has, in their order;
#  - DATA.team.groups (fencing).note and DATA.team.note: they said "the eight names"; they now also say one was added by
#    the project manager on 8 Oct 2026 and how it came (the date is the input's added_on);
#  - the showcase's "Meet the fencing crew" scene: its cards were laid out for eight (four across, two rows - "never five
#    and three"); the column count now comes from the crew (fencingCols900: full, even rows - nine go three by three), and
#    its fine print, which counted every name as "as the crew's sign-on sheet reads", now counts the sheet's names and the
#    names added since separately (fencingCrewWords900, read from each person's record line).
# Everything else that shows or counts the fencing crew reads DATA.team and follows by itself: the About tab's team card
# (the fencing group), the Coates Way People pillar ("Contacts on the record"), the showcase's "The work behind it"
# ("people across the two crews"), Today's "Who to call" count. Not touched: the install team, the Coates groups, the
# pre-start contacts (they carry the site, install and office people with a number only), the org chart (Coates only),
# the race call (part B), money, the record, every pin, MASTER_LOC and every marker.
#
#   V900_TEAM=<private input> toolchain/build.sh v900_x v9.00_crew_vms_counts_DRAFT/patch_v900_crew.py [the other v9.00 parts]
import copy, hashlib, json, os, re, sys
from datetime import date
from pathlib import Path
here = Path(__file__).resolve().parent
sys.path.insert(0, str(here.parent / 'toolchain'))
from rep import rep

TEAM_SHA = 'ee576e40d18d144038d3e0eefe0b1013042c72e05f47d51fff20888def84154a'   # private input, 8 Oct 2026
SHEET = 8                       # the names on the crew's sign-on sheet, 17 Sep 2026
ADDED = re.compile(r'\badded by the project manager on (\d{1,2} [A-Z][a-z]{2} \d{4})\b')   # the page reads the same words (JS below)

p = Path(sys.argv[1]); raw = p.read_bytes(); bom = raw.startswith(b'\xef\xbb\xbf'); s = raw.decode('utf-8-sig')


def bound(env, sha):
    q = Path(os.environ.get(env) or '')
    if not q.is_file(): sys.exit(f'{env} must name the private input (SHA-256 {sha[:16]}...)')
    b = q.read_bytes(); got = hashlib.sha256(b).hexdigest()
    if got != sha: sys.exit(f'{env}: checksum mismatch ({got[:16]}...)')
    return b


# ---- the input: one person for the fencing crew, nothing filled in
IN = json.loads(bound('V900_TEAM', TEAM_SHA).decode('utf-8'))
P = IN['person']; NAME = P.get('name') or ''
assert re.fullmatch(r"[A-Z][A-Za-z'\-]+(?: [A-Z][A-Za-z'\-]+)+", NAME), 'the name must be a plain given name and surname'
assert P.get('group') == 'fencing' and P.get('company') == 'Advanced Temporary Fencing' and P.get('event_role') == 'Fencing crew', \
    'the input must be a member of the fencing crew, Advanced Temporary Fencing, role Fencing crew'
for k in ('title', 'lead', 'location', 'reports_to', 'phone', 'mobile', 'email'):
    assert P.get(k) is None, f'the input carries a {k}; nothing beyond the name and company was given'
ON = date.fromisoformat(IN['added_on']); ON_WORDS = f'{ON.day} {ON.strftime("%b")} {ON.year}'
assert ON_WORDS == '8 Oct 2026', ON_WORDS
m = ADDED.search(P.get('about') or '')
assert m and m.group(1) == ON_WORDS, 'the record line must say "added by the project manager on ' + ON_WORDS + '" so the page can count it'
assert 'Andrew Fisher' not in json.dumps(P, ensure_ascii=False), 'the page says "the project manager" (v5.97)'
assert not re.search(r'@|\$|\d{4} ?\d{3} ?\d{3}', json.dumps(P, ensure_ascii=False)), 'no email, money or number goes on the page'

# ---- the base: one DATA line that round-trips; the live v8.99 footer; not applied already
assert s.count('const DATA = ') == 1, 'expected one DATA declaration'
i = s.find('const DATA = '); j = s.find('\n', i); line = s[i:j]; assert line.endswith(';'), 'DATA must be one line ending ;'
body = line[len('const DATA = '):-1]
D = json.loads(body); ORIG = copy.deepcopy(D)
assert json.dumps(D, ensure_ascii=False, separators=(',', ':')) == body, 'DATA does not round-trip - stopping'
T = D['team']; PEOPLE = T['people']
if any(x.get('name') == NAME for x in PEOPLE) or 'function fencingCols900' in s:
    sys.exit('v9.00 crew part already applied')
assert re.findall(r" · v\d+\.\d+'; /\* v8\.19", s) == [" · v8.99'; /* v8.19"], 'the base must be live v8.99 (footer " · v8.99")'
FEN = [n for n, x in enumerate(PEOPLE) if x.get('group') == 'fencing']
assert len(FEN) == SHEET and FEN == list(range(FEN[0], FEN[0] + SHEET)), 'the base must carry the sheet\'s eight, together'
INSTALL = [x for x in PEOPLE if x.get('group') == 'install']
KEYS = list(PEOPLE[FEN[-1]].keys())
assert all(list(x.keys()) == KEYS for x in PEOPLE), 'every person carries the same keys in the same order'
assert set(P) == set(KEYS), f'the input must carry exactly the keys every person has: {sorted(set(P) ^ set(KEYS))}'
assert not any(ADDED.search(x.get('about') or '') for x in PEOPLE if x.get('group') == 'fencing'), 'no fencing person reads as added yet'

# ---- 1. the person, straight after the last fencing person
NEW = {k: P[k] for k in KEYS}
PEOPLE.insert(FEN[-1] + 1, NEW)

# ---- 2. the notes stay true: the sheet's eight, and one added by the project manager on 8 Oct 2026
G = [g for g in T['groups'] if g['key'] == 'fencing']; assert len(G) == 1
OLD_G = 'so none is written for the seven; Wayne Woods keeps the email iEDM’s schedule email gave for him.'
assert G[0]['note'].count(OLD_G) == 1 and G[0]['note'].endswith(OLD_G), 'the fencing group note is not as found'
G[0]['note'] = G[0]['note'][:-len(OLD_G)] + (
    'so none is written for the other seven on the sheet; Wayne Woods keeps the email iEDM’s schedule email gave for him. '
    f'Nine names since {ON_WORDS}: the sheet’s eight, in its order, and one added by the project manager on {ON_WORDS}, '
    'listed last, as Fencing crew with the company — no other role, title, number or email was given, so none is written.')
OLD_T = ('The eight names and the company are as the sheet reads, in the sheet’s order; Wayne Woods is marked supervisor on it; '
         'no other role, title, number or email is on the sheet, so none is written.')
assert T['note'].count(OLD_T) == 1, 'DATA.team.note is not as found'
T['note'] = T['note'].replace(OLD_T, OLD_T + (
    f' One more name was added to the fencing crew by the project manager on {ON_WORDS}; it comes after the sheet’s eight, '
    'as Fencing crew with the company, and no other role, title, number or email was given, so none is written.'))
assert 'eight names' not in G[0]['note'].replace('the sheet’s eight', '')

# ---- the proof: nothing else in DATA moved
CHK = copy.deepcopy(D)
CHK['team']['people'].pop(FEN[-1] + 1)
CHK['team']['groups'] = ORIG['team']['groups'] if [g for g in CHK['team']['groups'] if g['key'] != 'fencing'] == \
    [g for g in ORIG['team']['groups'] if g['key'] != 'fencing'] else None
CHK['team']['note'] = ORIG['team']['note'] if T['note'].startswith(ORIG['team']['note'].split(OLD_T)[0]) and \
    T['note'].endswith(ORIG['team']['note'].split(OLD_T)[1]) else None
assert CHK == ORIG, 'DATA changed beyond the one person and the two notes - stopping'
assert [x for x in PEOPLE if x.get('group') == 'install'] == INSTALL
assert [x['name'] for x in PEOPLE if x.get('group') == 'fencing'][-1] == NAME and sum(x.get('group') == 'fencing' for x in PEOPLE) == SHEET + 1
assert json.dumps(D, ensure_ascii=False).count(NAME) == 1, 'the name sits once in DATA (the race call is part B)'
s = s[:i] + 'const DATA = ' + json.dumps(D, ensure_ascii=False, separators=(',', ':')) + ';' + s[j:]

# ---- 3. the showcase's fencing crew scene: the cards' columns and the fine print follow the crew
s = rep(s, "/* the fencing crew's eight cards: four across, two rows, on any screen wide enough — never five and three */\n"
           "@media (min-width:1000px){ .shcards.crew8{grid-template-columns:repeat(4,minmax(0,1fr))} }",
        "/* the fencing crew's cards in full, even rows on any screen wide enough — eight went four across in two rows, never\n"
        "   five and three; v9.00: the scene sets the columns from the crew itself (fencingCols900), so nine go three by three */\n"
        "@media (min-width:1000px){ .shcards.crewfence{grid-template-columns:repeat(var(--cols,4),minmax(0,1fr))} }",
        'fencing crew card columns (css)', str(p))
s = rep(s, '<ul class="shcards crew8" style="--cols:4">',
        '<ul class="shcards crewfence" style="--cols:${fencingCols900(ppl.length)}">', 'fencing crew card columns (scene)', str(p))
s = rep(s, "+ ' ' + fmtNum(ppl.length) + ' names, as the crew’s sign-on sheet reads, in its order, from the project record — "
           "the sheet carries no titles or numbers, so none are shown.')}`;",
        "+ ' ' + fencingCrewWords900(ppl))}`;", 'fencing crew fine print', str(p))
assert 'crew8' not in s, 'crew8 is still somewhere on the page'

JS = r"""<script id="crew900-script">
/* Author: Andrew Fisher. v9.00 - the fencing crew is nine: the eight names off the crew's sign-on sheet (17 Sep 2026) and
   one added by the project manager on 8 Oct 2026. Who was added, and when, is read from each person's own record line
   ("added by the project manager on <date>"); everyone else in the group is off the sheet. Nothing is counted here that
   the record does not hold, and the fencing crew is never added to the install team or a Coates group. */
const FENCING_ADDED900 = /\badded by the project manager on (\d{1,2} [A-Z][a-z]{2} \d{4})\b/;
function fencingAdded900(p){ const m = FENCING_ADDED900.exec(String((p && p.about) || '')); return m ? m[1] : ''; }
/* the cards in full, even rows: four across when that fills them (eight went four by two), else three, else five;
   four across when nothing fills them evenly. A phone keeps its own one or two columns (the stylesheet's). */
function fencingCols900(n){
 n = Math.max(0, Number(n) || 0);
 if (n <= 4) return Math.max(1, n);
 let best = 4, gap = (4 - n % 4) % 4;
 for (const c of [3, 5]) { const g = (c - n % c) % c; if (g < gap) { best = c; gap = g; } }
 return best;
}
/* the scene's fine print: the sheet's names and the names added since, counted apart */
function fencingCrewWords900(ppl){
 ppl = ppl || [];
 const added = ppl.filter(p => fencingAdded900(p)), sheet = ppl.length - added.length;
 if (!added.length) return fmtNum(ppl.length) + ' names, as the crew’s sign-on sheet reads, in its order, from the project record — the sheet carries no titles or numbers, so none are shown.';
 const days = [...new Set(added.map(fencingAdded900))];
 return fmtNum(ppl.length) + ' names from the project record: the ' + fmtNum(sheet) + ' the crew’s sign-on sheet reads, in its order, and '
  + fmtNum(added.length) + ' added by the project manager on ' + days.join(' and ') + ', after them. The sheet carries no titles or numbers, and none '
  + (added.length === 1 ? 'was' : 'were') + ' given for the name' + (added.length === 1 ? '' : 's') + ' added, so none are shown.';
}
</script>
"""
k = s.rfind('</body>'); assert k > 0 and s[k:].strip() == '</body></html>', 'the page must end </body></html>'
s = s[:k] + JS + s[k:]
open(p, 'w', encoding='utf-8').write(('﻿' if bom else '') + s)
print(f'v9.00 crew: fencing crew {SHEET} -> {SHEET + 1} (new name last, {ON_WORDS}); people {len(PEOPLE) - 1} -> {len(PEOPLE)}; '
      f'install {len(INSTALL)} unchanged; 2 notes, 3 page edits, 1 script')
