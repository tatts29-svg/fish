"""Author: Andrew Fisher. Measured hidden rendering and repeated per-row cost reads."""
import os
import sys
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep
HERE = Path(__file__).resolve().parent

def patch(text, path='page.html'):
    if 'id="performance1241-script"' in text:
        raise ValueError('v12.41 is already present')
    if 'id="eventcrew1237-script"' not in text or 'id="demobmap1236-script"' not in text:
        raise ValueError('The coordinated event-crew and Demob source is required')
    footer = "+' · v12.37'; /* v8.19 release922"
    if text.count(footer) != 1:
        raise ValueError('Expected the coordinated v12.37 base footer once')
    def change(old, new, what):
        nonlocal text
        if text.count(old) != 1:
            raise ValueError(what + ': expected one exact native span')
        at = text.index(old)
        text = text[:at] + rep(old, old, new, what, path) + text[at + len(old):]
    change('<script>/* Author: Andrew Fisher. The data gate exists before any record is drawn. */', '<script id="performance1241-script">\n' + (HERE / 'performance1241_src.js').read_text().rstrip() + '\n</script>\n<script>/* Author: Andrew Fisher. The data gate exists before any record is drawn. */', 'synchronous read helpers before initial rendering')
    # Native panes use CSS .on, not the hidden attribute. The normal navigation
    # renderer always draws the selected tab, including a direct #demob link.
    change("if (p && !p.hidden && typeof renderDemob816 === 'function') renderDemob816();", "if (Performance1241.paneActive(p, state.tab) && typeof renderDemob816 === 'function') renderDemob816();", 'ready board boot renders only its selected pane')
    change("if (p && !p.hidden && p.querySelector('.sec1231')) renderDemob816();", "if (Performance1241.paneActive(p, state.tab) && p.querySelector('.sec1231')) renderDemob816();", 'master-plan boot renders only its selected pane')
    # The native lease is nested-safe and invalidates on a save or event-config
    # change. It ends before returning: no cross-task cache is introduced.
    change("function after() {\n const pane = D.getElementById('pane-demob'); if (mo) mo.disconnect();", "function after() { return holdAssets(afterHeld1241); }\nfunction afterHeld1241() {\n const pane = D.getElementById('pane-demob'); if (mo) mo.disconnect();", 'one asset lease for deferred Demob decorations')
    change("renderDemob816 = function () { let v; rendering++; try { v = renderBefore.apply(this, arguments); } finally { rendering--; } after(); return v; };", "renderDemob816 = function () { const self = this, args = arguments; return holdAssets(() => Performance1241.demobPass(() => { let v; rendering++; try { v = renderBefore.apply(self, args); } finally { rendering--; } after(); return v; }, () => WeatherStrip1002.reveal(D.getElementById('pane-demob')))); };", 'one asset lease for Demob render and decorations')
    # The modern strip replaces the legacy buttons and owns the final selected-
    # date reveal. Keep interim scroll preservation only for standalone mounts.
    change("{ const st = pane.querySelector('.strip816'), on = st && st.querySelector('.dday816.on'); if (st && on) { const l = on.offsetLeft - st.clientWidth / 2 + on.offsetWidth / 2; if (l > 0 && st.scrollWidth > st.clientWidth) st.scrollLeft = l; } }", "{ if (!window.DemobCards996) { const st = pane.querySelector('.strip816'), on = st && st.querySelector('.dday816.on'); if (st && on) { const l = on.offsetLeft - st.clientWidth / 2 + on.offsetWidth / 2; if (l > 0 && st.scrollWidth > st.clientWidth) st.scrollLeft = l; } } }", 'avoid geometry on obsolete date buttons')
    change("selected=demobSel816(M),scroll=strip.scrollLeft;readings.clear();", "selected=demobSel816(M),scroll=rendering?null:strip.scrollLeft;readings.clear();", 'standalone mounts alone retain prior scroll')
    change("strip.classList.add('daystrip');strip.scrollLeft=scroll;pane.querySelector('.leg816')?.remove();", "strip.classList.add('daystrip');if(scroll!==null)strip.scrollLeft=scroll;pane.querySelector('.leg816')?.remove();", 'full render leaves final centring to its completed strip')
    change("mount();WeatherStrip1002.reveal(document.getElementById('pane-demob'));return result;", "mount();if(!Performance1241.drawingDemob())WeatherStrip1002.reveal(document.getElementById('pane-demob'));return result;", 'centre only after the full decorated Demob render')
    change("const pane = D.getElementById('pane-demob'); let sc = pane && pane.parentElement;", "const pane = D.getElementById('pane-demob'); let sc = pane && pane.parentElement;\n // Native screen panes are direct children of the scrolling main element.\n if (sc && sc.tagName === 'MAIN' && !(W.matchMedia && W.matchMedia('print').matches)) return sc;", 'native map observer root without forced screen layout')
    change("try { arm(); } catch (e) {} try { headers(); } catch (e) {} try { overview(); } catch (e) {} try { progress(); } catch (e) {}", "try { headers(); } catch (e) {} try { overview(); } catch (e) {} try { progress(); } catch (e) {} try { arm(); } catch (e) {}", 'finish decoration writes before map observation')
    # Cache the final native projection, retaining legacy/area precedence and
    # fresh result objects. Native photo puts invalidate it before any save.
    photo = "dropPhotosOf=function(ref){return oldPhotos(ref).filter(p=>{const current=get(p.id);return !isArea(current)||(!current.removed&&linkedRefs(current).includes(String(ref)));}).map(p=>{const current=get(p.id);if(!isArea(current))return p;const projected=projectForRef(current,ref);delete projected.ref;return projected;});};"
    change(photo, photo.replace('dropPhotosOf=function(ref)', 'const projectedPhotos1241=function(ref)') + "\ndropPhotosOf=function(ref){return Performance1241.photoRows(ref,()=>projectedPhotos1241.apply(this,arguments));};", 'reuse final photo projection only within native holds')
    change("S.photoLinks[id] = next;\n stampIt('photoLinks', id, who);", "S.photoLinks[id] = next;\n Performance1241.invalidatePhotos();\n stampIt('photoLinks', id, who);", 'photo additions and removals invalidate derived reads immediately')
    # Index the final native cost rows lazily, once for this Finance call. Using
    # first occurrence and raw ID keys preserves ourCostOf's exact lookup rule.
    change("fin745Rows=function(){return priorFinance.apply(this,arguments).map(row=>{\n if(!isPerson(row.person)||!DATES.includes(row.date))return row;\n const person=ourCostOf(personId(row.person)),override=fin745Latest('rate',row.person);", "fin745Rows=function(){let people1241;return priorFinance.apply(this,arguments).map(row=>{\n if(!isPerson(row.person)||!DATES.includes(row.date))return row;\n const person=(people1241||(people1241=Performance1241.firstIndex(ourCosts()))).get(String(personId(row.person)))||null,override=fin745Latest('rate',row.person);", 'one local person lookup per Finance call')
    # Only the ordinary no-argument ledger is reused. Explicit supplier/source
    # pricers retain their original path and never share this derived snapshot.
    change("function allCosts(docketPricer1018){", "function allCosts(docketPricer1018){\n if (arguments.length) return allCosts1241Uncached.apply(this, arguments);\n return Performance1241.costRows(() => allCosts1241Uncached.call(this));\n}\nfunction allCosts1241Uncached(docketPricer1018){", 'reuse ordinary cost rows within a native hold')
    change('</body>\n</html>', '<script id="performance1241-runtime">\n' + (HERE / 'performance1241_runtime.js').read_text().rstrip() + '\n</script>\n</body>\n</html>', 'finish geometry after all native render decorators')
    change(footer, "+' · v12.41'; /* v8.19 release922", 'release footer')
    return text

if __name__ == '__main__':
    target = Path(sys.argv[1])
    target.write_text(patch(target.read_text(), str(target)))
    print('v12.41 measured rendering performance correction applied')
