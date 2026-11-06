"""Author: Andrew Fisher. Where each v10.61 prototype hunk lands on a page, and which ones touch the shared boot/sync code.

Runs every prototype patch in this folder against a copy of the page with rep() swapped for a recorder: nothing is
written to the page given, nothing is uploaded, no request is made. For each replacement it records the patch, the
hunk's label, how many times its old text is found on the page (toolchain rep() matching: exactly once is required to
apply), the line it lands on and the named functions around it (hunk_context.cjs, acorn). A hunk is marked SHARED when
it sits inside, or changes a call into, Refresh904, syncBoot, syncRedraw, syncStart/syncStop, syncFold, deliverAll or
the SYNC timers - the code the saved-copy / OFFLINE timer work also changes.

    python3 hunk_map.py live.html hunks.json        (then: hunks.json + hunks.md beside it)
"""
import importlib.util, json, os, re, subprocess, sys, tempfile, types

HERE = os.path.dirname(os.path.abspath(__file__))
SHARED_FN = re.compile(r'^(Refresh904|GC500Refresh904|syncBoot|syncRedraw|syncStart|syncStop|syncFirst|syncFold|syncFooter|deliverAll|restBackend)$')
SHARED_TXT = re.compile(r'Refresh904|syncBoot\(|syncRedraw|SYNC\.(rtimer|utimer|ftimer|status)|syncStop|syncStart\(|deliverAll\(')
# the base guards ask for the v10.60.1 page these prototypes were measured on; the map runs them on any later page
GUARD = "\n<!-- hunk_map guard only: ' · v10.60.1' function generatorPlace1004 W.align1055 = {scan, DIFFS}; gc500ShapeLayer1060 -->\n"


def pattern(old):
    return '\n'.join('[ \t]*' + r'\s+'.join(re.escape(tok) for tok in l.split()) if l.split() else '[ \t]*' for l in old.split('\n'))


class Recorder:
    def __init__(self):
        self.rows = []; self.patch = None

    def rep(self, text, old, new, what, *rest, **kw):
        ms = list(re.finditer(pattern(old), text))
        # in_sequence: found on the page as this patch has changed it so far (a hunk may match text an earlier hunk wrote)
        self.rows.append({'patch': self.patch, 'what': what, 'old': old, 'new': new, 'in_sequence': len(ms)})
        if len(ms) != 1: return text
        m = ms[0]; return text[:m.start()] + new + text[m.end():]


PATCHES = {
    'load': ('load/patch_v1061_load_hotspots.py', ['{IN}', '{OUT}', 'all']),
    'buildtab': ('buildtab/patch_v1061_buildtab.py', ['{IN}', '--with-f13']),
    'flicker': ('flicker/patch_smooth1061.py', ['{IN}', '{OUT}']),
    'idle': ('idle/patch_v1061_idle.py', ['{IN}']),
    'codexport': ('codexport/patch_v1061_codexport.py', ['{IN}']),
}


def run_patch(rec, name, rel, argv_tail, page_text, parts=None):
    """runs one prototype patch on page_text with rep() recorded; returns the page as the patch left it"""
    rec.patch = name
    path = os.path.join(HERE, rel)
    result = page_text
    with tempfile.TemporaryDirectory() as d:
        work = os.path.join(d, 'page.html'); out = os.path.join(d, 'out.html')
        open(work, 'w', encoding='utf-8').write(page_text + GUARD)
        shim = types.ModuleType('rep'); shim.rep = rec.rep
        saved = sys.modules.get('rep'); sys.modules['rep'] = shim
        old_argv, old_parts = sys.argv, os.environ.get('PARTS')
        if parts: os.environ['PARTS'] = parts
        try:
            sys.argv = [path] + [a.replace('{IN}', work).replace('{OUT}', out) for a in argv_tail]
            spec = importlib.util.spec_from_file_location('proto_' + name, path)
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            if name == 'flicker':
                mod.rep = lambda text, old, new, what, need=True: rec.rep(text, old, new, what)
                result = mod.build(open(work, encoding='utf-8').read())
            elif name == 'buildtab':
                mod.main(); result = open(work, encoding='utf-8').read()
            elif name == 'codexport':
                result = mod.patch(open(work, encoding='utf-8').read(), work)
            elif name == 'load':
                result = open(out, encoding='utf-8').read()
            else:
                result = open(work, encoding='utf-8').read()
            result = result.replace(GUARD, '')
        except SystemExit as e:
            rec.rows.append({'patch': name, 'what': '(patch stopped)', 'old': '', 'new': '', 'stopped': str(e)})
        finally:
            sys.argv = old_argv
            if old_parts is None: os.environ.pop('PARTS', None)
            else: os.environ['PARTS'] = old_parts
            if saved is None: sys.modules.pop('rep', None)
            else: sys.modules['rep'] = saved
    return result


def main():
    page, dst = sys.argv[1], sys.argv[2]
    text = open(page, encoding='utf-8').read()
    rec = Recorder()
    for name, (rel, argv) in PATCHES.items(): run_patch(rec, name, rel, argv, text)
    starts = [0]
    for i, ch in enumerate(text):
        if ch == '\n': starts.append(i + 1)
    import bisect
    # node counts string offsets in UTF-16 units; the page has characters outside the BMP, so convert, and point at the
    # first non-blank character of the hunk (the pattern may start on leading whitespace)
    u16 = lambda off: len(text[:off].encode('utf-16-le')) // 2
    offsets = []
    for r in rec.rows:
        if not r['old']: r['found'] = None; continue
        ms = list(re.finditer(pattern(r['old']), text))
        r['found'] = len(ms)
        r['at'] = []
        for m in ms[:3]:
            s = m.start() + (len(m.group(0)) - len(m.group(0).lstrip()))
            r['at'].append({'offset': s, 'end': m.end(), 'line': bisect.bisect_right(starts, s), 'u16': u16(s)})
        offsets += [a['u16'] for a in r['at']]
    ctx = json.loads(subprocess.run(['node', os.path.join(HERE, 'hunk_context.cjs'), page] + [str(o) for o in offsets],
                                    capture_output=True, text=True, check=True).stdout)
    for r in rec.rows:
        for a in r.get('at', []):
            c = ctx.get(str(a.pop('u16'))) or {}
            a['script'] = c.get('script'); a['within'] = c.get('within', [])
        names = [n for a in r.get('at', []) for n in a['within']]
        r['shared'] = bool(any(SHARED_FN.match(n.split('.')[-1]) for n in names) or SHARED_TXT.search(r['old'] or '') or SHARED_TXT.search(r['new'] or ''))
    json.dump(rec.rows, open(dst, 'w', encoding='utf-8'), indent=1, ensure_ascii=False)
    md = ['| patch | hunk | found | in sequence | line | inside | shared |', '|---|---|---|---|---|---|---|']
    for r in rec.rows:
        a = (r.get('at') or [{}])[0]
        md.append('| {} | {} | {} | {} | {} | {} | {} |'.format(r['patch'], r['what'].replace('|', '/'), r.get('found', r.get('stopped', '')),
                  r.get('in_sequence', ''), a.get('line', ''), ' > '.join(a.get('within', [])[-3:]).replace('|', '/'), 'SHARED' if r.get('shared') else ''))
    open(os.path.splitext(dst)[0] + '.md', 'w', encoding='utf-8').write('\n'.join(md) + '\n')
    n = len([r for r in rec.rows if r['old']]); ok = len([r for r in rec.rows if r.get('found') == 1])
    seq = len([r for r in rec.rows if r.get('in_sequence') == 1])
    print(f'{n} hunks, {ok} found exactly once on the page, {seq} exactly once in sequence, '
          f'{len([r for r in rec.rows if r.get("shared")])} shared -> {dst}')


if __name__ == '__main__':
    main()
