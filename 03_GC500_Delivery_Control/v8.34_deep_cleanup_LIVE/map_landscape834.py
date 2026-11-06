"""Fit the existing map shell on short landscape phones. Author: Andrew Fisher."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "toolchain"))
from rep import rep


MEDIA = "screen and (min-width:641px) and (max-width:1024px) and (max-height:500px) and (orientation:landscape)"
SCOPE = "body:has(#pane-map.on #expwrap)"
STYLE = '''<style id="map-landscape834">
/* Author: Andrew Fisher. Compact the existing map shell only on short landscape phones. */
@media ''' + MEDIA + '''{
 ''' + SCOPE + ''' header.top .brandrow{grid-template-columns:auto auto minmax(0,1fr)!important;grid-template-areas:"lock tools search"!important;min-height:56px!important;height:56px!important;padding:6px 12px!important;column-gap:12px!important;row-gap:0!important}
 ''' + SCOPE + ''' header.top .hzcluster{display:none!important}
 ''' + SCOPE + ''' header.top .lockup{padding:0;gap:8px}
 ''' + SCOPE + ''' header.top #bOrg{display:none!important}
 ''' + SCOPE + ''' header.top .wordmark{margin-top:0;gap:8px}
 ''' + SCOPE + ''' header.top .wordmark .gc{font-size:28px!important}
 ''' + SCOPE + ''' header.top .wordmark .yr{font-size:14px!important}
 ''' + SCOPE + ''' header.top .search input{height:44px}
 ''' + SCOPE + ''' header.top .navback{min-height:44px;min-width:44px}
 ''' + SCOPE + ''' nav.tabs .tools .hmore{min-height:44px}
 ''' + SCOPE + ''' main{min-height:0;padding:8px}
 ''' + SCOPE + ''' footer.foot{display:block;padding:4px 12px;font-size:10px;line-height:1.3}
 ''' + SCOPE + ''' footer.foot > span{display:block;min-width:0;max-width:100%;white-space:normal;overflow:visible;overflow-wrap:anywhere}
}
</style>
'''

SIZE_HELPER = '''/* v8.34: the map can use only the space left by the short landscape shell. */
function expLandscape834(){
 return typeof window.matchMedia === 'function' && window.matchMedia(''' + repr(MEDIA) + ''').matches;
}
'''
OLD_HEIGHT = " const height = Math.max(200, Math.floor(available));"
NEW_HEIGHT = " const height = Math.max(expLandscape834() ? 0 : 200, Math.floor(available));"
HEAD_ANCHOR = "</head>\n<body>"
REPLACEMENTS = (
    (HEAD_ANCHOR, STYLE + HEAD_ANCHOR, "short landscape map shell"),
    ("function expSize(){", SIZE_HELPER + "function expSize(){", "short landscape viewport guard"),
    (OLD_HEIGHT, NEW_HEIGHT, "map height within available short landscape space"),
)


def apply(text):
    """Apply guarded layout changes; the caller owns base and release guards."""
    if 'id="map-landscape834"' in text or "function expLandscape834(" in text:
        raise ValueError("v8.34 map landscape already applied")
    for old, new, purpose in REPLACEMENTS:
        text = rep(text, old, new, purpose, "map_landscape834", True)
    return text
