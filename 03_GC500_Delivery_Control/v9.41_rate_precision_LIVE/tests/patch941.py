#!/usr/bin/env python3
"""Author: Andrew Fisher. Private fixture guards and strictly bounded HTML change."""
import hashlib, os, subprocess, tempfile
from pathlib import Path
here = Path(__file__).resolve().parents[1]
base = Path(os.environ['BASE941']).read_bytes()
checks = 0
with tempfile.TemporaryDirectory(prefix='rate941-') as tmp:
    p = Path(tmp)/'candidate.html'
    def run(*flags):
        return subprocess.run(['python3',str(here/'patch_v941.py'),str(p),*flags],capture_output=True)
    p.write_bytes(base)
    assert run().returncode != 0 and p.read_bytes() == base
    checks += 1
    assert run('--preview-base-937').returncode == 0
    preview = p.read_bytes()
    checks += 1
    assert run('--preview-base-937').returncode != 0 and p.read_bytes() == preview
    checks += 1
    synthetic940 = base.replace(b" \xc2\xb7 v9.37'; /* v8.19",b" \xc2\xb7 v9.40'; /* v8.19")
    assert synthetic940 != base
    p.write_bytes(synthetic940)
    assert run().returncode == 0 and p.read_bytes() == preview
    checks += 1
    text = preview.decode('utf-8-sig')
    original = base.decode('utf-8-sig')
    helper = (here/'rate941.js').read_text()
    assert text.count(helper) == 1 and text.count('Rate941.formula(l)') == 1
    checks += 1
    restored = text.replace(helper+'\n','',1).replace('\n<meta id="rate941-script" name="gc500-rate-display" content="9.41">','',1).replace(" · v9.41'; /* v8.19"," · v9.37'; /* v8.19",1)
    new = '''+ (l.days != null && l.per === 'day' ? '<br><span class="w rate941-formula" style="font-size:11.5px;color:var(--mute)">' + esc(Rate941.formula(l))'''
    old = ''' + (l.days != null && l.per === 'day' ? '<br><span class="w" style="font-size:11.5px;color:var(--mute)">' + esc(String(l.days)) + ' day' + (l.days === 1 ? '' : 's')
 + ' × ' + esc(money(l.rate)) + (l.qty != null ? ' × ' + esc(String(l.qty)) : '')'''
    assert restored.replace(new,old,1) == original, 'Only the one display expression, helper, marker and footer may change'
    checks += 1
print('{"author":"Andrew Fisher","passed":true,"patchChecks":'+str(checks)+'}')
