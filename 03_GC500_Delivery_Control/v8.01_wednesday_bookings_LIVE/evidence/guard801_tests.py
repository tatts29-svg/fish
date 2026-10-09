#!/usr/bin/env python3
"""Author: Andrew Fisher. Fail-closed patch guards, no network or record writes."""
import hashlib,json,re,subprocess,sys,tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[1];base=Path(sys.argv[1]);candidate=Path(sys.argv[2]);checks=[]
with tempfile.TemporaryDirectory() as td:
 f=Path(td)/'repeat.html';f.write_bytes(candidate.read_bytes());before=f.read_bytes();r=subprocess.run([sys.executable,str(root/'patch_v801.py'),str(f)],capture_output=True,text=True);checks.append({'name':'Repeated application refused without changing file','pass':r.returncode!=0 and f.read_bytes()==before and 'already applied' in r.stderr})
 s=base.read_text();m=re.search(r'const DATA\s*=\s*',s);d,n=json.JSONDecoder().raw_decode(s[m.end():]);a=next(a for a in d['assets'] if a['key']=='WC20');e=next(e for e in a['events'] if e['task_id']=='T0250');e['quantity_display']='3';bad=s[:m.end()]+json.dumps(d,ensure_ascii=False,separators=(',',':'))+s[m.end()+n:];f=Path(td)/'wrong_source.html';f.write_text(bad);before=f.read_bytes();r=subprocess.run([sys.executable,str(root/'patch_v801.py'),str(f)],capture_output=True,text=True);checks.append({'name':'Changed source quantity refused without changing file','pass':r.returncode!=0 and f.read_bytes()==before and 'Source changed: WC20 T0250' in r.stderr})
checks.append({'name':'Canonical DATA declaration remains protected by official attribution scrubber','pass':re.search(r'^const DATA = (\{.*\});?$',candidate.read_text(),re.M) is not None})
out={'author':'Andrew Fisher','candidateSha256':hashlib.sha256(candidate.read_bytes()).hexdigest(),'checks':checks};(root/'evidence/guard801_tests.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out));assert all(c['pass']for c in checks)
