# Author: Andrew Fisher. Home branches source labour costs; KINP Installation receives them.
import hashlib, os, sys
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'toolchain'))
from rep import rep as replace
p=Path(sys.argv[1]); assert hashlib.sha256(p.read_bytes()).hexdigest()=='8a447a82c709225bd7b30b80d5648fcd64d1e51f7e81fefbda6a79d23517343c'
s=p.read_text(encoding='utf-8-sig')
def rep(a,b,label):
 global s
 s=replace(s,a,b,label,str(p))
rep('const sp = fh866Split(g.job, labW);','const sp = fh866Split(g.job, {KINP: 1});','one labour journal destination')
rep('if (st === \'transport\') return {toDate:', "if (st === 'labour') return {toDate: fh866Split(toDate, {KINP: 1}), toCome: fh866Split(toCome, {KINP: 1})}; /* v8.69 KINP Installation */\n if (st === 'transport') return {toDate:", 'costs labour destination')
rep("{stream: 'Wages after the race weekend', by: fh866Split(r2(ldCost), labW)}", "{stream: 'Wages after the race weekend', by: fh866Split(r2(ldCost), {KINP: 1})}", 'demob wages destination')
rep('Wages — from the home branch to the branch the revenue is in','Labour allocation — home branch to KINP Installation','HTML journal title')
rep("const hn = b => b === '—' ? 'Not set' : b;", "const hn = b => b === '—' ? 'Not set' : b === 'KINP' ? 'KINP Installation' : b;", 'journal destination label')
rep('2c. Wages from home branch to revenue branch','2c. Labour allocation to KINP Installation','CSV journal title')
rep('wages, salary allowance, accommodation and meals by the labour per piece on each branch', 'wages and salary allowance to KINP Installation; accommodation and meals by the labour per piece on each branch', 'allocation basis')
rep("H.people.revCols.map(cn)", "H.people.revCols.map(b => b === 'KINP' ? 'KINP Installation' : cn(b))", 'CSV destination label')
rep("H.people.rows.forEach(g => L.push(`  ${g.person} — ${g.home || 'home branch not set'} — ${money(g.job)}`));", "H.people.rows.forEach(g => L.push(`  ${g.person} — ${g.home || 'home branch not set'} → KINP Installation — ${money(g.job)}`));", 'copy destination')
rep('· v8.68','· v8.69','version')
p.write_text(s,encoding='utf-8-sig')
