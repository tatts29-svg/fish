"""Author: Andrew Fisher. Prove the adapter changes only the intended renderer and CSS."""
from pathlib import Path
import importlib.util
import sys

ROOT = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('timeline846_patch', ROOT / 'timeline846_patch.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
base = Path(sys.argv[1]).read_text()
candidate = module.apply(base)
start = base.index('function ldLine(d, g, n, open, timed){')
end = base.index("/* the day's loads of one kind", start)
injected = (ROOT / 'timeline846_src.js').read_text() + '\nfunction ldLine(d, g, n, open, timed){ return timeline846Line(d, g, n, open, timed); }\n'
restored = candidate.replace(injected, base[start:end], 1)
restored = restored.replace('<style id="timeline-v846">\n' + (ROOT / 'timeline846_src.css').read_text() + '\n</style>\n', '', 1)
assert restored == base, 'Unrelated native content changed'
try:
    module.apply(candidate)
    raise AssertionError('Repeat application accepted')
except ValueError:
    pass
print('PASS: exact native content preservation and repeat guard')
