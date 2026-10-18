# Author: Andrew Fisher. Root composes this source addition with showcase changes.
from pathlib import Path

def apply_source974(s):
    if 'const Reference973 = (() => {' not in s or 'function referenceLocation973Html' not in s:
        raise RuntimeError('Source974 requires reconciled v9.73 source/reference renderer')
    if 'const Source974=' in s:
        raise RuntimeError('Source974 already applied')
    module=Path(__file__).with_name('source974.js').read_text()
    anchor='</body>\n</html>\n'
    if s.count(anchor)!=1:
        raise RuntimeError('Expected one document closing anchor')
    return s.replace(anchor,'<script id="source974-script">\n'+module+'\n</script>\n'+anchor)
