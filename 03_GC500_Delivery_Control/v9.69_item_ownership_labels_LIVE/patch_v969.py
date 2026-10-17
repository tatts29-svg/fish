# Author: Andrew Fisher. Item ownership presentation only; source records remain unchanged.
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
p=Path(sys.argv[1]);raw=p.read_bytes();s=raw.decode('utf-8-sig')
assert 'const ItemOwnership969 =' not in s,'v9.69 already applied'
assert 'function compactLoading968(' in s and " · v9.68'; /* v8.19" in s,'Requires v9.68'
assert 'const ItemPhotos965 =' in s and 'function quantitySubhire964Read(' in s,'Requires guarded item and quantity models'
def change(old,new,why):
 global s
 s=rep(s,old,new,why,str(p))
change('function inventory(){',(HERE/'ownership969.js').read_text()+'\nfunction inventory(){','shared read-only item ownership labels')
change("const n = displayNumbers744(a), supplier = supplierNumbersHtml744(a);", "const owner969=ItemOwnership969.html(a);if(owner969)return owner969;\n const n = displayNumbers744(a), supplier = supplierNumbersHtml744(a);",'shared register numbers retain exact typed ownership')
change("const n = displayNumbers744(a), supplier = supplierNumbersText744(a);", "const owner969=ItemOwnership969.text(a);if(owner969)return owner969;\n const n = displayNumbers744(a), supplier = supplierNumbersText744(a);",'text sheets use the same item ownership reading')
old="${nums.length ? nums.slice(0, 2).map(n => `<span class=\"pill plan\">Asset <b>${esc(n)}</b></span>`).join('') : ''}\n ${nums.length > 2 ? `<span class=\"pill none\">and ${nums.length - 2} more</span>` : ''}\n ${supplierNumbersHtml744(a)}"
new="${ItemOwnership969.html(a) || (\n (nums.length ? nums.slice(0, 2).map(n => `<span class=\"pill plan\">Asset <b>${esc(n)}</b></span>`).join('') : '') +\n (nums.length > 2 ? `<span class=\"pill none\">and ${nums.length - 2} more</span>` : '') + supplierNumbersHtml744(a))}"
change(old,new,'Equipment cards show each owner and remove obsolete contract placeholder from named VMS boards')
old="<td class=\"mono\">${nums.length ? nums.map(n => assetNo(n, {bare: true, desc: miscDesc})).join('<br>')\n: supplierGroups744(a).length ? '' : '<span class=\"todo\" title=\"the schedule does not carry an asset number for this reference\">—</span>'}${supplierGroups744(a).length ? '<br>' + supplierNumbersHtml744(a) : ''}<div style=\"margin-top:3px\">"
new="<td class=\"mono\">${ItemOwnership969.html(a) || ((nums.length ? nums.map(n => assetNo(n, {bare: true, desc: miscDesc})).join('<br>')\n: supplierGroups744(a).length ? '' : '<span class=\"todo\" title=\"the schedule does not carry an asset number for this reference\">—</span>') + (supplierGroups744(a).length ? '<br>' + supplierNumbersHtml744(a) : ''))}<div style=\"margin-top:3px\">"
change(old,new,'Equipment list has the same typed owner labels as its cards')
change("assets: (a.asset_numbers || []).join(', '), open: true", "assets: ItemOwnership969.text(a) || (a.asset_numbers || []).join(', '), open: true",'Map popup receives item ownership and quantity labels')
change("const tl = loading872AssetHtml; loading872AssetHtml = function(a){ const h = tl.apply(this, arguments);", "const tl = loading872AssetHtml; loading872AssetHtml = function(a){ const owner969=ItemOwnership969.html(a);if(owner969)return owner969;const h = tl.apply(this, arguments);",'Timeline asset strip uses typed owners and respects booking item scope')
change(" · v9.68'; /* v8.19"," · v9.69'; /* v8.19",'footer')
out=(b'\xef\xbb\xbf' if raw.startswith(b'\xef\xbb\xbf') else b'')+s.encode();tmp=p.with_name(p.name+'.v969.tmp');tmp.write_bytes(out);tmp.replace(p)
