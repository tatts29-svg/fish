"""Author: Andrew Fisher. Read-only compatibility when quantity-owned units gain complete identities."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MARKER = 'function quantitySubhireIdentified1094('


def replace_once(text, old, new):
    count = text.count(old)
    if count != 1:
        raise ValueError(f'Expected one predecessor match; found {count}: {old[:80]}')
    return text.replace(old, new, 1)


def apply(text):
    """Apply only this bounded projection fix; the enclosing release guards exact predecessor bytes."""
    if MARKER in text:
        raise ValueError('Quantity identity compatibility is already applied')
    text = replace_once(text, 'function quantitySubhire964Key(ref,item){',
                        ROOT.joinpath('quantity_identity1094.js').read_text() +
                        '\nfunction quantitySubhire964Key(ref,item){')
    overlap = " if(units.some(u=>u.item===item&&u.source!=='history'&&(u.physical||u.id||u.assetNo)))return fail('Individual identities now overlap this quantity-only ownership; reconcile them before counting both.');"
    progress = " if(!progress||progress.quantity!==d.quantity||![progress.arrived,progress.done].every(q=>Number.isInteger(q)&&q>=0&&q<=d.quantity)||progress.done>progress.arrived)return fail('The recorded item quantities need reconciliation.');"
    text = replace_once(text, overlap, '')
    text = replace_once(text, progress, progress + """
 if(quantitySubhireIdentified1094(ref,item,d.quantity,units,d.owner))return {...fail(''),supersededByIndividualIdentities:true};
""" + overlap)
    text = replace_once(
        text, " const quantityOnly=ref==='WC09'&&same(item,'Pee Panel');",
        " const quantityOnly=ref==='WC09'&&same(item,'Pee Panel')&&!quantitySubhireIdentified1094(ref,item,on,model?.rows,'event-portables');")
    text = replace_once(
        text, "  if(refs.length&&refs.every(ref=>ref.key==='WC09'&&same(r.item,'Pee Panel')))r.unnum=true;",
        "  if(refs.length&&refs.every(ref=>ref.key==='WC09'&&same(r.item,'Pee Panel')))r.unnum=refs.every(ref=>ref.quantityOnly960===true);")
    return text
