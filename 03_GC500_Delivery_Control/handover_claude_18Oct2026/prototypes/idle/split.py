import re,sys,os
h=open(sys.argv[1],encoding='utf-8').read()
os.makedirs('scripts',exist_ok=True)
it=list(re.finditer(r'<script([^>]*)>(.*?)</script>',h,re.S))
print(len(it))
for i,m in enumerate(it):
    attrs=m.group(1); body=m.group(2)
    idm=re.search(r'id="([^"]+)"',attrs)
    sid=idm.group(1) if idm else ''
    fn='scripts/%03d_%s.js'%(i,sid or 'noid')
    open(fn,'w').write(body)
    print(i,sid,attrs.strip()[:60],len(body),m.start())
