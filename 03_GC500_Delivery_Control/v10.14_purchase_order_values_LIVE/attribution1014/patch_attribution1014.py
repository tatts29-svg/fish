"""Author: Andrew Fisher. Preserve one reviewed task link after its signed quantity correction."""
from pathlib import Path
import hashlib,json,re,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

# Exact existing review row: changing any other source/task fact requires a fresh review.
EXPECTED_ROW_SHA='d9c5d4fec63d12e84ae6fe81e8d8bc4a1eb97f0aa9135abe012df530e371ec13'

def apply(html):
    marker='<script id="docket-attribution1014-script">'
    if marker in html:raise ValueError('Docket attribution correction already applied')
    if '<script id="supplier-pricing1014-script">' not in html:raise ValueError('Supplier pricing release must be applied first')
    m=re.search(r'const FENCE_PROGRAMME958 = (\{[^\n]+\});',html)
    if not m:raise ValueError('Reviewed programme catalogue missing')
    data=json.loads(m.group(1));rows=[r for r in data['rows'] if r.get('record_id')=='F-AFV-0035' or r.get('docket_no')=='36592']
    if len(rows)!=1:raise ValueError('Reviewed docket identity changed')
    row=rows[0]
    canonical=json.dumps(row,sort_keys=True,separators=(',',':'),ensure_ascii=False)
    if hashlib.sha256(canonical.encode()).hexdigest()!=EXPECTED_ROW_SHA:raise ValueError('Reviewed source/task basis changed')
    if row['attribution']['target_id']!='cw1-51' or row['attribution']['allowance']!={'clean':135,'v_gates':1}:raise ValueError('Original task allowance changed')
    runtime='''
const reviewedDocketAttribution1014=BASELINE;
const docketAttributionBefore1014=fenceProgrammeReviews958;
fenceProgrammeReviews958=function(records,options={}){
 const current=options.catalogue||FENCE_PROGRAMME958;
 return docketAttributionBefore1014(records,{...options,catalogue:DocketAttribution1014.catalogue(records,current,reviewedDocketAttribution1014)});
};
'''.replace('BASELINE',json.dumps(row,separators=(',',':'),ensure_ascii=False))
    script=marker+'\n'+(HERE/'docket_attribution1014.js').read_text()+runtime+'\n</script>\n'
    return rep(html,'</body>\n</html>',script+'</body>\n</html>','Preserve exact reviewed docket attribution','docket attribution v10.14')
