#!/usr/bin/env python3
"""A login-protected home for one client report page.
Author: Andrew Fisher | POWERED BY SITEIQ.

Serves the report a Manager uploads, to people who sign in. Nothing is
served without a login, and the report itself is never in git: it lives in
DATA_DIR (a volume on the host).

    GET  /             the report (client or manager login)
    GET  /report.pdf   the print copy, when one is loaded
    PUT  /upload/report.html | /upload/report.pdf   manager login only
    GET  /health       "ok", no login (for the host's health check)

Settings (environment): CLIENT_USERNAME, CLIENT_PASSWORD, MANAGER_USERNAME,
MANAGER_PASSWORD, DATA_DIR (default /data), PORT (default 8080).
Standard library only.
"""
import base64
import hmac
import os
import tempfile
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DATA_DIR = os.environ.get("DATA_DIR", "/data")
MAX_UPLOAD = 25 * 1024 * 1024
FILES = {"report.html": "text/html; charset=utf-8", "report.pdf": "application/pdf"}
FAIL_LIMIT, FAIL_WINDOW = 10, 600
_fails, _lock = {}, threading.Lock()

EMPTY = """<!doctype html><html lang="en-AU"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tool store report</title><body style="margin:0;background:#0B0E12;color:#DCE3EC;font-family:Inter,Segoe UI,system-ui,sans-serif">
<div style="max-width:560px;margin:18vh auto;padding:0 24px;text-align:center">
<div style="letter-spacing:.18em;font-weight:700;color:#F26222">COATES</div>
<h1 style="font-size:26px;margin:18px 0 8px">The report is being prepared</h1>
<p style="color:#8B96A6">It will show here as soon as the first SiteIQ pull is loaded.</p>
<p style="color:#5C6676;font-size:12px;margin-top:40px">Author: Andrew Fisher | POWERED BY SITEIQ</p></div></body></html>"""


def _users():
    out = {}
    for role in ("CLIENT", "MANAGER"):
        u, p = os.environ.get(role + "_USERNAME", "").strip().lower(), os.environ.get(role + "_PASSWORD", "")
        if u and p:
            out[u] = (p, role.lower())
    return out


def _blocked(ip):
    now = time.time()
    with _lock:
        hits = [t for t in _fails.get(ip, []) if now - t < FAIL_WINDOW]
        _fails[ip] = hits
        return len(hits) >= FAIL_LIMIT


def _failed(ip):
    with _lock:
        _fails.setdefault(ip, []).append(time.time())
        if len(_fails) > 4096:
            _fails.clear()


class Handler(BaseHTTPRequestHandler):
    server_version = "ReportPortal"
    sys_version = ""

    def log_message(self, fmt, *args):      # no names or addresses in the logs
        pass

    def _ip(self):
        return (self.headers.get("X-Forwarded-For") or self.client_address[0]).split(",")[0].strip()

    def _role(self):
        """'client', 'manager' or None; sends the 401/429 itself when None."""
        ip = self._ip()
        if _blocked(ip):
            self._send(429, b"Too many attempts. Try again in ten minutes.", "text/plain; charset=utf-8")
            return None
        head = self.headers.get("Authorization", "")
        role = None
        if head.startswith("Basic "):
            try:
                user, _, pw = base64.b64decode(head[6:]).decode("utf-8").partition(":")
            except Exception:
                user, pw = "", ""
            for name, (secret, r) in _users().items():
                ok_user = hmac.compare_digest(user.strip().lower().encode(), name.encode())
                ok_pw = hmac.compare_digest(pw.encode(), secret.encode())
                if ok_user and ok_pw:
                    role = r
            if role is None:
                _failed(ip)
        if role is None:
            self.send_response(401)
            self.send_header("WWW-Authenticate", 'Basic realm="Tool store report", charset="UTF-8"')
            self._common()
            self.send_header("Content-Length", "0")
            self.end_headers()
        return role

    def _common(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Robots-Tag", "noindex, nofollow")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Referrer-Policy", "same-origin")

    def _send(self, code, body, ctype):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self._common()
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path == "/health":
            return self._send(200, b"ok", "text/plain")
        if path not in ("/", "/report.pdf"):
            return self._send(404, b"Not found", "text/plain")
        if not self._role():
            return
        name = "report.html" if path == "/" else "report.pdf"
        try:
            with open(os.path.join(DATA_DIR, name), "rb") as f:
                body = f.read()
        except OSError:
            if name == "report.pdf":
                return self._send(404, b"No print copy is loaded yet.", "text/plain")
            body = EMPTY.encode("utf-8")
        self._send(200, body, FILES[name])

    do_HEAD = do_GET

    def do_PUT(self):
        path = self.path.split("?", 1)[0]
        name = path[len("/upload/"):] if path.startswith("/upload/") else ""
        if name not in FILES:
            return self._send(404, b"Not found", "text/plain")
        role = self._role()
        if not role:
            return
        if role != "manager":
            return self._send(403, b"Manager login needed to load a report.", "text/plain")
        try:
            size = int(self.headers.get("Content-Length", ""))
        except ValueError:
            return self._send(411, b"Content-Length needed.", "text/plain")
        if not 0 < size <= MAX_UPLOAD:
            return self._send(413, b"Too large.", "text/plain")
        body = self.rfile.read(size)
        want = b"%PDF" if name.endswith(".pdf") else b"<!doctype html"
        if len(body) != size or not body[:64].lower().lstrip().startswith(want.lower()):
            return self._send(400, b"That is not the expected kind of file.", "text/plain")
        os.makedirs(DATA_DIR, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=DATA_DIR, prefix=".up-")
        with os.fdopen(fd, "wb") as f:
            f.write(body)
        os.replace(tmp, os.path.join(DATA_DIR, name))
        self._send(200, ("Loaded {} ({:,} bytes).".format(name, size)).encode(), "text/plain")


def main():
    port = int(os.environ.get("PORT", "8080"))
    ThreadingHTTPServer(("0.0.0.0", port), Handler).serve_forever()


if __name__ == "__main__":
    main()
