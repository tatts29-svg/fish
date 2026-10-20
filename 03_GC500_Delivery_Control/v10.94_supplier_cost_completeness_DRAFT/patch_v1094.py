#!/usr/bin/env python3
"""Author: Andrew Fisher. Supplier hire and completeness, exact v10.93 predecessor."""
import pathlib,sys,hashlib
ROOT=pathlib.Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT))
sys.path.insert(0,str(ROOT.parent/'toolchain'))
from rep import rep
from installer_order1094 import apply as apply_current_team1094
from quantity_identity1094 import apply as apply_quantity_identity1094
BASE = "e07f45f9a9309e7cb5d20f59cb17b13222bbd9ed64285f163280457f8139e4b2"

def replace_once(s,old,new):
    n=s.count(old)
    if n!=1: raise ValueError(f'Expected one match; got {n}: {old[:90]}')
    at=s.index(old)
    bounded='@@V1094_BEGIN@@'+old+'@@V1094_END@@'
    replacement=rep(bounded,bounded,new,'v10.94 exact isolated replacement','page.html',True)
    if replacement!=new: raise ValueError('Shared replacement changed the exact replacement boundary')
    return s[:at]+replacement+s[at+len(old):]

def patch(s, path="page.html"):
    if hashlib.sha256(s.encode()).hexdigest()!=BASE: raise ValueError("Exact verified v10.93 predecessor hash required")
    if 'data-supplier-cost1094' in s: raise ValueError('v10.94 is already applied')
    if ' · v10.93' not in s: raise ValueError('Exact v10.93 predecessor required')
    s=replace_once(s," const model=()=>heldMemo('supplier955Forecast',()=>{"," const originalModel1094=()=>heldMemo('supplier955Forecast',()=>{")
    s=replace_once(s," const words=f=>{f=f||model();return f.state==='estimate'?",
        " const model=()=>supplierForecast1094(originalModel1094());\n const words=f=>{f=f||model();return f.includedCurrentHire1094?supplierForecastWords1094(f):f.state==='estimate'?")
    s=replace_once(s," return {source,coverage,calculate,model,words,month,gap,owner,ownerForRow,ownerWords,ownerHtml};",
        " return {source,coverage,calculate,model,originalModel1094,words,month,gap,owner,ownerForRow,ownerWords,ownerHtml};")
    s=replace_once(s,"function transport953SupplierGap(gap){",ROOT.joinpath('supplier_hire1094.js').read_text()+"\nfunction transport953SupplierGap(gap){")
    s=replace_once(s,'function rh766Model(){ return heldMemo',ROOT.joinpath('supplier_cost_status1094.js').read_text()+'\nfunction rh766Model(){ return heldMemo')
    old="costState:RH.costComplete1068===false?'Full supplier cost unavailable; '+supplierKnownWords1068(RH.knownCost1068):RH.cost==null?'not on the record':RH.approved?'supplier cost estimate — not an invoice':'supplier cost estimate; awaiting approval'"
    s=replace_once(s,old,'costState:epCostStatus1094Label()')
    s=replace_once(s,"Servicing cost follows the site count at supplier rates; other quoted costs and the costing branch are unchanged. Quote coverage is not allocated to individual units.",
        "Confirmed received supplier hire and site-count servicing use established supplier rates. Explicitly excluded quote-only items are removed from current supplier costs; fixed allowances remain estimates. The costing branch and customer charges are unchanged.")
    for old,new in [
        ('— servicing on the site count at supplier rates; other quoted lines unchanged.',
         '— current received hire and site-count servicing at supplier rates; excluded quote-only scope removed and fixed allowances retained.'),
        ('Supplier servicing cost follows the site count at quoted rates; other quoted costs retain their scope. No unit allocation is inferred here.',
         'Supplier hire follows confirmed receipts and servicing follows the site count, at established quote rates. Explicit quote-only exclusions are applied; fixed allowances remain estimates.'),
        ('and supplier cost estimates (site servicing quantities; other quote lines unchanged)',
         'and supplier cost estimates (confirmed received hire, site-count servicing and retained fixed allowances)'),
        (' · servicing uses the site count; other quote lines unchanged · ',
         ' · current supplier hire scope and site-count servicing; retained fixed allowances · '),
        ('servicing uses the site count at supplier rates, other quote lines unchanged; no invoice yet',
         'current hire scope and site-count servicing use supplier rates; fixed allowances retained; no invoice yet'),
        ('servicing uses our site quantities; other quoted costs are retained.',
         'confirmed received hire and servicing use our site quantities and established supplier rates; explicitly excluded quote-only items are removed from current costs.'),
    ]:
        s=replace_once(s,old,new)
    s=replace_once(s,'${epScopeHtml870()}${q}','${epScopeHtml870()}${epCostStatus1094Html()}${q}')
    s=replace_once(s,'<h3>Event Portables</h3><div class="supplier996-facts">',"<h3>Event Portables</h3>'+epCostStatus1094Html()+'<div class=\"supplier996-facts\">")
    old="gap('Event Portables — invoice and PO reconciliation', transport953QuoteWords()+'; approved quotes remain provisional. Confirm invoice and PO coverage against the delivered quantities.', 'Andrew — Event Portables');"
    new="gap('Event Portables — invoice and PO documents', epCostStatus1094Model().label+'. '+transport953QuoteWords()+'; reconcile invoice and PO coverage against delivered quantities. This is a documentary check, separate from the recorded supplier rates and cost estimates.', 'Andrew — Event Portables');"
    s=replace_once(s,old,new)
    s=apply_quantity_identity1094(s)
    s=apply_current_team1094(s,path=path)
    s=replace_once(s,' · v10.93',' · v10.94')
    return s

if __name__=='__main__':
    if len(sys.argv) not in (2,3): raise SystemExit('Usage: patch_v1094.py INPUT.html [OUTPUT.html]')
    source=pathlib.Path(sys.argv[1]); target=pathlib.Path(sys.argv[2]) if len(sys.argv)==3 else source
    target.write_text(patch(source.read_text(),str(source)))
