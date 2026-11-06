import re,json,sys
t=open(sys.argv[1],encoding='utf8').read()
out=[]
for i,m in enumerate(re.finditer(r'<script(?![^>]*\bsrc=)([^>]*)>(.*?)</script>',t,re.S)):
    idm=re.search(r'id="([^"]+)"',m.group(1)); s=t.count('\n',0,m.start(2)); e=s+m.group(2).count('\n')
    out.append([i,idm.group(1) if idm else '',s,e])
json.dump(out,open(sys.argv[2],'w'))
def where(needle):
    p=t.find(needle); ln=t.count('\n',0,p)
    for i,id_,s,e in out:
        if s<=ln<=e: return (i,id_,ln)
for n in ['function metadata925(','function unitEvidence(',"let cachedKey='', cached;",'window.gc500CompleteKeys897 =','requestAnimationFrame(() => { q = false; try {','function buildAllAssets(','function syncFooter(','W.align1055 = {scan, DIFFS};','root.BuildWork986=']:
    print(n, where(n))
