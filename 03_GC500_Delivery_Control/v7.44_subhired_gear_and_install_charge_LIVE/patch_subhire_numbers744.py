#!/usr/bin/env python3
"""v7.44 supplier asset-number display correction. Author: Andrew Fisher."""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', 'toolchain'))
from rep import rep

path = sys.argv[1]
with open(path, encoding='utf-8') as source:
    text = source.read()
if 'function supplierGroups744(' in text:
    sys.exit('v7.44 supplier-number display patch already applied')
if 'function subhire744DrawerHtml(' not in text:
    sys.exit('v7.44 supplier-number display patch needs the v7.44 sub-hire entry patch')
with open(os.path.join(HERE, 'supplier_numbers744_src.js'), encoding='utf-8') as source:
    js = source.read()

def change(old, new, label):
    global text
    text = rep(text, old, new, label, path, True)

def within(name, old, new, label):
    """Exactly one replacement inside a named function, then one in the page."""
    start = text.index('function ' + name + '(')
    end = text.find('\nfunction ', start + 1)
    if end < 0:
        raise ValueError('No following function for ' + name)
    block = text[start:end]
    updated = rep(block, old, new, label, path, True)
    change(block, updated, label + ' function')

change('function assetNosLine(a){', js + '\nfunction assetNosLine(a){', 'supplier display helpers')
start = text.index('function assetNosLine(a){')
end = text.index('/* The light cell every table shares:', start)
change(text[start:end], 'function assetNosLine(a){ return displayNumbersHtml744(a); }\n', 'shared asset-number line')

within('dropText', " const nums = (a.asset_numbers || []).filter(n => String(n).toUpperCase() !== 'MISCITEM');\n const sub = (rentalOf(a.key) || {}).subhires || [];\n L.push(`${types || a.product || 'item'}${nums.length ? ' · asset no. ' + nums.join(', ')\n : sub.length ? ' · subhired, no asset number' : ' · no asset number recorded — write it on the ground'}`);", " L.push(`${types || a.product || 'item'} · ${displayNumbersText744(a)}`);", 'driver shared text')

within('loadBrief', "${nums.length ? `<span class=\"pill plan\">Asset <b>${esc(nums[0])}</b></span>` : '<span class=\"pill gap\">No asset number</span>'}", "${nums.length ? `<span class=\"pill plan\">Asset <b>${esc(nums[0])}</b></span>` : supplierGroups744(a).length ? '' : '<span class=\"pill gap\">Asset number not recorded yet</span>'}\n ${supplierNumbersHtml744(a)}", 'load brief supplier numbers')
within('driverCard', ": (unnumbered(a) ? '<span class=\"pill none\">Not numbered - counted by quantity</span>' : '<span class=\"pill none\">No asset number on this one yet</span>')}", ": supplierGroups744(a).length ? '' : (unnumbered(a) ? '<span class=\"pill none\">Not numbered - counted by quantity</span>' : '<span class=\"pill none\">Asset number not recorded yet</span>')}\n ${supplierNumbersHtml744(a)}", 'driver card supplier numbers')
within('driverCard', '${c.id ? `<span class="pill good">Rental', '${!subhireOf(a.key) && c.id ? `<span class="pill good">Rental', 'sub-hired driver card has no Coates rental badge')
within('equipmentCard', " if (!nums.length) gaps.push('Asset number missing');", " if (!displayNumbers744(a).all.length && !unnumbered(a)) gaps.push('Asset number not recorded yet');", 'equipment card genuine gaps')
within('equipmentCard', " ${gaps.map(g => `<span class=\"pill gap\">${esc(g)}</span>`).join('')}", " ${supplierNumbersHtml744(a)}\n ${gaps.map(g => `<span class=\"pill gap\">${esc(g)}</span>`).join('')}", 'equipment card supplier numbers')

# Existing Coates source/reference labels remain; the supplier group is additional display evidence.
within('assetNosOf', ").join(o.br ? '<br>' : ' ');", ").join(o.br ? '<br>' : ' ') + (supplierGroups744(a).length ? '<br>' + supplierNumbersHtml744(a) : '');", 'reference-labelled supplier numbers')
within('renderRegister_held', "${a.asset_numbers.length ? assetNosOf(a, {bare: true})", "${a.asset_numbers.length || supplierGroups744(a).length ? assetNosOf(a, {bare: true})", 'register supplier presence')
within('renderRegister_held', '${c.id ? contractShort(c.c, c.id)', "${subhireOf(a.key) ? '—' : c.id ? contractShort(c.c, c.id)", 'sub-hired register has no Coates rental ID')
within('renderRegister_held', '<td>${branchChip(a.key)}</td>', "<td>${subhireOf(a.key) ? '—' : branchChip(a.key)}</td>", 'sub-hired register has no Coates branch')
within('openAssetDraw', "${a.asset_numbers.length?assetNosOf(a, {bare: true})", "${a.asset_numbers.length || supplierGroups744(a).length ? assetNosOf(a, {bare: true})", 'drawer record supplier presence')

within('dropEmailHtml', "${idCell('Asset no.', nums.length ? assetNosBlock(nums) : '<span style=\"font-size:17px;font-weight:400;color:' + MUTE + '\">not recorded</span>',", "${idCell('Asset no.', (nums.length ? assetNosBlock(nums) : supplierGroups744(a).length ? '' : '<span style=\"font-size:17px;font-weight:400;color:' + MUTE + '\">not recorded</span>') + (supplierGroups744(a).length ? '<br>' + supplierNumbersHtml744(a) : ''),", 'email supplier numbers')
within('dropEmailHtml', " : 'write the number that turns up')}", " : supplierGroups744(a).length ? '' : 'write the number that turns up')}", 'email supplier missing prompt')

# Coates editing rows keep their existing handlers. Supplier IDs remain in their own units record.
empty = ": (unnumbered(a) ? '<p class=\"norate\">Not numbered - water-filled barriers and track mat are counted by quantity, not by asset number.</p>' : '<p class=\"norate\">No asset number on this one yet.</p>')}"
replacement = ": supplierGroups744(a).length ? '' : (unnumbered(a) ? '<p class=\"norate\">Not numbered - water-filled barriers and track mat are counted by quantity, not by asset number.</p>' : '<p class=\"norate\">Asset number not recorded yet.</p>')}\n ${supplierNumbersHtml744(a)}"
within('openAssetDraw', empty, replacement, 'drawer supplier asset numbers')
within('chFormHtml', empty, replacement, 'change form supplier asset numbers')
within('chRowHtml', "Asset no. <b>${nums.length ? esc(nums.join(', ')) : unnumbered(a) ? '<span class=\"norate\">not numbered</span>' : '<span class=\"norate\">none yet</span>'}</b>", "${displayNumbersHtml744(a)}", 'change list supplier asset numbers')

within('plantTable', ": '<span class=\"todo\" title=\"the schedule does not carry an asset number for this reference\">—</span>'}<div style=\"margin-top:3px\">", ": supplierGroups744(a).length ? '' : '<span class=\"todo\" title=\"the schedule does not carry an asset number for this reference\">—</span>'}${supplierGroups744(a).length ? '<br>' + supplierNumbersHtml744(a) : ''}<div style=\"margin-top:3px\">", 'register table supplier asset numbers')
within('plantTable', "return (c.id ? contractShort(c.c, c.id) : '<span class=\"todo\" title=\"no Rental ID recorded\">—</span>') + ' ' + branchChip(a.key)", "return (subhireOf(a.key) ? '' : (c.id ? contractShort(c.c, c.id) : '<span class=\"todo\" title=\"no Rental ID recorded\">—</span>') + ' ' + branchChip(a.key))", 'sub-hired plant row has no Coates rental or branch')

within('finderRow', "${it.nums.length ? ' · <small>asset no.</small> ' + it.nums.map(esc).join(', ') : ' · no asset no.'}", "${a ? ' · ' + displayNumbersHtml744(a) : it.nums.length ? ' · <small>asset no.</small> ' + it.nums.map(esc).join(', ') : ' · asset number not recorded yet'}", 'finder supplier asset numbers')
change("${u.asset_no ? assetNo(u.asset_no) : '<span class=\"chip\">no asset number</span>'}", '${unitNumberHtml744(u)}', 'supplier short asset-number rendering')

# The printable reference sheet has a Coates/rental block; append separately owned supplier IDs.
within('dropPage', " : `<span class=\"rs-none\">${sub ? 'subhired — Coates has no asset number for it' : 'no asset number recorded'}</span>${\n ruled()}<span class=\"rs-hint\">write the number that turns up</span>`;", " : supplierGroups744(a).length ? '' : `<span class=\"rs-none\">${sub ? 'sub-hired — no Coates asset number on the contract' : 'asset number not recorded yet'}</span>${\n ruled()}<span class=\"rs-hint\">write the number that turns up</span>`;", 'print sheet truthful empty state')
within('dropPage', "${field('Asset no.', assetBox", "${field('Asset no.', assetBox + (supplierGroups744(a).length ? '<br>' + supplierNumbersHtml744(a) : '')", 'print sheet supplier asset numbers')

# Rental-only summaries cannot assert that the supplier has no number at all.
change('>subhired · no asset number${o.subhire.reads_as', '>subhired · no Coates asset number${o.subhire.reads_as', 'rental miscellaneous label')
change('/* a subhired machine is on site and has no asset number, so it is counted as a machine and never as a number */', '/* A sub-hired machine has no Coates plant number on this rental line; its supplier number is recorded separately. */', 'rental count explanation')
change("subhired machine${subhires === 1 ? '' : 's'} with no asset number", "subhired machine${subhires === 1 ? '' : 's'} with no Coates asset number on the contract", 'rental headline wording')
change('>Subhired, no asset number</span>', '>Subhired, no Coates asset number</span>', 'rental group wording')
change(' An asset number\n is the rental system\'s number for a machine. A subhired machine has none at all — the rental system books it\n as a miscellaneous line with the machine named on it, and the page says <b>subhired · no asset number</b>\n rather than dressing that line as a number.', ' A Coates asset number\n identifies a Coates machine. Sub-hired gear carries the supplier\'s asset number, recorded with its company\n against the location. The Coates rental system may book it as a miscellaneous line with no Coates asset number;\n that is not evidence that the supplier\'s gear has no number.', 'site explanation of supplier numbers')
within('dsnOut', "${(x.a.asset_numbers || []).length ? ' ' + assetNos(x.a.asset_numbers) : ''}", " · ${displayNumbersHtml744(x.a)}", 'site-person supplier numbers')
within('dsnOut', "${(x.a.asset_numbers || []).length ? '' : ' · no asset number recorded, and none is needed'}", '', 'site-person false missing number')

with open(path, 'w', encoding='utf-8') as target:
    target.write(text)
print('ok', path)
