# Author: Andrew Fisher. Bounded addition inside the existing four-column customer charge table.
from pathlib import Path

def apply_transport_item977(html):
    if 'script id="transport-item977-script"' in html:
        raise RuntimeError('Item transport already applied')
    start=html.index('function arrivedChargesHtml975(a){')
    end=html.index('\n}',start)+2
    old=html[start:end]
    anchor=".join('')+'</tbody></table></div>"
    if old.count(anchor)!=1:
        raise RuntimeError('Arrived charges four-column table anchor changed')
    new=old.replace('const rows=arrivedChargeRows975(a).filter(r=>r.charges.length);','const rows=arrivedChargeRows975(a);').replace(anchor,".join('')+transportRowsHtml977(a,r.item)+'</tbody></table></div>")
    phrase="r.total==null?'Allocation to confirm':price(r.total)"
    if new.count(phrase)!=1:
        raise RuntimeError('Work charge summary changed')
    new=new.replace(phrase,"!r.charges.length?'Transport':r.total==null?'Work allocation to confirm':'Work '+price(r.total)")
    new=new.replace("esc975(price(c.rate))","esc975(chargeRateDisplay977(c.rate))")
    html=html[:start]+new+html[end:]
    anchor='</body>\n</html>'
    if html.count(anchor)!=1:
        raise RuntimeError('Page end anchor not unique')
    src=Path(__file__).with_name('transport_item977.js').read_text()
    return html.replace(anchor,'<style id="transport-item977-style">#drawer [data-charges952] table{min-width:0!important;width:100%!important;table-layout:fixed!important}#drawer [data-charges952] th,#drawer [data-charges952] td{min-width:0!important;overflow-wrap:anywhere;white-space:normal!important;padding:7px 5px!important}#drawer [data-charges952] th{letter-spacing:0!important}</style>\n<script id="transport-item977-script">\n'+src+'\n</script>\n'+anchor)
