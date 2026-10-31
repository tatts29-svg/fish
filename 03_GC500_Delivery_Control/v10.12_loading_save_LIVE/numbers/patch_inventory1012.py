"""Author: Andrew Fisher. Reconcile inventory ownership from confirmed typed physical units."""
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'toolchain'))
from rep import rep

def apply(html):
    if 'typedSingle1012' in html:
        raise ValueError('Inventory identity patch already applied')
    if 'root.Inventory960={allocation,reconcileInventory,managed};' not in html or 'FinancialScopes1011' not in html:
        raise ValueError('Requires reviewed v10.11 inventory identity projection')
    old = "const managed=(model,item)=>uniqueItems(model).size>1||same(item,'VMS');"
    new = """// One typed item can carry supplier units too. Quantities still come from the existing receipt reader.
const typedSingle1012=(model,item)=>(model?.groups||[]).some(g=>same(g.item,item)&&Number.isFinite(g.quantity)&&g.quantity>0)&&
 (model?.rows||[]).some(u=>u.physical&&u.id&&same(u.item,item));
const managed=(model,item)=>uniqueItems(model).size>1||same(item,'VMS')||typedSingle1012(model,item);"""
    return rep(html, old, new, 'Single-item inventory ownership reads the same typed identities as the drawer and supplier register', 'v10.12')
