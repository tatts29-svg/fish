"""Author: Andrew Fisher. Keep deferred UI work within the visible tab and native read scope."""
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

def apply(text, path):
    if 'demobDecorationsActive1307' in text:
        raise SystemExit('deferred work v13.07 already applied')
    if 'scope1306(' not in text:
        raise SystemExit('deferred work requires v13.06')
    text = rep(text,
        "function soon() { if (raf) return; raf = (W.requestAnimationFrame || setTimeout)(() => { raf = 0; after(); }); }",
        """/* v13.07 - leaving a large pane clears its DOM. Its observers must not rebuild hidden models. */
function demobDecorationsActive1307() { return Performance1241.paneActive(D.getElementById('pane-demob'), state.tab); }
function soon() { if (raf || !demobDecorationsActive1307()) return; raf = (W.requestAnimationFrame || setTimeout)(() => { raf = 0; if (demobDecorationsActive1307()) after(); }); }""",
        'deferred Demob map decoration only while visible', path)
    old = "new MutationObserver(ms => { if (raf || ms.every(m => m.target && m.target.closest &&m.target.closest('.sgv1238,.pg1238,.dl1238,.dc996-controls'))) return; raf = (W.requestAnimationFrame || setTimeout)(() => { raf = 0; try { hold(decorate); } catch (x) {} }); }).observe(pane, {childList: true, subtree: true});"
    new = """new MutationObserver(ms => { if (raf || !Performance1241.paneActive(pane, state.tab) || ms.every(m => m.target && m.target.closest &&m.target.closest('.sgv1238,.pg1238,.dl1238,.dc996-controls'))) return; raf = (W.requestAnimationFrame || setTimeout)(() => { raf = 0; if (!Performance1241.paneActive(pane, state.tab)) return; try { hold(decorate); } catch (x) {} }); }).observe(pane, {childList: true, subtree: true});"""
    text = rep(text, old, new, 'deferred individual Demob cards only while visible', path)
    text = rep(text,
        "function render(){\n const pane = document.getElementById('pane-vms'); if (!pane) return;",
        """/* v13.07 - key/filter callbacks render outside navigation; share one fresh native asset snapshot. */
function render(){ const self=this,args=arguments; return holdAssets(() => renderVmsHeld1307.apply(self,args)); }
function renderVmsHeld1307(){
 const pane = document.getElementById('pane-vms'); if (!pane) return;""",
        'VMS callback rendering shares native read scope', path)
    return text

if __name__ == '__main__':
    target=Path(sys.argv[1])
    target.write_text(apply(target.read_text(),str(target)))

