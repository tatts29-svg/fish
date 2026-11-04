"""Author: Andrew Fisher. Native person end-date and current-team projection only."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def apply(s):
    if 'root.OnsiteAvailability1299=api' in s:
        raise ValueError('Availability v12.99 already applied')
    def r(old,new,label):
        nonlocal s
        s=rep(s,old,new,label,'native availability v12.99')
    anchor=" {name: 'branch', label: 'Home branch', type: 'branch'}, /* v8.68 */\n {name: 'note', label: 'Note', type: 'text', wide: true}]},"
    r(anchor," {name: 'branch', label: 'Home branch', type: 'branch'}, /* v8.68 */\n {name: 'last_day', label: 'Last day on site', type: 'date'},\n {name: 'note', label: 'Note', type: 'text', wide: true}]},",'optional native person final day')
    anchor=" if (K.key === 'labour' && f.hours != null && (f.hours < 0 || f.hours > 24)) return 'Hours have to be between 0 and 24 for one day.';"
    r(anchor," if (K.key === 'person' && f.last_day != null && f.last_day !== '' && !OnsiteAvailability1299.validDate(f.last_day)) return 'Last day on site must be a real date.';\n"+anchor,'validate real date without changing hours validation')
    anchor='var AboutContacts1089 = (function(){'
    r(anchor,(HERE/'availability1299_src.js').read_text()+'\n'+anchor,'current contact availability helper')
    r(' function current(people,additions){\n  const kept=(Array.isArray(people)?people:[]).filter(p=>!removed.has(name(p&&p.name)));',
      ' function current(people,additions,asOf){\n  const kept=(Array.isArray(people)?people:[]).filter(p=>!removed.has(name(p&&p.name)));',
      'optional historical as-of for current team projection')
    r('  return kept;\n }\n return {current};\n})();\nif(typeof module===\'object\'&&module.exports)module.exports=AboutContacts1089;',
      "  const day=asOf===undefined&&typeof todayIso==='function'?todayIso():asOf;\n  const records=typeof ourCosts==='function'?ourCosts():[];\n  return OnsiteAvailability1299.current(kept,records,day);\n }\n return {current};\n})();\nif(typeof module==='object'&&module.exports)module.exports=AboutContacts1089;",
      'read native person end day for current contacts only')
    return s
