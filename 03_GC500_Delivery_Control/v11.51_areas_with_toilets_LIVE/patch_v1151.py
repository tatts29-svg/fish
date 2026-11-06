"""Author: Andrew Fisher. v11.51 - the servicing areas on the Map explorer belong to the toilets: their outlines and captions
show only while the Toilets & amenities filter is on, or when one area is chosen; the symbols beside the codes stay.

Andrew, 23 Oct 2026 10:33, on v11.47: "you pinged the areas in all description the areas was only for The toilets".

v11.47 painted the thirteen area outlines and their captions across the whole plan on opening, over the generators, the
buildings, the VMS boards and everything else. v11.51 edits that block (mapunits1147-script) in place: the selector opens
on "With the toilets" (the outlines draw while the explorer's Toilets & amenities chip is pressed, and redraw as the chip
is pressed or released); "All areas", "Hide" and each single area stay as choices; the hint says so. Nothing else in the
block moves: the equipment symbols, the key, the fit-to-area, #expcard. Footer v11.50 -> v11.51 (the v11.49 claim is
renumbered so the footer never reads backwards). The record untouched; the crew card untouched.

    python3 patch_v1151.py page.html      (in place, on the live v11.50 page)
"""
import hashlib, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
BASE_SHA256 = (HERE / 'BASE_SHA256').read_text().strip()

TOILETS_ON = ("const H=parent.MapUnits1147;if(!H)return;\n"
              " /* v11.51 - the areas belong to the toilets: the explorer's Toilets & amenities chip decides, and a press on any chip repaints */\n"
              " function toiletsOn(){const c=[...document.querySelectorAll('button.chip[data-cat]')].find(b=>/^Toilets/.test(b.textContent.trim()));return !!c&&c.getAttribute('aria-pressed')==='true';}\n"
              " document.addEventListener('click',e=>{if(e.target&&e.target.closest&&e.target.closest('button.chip[data-cat]'))setTimeout(()=>{try{draw(currentView());requestPaint();}catch(err){}},60);},true);")
EDITS = [
    ("let ready=false,filter='',paints=0,shown=[],lastAreas=[];", "let ready=false,filter='auto',paints=0,shown=[],lastAreas=[];", 'the default: with the toilets'),
    ("const H=parent.MapUnits1147;if(!H)return;", TOILETS_ON, 'toiletsOn and the chip repaint'),
    ("if(filter==='off'||window.GC500FencingMap?.active||document.body.classList.contains('in3d'))return;",
     "if(filter==='off'||(filter==='auto'&&!toiletsOn())||window.GC500FencingMap?.active||document.body.classList.contains('in3d'))return;\n  const one=filter&&filter!=='auto';", 'draw only in the toilets\' context'),
    ("if(filter&&a.id!==filter)continue;", "if(one&&a.id!==filter)continue;", 'one area chosen'),
    ("ctx.fillStyle=a.color+(filter?'22':'12');ctx.fill();ctx.strokeStyle=a.color+'30';ctx.lineWidth=(filter?10:6)*dpr;ctx.stroke();ctx.strokeStyle=a.color;ctx.lineWidth=(filter?2.5:1.5)*dpr;ctx.stroke();",
     "ctx.fillStyle=a.color+(one?'22':'12');ctx.fill();ctx.strokeStyle=a.color+'30';ctx.lineWidth=(one?10:6)*dpr;ctx.stroke();ctx.strokeStyle=a.color;ctx.lineWidth=(one?2.5:1.5)*dpr;ctx.stroke();", 'the single-area emphasis'),
    ("let text=sw<700?'Area '+a.id:full,max=filter?canvas.width-20*dpr:Math.min(290*dpr,Math.max(80*dpr,label.w));",
     "let text=sw<700?'Area '+a.id:full,max=one?canvas.width-20*dpr:Math.min(290*dpr,Math.max(80*dpr,label.w));", 'the caption width'),
    ("if(ctx.measureText(text).width>max&&!filter)text='Area '+a.id;", "if(ctx.measureText(text).width>max&&!one)text='Area '+a.id;", 'the short caption'),
    ("const all=H.areas();if(id!==''&&id!=='off'&&!all.some(a=>a.id===id&&a.polygons.length))return false;",
     "const all=H.areas();if(id!==''&&id!=='off'&&id!=='auto'&&!all.some(a=>a.id===id&&a.polygons.length))return false;", 'the selector accepts auto'),
    ("window.MapUnits1147=Object.freeze({reference,draw,select,get state(){return {ready,filter,paints,shown:[...shown],areas:lastAreas.map(a=>({id:a.id,name:a.name,parts:a.polygons.length}))};}});",
     "window.MapUnits1147=Object.freeze({reference,draw,select,toiletsOn,get state(){return {ready,filter,paints,shown:[...shown],areas:lastAreas.map(a=>({id:a.id,name:a.name,parts:a.polygons.length}))};}});", 'the handle names toiletsOn'),
    ("for(const [value,text,disabled] of [['','All areas · separate outlines',false],['off','Hide area highlights',false],",
     "for(const [value,text,disabled] of [['auto','With the toilets · outlines while the Toilets & amenities filter is on',false],['','All areas · separate outlines',false],['off','Hide area highlights',false],", 'the selector choices'),
    ("hint.textContent='Area numbers match the servicing sheets. Outlines group recorded locations; they are not surveyed boundaries.';",
     "hint.textContent='The servicing areas belong to the toilets: their outlines show while the Toilets & amenities filter is on, or when one area is chosen here. Area numbers match the servicing sheets; outlines group recorded locations, not surveyed boundaries.';", 'the hint'),
]


def patch(text):
    if hashlib.sha256(text.encode('utf-8')).hexdigest() != BASE_SHA256: raise ValueError('v11.51 requires the live v11.50 page ' + BASE_SHA256)
    if 'function toiletsOn()' in text: raise ValueError('v11.51 already applied')
    if text.count('<script id="mapunits1147-script">') != 1: raise ValueError('the v11.47 explorer block is not on the page once')
    for old, new, what in EDITS: text = rep(text, old, new, what, 'page')
    text = rep(text, "+' · v11.50'; /* v8.19 release922", "+' · v11.51'; /* v8.19 release922", 'release footer', 'page')
    for needle, n in [('function toiletsOn()', 1), ("filter='auto'", 1), ("(filter==='auto'&&!toiletsOn())", 1), ('const one=filter&&', 1), ("['auto','With the toilets", 1), ('reference,draw,select,toiletsOn,', 1), ('belong to the toilets', 2), ("+' · v11.51'; /* v8.19 release922", 1)]:
        if text.count(needle) != n: raise ValueError('v11.51 did not land cleanly: ' + needle + ' x' + str(text.count(needle)))
    return text


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1151 applied: the Map explorer areas only with the toilets; footer v11.50 -> v11.51')
