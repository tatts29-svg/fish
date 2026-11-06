# Author: Andrew Fisher. Prove final toolbar-only changes leave prior standing scopes byte-identical.
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[2];p=root/'build/GC500_v7.98/GC500_Delivery_Control_hosted.html'
new=p.read_text();old=new
base=(root/'build/GC500_v7.98/base_live.html').read_text()
def span(s):
 a=s.index('function dpZoomFit(){');b=s.index('/* v7.82 - a short check',a);return s[a:b]
old=old.replace(span(old),span(base))
changes=[
 ('toolbar screen offset','body.dpbar-on{padding-top:var(--dpbar-height798,64px)}','body.dpbar-on{padding-top:64px}'),
 ('refit after toolbar text change'," const p = b.querySelector('[data-dpbar-print]'); p.disabled = !ready;\n dpZoomFit();\n}"," const p = b.querySelector('[data-dpbar-print]'); p.disabled = !ready;\n}"),
 ('close cleanup'," document.body.classList.remove('dpbar-on');\n document.body.style.removeProperty('--dpbar-height798');"," document.body.classList.remove('dpbar-on');"),
 ('initial preview offset'," document.body.appendChild(bar); document.body.classList.add('dpbar-on'); dpZoomFit();"," document.body.appendChild(bar); document.body.classList.add('dpbar-on');")]
for label,a,b in changes:
 assert old.count(a)==1,(label,old.count(a));old=old.replace(a,b)
sha=lambda s:hashlib.sha256(s.encode()).hexdigest()
expected_old='b2f0bc038dba361647247642001ae52b53be160d37ae49b1e1298b266aa8639a'
assert sha(old)==expected_old,sha(old)
result={'author':'Andrew Fisher','finalSha256':sha(new),'previousTestedSha256':expected_old,'reversingOnlyListedToolbarChangesReproducesPreviousBytes':True,'changedScopes':['toolbar measurement and offset after width fit in dpZoomFit']+[x[0] for x in changes],'unaffectedStandingScopes':['navigation model/memoisation','Equipment desktop/phone','packed Today desktop/phone','driver rules','fresh-after-save','drawer connection status','optional font fallback','photo IDB/save/sync/queue/Web Locks'],'binding':'Prior complete standing suite on b2f0bc03 remains applicable to these unchanged scopes. Final print/toolbar requires the app agent’s final verification; source-identical standing and native photo evidence is explicitly bound. Final combined v8.01 receives all standing suites before publication. No live writes.'}
Path(__file__).with_name('final798_source_binding.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps(result))
