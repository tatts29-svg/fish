# Author: Andrew Fisher. Fold supporting text; no models or recorded data change.
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep

def apply_prose976(s):
    if 'workers975-script' not in s or 'function foldStories(root)' not in s:
        raise RuntimeError('Prose976 requires worker-only v9.75 and existing story folds')
    if 'prose976-script' in s:
        raise RuntimeError('Prose976 already applied')
    src=Path(__file__).with_name('prose976.js').read_text()
    return rep(s,'</body>\n</html>\n','<script id="prose976-script">\n'+src+'\n</script>\n</body>\n</html>\n','Supporting text folds',__file__)
