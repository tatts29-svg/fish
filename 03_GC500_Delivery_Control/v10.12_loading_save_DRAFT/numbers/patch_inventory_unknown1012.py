"""Author: Andrew Fisher. Preserve missing Inventory quantities through screen, drill and PDF readers."""
import sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parents[1]/'toolchain'))
from rep import rep

def apply(html):
    if 'InventoryUnknown1012' in html: raise ValueError('Unknown inventory patch already applied')
    if 'typedSingle1012' not in html: raise ValueError('Apply the v10.12 typed inventory helper first')
    def change(old,new,label):
        nonlocal html
        html=rep(html,old,new,label,'v10.12')
    def within(name,old,new,label):
        nonlocal html
        start=html.index('function '+name+'(');end=html.index('\n}',start)+2
        oldfn=html[start:end];newfn=rep(oldfn,old,new,label,'v10.12')
        html=rep(html,oldfn,newfn,name+' unknown quantity reader','v10.12')
    change('function inventory(){',(HERE/'inventory_unknown1012.js').read_text()+'\nfunction inventory(){','Known quantity inventory helper')
    within('inventory','const asked = qtyOf(l) != null ? qtyOf(l) : 1, ir = irs.find(i => i.asked === l.item);','const rawAsked1012 = qtyOf(l), asked = InventoryUnknown1012.valid(rawAsked1012) ? rawAsked1012 : null, ir = irs.find(i => i.asked === l.item);','No guessed ordered unit')
    within('inventory',"Number.isFinite(Number(ir.qty_supplied)) ? Number(ir.qty_supplied) : null;","Number.isFinite(Number(ir.qty_supplied)) && Number(ir.qty_supplied)>=0 ? Number(ir.qty_supplied) : null;",'Invalid receipt is not stock')
    within('inventory','r.asked += x.asked;','r.asked += x.asked == null ? 0 : x.asked;','Accumulate known orders only')
    within('inventory','R.asked += x.asked;','R.asked += x.asked == null ? 0 : x.asked; InventoryUnknown1012.record(r,R,x);','Track uncertainty and known balance at reference and type')
    within('inventory','filter(r => r.asked || r.on || r.spares)','filter(r => r.asked || r.on || r.spares || r.unknownAsked1012 || r.unknownOn1012)','Retain references without a measured quantity')
    within('invCell'," if (!n) return inner != null ? inner : '<span class=\"norate\">0</span>';", " if(col==='togo')n=InventoryUnknown1012.remaining(r);\n const unknown1012=InventoryUnknown1012.unknown(r,col);\n if(unknown1012)inner=InventoryUnknown1012.badge(r,col,n);\n if (!n&&!unknown1012) return inner != null ? inner : '<span class=\"norate\">0</span>';",'Unknown quantity remains visible and opens its reference')
    within('invHtml',"${tot('on') + tot('spares')}","${InventoryUnknown1012.total(rows,'total')}",'Screen total onsite known scope')
    within('invHtml',"${tot('on')}</td>","${InventoryUnknown1012.total(rows,'on')}</td>",'Screen total at locations known scope')
    within('invHtml',"${Math.max(0, tot('asked') - tot('on'))}","${InventoryUnknown1012.total(rows,'togo')}",'Screen outstanding balance known scope')
    within('invHtml',"${tot('asked')}","${InventoryUnknown1012.total(rows,'asked')}",'Screen total ordered unknown scope')
    within('invHtml',"At locations: the order's quantity once it is ticked on site (or what was recorded as supplied).","At locations: the known ordered quantity once recorded on site, or the recorded supplied quantity. Missing quantities stay unknown.",'Explain known quantity basis')
    within('inv87Refs','filter(x => x.asked - x.on > 0)','filter(InventoryUnknown1012.pending)','Unknown reference still discoverable')
    within('inv87Refs','const n = x.asked - x.on, d = due(x.key);',"const n = InventoryUnknown1012.remaining(x), d = due(x.key);",'Reference known remaining quantity')
    within('inv87Refs','${n} ${esc(r.item)} still to come',"${esc(InventoryUnknown1012.pendingText(x,r.item))}",'Reference quantity review title')
    for fn in ['togo782Html','inv83Togo']:
        within(fn,'const n = x.asked - x.on; if (n <= 0) return;','const n = InventoryUnknown1012.remaining(x); if (!InventoryUnknown1012.pending(x)) return;','Retain unknown pending reference')
        within(fn,"e.items.push(n + ' × ' + r.item);", "e.items.push(InventoryUnknown1012.pendingText(x,r.item)); if(InventoryUnknown1012.unknown(x,'togo'))e.review1012=true;",'Outstanding line keeps unknown quantity')
    within('inv87Facts',"const tags = [e.short ? ['am', 'Short - the rest still to come'] : ['gy', 'Not on site yet']]", "const tags = [e.review1012 ? ['am','Quantity to confirm'] : e.short ? ['am', 'Short - the rest still to come'] : ['gy', 'Not on site yet']]",'Unknown scope does not claim no delivery')
    within('inv83Pages',"const toCome = Math.max(0, tot('asked') - tot('on'));","const toCome = InventoryUnknown1012.total(rows,'togo');",'PDF outstanding known quantity')
    within('inv83Pages',"${tot('on') + spares}","${InventoryUnknown1012.total(rows,'total')}",'PDF total onsite unknown quantity')
    # The top tile and footer both use known on-site / ordered totals.
    start=html.index('function inv83Pages(');end=html.index('\n}',start)+2;part=html[start:end]
    for old,new in [("${tot('on')}","${InventoryUnknown1012.total(rows,'on')}"),("${tot('asked')}","${InventoryUnknown1012.total(rows,'asked')}")]:
        if part.count(old)!=2: raise ValueError('Expected two PDF total occurrences: '+old)
        part=part.replace(old,new)
    html=rep(html,html[start:end],part,'PDF known subtotal labels','v10.12')
    within('inv83Pages','go = Math.max(0, r.asked - r.on);',"go = InventoryUnknown1012.pending(r) ? InventoryUnknown1012.text(r,'togo') : '';",'PDF row remaining scope')
    within('inv83Pages','${r.asked}</td><td class="n">${r.on}',"${InventoryUnknown1012.text(r,'asked')}</td><td class=\"n\">${InventoryUnknown1012.text(r,'on')}",'PDF row known orders and receipts')
    within('invDrillHtml','total: refs.filter(x => x.on > 0).map(x => [x, `${x.on} on site`]),',"total: refs.filter(x => x.on > 0||InventoryUnknown1012.unknown(x,'on')).map(x => [x, `${InventoryUnknown1012.text(x,'on')} on site`]),",'Unknown onsite scope can be inspected')
    within('invDrillHtml','on: refs.filter(x => x.on > 0).map(x => [x, `${x.on} of ${x.asked} on site`]),',"on: refs.filter(x => x.on > 0||InventoryUnknown1012.unknown(x,'on')).map(x => [x, `${InventoryUnknown1012.text(x,'on')} on site · ${InventoryUnknown1012.text(x,'asked')} ordered`]),",'Onsite drill no invented denominator')
    within('invDrillHtml','refs.filter(x => x.asked - x.on > 0)', 'refs.filter(InventoryUnknown1012.pending)','Unknown outstanding drill included')
    within('invDrillHtml',"x.onsite ? `short ${x.asked - x.on} - ${x.on} of ${x.asked} here` : `${x.asked} not on site yet${due(x.key) ? ' · due in ' + chShort(due(x.key)) : ''}`", "InventoryUnknown1012.unknown(x,'togo') ? InventoryUnknown1012.pendingText(x,r.item) : x.onsite ? `short ${x.asked - x.on} - ${x.on} of ${x.asked} here` : `${x.asked} not on site yet${due(x.key) ? ' · due in ' + chShort(due(x.key)) : ''}`",'Outstanding drill no invented amount')
    within('invDrillHtml','`${x.asked} ordered${x.on ?',"`${InventoryUnknown1012.text(x,'asked')} ordered${x.on ?",'Ordered drill unknown label')
    within('invDrillHtml',"items: [(x.asked - x.on) + ' × ' + r.item], short: !!x.onsite", "items: [InventoryUnknown1012.pendingText(x,r.item)], review1012:InventoryUnknown1012.unknown(x,'togo'), short: !!x.onsite",'Outstanding card unknown item quantity')
    within('invDrillHtml',"n7 = pick.reduce((s, [x]) => s + x.asked - x.on, 0);", "n7 = InventoryUnknown1012.total(pick.map(([x])=>x),'togo');",'Outstanding heading unknown total')
    within('invDrillHtml',"${n}${pick.length ? ' at '","${InventoryUnknown1012.words(n,InventoryUnknown1012.unknown(r,D.col))}${pick.length ? ' at '",'Drill heading known subtotal plus unknown')
    return html
