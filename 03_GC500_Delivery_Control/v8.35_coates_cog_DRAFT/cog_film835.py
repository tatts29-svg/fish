"""Author: Andrew Fisher. Film controls beside the existing steering-wheel vehicle."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

OLD_HERO = ''' ${hero ? `<${opens ? 'button type="button"' : 'div'} class="cwhero${opens ? ' opens' : ''}" id="cwHero"${opens ? ' aria-label="Open the machine" disabled' : ''} style="aspect-ratio:${hero.width}/${hero.height}">
 ${hero.webm || hero.mp4 ? `<video class="cwloop" muted loop playsinline preload="metadata" width="${hero.width}" height="${hero.height}" poster="${hero.poster || hero.src}" aria-label="${esc(hero.is || 'The Coates Way cog, running, coming apart and going back together')}">${
 hero.mp4 ? `<source src="${hero.mp4}" type="video/mp4">` : ''}${hero.webm ? `<source src="${hero.webm}" type="video/webm">` : ''}</video>`
 : `<img src="${hero.src}" width="${hero.width}" height="${hero.height}" alt="The Coates Way cog as the steering wheel of the Coates #26, from the driver's seat — every word on it readable,the hall beyond the windscreen">`}
 <span class="cwherotag"><i></i>${opens ? 'THE MACHINE · OPENS HERE' : 'THE MACHINE · ON THE HOSTED PAGE'}</span>
 </${opens ? 'button' : 'div'}>` : ''}'''
NEW_HERO = " ${hero ? cogFilmHero835(hero) : ''}"
OLD_INLINE = ''' /* v6.00 - the loop plays by itself, muted, once it is on screen; it rests when the card is scrolled away, and stays on its
 poster for anyone who asked their device for reduced motion */
 const loop = pic && pic.querySelector('video.cwloop');
 if (loop) {
 const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
 if (!still) {
 const play = () => { const p = loop.play(); if (p && p.catch) p.catch(() => {}); };
 if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? play() : loop.pause()), {threshold:.15}).observe(loop);
 else play();
 }
 }
'''
OLD_STORY = "The cog is the steering wheel of the Coates #26 — in the driver's hands, on the column, its shaft to the rack: ${esc(parts)}, every one linked to what it drives, the 138 of the wheel's own each with its Coates Way link."
NEW_STORY = "The cog is the steering wheel of the Coates #26 — in the driver's hands, on the column, its shaft to the rack."
POP_ANCHOR = "function onPop(){\n const gc = (history.state && typeof history.state.gc === 'number') ? history.state.gc : 0;"
POP_NEW = POP_ANCHOR + '''
 if (COG_FILM835.dialog) {
 const samePane = location.hash === NAV.cur;
 cogFilmClose835(samePane);
 if (samePane) { NAV.cur = location.hash; NAV.curGc = gc; navBackShow(); return; }
 }'''


def changes():
    """Declared fragments support exact inverse preservation tests."""
    source = (ROOT / 'cog_film835_src.js').read_text()
    style = '<style id="cog-film835">\n' + (ROOT / 'cog_film835.css').read_text() + '</style>\n'
    return [
        (OLD_HERO, NEW_HERO, 'Give the steering-wheel film its own control'),
        (" const parts = m && m.parts ? m.parts + ' parts' : '279 parts';\n", '', 'Remove the unverified illustrative part count'),
        (" const opens = DATA.edition === 'hosted';\n", '', 'Film availability follows resolved media'),
        (OLD_STORY, NEW_STORY, 'Keep the car steering-wheel story without stale counts'),
        (" const b = $('#cwOpenMachine'), st = $('#cwMachineState'), pic = $('#cwHero');", " const b = $('#cwOpenMachine'), st = $('#cwMachineState');", 'Keep vehicle status independent'),
        (" if (pic && pic.tagName === 'BUTTON') pic.onclick = () => machineOpen();\n", ' cogFilmMount835();\n', 'Mount the separate film controller'),
        (OLD_INLINE, '', 'Replace the unowned inline observer'),
        (" b.disabled = false; if (pic && pic.tagName === 'BUTTON') pic.disabled = false;", ' b.disabled = false;', 'Vehicle availability does not gate film playback'),
        (" $('#pane-coatesway').innerHTML = paneHeadingHtml('coatesway') + `", " cogFilmUnmount835();\n $('#pane-coatesway').innerHTML = paneHeadingHtml('coatesway') + `", 'Dispose the previous inline film before redraw'),
        (' const changed = tab !== state.tab;', " const changed = tab !== state.tab;\n if (changed && state.tab === 'coatesway') cogFilmLeave835();", 'Stop the film when leaving its page'),
        (POP_ANCHOR, POP_NEW, 'Browser Back closes the film before navigating'),
        ('function machineCardHtml(){', source + '\nfunction machineCardHtml(){', 'Add owned film lifecycle and accessible controls'),
        ('</head>\n<body>', style + '</head>\n<body>', 'Scope film presentation to its own controls'),
    ]


def apply(text):
    """Pure component; media descriptors and release publication remain separate."""
    if 'function createCogMedia835(' in text or 'id="cog-film835"' in text:
        raise ValueError('The cog film component is already applied')
    if 'function pricingAction834(' not in text:
        raise ValueError('The reviewed cleanup base must be present')
    for old, new, label in changes():
        rep(text, old, new, label, 'host')
        if text.count(old) != 1:
            raise ValueError('The exact reviewed source has changed: ' + label)
        text = text.replace(old, new, 1)
    return text
