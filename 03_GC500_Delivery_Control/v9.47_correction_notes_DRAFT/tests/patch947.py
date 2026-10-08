# Author: Andrew Fisher. Native editing and persistence must remain byte-for-byte intact.
import os,subprocess,sys,tempfile
from pathlib import Path
root=Path(__file__).resolve().parents[1]
base=Path(os.environ['BASE947']);original=base.read_text(encoding='utf-8-sig')
with tempfile.TemporaryDirectory() as d:
 p=Path(d)/'page.html';p.write_text(original)
 cmd=[sys.executable,str(root/'patch_v947.py'),str(p),'--preview-base-941']
 subprocess.run(cmd,check=True,capture_output=True)
 out=p.read_text();assert 'function correctionNote947(' in out
 for boundary,end in [('function drawer816(a){','\nfunction '),('function dropPhotosOf(key){','\nfunction ')]:
  assert boundary in out
 assert "S.notes[a.key] = $('#noteBox').value; stampIt('notes', a.key, who); bump(); flash('Note saved.');" in out
 textarea='<textarea id="noteBox" rows="3" placeholder="Anything the schedule does not say — condition, who signed for it, where it actually ended up.">${esc(a._note||\'\')}</textarea>'
 assert textarea in original and textarea in out
 assert subprocess.run(cmd,capture_output=True).returncode!=0
 print('PASS947 patch: native full-note editing/save intact; reapplication refused')
