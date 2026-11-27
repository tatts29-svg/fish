"""Serve a small web edition of the standalone report, retaining its original pictures."""
import base64
import binascii
import gzip
import hashlib
import os
import re
from datetime import datetime
from html import escape
from threading import Lock

import upload_receipt
from stocktake_store import QUEENSLAND, report_version
from mobile_brand import web_report_html
from qr_brand import PORTAL_MASTHEAD_CSS, portal_masthead, public_mmg_logo

# Only replace quoted image literals. Embedded typefaces, CSS and inline SVG stay intact.
_IMAGE = re.compile(rb'"data:image/(webp|jpeg|png);base64,([A-Za-z0-9+/]+=*)"')


# The showcase template and the persisted MMG reports share this masthead.
_OLD_MASTHEAD = re.compile(
    rb'(<header class="top">\s*<div class="wrap bar">\s*)<div class="brand">COATES</div>'
    rb'(<span class="sep" id="lsep"></span><img class="toplogo" id="toplogo" alt="[^"]*">)'
)
_REPORT_BRAND_CSS = PORTAL_MASTHEAD_CSS + """
.bar .portal-upload{display:flex;align-items:baseline;justify-content:flex-end;gap:0 .45em;
flex-wrap:wrap;line-height:1.45;color:#d1dae5;font-size:inherit}
.portal-upload-time{white-space:nowrap;font-variant-numeric:tabular-nums}
@media(max-width:620px){.bar .portal-upload{justify-content:flex-start;font-size:12px}}
@media screen and (min-width:901px){
 html:not(.static) .bar:has(.portal-masthead){height:auto;min-height:3.6rem;padding-block:.35rem}
}
@media screen and (min-width:901px) and (max-width:1100px){
 .bar:has(.portal-masthead) .what{display:none}
 .bar:has(.portal-masthead) .gs{min-width:0;margin-inline:6px}
}
@media(max-width:620px){
 .bar:has(.portal-masthead){display:grid;grid-template-columns:minmax(0,1fr) auto auto;
 gap:.2rem .4rem;padding-block:.3rem}
 .bar:has(.portal-masthead) .asat{grid-column:1/-1;grid-row:2;margin:0;text-align:left}
 .bar:has(.portal-masthead) .gs{grid-column:1/-1;grid-row:3}
 .bar:has(.portal-masthead) #full-screen{grid-column:2;grid-row:1}
 .bar:has(.portal-masthead) #theme{grid-column:3;grid-row:1}
 .bar .portal-masthead{flex-direction:column;align-items:flex-start;gap:2px}
 .bar .portal-site{flex-direction:row;align-items:baseline;gap:.45rem;font-size:.66rem}
 .bar .portal-site b{font-size:.61rem}
}
@media(min-width:2400px){
 .bar .brand-lockup{gap:.65rem}.bar .brand-lockup .logo{font-size:1rem;gap:.45rem}
 .bar .brand-lockup .wm i{font-size:.75rem}.bar .brand-lockup .mk svg{width:1.7rem;height:1.7rem}
 .bar .brand-client img{height:1.8rem}.bar .brand-divider{height:1.4rem}
}
"""


def _upload_readout(receipt):
    if receipt is None:
        return '<span class="portal-upload">Last successful upload: details unavailable</span>'
    name = receipt.get("name")
    when = datetime.fromtimestamp(receipt["finished"], QUEENSLAND)
    display = f'{when.day} {when:%b %Y, %H:%M} AEST'
    operator = (f'Last updated by <b class="portal-upload-by">{escape(name)}</b>'
                if name else 'Last successful upload · <b class="portal-upload-by">Uploader not recorded</b>')
    return (f'<span class="portal-upload"><span>{operator}</span>'
            f'<time class="portal-upload-time" datetime="{when.isoformat(timespec="seconds")}">{display}</time></span>')


def _report_masthead(html, logo, receipt):
    match = _OLD_MASTHEAD.search(html)
    if not match:
        return html
    if logo is None:
        # The standalone report can outlive its job pack on a restored volume.
        packed = re.search(rb', LOGO="(data:image/png;base64,[A-Za-z0-9+/=]+)", CLIENT=', html)
        if packed:
            logo = packed[1].decode("ascii")
    # The original client-logo setup still uses these two IDs to populate
    # the overview and print copy. Preserve its DOM contract in a hidden span.
    header = match[1] + portal_masthead(logo).encode() + b'<span hidden>' + match[2] + b'</span>'
    html = html[:match.start()] + header + html[match.end():]
    clock = b'<b id="asat"></b><br><span class="au">'
    html = html.replace(clock, b'<b id="asat"></b> AEST' + _upload_readout(receipt).encode()
                        + b'<span class="au">', 1)
    return html.replace(b"</head>", b"<style>" + _REPORT_BRAND_CSS.encode() + b"</style></head>", 1)


class WebReport:
    def __init__(self, html):
        self.images = {}

        def image_url(match):
            try:
                data = base64.b64decode(match[2], validate=True)
            except binascii.Error:
                return match[0]
            key = hashlib.sha256(data).hexdigest() + "." + match[1].decode("ascii")
            self.images[key] = ("image/" + match[1].decode("ascii"), data)
            return b'"/report-media/' + key.encode("ascii") + b'"'

        self.html = _IMAGE.sub(image_url, html)
        self.gzip = gzip.compress(self.html, compresslevel=4, mtime=0)


class ReportCache:
    """One version per portal process. Opening the file pins an atomic build snapshot."""
    def __init__(self):
        self.lock = Lock()
        self.version = None
        self.report = None

    def load(self, path, *, mmg_job=None):
        with self.lock:
            while True:
                with open(path, "rb") as source:
                    stat = os.fstat(source.fileno())
                    logo = public_mmg_logo(mmg_job) if mmg_job is not None else None
                    version = (stat.st_dev, stat.st_ino, stat.st_mtime_ns, stat.st_size, mmg_job, logo)
                    receipt = None
                    if mmg_job is not None:
                        head = source.read(upload_receipt.HEADER_BYTES)
                        receipt = upload_receipt.resolve(head, os.path.dirname(path))
                        # On an old report the receipt lives separately. If a new
                        # report won the race, reopen it with its own attribution.
                        if not os.path.samestat(stat, os.stat(path)):
                            continue
                        version += (receipt and receipt["name"], receipt and receipt["finished"])
                    if version != self.version:
                        source.seek(0)
                        html = source.read()
                        if mmg_job is not None:
                            # Management-only fields stay inside the private version on disk.
                            html = upload_receipt.STAMP.sub(b"", html, count=1)
                            html = _report_masthead(web_report_html(html), logo, receipt)
                            meta = f'<meta name="mmg-report-version" content="{report_version(stat)}">'.encode()
                            html = html.replace(b"</head>", meta + b"</head>", 1)
                        self.report = WebReport(html)
                        self.version = version
                    return self.report


def accepts_gzip(header):
    weights = {}
    for entry in header.lower().split(","):
        coding, _, parameter = entry.strip().partition(";")
        try:
            weights[coding] = float(parameter.strip().removeprefix("q=").strip()) if parameter else 1
        except ValueError:
            continue
    return weights.get("gzip", weights.get("*", 0)) > 0
