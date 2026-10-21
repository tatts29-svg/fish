"""Author: Andrew Fisher. Bounded generic integration; the caller owns release/base guards."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
from private_input1105 import read_private_input


def integrate(html, env=None):
    if 'id="financial-association1105-data"' in html:
        raise ValueError('Financial association has already been installed')
    payload, manifest = read_private_input(env)
    old = "const open = ONHIRE_ROWS.filter(r => !r.charge_line && !r.subhired && typeof r.rate_1 !== 'number' && !lr748Decided(r)).map"
    new = "const open = ONHIRE_ROWS.filter(r => !r.charge_line && !r.subhired && (typeof r.rate_1 !== 'number' || window.FinancialAssociation1105?.overrideEligible(r)) && !lr748Decided(r)).map"
    html = rep(html, old, new, 'existing native whole-event rate input eligibility', __file__)
    block = '\n<script id="financial-association1105-model">\n' + (HERE / 'financialAssociation1105_src.js').read_text() + '\n</script>\n'
    # A one-element JSON array is also syntax-valid for the shared all-script checker.
    block += '<script id="financial-association1105-data" type="application/json">[' + payload + ']</script>\n'
    block += '<script id="financial-association1105-browser">\n' + (HERE / 'financialAssociation1105_browser.js').read_text() + '\n</script>\n'
    html = rep(html, '</body>\n</html>', block + '</body>\n</html>', 'private source association and existing native override adapter', __file__)
    return html, manifest
