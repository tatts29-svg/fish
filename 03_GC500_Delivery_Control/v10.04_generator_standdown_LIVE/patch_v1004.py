"""Author: Andrew Fisher. Shared generator hire from delivery through race Sunday."""
import hashlib
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
from patch_finance1004 import patch as patch_finance
from patch_ui1004 import patch_ui1004
from patch_location1004 import patch_location1004

BASE_SHA = '3056702a2a5664050eb9b8cf8592bc2f700ea5faf705829d97f471b83f38e412'

def apply(text):
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA:
        raise ValueError('Requires exact live v10.03; refuses repeat application')
    text = rep(text, 'function contractCharge(r){', (HERE / 'generator_source1004.js').read_text() + '\nfunction contractCharge(r){', 'Shared generator source resolver', 'v10.04')
    text = patch_finance(text)
    text = patch_ui1004(text, 'v10.04')
    text = patch_location1004(text)
    text = rep(text, "if(pane&&!pane.querySelector('[data-onsite979]'))", "if(pane&&state.financeView857!=='generators'&&!pane.querySelector('[data-onsite979]'))", 'Keep Generators focused on generator charges', 'v10.04')
    return rep(text, "+ ' · v10.03'", "+ ' · v10.04'", 'Release footer', 'v10.04')

if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(apply(page.read_text()))
