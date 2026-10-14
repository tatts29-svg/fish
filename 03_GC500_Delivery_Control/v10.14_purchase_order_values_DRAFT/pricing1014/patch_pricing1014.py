"""Author: Andrew Fisher. Runs after label-only patch_v1014.apply_display; source identities remain native data."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

def apply(html):
    def one(old,new,label):
        nonlocal html
        html=rep(html,old,new,label,'supplier pricing v10.14')
    one("'receipted_amount', 'what'].forEach", "'receipted_amount', 'what', 'supplier_pricing'].forEach", 'Expose current native supplier pricing on P/O')
    one("allDockets().filter(d => d.usable).forEach(d => (d.lines || []).forEach(l => { if (l.paid == null) return;", "allDockets().filter(d => d.usable).forEach(d => (d.supplier_lines || d.lines || []).forEach(l => { if (l.paid == null) return;", 'Split approved supplier billed quantities')
    one(" const fd = fenceDerived(), G = greenBookTotals();\n gear = r2(gear);", " supplierExtras1014().forEach(l=>{lab+=l.paid;const x=labCols.get(l.name)||{qty:0,unit:l.unit};x.qty+=l.qty;labCols.set(l.name,x);});\n const fd = fenceDerived(), G = greenBookTotals();\n gear = r2(gear);", 'Split dated team leaders once')
    one(" const greenPriced = !!(G.notes && G.rate != null), green = greenPriced ? G.amount : 0;", " const greenPriced = !!G.priced, green = greenPriced ? G.amount : 0;", 'Include source-priced service notes')
    one("(cost.fencing_labour && cost.fencing_labour.rate != null ? cost.fencing_labour.amount : 0)", "(cost.fencing_labour && cost.fencing_labour.priced ? cost.fencing_labour.amount : 0)", 'Cost total includes priced notes at differing rates')
    one("if (X.cost.fencing_labour && X.cost.fencing_labour.rate != null) add(", "if (X.cost.fencing_labour && X.cost.fencing_labour.priced) add(", 'Categories include individually priced service notes')
    one("if (X.cost.fencing_labour && X.cost.fencing_labour.rate != null) put('fencing', X.cost.fencing_labour.amount, `Installation — external contractors: the green book, Advanced's labour and truck hours — ${hoursTxt(X.cost.fencing_labour.hours)} h × ${money(X.cost.fencing_labour.rate)} = ${money(X.cost.fencing_labour.amount)}`);", "if (X.cost.fencing_labour && X.cost.fencing_labour.priced) put('fencing', X.cost.fencing_labour.amount, 'Installation — external contractors: '+supplierGreenText1014(X.cost.fencing_labour));", 'Category description reflects per-note rates')
    one("G && G.notes && G.rate != null && G.amount", "G && G.priced && G.amount", 'Branch summary includes priced green notes')
    # The surviving source templates also need honest per-note labels when rates differ.
    old="${esc(hoursTxt(greenBookTotals().hours))} h · Direct cost ${greenBookTotals().rate==null?'No rate':esc(money(greenBookTotals().amount))} · ${greenBookTotals().rate==null?'Rate not recorded':esc(money(greenBookTotals().rate))+' / h · '+(greenBookTotals().rate_source==='typed'?'typed rate by '+esc(greenBookTotals().rate_by||'unnamed'):'Advanced cost sheet')}"
    one(old,"${esc(supplierGreenText1014(greenBookTotals()))}",'Green book live price label')
    old="${esc(hoursTxt(greenBookTotals().hours))} h · Direct cost ${greenBookTotals().rate==null?'No rate':esc(money(greenBookTotals().amount))} · ${greenBookTotals().rate==null?'Rate not recorded':esc(money(greenBookTotals().rate))+' / h'} · ${greenBookTotals().rate_source==='typed'?'typed rate by '+esc(greenBookTotals().rate_by||'unnamed'):'Advanced cost sheet'}"
    one(old,"${esc(supplierGreenText1014(greenBookTotals()))}",'Green book print price label')
    old="const gb = k.fencing_labour ? `${esc(hoursTxt(k.fencing_labour.hours))} h on ${pl(k.fencing_labour.notes, 'service note')}${k.fencing_labour.rate != null ? ` × ${esc(money(k.fencing_labour.rate))}` : ' — no Labour rate yet'}` : '';"
    one(old,"const gb = k.fencing_labour ? esc(supplierGreenText1014(k.fencing_labour)) : '';",'Money card green note basis')
    one("SP.docket_labour || (k.fencing_labour && k.fencing_labour.rate != null)","SP.docket_labour || (k.fencing_labour && k.fencing_labour.priced)",'Money card installation amount')
    one("gb ? `the green book, ${gb}${k.fencing_labour.rate != null ? ` = ${esc(money(k.fencing_labour.amount))}` : ''}` : ''", "gb ? `the green book, ${gb}` : ''",'Money card note total once')
    one("k.fencing_labour.rate != null ? m0(k.fencing_labour.amount)","k.fencing_labour.priced ? m0(k.fencing_labour.amount)",'Money card unclassified note total')
    one("${SP.green_priced ? ` × ${esc(rt)} = ${m(SP.green)}` : ' — no Labour rate yet, so not in dollars'}", "${SP.green_priced ? ` · rates on notes = ${m(SP.green)}` : ' — no Labour rate yet, so not in dollars'}", 'Old P&L green rate basis')
    one("${SP.green_priced ? ` × ${esc(rt)}` : ' — no Labour rate yet'}", "${SP.green_priced ? ' · rates on notes' : ' — no Labour rate yet'}", 'Old P&L fallback green basis')
    one('return `<div class="card">\n <div class="hubtitle"><h3>Purchase orders ', 'return `<div class="card" data-po-values1014>\n <div class="hubtitle"><h3>Purchase orders ', 'Mark the requested P/O commercial reference card')
    one("root.querySelectorAll('table').forEach(table=>{\nconst indices=new Set();", "root.querySelectorAll('table').forEach(table=>{\nif(table.closest('[data-po-values1014]'))return; // P/O value and its reconciliation are explicitly requested here.\nconst indices=new Set();", 'Preserve P/O reference and reconciliation through operational cleanup')
    one("root.querySelectorAll('p,.kpi,.notice').forEach(n=>{if(/\\$\\s*[\\d,]+/.test(n.textContent)&&!n.querySelector('input,button,a'))n.remove();});", "root.querySelectorAll('p,.kpi,.notice').forEach(n=>{if(n.closest('[data-po-values1014]'))return;if(/\\$\\s*[\\d,]+/.test(n.textContent)&&!n.querySelector('input,button,a'))n.remove();});", 'Preserve approved P/O source breakdown prose')
    # Monthly totals use the same line projection. Extras are dated costs, not fake hours or payment.
    anchor=" if (!green.length && M.cost && M.cost.fencing_labour && M.cost.fencing_labour.amount)"
    extra=""" supplierExtras1014().forEach(x=>{const date=acc762Date(x.date),amount=acc762Money(x.paid);if(inM(date))addCost('Installation — external contractors, approved team leaders',x.branch,amount,'Dated supplier programme · team-leader day rate · cost only, not proof of payment',{id:x.id,po:x.po,date,status:acc762Status(date,month,asAt),forecastAmount:date>asAt?amount:0});});
"""
    one(anchor,extra+anchor,'Finance dated team-leader costs once')
    one("'Supplier rates on dockets; paid_total is a cost calculation, not proof of payment; match invoices before any accrual'", "d.supplier_po?'Approved supplier programme · P/O '+d.supplier_po+'; billed quantities are separate from site counts; not proof of payment':'Supplier rates on dockets; paid_total is a cost calculation, not proof of payment; match invoices before any accrual'", 'Finance explains approved supplier pricing')
    # Docket detail must not display stale paid-rate × physical-quantity arithmetic.
    one("<span>${l.paid_rate==null?'Direct cost rate not recorded':esc(rateMoney(l.paid_rate))+' × '+esc(fmtQty(l.qty,l.unit))+' = '+esc(money(l.paid))}</span>", "${d.supplier_lines?'':`<span>${l.paid_rate==null?'Direct cost rate not recorded':esc(rateMoney(l.paid_rate))+' × '+esc(fmtQty(l.qty,l.unit))+' = '+esc(money(l.paid))}</span>`}", 'Keep customer lines separate from approved supplier detail')
    one("book==='green'?`<p>Advanced labour: ${esc(hoursTxt(d.labour_hours))} h ×", "book==='green'&&d.supplier_lines?`<p>Recorded work: ${esc(hoursTxt(d.labour_hours))} h. Supplier billed hours and costs are below.</p>`:book==='green'?`<p>Advanced labour: ${esc(hoursTxt(d.labour_hours))} h ×", 'Green source hours and billed hours stay distinct')
    one("${lines?`<div class=\"fp-rate-lines\">${lines}</div>`:''}<dl>", "${lines?`<div class=\"fp-rate-lines\">${lines}</div>`:''}${supplierRecordDetail1014(d)}<dl>", 'Supplier billed-line disclosure')
    one("const amount=book==='red'&&!(d.lines||[]).length?", "const amount=book==='red'&&d.supplier_lines&&!(d.lines||[]).length?`<span><small>Revenue</small><b>No priced quantities</b></span><span><small>Direct cost · approved</small><b>${esc(money(d.paid_total))}</b></span>`:book==='red'&&!(d.lines||[]).length?", 'Components-only record still shows supplier cost')
    one("<td><b class=\"mono\">${poLabel1014(o.number)}</b>${o._local", "<td><b class=\"mono\">${poLabel1014(o.number)}</b>${poSupplierBlock1014(o.number)}${o._local", 'Fencing P/O reconciliation')
    one("<td><b class=\"mono\">${poLabel1014(o.number)}</b><br><span class=\"w fh866-mute\">", "<td><b class=\"mono\">${poLabel1014(o.number)}</b>${poSupplierBlock1014(o.number)}<br><span class=\"w fh866-mute\">", 'Finance P/O reconciliation')
    one("<b>paid</b> beside it is the same quantity × what ${esc((DATA.fence_contractor || {}).name || 'the crew')} bill Coates on their own sheet", "<b>paid</b> uses an approved P/O supplier programme where linked; otherwise the recorded quantity × what ${esc((DATA.fence_contractor || {}).name || 'the crew')} bill Coates on their own sheet", 'Rate rules explain scoped supplier pricing')
    one("A rate typed in the table below is per the column's unit, overrides that side for that column on every\n docket", "A rate typed in the table below is per the column's unit. Customer overrides apply to that column on every docket; supplier overrides apply where no approved P/O supplier programme is linked on the\n docket", 'Main rate override scope')
    one("A rate typed on either side is per the column's unit, overrides that side for that column on every docket, and carries your name.", "A typed customer rate applies to that column on every docket. A typed supplier rate applies where no approved P/O supplier programme is linked. Both carry your name.", 'Rate table override scope')
    marker='<script id="supplier-pricing1014-script">'
    if marker in html:raise ValueError('Supplier pricing already applied')
    script=marker+'\n'+(HERE/'supplier_core1014.js').read_text()+'\n'+(HERE/'supplier_runtime1014.js').read_text()+'\n</script>\n'
    one('</body>\n</html>',script+'</body>\n</html>','Install one supplier pricing engine')
    return html
