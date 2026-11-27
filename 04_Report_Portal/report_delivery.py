"""Serve a small web edition of the standalone report, retaining its original pictures."""
import base64
import binascii
import gzip
import hashlib
import os
import re
from threading import Lock

# Only replace quoted image literals. Embedded typefaces, CSS and inline SVG stay intact.
_IMAGE = re.compile(rb'"data:image/(webp|jpeg|png);base64,([A-Za-z0-9+/]+=*)"')


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

    def load(self, path):
        with self.lock, open(path, "rb") as source:
            stat = os.fstat(source.fileno())
            version = (stat.st_dev, stat.st_ino, stat.st_mtime_ns, stat.st_size)
            if version != self.version:
                self.report = WebReport(source.read())
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
