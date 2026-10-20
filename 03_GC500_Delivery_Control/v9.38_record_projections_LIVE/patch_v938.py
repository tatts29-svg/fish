# Author: Andrew Fisher. Resolve existing physical identities in doors and Inventory, without record writes.
import re,sys
from pathlib import Path
base=Path(__file__).resolve().parent
sys.path.insert(0,str(base.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);s=p.read_text()
assert 'projection938-script' not in s,'Already applied'
assert 'items933-script' in s and 'function gcUnits925(a)' in s,'Requires native item identities'
s=rep(s,'function nativeEnv925(){return {','function nativeEnv925(options){const loadingCache=new WeakMap();return {','optional read without recursive loading',str(p))
s=rep(s,'loading:a=>loading872Rows(a),lines:','loading:a=>{if(options&&options.loading===false)return [];if(!loadingCache.has(a))loadingCache.set(a,loading872Rows(a));return loadingCache.get(a);},lines:','reuse the native loading projection within one unit read',str(p))
s=rep(s,'function gcModel925(a){return model925(a,nativeEnv925());}','function gcModel925(a,options){return model925(a,nativeEnv925(options));}','pass optional loading projection',str(p))
s=rep(s,'function gcUnits925(a){if(movedAway(a.key))return [];return physical925(a,gcModel925(a).rows)','function gcUnits925(a,options){if(movedAway(a.key))return [];return physical925(a,gcModel925(a,options).rows)','expose non-recursive physical identity read',str(p))
s=rep(s,"invItemNums(assetOf(x.key), r.item).join(', ')","inventoryNumbers938(assetOf(x.key), r.item, x.on).join(', ')",'Inventory drill uses the counted physical numbers',str(p))
src=(base/'projections938.js').read_text()
tail=s[s.rfind('</body>'):]
assert re.fullmatch(r'</body>\s*</html>\s*',tail),'Expected final document boundary'
s=rep(s,tail,'<script id="projection938-script">\n'+src+'\n</script>\n'+tail,'physical projections',str(p))
foot=re.findall(r"\+ ' · v9\.(?:34|37)'; /\* v8\.19",s)
assert len(foot)==1,'Expected live34 or integrated37 footer'
s=rep(s,foot[0],"+ ' · v9.38'; /* v8.19",'release footer',str(p));p.write_text(s)
