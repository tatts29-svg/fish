"""Author: Andrew Fisher. The generator labour at 1.5 h in and 1.5 h out per generator (3 h each), from the record as read.

Andrew, 31 Oct 2026 (this chat): "Lets go 1.5 hrs for generator so total for each we can allocate 3 hrs. If aaron is not on
that day we use alfie" / "Lets allocate 3 hrs to each use alfie or if no alfie use daniel. This is is labour to install and
demob this is the labour charge why should kinp get the lot. Other branches need that share".

Replaces this morning's one hour per generator move (record_31Oct2026_kinp_generator_labour/) on the same rows, so the hours
noted against the generator's contract and branch are 1.5 per generator per move. The person is the first of the three he
named, in his order, on the roster that day with room in the day:
  - the first person named was on every generator day but Friday 30 Oct (Andrew: "Aaron didnt work friday"), where GN01's
    demob goes to the second (on 06:30-17:00);
  - Monday 26 Oct: the first person's 11 h already carries 4 h on the water barriers, so five demobs at 1.5 h (7.5 h) do not
    fit; four stay (6 h) and the fifth, GN13 (the last to leave, 13:02), goes to the second (on 06:00-17:00);
  - the third person named was not needed on any day;
  - the concert pair (GN?, two 200 kVA units on 9994954 KINP) is two generators: 3 h in, on KINP, where it was.
No hours, starts or finishes change; only the notes. Each op carries the note as read (from_note) and the runner refuses
to write a row whose note has changed since.

    python3 make_spec.py <state.json>      writes gen3h_spec.json beside this script
"""
import json, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASIS = ("Andrew Fisher, 31 Oct 2026 (this chat): 'Lets go 1.5 hrs for generator so total for each we can allocate 3 hrs. "
         "If aaron is not on that day we use alfie' and 'Lets allocate 3 hrs to each use alfie or if no alfie use daniel. "
         "This is is labour to install and demob this is the labour charge why should kinp get the lot. Other branches need "
         "that share'. Each generator 1.5 h on the day it came on site and 1.5 h on the day it left, against its contract "
         "and branch, on the first of Aaron, Alfie, Daniel rostered that day with room in the day; replaces this morning's "
         "one hour per move. Notes only: no hours, starts or finishes change.")
G = 'Generators 9961976 NVAC'
AARON, ALFIE = 'Aaron Zelvis', 'Alfie Harris'

# (person, day, the words as they read now, the words they become, why)
CHANGES = [
    (AARON, '2026-09-28', G + ' · 1 h · GN01 mob', G + ' · 1.5 h · GN01 mob', 'GN01 in, 1.5 h'),
    (AARON, '2026-09-30', G + ' · 1 h · GN20-A mob · ' + G + ' · 2 h · GN21 mob, GN23 mob',
     G + ' · 4.5 h · GN20-A mob, GN21 mob, GN23 mob', 'GN20-A, GN21 and GN23 in, 1.5 h each'),
    (AARON, '2026-10-01', G + ' · 1 h · GN03 mob', G + ' · 1.5 h · GN03 mob', 'GN03 in, 1.5 h'),
    (AARON, '2026-10-07', G + ' · 1 h · GN18 mob', G + ' · 1.5 h · GN18 mob', 'GN18 in, 1.5 h'),
    (AARON, '2026-10-12', G + ' · 1 h · GN13 mob · Generators 9994954 KINP · 1 h · GN? mob',
     G + ' · 1.5 h · GN13 mob · Generators 9994954 KINP · 3 h · GN? mob (2 units)',
     'GN13 in, 1.5 h; the concert pair GN? in, two generators, 3 h on KINP'),
    (AARON, '2026-10-15', G + ' · 1 h · GN06 mob', G + ' · 1.5 h · GN06 mob', 'GN06 in, 1.5 h'),
    (AARON, '2026-10-19', G + ' · 5 h · GN04 mob, GN10 mob, GN19 mob, GN24 mob, GN25 mob',
     G + ' · 7.5 h · GN04 mob, GN10 mob, GN19 mob, GN24 mob, GN25 mob', 'five generators in, 1.5 h each'),
    (AARON, '2026-10-26', G + ' · 5 h · GN04 demob, GN06 demob, GN10 demob, GN13 demob, GN24 demob',
     G + ' · 6 h · GN04 demob, GN06 demob, GN10 demob, GN24 demob',
     'four generators out, 1.5 h each; with 4 h on the barriers the fifth does not fit his 11 h and goes to Alfie'),
    (ALFIE, '2026-10-26', None, G + ' · 1.5 h · GN13 demob',
     'GN13 out (13:02), 1.5 h: Aaron was on, but his day was full'),
    (AARON, '2026-10-28', G + ' · 4 h · GN03 demob, GN21 demob, GN23 demob, GN25 demob · ' + G + ' · 1 h · GN20-A demob',
     G + ' · 7.5 h · GN03 demob, GN21 demob, GN23 demob, GN25 demob, GN20-A demob', 'five generators out, 1.5 h each'),
    (ALFIE, '2026-10-30', None, G + ' · 1.5 h · GN01 demob',
     'GN01 out (14:30), 1.5 h: Aaron did not work Friday (Andrew, 31 Oct 2026), Alfie was on'),
]


def main(state_path):
    s = json.loads(Path(state_path).read_text(encoding='utf-8'))
    costs = s['docs']['costs']
    slug = lambda p: ''.join(c if c.isalnum() else '-' for c in p.lower()).strip('-')
    ops, seen = [], set()
    for person, day, old, new, why in CHANGES:
        rid = 'W-L-' + slug(person) + '-' + day.replace('-', '')
        if rid in seen: raise SystemExit('twice in the spec: ' + rid)
        seen.add(rid)
        row = costs.get(rid)
        if not row or row.get('kind') != 'labour': raise SystemExit('no labour row ' + rid)
        note = row.get('note') or ''
        if old is None:
            if 'Generators' in note: raise SystemExit(rid + ' already carries generator words: ' + note)
            if not note.startswith('KINP labour, the rest of the day'): raise SystemExit(rid + ' does not start with the KINP words: ' + note)
            to = new + ' · ' + note
        else:
            if note.count(old) != 1: raise SystemExit(rid + ': the words to change are not in the note once: ' + note)
            to = note.replace(old, new)
        if len(to) > 240: raise SystemExit(rid + ': %d characters, the page keeps 240: %s' % (len(to), to))
        noted = sum(float(m.group(1)) for m in (re.match(r'^(\d+(?:\.\d+)?) h$', seg.strip()) for seg in to.split(' · ')) if m)
        if noted > float(row.get('hours') or 0): raise SystemExit(rid + ': %.1f h noted on a %s h day' % (noted, row.get('hours')))
        ops.append({'op': 'labour_set', 'person': person, 'date': day, 'from_note': note, 'fields': {'note': to},
                    'why': 'Andrew Fisher, 31 Oct 2026: ' + why, 'hours_on_row': row.get('hours')})
    spec = {'by': 'Andrew Fisher', 'basis': BASIS, 'record_version_read': s['version'], 'ops': ops}
    (HERE / 'gen3h_spec.json').write_text(json.dumps(spec, ensure_ascii=False, indent=1) + '\n', encoding='utf-8')
    for o in ops:
        print(o['date'], o['person'].split(' ')[0], '| %d -> %d chars' % (len(o['from_note']), len(o['fields']['note'])), '|', o['fields']['note'])
    print(len(ops), 'rows; record version read', s['version'])


if __name__ == '__main__':
    main(sys.argv[1])
