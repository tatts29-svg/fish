"""Author: Andrew Fisher. Shared equipment grouping without changing business classifications."""
from pathlib import Path
HERE=Path(__file__).resolve().parent

def integrate(text):
    if 'function inventoryView(I,options)' in text:
        raise ValueError('equipment display grouping already installed')
    def replace(old,new,label):
        nonlocal text
        n=text.count(old)
        if n!=1: raise ValueError(f'{label}: expected one match, found {n}')
        text=text.replace(old,new)
    replace('function inventory(){',(HERE/'equipmentGroups1103_src.js').read_text()+'\nfunction inventory(){','display helper')
    replace('state.plantGroup = a ? (PLANT_GROUP_WORDS[a.product] || a.product || a.discipline) : null;','state.plantGroup = a ? EquipmentGroups1103.group(a) : null;','record group navigation')
    replace("const groupOf = a => groupWords[a.product] || a.product ||\n    (a.discipline === 'Access & plant' ? 'Forklifts & access' : a.discipline);","const groupOf = a => EquipmentGroups1103.group(a);",'Today group')
    replace('const groupOf = a => canonical(words[a.product] || a.product || a.discipline);','const groupOf = a => EquipmentGroups1103.group(a);','Today detailed group')
    replace('const members1098 = live.filter(a => groupOf(a) === def.group);',"const members1098 = live.filter(a => groupOf(a) === def.group && (def.id !== 'equipment' || accessKeys1103.has(a.key)));",'physical access aliases counted once')
    replace('  const areas = definitions.map(def => {',"  const accessKeys1103 = new Set(physicalCountAssets963(live).assets.map(a => a.key));\n  const areas = definitions.map(def => {",'same physical reference scope as Equipment')
    replace("const g = PLANT_GROUP_WORDS[a.product] || a.product || a.discipline || 'Uncategorised';","const g = EquipmentGroups1103.group(a);",'Equipment group')
    replace("const group=groups[asset.product]||asset.product||(asset.discipline==='Access & plant'?'Forklifts & access':asset.discipline),types=",'const group=EquipmentGroups1103.group(asset),types=','timeline same group')
    old=r"accepts: /forklift|telehandler|scissor|boom\s*lift|cherry\s*picker|\bewp\b|access\s*platform/i}"
    replace(old,'accepts: {test: EquipmentGroups1103.isMachine}}','Today machine predicate')
    old=r"'Forklifts & access':/forklift|telehandler|scissor|boom\s*lift|cherry\s*picker|\bewp\b|access\s*platform/i}"
    replace(old,"'Forklifts & access':{test:EquipmentGroups1103.isMachine}}",'timeline machine predicate')
    replace(r"const separatePart = /\b(?:tynes?|tines?|attachments?|forks)\b|^(?:stairs?|steps?|fridge|chairs?|tables?|desks?|cables?)\b/i.test(item);",r"const separatePart = /\b(?:tynes?|tines?|attachments?|forks)\b|^(?:stairs?|steps?|fridge|chairs?|tables?|desks?|cables?)\b/i.test(item) || def.id === 'equipment' && EquipmentGroups1103.isAccessory(item);",'access attachments excluded from machine scope')
    replace("item.trim()&&!part.test(item)&&accepts.test(item)","item.trim()&&!part.test(item)&&!(group===EquipmentGroups1103.ACCESS&&EquipmentGroups1103.isAccessory(item))&&accepts.test(item)",'timeline excludes access attachments')
    replace("const g = state.plantGroup; if (!g) return '*';","const g = state.plantGroup; if (!g || g === EquipmentGroups1103.ACCESS) return '*';",'mixed business disciplines remain intact')
    replace("const I = inventory(), dis = ro ? ' disabled' : '';","const I = EquipmentGroups1103.nativeInventory(inventory()), dis = ro ? ' disabled' : '';",'focused inventory screen')
    replace("const I = inventory(), rows = I.list.filter(r => INV.disc === '*' || r.disc === INV.disc).sort((x, y) => x.disc.localeCompare(y.disc) || x.item.localeCompare(y.item));","const I = EquipmentGroups1103.nativeInventory(inventory()), rows = I.list.filter(r => INV.disc === '*' || r.disc === INV.disc).sort((x, y) => x.disc.localeCompare(y.disc) || x.item.localeCompare(y.item));",'focused inventory PDF')
    replace("const M = inv83Money(rows), togo = inv83Togo(I), all = INV.disc === '*', what = all ? 'Every trade' : INV.disc;","const M = inv83Money(rows), togo = inv83Togo(I), all = INV.disc === '*', what = EquipmentGroups1103.caption(I, all ? 'Every trade' : INV.disc);",'PDF caption')
    replace('const list=Inventory1017.outstanding(I,INV.disc);','const list=EquipmentGroups1103.outstanding(I,INV.disc);','focused pending screen')
    replace('return Inventory1017.outstanding(I,INV.disc);','return EquipmentGroups1103.outstanding(I,INV.disc);','focused pending PDF')
    replace("return q.split(/\\s+/).filter(Boolean).every(t => haystack(a).includes(t));","return q.split(/\\s+/).filter(Boolean).every(t => (haystack(a) + ' ' + EquipmentGroups1103.group(a).toLowerCase()).includes(t));",'group search')
    return text

if __name__=='__main__':
    import sys
    if len(sys.argv)!=3:raise SystemExit('usage: integrate_grouping.py INPUT_HTML PRIVATE_OUTPUT_HTML')
    source=Path(sys.argv[1]);target=Path(sys.argv[2]);target.write_text(integrate(source.read_text()))
