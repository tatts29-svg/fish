#!/usr/bin/env python3
"""Author: Andrew Fisher. Strict sequential read-only browser suites for the v8.15 review candidate.

Run from any directory: python3 standing815_runs.py [--prepare-only] [--only name,name]
Default candidate/base are build/GC500_v8.15-audit-e540cbc. --prepare-only launches no browser.
Raw records/screenshots stay in --out (default /workspace/private-review-e540cbc/standing).
Historical source/evidence is never edited. Every run, exit, FAIL line and JSON assertion is assessed.
"""
from pathlib import Path
import argparse, hashlib, json, os, re, signal, subprocess, sys
EVIDENCE=Path(__file__).resolve().parent
PROJECT=EVIDENCE.parent.parent
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--page',type=Path,default=PROJECT/'build/GC500_v8.15-audit-e540cbc/GC500_Delivery_Control_hosted.html')
parser.add_argument('--base',type=Path,default=PROJECT/'build/GC500_v8.15-audit-e540cbc/base_live.html')
parser.add_argument('--out',type=Path,default=Path('/workspace/private-review-e540cbc/standing'))
parser.add_argument('--report-dir',type=Path,default=EVIDENCE,help='Separate evidence directory for a changed candidate; preserves earlier runs.')
parser.add_argument('--only',default='')
parser.add_argument('--prepare-only',action='store_true')
parser.add_argument('--timeout',type=int,default=1200)
a=parser.parse_args(); PAGE=a.page.resolve();BASE=a.base.resolve();OUT=a.out.resolve();OUT.mkdir(parents=True,exist_ok=True)
REPORT=a.report_dir.resolve();REPORT.mkdir(parents=True,exist_ok=True)
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
SPECS=[
 ('packed_desktop','v7.95_today_packed_DRAFT/evidence/packed_tests.js',False,20),
 ('packed_phone','v7.95_today_packed_DRAFT/evidence/packed_tests.js',True,14),
 ('equipment_desktop','v7.96_equipment_tab_LIVE/evidence/equipment_tests.js',False,22),
 ('equipment_phone','v7.96_equipment_tab_LIVE/evidence/equipment_tests.js',True,22),
 ('rules','v7.84_ways_in_from_andrew_LIVE/evidence/rules_tests.js',False,45),
 ('fresh_after_save','v7.75_fresh_after_a_save_LIVE/evidence/fresh_after_save_tests.js',False,11),
 ('today_desktop','v7.99_today_faster_fuller_LIVE/evidence/v799_tests.js',False,23),
 ('today_phone','v7.99_today_faster_fuller_LIVE/evidence/v799_tests.js',True,18),
 ('results_desktop','v7.99_today_faster_fuller_LIVE/evidence/results796_tests.cjs',False,9),
 ('results_phone','v7.99_today_faster_fuller_LIVE/evidence/results796_tests.cjs',True,9),
 ('one_tab_desktop','v7.93_one_tab_today_DRAFT/evidence/one_tab_tests.js',False,24),
 ('one_tab_phone','v7.93_one_tab_today_DRAFT/evidence/one_tab_tests.js',True,24),
 ('same_figures','v7.99_today_faster_fuller_LIVE/evidence/same_figures.js',False,7),
 ('sweep_desktop','toolchain/harness/sweep.js',False,21),
 ('sweep_phone','toolchain/harness/sweep.js',True,21),
]
requested=set(a.only.split(',')) if a.only else {s[0] for s in SPECS}
assert requested <= {s[0] for s in SPECS}, 'Unknown suite requested'
report={'author':'Andrew Fisher','pageSha256':sha(PAGE),'baseSha256':sha(BASE),'sequential':True,'requiredRuns':[s[0] for s in SPECS],'requestedRuns':[s[0] for s in SPECS if s[0] in requested],'runs':[],'complete':False}
COPIES=REPORT/'runner_sources';COPIES.mkdir(exist_ok=True)

def replace_once(s,old,new):
 assert s.count(old)==1,'Adaptation anchor is not unique: '+old[:90]
 return s.replace(old,new)

def prepare(spec):
 name,relative,mob,minimum=spec;original=PROJECT/relative;s=original.read_text();changes=[]
 if name.startswith('today_'):
  s=replace_once(s,"a.ctrlP === b.ctrlP && a.report === b.report","b.ctrlP > 0 && b.ctrlP <= a.ctrlP && a.report === b.report")
  s=replace_once(s,"paper has as many pages as live: Ctrl+P on Today and the A4 report","Today paper is no longer than live; the A4 report keeps its page count")
  changes.append('Only Today Ctrl+P may shorten; A4 report page-count equality retained.')
 if name.startswith('one_tab_'):
  s=replace_once(s,"const bd = document.getElementById('showBackdrop'); const open = !!bd && getComputedStyle(bd).display !== 'none' && bd.getClientRects().length > 0;", "const bd = document.getElementById('showcase'), back = document.getElementById('showBack'); const open = SHOW.open === true && !!bd && !bd.hidden && bd.getAttribute('role') === 'dialog' && bd.getAttribute('aria-modal') === 'true' && document.body.classList.contains('showing') && getComputedStyle(bd).display !== 'none' && getComputedStyle(bd).visibility !== 'hidden' && bd.getClientRects().length > 0 && bd.getBoundingClientRect().width > 0 && bd.getBoundingClientRect().height > 0 && !!back.getClientRects().length && bd.contains(document.activeElement);")
  changes.append('Assert the actual #showcase modal, open state, dimensions, Back and focus; #showBackdrop is an optional selector intentionally hidden behind phone Options.')
  s=replace_once(s,"L.fencingCard && !L.costsCard","!L.fencingCard && !L.costsCard")
  s=replace_once(s,"Today\\'s Fencing card stays (its dockets, quote and week lines are on no other card); Costs card left off","Today\\'s authorised Fencing removal holds; Costs card remains left off")
  s=replace_once(s,"ok('roads card sits with the cards', L.roadsInCards, L.cards);","ok('authorised roads card removal holds', !L.roadsInCards, L.cards);")
  s=replace_once(s,"pp.querySelectorAll('.dsn > h3.sec')].filter(vis)","pp.querySelectorAll('.dsn > h3.sec, .dsn > details.fold95 > h3.sec')]")
  s=replace_once(s,"const rest = rep.filter(x => !/^\\$[\\d,]+ -> Fencing \\[T\\]/.test(x) || x.split('|').length > 2);","const rest = rep;")
  changes.extend(['Fencing and roads presence replaced with authorised absence; Costs absence retained.','Section-presence selector includes established fold headings; none of the required headings waived.','Obsolete Today Fencing duplicate exception removed; all remaining duplicates still fail.'])
 if name=='same_figures':
  old="document.querySelectorAll('#pane-' + t + ' details').forEach(d => { d.open = true; }); return document.getElementById('pane-' + t).innerText"
  new="""document.querySelectorAll('#pane-' + t + ' details').forEach(d => { d.open = true; });
      if (t === 'today') { const removed = /^(?:Map|Documents|Fencing|Your records|Next programme day|Programme|Also on the schedule.*|Roads between.*)$/;
        document.querySelectorAll('#pane-today > .hub > .card, #pane-today > .todaycols .card').forEach(c => { const h=c.querySelector('h3'); if(h && removed.test(h.textContent.trim())) c.remove(); }); }
      return document.getElementById('pane-' + t).innerText"""
  s=replace_once(s,old,new)
  changes.append('Compare retained Today text after removing only authorised removed cards from both snapshots; all six destination tabs still exact.')
 if name=='trimmed':
  s=replace_once(s,"const BUILD = path.join(ROOT, 'build/GC500_v8.15-audit-e540cbc/GC500_Delivery_Control_hosted.html');","const BUILD = process.env.PAGE;")
  s=replace_once(s,"const BASE = path.join(ROOT, 'build/GC500_v8.15-audit-e540cbc/base_live.html');","const BASE = process.env.BASE;")
  changes.append('Candidate/base supplied by exact runner arguments.')
 prefix='// Author: Andrew Fisher. Isolated inherited suite; original source remains unchanged.\n'
 prefix+='__dirname = '+json.dumps(str(original.parent))+';\nrequire = require("node:module").createRequire('+json.dumps(str(original))+');\n'
 copy=COPIES/(name+'.cjs');copy.write_text(prefix+s)
 subprocess.run(['node','--check',str(copy)],check=True,stdout=subprocess.DEVNULL)
 return {'name':name,'source':relative,'sourceSha256':sha(original),'adaptedSha256':sha(copy),'adaptations':changes,'mobile':mob,'minimumAssertions':minimum,'file':str(copy)}

manifest=[prepare(s) for s in SPECS]
(REPORT/'standing815_sources.json').write_text(json.dumps({'author':'Andrew Fisher','sources':manifest},indent=2)+'\n')
if a.prepare_only:
 print('Prepared and syntax-checked '+str(len(manifest))+' sequential suites; no browser launched.');sys.exit(0)

def frozen():
 assert sha(PAGE)==report['pageSha256'],'Candidate changed during checks'
 assert sha(BASE)==report['baseSha256'],'Base changed during checks'
 for m in manifest: assert sha(PROJECT/m['source'])==m['sourceSha256'] and sha(m['file'])==m['adaptedSha256'],'Suite source changed: '+m['name']

def assess(m,code,log,result,harness):
 txt=log.read_text();fail_lines=[x for x in txt.splitlines() if re.match(r'^\s*(?:FAIL\b|DIFF\b|[1-9]\d* FAILED\b)',x)]
 item={k:m[k] for k in ('name','source','sourceSha256','adaptedSha256','adaptations')};item.update(exitCode=code,failLines=fail_lines,pass_=False)
 runlog=json.loads(harness.read_text()) if harness.exists() else {'errors':['Harness report missing'],'consoleErrors':[],'opened':0,'closed':0}
 item['pageErrors']=runlog['errors'];item['consoleErrors']=runlog['consoleErrors'];item['contextsOpened']=runlog['opened'];item['contextsClosed']=runlog['closed']
 good=code==0 and not fail_lines and not item['pageErrors'] and not item['consoleErrors'] and runlog['opened']>0 and runlog['opened']==runlog['closed']
 if m['name'].startswith('sweep_'):
  raw=json.loads(txt.strip().splitlines()[-1]);result.write_text(json.dumps(raw,indent=2)+'\n')
  redirects={'register':('#plant','Equipment'),**{k:('#today','Today') for k in ('journal','breakdowns','variances','edit','add')}}
  tabs_good=all(not v.get('goerr') and not v.get('errors') and not v.get('console') and (v.get('shown') or (k in redirects and (v.get('hash'),v.get('active'))==redirects[k])) for k,v in raw['tabs'].items())
  targets={'#timeline':'pane-timeline','#day/2026-09-28':'pane-timeline','#change/2026-09-28':'pane-change','#print/drivers/2026-09-28':'pane-timeline','#sheet/__satellite3d':'pane-map','#plant':'pane-plant','#today':'pane-today'}
  links_good=set(raw['hashes'])==set(targets) and all(v.get('pane')==targets[k] and not v.get('errors') for k,v in raw['hashes'].items())
  good=good and len(raw['tabs'])==21 and tabs_good and links_good and raw.get('back')=={'hash':'#plant','pane':'pane-plant'} and not raw.get('allErrors') and not raw.get('cons')
  item.update(tabs=len(raw['tabs']),links=len(raw['hashes']))
 elif m['name']=='same_figures':
  same=re.findall(r'^SAME (\w+) ',txt,re.M);good=good and set(same)=={'today','costs','fencing','questions','coatesway','runsheet','plant'} and 'every line on every tab matches live' in txt
  item.update(passed=len(same),total=7)
 elif m['name']=='trimmed':
  n=len(re.findall(r'^PASS ',txt,re.M));good=good and n>=m['minimumAssertions'] and 'ALL PASSED' in txt;item.update(passed=n,total=n+len(fail_lines))
 else:
  raw=json.loads(result.read_text());tests=raw if isinstance(raw,list) else raw.get('tests',raw.get('results',[]));n=sum(bool(t.get('pass')) for t in tests)
  good=good and len(tests)>=m['minimumAssertions'] and n==len(tests) and not (raw.get('errors',[]) if isinstance(raw,dict) else [])
  item.update(passed=n,total=len(tests))
 item.pop('pass_');item['pass']=bool(good);item['privateLogSha256']=sha(log);item['privateResultSha256']=sha(result) if result.exists() else None
 return item

for m in manifest:
 if m['name'] not in requested: continue
 frozen();name=m['name'];result=OUT/(name+'.json');log=OUT/(name+'.log');harness=OUT/(name+'_harness.json');screens=OUT/(name+'_screens');screens.mkdir(exist_ok=True)
 for old in (result,harness):
  if old.exists():old.unlink()
 env=dict(os.environ,PAGE=str(PAGE),BASE=str(BASE),OUT=str(result),OUTD=str(screens),GC500814_RESULT=str(result),GC500814_HARNESS=str(harness),GC500814_SOURCE_DIR=str((PROJECT/m['source']).parent),GC500814_PROJECT=str(PROJECT))
 env.setdefault('CHROMIUM_PATH','/usr/bin/chromium');env.pop('MOB',None)
 if m['mobile']:env['MOB']='1'
 print('RUN '+name,flush=True)
 try:
  with log.open('w') as stream:
   proc=subprocess.Popen(['node','--require',str(EVIDENCE/'standing815_output.cjs'),m['file']],cwd=PROJECT,env=env,stdout=stream,stderr=subprocess.STDOUT,start_new_session=True)
   try:code=proc.wait(timeout=a.timeout)
   except subprocess.TimeoutExpired:
    os.killpg(proc.pid,signal.SIGTERM)
    try:proc.wait(timeout=10)
    except subprocess.TimeoutExpired:os.killpg(proc.pid,signal.SIGKILL);proc.wait()
    code=124
  frozen();item=assess(m,code,log,result,harness)
 except Exception as exc:item={'name':name,'pass':False,'error':str(exc)}
 report['runs'].append(item);report['complete']=len(report['runs'])==len(SPECS);report['pass']=bool(report['runs']) and all(r['pass'] for r in report['runs'])
 (REPORT/'standing815_browser.json').write_text(json.dumps(report,indent=2)+'\n')
 print(('PASS ' if item['pass'] else 'FAIL ')+name+' '+json.dumps({k:v for k,v in item.items() if k in ('passed','total','tabs','links','error','exitCode')}),flush=True)
frozen();print('COMPLETE' if report['complete'] else 'PARTIAL', 'PASS' if report['pass'] else 'FAIL',flush=True)
sys.exit(0 if report['pass'] else 1)
