"""Author: Andrew Fisher. v10.60.2 - the no-twin-steer print check says what it still needs, and fills in your full name.

Andrew, 18 Oct 2026 06:26 (screenshot of the check with the box ticked and "Andrew" typed): "When ticked its still greyed out
you csnt get passed this block". The button needs the box ticked AND a first and last name (v10.53 rule), but the check only
said "until you tick the box", and it filled in "Andrew" from the phone. Now:
- the label reads "Your full name (first and last)";
- a line under it says what is still missing ("Tick the box to continue" / "Type your first and last name to continue"),
  then "Ready";
- a one-word name that the project author's full name starts with is filled in as that full name (Andrew -> Andrew Fisher).
The rule itself is unchanged: nothing prints until the box is ticked and a full name is given. Footer v10.60.1 -> v10.60.2.

    python3 patch_v1060p2.py path/to/page.html   (on the live v10.60.1 page)
"""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

PATCHES = [
    ('print check: fill in the full name the short name starts with',
     r"""let name = ''; try { name = localStorage.getItem('gc500.printedBy') || ''; } catch (x) {} if (!name) { try { name = whoAmI() || ''; } catch (x) {} }""",
     r"""let name = ''; try { name = localStorage.getItem('gc500.printedBy') || ''; } catch (x) {} if (!name) { try { name = whoAmI() || ''; } catch (x) {} }
  try { const au = String((DATA.brand && DATA.brand.author) || '').trim(); if (name && !fullName(name) && fullName(au) && au.toLowerCase().indexOf(String(name).trim().toLowerCase() + ' ') === 0) name = au; } catch (x) {}    /* v10.60.2: "Andrew" becomes "Andrew Fisher" */"""),
    ('print check: the label asks for first and last name',
     r"""for="ts1053n">Your full name</label>""",
     r"""for="ts1053n">Your full name (first and last)</label>"""),
    ('print check: the note becomes a live line saying what is missing',
     r"""<p class="ts1053-note">You can\'t print run sheets, dockets or load paperwork until you tick the box.</p>""",
     r"""<p class="ts1053-note" id="ts1053w" aria-live="polite">You can\'t print run sheets, dockets or load paperwork until you tick the box and type your first and last name.</p>"""),
    ('print check: the line says what is still needed',
     r"""const ok = () => ck.checked && fullName(nm.value); const sync = () => { go.disabled = !ok(); };""",
     r"""const ok = () => ck.checked && fullName(nm.value), why = box.querySelector('#ts1053w');
  const sync = () => { const y = ok(); go.disabled = !y; if (why) { why.textContent = y ? 'Ready: press Tick done — continue.' : !ck.checked ? 'Tick the box to continue. You can\'t print run sheets, dockets or load paperwork until you do.' : 'Type your first and last name to continue (for example Andrew Fisher).'; why.classList.toggle('ts1053-need', !y && ck.checked); why.classList.toggle('ts1053-ready', y); } };"""),
    ('print check: the missing-name line stands out',
     r"""#ts1053 .ts1053-note{color:#5f6368;font-size:13px}""",
     r"""#ts1053 .ts1053-note{color:#5f6368;font-size:13px}#ts1053 .ts1053-note.ts1053-need{color:#b3120b;font-weight:700;font-size:15px}#ts1053 .ts1053-note.ts1053-ready{color:#1e7d3a;font-weight:700}"""),
    ('Release footer', "+ ' · v10.60.1'", "+ ' · v10.60.2'"),
]

if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    if "+ ' · v10.60.1'" not in t: sys.exit('patch_v1060p2 needs the v10.60.1 page')
    if 'v10.60.2: "Andrew" becomes' in t: sys.exit('patch_v1060p2 refuses a repeat')
    for what, old, new in PATCHES:
        t = rep(t, old, new, what, str(p))
    p.write_text(t, encoding='utf-8')
    print('patch_v1060p2 applied: the print check says what it still needs and fills in the full name; footer v10.60.1 -> v10.60.2')
