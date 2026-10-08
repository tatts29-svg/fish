"""Author: Andrew Fisher. Existing source and records survive the additive map patch."""
import importlib.util, sys
from pathlib import Path
here = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('map_patch', here / 'patch_v911.py')
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
base = Path(sys.argv[1]).read_text()
candidate = mod.patch(base)
css = '\n'.join((here / name).read_text() for name in ['compact911.css', 'drops911.css'])
js = (here / 'drops911.js').read_text()
reverse = candidate.replace('<style id="drops911-style">' + css + '</style>\n', '').replace('<script id="drops911-script">\n' + js + '\n</script>\n', '').replace("+ ' · v9.11'; /* v8.19", "+ ' · v9.10'; /* v8.19")
assert reverse == base, 'Existing source/data changed unexpectedly'
for label, value in [('repeat', candidate), ('older', base.replace("+ ' · v9.10'; /* v8.19", "+ ' · v9.08'; /* v8.19")), ('missing model', base.replace('window.Drops908', 'window.Removed908'))]:
    try:
        mod.patch(value)
    except (ValueError, SystemExit):
        pass
    else:
        raise AssertionError('Accepted ' + label)
print('PASS exact source/data preservation and incompatible base refusal')
