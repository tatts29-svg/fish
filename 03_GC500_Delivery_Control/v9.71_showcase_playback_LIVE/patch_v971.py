#!/usr/bin/env python3
"""Author: Andrew Fisher. Showcase opening, static preparation and hidden-work fixes."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
sys.path.insert(0,str(HERE))
from rep import rep as strict_rep
from smoke971 import patch_smoke
from startup_patch971 import apply_startup971

def rep(s,a,b):
    return strict_rep(s,a,b,'v9.71 playback replacement',__file__)

def patch(s):
    if 'playbackRuntime971' in s: raise ValueError('v9.71 already applied')
    if 'G.photoLandmarks970=' not in s or "+ ' · v9.70'" not in s: raise ValueError('Requires v9.70 on exact v9.69 live base')
    s=patch_smoke(s)
    s=apply_startup971(s,lambda text,old,new,reason: strict_rep(text,old,new,reason,__file__))
    start=s.index('    const outside=[true,true,true,true,true,true];')
    end=s.index('q.lastVP=VP;',start)+len('q.lastVP=VP;')
    s=rep(s,s[start:end],'    q.visible=G.visibleCell971(VP,q);q.lastVP=VP;')
    s=rep(s,'const canPage = () => canPlayMedia() && !motionOff();',"const canPage = () => canPlayMedia() && !motionOff() && !document.body.classList.contains('showing');")
    s=rep(s,'</script>\n</body></html>', '</script>\n<script>\n'+(HERE/'showcase971_runtime.js').read_text()+'\n</script>\n</body>\n</html>')
    s=rep(s,"document.body.classList.add('showing');","document.body.classList.add('showing');if(window.GC3D&&GC3D.playbackRuntime971)GC3D.playbackRuntime971.suspend();")
    s=rep(s,"document.body.classList.remove('showing');","document.body.classList.remove('showing');if(window.GC3D&&GC3D.playbackRuntime971)GC3D.playbackRuntime971.resume();")
    s=rep(s,"+ ' · v9.70'","+ ' · v9.71'")
    return s

if __name__=='__main__':
    src=Path(sys.argv[1]);out=Path(sys.argv[2]) if len(sys.argv)>2 else src
    out.write_text(patch(src.read_text()))
