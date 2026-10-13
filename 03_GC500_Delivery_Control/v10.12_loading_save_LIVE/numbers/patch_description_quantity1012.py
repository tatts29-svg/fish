"""Author: Andrew Fisher. One shared description-based quantity rule, never asset-number counting."""
import sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'toolchain'))
from rep import rep

def apply(html):
    if 'function descriptionQuantity1012(' in html: raise ValueError('Description quantity rule already applied')
    def change(old,new,label):
        nonlocal html
        html=rep(html,old,new,label,'v10.12')
    change('function buildAllAssets(){',(HERE/'description_quantity1012.js').read_text()+'\nfunction buildAllAssets(){','Shared described-item quantity rule')
    start=html.index(' /* v6.82 - A MISSING QUANTITY WORKED OUT FROM THE ASSET NUMBERS')
    end=html.index(' /* and the schedule\'s own rows for a building',start)
    html=rep(html,html[start:end]," /* v10.12: the project manager confirms one per separately described item unless a quantity is stated. */\n if(!a.relocation&&chargeLinesOut?.length)chargeLinesOut=chargeLinesOut.map(l=>descriptionLine1012(l,chargeLinesOut.length===1?(desc||a.name):null));\n",'Replace asset-number/default-building inference with shared item rule','v10.12')
    start=html.index("/* and the schedule's own rows for a building")
    end=html.index('/* v7.68 - A WASTE TANK IS A PIECE OF WORK',start)
    html=rep(html,html[start:end]," /* Schedule rows keep explicit quantities; blank described rows use the shared rule. */\n const evsOut=(a.events||[]).map(e=>descriptionEvent1012(e,chargeLinesOut,a.events||[],desc||a.name));\n",'Schedule displays and day readers use described quantity','v10.12')
    change('if (a.charge_lines && a.charge_lines.length) return a.charge_lines;',"if (a.charge_lines && a.charge_lines.length) return a.charge_lines.map(l=>descriptionLine1012(l,a.charge_lines.length===1?a.name:null));",'Every charge-line reader sees the same described quantity')
    old=""" if (a._added) return (a.item_types||[]).map((it, i) => ({
 item:it, discipline:a.discipline,
 quantity: (i === 0 && a._qtyTyped) ? a._qtyTyped.to : Math.max(1, safeNum(a._qty, 9999) || 1),
 quantity_state: (i === 0 && a._qtyTyped) ? 'typed over' + (a._qtyTyped.by ? ' by ' + a._qtyTyped.by : '') : 'entered here', priceable:true}));
 return [];"""
    new=""" return (a.item_types||[]).filter(it=>String(it||'').trim()).map((it,i)=>descriptionLine1012({
 item:it,discipline:a.discipline,
 quantity:i===0&&a._qtyTyped?a._qtyTyped.to:i===0&&a._qty!=null?a._qty:null,
 quantity_state:i===0&&a._qtyTyped?'typed over'+(a._qtyTyped.by?' by '+a._qtyTyped.by:''):a._added?'entered here':'item description',priceable:true},a.item_types.length===1?a.name:null));"""
    change(old,new,'Separate described item lines each carry their own quantity')
    old="""function qtyOf(l){
 const q = l && l.quantity;
 if (q == null || String(q).trim() === '') return null;
 const n = Number(q);
 return Number.isFinite(n) ? n : null;
}"""
    change(old,"function qtyOf(l){return descriptionQuantity1012(l).quantity;}",'Raw and normalized quantity readers agree')
    change('WC01 (a toilet AND two FWF) and WB06 (154 barriers billed as one). A line with no readable quantity is not\n priced and says why — it is never quietly treated as 1.', 'WC01 (a toilet AND two FWF) and WB06 (154 barriers billed as one). A recorded quantity takes precedence;\n otherwise the project manager confirms one per described item, or the quantity explicitly stated in its description.', 'Update quantity rule documentation')
    change("The asked quantity is the schedule's own, from the charge line, unless a person typed one: WC07 asks for\n twenty FWF, and a page that showed it as one was wrong. A cell the schedule leaves blank stays null.", "The asked quantity comes from the shared charge line: recorded quantity first, then an explicit description quantity,\n then one per described item. WC07 asks for twenty FWF, so its recorded twenty remains twenty.", 'Update asked quantity documentation')
    change('const td = todayIso(), rows = new Map();','const td = todayIso(), rows = new Map(), quantityIssues1012=[];','Inventory retains truly invalid references for correction')
    change('const L = chargeLines(a); if (!L.length) return;',"const L = chargeLines(a).filter(l=>{if(qtyOf(l)!=null)return true;quantityIssues1012.push({ref:a.key,item:l.item||l.description||'Item description needed'});return false;}); if (!L.length) return;",'Invalid explicit quantities are excluded rather than counted as one')
    change('const asked = qtyOf(l) != null ? qtyOf(l) : 1, ir = irs.find(i => i.asked === l.item);','const asked = qtyOf(l), ir = irs.find(i => i.asked === l.item);','Inventory consumes shared described quantity without a fallback')
    change('return {list, cos, twice, offOn, spares: spareList(), td};','return {list, cos, twice, offOn, spares: spareList(), td, quantityIssues1012};','Return invalid-quantity reference review separately')
    change('${warn.length ? `<div class="notice warn invwarn">', '${I.quantityIssues1012?.length ? `<div class="notice warn" data-quantity-correction1012><b>Quantity needs correction</b><p>These invalid quantities are excluded from the totals.</p>${I.quantityIssues1012.map(x=>`<button type="button" class="btn ghost sm" data-fixref="${esc(x.ref)}">${esc(x.ref)} · ${esc(x.item)}</button>`).join(\' \')}</div>` : \'\'}\n ${warn.length ? `<div class="notice warn invwarn">', 'Keep invalid-quantity references discoverable')
    change('const tiles = `<div class="tiles"><div class="tile"><span>On site</span>', 'const tiles = `${I.quantityIssues1012?.length ? `<p><b>Quantity needs correction:</b> ${I.quantityIssues1012.map(x=>esc(x.ref+\' · \'+x.item)).join(\'; \')}. Invalid quantities are excluded from totals.</p>` : \'\'}<div class="tiles"><div class="tile"><span>On site</span>', 'Printed inventory discloses excluded invalid quantities')
    return html
