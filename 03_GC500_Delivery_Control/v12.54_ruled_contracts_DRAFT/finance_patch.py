"""Author: Andrew Fisher. Bounded customer servicing zero, no labour replacement."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

ANCHOR = 'function contractTreatment747(row){\n'
NIGHT = "function nightRates1040(){ const b = servicing748base1040(), m = {}; NIGHT1040.forEach(L => { const l = b && (b.card_lines || []).find(x => x.card_line === L.card_line); m[L.kind] = l && l.rate != null ? l.rate : L.rate; }); return m; }"
WATER = ";(function(){const native=servicing748;servicing748=function(){return CustomerWater1244.project(native.apply(this,arguments));};try{window.servicing748=servicing748;}catch(e){}})();"
RATE_LABEL = "l.included1244 ? 'Included in pump-out charges'"
DESCRIPTION = "function description(line,format=String){\n if(!line)return '';"


def replacements():
    source=(ROOT/'settled_finance1254.js').read_text(encoding='utf-8')
    return [
        (ANCHOR, source+'\n'+ANCHOR+' const approved1254=RuledContracts1254.treatment(row);if(approved1254)return approved1254;\n', 'approved source zero'),
        (NIGHT, NIGHT.replace('return m; }','m.sewer=0; return m; }'), 'same customer zero in reference servicing'),
        (WATER, WATER.replace('return CustomerWater1244.project(native.apply(this,arguments));','return RuledContracts1254.project(CustomerWater1244.project(native.apply(this,arguments)));'), 'customer-only shared servicing projection'),
        (RATE_LABEL, "l.approvedZero1254 ? 'Approved contract: no customer charge' : "+RATE_LABEL, 'approved zero rate wording'),
        (DESCRIPTION, DESCRIPTION+"\n if(line.approvedZero1254)return line.description||'';", 'approved zero description'),
    ]


def exact(text, old, new, label, path='page'):
    if text.count(old)!=1:
        raise ValueError(label+': expected one exact boundary')
    if rep(old,old,new,label,path)!=new:
        raise ValueError(label+': shared replacement altered boundary')
    return text.replace(old,new,1)


def patch_finance(text,path='page'):
    if 'RuledContracts1254' in text:
        raise ValueError('v12.54 servicing treatment already applied')
    for old,new,label in replacements():
        text=exact(text,old,new,label,path)
    return text


def reverse_finance(text,path='page'):
    for old,new,label in reversed(replacements()):
        text=exact(text,new,old,'restore '+label,path)
    return text
