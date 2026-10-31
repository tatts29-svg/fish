"""Author: Andrew Fisher. v10.74 - one sub-hire company, Premiair Hire, everywhere on the page.

Andrew, 19 Oct 2026: "Please make sure there is only one premair subhire company. You have mentioned it twice". The page
filed Premiair under two companies: the owner key 'prem-air-hire', shown "PremAir Hire" (the project manager's 8 Oct
spelling), and 'other:premiair', shown "Premiair", because the owner folding knew "premair" and "prem-air" but not
"premiair" with the i, which is how the contract lines spell it. So the Sub-hired tab had two company buttons, the
Equipment strip and the VMS row split the boards across two names, and every sub-hired VMS board recorded on arrival
(VMS11, 18, 19, 20, 23) had two cards in its delivery's drawer, one under each name. Now:
 1-2. owner925 and ownerKey fold every spelling (Premiair, PremAir, Prem-Air, Premiair Hire, Premiair Services Pty Ltd,
      PRE808) into the one key 'prem-air-hire'; the record keeps that key, so no record document changes.
 3-5. the company reads "Premiair Hire" (Andrew's own spelling on 19 Oct) in the unit panels, supplier labels and VMS10.
 6.   the VMS register names every Premiair board "Premiair Hire", VMS24 (supplier PRE808) included.
 7.   one board, one card: the arrival record of a sub-hired VMS board with the register's company and fleet number is
      that board, not a second unit. Coates boards are left as they are (folding them changes revenue; Andrew's call).
 8.   the supplier cost estimate recognises "Premiair" and "Premiair Hire" as PRE808.
 9.   the VMS plan's own note says Premiair Hire.
The Costs rows keep the ledger name PREMIAIR SERVICES PTY LTD (PRE808). "Team Office Premiair Racing" is a race team and
is not touched. Footer v10.73 -> v10.74.

    python3 patch_v1074.py page.html      (in place, on the live v10.73 page)
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

FOLD = "/^(prem-?air|premi-?air)(-hire|-services(-pty-ltd)?)?$/"
MERGE = " /* v10.74 - one board, one card: an identified record of a sub-hired VMS board with the register's company and fleet number is that board, not a second unit */\n rows.filter(r=>r.source==='identified'&&r.physical&&r.assetNo).forEach(r=>{const i=rows.findIndex(x=>x.source==='native'&&x.physical&&!x.metadata&&x.owner!=='coates'&&/^vms:/.test(x.nativeId||'')&&x.owner===owner925(r.owner)&&x.assetNo===trim(r.assetNo));if(i<0)return;rows[i]=Object.assign({},rows[i],{metadata:r.metadata,docKey:r.docKey,note:r.note||rows[i].note,mergedId1074:r.id});rows.splice(rows.indexOf(r),1);});\n"
EDITS = [
 ("if(/^(prem-air|premair)(-hire)?$/.test(s))return 'prem-air-hire';",
  "if(" + FOLD + ".test(s)||s==='pre808')return 'prem-air-hire';", 'v10.74 owner925 folds every Premiair spelling'),
 ("if(n==='premair'||n==='prem-air'||n==='prem-air-hire'||n==='premair-hire')return 'prem-air-hire';",
  "if(" + FOLD + ".test(n)||n==='pre808')return 'prem-air-hire';", 'v10.74 ownerKey folds every Premiair spelling'),
 ("'prem-air-hire':'PremAir Hire','unknown':'Owner to confirm'", "'prem-air-hire':'Premiair Hire','unknown':'Owner to confirm'", 'v10.74 company925 name'),
 ("'prem-air-hire':'PremAir Hire','unknown':'Supplier to confirm'", "'prem-air-hire':'Premiair Hire','unknown':'Supplier to confirm'", 'v10.74 supplier label'),
 ("VMS10: {co: 'PremAir Hire',", "VMS10: {co: 'Premiair Hire',", 'v10.74 VMS10 company'),
 (" if (/premi\\s?air/i.test(d)) return 'Premiair';",
  " if (/prem\\s?i?\\s?air/i.test(d) || /^PRE808$/i.test(String((r && r.supplier_sub_rental) || ''))) return 'Premiair Hire';", 'v10.74 VMS register company'),
 (" const duplicates=new Map(),fleets=new Map();rows.filter(r=>r.physical)",
  MERGE + " const duplicates=new Map(),fleets=new Map();rows.filter(r=>r.physical)", 'v10.74 one board, one card'),
 ('"supplierAliases":["PremAir","PremAir Hire","Premiair Services Pty Ltd"]',
  '"supplierAliases":["PremAir","PremAir Hire","Premiair","Premiair Hire","Premiair Services Pty Ltd"]', 'v10.74 PRE808 aliases'),
 ('a rehire unit from Premiair that came down with the accessible toilet (PremAir fleet 120T, rego V14221 on the register)',
  'a rehire unit from Premiair Hire that came down with the accessible toilet (Premiair Hire fleet 120T, rego V14221 on the register)', 'v10.74 VMS plan note'),
]

def main():
    path = sys.argv[1]; t = open(path, encoding='utf-8').read()
    if 'mergedId1074' in t or "'prem-air-hire':'Premiair Hire'" in t: sys.exit('patch_v1074 refuses a repeat')
    if "+ ' · v10.73'" not in t: sys.exit('patch_v1074 needs the live v10.73 page')
    for old, new, what in EDITS: t = rep(t, old, new, what, path)
    t = rep(t, "+ ' · v10.73'", "+ ' · v10.74'", 'footer', path)
    open(path, 'w', encoding='utf-8').write(t)
    print('patch_v1074 applied: one Premiair Hire, one card per sub-hired board; footer v10.73 -> v10.74')

if __name__ == '__main__':
    main()
