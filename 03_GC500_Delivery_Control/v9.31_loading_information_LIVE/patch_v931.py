# Author: Andrew Fisher. Replace restraint entry forms with populated loading information.
import re,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text();base=Path(__file__).parent
assert 'loading931-style' not in s, 'v9.31 already applied'
assert 'restraint924-style' in s and 'gcUnits925' in s, 'Requires integrated restraint and unit identities'
start=s.index('/* Author: Andrew Fisher. Guide references, individual transport specifications and recorded load arrangements. */')
end=s.index('</script>',start)
old=s[start:end]
assert old.rstrip().endswith("})(typeof window!=='undefined'?window:globalThis);"), 'Unexpected restraint source boundary'
src='\n'.join((base/name).read_text() for name in ['core924.js','information931.js','runtime931.js'])
src=src.replace('/* GUIDE924_DATA */[]',(base.parent/'v9.24_restraint_integration_LIVE/guide924.json').read_text().strip())
s=rep(s,old,src+'\n','replace restraint forms with product information',str(p))
footers=re.findall(r"\+ ' · v9\.(?:28|29|30)'; /\* v8\.19",s)
assert len(footers)==1, 'Expected v9.28–30 release footer'
s=rep(s,footers[0],"+ ' · v9.31'; /* v8.19",'release footer',str(p))
p.write_text(s)
