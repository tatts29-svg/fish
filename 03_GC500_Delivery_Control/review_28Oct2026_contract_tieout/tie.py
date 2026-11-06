import json
S='/tmp/claude-0/-home-user-fish/b3d08fad-688f-5986-9fd9-2f1442b3bb1a/scratchpad/v12426/'
bp=json.load(open(S+'bp8_lines.json')); pg=json.load(open(S+'lines_live8.json'))['lines']
con=lambda k:k.split('/')[0]
cons=sorted({con(k) for k in bp}|{con(k) for k in pg})
print(f"{'contract':10s} {'Baseplan':>12s} {'page':>12s} {'diff':>11s}")
T=[0,0];rows=[]
for c in cons:
    b=sum(float(v['pre'] or 0) for k,v in bp.items() if con(k)==c); p=sum((v.get('amt') or 0) for k,v in pg.items() if con(k)==c)
    T[0]+=b;T[1]+=p;print(f"{c:10s} {b:12,.2f} {p:12,.2f} {p-b:11,.2f}")
    for k in sorted({x for x in bp if con(x)==c}|{x for x in pg if con(x)==c}, key=lambda x:int(x.split('/')[1])):
        B=bp.get(k) or {};P=pg.get(k) or {};bb=float(B.get('pre') or 0);pp=P.get('amt') or 0
        if abs(pp-bb)>=0.005: rows.append((c,k,(B.get('d') or P.get('d') or '')[:34],B.get('st'),B.get('q'),B.get('r1'),B.get('start'),B.get('etd'),B.get('nd'),round(bb,2),round(pp,2),round(pp-bb,2),P.get('br'),B.get('sac')))
print(f"{'TOTAL':10s} {T[0]:12,.2f} {T[1]:12,.2f} {T[1]-T[0]:11,.2f}")
json.dump(rows,open(S+'tie_rows.json','w'))
print('lines that differ',len(rows))
