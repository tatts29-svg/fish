"""Author: Andrew Fisher. Separate planned hire from received hire after a scope revision."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

def apply(html):
    if 'root.ScopeFinance1017=' in html:
        raise ValueError('Financial scope safeguard already applied')
    if 'root.Scope1017=api' not in html:
        raise ValueError('Native quantity scope safeguard must be applied first')
    html=rep(html,'generatorModel1004().hireRemaining + pricingForecast1010().total + additionalHire1013().remainingAmount','generatorModel1004().hireRemaining + (pricingForecast1010().hireTotal??pricingForecast1010().total) + additionalHire1013().remainingAmount','Keep supplier planned hire in the Rehire ledger','v10.17')
    html=rep(html,'FinanceRequest996.model().amount + generatorModel1004().rehireRemaining),','FinanceRequest996.model().amount + generatorModel1004().rehireRemaining + (pricingForecast1010().rehireTotal||0)),','Forecast remaining supplier scope as Rehire revenue','v10.17')
    old=' const T = {rev: r2(groups.reduce((s, g) => s + (g.rev || 0), 0)), revToCome: r2(groups.reduce((s, g) => s + (g.revToCome || 0), 0))'
    new=""" for(const planned1017 of ScopeFinance1017.model().rows.filter(r=>r.ledger==='1010')){
  const group=groups.find(g=>(g.revenueLines1010||[]).includes(planned1017.contract+'|'+planned1017.line));
  if(group){group.revToCome=r2((group.revToCome||0)+planned1017.amount);group.revJob=r2((group.revJob||0)+planned1017.amount);(group.scopeForecast1017||(group.scopeForecast1017=[])).push(planned1017);}
 }
"""+old
    html=rep(html,old,new,'Supplier summary retains its remaining planned hire','v10.17')
    html=rep(html,"   add(g.branch,Pricing1010.cents((g.revJob||0)-assigned));g.revenueBranches1010=", "   for(const r of g.scopeForecast1017||[]){add(r.branch,r.amount);assigned=Pricing1010.cents(assigned+r.amount);}\n   add(g.branch,Pricing1010.cents((g.revJob||0)-assigned));g.revenueBranches1010=",'Allocate planned supplier hire to the current reference branch','v10.17')
    html=rep(html,'recorded:recorded1006(a,l,manual),relocation:!!a.relocation','recorded:typeof ScopeFinance1017===\"undefined\"?recorded1006(a,l,manual):ScopeFinance1017.recorded(a,l,recorded1006(a,l,manual)),relocation:!!a.relocation','Inherited work ticks do not charge added unreceived scope','v10.17')
    return rep(html,'\n</body>\n</html>','\n<script id="financial-scope1017-script">\n'+(HERE/'financial_scope1017.js').read_text()+'\n</script>\n</body>\n</html>','Planned and received financial projection runtime','v10.17')
