# Author: Andrew Fisher. Physical supplier block loads and portable capacity on native programme dates.
from pathlib import Path
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parents[1] / 'toolchain'))
from rep import rep


def patch(html):
    if 'demob-packing996-source' in html:
        raise ValueError('Demob packing v9.96 already applied')
    if 'demob-weather996-source' not in html or 'supplier996-script' not in html:
        raise ValueError('Demob packing requires the v9.96 supplier and Demob components')
    def replace(old, new, why):
        nonlocal html
        html = rep(html, old, new, why, 'packing996')
    replace("\t\tconst next = D[i + 1];\n\t\tconst onDay", "\t\tif (window.DemobPacking996) loads.splice(0, loads.length, ...DemobPacking996.repack(loads));\n\t\tconst next = D[i + 1];\n\t\tconst onDay", 'Apply supplier panel capacity without changing dates or Coates loads')
    replace("const list = Dy.list.filter(r => !r.evtPure && !r.nothing && (branch === 'all' || r.branch === branch));", "const nativeList = Dy.list.filter(r => !r.evtPure && !r.nothing && (branch === 'all' || r.branch === branch));\n\tconst split996 = window.DemobPacking996 ? DemobPacking996.splitBlocks(nativeList, iso, a => gcUnits925(a, {loading:false})) : {refs:nativeList,loads:[]};\n\tsup.push(...split996.loads);\n\tsup.sort((a,b)=>({outside:0,inside:1,unknown:2}[a.stops[0].r.side]??2)-({outside:0,inside:1,unknown:2}[b.stops[0].r.side]??2)||cmp816(a.stops[0].r,b.stops[0].r));\n\tconst list = split996.refs;", 'Dedicated supplier block trucks leave residual branch items intact')
    replace("parts: [{type: (u.map(y => y.type).join(' + ') || 'event portables')", "parts: x.parts996 || [{type: (u.map(y => y.type).join(' + ') || 'event portables')", 'Typed planned portable mix on native truck stops')
    replace("function partWords816(p){ return (p.unknown ? 'quantity to confirm' : p.n) + ' × ' + p.type + (p.tank ? ' (the tank, after the toilet on it)' : ''); }", "function partWords816(p){ return window.DemobPacking996 ? DemobPacking996.words(p) : (p.unknown ? 'quantity to confirm' : p.n) + ' × ' + p.type + (p.tank ? ' (the tank, after the toilet on it)' : ''); }", 'Physical block asset numbers stay on cards and native print sheets')
    replace("supplier's own transport · ${L.toilet.units}${L.toilet.uncertain ? ' + to confirm' : ''} of 24", "supplier's own transport · ${esc(window.DemobPacking996 ? DemobPacking996.capacity(L.toilet) : L.toilet.units + ' of 24')}", 'One truthful capacity label on supplier truck cards')
    replace("<span><label>Units</label><b>${L.toilet.units}${L.toilet.uncertain ? '+' : ''} of 24</b></span>", "<span><label>Load</label><b>${esc(window.DemobPacking996 ? DemobPacking996.capacity(L.toilet) : L.toilet.units + ' of 24')}</b></span>", 'Native print distinguishes full-truck blocks from portable slots')
    replace("if (Dy && Dy.loads.length) [['sub', 'Sub-hire pick-up (the supplier\\'s own transport, up to 24 a load):']", "if (T.some(L => L.toilet)) [['sub', 'Sub-hire pick-up (supplier transport; blocks each use a full truck):']", 'Block-only day still appears in native draft email')
    replace("Ld.units + (Ld.uncertain ? ' + quantity to confirm' : '') + ' of ' + Ld.cap", "(window.DemobPacking996 ? DemobPacking996.capacity(Ld) : Ld.units + (Ld.uncertain ? ' + quantity to confirm' : '') + ' of ' + Ld.cap)", 'Email capacity agrees with native cards and print')
    replace("(x.unplanned ? ' (unplanned - quantity changed)' : '')).join(', '))); L.push(''); });", "(x.parts996?.some(p=>p.assetNo) ? ' [' + x.parts996.filter(p=>p.assetNo).map(p=>'asset '+p.assetNo).join(', ') + ']' : '') + (x.unplanned ? ' (unplanned - quantity changed)' : '')).join(', '))); L.push(''); });", 'Exact physical block identities in native draft email')
    replace("of ${cap}${coates ? ' · this truck' : ' · supplier pick-up'}", "of ${cap}${coates ? ' · this truck' : ' · max 6 pee panels'}${L.packingIssue996 ? ' · item split to confirm' : ''}", 'Portable load capacity shows the panel limit')
    replace("what is ready, in loads of up to 24, on site 07:00–17:00.", "what is ready, up to 24 FWF or 6 pee panels + 18 FWF per load, on site 07:00–17:00.", 'Supplier portable rule matches the shared supplier model')
    script = '<script id="demob-packing996-source">\n' + (HERE / 'packing996.js').read_text() + '\n</script>\n'
    replace('<script id="demob-weather996-source">', script + '<script id="demob-weather996-source">', 'Load shared capacity helper before the weather cards invoke the native programme')
    return html
