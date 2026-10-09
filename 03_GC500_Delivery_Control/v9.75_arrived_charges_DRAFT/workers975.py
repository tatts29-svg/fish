# Author: Andrew Fisher. Optional recorded roles; new assignments choose workers only.
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep as shared_rep

def rep(s,old,new):
    return shared_rep(s,old,new,"Worker-only assignment",__file__)

def apply_workers975(s):
    if 'const Workers911 = (() => {' not in s:
        raise RuntimeError('Workers975 requires Workers911')
    if 'workers975-script' in s:
        raise RuntimeError('Workers975 already applied')
    s=rep(s,'!Array.isArray(p.roles)||!p.roles.length||p.roles.some(r=>!crew883Roles[r])','!Array.isArray(p.roles)||p.roles.some(r=>!crew883Roles[r])')
    s=rep(s,"if (!person || !Array.isArray(person.roles) || !person.roles.length || person.roles.some(r => !ROLE_KEYS.includes(r))) return 'Choose at least one role for each person.';","if (!person || !Array.isArray(person.roles) || person.roles.some(r => !ROLE_KEYS.includes(r))) return 'Check the recorded worker roles.';")
    s=rep(s,"return 'Choose each person once and tick all their roles on that row.';","return 'Choose each worker once.';")
    s=rep(s,'Select a worker and their roles, then save. One row is one person.','Select workers, then save.')
    module=Path(__file__).with_name('workers975_src.js').read_text()
    return rep(s,'</body>\n</html>\n','<script id="workers975-script">\n'+module+'\n</script>\n</body>\n</html>\n')
