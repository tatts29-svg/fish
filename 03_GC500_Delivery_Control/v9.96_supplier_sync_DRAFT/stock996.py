"""Author: Andrew Fisher. Update current inventory without changing cumulative receipts or pricing."""
from pathlib import Path
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def patch(html):
    if 'const CurrentStock996 =' in html:
        raise ValueError('Current stock adapter already applied')
    if 'demob-weather996-source' not in html:
        raise ValueError('Typed collection reader must be present first')
    replacements = [
        (
            'onq: toiletArrival962(a,l.item,td,on ? (sup != null ? sup + restArrived(a, l.item) : asked) : 0)',
            'onq: CurrentStock996.quantity(a,l.item,td,toiletArrival962(a,l.item,td,on ? (sup != null ? sup + restArrived(a, l.item) : asked) : 0))',
            'Inventory current on-site quantities',
        ),
        (
            "if (a.product==='Toilet'||a.discipline==='Toilets & amenities') for(const item of askedBy.keys()) onBy.set(item,toiletArrival962(a,item,asOf,onBy.get(item)||0));",
            "if (a.product==='Toilet'||a.discipline==='Toilets & amenities') for(const item of askedBy.keys()) onBy.set(item,CurrentStock996.quantity(a,item,asOf,toiletArrival962(a,item,asOf,onBy.get(item)||0)));",
            'Today current on-site quantities',
        ),
        (
            'function toiletProgressView962(a,d,v) {\n if (v.blocked || a._cancelled || d.moved) return v;',
            'function toiletProgressView962(a,d,v) {\n if (v.blocked || a._cancelled || d.moved || CurrentStock996.departed(a,todayIso())) return v;',
            'A recorded collection retains its native departure state',
        ),
        (
            'arrivals[l.item]=toiletArrival962(a,l.item,td,on?(q!=null?q+restArrived(a,l.item):qtyOf(l)||0):0);',
            'arrivals[l.item]=CurrentStock996.received(a,l.item,td,toiletArrival962(a,l.item,td,on?(q!=null?q+restArrived(a,l.item):qtyOf(l)||0):0));',
            'Arrival charge coverage retains evidence of units already collected',
        ),
    ]
    for old, new, label in replacements:
        html = rep(html, old, new, label, __file__)
    # It must exist before the original first render; its optional collection reader
    # is added later and becomes available on normal shared-record hydration.
    return rep(html, 'function toiletItem962(a, item, d, day, nativeOn) {',
               (HERE / 'stock996.js').read_text() + '\nfunction toiletItem962(a, item, d, day, nativeOn) {',
               'Shared current stock adapter', __file__)
