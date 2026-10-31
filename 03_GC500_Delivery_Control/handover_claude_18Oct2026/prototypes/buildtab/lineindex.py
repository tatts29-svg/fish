import re,sys,json
h=open(sys.argv[1],encoding='utf-8').read()
res=[]
for i,m in enumerate(re.finditer(r'<script([^>]*)>(.*?)</script>',h,re.S)):
    idm=re.search(r'id="([^"]+)"',m.group(1))
    s=h.count('\n',0,m.start(2)); e=s+m.group(2).count('\n')
    res.append([i,idm.group(1) if idm else 'anon',s,e])
json.dump(res,open(sys.argv[2],'w'))
print(len(res))
