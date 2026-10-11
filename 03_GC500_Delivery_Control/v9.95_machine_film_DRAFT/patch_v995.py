"""Author: Andrew Fisher. Native 4K hero film, existing Coates Way presentation retained."""
import os
from pathlib import Path
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep
from media995 import literal, load_report, replace_data, sha, update_data
BASE_SHA = '382311bc1faf33ca1333d1431368a442dbdf651a6d23874b56ef65bae7ed8dd8'
MARKER = 'const MachineFilm995 = '

OLD_VIDEO = ''' ${hero.webm || hero.mp4 ? `<video class="cwloop" muted loop playsinline preload="metadata" width="${hero.width}" height="${hero.height}" poster="${hero.poster || hero.src}" aria-label="${esc(hero.is || 'The Coates Way cog, running, coming apart and going back together')}">${
 hero.mp4 ? `<source src="${hero.mp4}" type="video/mp4">` : ''}${hero.webm ? `<source src="${hero.webm}" type="video/webm">` : ''}</video>`'''
NEW_VIDEO = ''' ${hero.mp4 ? `<video class="cwloop" muted loop playsinline preload="none" width="${hero.width}" height="${hero.height}" poster="${hero.poster || hero.src}" aria-label="${esc(hero.is || 'The Coates Way cog, running, coming apart and going back together')}"></video>`'''
OLD_WIRE = ''' /* v6.00 - the loop plays by itself, muted, once it is on screen; it rests when the card is scrolled away, and stays on its
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

def apply(text, report_path=None, report_sha=None):
    if MARKER in text: raise ValueError('Machine film v9.95 already applied')
    if sha(text.encode()) != BASE_SHA: raise ValueError('Wrong base: requires exact live v9.94')
    roles = load_report(report_path or os.environ.get('MACHINE995_REPORT'),report_sha or os.environ.get('MACHINE995_REPORT_SHA256'))
    data,_,_ = literal(text)
    text = rep(text," function wire(im){\n const src=im.getAttribute('src')||'';"," function wire(im){\n if (im.tagName !== 'IMG') return; /* v9.95: picture status belongs to images, never lazy videos. */\n const src=im.getAttribute('src')||'';",'Keep picture loader scoped to images','v9.95')
    text = rep(text,OLD_VIDEO,NEW_VIDEO,'Lazy hero video without eager source downloads','v9.95')
    text = rep(text,OLD_WIRE," MachineFilm995.mount(pic && pic.querySelector('video.cwloop'));\n",'Owned hero playback lifecycle','v9.95')
    text = rep(text,'function machineCardHtml(){',(HERE/'player995.js').read_text()+'\nfunction machineCardHtml(){','Shared lazy film controller','v9.95')
    text = rep(text,"+ ' · v9.94'","+ ' · v9.95'",'Release footer','v9.95')
    return replace_data(text,update_data(data,roles))

def main():
    path=Path(sys.argv[1]);text=path.read_text();path.write_text(apply(text))
if __name__ == '__main__': main()
