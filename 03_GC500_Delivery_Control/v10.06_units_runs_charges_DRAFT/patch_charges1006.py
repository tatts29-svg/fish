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
        'labour is what is ticked per piece, dated by the day the reference went in':'per-piece customer charges are included for received equipment and grouped for event-month billing review; Finance confirms revenue recognition, especially future demob and cleaning',
        'What we will charge for labour (per piece from the card, ticked as it is done, plus the hourly scope over the event)':'What we will charge for labour (applicable card charges included when equipment arrives, plus the hourly scope over the event)',
        '<th class="num">Ticked so far</th><th class="num">Expected on site, not ticked</th>':'<th class="num">Charges included</th><th class="num">Unpriced onsite scope</th>'
    }
    for old,new in changes.items(): html=rep(html,old,new,'Charge inclusion terminology',__file__)
    old="""const d = acc762WorkDate(t) || acc762Date(a.first_date), recordedDate = acc762StampDate(t.at), rate = acc762Money(t.rate), amount = rate != null && multiplier != null ? rate * multiplier : null;
 const br = (branchOf(a.key) || {}).code || 'no branch', stream = (kinds[t.key] || t.name || 'Equipment service') + ' — recorded per-piece work';
 const extra = {ref: a.key, item: line.item, kind: t.key, unit: unit.unit || null, recordedDate, quantity: multiplier, rate, date: d};
if (!d) return unallocated(out.unallocatedRevenue, stream, br, amount, 'Ticked, but the reference has no day in on the schedule; the time a tick was entered is not a confirmed work date', extra);
 if (inM(d)) addRev(stream, br, amount, 'the card’s per-piece rate · dated by the day the reference went in', Object.assign(extra, {status: acc762Status(d, month, asAt), forecastAmount: d > asAt ? amount : 0}));"""
    new="""const chargeScope1006=!!lab.chargeInclusion1006&&!t.fire914, quantity1006=Object.hasOwn(t,'chargeQty975')?t.chargeQty975:multiplier;
 const d=chargeScope1006?acc762Date(ev&&ev.from):acc762WorkDate(t)||acc762Date(a.first_date),recordedDate=acc762StampDate(t.at),rate=acc762Money(t.rate),amount=rate!=null&&quantity1006!=null?Math.round(rate*quantity1006*100)/100:null;
 const br=(branchOf(a.key)||{}).code||'no branch',stream=(kinds[t.key]||t.name||'Equipment service')+(chargeScope1006?' — onsite charges for event-month billing':' — recorded per-piece work');
 const extra={ref:a.key,item:line.item,kind:t.key,unit:unit.unit||null,recordedDate,quantity:quantity1006,rate,date:d,chargeIncluded1006:chargeScope1006};
 if(!d)return unallocated(out.unallocatedRevenue,stream,br,amount,chargeScope1006?'Billing month needs event dates':'Recorded work date needs confirmation',extra);
 if(inM(d))addRev(stream,br,amount,chargeScope1006?'Applicable card charges included for received equipment; Finance confirms invoice and revenue recognition. Inclusion does not record demob or cleaning completed.':'the card’s per-piece rate · dated by the day the reference went in',Object.assign(extra,{status:chargeScope1006?'review':acc762Status(d,month,asAt),forecastAmount:chargeScope1006?0:d>asAt?amount:0}));"""
    html=rep(html,old,new,'Finance charge quantity and event-month billing review',__file__)
    old="""const lm = labourMoney(a.key, l, a.key, a);
 if (L.key === 'fire_ext' && lm.fire914)"""
    new="""const lm = labourMoney(a.key, l, a.key, a);
 if(lm.chargeInclusion1006&&!(L.key==='fire_ext'&&lm.fire914)){
  const mine=(lm.ticked||[]).find(t=>t.key===L.key);if(!mine)return;
  const quantity=mine.chargeQty975;refsTouched++;anyTick=true;
  if(quantity==null||!Number.isFinite(mine.rate)){blocked++;return;}
  ticked+=quantity;units+=quantity;if(quantity<(qtyOf(l)||0))partRefs++;
  sub+=Math.round((mine.rate*quantity+Number.EPSILON)*100)/100;return;
 }
 if (L.key === 'fire_ext' && lm.fire914)"""
    html=rep(html,old,new,'Detailed labour table consumes included quantities',__file__)
    html=rep(html,"const of = t.refs.reduce((n, {a}) => n + (labourUnits(a, t.item).length || 1), 0);","const of = t.refs.reduce((n, {l}) => n + (qtyOf(l)||0), 0);",'Detailed labour denominator is equipment quantity',__file__)
    source=Path(__file__).with_name('charge1006.js').read_text()
    return rep(html,'</body>\n</html>\n','<style id="charge1006-style">[data-charge-included1006]{appearance:none;display:inline-grid;place-content:center;vertical-align:middle;width:14px;height:14px;margin:0 5px 0 0;border:1px solid currentColor;border-radius:3px;opacity:1!important}[data-charge-included1006]:checked::after{content:"✓";font-size:12px;font-weight:900;line-height:1;color:#9c4600}</style><script id="charge1006-script">\n'+source+'\n</script>\n</body>\n</html>\n','Shared onsite charge inclusion',__file__)
