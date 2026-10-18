"""Author: Andrew Fisher. Servicing progress and explicit tracker-card creation; no job-record writes."""
from pathlib import Path
import json
import sys
import subprocess
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
TRACK = HERE.parent / 'servicing_tracker_DRAFT'

def patch(text):
    if 'id="svc1067-script"' in text:
        raise ValueError('v10.67 already applied')
    if "+ ' · v10.66'; /* v8.19 release922" not in text or 'shapes1060-script' not in text or 'nights1022-script' not in text:
        raise ValueError('v10.67 requires the reviewed v10.66 base and Event nights')
    anchor = " reports: async () => { const r = await fetch('/api/reports', {headers: headers(), cache: 'no-store'});"
    method = """ /* v10.67: bounded progress reads, plus deliberate edit-only tracker creation. */
 makeTracker: async body => {
 if (capability() !== 'edit' || SYNC.readonly || SYNC.claims === 'view' || SYNC.level !== 'edit' || SYNC.status !== 'live') throw new Error('Connect the edit link before publishing a tracker.');
 const operator = String((document.getElementById('who') || {}).value || S.operator || '').trim();
 if (!operator) throw new Error('Enter your name in Recording as before publishing a tracker.');
 const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 30000);
 try { const r = await fetch('/api/cards', {method:'POST', headers:headers({'Content-Type':'application/json','x-gc500-who':operator}), body:JSON.stringify(body), signal:ctrl.signal});
 let j = {}; try { j = await r.json(); } catch(e) {}
 if (!r.ok) { const e = new Error(j.error || 'The tracker was not saved (' + r.status + ').'); e.status = r.status; e.code = j.code; e.token = j.token; throw e; }
 return j; } finally { clearTimeout(timer); } },
 ticks: async q => {
 const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 15000);
 try { const r = await fetch('/api/ticks?' + new URLSearchParams(q || {}), {headers: headers(), cache:'no-store', signal:ctrl.signal});
 let j = {}; try { j = await r.json(); } catch (e) {}
 if (!r.ok) throw new Error(r.status === 403 ? 'Servicing progress is available on the edit link only.' : (j.error || 'The servicing tracker could not be read (' + r.status + ').'));
 return j; } finally { clearTimeout(timer); } },
"""
    text = rep(text, anchor, method + anchor, 'servicing read API', 'page')
    data = json.loads((TRACK / 'tracker_data.json').read_text())
    panel = {'tasks': data['tasks'], 'plans': data['plans'], 'days': data['days'], 'areas': [
        {'n': a['n'], 'name': a['name'], 'refs': [{'ref': r['ref'], 'lines': [{k: l[k] for k in ['id', 'kind', 'label', 'qty']} for l in r['lines']]} for r in a['refs']]} for a in data['areas']]}
    encoded = json.dumps(panel, ensure_ascii=True, separators=(',', ':')).replace('<', '\\u003c')
    pieces = [(TRACK / 'panel_mockup' / p).read_text() for p in ['state.js', 'panel_render.js', 'admin_reader.js']]
    card_script = r'''const B=require(process.argv[1]),D=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));
const data=B.cardData(D),html=B.buildCardHtml(D),mark='var D = '+B.scriptJson(data)+';';
if(html.split(mark).length!==2)throw new Error('card data marker must be unique');
process.stdout.write(JSON.stringify({data,html:html.replace(mark,'var D = /*SVC1067_DATA*/null;')}));'''
    card = json.loads(subprocess.check_output(['node', '-e', card_script, str(TRACK / 'card' / 'build_card.js'), str(TRACK / 'tracker_data.json')], text=True))
    bundle = json.dumps(card, ensure_ascii=True, separators=(',', ':')).replace('<', '\\u003c')
    js = '\n'.join(pieces) + '\nvar SVC1067_DATA=' + encoded + ';\nvar SVC1067_CARD=' + bundle + ';\n' + (HERE / 'admin1067_src.js').read_text() + '\n' + (HERE / 'servicing1067_src.js').read_text()
    if '</script' in js.lower(): raise ValueError('source contains a closing script tag')
    css = (TRACK / 'panel_mockup' / 'panel.css').read_text().replace('#svc1063', '#svc1067')
    css += '\n#svc1067-host .svc1067-admin{margin-top:14px;border-top:1px solid var(--rule);padding-top:10px}#svc1067-host .svc1067-admin label{display:block;margin:10px 0}#svc1067-host .svc1067-admin input:not([type=checkbox]){display:block;width:100%;box-sizing:border-box;min-height:44px}#svc1067-host .svc1067-admin summary{min-height:44px;cursor:pointer}#svc1067-host .svc1067-admin button{min-height:44px;white-space:normal;margin:4px 0}#svc1067-host[hidden]{display:none!important}#svc1067-host .svc1067-select{margin-bottom:10px}#svc1067-host select{max-width:100%;min-height:44px;width:100%}@media print{#svc1067-host{display:none!important}}\n'
    anchor = 'W.renderNights1022 = render;\n})(window);\n</script>'
    addition = '\n<style id="svc1067-style">' + css + '</style>\n<script id="svc1067-script">' + js + '\n</script>'
    text = rep(text, anchor, anchor + addition, 'independent tracker panel', 'page')
    return rep(text, "+ ' · v10.66'; /* v8.19 release922", "+ ' · v10.67'; /* v8.19 release922", 'release footer', 'page')

if __name__ == '__main__':
    page = Path(sys.argv[1]); page.write_text(patch(page.read_text()))
