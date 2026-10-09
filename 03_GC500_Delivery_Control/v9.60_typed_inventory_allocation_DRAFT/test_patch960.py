# Author: Andrew Fisher. Strict composition checks; pass an actual v9.59 predecessor.
from pathlib import Path
import subprocess
import sys
import tempfile

patch = Path(__file__).with_name('patch_v960.py')
source = Path(sys.argv[1]).read_bytes()
with tempfile.TemporaryDirectory() as temp:
    p = Path(temp)/'candidate.html'; p.write_bytes(source)
    run = lambda: subprocess.run([sys.executable, str(patch), str(p)], capture_output=True, text=True)
    first = run(); assert first.returncode == 0, first.stderr
    result = p.read_bytes()
    assert b'root.Inventory960=' in result and b'root.Scope960=' in result
    assert b'v9.60\'; /* v8.19' in result
    double = run(); assert double.returncode != 0 and p.read_bytes() == result
    p.write_bytes(source.replace(b'v9.59\'; /* v8.19', b'v9.57\'; /* v8.19'))
    rejected = p.read_bytes(); wrong = run(); assert wrong.returncode != 0 and p.read_bytes() == rejected
    p.write_bytes(source.replace(b'done=x.value===100&&!x.bound;', b'done=false;'))
    rejected = p.read_bytes(); drift = run(); assert drift.returncode != 0 and p.read_bytes() == rejected
print('v9.60 strict patch: accepted predecessor, rejected double application, wrong version and anchor drift; no partial writes')
