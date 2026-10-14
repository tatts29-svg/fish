"""Author: Andrew Fisher. Receipt-based Inventory demand and read-only supplier requests."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

def apply(html):
    if 'root.Inventory1017=api' in html:
        raise ValueError('Inventory patch already present')
    if 'root.VmsAssignment1016=api' not in html or 'function toiletArrival962(' not in html:
        raise ValueError('Current stock and typed receipt projections required')
    def edit(old,new,label):
        nonlocal html
        html=rep(html,old,new,label,'v10.17 Inventory')
    def scope(start,end,changes):
        nonlocal html
        if html.count(start)!=1 or html.count(end)!=1:
            raise ValueError('Inventory function boundaries changed: '+start)
        section=html[html.index(start):html.index(end,html.index(start))]
        result=section
        for old,new,label in changes:
            result=rep(result,old,new,label,'v10.17 Inventory')
        edit(section,result,start)
    scope('function inv87Facts(e){','const inv87Items = F =>',[
        ("const loc = report && !main ? 'No drop-off yet - report to the pit lane' : main || (bs.length ? 'beside ' + bs.join(', ') : '') || (D ? 'the spot the description names' : 'no location on the map yet');",
         "const loc = report && !main ? 'No drop-off yet - report to the pit lane' : main || (bs.length ? 'beside ' + bs.join(', ') : '') || (D ? 'the spot the description names' : P.kind === 'master' ? 'Master-plan position · ' + a.key : 'no location on the map yet');",
         'Describe an existing master-plan position when landmark text is absent'),
    ])
    edit('return {t: invTypeKey(l, a), item: l.item, asked,onq: CurrentStock996.quantity(a,l.item,td,toiletArrival962(a,l.item,td,on ? (sup != null ? sup + restArrived(a, l.item) : asked) : 0))};',
         'const rawReceived=toiletArrival962(a,l.item,td,on ? (sup != null ? sup + restArrived(a, l.item) : asked) : 0), received1017=CurrentStock996.received(a,l.item,td,rawReceived), ordered1017=Inventory1017.ordered(a,l);\n return {t: invTypeKey(l, a), item: l.item, asked:ordered1017,received1017,remaining1017:Math.max(0,ordered1017-received1017),onq: CurrentStock996.quantity(a,l.item,td,rawReceived)};',
         'Separate requested, received and current stock at each typed line')
    edit('onsite: on}); R.asked += x.asked;\n if (!x.onq) return;',
         'onsite: on}); R.asked += x.asked;\n r.received1017=(r.received1017||0)+x.received1017;R.received1017=(R.received1017||0)+x.received1017;\n r.remaining1017=(r.remaining1017||0)+x.remaining1017;R.remaining1017=(R.remaining1017||0)+x.remaining1017;\n if (!x.onq) return;',
         'Aggregate remaining by typed reference without offsetting overdelivery')
    # Two occurrences have separate whole anchors, so each replacement must match once.
    scope('function inv87Refs(r){','/* v7.82 - every location still to come',[
        ('filter(x => x.asked - x.on > 0)','filter(x => Inventory1017.remaining(x) > 0)','Reference remaining filter'),
        ('const n = x.asked - x.on, d = due(x.key);','const n = Inventory1017.remaining(x), d = due(x.key);','Reference remaining label'),
        ("const due = k => { const a = assetOf(k); return (a && effectiveDates(a).in) || ''; };","const due = k => { const x=r.refs[k];return x?.sourceOnly1017?x.due1017:Inventory1017.due(k,null,r.item,Inventory1017.remaining(x)); };",'Shared request date'),
    ])
    start='function togo782Html(I){\n'
    end=' if (!list.length) return `<div class="tg782">'
    old=html[html.index(start):html.index(end,html.index(start))]
    edit(old,start+' const list=Inventory1017.outstanding(I,INV.disc);\n','Screen outstanding list uses shared receipt demand')
    edit('Still to come - every location (${list.length})','Still to come - ${list.length} delivery stops','Count dated rows as delivery stops')
    start='function inv83Togo(I){\n'
    end='function inv83Pages(){'
    old=html[html.index(start):html.index(end,html.index(start))]
    edit(old,start+' return Inventory1017.outstanding(I,INV.disc);\n}\n','PDF shares exact outstanding rows')
    scope('function inv83Pages(){','function inv83Open(', [
        ("const toCome = Math.max(0, tot('asked') - tot('on'));","const toCome = rows.reduce((n,r)=>n+Inventory1017.remaining(r),0);",'Export outstanding total'),
        ('go = Math.max(0, r.asked - r.on);','go = Inventory1017.remaining(r);','Export outstanding row'),
        ('${tiles}<table>','${tiles}${Inventory1017.placements(I,true)}<table>','Portrait reinstatement work'),
        ("${k ? '' : tiles}<table>","${k ? '' : tiles+Inventory1017.placements(I,true)}<table>",'Landscape reinstatement work'),
        ('<div class="card ln87p"><div class="c1"><span class="ref">${esc(a.key)}</span>','<div class="card ln87p"><div class="c1"><span class="ref"${F.sourceOnly1017 ? \' style="font-size:9pt;overflow-wrap:anywhere"\' : \'\'}>${esc(a.key)}</span>','Read-only request reference fits PDF'),
        ('const PORTRAIT_ROWS = 34, LAND_ROWS = 33, pages = [];','const placementNote1017=!!Inventory1017.placements(I,true), PORTRAIT_ROWS = placementNote1017?31:34, LAND_ROWS = 33, pages = [];','Reserve summary note space'),
        ('const first = LAND_ROWS - 9;','const first = LAND_ROWS - (placementNote1017?13:9);','Reserve landscape note space'),
        ('const PER = 10;','const PER = 9;','Nine fully readable location rows per A4 page'),
        ("<i>at ${togo.length} location${togo.length === 1 ? '' : 's'}</i>","<i>at ${Inventory1017.locationCount(togo)} location${Inventory1017.locationCount(togo) === 1 ? '' : 's'}</i>",'Export unique location count'),
        ("${togo.length} location${togo.length === 1 ? '' : 's'}, by the day due","${togo.length} delivery stop${togo.length === 1 ? '' : 's'}, by the day due",'Export dated row count'),
        ('togo: togo.length, money, what','togo: Inventory1017.locationCount(togo), money, what','Export summary reports unique locations'),
    ])
    scope(' const card = e => { const F = inv87Facts(e),',' const card783 = e => {',[
        ("'<div class=\"nq\">No map spot yet - set it in Edit</div>'","'<div class=\"nq\">'+(F.sourceOnly1017?'Exact position not recorded · no navigation QR':'No map spot yet - set it in Edit')+'</div>'",'No invented request position or editor'),
        ('${inv87Loc(F)}${sat ?',"${F.sourceOnly1017?'':inv87Loc(F)}${sat ?",'Unpositioned source request uses destination text space'),
        (" : '<span class=\"sat ns\">no satellite picture</span>'}"," : F.sourceOnly1017 ? '' : '<span class=\"sat ns\">no satellite picture</span>'}",'Do not reserve a fictional supplier satellite picture'),
    ])
    scope('function invHtml(ro){','function invBind(pane){',[
        ("invCell(r, 'togo', Math.max(0, r.asked - r.on))","invCell(r, 'togo', Inventory1017.remaining(r))",'Inventory remaining cell'),
        ("${Math.max(0, tot('asked') - tot('on'))}","${rows.reduce((n,r)=>n+Inventory1017.remaining(r),0)}",'Inventory remaining footer'),
        ('${invDrillHtml(I)}','${Inventory1017.placements(I,false)}\n ${invDrillHtml(I)}','Separate planned reinstatement work'),
        ("Total on site = at locations + spares. At locations: the order's quantity once it is ticked on site (or what was recorded as supplied).Mixed-item locations", "Total on site = current quantities at locations + spares. Still to come = ordered less received, counted separately at each location and item. A later move or collection does not create another delivery. Ordered retains original placement scope; verified reinstatement work is shown separately from new supply. Mixed-item locations",'Concise quantity basis in existing More info'),
    ])
    scope('function invDrillHtml(I){','/* v7.32 - A LOCATION',[
        ("const due = k => { const a = assetOf(k), d = a ? effectiveDates(a).in : null; return d || ''; };","const due = k => Inventory1017.due(k,I,r.item);",'Drill current request dates'),
        ("togo: refs.filter(x => x.asked - x.on > 0).sort((p, q) => String(due(p.key)).localeCompare(String(due(q.key)))).map(x => [x, x.onsite ? `short ${x.asked - x.on} - ${x.on} of ${x.asked} here` : `${x.asked} not on site yet${due(x.key) ? ' · due in ' + chShort(due(x.key)) : ''}`]),", "togo: refs.filter(x => Inventory1017.remaining(x) > 0).sort((p,q)=>String(due(p.key)).localeCompare(String(due(q.key)))).map(x=>[x,`${Inventory1017.remaining(x)} still to come · ${x.received1017||0} of ${x.asked} received`]),",'Drill remaining scope'),
        ('asked: refs.map(x =>','asked: refs.filter(x=>x.asked>0).map(x =>','Exclude repeat placement from new supply drill'),
        ("const es = pick.map(([x]) => ({key: x.key, a: assetOf(x.key), items: [(x.asked - x.on) + ' × ' + r.item], short: !!x.onsite, due: due(x.key)})).filter(e => e.a), n7 = pick.reduce((s, [x]) => s + x.asked - x.on, 0);", "const es = Inventory1017.outstanding({...I,list:[r]},r.disc,true), n7 = pick.reduce((s,[x])=>s+Inventory1017.remaining(x),0);",'Drill uses dated supplier portions'),
        ("D.col === 'togo' ? x.asked - x.on :","D.col === 'togo' ? Inventory1017.remaining(x) :",'Drill alternative aggregate'),
        ("at ${es.length} location${es.length === 1 ? '' : 's'}","at ${Inventory1017.locationCount(es)} location${Inventory1017.locationCount(es) === 1 ? '' : 's'}",'Drill unique locations across split days'),
        ('.map(([x, w]) => `<li><button type="button" class="invref"', '.map(([x, w]) => x.sourceOnly1017 ? `<li><b>${esc(x.key)}</b> · ${esc(w)} · ${esc(x.source1017.name)}<details><summary>More info</summary><p>${esc(Inventory1017.sourceNote(x.source1017))}</p><p>Supplier request · no receipt or native location reference recorded.</p></details></li>` : `<li><button type="button" class="invref"','Source requests have no dead edit link'),
    ])
    edit('Everything ordered that is not on site yet${INV.disc', 'Outstanding deliveries after recorded receipts${INV.disc','Delivery list explains its measure')
    edit("'#tg782 [data-open], #invDrill [data-open]'","'#tg782 [data-open], #invDrill [data-open], .wb1017-reinstatement [data-open]'",'Bind reinstatement reference links through existing asset navigation')
    edit('align-items:center;height:23.4mm;border:0;border-top:.3mm solid #d7dde4;','align-items:center;min-height:26mm;height:auto;flex-shrink:0;border:0;border-top:.3mm solid #d7dde4;','Allow map and QR contents to fit each Inventory PDF row')
    return rep(html,'\n</body>\n</html>','\n<script id="inventory1017-script">\n'+(HERE/'inventory1017.js').read_text()+'\n</script>\n</body>\n</html>','Shared Inventory receipt projection','v10.17')
