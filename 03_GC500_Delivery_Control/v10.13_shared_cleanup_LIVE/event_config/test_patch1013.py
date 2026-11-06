"""Author: Andrew Fisher. Patch guards and immutable source preservation."""
import argparse,json,re,hashlib
from pathlib import Path
from patch_event_config1013 import apply
p=argparse.ArgumentParser();p.add_argument('--base',required=True);p.add_argument('--out',required=True);args=p.parse_args()
base=Path(args.base).read_text();candidate=apply(base);checks=[]
def ck(name,ok):
    checks.append({'name':name,'pass':bool(ok)})
    assert ok,name
ck('DATA source block preserved byte for byte',re.search(r'const DATA\s*=\s*(\{[^\n]+\});',base)[1]==re.search(r'const DATA\s*=\s*(\{[^\n]+\});',candidate)[1])
ck('All existing style blocks are unchanged',re.findall(r'<style[^>]*>(.*?)</style>',base,re.S)==re.findall(r'<style[^>]*>(.*?)</style>',candidate,re.S))
ck('Existing script and video elements retained',len(re.findall(r'<script\b',base))==len(re.findall(r'<script\b',candidate)) and re.findall(r'<video\b[^>]*>',base)==re.findall(r'<video\b[^>]*>',candidate))
ck('Generator precise source card rates unchanged',re.search(r'const cardRates=\[.*?;',base)[0]==re.search(r'const cardRates=\[.*?;',candidate)[0])
ck('Supplier crew quote source date and rate unchanged',re.search(r"const QUOTE=\{number:'27172'.*?;",base)[0]==re.search(r"const QUOTE=\{number:'27172'.*?;",candidate)[0])
for name,text in [('repeat',candidate),('wrong base',base.replace('FinancialScopes1011','OtherFinancialScopes'))]:
    try:apply(text)
    except ValueError:ck(name+' refused',True)
    else:ck(name+' refused',False)
Path(args.out).write_text(candidate)
print(json.dumps({'author':'Andrew Fisher','passed':len(checks),'checks':checks,'sha256':hashlib.sha256(candidate.encode()).hexdigest(),'bytes':len(candidate.encode())}))
