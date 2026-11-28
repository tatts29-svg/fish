"""The MyGear HQ and MMG marks shown on the Dugald River report entrances."""
import base64
from functools import lru_cache
from html import escape
from pathlib import Path


def wordmark():
    # Same mark and lettering as app/hq.py's shared header in MyGear HQ.
    return (
        '<span class="mk"><svg viewBox="0 0 32 32" width="32" height="32" '
        'aria-hidden="true" shape-rendering="geometricPrecision">'
        '<defs><linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">'
        '<stop offset="0" stop-color="#FF7A3D"/><stop offset="1" stop-color="#E2531A"/>'
        '</linearGradient></defs><rect width="32" height="32" rx="7" fill="url(#mg)"/>'
        '<path d="M8 23V9h4l4 7 4-7h4v14h-4v-7l-4 6-4-6v7z" fill="#fff"/></svg></span>'
        '<span class="wm">My<span>Gear</span> <i>HQ</i></span>'
    )

# Kept inline on the two unauthenticated entry screens. They can show both marks
# without downloading the authenticated report styles, fonts or media.
LOCKUP_CSS = """
.brand-lockup{display:inline-flex;align-items:center;gap:12px;vertical-align:middle}
.brand-lockup .logo{display:inline-flex;align-items:center;gap:10px;white-space:nowrap;
color:#f5f6f8;font:700 19px/1.1 system-ui,sans-serif;letter-spacing:normal;text-transform:none}
.brand-lockup .mk svg{width:32px;height:32px;display:block;border-radius:8px;
box-shadow:0 0 0 1px rgba(255,255,255,.1),0 0 9px rgba(242,98,34,.19)}
.brand-lockup .wm span{color:#ff7a3d}.brand-lockup .wm i{font-size:14px;
font-style:normal;font-weight:600;color:#aab4c0}.brand-divider{height:28px;width:1px;
background:#414951}.brand-client{display:inline-flex;align-items:center;color:#f5f6f8;
font:700 17px/1 system-ui,sans-serif}.brand-client img{display:block;width:auto;height:34px}
@media screen and (prefers-reduced-motion:no-preference){
  .brand-lockup .mk{position:relative;isolation:isolate;overflow:hidden;border-radius:7px}
  .brand-lockup .mk::after{content:"";position:absolute;inset:0;border-radius:7px;pointer-events:none;
    background:linear-gradient(110deg,transparent 25%,#ffeed62e 50%,transparent 75%);
    animation:hqMarkLight .6s ease-out both}
  @keyframes hqMarkLight{from{transform:translateX(-100%)}to{transform:translateX(100%)}}
}
"""


def lockup(mmg_src=None):
    client = (f'<img src="{escape(mmg_src, quote=True)}" alt="MMG">' if mmg_src else 'MMG')
    return (f'<span class="brand-lockup"><span class="logo">{wordmark()}</span>'
            f'<span class="brand-divider" aria-hidden="true"></span><span class="brand-client">{client}</span></span>')


@lru_cache(maxsize=4)
def _logo_data(path, revision):
    image = path.read_bytes()
    if image.startswith(b"\x89PNG\r\n\x1a\n"):
        return "data:image/png;base64," + base64.b64encode(image).decode("ascii")
    return None


def public_mmg_logo(job_dir):
    """Embed the job's fixed public-facing logo before a report session exists."""
    path = Path(job_dir) / "logo.png"
    try:
        stat = path.stat()
        return _logo_data(path, (stat.st_ino, stat.st_mtime_ns, stat.st_size))
    except OSError:
        return None


def portal_masthead(mmg_src=None):
    return ('<span class="portal-masthead">' + lockup(mmg_src)
            + '<span class="portal-site"><b>COATES</b><span>Dugald River</span></span></span>')


PORTAL_MASTHEAD_CSS = LOCKUP_CSS + """
.portal-masthead{display:inline-flex;align-items:center;gap:.9rem;flex:none}
.portal-site{display:flex;flex-direction:column;gap:.13rem;color:#d2dae3;
font:600 .79rem/1.2 system-ui,sans-serif;white-space:nowrap}
.portal-site b{color:#ff975e;letter-spacing:.1em;font-size:.68rem}
@media(max-width:620px){.portal-masthead{gap:.55rem}.portal-masthead .brand-lockup{gap:7px}
.portal-masthead .logo{gap:6px;font-size:16px}.portal-masthead .wm i{font-size:12px}
.portal-masthead .mk svg{width:26px;height:26px}.portal-masthead .brand-client img{height:27px}}
"""

# Used by the staff, install and poster entrances, including before a session exists.
ACCESS_SURFACE_CSS = """
:root{
 --access-face:radial-gradient(ellipse at 0 0,#39464e55,transparent 60%),linear-gradient(143deg,#222c33,#172026 58%,#131a1f);
 --access-field:linear-gradient(180deg,#10171c,#182127);
 --access-rim:#47545c;--access-orange:#f26222;--access-peach:#ffc8a6;
 --access-lift:inset 0 1px 0 #e8f4ff14,0 16px 36px -24px #000b;
}
.hq-surface{position:relative;isolation:isolate}
.hq-surface::before{
 content:"";position:absolute;pointer-events:none;top:-1px;left:clamp(16px,3%,38px);
 right:clamp(16px,3%,38px);height:2px;border-radius:100%;
 background:linear-gradient(90deg,#f2622255,#ffc8a6 15%,#f97840 34%,#8394a44d 70%,transparent);
}
.hq-surface:focus-within{border-color:#a5785e}
.hq-access-title{position:relative;padding-block-start:1rem}
.hq-access-title::before{content:"";position:absolute;inset:0 auto auto 0;width:2.4rem;height:3px;
 border-radius:3px;background:linear-gradient(90deg,#f26222 65%,#ffc8a6)}
@media screen and (forced-colors:none){
 .hq-surface::after{
   content:"";position:absolute;inset:-1px;pointer-events:none;border-radius:inherit;
   border:1px solid var(--access-glow,var(--access-orange));
   box-shadow:inset 0 0 7px color-mix(in srgb,var(--access-glow,var(--access-orange)) 21%,transparent),
              0 0 10px color-mix(in srgb,var(--access-glow,var(--access-orange)) 23%,transparent);
   opacity:var(--access-glow-strength,0);
 }
 .hq-surface:focus-within{--access-glow-strength:.36}
}
@media screen and (prefers-reduced-motion:no-preference){
 .hq-surface{animation:hqSurfaceIn .32s cubic-bezier(.21,.8,.24,1) both}
 .hq-surface::before{transform-origin:left;animation:hqRimIn .48s cubic-bezier(.21,.8,.24,1) both}
 .hq-surface::after{transition:opacity .18s ease-out;animation:var(--access-glow-signal,none) .56s ease-out}
 @keyframes hqSurfaceIn{from{transform:translateY(5px)}to{transform:translateY(0)}}
 @keyframes hqRimIn{from{transform:scaleX(.28);opacity:.24}to{transform:scaleX(1);opacity:1}}
 @keyframes hqRimSignal{0%{opacity:.12}32%{opacity:.90}100%{opacity:var(--access-glow-strength,.52)}}
}
@media (forced-colors:active){.hq-surface{border:1px solid CanvasText}.hq-surface::before,.hq-access-title::before{display:none}}
"""
