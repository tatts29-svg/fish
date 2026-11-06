# Author: Andrew Fisher. Public patch guards with synthetic HTML.
from pathlib import Path
import hashlib
import subprocess
import sys
import tempfile
HERE=Path(__file__).resolve().parent
BASE="<html><body><script>const Reference966 = {}; const footer=' · v9.66'; /* v8.19 */ const printBody='</body>'; const otherPrint='</body></html>'; const thirdPrint='</body></html>';</script>\n</body></html>\n"
checks=0
def run(source,passed):
 global checks
 with tempfile.TemporaryDirectory() as d:
  p=Path(d)/'candidate.html';p.write_bytes(source)
  r=subprocess.run([sys.executable,str(HERE/'patch_v967.py'),str(p)],capture_output=True)
  assert (r.returncode==0)==passed,r.stderr.decode()
  if not passed: assert p.read_bytes()==source
  checks+=1
  return p.read_bytes()
result=run(BASE.encode(),True)
assert result.count(b'questions967-script')==1 and b'window.Questions967=Questions967;' in result;checks+=1
assert b'v9.67' in result and b"const printBody='</body>'" in result;checks+=1
run(result,False)
run(BASE.replace('v9.66','v9.65').encode(),False)
run(BASE.replace('const Reference966 =','const unrelated =').encode(),False)
run(BASE.replace('</body></html>','</body>\n</html>').encode(),False)
run(BASE.replace('</script>\n</body></html>\n','</script>\n</body></html>\n</script>\n</body></html>\n').encode(),False)
assert run(b'\xef\xbb\xbf'+BASE.encode(),True).startswith(b'\xef\xbb\xbf');checks+=1
print({'author':'Andrew Fisher','passed':checks,'failed':0})
