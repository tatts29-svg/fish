"""Author: Andrew Fisher. Preserve native behaviour while giving each activation clear feedback."""
from pathlib import Path
import sys
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent.parent/'toolchain'))
from rep import rep

def apply(html):
    if 'VisualClarity1018=' in html:
        raise ValueError('Visual clarity feedback already applied')
    if 'root.ScopeFinance1017=' not in html:
        raise ValueError('Reviewed v10.17 base required')
    old="""document.addEventListener('pointerdown', e => {
 if (e.button !== 0 || e.ctrlKey || e.metaKey || motionOff()) return;
 const t = e.target.closest('button,.mk,.hubcard,.day, a.btn, [role=button]');
 if (!t || t.disabled) return;
 t.classList.remove('lit');
 void t.offsetWidth; /* restart the animation when the same thing is pressed twice */
 t.classList.add('lit');
 const off = () => { t.classList.remove('lit'); t.removeEventListener('animationend', off); };
 t.addEventListener('animationend', off, {once: true});
 setTimeout(off, 700);
}, true);"""
    html=rep(html,old,'/* v10.18: VisualClarity1018 supplies independent pointer and keyboard feedback without replacing target animations. */','Replace layout-forcing press animation','v10.18')
    html=rep(html,'\n</head>','\n<style id="presentation1018-style">\n'+(HERE/'presentation1018.css').read_text()+'\n</style>\n</head>','Sharp selected and keyboard control edges','v10.18')
    return rep(html,'\n</body>\n</html>','\n<script id="presentation1018-script">\n'+(HERE/'presentation1018.js').read_text()+'\n</script>\n</body>\n</html>','Bounded independent activation halo','v10.18')
