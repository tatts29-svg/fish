"""Write patch_v1061_buildtab.py (repo patch style, rep() helper) from the prototype's FIXES table."""
import importlib.util, json
spec = importlib.util.spec_from_file_location('pp', 'patch_proto.py'); pp = importlib.util.module_from_spec(spec); spec.loader.exec_module(pp)
NAMES = {
 'F1': 'work986/past984: the record string worked out once per draw, not once per day card',
 'F2': 'EventConfig1013.current(): event dates read once per draw',
 'F3': 'units925: unit metadata indexed once per draw',
 'F4': 'daycats1057/daycards1056: one time formatter',
 'F5': 'isoIn: the same timestamp converted once',
 'F6': 'histOf / deliveryAsOf / work986 rawDelivery: once per reference per draw',
 'F7': 'renderTimeline: header car picture copied onto <html> once',
 'F8': 'staff910 roster: workforce lines read once per draw',
 'F9': 'quantity-scope1017 unitEvidence: labour keys indexed by reference once per draw',
 'F10': 'arrivalsOn(day): one replay per day per draw',
 'F11': 'weather1002 reveal(): only write an edge padding that changes something',
 'F12': 'renderTimeline: header car picture copied in the same style pass as the new pane',
 'F13': 'Build strip keeps its place on a background redraw (behaviour: optional)',
 'F14': 'selection-save1012: rescan for save-able fields only when one is added',
 'F15': 'Equipment tab: the batches of one row fill share one hold while the record is unchanged',
 'F16': 'Build day-close progress: consecutive cards share the models while the record is unchanged',
}
lines = ['"""Author: Andrew Fisher. v10.61 (draft) - the Build tab opens and redraws without the long freeze.', '',
 'Speed only: every figure, word, date and record on every tab reads exactly as before (parity checked on every pane,',
 'the Build tab on every third day and every sixth reference drawer, desktop and phone). Work the Build tab did once per',
 'day card - stringifying the whole record, scanning every load and labour key, rebuilding the workforce list, replaying',
 'every reference\'s lights - is now done once per draw; two avoidable whole-pane restyles are gone. F13 is optional: it',
 'changes where the day strip sits after a background redraw (it stays where the person swiped it).', '',
 '    python3 patch_v1061_buildtab.py path/to/page.html [--with-f13]   (on the live v10.60.1 page)', '"""',
 'import os, sys', 'from pathlib import Path', '', "HERE = Path(__file__).resolve().parent",
 "sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'toolchain'))", 'from rep import rep', '', 'PATCHES = [']
BASE = open('base.html', encoding='utf-8').read()
def ws(old):
    i = BASE.index(old); j = BASE.rfind('\n', 0, i) + 1; pre = BASE[j:i]
    return pre if pre.strip() == '' else ''
for k, reps in pp.FIXES.items():
    for i, (old, new) in enumerate(reps):
        new = ws(old) + new
        lines.append(f'    ({json.dumps(k + (chr(97 + i) if len(reps) > 1 else "") + " " + NAMES[k])}, {old!r}, {new!r}),')
lines += [']', '', 'def main():', "    path = Path(sys.argv[1]); t = path.read_text(encoding='utf-8')",
 "    if 'S-json1061' in t: sys.exit('already patched (v10.61 build-tab speed)')",
 "    if 'function generatorPlace1004' not in t or 'shapes1060-script' not in t: sys.exit('wrong base: expected live v10.60.1')",
 "    f13 = '--with-f13' in sys.argv",
 '    for what, old, new in PATCHES:',
 "        if what.startswith('F13') and not f13: continue",
 '        t = rep(t, old, new, what, str(path), True)',
 "    path.write_text(t, encoding='utf-8'); print('patched', path)", '', "if __name__ == '__main__':", '    main()', '']
open('patch_v1061_buildtab.py', 'w').write('\n'.join(lines))
print('written')
