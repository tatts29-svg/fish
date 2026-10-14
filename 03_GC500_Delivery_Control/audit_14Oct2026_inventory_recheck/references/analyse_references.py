"""Author: Andrew Fisher. Reconcile private reference captures without exposing financial records."""
import json
import sys
from pathlib import Path
from collections import Counter, defaultdict

private=Path(sys.argv[1])
output=Path(sys.argv[2])
captured=json.loads((private/'capture.json').read_text())
route=json.loads((private/'exceptional-routes.json').read_text())
meta=json.loads((private/'capture-meta.json').read_text())
rows=captured['rows']; keys={r['key'] for r in rows}; checks=[]
def check(name,passed):
    checks.append({'name':name,'pass':bool(passed)})

check('Every current reference key is unique',len(rows)==len(keys))
for r in rows:
    key=r['key']
    check(key+' resolves through the shared asset reader',r['resolved']==key)
    check(key+' has a supported asset route',r['routeContext'])
    check(key+' occurs once in the reference search index',len(r['index'])==1)
    check(key+' is returned by its exact reference search',any(x.get('key')==key for x in r['exactSearch']))
    check(key+' physical identities stay attached to their reference',all(u.get('ref')==key for u in r['model']['rows']))
    check(key+' described quantities are finite and nonnegative',all(isinstance(q['quantity'],(float,int)) and q['quantity']>=0 for q in r['quantities']))
    expected=defaultdict(float)
    for q in r['quantities']:
        expected[q['item'].strip().casefold()]+=q['quantity']
    shown={q['item'].strip().casefold():q['quantity'] for q in r['mapQuantity']['items']}
    check(key+' typed map label quantities match shared planned quantities',dict(expected)==shown)

excluded=route['context']['excluded']
for r in excluded:
    check(r['key']+' excluded source is explicitly deleted or retained as reachable context',
          (r['deleted'] and not r['resolved']) or (r['context'] and r['resolved']==r['key'] and any(s.get('key')==r['key'] for s in r['search'])))
source_count=sum(len(v) for v in captured['sources'].values())
check('All master, plant and added source rows are reconciled',source_count==len(rows)+len(excluded))
context_keys={r['key'] for r in excluded if r['context']}
for i,r in enumerate(captured['contracts']):
    match=r.get('match') or {}; key=match.get('key') or match.get('task_id')
    if key: check('Explicit contract allocation '+str(i)+' resolves',key in keys)
for i,u in enumerate(captured['units']):
    check('Projected native unit '+str(i)+' has a reference',u.get('ref') in keys)
for i,u in enumerate(captured['index']):
    if u.get('kind')=='unit':check('Indexed unit '+str(i)+' has a supported reference/context',u.get('key') in keys|context_keys)
requests={r['id'] for r in route['context']['supplier'] if r['state']=='missing'}
programme=[r for day in captured['programme'] for kind in ['deliveries','removals'] for r in day[kind]]
for i,r in enumerate(programme):check('Programme reference '+str(i)+' is native or an explicit supplier request',r['ref'] in keys|requests)
for r in route['rows']:check('Rendered route '+r['ref']+' opens with its Back control',r['pass'])
for r in route['viewChecks']:check('Build '+r['day']+' shows its source-only supplier request without an invalid asset link',r['sourceNames'] and not r['links'])
check('Browser navigation leaves the native record unchanged',route['recordUnchanged'])
check('Both browser passes have zero runtime errors',not meta['errors'] and not route['errors'])
check('Both browser passes make zero operational write requests',meta['requests']['blocked']==0 and route['requests']['blocked']==0)

coverage={
 'sourceRows':source_count,'currentReferences':len(rows),'cancelledWithinCurrent':sum(bool(r.get('_cancelled')) for r in rows),
 'contextOnlyReferences':len(context_keys),'deletedSourceRows':sum(r['deleted'] for r in excluded),'searchableReferences':len(keys|context_keys),
 'typedPlannedLines':sum(len(r['quantities']) for r in rows),'contractRowsReviewed':len(captured['contracts']),
 'explicitContractAllocations':sum(bool((r.get('match') or {}).get('key') or (r.get('match') or {}).get('task_id')) for r in captured['contracts']),
 'projectedNativeUnitRows':len(captured['units']),'indexedUnitRows':sum(r.get('kind')=='unit' for r in captured['index']),
 'programmeEntries':len(programme),'sourceOnlySupplierRequests':len(requests),'renderedExceptionalRoutes':len(route['rows']),
 'physicalSourceAliases':len(route['context']['aliases']['aliases']),
}
report={'author':'Andrew Fisher','sha256':meta['sha256'],'nativeVersion':captured['version'],'coverage':coverage,
 'result':{'checks':len(checks),'passed':sum(c['pass'] for c in checks)},'failures':[c for c in checks if not c['pass']],
 'unresolvedData':['T0233 has an old native onsite/completion record but no current reference, unit, map, source task or removal link. Its identity is unverified; no equipment or charge is inferred.'],
 'scope':'Reference and link coverage only. Current-stock/Demob arithmetic and physical map accuracy are separate audit scopes. Historical source-only rows, cancelled rows and drawing contexts are not new onsite units. No source/native/app edits.'}
output.parent.mkdir(parents=True,exist_ok=True);output.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
if report['failures']:raise SystemExit(1)
