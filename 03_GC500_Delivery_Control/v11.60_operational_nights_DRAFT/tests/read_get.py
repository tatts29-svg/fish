#!/usr/bin/env python3
"""Author: Andrew Fisher. Private bounded bridge; request secrets use stdin only."""
import base64,json,os,re,sys
from urllib.request import Request,build_opener,HTTPRedirectHandler
from urllib.error import HTTPError
from urllib.parse import urlsplit,parse_qs

HOST='https://gc500-production.up.railway.app'
class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs): return None

def fail(code):
    print(json.dumps({'ok':False,'code':code}));sys.exit(1)

try:
    raw=sys.stdin.buffer.read(32_000_001)
    if len(raw)>32_000_000:fail('request_too_large')
    arg=json.loads(raw);url=arg['url'];u=urlsplit(url);method=arg.get('method','GET')
    edit=os.environ.get('GC500_EDIT_TOKEN','')
    token=arg.get('tracker','')
    if u.scheme+'://'+u.netloc!=HOST or u.fragment or u.username or u.password:fail('origin_not_allowed')
    path=u.path;query=parse_qs(u.query,keep_blank_values=True)
    permitted=False
    if method=='GET':
        if path in ('/api/version','/api/state','/api/cards','/v/Coates-GC500-2026','/v/Coates-GC500-2026/'):
            permitted=not query
        elif path=='/api/ticks':
            permitted=set(query)<=set(('token','links','since','voided','voids','void_since'))
            if 'token' in query:permitted=permitted and query['token']==[token]
            for key in ('links','voided','voids'):
                if key in query:permitted=permitted and query[key]==['1']
            for key in ('since','void_since'):
                if key in query:permitted=permitted and len(query[key])==1 and bool(re.fullmatch(r'\d+',query[key][0]))
        elif path.startswith('/m/'):
            parts=path.split('/')
            permitted=len(parts)==4 and parts[2] in ('Coates-GC500-2026',edit) and bool(re.fullmatch(r'[a-f0-9]{64}\.[a-z0-9]+',parts[3])) and not query
    if not permitted:fail('route_not_allowed')
    incoming=arg.get('headers',{});headers={'Accept-Encoding':'identity','Cache-Control':'no-cache','User-Agent':'GC500-native-tracker-check'}
    for key,value in incoming.items():
        lower=key.lower()
        if lower in ('accept','content-type','x-gc500-token','x-gc500-who'):
            if lower=='x-gc500-token' and (not edit or value!=edit):fail('credential_mismatch')
            headers[key]=value
    data=arg.get('body')
    if data is not None:
        data=data.encode('utf8')
        if edit and edit.encode() in data:fail('credential_in_body')
    try:
        response=build_opener(NoRedirect).open(Request(url,headers=headers,method=method,data=data),timeout=35)
    except HTTPError as error:response=error
    with response:
        body=response.read(32_000_001)
        if len(body)>32_000_000:fail('response_too_large')
        if edit and edit.encode() in body:fail('credential_in_response')
        safe={key.lower():value for key,value in response.headers.items() if key.lower() in ('content-type','cache-control','content-security-policy','etag','last-modified')}
        print(json.dumps({'ok':True,'status':response.status,'headers':safe,'body':base64.b64encode(body).decode()}))
except BaseException as error:
    if isinstance(error,SystemExit):raise
    fail('bridge_failed')
