"""Author: Andrew Fisher. Bounded read-model consistency patch; no record writes."""
import hashlib
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

UNIT = " function unit(key,id,day,item){const r=read(key,day);if(!r||r.issues.length)return null;const typed=item&&r.required.find(x=>normal(x.type)===normal(item)),gone=typed&&r.remaining.find(x=>normal(x.type)===normal(item))?.n===0;return r.events.find(c=>c.items.some(i=>list(i.unitIds).includes(id)))||(gone?r.events.find(c=>c.items.some(i=>normal(i.type)===normal(item))):null)||(r.complete?r.events.at(-1):null);}"
REPLACEMENT = """ function unit(key,id,day,item){
  const r=read(key,day);if(!r||r.issues.length)return null;
  const typed=item&&r.required.find(x=>normal(x.type)===normal(item)),gone=typed&&r.remaining.find(x=>normal(x.type)===normal(item))?.n===0;
  const direct=r.events.find(c=>c.items.some(i=>list(i.unitIds).includes(id)));if(direct)return direct;
  let matched=null;
  if(id&&typed&&r.events.some(c=>c.items.some(i=>normal(i.type)===normal(item)&&list(i.physicalUnits).length))){
   try{
    const rows=heldMemo('readModel1246:units:'+key,()=>{const a=assetOf(key);return a?gcUnits925(a,{loading:false}):[];});
    matched=ReadModel1246.unit(r,key,id,item,rows);
   }catch(e){/* Missing current identity is not evidence of a departure. */}
  }
  return matched||(gone?r.events.find(c=>c.items.some(i=>normal(i.type)===normal(item))):null)||(r.complete?r.events.at(-1):null);
 }"""

def patch(text, path='page', expected_base_sha=None, expected_base_version=None):
    expected = expected_base_sha or os.environ.get('GC500_V1246_BASE_SHA256', '')
    version = expected_base_version or os.environ.get('GC500_V1246_BASE_VERSION', '')
    if not re.fullmatch(r'[a-f0-9]{64}', expected) or hashlib.sha256(text.encode()).hexdigest() != expected:
        raise ValueError('v12.46 requires the exact reviewed base SHA-256')
    if not re.fullmatch(r'12\.(43|44|45)(\.\d+)?', version):
        raise ValueError('v12.46 requires the explicit reviewed predecessor version')
    if 'ReadModel1246' in text:
        raise ValueError('v12.46 already applied')
    footer = "+' · v" + version + "';"
    if text.count(footer) != 1:
        raise ValueError('v12.46 predecessor footer does not match the reviewed version')
    source = (ROOT / 'read_model1246.js').read_text()
    text = rep(text, UNIT, source + '\n' + REPLACEMENT, 'read-model unit evidence association', path)
    return rep(text, footer, "+' · v12.46';", 'footer', path)

if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(patch(page.read_text(), str(page)))
    print('patch_v1246 applied')
