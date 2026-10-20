import sys,re,bisect,json
h=open(sys.argv[1],encoding='utf-8').read()
starts=[0]
for m in re.finditer('\n',h): starts.append(m.end())
scripts=[(m.start(2),m.end(2),(re.search(r'id="([^"]+)"',m.group(1)) or [None,''])[1], i) for i,m in enumerate(re.finditer(r'<script([^>]*)>(.*?)</script>',h,re.S))]
def where(line,col,ctx=160):
    off=starts[line-1]+col-1
    sc=[s for s in scripts if s[0]<=off<s[1]]
    sid=('%03d %s'%(sc[0][3],sc[0][2])) if sc else 'html'
    seg=h[max(0,off-4000):off]
    fn=re.findall(r'function\s*([\w$]*)\s*\(',seg)
    return sid, (fn[-1] if fn else ''), h[off:off+ctx].replace('\n',' ')
for a in sys.argv[2:]:
    l,c=map(int,a.split(':'))
    print(a, *where(l,c), sep=' | ')
