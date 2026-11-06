"""Author: Andrew Fisher. Remove repeated native reads without changing calculations."""
import hashlib
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

BASE_SHA256 = '7ea8e4d2b8230bdece88a7d566c8ae8d2eea63892b8ba1b928a3440149ca4404'
OLD_START = 'function pl760Ticks(){\n'
NEW_START = OLD_START + ' /* v12.50.1: native held reads; each caller still receives its own nested result. */\n const read12501 = () => {\n'
OLD_END = ' return FwfLabour1244.ticks(out,fwf1244ByBranch,ONHIRE_ROWS);\n}\n/* the By branch table'
NEW_END = (' return FwfLabour1244.ticks(out,fwf1244ByBranch,ONHIRE_ROWS);\n'
           ' };\n'
           ' if(arguments.length || typeof structuredClone!==\'function\')return read12501();\n'
           ' return structuredClone(heldMemo(\'pl760Ticks12501\',read12501));\n'
           '}\n/* the By branch table')
OLD_FOOTER = "+' · v12.50';"
NEW_FOOTER = "+' · v12.50.1';"
BRANCH_SCOPE = '/* Keep the existing detailed branch working available under More info. */\n'
NEW_BRANCH_SCOPE = BRANCH_SCOPE + 'let branchProjection12501; /* private synchronous projection; no stored Finance result */\n'
OLD_BRANCH = (' function branchFinancial978(B,M){\n'
              '  const P=pl770Model(),X=cj764Model(),c=M.charge||{},H=legacyFinance978(),T=transport888Core(),LP=labourPlan(),labW={};\n')
NEW_BRANCH = (' function branchFinancial978(B,M){return branchProjection12501(B,M);}\n'
              ' branchProjection12501=function(B,M,providedH){\n'
              '  const P=pl770Model(),X=cj764Model(),c=M.charge||{},H=arguments.length>=3?providedH:legacyFinance978(),T=transport888Core(),LP=labourPlan(),labW={};\n')
OLD_BRANCH_END = ' }\n window.branchFinancial978=branchFinancial978;'
NEW_BRANCH_END = ' };\n window.branchFinancial978=branchFinancial978;'
OLD_FINANCE = 'const H=legacyFinance978(),B=branchFinancial978(pl752Rows(),moneySummary()),prior=new Map(H.inv.map(r=>[r.branch,r]));'
NEW_FINANCE = 'const H=legacyFinance978(),B=branchProjection12501(pl752Rows(),moneySummary(),H),prior=new Map(H.inv.map(r=>[r.branch,r]));'
CHANGES = [(OLD_START, NEW_START, 'reader start'), (OLD_END, NEW_END, 'reader end'),
           (BRANCH_SCOPE, NEW_BRANCH_SCOPE, 'private branch projection binding'),
           (OLD_BRANCH, NEW_BRANCH, 'branch projection entry'),
           (OLD_BRANCH_END, NEW_BRANCH_END, 'branch projection end'),
           (OLD_FINANCE, NEW_FINANCE, 'reuse local Finance result'),
           (OLD_FOOTER, NEW_FOOTER, 'footer')]


def digest(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def exact(text, old, new, label, path='page'):
    if text.count(old) != 1:
        raise ValueError(label + ': expected one exact source boundary')
    replacement = rep(old, old, new, label, path)
    if replacement != new:
        raise ValueError(label + ': shared replacement changed its boundary')
    return text.replace(old, replacement, 1)


def reverse(text):
    for old, new, label in reversed(CHANGES):
        text = exact(text, new, old, 'restore ' + label)
    if digest(text) != BASE_SHA256:
        raise ValueError('Reversal did not recover the exact reviewed predecessor')
    return text


def patch(text, path='page', expected_base_sha=None):
    expected = expected_base_sha or os.environ.get('GC500_V12501_BASE_SHA256', '')
    if 'pl760Ticks12501' in text or NEW_FOOTER in text:
        raise ValueError('v12.50.1 already applied')
    if expected != BASE_SHA256 or digest(text) != BASE_SHA256:
        raise ValueError('v12.50.1 requires the explicit exact reviewed live50 SHA-256')
    changed = text
    for old, new, label in CHANGES:
        changed = exact(changed, old, new, label, path)
    if reverse(changed) != text:
        raise ValueError('Change escaped the native reader boundaries and version footer')
    return changed


if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(patch(page.read_text(encoding='utf-8'), str(page)), encoding='utf-8')
    print('v12.50.1 native read reuse applied; exact predecessor reversal verified')
