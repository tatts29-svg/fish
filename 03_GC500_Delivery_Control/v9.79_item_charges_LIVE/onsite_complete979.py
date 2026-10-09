# Author: Andrew Fisher. Shared arrived-only complete billing basis.
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep
def apply_onsite_complete979(s):
 s=rep(s,'<p>Forecast · AUD ex GST</p>','<p>Actual onsite · complete billing · AUD ex GST</p>','Arrived billing basis',__file__)
 s=rep(s,'<th style="width:35%">Forecast</th>','<th style="width:35%">Charge</th>','Arrived charge heading',__file__)
 s=rep(s,"!r.charges.length?'Transport':r.total==null?'Work allocation to confirm':'Work '+price(r.total)","onsiteItemSummary979(a.key,r.item)",'Complete item package summary',__file__)
 source=Path(__file__).with_suffix('.js').read_text()+r"""
(function(){const before=renderCosts;renderCosts=function(){const result=before.apply(this,arguments),pane=document.getElementById('pane-costs');if(pane&&!pane.querySelector('[data-onsite979]')){const heading=pane.querySelector('.hubhead'),finance=pane.querySelector('#finance857-section');if(heading)heading.insertAdjacentHTML('afterend',onsiteCompleteHtml979());else if(finance)finance.insertAdjacentHTML('afterbegin',onsiteCompleteHtml979());else pane.insertAdjacentHTML('beforeend',onsiteCompleteHtml979());}return result;};})();
"""
 return rep(s,'</body>\n</html>\n','<style id="onsite-complete979-style">[data-onsite979] dl{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 12px}[data-onsite979] dd{margin:0;text-align:right}</style><script id="onsite-complete979-script">'+source+'</script>\n</body>\n</html>\n','Onsite complete billing basis',__file__)
