"""Author: Andrew Fisher. Retain explicit customer-charge branch allocation in P&L and Finance."""
from pathlib import Path
import sys

HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

ANCHOR='function scopeBranchAllocation978(){'
HELPER="""/* Author: Andrew Fisher. The same manual customer charges as moneySummary, allocated by their existing branch reader. */
function manualChargeBranches1016(){
 const amounts=new Map();
 for(const c of allCosts().filter(c=>c.usable&&c.from!=='record')){
  const branch=costBranchOf(c).code;
  if(!branch||c.amount==null||!Number.isFinite(c.amount)||c.amount<=0)continue;
  amounts.set(branch,(amounts.get(branch)||0)+c.amount);
 }
 return [...amounts].map(([branch,value])=>{const amount=Math.round(value*100)/100;return {branch,recorded:amount,job:amount,source:'Customer charge: branch on the line, otherwise its reference branch'};});
}

"""
OLD='revenueAllocations:scopeBranchAllocation978(),'
NEW='revenueAllocations:scopeBranchAllocation978().concat(manualChargeBranches1016()),'

def apply(html):
    if 'function manualChargeBranches1016(' in html:
        raise ValueError('v10.16 customer-charge branch fix already applied')
    html=rep(html,ANCHOR,HELPER+ANCHOR,'Allocate existing manual customer charges by their branch','v10.16')
    return rep(html,OLD,NEW,'Include manual charge allocation in final branch and Finance models','v10.16')
