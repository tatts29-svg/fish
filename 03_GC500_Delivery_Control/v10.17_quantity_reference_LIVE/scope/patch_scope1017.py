"""Author: Andrew Fisher. Preserve actual scope atomically with a native planned quantity edit."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

def apply(html):
    if 'root.Scope1017=api' in html:
        raise ValueError('Scope safeguard already present')
    if 'root.VmsAssignment1016=api' not in html:
        raise ValueError('Reviewed v10.16 base required')
    old=" const a = assetOf(key) || {};\n const asSched = a._qtyOnTheSchedule == null ? null : a._qtyOnTheSchedule;"
    new=" const a = assetOf(key) || {};\n const scope1017 = Scope1017.capture(a);\n const asSched = a._qtyOnTheSchedule == null ? null : a._qtyOnTheSchedule;\n const target1017 = raw === '' ? asSched : safeInt(raw, MAX_QTY);\n if (target1017 != null && !Scope1017.allowed(scope1017,target1017)) { flash('The planned quantity cannot be less than the quantity already received or installed. Existing actual records were kept.'); return false; }"
    html=rep(html,old,new,'Capture actuals before native quantity mutation','v10.17')
    html=rep(html," stampIt('qtys', key, who); bump();"," Scope1017.save(scope1017,who); stampIt('qtys', key, who); bump();",'Stage actual baseline and quantity in one native save','v10.17')
    html=rep(html," const asSched = String(a._itemOnTheSchedule || '').trim();\n S.items = S.items || {};", " const asSched = String(a._itemOnTheSchedule || '').trim();\n if (!Scope1017.itemAllowed(a,v||asSched)) { flash('Received equipment is already recorded under its current description. Correct the received item record before changing this planned description.'); return false; }\n S.items = S.items || {};",'Prevent a planned type edit from relabelling protected actual equipment','v10.17')
    html=rep(html," if (!a || !(a.product === 'Toilet' || a.discipline === 'Toilets & amenities')) return null;\n const items = [...new Set((lines || []).map(l=>l.item))]", " if (!a || !(a.product === 'Toilet' || a.discipline === 'Toilets & amenities' || typeof Scope1017!=='undefined' && Scope1017.has(a))) return null;\n const items = [...new Set((lines || []).map(l=>l.item))]",'Shared progress supports quantity-preserved equipment','v10.17')
    html=rep(html,"const toilet962 = def.id==='toilets' ? toiletRows962(a,d,selected,day) : null;", "const toilet962 = toiletRows962(a,d,selected,day);",'Today uses preserved actuals across equipment categories','v10.17')
    html=rep(html,"if (a.product==='Toilet'||a.discipline==='Toilets & amenities') for(const item of askedBy.keys())", "if (a.product==='Toilet'||a.discipline==='Toilets & amenities'||typeof Scope1017!=='undefined'&&Scope1017.has(a)) for(const item of askedBy.keys())",'Shared equipment progress keeps preserved actual quantities','v10.17')
    html=rep(html,"try{if(a.product==='Toilet'||a.discipline==='Toilets & amenities')receipts=toiletRows962(a,deliveryOf(a.key),lines,todayIso());}catch(_){}", "try{receipts=toiletRows962(a,deliveryOf(a.key),lines,todayIso());}catch(_){}",'Map installation counts include preserved equipment actuals','v10.17')
    html=rep(html,"suppliedAt:stamps['supplied/'+a.key+'/'+item]||'',baseline};", "suppliedAt:stamps['supplied/'+a.key+'/'+item]||'',baseline:typeof Scope1017==='undefined'?baseline:Scope1017.receiptBaseline(a,item,baseline)};",'Retain dated item receipts after later cumulative edits','v10.17')
    return rep(html,'\n</body>\n</html>','\n<script id="quantity-scope1017-script">\n'+(HERE/'scope1017.js').read_text()+'\n</script>\n</body>\n</html>','Native planned quantity safeguard runtime','v10.17')
