# Author: Andrew Fisher. Visible commercial labels; ledger codes and calculations preserved.
def apply_terminology978(s, rep):
 pairs=[
 ("hInvT = (H.inv || []).find(r => /^Transport/.test(r.branch)) || {}", "hInvT = (H.inv || []).find(r => /^Transport/.test(r.branch)) || {toCome:H.transportForecast978}"),
 ("Customer charges · arrived equipment","Charges to V8 Supercars · arrived equipment"),
 ("Customer charges","Charges to V8 Supercars"),
 ("label:'Customer revenue'","label:'Charges to V8 Supercars'"),
 ("label:'Supplier cost',recorded:cost","label:'Advanced Fencing subcontract cost',recorded:cost"),
 ("<h3>Customer revenue</h3>","<h3>Charges to V8 Supercars</h3>"),
 ("label:'Total revenue'","label:'Total charges to V8 Supercars'"),
 ("<h3>Direct costs · ledger lines</h3>","<h3>Coates direct costs · ledger lines</h3>"),
 ("label:'Direct costs',recorded:P.direct","label:'Coates direct costs',recorded:P.direct"),
 ("<h3>Overheads and wages</h3>","<h3>Coates overheads and wages</h3>"),
 ("Paid to Advanced on the dockets · Rehire + Installation (external contractors)","Advanced Fencing subcontract cost · recorded dockets"),
 ("Paid to Advanced — known so far","Advanced Fencing subcontract cost — recorded"),
 ("Paid to Advanced · Rehire + Installation (external contractors)","Advanced Fencing subcontract cost · recorded dockets"),
 ("<p class=\"fin745-eyebrow\">REHIRE BY BRANCH</p>","<p class=\"fin745-eyebrow\">SUBHIRE AND SUBCONTRACT · BY BRANCH</p>"),
 ("<h2>Rehire by branch</h2>","<h2>Subhire and subcontract · by branch</h2>")
 ]
 for old,new in pairs:
  count=s.count(old)
  if not count: continue
  # Each supplied occurrence is replaced through the shared exact-one helper.
  for i in range(count):
   idx=s.index(old); a=max(0,idx-100); b=idx+len(old)+100
   chunk=s[a:b]
   s=rep(s,chunk,chunk.replace(old,new,1))
 return s
