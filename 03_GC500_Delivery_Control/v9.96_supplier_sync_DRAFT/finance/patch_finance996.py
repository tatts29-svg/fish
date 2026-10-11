# Author: Andrew Fisher. Share missing source-row forecasts with native financial projections.
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

def patch(html):
    if 'id="finance-request996-script"' in html:
        raise RuntimeError('Finance request forecast already applied')
    if 'function resolveRequest(request,assets)' not in html:
        raise RuntimeError('Finance996 requires the shared Supplier996 request resolver')
    changes=[
        ("const cfg=DATA.transport_forecast831||{}, assets=allAssets(), sources=ONHIRE_ROWS||[];", "const cfg=DATA.transport_forecast831||{}, assets=FinanceRequest996.assets(), sources=ONHIRE_ROWS||[];", 'Source-row customer transport demand'),
        ("const sourceRows=a=>{const nums=list(a.asset_numbers).map(String);return sources.filter(r=>!r.charge_line&&((r.asset_no_is_plant_number&&nums.includes(str(r.asset_no)))||(r.match&&r.match.to==='asset'&&r.match.key===a.key)));};", "const sourceRows=a=>{const nums=list(a.asset_numbers).map(String),source996=a._financialForecast996?FinanceRequest996.contractRows(a.key):[];return sources.filter(r=>!r.charge_line&&(source996.includes(r)||(r.asset_no_is_plant_number&&nums.includes(str(r.asset_no)))||(r.match&&r.match.to==='asset'&&r.match.key===a.key)));};", 'Exact named contract lines also supply native transport coverage'),
        ("for(const a of allAssets().filter(a=>!a._cancelled&&!a.rest_of&&!movedAway(a.key))){\n   for(const line of chargeLines(a)){", "for(const a of FinanceRequest996.assets().filter(a=>!a._cancelled&&!a.rest_of&&!movedAway(a.key))){\n   for(const line of chargeLines(a)){", 'Source-row installation and demob forecast'),
        ("allAssets().filter(a => !a._cancelled && !a.rest_of && !movedAway(a.key)).forEach(a => { /* v8.65", "FinanceRequest996.assets().filter(a => !a._cancelled && !a.rest_of && !movedAway(a.key)).forEach(a => { /* v8.65", 'Same native labour plan and Finance slots'),
        ("const buildingTransport = buildingTransportModel831(), peeHire979=peeHireForecast979();", "const buildingTransport = buildingTransportModel831(), peeHire979=peeHireForecast979(), sourceHire996=FinanceRequest996.model();", 'One uncovered source hire model'),
        ("+ peeHire979.amount),hireToCome979:peeHire979.amount,noCardRate:", "+ peeHire979.amount + sourceHire996.amount),hireToCome979:peeHire979.amount,sourceHire996,noCardRate:", 'Forecast total includes source hire once'),
        ("job: r2(rehireLines + fence + n(F.revenue) + peeHireForecast979().amount)", "job: r2(rehireLines + fence + n(F.revenue) + peeHireForecast979().amount + FinanceRequest996.model().amount)", 'Rehire Revenue ledger forecast'),
        (" const T = {rev: r2(groups.reduce", " const sourceHire996=FinanceRequest996.model();if(ep979&&sourceHire996.amount){ep979.revToCome=r2((ep979.revToCome||0)+sourceHire996.amount);ep979.revJob=r2((ep979.revJob||0)+sourceHire996.amount);ep979.sourceHire996=sourceHire996;}\n const T = {rev: r2(groups.reduce", 'Supplier Rehire Revenue without extra supplier cost'),
        ("  return Branch978.model({branches:B,", "  FinanceRequest996.model().rows.filter(r=>r.amount>0).forEach(r=>revenueForecastRows.push({branch:r.branch,amount:r.amount}));\n  return Branch978.model({branches:B,", 'Same hire forecast in branch and Finance handover'),
    ]
    for old,new,label in changes:
        html=rep(html,old,new,label,'finance996')
    return rep(html,'</body>\n</html>','<script id="finance-request996-script">\n'+(HERE/'finance996.js').read_text()+'\n</script>\n</body>\n</html>','Source request forecast adapter','finance996')
