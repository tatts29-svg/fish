"""Author: Andrew Fisher. Bounded crew Showcase patch; parent owns base/version."""
from pathlib import Path
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "toolchain"))
from rep import rep

def patch(text, path="page.html"):
    if 'id="crew-showcase1090-script"' in text:
        raise ValueError("Crew Showcase v10.90 already applied")
    if 'id="showcase1089-script"' not in text:
        raise ValueError("Verified v10.89 Showcase prerequisite missing")
    css = """/* Author: Andrew Fisher. Existing scene classes, no image/backdrop changes. */
@media(max-width:699px){
#showcase[data-back="circuit3d"] #showBody[data-crew1090],#showcase[data-back="circuit3d_day"] #showBody[data-crew1090]{margin-bottom:48px;padding-bottom:calc(var(--u)*1)}
#showBody[data-crew1090] .shrow{font-size:max(12px,calc(var(--u)*1))}
#showBody[data-crew1090] .shrow b{font-size:max(12px,calc(var(--u)*1.5))}
#showBody[data-crew1090] .shof,#showBody[data-crew1090] .shf{font-size:max(12px,calc(var(--u)*.95))}
#showBody[data-crew1090] .shbig small{display:block;font-size:max(12px,calc(var(--u)*1.5));line-height:1.25;margin:4px 0 0}
}"""
    addition = '<style id="crew-showcase1090-style">\n'+css+'\n</style>\n<script id="crew-showcase1090-script">\n'+(HERE/"crew_showcase1090.js").read_text()+'\n</script>\n'
    return rep(text, '</body>\n</html>', addition+'</body>\n</html>', 'crew Showcase evidence pages', path)
