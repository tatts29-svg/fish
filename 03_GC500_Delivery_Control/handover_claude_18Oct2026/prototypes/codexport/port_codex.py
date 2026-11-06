"""Port of Codex's v10.57 performance draft (0a1b93c6) onto live v10.60.1, for measurement only.
Usage: python3 port_codex.py base.html out.html [parts]   parts = comma list of: meta,scope,metacall,complete,native,align,feedback (default all)
Footer left unchanged so text parity is exact."""
import importlib.util, os, sys
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', 'toolchain'))
from rep import rep
spec=importlib.util.spec_from_file_location('p',str(Path(__file__).parent/'draft/patch_v1057.py')); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
src,dst=sys.argv[1],sys.argv[2]
parts=set((sys.argv[3] if len(sys.argv)>3 else 'meta,scope,metacall,complete,native,align,feedback').split(','))
t=Path(src).read_text(encoding='utf8')
assert "' · v10.60.1';" in t, 'expects live v10.60.1'
def ch(old,new,label):
    global t; t=rep(t,old,new,label,src)
if 'meta' in parts: ch(m.OLD_METADATA,m.NEW_METADATA,'meta')
if 'scope' in parts: ch(m.OLD_SCOPE,m.NEW_SCOPE,'scope')
if 'metacall' in parts: ch('docs=metadata925(env.loads).filter(d=>d.ref===a.key),claimed=new Set(),rows=[];','docs=metadata925(env.loads,a.key),claimed=new Set(),rows=[];','metacall')
if 'complete' in parts: ch('window.gc500CompleteKeys897 = function () { try { return allAssets().filter(verified897).map(a => a.key); } catch (e) { return null; } };',
   'window.gc500CompleteKeys897 = function () { try { return holdAssets(() => allAssets().filter(verified897).map(a => a.key)); } catch (e) { return null; } };','complete')
if 'native' in parts:
    ch(" let cachedKey='', cached;\n function native() {"," let cachedKey='', cached;\n function native() { return heldMemo('buildWork1057', nativeRead1057); }\n function nativeRead1057() {",'native')
    ch("reset:()=>{cached=null;cachedKey='';}","reset:()=>{cached=null;cachedKey='';HELD_MEMO.delete('buildWork1057');}",'reset')
if 'align' in parts: ch('requestAnimationFrame(() => { q = false; try { drawer(); costs(); } catch (x) {} });','requestAnimationFrame(() => { q = false; try { holdAssets(() => { drawer(); costs(); }); } catch (x) {} });','align')
if 'feedback' in parts:
    s=(Path(__file__).parent/'draft/performance1057_src.js').read_text()
    ch('</script>\n</body>\n</html>','</script>\n<script id="performance1057-script">\n'+s+'\n</script>\n</body>\n</html>','feedback')
Path(dst).write_text(t,encoding='utf8'); print('wrote',dst,sorted(parts))
