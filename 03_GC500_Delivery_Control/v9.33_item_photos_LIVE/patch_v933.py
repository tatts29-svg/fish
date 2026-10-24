#!/usr/bin/env python3
"""Author: Andrew Fisher. Exact physical-unit ownership and direct native photo actions."""
from pathlib import Path
import re,sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert 'items933-script' not in s,'v9.33 already applied'
assert 'function gcUnits925(a)' in s and 'function vms913Boards()' in s,'Expected native unit and VMS models'
foot=re.findall(r" · v(\d+)\.(\d+)'; /\* v8\.19",s)
assert len(foot)==1 and tuple(map(int,foot[0])) in ((9,28),(9,32)),'Use live v9.28 for scope tests or final v9.32 base'
s=rep(s," · v"+'.'.join(foot[0])+"'; /* v8.19"," · v9.33'; /* v8.19",'release footer',str(p))
s=rep(s,"sourceAssetNo:b.asset||''","sourceAssetNo:Items933.sourceAsset(b,typeof ONHIRE_ROWS!=='undefined'?ONHIRE_ROWS:[])",'canonical VMS source placeholder',str(p))
rows=(HERE/'rows933.js').read_text()
for name,nextname in [('rowHtml925','panel925'),('panel925','mount925'),('mount925','companyModel925')]:
 start=s.index('function '+name+'(');end=s.index('function '+nextname+'(',start)
 rs=rows.index('function '+name+'(');re_=rows.find('function ',rs+9)
 replacement=rows[rs:re_ if re_>=0 else len(rows)]
 s=rep(s,s[start:end],replacement,'item row '+name,str(p))
# Optional guard only applies to direct item uploads; native outbox/storage remains authoritative.
s=rep(s,'async function dropPhotoAdd(key, slot, file, say, unit){','async function dropPhotoAdd(key, slot, file, say, unit, item933){','item add signature',str(p))
s=rep(s,'return await dropPhotoAddUnlocked(key, slot, file, say, unit);',' return await dropPhotoAddUnlocked(key, slot, file, say, unit, item933);','native locked call',str(p))
s=rep(s,'async function dropPhotoAddUnlocked(key, slot, file, say, unit){','async function dropPhotoAddUnlocked(key, slot, file, say, unit, item933){','item upload guard signature',str(p))
s=rep(s," const u = unitKey(unit);\n const formats", " if(item933){if(SYNC.readonly||!mayWrite('photograph')||whoAmI()!==item933.actor)return tell('The editing session changed. Choose the photo again.');const reason=Items933.guard(key,item933.unitId,slot,item933.expected,item933.replace);if(reason)return tell(reason);}\n const u = unitKey(unit);\n const formats",'fresh identity and slot after image preparation',str(p))
s=rep(s,' const was = dropPhotoSlots(key, u)[slot];\n /* v7.41'," const was = dropPhotoSlots(key, u)[slot];\n if(item933&&(!item933.replace?!!was:!was||String(was.id)!==String(item933.replace.id)))return tell('That photo place changed. Reopen the item before adding a photo.');\n /* v7.41",'no implicit photo replacement',str(p))
s=rep(s,"title: key + (u ? ' · asset ' + u : '') + ' on site", "title: key + (u ? ' · ' + Items933.friendly(key,u) : '') + ' on site",'friendly photo title',str(p))
s=rep(s,"note: 'Photograph of ' + key + (u ? ' (asset ' + u + ')' : '')", "note: 'Photograph of ' + key + (u ? ' (' + Items933.friendly(key,u) + ')' : '')",'friendly photo note',str(p))
s=rep(s,"return key + (ph.unit ? ' · asset ' + unitKey(ph.unit) : '') + ' · drop photograph'", "return key + (ph.unit ? ' · ' + Items933.friendly(key,unitKey(ph.unit)) : '') + ' · drop photograph'",'friendly photo descriptions',str(p))
# The old detailed manager stays collapsed, with original records and native caption/reuse controls.
s=rep(s,' const oneNumber = units.length === 1;',' const oneNumber = false; /* keep location photographs separate from physical units */','no implied location allocation',str(p))
s=rep(s,'${assetNo(u)}</span><span class="w">','${esc(Items933.friendly(key,u))}</span><span class="w">','photo manager unit heading',str(p))
s=rep(s," const what = key + (u ? ' · asset ' + u : '');"," const what = key + (u ? ' · ' + Items933.friendly(key,u) : '');",'photo manager labels',str(p))
s=rep(s,'<span class="dphu">asset ${esc(u)}</span>','<span class="dphu">${esc(Items933.friendly(key,u))}</span>','photo image badge',str(p))
s=rep(s,'>asset ${esc(u)}</option>','>${esc(Items933.friendly(key,u))}</option>','legacy picker friendly option',str(p))
s=rep(s,"const kindLine = [a.discipline, sub ? null : br, nos.length ? 'asset ' + nos.slice(0, 2).join(', ') + (nos.length > 2 ? ' +' + (nos.length - 2) : '') : null].filter(Boolean).join(' · ');","const kindLine = Items933.assetSummary(a,nos,sub?null:br);",'native drawer physical identity summary',str(p))
s=rep(s,"tell('Photo association removed from ' + key + (u ? ' · asset ' + u : '') + '. The original file remains on the service.');","tell('Photo association removed from ' + key + (u ? ' · ' + Items933.friendly(key,u) : '') + '. The original file remains on the service.');",'native remove confirmation label',str(p))
css=(HERE/'items933.css').read_text();js=(HERE/'items933.js').read_text()
insert='\n<style id="items933-style">'+css+'</style>\n<script id="items933-script">'+js+'</script>\n'
end=re.search(r'</script>(\s*</body></html>\s*)$',s);assert end
s=rep(s,end.group(0),'</script>'+insert+end.group(1),'individual item photo actions',str(p))
p.write_bytes((b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode())
print('v9.33 physical item photos applied; no stored records or financial values changed')
