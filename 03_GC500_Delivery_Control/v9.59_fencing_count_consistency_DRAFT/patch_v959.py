# Author: Andrew Fisher
from pathlib import Path
import json,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert 'function fenceMeasuredCcb959' not in s,'v9.59 is already applied'
assert 'const FENCE_PROGRAMME958 =' in s and " · v9.58'; /* v8.19" in s,'Requires v9.58 base'
def change(a,b,n):
 global s
 s=rep(s,a,b,n,str(p))
def js(value):
 # Exact source fingerprints must survive the standard visible-attribution scrub.
 # Keep the JSON value; encode its leading character only in source text.
 return json.dumps(value,ensure_ascii=True,separators=(',',':')).replace('</','<\\/').replace('Andrew Fisher',r'\u0041ndrew Fisher')
cat=json.loads((HERE/'counts959.json').read_text())
change('function fenceCcbReview847(record, options) {','const FENCE_COUNTS959 = '+js(cat)+';\n'+(HERE/'counts959.js').read_text()+'\nfunction fenceCcbReview847(record, options) {','measured CCB source evidence')
change('  if (!quantity) return result;','  if (!quantity) return fenceMeasuredCcb959(record, options) || result;','keep measured but unclassified metres')
change('pendingMetres:0, pendingCount:0, rows:[]','pendingMetres:0, pendingCount:0, unallocatedMetres:0, evidencePending:false, rows:[]','separate unallocated CCB quantity')
change('    result.rows.push(review);\n    for (const key of types)',"    result.rows.push(review);\n    if (review.measuredUnclassified) { result.unallocatedMetres += review.quantity; result.evidencePending ||= !review.quantityKnown; }\n    for (const key of types)",'shared measured pending CCB count')
change('  result.pendingMetres = Math.round(result.pendingMetres * 100) / 100;','  result.pendingMetres = Math.round(result.pendingMetres * 100) / 100;\n  result.unallocatedMetres = Math.round(result.unallocatedMetres * 100) / 100;','round shared unallocated length')
# The existing detail reader and overview consume the same measured quantity.
a=s.index('function todayLinkedFencing844(');b=s.index('function ',a+10)
# Limit edits to the complete top-level helper, ending at the next release comment.
b=s.index('\n/* Author:',a)
part=s[a:b]
part=part.replace("const allowed = ['clean','scrim','v_gates','ped_gates','ccb_event','ccb_demarc','relocation','removal','fence_blocks','labour'];","const allowed = ['ccb_unclassified', ...FCOL.filter(column => ['m','each','h','hr'].includes(column.unit)).map(column => column.key)];")
part=part.replace("const column = matches.length === 1 ? matches[0] : null;","const column = matches.length === 1 ? matches[0] : id === 'ccb_unclassified' ? {key:id,unit:'m',programme_type:null} : null;")
part=part.replace("const quantity = number((docket.quantities || {})[column.key]);","const measured = id === 'ccb_unclassified' ? fenceMeasuredCcb959(docket,{records}) : null;\n    const quantity = id === 'ccb_unclassified' ? measured?.quantityKnown ? measured.quantity : null : number((docket.quantities || {})[column.key]);")
change(s[a:b],part,'source drilldowns include flat feet and measured unclassified CCB')
change("fmtQty(sum('ccb_event')+sum('ccb_demarc')+sum('flat_feet'),'m')","fmtQty(fenceCcbRecorded959(),'m')",'Fencing overview includes measured unclassified CCB once')
change("fmtQty(Math.round((sum('ccb_event') + sum('ccb_demarc') + sum('flat_feet')) * 10) / 10, 'm')","fmtQty(fenceCcbRecorded959(usable), 'm')",'legacy Fencing overview shares CCB count')
# Original physical-operation engine retains its exact current-record, source-file and red-overlap guards.
start=s.index('const FENCE_PROGRESS848 = ');end=s.index('\n',start)
old=s[start:end];progress=json.loads(old[len('const FENCE_PROGRESS848 = '):].rstrip(';'))
add=json.loads((HERE/'progress959.json').read_text());ids={r['id'] for r in progress['sources']}
for source in add['sources']:
 if source['id'] not in ids:progress['sources'].append(source);ids.add(source['id'])
 else:assert next(r for r in progress['sources'] if r['id']==source['id'])['sha256']==source['sha256']
progress['operations'].extend(add['operations'])
change(old,'const FENCE_PROGRESS848 = '+js(progress)+';','reviewed physical service work')
# Scope definition remains explicit for existing categories and includes every later programme column.
a=s.index('function todayFencingSummary848(asOf)');b=s.index('function todayWorkSummary848(',a)
part=s[a:b];assert part.count('  const definitions = [')==1
part=part.replace('  const definitions = [','  const definitions = fenceProgrammeDefinitions959([').replace("Demob is excluded.'}\n  ];","Demob is excluded.'}\n  ]);")
assert '  ]);' in part
part=part.replace("evidence.pending.some(pending => pending.type === row.id || !pending.type)","evidence.pending.some(pending => pending.type === row.id || !pending.type) || ['ccb_event','ccb_demarc'].includes(row.id) && result.classification.evidencePending")
part=part.replace("  if (health.stale) result.issues.push(health.basis + '.');", "  if (result.classification.unallocatedMetres > 0 || result.classification.evidencePending) {\n    const row=empty({id:'ccb_unclassified',label:'Crowd control · category unconfirmed',unit:'m',kind:'recorded-only',note:'Measured CCB work is included once in the shared Event/Demarcation range, with no category or price inferred.'});\n    row.recorded=result.classification.evidencePending ? null : result.classification.unallocatedMetres; row.missing=result.classification.evidencePending; row.evidencePending=result.classification.evidencePending; row.comparison='Recorded only · shared pending CCB quantity';\n    row.issues.push(row.note); result.summaryRows.push(row);\n  }\n  if (health.stale) result.issues.push(health.basis + '.');")
change(s[a:b],part,'complete programme categories and unclassified reading')
change("['brace', 'Braces / stays'], ['wheels', 'Gate wheels'], ['cc_barrier', 'Crowd-control barriers']","['brace', 'Braces / stays'], ['wheels', 'Gate wheels'], ['cc_barrier', 'Crowd-control barriers'], ['flat_feet_ccb', 'Flat-feet crowd-control barriers']",'flat-feet piece count')
change("id === 'cc_barrier' ? work.ccb_event > 0 || work.ccb_demarc > 0 : false)","id === 'cc_barrier' ? work.ccb_event > 0 || work.ccb_demarc > 0 : id === 'flat_feet_ccb' ? work.flat_feet > 0 : false)",'flat-feet component applicability')
change("  const ids = ['clean', 'scrim', 'ccb_event', 'ccb_demarc', 'relocation', 'removal'];","  const ids = [...new Set(fenceProgrammeDefinitions959([]).filter(row => row.unit === 'm').map(row => row.id))];",'overall denominator follows all programme metre types')
change("if (rows.some(matches => matches.length !== 1)) { result.issues.push('All six work types need one unique current reading.');", "if (!ids.length || rows.some(matches => matches.length !== 1)) { result.issues.push('Every programme metre type needs one unique current reading.');",'future-proof complete scope')
change("  let low = other.reduce((sum,row) => sum + Math.min(row.done,row.total), 0), high = low;","  let low = other.reduce((sum,row) => sum + Math.min(row.done,row.total), 0), high = low;\n  const unallocated = fencing.classification?.unallocatedMetres || 0;\n  if (!number(unallocated) || unallocated < 0 || fencing.classification?.evidencePending) { result.issues.push('Measured unclassified CCB evidence requires review.'); return result; }",'protect unknown measured CCB evidence')
change('Math.abs(event.done + demarc.done - E - D - P)','Math.abs(event.done + demarc.done + unallocated - E - D - P)','shared pending arithmetic counts unallocated once')
change('  const recorded = current.reduce((sum,row) => sum + row.done,0);','  const recorded = current.reduce((sum,row) => sum + row.done,0) + unallocated;','overall measured CCB counted once')
change(" · v9.58'; /* v8.19"," · v9.59'; /* v8.19",'footer')
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
