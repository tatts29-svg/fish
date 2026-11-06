"""Author: Andrew Fisher. Optional, unselected damage waiver is not a missing required charge."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

OLD_ROW=" rev.push({key: 'waiver', code: '1015', line: 'Damage Waiver', what: 'on the hire only — never on labour, steps, cleaning, install, demob or pump-outs (the card’s rule)', now: null, job: null, basis: 'not on the 2026 contracts yet — the branch’s rate'});"
NEW_ROW=" rev.push({key: 'waiver', code: '1015', line: 'Damage Waiver', what: 'on the hire only — never on labour, steps, cleaning, install, demob or pump-outs (the card’s rule)', now: null, job: null, optional: true, basis: 'No automatic damage waiver is applied. An agreed charge requires an explicit entry.'});"
OLD_HOLD=" if(model.rows.some(r=>r.hire>0)&&waiver&&waiver.now==null&&waiver.job==null){model.holds.push({ref:'Job',item:'Damage waiver',charge:'Rate / scope'});model.total=null;model.complete=false;}"
NEW_HOLD=" if(model.rows.some(r=>r.hire>0)&&waiver&&(waiver.optional!==true||waiver.required===true||waiver.enabled===true)&&waiver.now==null&&waiver.job==null){model.holds.push({ref:'Job',item:'Damage waiver',charge:'Rate / scope'});model.total=null;model.complete=false;}"

def apply(html):
    html=rep(html,OLD_ROW,NEW_ROW,'Unselected optional waiver explanation','v10.16')
    return rep(html,OLD_HOLD,NEW_HOLD,'Only required unpriced waiver is a charge hold','v10.16')
