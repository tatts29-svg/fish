"""Author: Andrew Fisher. Wire reviewed unallocated building forecast into existing totals."""
import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'toolchain'))
from rep import rep as checked_rep

def rep(html,old,new):
    return checked_rep(html,old,new,"Pricing forecast 1010",__file__)

def apply(html):
    source=Path(__file__).with_name('pricing1010.js').read_text()
    projection=source.split('// SOURCE_ROWS1010_START',1)[1].split('// SOURCE_ROWS1010_END',1)[0].strip()
    html=rep(html,'const ONHIRE_ROWS = ONHIRE ? ONHIRE.rows : [];','const ONHIRE_ROWS = ONHIRE ? ('+projection+')(ONHIRE.rows) : [];')
    html=rep(html,"job: r2(hire + generatorModel1004().hireRemaining)","job: r2(hire + generatorModel1004().hireRemaining + pricingForecast1010().total)")
    html=rep(html,"+ generators1004.remaining),generators1004,hireToCome979", "+ generators1004.remaining + pricingForecast1010().total),allocationForecast1010:pricingForecast1010(),generators1004,hireToCome979")
    html=rep(html,"revenueForecastRows.push(...generatorForecastRows1004());","revenueForecastRows.push(...generatorForecastRows1004(),...pricingForecast1010().rows);")
    html=rep(html," const ch = contractCharge(r);\n if(ch.generator1004)"," const ch = contractCharge(r);\n if(ch.allocation1010&&ch.allocation1010.state!=='current-scope-confirmed'){const a=ch.allocation1010;if(a.state==='forecast-allocation-hold'&&month===evMonth&&a.remainingAmount>0)addRev('Hire Revenue — approved building forecast',a.branch,a.remainingAmount,a.reason,{source:'current approved scope / original contract rate',ref:a.ref,contract:a.contract,line:a.line,status:'forecast',forecastAmount:a.remainingAmount,allocationPending:true});return;}\n if(ch.generator1004)")
    return html
