import re,sys
h=open(sys.argv[1],encoding='utf-8').read()
out=[]
for i,m in enumerate(re.finditer(r'<script([^>]*)>(.*?)</script>',h,re.S)):
    attrs,body=m.group(1),m.group(2)
    idm=re.search(r'id="([^"]+)"',attrs)
    out.append((i,idm.group(1) if idm else '-',len(body),m.start(),attrs.strip()[:60]))
for o in out: print(*o,sep='\t')
