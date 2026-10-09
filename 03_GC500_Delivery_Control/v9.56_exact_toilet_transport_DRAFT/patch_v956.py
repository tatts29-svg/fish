# Author: Andrew Fisher
from pathlib import Path
import sys
H=Path(__file__).resolve().parent
sys.path.insert(0,str(H.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert 'function transport956Demand' not in s, 'v9.56 is already applied'
assert 'const Supplier955 = ' in s and 'function transport953Reconcile' in s and " · v9.55'; /* v8.19" in s, 'Requires v9.55 base'
s=rep(s,'function transport953Build(){',(H/'transport956.js').read_text()+'\nfunction transport953Build(){','exact tank-mounted cost source helper',str(p))
s=rep(s,"demand:(r,context)=>finance928LoadDemands([Object.assign({},r,{leg:transport953Leg(r)})],assetTotal(r.a).lines||[],context.map(x=>Object.assign({},x,{leg:transport953Leg(x)})))[0]",'demand:transport956NativeDemand','scoped native cost fallback',str(p))
s=rep(s,"};additions.push(r);", "};if(demand.source956)r.forecast.source956=demand.source956;additions.push(r);",'retain scoped cost provenance',str(p))
s=rep(s,"const top=cards.slice().sort((a,b)=>b.forecast.amount-a.forecast.amount)[0];", "const top=transport956ResidualCards(cards).slice().sort((a,b)=>b.forecast.amount-a.forecast.amount)[0];",'preserve prior rounding recipient',str(p))
s=rep(s," · v9.55'; /* v8.19"," · v9.56'; /* v8.19",'footer',str(p))
assert 'const DATA = {' in s
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
