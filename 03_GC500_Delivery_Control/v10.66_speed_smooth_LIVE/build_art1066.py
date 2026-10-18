"""Author: Andrew Fisher. Bound decorative Build SVGs without changing card facts or dimensions."""
from pathlib import Path
import sys
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from rep import rep

def apply(text,path):
    start=text.index('/* Author: Andrew Fisher. Approved Build cards read shared facts without changing any record. */')
    end=text.index('</script>',start)
    old=text[start:end]
    block=old
    sky="function sky(w){if(!w.kind)return '';return '<span class=\"wm-card-scene'+(w.kind==='wind'?' bc984-neutral-sky':'')+'\" aria-hidden=\"true\">'+(w.kind==='wind'?'':WX818.art(w.kind,false))+'</span>';}"
    new="function sky(w,defer=false){if(!w.kind)return '';const lazy=defer&&w.kind!=='wind';return '<span class=\"wm-card-scene'+(w.kind==='wind'?' bc984-neutral-sky':'')+'\" aria-hidden=\"true\"'+(lazy?' data-bc1066-sky=\"'+w.kind+'\" data-bc1066-ready=\"false\"':'')+'>'+((w.kind==='wind'||lazy)?'':WX818.art(w.kind,false))+'</span>';}"
    block=rep(block,sky,new+'\n'+(Path(__file__).with_name('build_art1066_src.js')).read_text(), 'defer only decorative Build weather SVG',path)
    block=rep(block,"'<span class=\"dface bc984-card\">'+sky(w)+foreground(w.kind)+", "'<span class=\"dface bc984-card\">'+sky(w,true)+foreground(w.kind)+",'keep exported sky eager for other views',path)
    block=rep(block,"button.textContent=paused?'Play animation':'Pause animation';button.setAttribute('aria-pressed',String(paused));details(pane);sync();", "button.textContent=paused?'Play animation':'Pause animation';button.setAttribute('aria-pressed',String(paused));details(pane);artMount1066(pane);sync();",'hydrate visible Build artwork before mount completes',path)
    block=rep(block,"insertAdjacentHTML('afterbegin',sky(w)+foreground(w.kind))", "insertAdjacentHTML('afterbegin',sky(w,true)+foreground(w.kind))",'refresh weather with the same bounded artwork',path)
    block=rep(block," details(pane);sync();\n}\nfunction checkDay()", " details(pane);artMount1066(pane);sync();\n}\nfunction checkDay()",'hydrate changed visible weather',path)
    block=rep(block,"function sync(){const play=allowed();", "function sync(){if(!active())stopArt1066();const play=allowed();",'release the artwork observer on departure',path)
    block=rep(block,"window.addEventListener('beforeprint',()=>{printing=true;sync();});", "window.addEventListener('beforeprint',()=>{printing=true;flushArt1066();sync();});",'synchronously render every Build weather picture for print',path)
    block=rep(block,"root.BuildCards984={html,begin,mount,weather,", "root.BuildCards984={html,begin,mount,mountArtwork1066:()=>artMount1066(document.getElementById('pane-timeline')),weather,",'expose synchronous artwork reconciliation after native reveal',path)
    text=rep(text,old,block,'bounded Build artwork source block',path)
    text=rep(text,"  if(kind!=='loading'&&window.TimelineStrip937)TimelineStrip937.reveal();", "  if(kind!=='loading'){if(window.TimelineStrip937)TimelineStrip937.reveal();window.BuildCards984?.mountArtwork1066?.();}",'hydrate artwork after loading or cached record reveal',path)
    text=rep(text,"if(on&&on.dataset.day===sel&&Math.abs(s1.scrollLeft-sl)>.5)s1.scrollLeft=sl;}return r;", "if(on&&on.dataset.day===sel&&Math.abs(s1.scrollLeft-sl)>.5)s1.scrollLeft=sl;}window.BuildCards984?.mountArtwork1066?.();return r;",'hydrate the restored swiped viewport synchronously',path)
    return text
