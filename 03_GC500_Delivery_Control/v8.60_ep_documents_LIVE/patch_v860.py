# Author: Andrew Fisher.
import hashlib, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep as replace
from pathlib import Path
p=Path(sys.argv[1]); root=Path(__file__).resolve().parent
assert hashlib.sha256(p.read_bytes()).hexdigest()=='71fdff199e5b09e6d67b2716cb6733ef4e69cb8b2fa3f002db5fec992527e888', 'Wrong live base'
s=p.read_text(encoding='utf-8-sig')
assert 'function rosterAllowance859(' in s and 'function epDocuments860(' not in s
def rep(a,b):
 global s
 s=replace(s,a,b,a[:70],str(p))
rep('#ep819print{display:none}', root.joinpath('ep860_documents.css').read_text()+'\n#ep819print{display:none}')
rep('const EPP819 = {timer:', root.joinpath('ep860_inventory.js').read_text()+'\n'+root.joinpath('ep860_documents.js').read_text()+'\nconst EPP819 = {timer:')
rep('>Print run sheet</button></div>', '>Print run sheet</button><button type="button" class="btn ep819-pr" data-ep860-email="${l.n}">Email PDF</button></div>')
rep("the supplier's plan as it stands, not the GC500 delivery record</p></div></div>", "the supplier's plan as it stands, not the GC500 delivery record</p></div><button type=\"button\" class=\"btn\" data-ep860-inventory>Print Event Portables inventory</button></div>")
rep('<button type="button" data-ep819-go>Print / Save as PDF</button>', '<button type="button" data-ep819-go>Print / Save as PDF</button><button type="button" data-ep860-email="${l.n}">Email PDF</button>')
rep('<h3>Sub-hire register - whose gear is where</h3></div>', '<h3>Sub-hire register - whose gear is where</h3><button type="button" class="btn sm" data-ep860-inventory>Print Event Portables inventory</button></div>')
rep('· v8.59', '· v8.60')
p.write_text(s,encoding='utf-8-sig')
