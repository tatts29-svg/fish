import json, sys, difflib
a = json.load(open(sys.argv[1])); b = json.load(open(sys.argv[2]))
same = diff = 0
for k in a['tabs']:
    if a['tabs'][k] == b['tabs'].get(k): same += 1
    else:
        diff += 1; x, y = a['tabs'][k], b['tabs'].get(k, '')
        sm = difflib.SequenceMatcher(None, x, y, autojunk=False)
        ops = [(t, x[i1:i2][:120], y[j1:j2][:120]) for t, i1, i2, j1, j2 in sm.get_opcodes() if t != 'equal'][:6]
        print('DIFF', k, len(x), len(y), ops)
print('tabs identical', same, 'of', same + diff)
for f in ['header', 'foot', 'banner', 'tabbar']:
    print(f, 'identical' if a[f] == b[f] else 'DIFF\n  A ' + str(a[f])[:400] + '\n  B ' + str(b[f])[:400])
print('html class A', a['htmlClass']); print('html class B', b['htmlClass'])
print('errors', a['errors'], b['errors'], 'blocked', a['blocked'], b['blocked'])
