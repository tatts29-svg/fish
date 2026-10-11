"""Author: Andrew Fisher. Replace only the Coates Way film and its immutable media references."""
import os
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
from media997 import literal, load_report, replace_data, sha, update_data

BASE_SHA = 'dc648c02fa4d083a78a7068c08526f31e8ad3adfaf3a6beffce4ba326a71a551'
MARKER = 'seamless 32-second loop with a full 360-degree inspection'


def apply(text, report_path=None, report_sha=None):
    if MARKER in text:
        raise ValueError('Machine film v9.97 already applied')
    if sha(text.encode()) != BASE_SHA or 'const MachineFilm995 = ' not in text:
        raise ValueError('Wrong base: requires exact live v9.96 and its existing player')
    roles = load_report(report_path or os.environ.get('MACHINE997_REPORT'), report_sha or os.environ.get('MACHINE997_REPORT_SHA256'))
    data, _, _ = literal(text)
    text = rep(text, "+ ' · v9.96'", "+ ' · v9.97'", 'Release footer', 'v9.97')
    result = replace_data(text, update_data(data, roles))
    if MARKER not in result:
        raise ValueError('Expected reviewed film description')
    return result


if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text()))
