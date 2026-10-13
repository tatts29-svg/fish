# Author: Andrew Fisher. Shared charge inclusion without physical completion writes.
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep

def apply(html):
    if 'id="charge1006-script"' in html: raise ValueError('v10.06 charge patch already applied')
    if 'id="onsite-complete979-script"' not in html: raise ValueError('Wrong charge baseline')
    changes={
        'Labour Install ticked per piece ${money0(r2(labour - fire - cleaning))}':'Charges included per piece ${money0(r2(labour - fire - cleaning))}',
        "(${fmtNum(ticks)} tick${ticks === 1 ? '' : 's'}: install, steps, levelling and demob)":'(install, level, selected stairs and demob)',
        '${fmtNum(n(TK.cleaning.ticks))} completed ticks':'${fmtNum(n(TK.cleaning.ticks))} charge lines included',
        'completed charges are included once, and remaining work is not billed or marked complete':'arrived charges are included once; remaining equipment stays forecast and physical work status is separate',
        'Labour ticked per piece, on the record':'Per-piece charges included on the record',
        'labour is what is ticked per piece, dated by the day the reference went in':'per-piece customer charges are included for received equipment and grouped by its arrival month; Finance confirms revenue recognition, especially future demob and cleaning',
        'What we will charge for labour (per piece from the card, ticked as it is done, plus the hourly scope over the event)':'What we will charge for labour (applicable card charges included when equipment arrives, plus the hourly scope over the event)',
        '<th class="num">Ticked so far</th><th class="num">Expected on site, not ticked</th>':'<th class="num">Charges included</th><th class="num">Unpriced onsite scope</th>'
    }
    for old,new in changes.items(): html=rep(html,old,new,'Charge inclusion terminology',__file__)
    source=Path(__file__).with_name('charge1006.js').read_text()
    return rep(html,'</body>\n</html>\n','<style id="charge1006-style">[data-charge-included1006]{appearance:none;display:inline-grid;place-content:center;vertical-align:middle;width:14px;height:14px;margin:0 5px 0 0;border:1px solid currentColor;border-radius:3px;opacity:1!important}[data-charge-included1006]:checked::after{content:"✓";font-size:12px;font-weight:900;line-height:1;color:#9c4600}</style><script id="charge1006-script">\n'+source+'\n</script>\n</body>\n</html>\n','Shared onsite charge inclusion',__file__)
