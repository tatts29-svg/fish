"""Author: Andrew Fisher. Exact-base and unrelated-content release guards."""
import hashlib
import importlib.util
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('patch1102', HERE / 'patch_v1102.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


def main():
    base = Path(sys.argv[1]).read_text()
    checks = []

    def check(name, value):
        if not value:
            raise AssertionError(name)
        checks.append(name)

    result = release.patch(base)
    for name, text in [('wrong base', base + '\n'), ('repeat application', result)]:
        try:
            release.patch(text)
        except ValueError:
            checks.append(name + ' refused')
        else:
            raise AssertionError(name)
    scripts = lambda value: re.findall(r'<script\b[^>]*>(.*?)</script>', value, re.S)
    old, new = scripts(base), scripts(result)
    check('script boundaries retained', len(old) == len(new) == 150)
    changed = [i for i, pair in enumerate(zip(old, new)) if pair[0] != pair[1]]
    allowed = [i for i, value in enumerate(old) if 'var SvcPanel =' in value or
               release.CONTROLLER in value or "/* v8.19 release922" in value]
    check('only three intended scripts change', changed == allowed and len(changed) == 3)
    footer = next(i for i, value in enumerate(old) if '/* v8.19 release922' in value)
    check('unrelated native logic preserved in footer script',
          new[footer] == old[footer].replace("+' · v11.01'; /* v8.19 release922",
                                            "+' · v11.02'; /* v8.19 release922"))
    styles = lambda value: re.findall(r'<style\b[^>]*>.*?</style>', value, re.S)
    filtered = re.sub(r'<style id="svc1102-style">.*?</style>\s*', '', result, count=1, flags=re.S)
    check('all existing styles preserved', styles(base) == styles(filtered))
    check('new styles scoped to servicing', result.count('<style id="svc1102-style">') == 1)
    check('state rules remain a single native copy', result.count('var SvcState =') == base.count('var SvcState ='))
    check('stable meter helper installed once', result.count('var SvcProgress1102 =') == 1)
    check('map no longer replaces area container', "q('.svc1099-areas').innerHTML=areaHtml" not in result)
    check('controller no longer replaces entire progress panel', 'content.innerHTML = html; lastSignature = html;' not in result)
    check('same refresh cadence and failure cap', 'Math.min(60000,2000*Math.pow(2,failures1099))' in result)
    check('credentials not added to source', 'GC500_EDIT_TOKEN' not in result)
    print({'checks_passed': len(checks), 'candidate_sha256': hashlib.sha256(result.encode()).hexdigest(),
           'checks': checks, 'network_requests': 0})


if __name__ == '__main__':
    main()
