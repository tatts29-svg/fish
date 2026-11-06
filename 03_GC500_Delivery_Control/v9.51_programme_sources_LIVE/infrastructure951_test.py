"""Author: Andrew Fisher. Read-only source/data preservation checks."""
import json,sys,hashlib
from pathlib import Path
from infrastructure951 import apply_infrastructure951
source=Path(sys.argv[1]).read_text()
def data(h):return json.JSONDecoder().raw_decode(h.split('const DATA = ',1)[1])[0]
before=data(source);patched=apply_infrastructure951(source, "/nonexistent/build/candidate.html");after=data(patched);review=after.pop('infrastructure_review951')
assert before==after, 'No existing DATA field may change, including schedule/photos/IDs/finance/ops'
assert len(review['rows'])==12 and len({x['reference'] for x in review['rows']})==12
rows={x['reference']:x for x in review['rows']}
for key in ['P10','P11','P12']:assert rows[key]['changes']['J']=={'before':'16th September','after':'17th September'}
for key in ['P52','P54','P55','P56','P57','WC20','WC86','GN18']:
 assert rows[key]['statusAsWritten']=='Complete' and rows[key]['completeDateAsWritten']=='7th October'
assert rows['GN18']['noteAsWritten']=='Dropped but needs to be put into final location'
assert rows['P45']['installStart']=='2026-10-12' and rows['P45']['installEndAsWritten']=='2025-10-12' and rows['P45']['dateHeld']
assert all(not x['operationalCompletionImported'] for x in rows.values())
assert review['programmeCloneSheets']==11 and review['demobUnchanged']
try:apply_infrastructure951(patched)
except ValueError:pass
else:raise AssertionError('Double application must fail')
print(json.dumps({'pass':True,'uniqueChanges':12,'allExistingDataExactlyPreserved':True,'duplicateSheetsNotImported':True,'P45InvalidDateHeld':True,'GN18CaveatRetained':True,'sourceHtmlSha256':hashlib.sha256(source.encode()).hexdigest()}))

try:apply_infrastructure951('missing DATA', '/nonexistent/candidate.html')
except ValueError:pass
else:raise AssertionError('Missing source guard')
