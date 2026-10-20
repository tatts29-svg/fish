"""Author: Andrew Fisher. Scoped supplier driver run-sheet print-policy integration."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep


def apply(text):
    if 'function supplierPrint841Snapshot(' in text:
        raise ValueError('Supplier print v8.41 already present')
    if 'function timeline841Printed(' not in text or 'function timeline841PrintStart(' not in text:
        raise ValueError('Supplier print v8.41 requires the Timeline v8.41 adapter')

    def change(old, new, label):
        nonlocal text
        text = rep(text, old, new, label, 'v8.41 supplier print')

    change('const EPP819 = {timer: 0, after: null, opener: null, n: null};',
           (ROOT / 'supplier_print841_src.js').read_text() + '\nconst EPP819 = {timer: 0, after: null, opener: null, n: null};',
           'Exact supplier sheet reference snapshot and shared print policy')
    change('function ep819Close(){', 'function ep819Close(){\n supplierPrint841Close();',
           'Supplier close invalidates pending print transitions')
    change('function dpPrint(iso, doc, o){\n const print841=timeline841PrintStart();',
           'function dpPrint(iso, doc, o){\n supplierPrint841Dismiss();\n const print841=timeline841PrintStart();',
           'Native driver and installer sheets dismiss the supplier print document')
    change('function dpFromLink(kind, iso, only){\n const link841=timeline841PrintStart();',
           'function dpFromLink(kind, iso, only){\n supplierPrint841Dismiss();\n const link841=timeline841PrintStart();',
           'Native print links dismiss the supplier print document before waiting')
    change("bar.querySelector('[data-dpbar-print]').onclick = () => {const w=document.getElementById('dayprint');if(kind==='drivers'&&w&&w.__timeline841print)w.__timeline841print();else window.print();};",
           "bar.querySelector('[data-dpbar-print]').onclick = () => {if(document.getElementById('dpbar')!==bar||epOpen819())return;const w=document.getElementById('dayprint');if(kind==='drivers'&&w&&w.__timeline841print)w.__timeline841print();else window.print();};",
           'A detached native print bar cannot print a replacement supplier preview')
    change('function ps7Print(iso, o){\n timeline841PrintStart();',
           'function ps7Print(iso, o){\n supplierPrint841Dismiss();\n const supplierPrestart841=timeline841PrintStart();',
           'Prestart sheets dismiss the supplier print document and own their generation')
    change("(document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => null) : Promise.resolve()).then(() => o.pdf({}, wrap, fin));",
           "(document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => null) : Promise.resolve()).then(() => {if(timeline841PrintCurrent(supplierPrestart841)&&document.getElementById('dayprint')===wrap)o.pdf({}, wrap, fin);});",
           'A superseded prestart PDF cannot consume the supplier preview')
    change("(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => { try { window.print(); } catch (e) { if (!(o && o.keep)) done(); } });",
           "(document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => {if(!timeline841PrintCurrent(supplierPrestart841)||document.getElementById('dayprint')!==wrap)return;try { window.print(); } catch (e) { if (!(o && o.keep)) done(); } });",
           'A superseded prestart print cannot print the supplier preview')
    change("const done = () => { st.remove(); wrap.classList.remove('ps7wrap'); document.body.classList.remove('printing-day'); };",
           "const done = () => { st.remove();if(!timeline841PrintCurrent(supplierPrestart841))return;wrap.classList.remove('ps7wrap'); document.body.classList.remove('printing-day'); };",
           'Old prestart cleanup cannot dismiss a replacement document')
    change("const fin = () => { st.remove(); wrap.classList.remove('ps7wrap'); document.body.classList.remove('pdf7-make'); };",
           "const fin = () => { st.remove();if(!timeline841PrintCurrent(supplierPrestart841))return;wrap.classList.remove('ps7wrap'); document.body.classList.remove('pdf7-make'); };",
           'Old prestart PDF cleanup cannot dismiss a replacement document')
    change("\tw.hidden = false;\n\tdocument.querySelectorAll('#ep819page')",
           "\tw.hidden = false;\n const supplier841=supplierPrint841Prepare(l,w);\n\tdocument.querySelectorAll('#ep819page')",
           'Freeze displayed refs and invalidate competing native print requests')
    change('EPP819.after = () => { EPP819.after = null; ep819Close(); };',
           'EPP819.after = () => { supplierPrint841After(w,supplier841); };',
           'Natural afterprint cleanup preserves the successful request')
    change('EPP819.timer = setTimeout(() => { EPP819.timer = 0; if (!epOpen819()) return; try { window.print(); } catch (e) {} }, 80);',
           'EPP819.timer = setTimeout(() => { try { supplierPrint841Go(w,supplier841); } catch (e) {} }, 80);',
           'Automatic supplier print uses the scoped native transition')
    change("if (t.closest('[data-ep819-go]')) { if (epOpen819()) { try { window.print(); } catch (x) {} } return; }",
           "if (t.closest('[data-ep819-go]')) { if (epOpen819()) { try { supplierPrint841Go(document.getElementById('ep819print')); } catch (x) {} } return; }",
           'Explicit supplier preview print uses the same snapshot and policy')
    return text
