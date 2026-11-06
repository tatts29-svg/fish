"""Author: Andrew Fisher. Reuse the native raw-history snapshot in Build categories."""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

OLD = " const hist = (a, field) => memo('h|' + field + '|' + a.key, () => histOf(a.key, field));"
NEW = " const hist = (a, field) => typeof historyRead1066 === 'function' ? historyRead1066(a.key, field) : memo('h|' + field + '|' + a.key, () => histOf(a.key, field));"

def apply(text, path):
    return rep(text, OLD, NEW, 'Build category raw history read', path)
