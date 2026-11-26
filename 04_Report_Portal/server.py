#!/usr/bin/env python3
"""A login-protected home for one client report page.
Author: Andrew Fisher | POWERED BY SITEIQ.

Serves the report a Manager uploads, to people who sign in. Nothing is
served without a login, and the report itself is never in git: it lives in
DATA_DIR (a volume on the host).

    GET  /             the report (client or manager login)
    GET  /login        the sign-in page; POST /login signs in; GET /logout signs out
    GET  /report.pdf, /onhire.pdf, /onhire.xlsx   the print copy and the on-hire report, when loaded
    PUT  /upload/<one of those names>   manager login only
    GET  /health       "ok", no login (for the host's health check)

A browser signs in on the sign-in page and gets a 12 hour session cookie.
Scripts (the upload) send the login with each request instead (HTTP Basic).

Settings (environment): CLIENT_USERNAME, CLIENT_PASSWORD, MANAGER_USERNAME,
MANAGER_PASSWORD, PORTAL_NAME (shown on the sign-in page, default "Tool Store
Report"), DATA_DIR (default /data), PORT (default 8080).
Standard library only.
"""
import base64
import hashlib
import hmac
import html
import os
import tempfile
import threading
import time
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DATA_DIR = os.environ.get("DATA_DIR", "/data")
MAX_UPLOAD = 25 * 1024 * 1024
FILES = {"report.html": "text/html; charset=utf-8", "report.pdf": "application/pdf", "onhire.pdf": "application/pdf",
         "onhire.xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
MAGIC = {".html": b"<!doctype html", ".pdf": b"%PDF", ".xlsx": b"PK"}
FAIL_LIMIT, FAIL_WINDOW = 10, 600
_fails, _lock = {}, threading.Lock()

EMPTY = """<!doctype html><html lang="en-AU"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tool store report</title><body style="margin:0;background:#0B0E12;color:#DCE3EC;font-family:Inter,Segoe UI,system-ui,sans-serif">
<div style="max-width:560px;margin:18vh auto;padding:0 24px;text-align:center">
<div style="letter-spacing:.18em;font-weight:700;color:#F26222">COATES</div>
<h1 style="font-size:26px;margin:18px 0 8px">The report is being prepared</h1>
<p style="color:#8B96A6">It will show here as soon as the first SiteIQ pull is loaded.</p>
<p style="color:#5C6676;font-size:12px;margin-top:40px">Author: Andrew Fisher | POWERED BY SITEIQ</p></div></body></html>"""


SESSION_HOURS = 12
LOGIN = """<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Sign in · __NAME__</title><style>
*{box-sizing:border-box}html,body{margin:0;min-height:100%}
body{background:#07090D;color:#fff;font-family:Inter,Roboto,"Segoe UI",system-ui,sans-serif;-webkit-font-smoothing:antialiased;
 background-image:radial-gradient(90% 46% at 50% -6%,rgba(242,98,34,.20),rgba(242,98,34,0) 70%);background-repeat:no-repeat}
.wrap{max-width:460px;margin:0 auto;padding:36px 18px 48px}
.top{display:flex;align-items:center;gap:16px;margin:6px 2px 40px}
.brand{color:#F26222;font-weight:900;font-size:32px;letter-spacing:-.02em;line-height:1}
.top i{width:1px;height:28px;background:#3A424F}.top span{font-weight:700;font-size:17px}
.card{position:relative;background:linear-gradient(180deg,#171C25,#10141B);border:1px solid #2B323D;border-radius:26px;padding:34px 28px 30px;
 box-shadow:0 30px 80px rgba(0,0,0,.55),0 0 60px rgba(242,98,34,.07);overflow:hidden;animation:in .6s cubic-bezier(.2,.8,.2,1) both}
.card:before{content:"";position:absolute;left:0;right:0;top:0;height:4px;background:#F26222;box-shadow:0 0 22px 2px rgba(242,98,34,.65)}
@keyframes in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.eyebrow{display:flex;align-items:center;gap:12px;color:#F26222;font-weight:700;font-size:13px;letter-spacing:.2em}
.eyebrow svg{width:18px;height:18px;flex:none}
h1{font-size:28px;line-height:1.15;letter-spacing:-.02em;margin:22px 0 14px}
p{color:#A3ADBB;font-size:17px;line-height:1.6;margin:0}
label{display:block;font-weight:700;font-size:15px;margin:30px 0 12px}
input{width:100%;height:58px;border-radius:14px;border:1px solid #47505E;background:#0A0D13;color:#fff;font:inherit;font-size:17px;padding:0 16px;outline:none;
 transition:border-color .2s,box-shadow .2s}
input:focus{border-color:#F26222;box-shadow:0 0 0 3px rgba(242,98,34,.25),0 0 26px rgba(242,98,34,.18)}
button{width:100%;height:60px;margin-top:26px;border:0;border-radius:14px;background:#F0773A;color:#11151B;font:inherit;font-weight:700;font-size:18px;cursor:pointer;
 box-shadow:0 12px 34px rgba(242,98,34,.28);transition:transform .15s,box-shadow .2s,background .2s}
button:hover{background:#F58448;box-shadow:0 14px 44px rgba(242,98,34,.45)}button:active{transform:scale(.985)}
.err{margin-top:22px;border:1px solid rgba(242,98,34,.5);background:rgba(242,98,34,.10);color:#FFC9AE;border-radius:12px;padding:12px 14px;font-size:15px}
.note{border-top:1px solid #2B323D;margin-top:30px;padding-top:26px;font-size:15.5px}
.foot{text-align:center;color:#8B95A3;font-size:14px;margin-top:34px;line-height:2}
.foot b{display:block;font-size:12px;letter-spacing:.2em;font-weight:700}
@media (prefers-reduced-motion:reduce){.card{animation:none}}
</style></head><body><div class="wrap">
<div class="top"><div class="brand">COATES</div><i></i><span>__NAME__</span></div>
<form class="card" method="post" action="/login" autocomplete="on">
<div class="eyebrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><path d="M12 15v2"/></svg>PROJECT ACCESS</div>
<h1>Sign in to the __NAME__</h1>
<p>Enter your username and password to continue.</p>
__ERR__
<label for="u">Username</label><input id="u" name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required autofocus>
<label for="p">Password</label><input id="p" name="password" type="password" autocomplete="current-password" required>
<button type="submit">Sign in</button>
<p class="note">Trouble signing in? Ask your Coates tool store team.</p>
</form>
<div class="foot">Author: Andrew Fisher<b>POWERED BY SITEIQ</b></div>
</div></body></html>"""


def _users():
    out = {}
    for role in ("CLIENT", "MANAGER"):
        u, p = os.environ.get(role + "_USERNAME", "").strip().lower(), os.environ.get(role + "_PASSWORD", "")
        if u and p:
            out[u] = (p, role.lower())
    return out


def _check(user, pw):
    """The role for a username and password, or None."""
    role = None
    for name, (secret, r) in _users().items():
        ok_user = hmac.compare_digest(user.strip().lower().encode(), name.encode())
        ok_pw = hmac.compare_digest(pw.encode(), secret.encode())
        if ok_user and ok_pw:
            role = r
    return role


def _key():
    # made from the logins themselves: changing a password signs everyone out
    return hashlib.sha256(repr(sorted(_users().items())).encode() + b"|report-portal-session").digest()


def _session(user, now=None):
    exp = str(int((now or time.time()) + SESSION_HOURS * 3600))
    name = base64.urlsafe_b64encode(user.strip().lower().encode()).decode()
    sig = hmac.new(_key(), (name + "." + exp).encode(), hashlib.sha256).hexdigest()
    return "{}.{}.{}".format(name, exp, sig)


def _session_role(cookie_header, now=None):
    """The role a session cookie stands for, or None."""
    for part in (cookie_header or "").split(";"):
        k, _, v = part.strip().partition("=")
        if k != "s" or v.count(".") != 2:
            continue
        name, exp, sig = v.split(".")
        want = hmac.new(_key(), (name + "." + exp).encode(), hashlib.sha256).hexdigest()
        try:
            if hmac.compare_digest(sig, want) and int(exp) > (now or time.time()):
                hit = _users().get(base64.urlsafe_b64decode(name.encode()).decode())
                return hit[1] if hit else None
        except Exception:
            return None
    return None


def _login_page(err=""):
    name = html.escape(os.environ.get("PORTAL_NAME", "").strip() or "Tool Store Report")
    box = '<div class="err" role="alert">{}</div>'.format(html.escape(err)) if err else ""
    return LOGIN.replace("__NAME__", name).replace("__ERR__", box).encode("utf-8")


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

    def _role(self, page=False):
        """'client', 'manager' or None; sends the 401/429 (or, for a browser page, the way to sign in) itself when None."""
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
            role = _check(user, pw)
            if role is None:
                _failed(ip)
        elif page:
            role = _session_role(self.headers.get("Cookie"))
            if role is None:
                self._redirect("/login")
                return None
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

    def _redirect(self, where, cookie=None):
        self.send_response(303)
        self.send_header("Location", where)
        if cookie is not None:
            self.send_header("Set-Cookie", "s={}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age={}".format(cookie, SESSION_HOURS * 3600 if cookie else 0))
        self._common()
        self.send_header("Content-Length", "0")
        self.end_headers()

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
        if path == "/login":
            if _session_role(self.headers.get("Cookie")):
                return self._redirect("/")
            return self._send(200, _login_page(), "text/html; charset=utf-8")
        if path == "/logout":
            return self._redirect("/login", cookie="")
        name = "report.html" if path == "/" else path[1:]
        if name not in FILES or path == "/report.html":
            return self._send(404, b"Not found", "text/plain")
        if not self._role(page=True):
            return
        try:
            with open(os.path.join(DATA_DIR, name), "rb") as f:
                body = f.read()
        except OSError:
            if name != "report.html":
                return self._send(404, b"That file is not loaded yet.", "text/plain")
            body = EMPTY.encode("utf-8")
        self._send(200, body, FILES[name])

    do_HEAD = do_GET

    def do_POST(self):
        if self.path.split("?", 1)[0] != "/login":
            return self._send(404, b"Not found", "text/plain")
        ip = self._ip()
        if _blocked(ip):
            return self._send(429, _login_page("Too many attempts. Try again in ten minutes."), "text/html; charset=utf-8")
        try:
            size = int(self.headers.get("Content-Length", ""))
        except ValueError:
            size = -1
        if not 0 <= size <= 4096:
            return self._send(400, b"Bad request", "text/plain")
        form = urllib.parse.parse_qs(self.rfile.read(size).decode("utf-8", "replace"))
        user, pw = form.get("username", [""])[0], form.get("password", [""])[0]
        if _check(user, pw) is None:
            _failed(ip)
            return self._send(401, _login_page("That username or password is not right. Have another go."), "text/html; charset=utf-8")
        self._redirect("/", cookie=_session(user))

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
        want = MAGIC[os.path.splitext(name)[1]]
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
