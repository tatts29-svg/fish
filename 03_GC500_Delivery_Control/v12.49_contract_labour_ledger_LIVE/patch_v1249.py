"""Author: Andrew Fisher. Bounded contract labour classification; no source or price change."""
import hashlib
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

# Reviewed v12.48 candidate. Its exact public bytes must be verified before READY.
REVIEWED_BASE_SHA256 = '39836e1521ace88ea9142c393fdfe1cac90cae0876a954a699121729e323416b'
REVIEWED_BASE_VERSION = '12.48'
SOURCE_SHA256 = 'd4457c00dc08ea18823a767211ffe9277d5290afc94a8ae7dc7aae390deb9efc'
OLD_FOOTER = "+' · v12.48';"
NEW_FOOTER = "+' · v12.49';"
CLASSIFIER = 'function contractChargeCategory1224(r){'

REPLACEMENTS = [
    ('recognise reviewed installation without altering source flags',
     ' if(!r||!r.charge_line||r.subhired)return null;',
     ' if(!r||(!r.charge_line&&!ContractLabour1249.isInstallation(r))||r.subhired)return null;'),
    ('exclude reviewed labour from equipment subtotal',
     'plant = rows.filter(r => !r.charge_line && !r.subhired);',
     'plant = rows.filter(r => !r.charge_line && !r.subhired && !ContractLabour1249.isInstallation(r));'),
    ('labour summary is a priced charge, not a hire period',
     'charge: amt(r), how: ch.get(r).how, basis: ch.get(r).basis, days: ch.get(r).days,',
     "charge: amt(r), how: ContractLabour1249.isInstallation(r)?'charge line':ch.get(r).how, basis: ch.get(r).basis, days: ContractLabour1249.isInstallation(r)?null:ch.get(r).days,"),
    ('detailed branch rows use the same installation category',
     " if (r.charge_line) { const category=contractChargeCategory1224(r);if(category==='installation'||category==='service')",
     " if (r.charge_line||ContractLabour1249.isInstallation(r)) { const category=contractChargeCategory1224(r);if(category==='installation'||category==='service')"),
    ('reviewed labour does not use generator hire month allocation',
     'if(ch.generator1004){if(!GeneratorFinance1004.invoiceMonth)',
     'if(ch.generator1004&&!ContractLabour1249.isInstallation(r)){if(!GeneratorFinance1004.invoiceMonth)'),
    ('monthly Finance retains undated labour explicitly without inventing a work month',
     """ if (r.charge_line) {
 if(r.sourceAddition1224){
  const kind=contractChargeCategory1224(r),category=kind==='installation'?'Labour Install':kind==='service'?'Contract services — ledger allocation pending':'Transport Revenue';
  return unallocated(out.unallocatedRevenue,category,br,amount,what+': combined contract scope has no confirmed split by work month',Object.assign(extra,{contract:r.rental_contract,line:r.line,source:r.sourceAddition1224.source,combinedScope1224:true}));
 }""",
     """ if (r.charge_line||ContractLabour1249.isInstallation(r)) {
 if(r.sourceAddition1224||ContractLabour1249.isInstallation(r)){
  const kind=contractChargeCategory1224(r),category=kind==='installation'?'Labour Install':kind==='service'?'Contract services — ledger allocation pending':'Transport Revenue';
  return unallocated(out.unallocatedRevenue,category,br,amount,what+': combined contract scope has no confirmed split by work month',Object.assign(extra,{contract:r.rental_contract,line:r.line,source:r.sourceAddition1224?.source||'contract export',combinedScope1224:true}));
 }"""),
    ('exclude priced installation from hire rate controls',
     'const open = ONHIRE_ROWS.filter(r => !r.charge_line && !r.subhired && (typeof r.rate_1',
     'const open = ONHIRE_ROWS.filter(r => !r.charge_line && !r.subhired && !ContractLabour1249.isInstallation(r) && (typeof r.rate_1'),
    ('exclude installation from missing hire rate summary',
     ' const open = ONHIRE_ROWS.filter(r => !r.charge_line && !r.subhired && typeof r.rate_1',
     ' const open = ONHIRE_ROWS.filter(r => !r.charge_line && !r.subhired && !ContractLabour1249.isInstallation(r) && typeof r.rate_1'),
    ('Build equipment revenue excludes the same job-level installation charges',
     ' if (r.charge_line && !r.subhired) return;\n const d = PLATE_OF_KIND[r.kind];',
     ' if ((r.charge_line && !r.subhired)||ContractLabour1249.isInstallation(r)) return;\n const d = PLATE_OF_KIND[r.kind];'),
]


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def exact(text, old, new, label, path):
    if text.count(old) != 1:
        raise ValueError(label + ': expected one exact source anchor')
    replacement = rep(old, old, new, label, path)
    if replacement != new:
        raise ValueError(label + ': shared replacement changed its boundary')
    return text.replace(old, replacement, 1)


def source():
    raw = (ROOT / 'contract_labour1249.js').read_bytes()
    if digest(raw) != SOURCE_SHA256:
        raise ValueError('Reviewed v12.49 classification source changed')
    return raw.decode('utf-8')


def reverse(text):
    restored = exact(text, NEW_FOOTER, OLD_FOOTER, 'restore predecessor footer', 'page')
    for label, old, new in reversed(REPLACEMENTS):
        restored = exact(restored, new, old, 'reverse ' + label, 'page')
    restored = exact(restored, source() + '\n' + CLASSIFIER, CLASSIFIER, 'remove classification module', 'page')
    if digest(restored.encode('utf-8')) != REVIEWED_BASE_SHA256:
        raise ValueError('Reversal did not recover the exact reviewed predecessor')
    return restored


def patch(text, path='page', expected_base_sha=None, expected_base_version=None):
    expected = expected_base_sha or os.environ.get('GC500_V1249_BASE_SHA256', '')
    version = expected_base_version or os.environ.get('GC500_V1249_BASE_VERSION', '')
    if 'ContractLabour1249' in text:
        raise ValueError('v12.49 already applied')
    if expected != REVIEWED_BASE_SHA256 or digest(text.encode('utf-8')) != expected:
        raise ValueError('v12.49 requires the explicit exact reviewed predecessor SHA-256')
    if version != REVIEWED_BASE_VERSION or text.count(OLD_FOOTER) != 1:
        raise ValueError('v12.49 predecessor version/footer differs from review')
    changed = exact(text, CLASSIFIER, source() + '\n' + CLASSIFIER, 'add shared labour classifier', path)
    for label, old, new in REPLACEMENTS:
        changed = exact(changed, old, new, label, path)
    changed = exact(changed, OLD_FOOTER, NEW_FOOTER, 'release footer', path)
    if re.findall(r'<style\b[^>]*>[\s\S]*?</style>', changed) != re.findall(r'<style\b[^>]*>[\s\S]*?</style>', text):
        raise ValueError('Classification patch changed styles')
    if reverse(changed) != text:
        raise ValueError('Classification patch changed content outside its reviewed boundaries')
    return changed


if __name__ == '__main__':
    page = Path(sys.argv[1])
    changed = patch(page.read_text(), str(page))
    page.write_text(changed)
    print('v12.49 classification applied; exact predecessor reversal verified')
