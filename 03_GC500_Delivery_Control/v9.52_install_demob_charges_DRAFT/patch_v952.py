# Author: Andrew Fisher
from pathlib import Path
import sys,json,copy
H=Path(__file__).resolve().parent
sys.path.insert(0,str(H.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert 'function charges952Html' not in s
assert " · v9.51'; /* v8.19" in s
start=s.index('const DATA = ')+len('const DATA = ');d,end=json.JSONDecoder().raw_decode(s[start:]);old=s[start:start+end]
e=next(x for x in d['rate_match']['items'] if x['item']=='Pee Panel' and x['discipline']=='Toilets & amenities')
t=next(x for x in d['rate_match']['items'] if x['item']=='16Pan Block')
assert not (e.get('labour_per_piece') or {}).get('priced')
e['why']='Customer labour uses the Street Rate Card Pee Panel row 22, authorised by Andrew Fisher on 9 October 2026 for install/demob regardless of ownership. Hire remains unpriced pending its separate hire basis.'
e['labour_per_piece']=copy.deepcopy(t['labour_per_piece'])
e['labour_per_piece']['note']='Pee Panel: original Street Rate Card 2026 row 22; install E22, steps F22, levelling G22, cleaning H22, demob J22. Source headings retain their printed years. Customer rates apply equally to owned and sub-hired equipment.'
e['labour_source952']={'sha256':'60a62f37d9d91634ca617f3b2840809e64ebc1f000303857f1abb5e00691d7d6','sheet':'Street Rate Card 2026','row':22,'cells':{'install':'E22','steps':'F22','levelling':'G22','cleaning':'H22','demob':'J22'}}
s=rep(s,old,json.dumps(d,ensure_ascii=False,separators=(',',':')),'Pee Panel card labour source',str(p))
anchor='function labourUnits(a, item){'
# Native physical identities permit one supplier unit to be charged without charging its uncompleted siblings.
new=anchor+'''\n if(a&&/^(FWF|Accessible Toilet|16Pan Block|VMS)$/.test(String(item||''))&&typeof gcModel925==='function'){
 const q=labourLineQty(a,item), physical=gcModel925(a).rows.filter(u=>u.physical&&u.item===item&&u.assetNo), nums=[...new Set(physical.map(u=>String(u.assetNo)))];
 if(physical.length!==nums.length)return []; /* Bare numbers shared by different owners cannot be separate native labour keys; retain quantity-based charging. */
 if(nums.length&&q!=null&&q>0){const kept=nums.length>q?labourKeep(a,nums,q):nums;return kept.length<q?kept.concat([LAB_REST]):kept;}
 }\n'''
s=rep(s,anchor,new,'typed customer labour units',str(p))
s=rep(s,'function mount925(a){',(H/'charges952.js').read_text()+'\nfunction mount925(a){','customer charge summary helper',str(p))
s=rep(s,"body.querySelectorAll('.units925').forEach(e=>e.remove());const html=panel925(a);","body.querySelectorAll('.units925,.charges952').forEach(e=>e.remove());const html=panel925(a)+charges952Html(a);",'visible customer labour summary',str(p))
s=rep(s," · v9.51'; /* v8.19"," · v9.52'; /* v8.19",'footer',str(p))
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
