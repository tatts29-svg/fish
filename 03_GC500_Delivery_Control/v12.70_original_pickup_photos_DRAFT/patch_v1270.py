"""Author: Andrew Fisher. DRAFT reference-photo replacement; publication awaits preview review."""
import hashlib
import json
import re
import sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
BASE='038bd277625bf5e3be5a47edaf7c2deb2eab34ffdec098bf4b2270870d6cbabb'

def patch(text):
    if 'id="artwork1270-script"' in text:
        raise ValueError('Original-reference preview already applied')
    if hashlib.sha256(text.encode()).hexdigest()!=BASE:
        raise ValueError('Expected exact v12.69 base; rebase and retest if live changes')
    js=(HERE/'artwork1270_src.js').read_text().replace('__REFERENCES1270__',json.dumps(json.loads((HERE/'references1270.json').read_text()),separators=(',',':')))
    css=(HERE/'artwork1270.css').read_text()
    replacements=[]
    for tag,content in [('script',js),('style',css)]:
        found=re.findall(r'<'+tag+r' id="artwork1268-'+tag+r'">.*?</'+tag+r'>',text,re.S)
        if len(found)!=1: raise ValueError('Expected one full former artwork '+tag)
        replacements.append((found[0],'<'+tag+' id="artwork1270-'+tag+'">\n'+content+'\n</'+tag+'>','replace rejected artwork '+tag))
    replacements.append(("+' · v12.69'; /* v8.19 release922","+' · v12.70'; /* v8.19 release922",'draft footer'))
    for old,new,label in replacements:
        rep(text,old,new,label,__file__)
        if text.count(old)!=1: raise ValueError(label+' must match exactly once')
        text=text.replace(old,new,1)
    return text

if __name__=='__main__':
    page=Path(sys.argv[1]);page.write_text(patch(page.read_text()),encoding='utf-8')
    print('v12.70 DRAFT applied; original-photo mappings await Andrew review, not ready to publish')
