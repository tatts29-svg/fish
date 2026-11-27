"""MMG report QR invitations, independent scoped sessions and HTTP endpoints."""
import base64
from collections import deque
from http.cookies import SimpleCookie, CookieError
import hashlib
import hmac
import io
import json
import os
from pathlib import Path
import re
import secrets
import sqlite3
import tempfile
import threading
import time
from urllib.parse import parse_qs, urlsplit

from mobile_brand import ICON_LINKS
from qr_brand import LOCKUP_CSS, lockup, public_mmg_logo
import qr_roster
import qr_work_notes

SCOPES = ("company", "personal")
ORIGIN = "https://mmg-report-production.up.railway.app"
SESSION_SECONDS = 12 * 3600
KEY_FILE = "mmg-qr-access.key"
HERE = Path(__file__).resolve().parent
BRANDING = {
    "mmg-logo.png": ("logo.png", "image/png"),
    "Inter-Regular.ttf": ("kit/_fonts/Inter-Regular.ttf", "font/ttf"),
    "Inter-Bold.ttf": ("kit/_fonts/Inter-Bold.ttf", "font/ttf"),
}
CSP = ("default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; "
       "font-src 'self' data:; connect-src 'self'; media-src 'self' blob:; frame-ancestors 'none'; "
       "form-action 'self'; base-uri 'none'; object-src 'none'")
# The QR invitation renders before a scoped session exists. Inline the small first
# paint so opening a poster never waits for the full report stylesheet or its fonts.
_ENTRY_STYLE = """
*{box-sizing:border-box}html{color-scheme:dark;background:#07090c;color:#f5f6f8;
font:100%/1.5 system-ui,sans-serif}body{margin:0}header{border-top:3px solid #f26222;
border-bottom:1px solid #28303a;background:linear-gradient(180deg,#12161c,#0b0e12)}
.bar{max-width:1600px;margin:auto;padding:11px clamp(16px,3vw,28px);display:flex;align-items:center;
justify-content:flex-start;gap:12px}.site{color:#c9cfd7;font-size:13px} @media(max-width:420px){.bar{flex-direction:column;align-items:flex-start;gap:6px}}
.entry{width:min(480px,calc(100% - 32px));margin:clamp(40px,16vh,180px) auto;
padding:clamp(20px,5vw,32px);border:1px solid #343c48;border-top:3px solid #f26222;border-radius:18px;
background:linear-gradient(155deg,#1b212b,#11161e);box-shadow:0 18px 56px #0006}
h1{margin:0;font-size:clamp(1.5rem,4vw,2rem);line-height:1.14;letter-spacing:-.035em}
p{margin:.75rem 0 0;color:#c9cfd7}
.entry[aria-busy="true"]{position:relative;overflow:hidden}
@media screen and (prefers-reduced-motion:no-preference){
 .entry[aria-busy="true"]::after{content:"";position:absolute;inset:0 auto auto 0;width:40%;height:3px;
   background:linear-gradient(90deg,transparent,#ffcf97,transparent);animation:inviteScan 1.65s ease-in-out infinite}
 @keyframes inviteScan{from{transform:translateX(-100%)}to{transform:translateX(250%)}}
}
"""


def invitation(scope, job_dir):
    title = "Company on-hire report" if scope == "company" else "Personal on-hire report"
    return f"""<!doctype html><html lang="en-AU"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#07090c"><meta name="robots" content="noindex,nofollow">
<meta name="referrer" content="no-referrer"><title>{title} · MyGear HQ</title>
{ICON_LINKS}
<style>{_ENTRY_STYLE}{LOCKUP_CSS}</style></head><body><header><div class="bar">{lockup(public_mmg_logo(job_dir))}
<span class="site">Dugald River</span></div></header><main class="entry" aria-busy="true"><h1>{title}</h1>
<p id="status" role="status">Opening your report…</p>
<noscript>Enable JavaScript and scan the printed QR code again.</noscript></main>
<script src="enter.js"></script></body></html>""".encode("utf-8")


ENTER_JS = b"""(async()=>{
  const token=location.hash.slice(1);
  history.replaceState(null,'',location.pathname);
  try {
    if(!/^[A-Za-z0-9_-]{43}$/.test(token))throw Error();
    const res=await fetch('enter',{method:'POST',credentials:'same-origin',cache:'no-store',
      headers:{'Content-Type':'application/json','X-Portal':'1'},body:JSON.stringify({token})});
    if(!res.ok)throw Error();
    location.replace('./');
  }catch(e){
    document.getElementById('status').textContent='Scan the QR code on the MMG report poster to open this report.';
    document.querySelector('.entry').setAttribute('aria-busy','false');
  }
})();"""


def _key(data_dir, create=False):
    path = Path(data_dir) / KEY_FILE
    if create and not path.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
        # Publish a completely written, mode-0600 key without replacing one another process created.
        with tempfile.NamedTemporaryFile(dir=path.parent) as tmp:
            tmp.write(secrets.token_bytes(32))
            tmp.flush()
            os.fsync(tmp.fileno())
            try:
                os.link(tmp.name, path)
            except FileExistsError:
                pass
    key = path.read_bytes()
    if len(key) != 32:
        raise OSError("Invalid QR signing key")
    return key


def _mac(key, *fields):
    encoded = hmac.digest(key, "\0".join(fields).encode("ascii"), "sha256")
    return base64.urlsafe_b64encode(encoded).rstrip(b"=").decode("ascii")


def entry_url(data_dir, scope):
    if scope not in SCOPES:
        raise ValueError("Unknown QR report scope")
    token = _mac(_key(data_dir, create=True), "mmg-invitation-v1", scope)
    return f"{ORIGIN}/qr/{scope}/enter#{token}"


def _exchange(data_dir, scope, token):
    if not isinstance(token, str) or not re.fullmatch(r"[A-Za-z0-9_-]{43}", token):
        return None
    try:
        key = _key(data_dir)
    except FileNotFoundError:
        return None
    if not hmac.compare_digest(token, _mac(key, "mmg-invitation-v1", scope)):
        return None
    expiry = str(int(time.time()) + SESSION_SECONDS)
    session = secrets.token_urlsafe(18)
    signed = _mac(key, "mmg-session-v1", scope, expiry, session)
    return (f"qr_{scope}={expiry}.{session}.{signed}; Path=/qr/{scope}/; Max-Age={SESSION_SECONDS}; "
            "HttpOnly; Secure; SameSite=Lax")


def _session(data_dir, scope, header):
    try:
        cookies = SimpleCookie()
        cookies.load(header or "")
        value = cookies["qr_" + scope].value
        match = re.fullmatch(r"(\d{1,12})\.([A-Za-z0-9_-]{24})\.([A-Za-z0-9_-]{43})", value)
        if match and int(match[1]) > time.time():
            want = _mac(_key(data_dir), "mmg-session-v1", scope, match[1], match[2])
            if hmac.compare_digest(want, match[3]):
                return match[2]
    except (CookieError, KeyError, FileNotFoundError):
        pass
    return None


class LookupBudget:
    """Personal lookups per minute, including misses; no badge numbers or result data."""
    def __init__(self):
        self._lock = threading.Lock()
        self._events = deque()

    def allow(self, session, address):
        now = time.monotonic()
        prefix = hashlib.sha256(address.encode()).digest()[:16]
        with self._lock:
            while self._events and self._events[0][0] <= now - 60:
                self._events.popleft()
            # The network and service limits also bound attempts across fresh QR sessions.
            if (len(self._events) >= 600 or sum(x[1] == session for x in self._events) >= 12
                    or sum(x[2] == prefix for x in self._events) >= 90):
                return False
            self._events.append((now, session, prefix))
            return True


lookup_budget = LookupBudget()
note_budget = LookupBudget()


def _png(url):
    import qrcode
    buffer = io.BytesIO()
    qrcode.make(url).save(buffer, format="PNG")
    return buffer.getvalue()


def serve(request, data_dir, job_dir):
    """Dispatch only explicit staff-poster and QR routes; never promote a QR session."""
    path = urlsplit(request.path)
    read = request.command in ("GET", "HEAD")

    def reply(code, body, content_type="application/json", headers=()):
        if content_type == "application/json":
            body = json.dumps(body, ensure_ascii=False, allow_nan=False).encode()
        return request._send(code, body, content_type, headers=headers)

    def error(code, message):
        return reply(code, {"error": message})

    def posted(field):
        if request.headers.get("X-Portal") != "1":
            error(403, "Use the report on this device.")
            return None
        if request.headers.get_content_type() != "application/json":
            error(415, "Send JSON.")
            return None
        body = request._body(2048)
        if body is None:
            return None
        try:
            payload = json.loads(body)
        except (ValueError, UnicodeError):
            payload = None
        if (not isinstance(payload, dict) or set(payload) != {field} or not isinstance(payload[field], str)
                or not 1 <= len(payload[field]) <= 256 or not payload[field].isprintable()):
            error(400, "Enter the barcode exactly as printed." if field == "barcode" else "Scan the report QR code.")
            return None
        return payload[field]

    try:
        if path.path.startswith("/upload/report-qr/"):
            asset = re.fullmatch(r"/upload/report-qr/(company|personal)\.(pdf|png)", path.path)
            if not read or not asset or path.query:
                return error(404, "Not found.")
            role = request._role(page=True)
            if not role:
                return
            if role not in ("manager", "store"):
                return error(403, "A staff login is required.")
            scope, ext = asset.groups()
            target = entry_url(data_dir, scope)
            if ext == "pdf":
                from qr_posters import build_poster
                content = build_poster(scope, target)
            else:
                content = _png(target)
            return reply(200, content, "application/pdf" if ext == "pdf" else "image/png",
                         [("Content-Disposition", f'attachment; filename="MMG-{scope}-report-QR.{ext}"')])

        route = re.fullmatch(r"/qr/(company|personal)/([^/]*)", path.path)
        if not route:
            return error(404, "Not found.")
        scope, action = route.groups()
        report_assets = ("qr_report.css", "qr_report.js", "qr_motion.js")
        allowed = {"", "enter", "enter.js", "report", "report.pdf", *report_assets}
        allowed.update(BRANDING)
        if scope == "company":
            allowed.update(("companies", "work-note"))
        else:
            allowed.update(("badge_decoder.js", "badge_zxing.js"))
        if action not in allowed or (path.query and not (scope == "company" and action in ("report", "report.pdf"))):
            return error(404, "Not found.")
        if read and action in ("enter", "enter.js"):
            return reply(200, invitation(scope, job_dir) if action == "enter" else ENTER_JS,
                         "text/html; charset=utf-8" if action == "enter" else "text/javascript; charset=utf-8")
        if action == "enter" and request.command == "POST":
            token = posted("token")
            if token is None:
                return
            cookie = _exchange(data_dir, scope, token)
            if not cookie:
                return error(403, "Scan the correct QR code on the MMG report poster.")
            return reply(200, {"ok": True}, headers=[("Set-Cookie", cookie)])

        session = _session(data_dir, scope, request.headers.get("Cookie"))
        if not session:
            return error(403, "Scan the QR code on the MMG report poster to open this view.")
        if read and not action:
            from qr_views import page
            ready = scope != "personal" or qr_roster.status(data_dir).get("linked", 0) > 0
            shell = page(scope, job_dir=job_dir, barcode_ready=ready)
            return reply(200, shell.encode(), "text/html; charset=utf-8")
        if read and action in (*report_assets, "badge_decoder.js", "badge_zxing.js"):
            return reply(200, (HERE / action).read_bytes(),
                         "text/css; charset=utf-8" if action.endswith(".css") else "text/javascript; charset=utf-8")
        if read and action in BRANDING:
            filename, mime = BRANDING[action]
            try:
                content = (Path(job_dir) / filename).read_bytes()
            except FileNotFoundError:
                return error(404, "Not found.")
            return reply(200, content, mime)
        import qr_reports
        if scope == "company" and action == "work-note" and request.command == "POST":
            if request.headers.get("X-Portal") != "1":
                return error(403, "Use the company report on this device.")
            if request.headers.get_content_type() != "application/json":
                return error(415, "Send a JSON work milestone.")
            body = request._body(8192)
            if body is None:
                return
            try:
                payload = json.loads(body)
            except (UnicodeError, ValueError):
                return error(400, "Enter the work milestone in the form.")
            company_id, day, title, description = qr_work_notes.validate(payload)
            peer = request.headers.get("X-Forwarded-For", "").rsplit(",", 1)[-1].strip() or request.client_address[0]
            if not note_budget.allow(session, peer):
                return error(429, "Please wait a minute before sending another milestone.")
            selection = next((c for c in qr_reports.companies(data_dir)["companies"] if c["id"] == company_id), None)
            if selection is None:
                return error(404, "Company unavailable.")
            qr_work_notes.submit(data_dir, company_id, selection["name"], day, title, description)
            return reply(202, {"ok": True})
        if scope == "company" and read:
            if action == "companies" and not path.query:
                return reply(200, qr_reports.companies(data_dir))
            if action not in ("report", "report.pdf"):
                return error(404, "Not found.")
            try:
                params = parse_qs(path.query, strict_parsing=True, max_num_fields=1)
            except ValueError:
                params = {}
            company = params.get("company", [""])[0]
            if not re.fullmatch(r"[A-Za-z0-9_-]{1,128}", company):
                return error(400, "Choose a company from the list.")
            result = qr_reports.company(data_dir, company)
            if result is not None:
                result = {**result, "work_notes": qr_work_notes.entries(data_dir, company)}
        elif scope == "personal" and request.command == "POST" and action in ("report", "report.pdf"):
            barcode = posted("barcode")
            if barcode is None:
                return
            if not qr_roster.status(data_dir).get("linked", 0):
                return error(503, "Worker barcode access is being set up. Please ask the tool store.")
            # Railway appends the connecting peer to X-Forwarded-For.
            forwarded = request.headers.get("X-Forwarded-For", "")
            peer = forwarded.rsplit(",", 1)[-1].strip() or request.client_address[0]
            if not lookup_budget.allow(session, peer):
                return reply(429, {"error": "Too many lookups. Try again in a minute."}, headers=[("Retry-After", "60")])
            result = qr_reports.personal(data_dir, barcode)
        else:
            return error(404, "Not found.")
        if result is None:
            return error(404, "No matching report is available.")
        if action == "report.pdf":
            from qr_report_pdf import render_pdf
            return reply(200, render_pdf(result, job_dir=job_dir), "application/pdf",
                         [("Content-Disposition", f'attachment; filename="mmg-{scope}-on-hire-report.pdf"')])
        return reply(200, result)
    except qr_work_notes.NoteError as exc:
        return error(exc.status, str(exc))
    except (OSError, ValueError, KeyError, TypeError, sqlite3.Error):
        return error(503, "The report is temporarily unavailable.")
