"""Author: Andrew Fisher. Approved off-site rings and whole-site pictures, on the exact reviewed v12.43 base."""
import hashlib
import importlib.util
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'toolchain'))
from rep import rep

spec=importlib.util.spec_from_file_location('upstream124225',ROOT/'upstream_patch_v124225.py')
UPSTREAM=importlib.util.module_from_spec(spec);spec.loader.exec_module(UPSTREAM)
picture_spec=importlib.util.spec_from_file_location('pictures12431',ROOT/'picture_cache12431.py')
PICTURES=importlib.util.module_from_spec(picture_spec);picture_spec.loader.exec_module(PICTURES)
BASE_SHA='7efda7e067d34b1455d8da9e3de29c695d4d216afc072e49e27754295a09976f'
FOOT_A="+' · v12.43'; /* v8.19 release922"
FOOT_B="+' · v12.43.1'; /* v8.19 release922"
EARLY_A="const result=draw.apply(this,arguments);if(!left.length)return result;"
EARLY_B="const result=draw.apply(this,arguments);if(!left.length){Offsite1225.set([],v.scale);return result;}"

def replacements():
    ring=(ROOT/'offsite_ring12431.js').read_text().rstrip()
    drawing=UPSTREAM.DRAW_B.split(' /* v12.42.25: the off-site ring')[0]+'\n const Offsite1225='+ring+';'
    return [
        (UPSTREAM.STATUS_A,UPSTREAM.STATUS_B,'departed status keeps its icon'),
        (UPSTREAM.LABEL_A,UPSTREAM.LABEL_B,'label OFF SITE'),
        (UPSTREAM.DRAW_A,drawing,'off-site ring with visibility lifecycle'),
        (EARLY_A,EARLY_B,'clear stale departure points before empty return'),
        (UPSTREAM.VIEWS_A,UPSTREAM.VIEWS_B,'third view'),
        (UPSTREAM.VIEWW_A,UPSTREAM.VIEWW_B,'demob view words'),
        (UPSTREAM.HALF_A,UPSTREAM.HALF_B,'demob spot'),
        (UPSTREAM.STRIP_A,UPSTREAM.STRIP_B,'demob strip'),
        (UPSTREAM.CSS_A,UPSTREAM.CSS_B,'demob third picture full width'),
        (UPSTREAM.PICS_A,UPSTREAM.PICS_B,'find-it third picture full width'),
        (FOOT_A,FOOT_B,'footer')
    ]+PICTURES.replacements()

def patch(text,path='page'):
    if hashlib.sha256(text.encode()).hexdigest()!=BASE_SHA:
        raise ValueError('v12.43.1 requires the exact reviewed live v12.43 SHA-256')
    if 'const Offsite1225=' in text or 'PicCache12431' in text:
        raise ValueError('v12.43.1 already applied')
    if text.count(FOOT_A)!=1:raise ValueError('v12.43.1 predecessor footer is not exactly v12.43')
    for before,after,label in replacements():
        if text.count(before)!=1:raise ValueError(label+': exact anchor does not occur once')
        # rep accepts surrounding whitespace. Restrict it to the already unique
        # exact anchor so a descendant-selector space outside that anchor survives.
        text=text.replace(before,rep(before,before,after,label,path),1)
    return text

if __name__=='__main__':
    page=Path(sys.argv[1]);page.write_text(patch(page.read_text(),str(page)))
    print('patch_v12431 applied')
