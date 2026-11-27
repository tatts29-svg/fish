"""Public app identity for the MMG portal and its scoped report shortcuts."""
from functools import lru_cache
from io import BytesIO
from pathlib import Path
import re
from threading import Lock

from PIL import Image, ImageDraw

APP_NAME = "MyGear HQ MMG"
ICON_REVISION = "hq-mmg-1"
ICON_LINKS = f"""<link rel="icon" type="image/png" sizes="32x32" href="/mobile/mygear-mmg-32.png?v={ICON_REVISION}">
<link rel="apple-touch-icon" sizes="180x180" href="/mobile/mygear-mmg-180.png?v={ICON_REVISION}">
<meta name="apple-mobile-web-app-title" content="{APP_NAME}">"""
# Safari selects a startup image by the physical display and orientation.
# Only public branding is drawn, on the same dark background as the manifest.
_IOS_DISPLAYS = (
    (375, 667, 2), (375, 812, 3), (390, 844, 3), (393, 852, 3),
    (402, 874, 3), (414, 896, 2), (414, 896, 3), (428, 926, 3),
    (430, 932, 3), (440, 956, 3), (768, 1024, 2), (810, 1080, 2),
    (820, 1180, 2), (834, 1194, 2), (1024, 1366, 2),
)
STARTUP_SIZES = {}
_STARTUP_LINKS = []
for width, height, scale in _IOS_DISPLAYS:
    for orientation in ("portrait", "landscape"):
        size = (width * scale, height * scale)
        if orientation == "landscape":
            size = size[::-1]
        filename = f"startup-{size[0]}x{size[1]}.png"
        STARTUP_SIZES[filename] = size
        _STARTUP_LINKS.append(
            f'<link rel="apple-touch-startup-image" href="/mobile/{filename}?v={ICON_REVISION}" '
            f'media="(device-width: {width}px) and (device-height: {height}px) '
            f'and (-webkit-device-pixel-ratio: {scale}) and (orientation: {orientation})">'
        )

MOBILE_HEAD = f"""<link rel="manifest" href="/manifest.webmanifest?v={ICON_REVISION}">
{ICON_LINKS}
<meta name="theme-color" content="#101419">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">""" + "\n" + "\n".join(_STARTUP_LINKS)

MOBILE_FILES = {"/manifest.webmanifest": ("manifest.webmanifest", "application/manifest+json"),
                "/favicon.ico": ("mygear-mmg.ico", "image/x-icon")}
for size in (32, 180, 192, 512):
    filename = f"mygear-mmg-{size}.png"
    MOBILE_FILES[f"/mobile/{filename}"] = (filename, "image/png")
    MOBILE_FILES[f"/mobile/icon-{size}.png"] = (filename, "image/png")
MOBILE_FILES["/mobile/mygear-mmg-maskable-512.png"] = ("mygear-mmg-maskable-512.png", "image/png")
MOBILE_FILES.update({f"/mobile/{name}": (name, "image/png") for name in STARTUP_SIZES})
# iOS also probes these filenames when installing an older saved page.
for path in ("/apple-touch-icon.png", "/apple-touch-icon-precomposed.png"):
    MOBILE_FILES[path] = ("mygear-mmg-180.png", "image/png")

# Bound peak memory when several new device sizes request their first launch.
_startup_lock = Lock()


@lru_cache(maxsize=len(STARTUP_SIZES))
def _startup_png(directory, size):
    with Image.open(Path(directory) / "mygear-mmg-512.png") as image:
        side = min(320, min(size) // 3)
        icon = image.convert("RGB").resize((side, side), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", size, "#101419")
    mask = Image.new("L", icon.size)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, side - 1, side - 1), radius=side // 5, fill=255)
    canvas.paste(icon, ((size[0] - side) // 2, (size[1] - side) // 2), mask)
    encoded = BytesIO()
    canvas.save(encoded, format="PNG")
    return encoded.getvalue()


def public_asset(directory, filename):
    if filename in STARTUP_SIZES:
        with _startup_lock:
            return _startup_png(directory, STARTUP_SIZES[filename])
    return (Path(directory) / filename).read_bytes()


# Previously generated MMG reports inserted an older iOS title/icon with JS.
# Suppress that one legacy insertion after supplying the tags in <head>, so
# authentication and the on-disk standalone report remain unaffected.
_LEGACY_INSERT = re.compile(
    rb"""(?m)^[ \t]*document\.head\.insertAdjacentHTML\('beforeend','<link rel="manifest" href="/manifest\.webmanifest">[^'\r\n]*'\);[ \t]*$"""
)


def web_report_html(source):
    """Attach the installed-app identity to the web edition at its first paint."""
    source = _LEGACY_INSERT.sub(b"", source, count=1)
    source = source.replace(b"Add MMG Tool Store to your home screen", b"Add MyGear HQ and MMG to your home screen", 1)
    head_end = source.find(b"</head>")
    title = b'<meta name="apple-mobile-web-app-title" content="MyGear HQ'
    if head_end >= 0 and source.find(title, 0, head_end) < 0:
        source = source.replace(b"</head>", MOBILE_HEAD.encode("utf-8") + b"\n</head>", 1)
    return source
