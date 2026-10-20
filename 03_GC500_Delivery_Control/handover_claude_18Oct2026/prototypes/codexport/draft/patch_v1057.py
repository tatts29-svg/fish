"""Author: Andrew Fisher. Reduce repeated read work without changing records or presentation."""
import sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

OLD_METADATA = 'function metadata925(loads){return Object.entries(loads||{}).filter(([k,v])=>k.startsWith(prefix)&&v&&v.kind===kind).map(([key,v])=>Object.assign({docKey:key},v));}'
NEW_METADATA = "function metadata925(loads,ref){\n const filterRef=arguments.length>1;\n /* v10.57: one native metadata index per existing synchronous asset hold.\n    Keep foreign/snapshot inputs uncached, and return new records in native order.\n    heldMemo is invalidated by the page's existing local-save and remote-read rules. */\n if(typeof ASSETS_HELD==='undefined'||!ASSETS_HELD||typeof S==='undefined'||loads!==S.loads||!loads||typeof loads!=='object'){\n  const rows=Object.entries(loads||{}).filter(([k,v])=>k.startsWith(prefix)&&v&&v.kind===kind).map(([key,v])=>Object.assign({docKey:key},v));\n  return filterRef?rows.filter(d=>d.ref===ref):rows;\n }\n const indexes=heldMemo('unitMetadata1057',()=>new WeakMap());\n let index=indexes.get(loads);\n if(!index){\n  const all=[],byRef=new Map();\n  for(const entry of Object.entries(loads||{})){\n   const [key,value]=entry;if(!key.startsWith(prefix)||!value||value.kind!==kind)continue;\n   all.push(entry);\n   const reference=Object.prototype.propertyIsEnumerable.call(value,'ref')?value.ref:undefined;\n   let rows=byRef.get(reference);if(!rows){rows=[];byRef.set(reference,rows);}rows.push(entry);\n  }\n  index={all,byRef};indexes.set(loads,index);\n }\n const rows=filterRef?(ref===ref?(index.byRef.get(ref)||[]):[]):index.all;\n return rows.map(([key,value])=>Object.assign({docKey:key},value));\n}"

OLD_SCOPE = "function unitEvidence(ref,discipline,item,labour,stamps){\n const rows={},suffix='|'+discipline+'|'+item+'|install';\n // Native unticking deletes the value but retains its audit stamp.\n const keys=new Set([...Object.keys(labour||{}),...Object.keys(stamps||{}).filter(k=>k.startsWith('labour/')).map(k=>k.slice(7))]);\n for(const k of keys)if(k.startsWith(ref+'/u')&&k.endsWith(suffix)&&k!==ref+'/urest'+suffix)rows[k]={on:!!labour?.[k],at:stamps?.['labour/'+k]||''};\n return rows;\n}"
NEW_SCOPE = "function unitEvidenceKeys1057(ref,labour,stamps){\n const read=()=>new Set([...Object.keys(labour||{}),...Object.keys(stamps||{}).filter(k=>k.startsWith('labour/')).map(k=>k.slice(7))]);\n /* Only native objects inside the existing synchronous read hold are indexed.\n    Snapshot/custom inputs retain their original uncached behaviour. Values and\n    timestamps are read afresh below; this index holds keys only. */\n if(typeof ASSETS_HELD==='undefined'||!ASSETS_HELD||typeof S==='undefined'||labour!==S.labour||stamps!==S.stamps||!labour||typeof labour!=='object'||!stamps||typeof stamps!=='object'||typeof ref!=='string')return read();\n const byLabour=heldMemo('unitEvidenceKeys1057',()=>new WeakMap());\n let byStamps=byLabour.get(labour);if(!byStamps){byStamps=new WeakMap();byLabour.set(labour,byStamps);}\n let index=byStamps.get(stamps);if(!index){index={keys:read(),byPrefix:new Map()};byStamps.set(stamps,index);}\n const prefix=ref+'/u';\n if(!index.byPrefix.has(prefix))index.byPrefix.set(prefix,[...index.keys].filter(k=>k.startsWith(prefix)));\n return index.byPrefix.get(prefix);\n}\nfunction unitEvidence(ref,discipline,item,labour,stamps){\n const rows={},suffix='|'+discipline+'|'+item+'|install';\n // Native unticking deletes the value but retains its audit stamp.\n const keys=unitEvidenceKeys1057(ref,labour,stamps);\n for(const k of keys)if(k.startsWith(ref+'/u')&&k.endsWith(suffix)&&k!==ref+'/urest'+suffix)rows[k]={on:!!labour?.[k],at:stamps?.['labour/'+k]||''};\n return rows;\n}"

def patch(text, path='page.html'):
    if 'performance1057-script' in text:
        raise ValueError('v10.57 already installed')
    if 'W.align1055 = {scan, DIFFS};' not in text:
        raise ValueError('requires v10.55 or newer compatible live base')
    def change(old, new, label):
        nonlocal text
        text = rep(text, old, new, label, path)
    change(OLD_METADATA, NEW_METADATA, 'index native identity metadata within each read hold')
    change(OLD_SCOPE, NEW_SCOPE, 'index native work keys within each read hold')
    change('docs=metadata925(env.loads).filter(d=>d.ref===a.key),claimed=new Set(),rows=[];',
           'docs=metadata925(env.loads,a.key),claimed=new Set(),rows=[];', 'read matching metadata only')
    change('window.gc500CompleteKeys897 = function () { try { return allAssets().filter(verified897).map(a => a.key); } catch (e) { return null; } };',
           'window.gc500CompleteKeys897 = function () { try { return holdAssets(() => allAssets().filter(verified897).map(a => a.key)); } catch (e) { return null; } };', 'batch completion map reads')
    change(" let cachedKey='', cached;\n function native() {", " let cachedKey='', cached;\n function native() { return heldMemo('buildWork1057', nativeRead1057); }\n function nativeRead1057() {", 'one day-work snapshot per read hold')
    change("reset:()=>{cached=null;cachedKey='';}", "reset:()=>{cached=null;cachedKey='';HELD_MEMO.delete('buildWork1057');}", 'explicit work reset invalidates held snapshot')
    change('requestAnimationFrame(() => { q = false; try { drawer(); costs(); } catch (x) {} });',
           'requestAnimationFrame(() => { q = false; try { holdAssets(() => { drawer(); costs(); }); } catch (x) {} });', 'batch alignment observer reads')
    source = (HERE / 'performance1057_src.js').read_text()
    change('</script>\n</body>\n</html>', '</script>\n<script id="performance1057-script">\n'+source+'\n</script>\n</body>\n</html>', 'batch sync feedback reads')
    # Footer only; an independently released v10.56 is kept if present in the live base.
    for version in ('v10.56','v10.55'):
        marker="' · "+version+"';"
        if marker in text:
            change(marker, "' · v10.57';", 'release footer')
            break
    else:
        raise ValueError('unknown live release footer')
    return text

if __name__ == '__main__':
    path=Path(sys.argv[1]);path.write_text(patch(path.read_text(),str(path)))
