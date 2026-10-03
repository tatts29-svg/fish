#!/usr/bin/env python3
"""Author: Andrew Fisher. Compose verified cleanup on the reviewed staffing component."""
import hashlib
import os
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep
from interaction_cleanup834 import apply as interactions
from map_provenance834 import apply as provenance
from cost_dedup834 import apply_patch as cost_model
from pricing_presentation834 import apply_patch as pricing_basis
from map_landscape834 import apply as landscape
from staff_type834 import apply_patch as staff_type

REVIEWED_BASES = {
 '61250dee267029ee9323b413a1955ca6fc28c01d131a46a8d8b75987dcbf6430',
 '37f7656c1125519cccbd57341cbbf085a7e4b485db16071249d7e4063c887c6f',
}

def build(raw, expected):
 if expected not in REVIEWED_BASES or hashlib.sha256(raw).hexdigest() != expected:
  raise ValueError('Expected exact reviewed staffing component')
 text=raw.decode('utf-8')
 if 'function eventStaffing833(' not in text or 'function pricingAction834(' in text:
  raise ValueError('Wrong source markers or repeated cleanup')
 text=interactions(text)
 text=provenance(text)
 text=cost_model(text)
 text=pricing_basis(text)
 text=landscape(text)
 text=staff_type(text)
 text=rep(text, "Event crew — planned cover and wage gaps", "Event crew and costs", "Plain event section title", "v8.34")
 text=rep(text, '<p class="sub">Edit people, pay rates and shifts in the existing running sheet. An unknown wage or supplier price is not a zero cost.</p>', '<p><a class="btn" href="#runsheet">Open running sheet</a></p><p class="sub">Edit people, pay rates and shifts there. Unknown wages and supplier prices remain unpriced.</p>', "Direct access to the existing running sheet", "v8.34")
 text=rep(text, '<meta name="gc500-release" content="v8.33">', '<meta name="gc500-release" content="v8.34">', 'Release metadata', 'v8.34')
 text=rep(text, "+ ' · v8.33'; /* v8.19 - the footer names the release once */", "+ ' · v8.34'; /* v8.19 - the footer names the release once */", 'Release footer', 'v8.34')
 return text.encode('utf-8')

if __name__ == '__main__':
 if len(sys.argv)!=2: raise SystemExit('Usage: patch_v834.py WORKING_COPY.html')
 expected=os.environ.get('GC500_V834_BASE_SHA256')
 if not expected: raise SystemExit('Reviewed staffing intermediate SHA-256 required')
 p=Path(sys.argv[1]);p.write_bytes(build(p.read_bytes(),expected))
 print('Guarded staffing and cleanup composition applied; operational records unchanged.')
