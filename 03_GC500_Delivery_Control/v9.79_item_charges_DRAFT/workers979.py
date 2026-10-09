# Author: Andrew Fisher. Project the programmed daily roster without background writes.
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep

def apply_workers979(s):
    if 'workers979-script' in s: raise RuntimeError('Workers979 already applied')
    if 'workers975-script' not in s: raise RuntimeError('Workers979 requires worker-only editor')
    old="    return buildDay(dayValue, record, Object.values(S.loads || {}).filter(p => p && p.kind === 'crew883' && p.day === dayValue && p.ref), roster(dayValue));"
    new="""    const plans = Object.values(S.loads || {}).filter(p => p && p.kind === 'crew883' && p.day === dayValue && p.ref), names = roster(dayValue);
    const original = buildDay(dayValue, record, plans, names);
    if (record != null || original.highestUsed || !names.length || names.length > 50) return original;
    const projected = buildDay(dayValue, {count:names.length,names:names.map(p=>p.name)}, plans, names);
    projected.present = false; projected.rosterDefault979 = true; projected.canUseRoster = false;
    projected.mappingToken = JSON.stringify({source:'daily-roster979',names:names.map(p=>({name:p.name,sourceIds:p.sourceIds,windows:p.windows,timeUnknown:p.timeUnknown}))});
    return projected;"""
    s=rep(s,old,new,'Derive programmed daily worker names',__file__)
    old="    return nativeSave({kind: 'plan', day: dayValue, ref}, originEditor, () => crew883SavePlan(dayValue, ref, values));"
    new="""    if (model.rosterDefault979 && values.people.some(p=>p.slot)) {
      // Saving an explicit task freezes its person-number mapping; rendering never writes it.
      const kept = saveDay(dayValue, {count:model.count,names:model.names}, expectedMappingToken, originEditor);
      if (!kept.kept) return kept;
      return savePlan(dayValue, ref, values, mappingToken(dayValue), expectedPlanToken, originEditor);
    }
    return nativeSave({kind: 'plan', day: dayValue, ref}, originEditor, () => crew883SavePlan(dayValue, ref, values));"""
    s=rep(s,old,new,'Keep derived names on explicit task save',__file__)
    module=Path(__file__).with_name('workers979.js').read_text()
    return rep(s,'</body>\n</html>\n','<script id="workers979-script">\n'+module+'\n</script>\n</body>\n</html>\n','Programmed daily workers',__file__)
