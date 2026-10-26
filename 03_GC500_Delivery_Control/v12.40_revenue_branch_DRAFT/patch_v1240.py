"""Author: Andrew Fisher. Exact customer Revenue branch decisions; no amount or supplier/source change."""
import os
import sys
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep

HERE = Path(__file__).resolve().parent

def patch(text, path='page.html'):
    if 'id="revenuebranch1240-script"' in text:
        raise ValueError('v12.40 is already present')
    if 'id="charge1239-script"' not in text or 'id="eventcrew1237-script"' not in text:
        raise ValueError('The coordinated customer-treatment and supplier-actuals source is required')
    if text.count("+' · v12.39'; /* v8.19 release922") != 1:
        raise ValueError('Expected the coordinated v12.39 base footer once')
    def change(old, new, why):
        nonlocal text
        if text.count(old) != 1:
            raise ValueError(why + ': expected exact source once')
        i = text.index(old)
        text = text[:i] + rep(old, old, new, why, path) + text[i + len(old):]
    change("function setQAnswer(id, v){",
           "function setQAnswer(id, v){\n if(String(id).startsWith('revenue-branch1240|')){flash('Use the Revenue branch control for this decision.');return false;}",
           'question notes cannot overwrite financial branch decisions')
    change('for(const l of F.lines||[]){const b=roles[l.key];if(!b)continue;',
           "for(const l of F.lines||[]){const b=RevenueBranch1240.branch('scope|'+l.key,roles[l.key]);if(!b)continue;",
           'customer event role allocation uses its explicit decision')
    change('C004 staffing invoice category; responsible 2026 Coates contract branch',
           'Customer event-scope role allocation; source branch or explicit confirmed Revenue decision',
           'allocation provenance distinguishes source from confirmed decision')
    change('Event-scope invoice categories are matched to the responsible 2026 contract branch: KINP portables and toilets; NVAC generator support; STPS fencing and VMS.',
           'Event-scope invoice categories use the source branch or a confirmed Revenue decision on the exact role. Contract-line Revenue decisions preserve source sales codes and supplier cost attribution.',
           'branch explanation follows confirmed role and line decisions')
    change('<td><b>${esc(L.role)}</b><br><span class="w"',
           '<td><b>${esc(L.role)}</b>${RevenueBranch1240.control(\'scope|\'+L.key)}<br><span class="w"',
           'existing customer role row exposes branch decision')
    change("'<tr data-scope-line=\"fence\"><td><b>Fencing total</b></td><td>'+",
           "'<tr data-scope-line=\"fence\"><td><b>Fencing total</b>'+RevenueBranch1240.control('scope|fence')+'</td><td>'+",
           'existing customer fencing total exposes branch decision')
    marker='\n</body>'
    end=text.rfind(marker)
    if end<0 or text[end:].strip()!='</body>\n</html>':
        raise ValueError('Expected the final page body boundary')
    tail=text[end:]
    text=text[:end]+rep(tail,tail,'\n<script id="revenuebranch1240-script">\n'+(HERE/'revenuebranch1240_src.js').read_text()+'\n</script>'+tail,'native exact Revenue branch decisions',path)
    change("+' · v12.39'; /* v8.19 release922", "+' · v12.40'; /* v8.19 release922", 'release footer')
    return text

if __name__ == '__main__':
    target=Path(sys.argv[1])
    target.write_text(patch(target.read_text(),str(target)))
    print('v12.40 exact customer Revenue branch decisions applied')
