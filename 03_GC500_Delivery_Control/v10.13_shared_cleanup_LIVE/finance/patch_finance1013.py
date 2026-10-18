"""Author: Andrew Fisher. Append shared current-scope financial projection; no source/native writes."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'toolchain'))
from rep import rep

def apply(html):
    if 'id="finance1013-script"' in html:
        raise ValueError('Finance 10.13 is already applied')
    if 'id="selection-save1012-script"' not in html or 'function pricingForecast1010' not in html and 'window.pricingForecast1010' not in html:
        raise ValueError('Expected live 10.12 shared finance base')
    def change(old,new):
        nonlocal html
        html=rep(html,old,new,'Shared hire 1013',__file__)
    change('charge.uncontractedHire1007=peeHireForecast979().actualAmount||0;', 'charge.uncontractedHire1007=peeHireForecast979().actualAmount||0;\ncharge.uncontractedHire1013=additionalHire1013().actualAmount||0;')
    change('charge.transportArrived1006 + charge.uncontractedHire1007);','charge.transportArrived1006 + charge.uncontractedHire1007 + charge.uncontractedHire1013);')
    change('n(c.contracts) + n(c.uncontractedHire1007) -','n(c.contracts) + n(c.uncontractedHire1007) + n(c.uncontractedHire1013) -')
    change('job: r2(hire + generatorModel1004().hireRemaining + pricingForecast1010().total)', 'job: r2(hire + generatorModel1004().hireRemaining + pricingForecast1010().total + additionalHire1013().remainingAmount)')
    change('+ generators1004.remaining + pricingForecast1010().total),allocationForecast1010:', '+ generators1004.remaining + pricingForecast1010().total + additionalHire1013().remainingAmount),additionalHire1013:additionalHire1013(),allocationForecast1010:')
    change('revenueForecastRows.push(...generatorForecastRows1004(),...pricingForecast1010().rows);','revenueForecastRows.push(...generatorForecastRows1004(),...pricingForecast1010().rows);\n{const x=additionalHire1013();if(x.remainingAmount>0)revenueForecastRows.push({branch:x.branch,amount:x.remainingAmount});}')
    change(" // Contract export billing is a dated snapshot, never proof of today's unpaid balance.", " {const x=additionalHire1013();if(month===evMonth&&x.amount>0)addRev('Hire Revenue — current card estimate',x.branch,x.amount,x.basis,{ref:x.ref,item:x.item,quantity:x.quantity,arrivedQuantity:x.arrivedQuantity,actualAmount:x.actualAmount,status:x.actualAmount>0?'review':'forecast',forecastAmount:x.remainingAmount,source:'Street Rate Card 2026'});}\n // Contract export billing is a dated snapshot, never proof of today's unpaid balance.")
    source=Path(__file__).with_name('finance1013.js').read_text()
    return rep(html,'\n</body>\n</html>','<script id="finance1013-script">\n'+source+'\n</script>\n</body>\n</html>','Shared finance 1013',__file__)
