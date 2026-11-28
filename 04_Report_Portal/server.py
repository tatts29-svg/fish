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
    GET  /upload       the upload page: drop in new SiteIQ exports and the report rebuilds itself
                       (any login)
    PUT  /upload/export?name=FILE.xlsx, POST /upload/build, GET /upload/status   what that page uses
    PUT  /upload/pack.zip   the job pack the rebuild needs, manager login only
    GET  /health       "ok", no login (for the host's health check)

A browser signs in on the sign-in page and gets a 12 hour session cookie.
Scripts (the upload) send the login with each request instead (HTTP Basic).

Settings (environment): CLIENT_USERNAME, CLIENT_PASSWORD, MANAGER_USERNAME,
MANAGER_PASSWORD, STORE_USERNAME, STORE_PASSWORD (optional: may upload exports), PORTAL_NAME (shown on the sign-in page, default "Tool Store
Report"), DATA_DIR (default /data), PORT (default 8080).
Standard library only.
"""
import base64
import gzip
import hashlib
import hmac
import html
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import threading
import time
import urllib.parse
import zipfile
import sqlite3
import stocktake_store
import sds_library
import swms_store
import qr_access
import qr_admin
import qr_brand
import upload_receipt
import qr_roster
import qr_work_notes
import worker_register
from report_delivery import ReportCache, accepts_gzip
from mobile_brand import MOBILE_HEAD, MOBILE_FILES, public_asset
from upload_policy import uploaders, check_workbook, is_mmg, is_mmg_pack
from rebuild import Stop, import_history, archive_stocktake, mmg_daily_kind, MMG_DAILY_KINDS, KINDS
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DATA_DIR = os.environ.get("DATA_DIR", "/data")
MAX_UPLOAD = 25 * 1024 * 1024
FILES = {"report.html": "text/html; charset=utf-8", "report.pdf": "application/pdf", "onhire.pdf": "application/pdf",
         "onhire.xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
MAGIC = {".html": b"<!doctype html", ".pdf": b"%PDF", ".xlsx": b"PK"}
MAX_PACK = 120 * 1024 * 1024
JOB_DIR = os.path.join(DATA_DIR, "job")
HERE = os.path.dirname(os.path.abspath(__file__))
_build_lock = threading.Lock()
_web_report = ReportCache()
FAIL_LIMIT, FAIL_WINDOW = 10, 600
_fails, _lock = {}, threading.Lock()

EMPTY = """<main class="card"><h1>The report is being prepared</h1>
<p>The first SiteIQ upload will appear here when the report is ready.</p>
<nav class="portal-links" aria-label="Portal"><a href="/upload">Open uploads</a><a href="/logout">Sign out</a></nav></main>"""


def _mobile_markup(page):
    enabled = is_mmg(JOB_DIR)
    install_link = '<a href="/install">Add to home screen</a>' if enabled else ""
    return page.replace("__MOBILE_HEAD__", MOBILE_HEAD if enabled else "").replace("__INSTALL_LINK__", install_link)


SESSION_HOURS = 12
LOGIN_TEMPLATE = """<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="robots" content="noindex,nofollow"><meta name="author" content="Andrew Fisher"><meta name="copyright" content="(c) 2026 Andrew Fisher. All rights reserved."><title>Sign in · __LOGIN_TITLE__</title>__MOBILE_HEAD__<style>
*{box-sizing:border-box}html,body{margin:0;min-height:100%}
body{background:#07090D;color:#fff;font-family:Inter,Roboto,"Segoe UI",system-ui,sans-serif;-webkit-font-smoothing:antialiased;
 background-image:radial-gradient(90% 46% at 50% -6%,rgba(242,98,34,.20),rgba(242,98,34,0) 70%);background-repeat:no-repeat}
html{font-size:clamp(16px, .83vw, 26px);color-scheme:dark}
.wrap{width:100%;min-height:100vh;min-height:100dvh;padding:clamp(16px,2.3vw,72px) clamp(16px,4vw,160px);display:flex;flex-direction:column;align-items:stretch}
.wrap>.card{width:min(100%,72rem);margin:auto;align-self:center}
form.card{display:grid;gap:1rem}
form.card .fields>label:first-child{margin-top:0}
.intro,.fields,.file-column,.submit-column{min-width:0}
@media(min-width:900px){
 form.card{grid-template-columns:minmax(0,1fr) minmax(0,1fr);align-items:start;gap:clamp(32px,5vw,140px)}
 form.card .intro{align-self:center}
}
.top{display:flex;align-items:center;gap:1rem;padding-bottom:1.2rem;margin-bottom:clamp(20px,3vh,76px);border-bottom:1px solid #2B323D;overflow-wrap:anywhere}
.brand{color:#F26222;font-weight:900;font-size:2rem;letter-spacing:-.02em;line-height:1}
.top i{width:1px;height:28px;background:#3A424F}.top span{font-weight:700;font-size:1.05rem}
.card{position:relative;background:linear-gradient(180deg,#171C25,#10141B);border:1px solid #2B323D;border-radius:clamp(16px,2vw,40px);padding:clamp(20px,3vw,80px);
 box-shadow:0 30px 80px rgba(0,0,0,.55),0 0 60px rgba(242,98,34,.07);overflow:hidden;animation:in .6s cubic-bezier(.2,.8,.2,1) both}
.card:before{content:"";position:absolute;left:0;right:0;top:0;height:4px;background:#F26222;box-shadow:0 0 22px 2px rgba(242,98,34,.65)}
@keyframes in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.eyebrow{display:flex;align-items:center;gap:12px;color:#F26222;font-weight:700;font-size:.8125rem;letter-spacing:.18em}
.eyebrow svg{width:18px;height:18px;flex:none}
h1{font-size:clamp(1.7rem,2.8vw,3rem);overflow-wrap:anywhere;line-height:1.15;letter-spacing:-.02em;margin:22px 0 14px}
p{color:#A3ADBB;font-size:1.0625rem;line-height:1.6;margin:0}
label{display:block;font-weight:700;font-size:.94rem;margin:1.6rem 0 .65rem}
input{width:100%;height:3.4rem;border-radius:14px;border:1px solid #47505E;background:#0A0D13;color:#fff;font:inherit;font-size:1.05rem;padding:0 1rem;outline:none;
 transition:border-color .2s,box-shadow .2s}
input:focus{border-color:#F26222;box-shadow:0 0 0 3px rgba(242,98,34,.25),0 0 26px rgba(242,98,34,.18)}
button{width:100%;height:3.4rem;margin-top:26px;border:0;border-radius:14px;background:#F0773A;color:#11151B;font:inherit;font-weight:700;font-size:1.1rem;cursor:pointer;
 box-shadow:0 12px 34px rgba(242,98,34,.28);transition:transform .15s,box-shadow .2s,background .2s}
button:hover{background:#F58448;box-shadow:0 14px 44px rgba(242,98,34,.45)}button:active{transform:scale(.985)}
.err{margin-top:22px;border:1px solid rgba(242,98,34,.5);background:rgba(242,98,34,.10);color:#FFC9AE;border-radius:12px;padding:12px 14px;font-size:15px}
.note>a{display:block;width:fit-content;color:#FFAA77;margin-top:.35rem;padding:.55rem 0;text-underline-offset:.2em}
.note{border-top:1px solid #2B323D;margin-top:30px;padding-top:26px;font-size:.94rem}
.foot{text-align:center;color:#8B95A3;font-size:.875rem;margin-top:clamp(20px,3vh,76px);line-height:1.65}
.foot small{font-size:.75rem!important}
.foot b{display:block;font-size:.75rem;letter-spacing:.2em;font-weight:700}
.portal-links{display:flex;align-items:center;gap:.45rem 1.4rem;flex-wrap:wrap;margin-top:1.25rem;padding-top:.75rem;border-top:1px solid #2B323D}
.portal-links a{display:inline-flex;align-items:center;min-height:44px;color:#FFAA77;font-size:.95rem;text-decoration:underline;text-underline-offset:.24em;text-decoration-color:#855135}
.portal-links a:hover{color:#FFD7C0;text-decoration-color:currentColor}
:where(a,button,select,[tabindex]):focus-visible{outline:3px solid #FFAA77;outline-offset:3px}
@media(max-width:540px){
 .wrap{padding:max(16px,env(safe-area-inset-top)) max(14px,env(safe-area-inset-right)) max(16px,env(safe-area-inset-bottom)) max(14px,env(safe-area-inset-left))}
 .top{padding-bottom:.8rem;margin-bottom:1rem;gap:.75rem}.eyebrow{font-size:.75rem}
 .card{padding:1.15rem}.intro h1{margin-top:.8rem}
 .foot{margin-top:1.3rem}.note{margin-top:1.1rem;padding-top:1rem}
}
@media(prefers-reduced-motion:reduce){
 .card,.bar:before{animation:none!important}
 button,input,.drop{transition:none!important}
 button:active{transform:none}
}
__LOGIN_STYLE__</style></head><body><div class="wrap">
__LOGIN_HEADER__
<form class="card" method="post" action="/login" autocomplete="on">
<div class="intro">
<div class="eyebrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/><path d="M12 15v2"/></svg>__LOGIN_GROUP__</div>
<h1>__LOGIN_HEADING__</h1>
<p>__LOGIN_INTRO__</p></div>
<div class="fields">__LOGIN_FIELDS_TITLE____ERR__
<label for="u">Username</label><input id="u" name="username" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required__LOGIN_AUTOFOCUS__>
<label for="p">Password</label><input id="p" name="password" type="password" autocomplete="current-password" required>
<button type="submit">Sign in</button>
<p class="note">Trouble signing in? Ask your Coates tool store team.__INSTALL_LINK__</p></div>
</form>
<div class="foot">Author: Andrew Fisher<b>POWERED BY SITEIQ</b><small style="display:block;font-size:11.5px;line-height:1.5;margin-top:8px;color:#6B7583">Designed and built by Andrew Fisher · © 2026 Andrew Fisher.<br>All rights reserved. Not to be copied or reproduced without permission.</small></div>
</div></body></html>"""


def _login_template(title, heading, header, style="", *, group="PROJECT ACCESS",
                    intro="Enter your username and password to continue.", fields_title="", autofocus=True):
    return (LOGIN_TEMPLATE.replace("__LOGIN_TITLE__", title).replace("__LOGIN_HEADING__", heading)
            .replace("__LOGIN_HEADER__", header).replace("__LOGIN_STYLE__", style)
            .replace("__LOGIN_GROUP__", group).replace("__LOGIN_INTRO__", intro)
            .replace("__LOGIN_FIELDS_TITLE__", fields_title).replace("__LOGIN_AUTOFOCUS__", " autofocus" if autofocus else ""))


LOGIN = _login_template("__NAME__", "Sign in to the __NAME__",
                        '<div class="top"><div class="brand">COATES</div><i></i><span>__NAME__</span></div>')


# Included only on the MMG entry, installation and upload surfaces.
MMG_SHELL_CSS = """
:root{--hq-bg:#101519;--hq-panel:#192126;--hq-rule:#39464b;--hq-ink:#f2f5f3;--hq-muted:#b6c2c4;
 --hq-orange:#f26222;--hq-active:#f97840;--hq-confirmed:#8bd8a7;--hq-coral:#f18d80;--hq-pad:clamp(1rem,4vw,5rem)}
body{background:var(--hq-bg);color:var(--hq-ink)}
.wrap{padding:0;gap:0;align-items:center}
.portal-heading{width:100%;border-top:4px solid var(--hq-orange);border-bottom:1px solid var(--hq-rule);background:#11171b}
.portal-heading>.portal-masthead{display:flex;justify-content:space-between;align-items:center;width:100%;min-height:4.4rem;
 padding:.55rem max(var(--hq-pad),env(safe-area-inset-right)) .55rem max(var(--hq-pad),env(safe-area-inset-left))}
.portal-heading .logo{font-size:1.3rem}.portal-heading .mk svg{width:1.9rem;height:1.9rem}
.portal-heading .brand-client img{height:1.8rem}.portal-heading .wm i{font-size:.9rem}
.portal-heading .portal-site{flex-direction:row;align-items:center;gap:.75rem;font-size:.86rem}
.portal-heading .portal-site b{color:#ff9869;font-size:.69rem}.portal-heading .portal-site span{border-left:1px solid var(--hq-rule);padding-left:.75rem}
.wrap>.card{width:min(calc(100% - 2 * var(--hq-pad)),72rem);margin:clamp(1.6rem,6svh,5rem) auto;
 border:1px solid var(--hq-rule);border-radius:1rem;background:var(--hq-panel);box-shadow:none;animation:none}
.wrap>.card::before{content:none}
.wrap>form.card{display:grid;align-items:center;gap:clamp(1.25rem,5vw,4rem);
 grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);width:min(calc(100% - 2 * var(--hq-pad)),63rem);
 min-height:clamp(18rem,58svh,43rem);padding:0;border:0;border-radius:0;background:none;overflow:visible}
.intro{max-width:31rem}
.eyebrow{font-size:.78rem;line-height:1.4;letter-spacing:.12em;color:#ff9869}
.intro h1{font-size:clamp(2.05rem,4.8vw,4.25rem);line-height:1.04;letter-spacing:-.055em;margin:.65rem 0 1rem}
p,.intro p{color:var(--hq-muted);font-size:1rem;line-height:1.55}
.fields{border:1px solid var(--hq-rule);border-radius:1rem;background:var(--hq-panel);padding:clamp(1.15rem,3.3vw,2rem)}
.fields h2{font-size:1.28rem;letter-spacing:-.03em;margin:0 0 1.1rem}
.fields label{font-size:.94rem;margin:1rem 0 .4rem}
.fields input,#up-person{font:inherit;min-height:3rem;border-radius:.55rem;background:var(--hq-bg);border:1px solid #526168;color:var(--hq-ink)}
.fields input:focus{border-color:var(--hq-orange);box-shadow:0 0 0 2px #f2622240}
button{background:var(--hq-orange);color:#161a1c;border:1px solid #ff955f;border-radius:.6rem;
 height:auto;min-height:3rem;padding:.5rem 1rem;margin-top:1.15rem;box-shadow:0 0 12px #f262221c;
 transition:background-color .15s,box-shadow .15s}
button:hover:enabled{background:#ff8652;box-shadow:0 0 14px #f2622228}button:active:enabled{background:#f67a44;transform:none}
button:focus-visible,.portal-links a:focus-visible,.note a:focus-visible,.drop:focus-visible{outline:2px solid var(--hq-orange);outline-offset:4px}
.note{margin-top:1.2rem;padding-top:1rem;border-color:var(--hq-rule);font-size:.9rem}
.note a,.portal-links a{color:#ffae87;text-underline-offset:.2em}.err{color:#ffc3bb;background:#301e20;border:1px solid var(--hq-coral);margin:.8rem 0}
.foot{margin:auto 0 0;width:100%;border-top:1px solid var(--hq-rule);padding:.9rem var(--hq-pad) max(1rem,env(safe-area-inset-bottom));color:var(--hq-muted)}
.foot small{color:#a6b2b5!important}.portal-links a{min-height:44px}
.card li.got i{color:var(--hq-bg);background:var(--hq-active);border-color:var(--hq-active)}
.card .st.ok{border-color:var(--hq-confirmed);background:#192a23}
.card .st.bad{border-color:var(--hq-coral);background:#301e20;color:#ffc3bb}
@media(max-width:760px){
 .wrap>form.card{grid-template-columns:minmax(0,1fr);max-width:34rem;min-height:0;gap:1.5rem}
 .portal-heading .portal-site{display:grid;gap:.1rem;text-align:right}
 .portal-heading .portal-site span{border:0;padding:0}
}
@media(prefers-reduced-motion:reduce){button,input{transition:none}}
"""


def _mmg_shell():
    header = ('<header class="portal-heading">' + qr_brand.portal_masthead(qr_brand.public_mmg_logo(JOB_DIR))
              + '</header>')
    return _login_template("MyGear HQ · MMG Dugald River", "Sign in to MyGear HQ", header,
                           qr_brand.PORTAL_MASTHEAD_CSS + MMG_SHELL_CSS, group="MMG DUGALD RIVER",
                           intro="Search stock, review equipment on hire and follow the shift stocktake.",
                           fields_title='<h2>Open your workspace</h2>', autofocus=False)


def _users():
    out = {}
    for role in ("CLIENT", "STORE", "MANAGER"):
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
    page = _mmg_shell() if is_mmg(JOB_DIR) else LOGIN
    return _mobile_markup(page.replace("__NAME__", name).replace("__ERR__", box)).encode("utf-8")


UPLOAD = """<style>
.upload-columns{display:grid;gap:1.5rem;margin-top:1.5rem}
@media(min-width:900px){.upload-columns{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:clamp(32px,4.5vw,128px)}}
.submit-column label,.submit-column .st:first-child,.drop:first-child{margin-top:0}
#up-person,.st,li,.drop span{font-size:1rem}
.drop{margin-top:26px;border:2px dashed #47505E;border-radius:16px;padding:30px 18px;text-align:center;cursor:pointer;transition:border-color .2s,background .2s,box-shadow .2s}
.drop:hover,.drop.over{border-color:#F26222;background:rgba(242,98,34,.07);box-shadow:0 0 30px rgba(242,98,34,.15)}
.drop b{display:block;font-size:1.125rem}.drop span{display:block;color:#A3ADBB;font-size:.92rem;margin-top:6px}
.drop svg{width:2.15rem;height:2.15rem;color:#F26222;margin-bottom:10px}
ul{list-style:none;margin:22px 0 0;padding:0}li{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid #232A34;font-size:.97rem}
li i{flex:none;width:1.5rem;height:1.5rem;border-radius:50%;border:2px solid #47505E;display:grid;place-items:center;font-style:normal;font-size:14px;font-weight:700;color:#11151B}
li.got i{background:#F26222;border-color:#F26222}li.got i:before{content:"\\2713"}
li small{margin-left:auto;color:#8B95A3;font-size:.82rem;text-align:right;overflow-wrap:anywhere;max-width:52%}
li em{font-style:normal;color:#8B95A3;font-size:12.5px;margin-left:6px}
button:disabled{opacity:.4;cursor:not-allowed;box-shadow:none}
.st{margin-top:22px;border-radius:12px;padding:.85rem 1rem;font-size:.94rem;line-height:1.5;white-space:pre-wrap;border:1px solid #2B323D;background:#0A0D13;color:#DCE3EC}
.st.run{border-color:rgba(242,98,34,.5)}.st.ok{border-color:#2FA84F;background:rgba(47,168,79,.10)}.st.bad{border-color:rgba(242,98,34,.6);background:rgba(242,98,34,.10);color:#FFC9AE}
.st b{display:block;color:#fff}.bar{height:4px;border-radius:4px;background:#232A34;margin-top:10px;overflow:hidden}.bar:before{content:"";display:block;height:100%;width:35%;border-radius:4px;background:#F26222;box-shadow:0 0 12px #F26222;animation:go 1.3s ease-in-out infinite}
@keyframes go{from{transform:translateX(-100%)}to{transform:translateX(286%)}}
#up-person{width:100%;min-height:3rem;border-radius:10px;border:1px solid #47505E;background:#0A0D13;color:#fff;font:inherit;padding:0 12px}
.st,.top span{overflow-wrap:anywhere}
#up-last{border-top:1px solid #303844;margin-top:1.6rem;padding-top:1rem;overflow-wrap:anywhere}
#up-last h2{font-size:1rem;margin:0 0 .55rem}
#last-who,#last-when{display:block;color:#C9D1DC;font-size:.9rem}
#last-when{color:#A4AFBE;font-variant-numeric:tabular-nums}
#last-files{list-style:disc;margin:.55rem 0 0;padding-left:1.1rem}
#last-files li{display:list-item;font-size:.84rem;color:#A4AFBE;line-height:1.45;padding:.16rem 0;border:0}
@media(max-width:540px){.upload-columns{gap:1rem}.drop{padding:1.25rem .75rem}.portal-links{justify-content:space-between}}
</style>
<div class="card">
<div class="eyebrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>TOOL STORE TEAM</div>
<h1>Update the report</h1>
<p>Drop in whichever SiteIQ exports you have: all of them, or just one. The report rebuilds itself in about a minute, and nothing changes unless the whole build works.</p>
<div class="upload-columns"><div class="file-column">
<div class="drop" id="drop" tabindex="0" role="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4"/><path d="M7 9l5-5 5 5"/><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg><b>Tap to choose the files</b><span>or drag them here. Pick them all at once.</span></div>
<input id="pick" type="file" accept=".xlsx" multiple hidden>
<ul id="list" aria-label="Accepted export types"></ul></div>
<div class="submit-column"><div id="up-person-field" hidden><label for="up-person">Who is uploading?</label>
<select id="up-person" required><option value="">Choose your first and last name</option></select></div>
<button id="go" disabled>Update the report</button>
<div class="st" id="st" role="status" hidden></div>
<section id="up-last" aria-labelledby="last-title" hidden><h2 id="last-title">Last successful upload</h2>
<strong id="last-who"></strong><time id="last-when"></time><ul id="last-files"></ul></section>
</div></div>
<nav class="portal-links" aria-label="Portal"><a href="/">Open the report</a><span id="staff-qr" hidden><a href="/upload/qr-reports">QR reports and posters</a></span><span id="staff-sds" hidden><a href="/upload/sds-label-check.zip">Supplier SDS pack for label checks</a></span>__INSTALL_LINK__<a href="/logout">Sign out</a></nav>
</div>
<script>
const labels={RENTAL_STOCK:'Rental stock',SALES_STOCK:'Sales stock',TRANSACTIONS:'Transactions',STOCKTAKE:'Stocktake',ON_HIRE:'On hire'};
const files={};let K=[];
const $=s=>document.querySelector(s),st=$('#st'),go=$('#go'),drop=$('#drop'),pick=$('#pick');
const kind=n=>K.find(k=>n.toUpperCase().replace(/[ -]/g,'_').startsWith(k));
const say=(c,h)=>{st.hidden=false;st.className='st '+c;st.innerHTML=h};
const esc=t=>String(t).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const person=$('#up-person');let names=[],busy=false,loaded=false;
const buttons=()=>{person.disabled=busy;go.disabled=!loaded||busy||!K.some(k=>files[k])||(names.length>0&&!person.value)};
person.onchange=buttons;
function take(list){if(busy)return;
 if(!loaded){say('','Loading the accepted export types. Please choose your files in a moment.');return}
 const odd=[];for(const f of list){const k=kind(f.name);if(k&&/\\.xlsx$/i.test(f.name))files[k]=f;else odd.push(f.name)}
 document.querySelectorAll('#list li').forEach(li=>{const f=files[li.dataset.k];li.classList.toggle('got',!!f);li.querySelector('small').textContent=f?f.name:''});
 buttons();
 if(odd.length)say('bad','<b>Files skipped</b>'+esc(odd.join(', '))+'\\nChoose an .xlsx file beginning with '+K.join(', ')+'.');
 else if(!go.disabled)say('','<b>Ready.</b>Press "Update the report".');else st.hidden=true}
drop.onclick=()=>pick.click();drop.onkeydown=e=>{if(e.key=='Enter'||e.key==' '){e.preventDefault();pick.click()}};pick.onchange=()=>{take(pick.files);pick.value=''};
['dragenter','dragover'].forEach(v=>drop.addEventListener(v,e=>{e.preventDefault();drop.classList.add('over')}));
['dragleave','drop'].forEach(v=>drop.addEventListener(v,e=>{e.preventDefault();drop.classList.remove('over')}));
drop.addEventListener('drop',e=>take(e.dataTransfer.files));
const when=t=>new Date(t*1000).toLocaleString('en-AU',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:false,timeZone:names.length?'Australia/Brisbane':undefined})+(names.length?' AEST':'');
function show(s){
 $('#staff-sds').hidden=s.sds_label_check!==true;
 $('#staff-qr').hidden=s.qr_reports_staff!==true;
 if(!loaded){
  names=s.uploaders||[];
  K=(s.accepted_kinds||Object.keys(labels).filter(k=>k!=='ON_HIRE'||!('uploaders' in s))).filter(k=>Object.hasOwn(labels,k));
  $('#list').innerHTML=K.map(k=>'<li data-k="'+k+'"><i></i>'+labels[k]+'<small></small></li>').join('');
  loaded=true;
  if(names.length){
   $('#up-person-field').hidden=false;
   for(const name of names)person.add(new Option(name,name));
   $('h1 + p').textContent='Choose the SiteIQ exports for MMG Dugald River. The portal checks the project in each workbook before updating the report.';
  }
 }
 const audit=s.last_upload;
 if(names.length&&audit){
  const last=$('#up-last');last.hidden=false;
  $('#last-who').textContent=audit.name||'Uploader not recorded';
  const stamp=$('#last-when');
  stamp.dateTime=new Date(audit.finished*1000).toISOString();stamp.textContent=when(audit.finished);
  $('#last-files').replaceChildren(...Object.values(audit.files).map(file=>{
   const li=document.createElement('li');li.textContent=file;return li;
  }));
 }
 busy=s.state==='running';buttons();
 if(s.state=='running'){say('run','<b>Rebuilding the report…</b>This takes about a minute. You can leave this page open.<div class="bar"></div>');go.disabled=true;return true}
 if(s.state=='ok')say('ok','<b>Done. The report is updated.</b>SiteIQ pull '+esc(s.pull||'')+' · finished '+when(s.finished)+(s.took?' · took '+s.took+' seconds':''));
 else if(s.state=='failed')say('bad','<b>Not updated.</b>'+esc(s.message||''));
 else if(!s.pack)say('bad','<b>Not ready yet.</b>The job pack has not been loaded. Ask the Manager.');
 return false}
let submitted=false,submittedBatch='';
async function poll(){try{
 const response=await fetch('/upload/status',{headers:{'X-Portal':'1'}});
 if(response.redirected||response.status===401){location.assign('/login');return}
 if(!response.ok)throw new Error('Status unavailable');
 const s=await response.json();if(show(s))setTimeout(poll,3000);else if(s.state=='ok'&&submitted){submitted=false;if(submittedBatch&&s.last_upload?.batch!==submittedBatch){say('','<b>A later upload has completed.</b>See the last successful upload below.');return}
 person.value='';for(const k in files)delete files[k];take([]);show(s)}}catch{say('','<b>Checking upload status…</b>Retrying the connection.');setTimeout(poll,4000)}}
go.onclick=async()=>{if(go.disabled)return;busy=true;buttons();try{let first=1;
 const headers={'X-Portal':'1'};
 if(names.length){headers['X-Upload-By']=person.value;headers['X-Upload-Batch']=crypto.randomUUID()}
 for(const k of K){const f=files[k];if(!f)continue;say('run','<b>Sending '+esc(f.name)+'…</b><div class="bar"></div>');
  const r=await fetch('/upload/export?name='+encodeURIComponent(f.name)+(first?'&first=1':''),{method:'PUT',body:f,headers});first=0;
  if(r.status==401){location.href='/login';return}if(!r.ok)throw new Error(await r.text())}
 const b=await fetch('/upload/build',{method:'POST',headers});if(b.status===401){location.assign('/login');return}if(!b.ok)throw new Error(await b.text());submitted=true;submittedBatch=headers['X-Upload-Batch']||'';poll()}
 catch(e){say('bad','<b>Not updated.</b>'+esc(e.message));busy=false;buttons()}};
poll();
</script>"""


def _shell(inner):
    name = html.escape(os.environ.get("PORTAL_NAME", "").strip() or "Tool Store Report")
    page = _mmg_shell() if is_mmg(JOB_DIR) else LOGIN
    head, tail = page[:page.index("<form")], page[page.index('<div class="foot">'):]
    return _mobile_markup((head.replace("Sign in · ", "") + inner + tail).replace("__NAME__", name)).encode("utf-8")


def _upload_page(role):
    return _shell(UPLOAD)


def _status(role=None):
    try:
        with open(os.path.join(DATA_DIR, "upload_status.json"), encoding="utf-8") as f:
            st = json.load(f)
    except (OSError, ValueError):
        st = {"state": "idle"}
    if st.get("state") == "running" and not _build_lock.locked():      # the server restarted mid-build
        st.update({"state": "failed", "message": "The last rebuild was interrupted. Nothing was changed. Upload the files again."})
    st["pack"] = os.path.isfile(os.path.join(JOB_DIR, "job.json"))
    st["accepted_kinds"] = list(MMG_DAILY_KINDS if is_mmg(JOB_DIR) else KINDS)
    if is_mmg(JOB_DIR):
        st["uploaders"] = uploaders(JOB_DIR)
        if role in ("manager", "store"):
            st["qr_reports_staff"] = True
            st["sds_label_check"] = os.path.isfile(os.path.join(DATA_DIR, sds_library.LABEL_CHECK_NAME))
        st["last_upload"] = upload_receipt.published(DATA_DIR, st)
    return st


def _set_status(**kw):
    if "last_upload" not in kw and is_mmg(JOB_DIR):
        kw["last_upload"] = _status().get("last_upload")
    os.makedirs(DATA_DIR, exist_ok=True)
    tmp = os.path.join(DATA_DIR, ".upload_status.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(kw, f)
    os.replace(tmp, os.path.join(DATA_DIR, "upload_status.json"))


def _rebuild(name=None, batch=None, current=False):
    """Run the rebuild in its own process; the lock is already held."""
    started = time.time()
    try:
        cmd = [sys.executable, os.path.join(HERE, "rebuild.py"), JOB_DIR, DATA_DIR]
        if current:
            cmd.append("--current")
        elif name and batch:
            cmd.extend(("--uploader", name, "--batch", batch))
        run = subprocess.run(cmd, capture_output=True, text=True, timeout=900)
        try:
            res = json.loads(run.stdout.strip().splitlines()[-1])
        except Exception:
            res = {"ok": False, "message": "The rebuild stopped without an answer. Nothing was changed.\n" + (run.stderr or "")[-400:]}
    except subprocess.TimeoutExpired:
        res = {"ok": False, "message": "The rebuild took too long and was stopped. Nothing was changed."}
    except Exception as e:
        res = {"ok": False, "message": "The rebuild could not start: {}. Nothing was changed.".format(e)}
    finally:
        shutil.rmtree(os.path.join(JOB_DIR, "incoming"), ignore_errors=True)
    try:
        _finish_build(res, started)
    finally:
        _build_lock.release()


def _finish_build(res, started):
    if res.get("ok"):
        finished = time.time()
        audit = {"last_upload": res["last_upload"]} if "last_upload" in res else {}
        _set_status(state="ok", message="The report is updated.", pull=res.get("pull", ""), files=res.get("files", {}), kept=res.get("kept", []), finished=finished, took=round(finished - started), **audit)
    else:
        _set_status(state="failed", message=res.get("message", "Something went wrong. Nothing was changed."), finished=time.time())


def _load_pack(zip_path):
    """Unpack a job pack beside the old one, carry the trend history over, then swap it in."""
    new = os.path.join(DATA_DIR, ".job-new")
    shutil.rmtree(new, ignore_errors=True)
    n = 0
    with zipfile.ZipFile(zip_path) as z:
        for info in z.infolist():
            name = info.filename.replace("\\", "/")
            if info.is_dir():
                continue
            if name.startswith("/") or ".." in name.split("/") or info.file_size > 60 * 1024 * 1024:
                raise ValueError("unsafe file name in the pack")
            dest = os.path.join(new, *name.split("/"))
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            with z.open(info) as src, open(dest, "wb") as out:
                shutil.copyfileobj(src, out)
            n += 1
    with open(os.path.join(new, "job.json"), encoding="utf-8") as f:
        hist = json.load(f).get("paths", {}).get("history")
    if is_mmg(JOB_DIR) or is_mmg_pack(new):
        if not is_mmg_pack(new):
            raise ValueError("This portal needs the MMG Dugald River job pack.")
        for folder in (os.path.join(new, "kit", "Data_SiteIQ"), os.path.join(new, "incoming")):
            if os.path.isdir(folder):
                for filename in os.listdir(folder):
                    if filename.lower().endswith(".xlsx") or folder.endswith("incoming"):
                        path = os.path.join(folder, filename)
                        if folder.endswith("incoming"):
                            mmg_daily_kind(path, filename.split("__", 1)[-1])
                        check_workbook(path)
        # Preserve both sets of historical sightings as well as any stocktake
        # bundled with the pack that the live, more recent export will replace.
        packed_history = os.path.join(new, "kit", "stocktake_history")
        with tempfile.TemporaryDirectory(dir=DATA_DIR) as staging:
            staged_history = os.path.join(staging, "stocktake_history")
            if os.path.isdir(packed_history):
                os.replace(packed_history, staged_history)
            for folder in (staged_history, os.path.join(JOB_DIR, "kit", "stocktake_history")):
                if os.path.isdir(folder):
                    for filename in os.listdir(folder):
                        if not filename.lower().endswith(".xlsx"):
                            continue
                        archive_stocktake(new, os.path.join(folder, filename))
            if os.path.isfile(os.path.join(JOB_DIR, "kit", "Data_SiteIQ", "STOCKTAKE.xlsx")):
                packed_stocktake = os.path.join(new, "kit", "Data_SiteIQ", "STOCKTAKE.xlsx")
                if os.path.isfile(packed_stocktake):
                    archive_stocktake(new, packed_stocktake)
    if hist:                                   # keep every point the live site already has
        pts = {}
        for path in (os.path.join(new, hist), os.path.join(JOB_DIR, hist)):
            try:
                with open(path, encoding="utf-8") as f:
                    pts.update({p["asat"]: p for p in json.load(f)})
            except (OSError, ValueError, KeyError, TypeError):
                pass
        with open(os.path.join(new, hist), "w", encoding="utf-8") as f:
            json.dump([pts[k] for k in sorted(pts)], f, indent=1)
    # the exports already on the site are newer than any in the pack: carry them over
    live = os.path.join(JOB_DIR, "kit", "Data_SiteIQ")
    if os.path.isdir(live):
        os.makedirs(os.path.join(new, "kit", "Data_SiteIQ"), exist_ok=True)
        for name in os.listdir(live):
            shutil.copyfile(os.path.join(live, name), os.path.join(new, "kit", "Data_SiteIQ", name))
    old = os.path.join(DATA_DIR, ".job-old")
    shutil.rmtree(old, ignore_errors=True)
    if os.path.isdir(JOB_DIR):
        os.replace(JOB_DIR, old)
    os.replace(new, JOB_DIR)
    shutil.rmtree(old, ignore_errors=True)
    return n


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

    def _role(self, page=False, cookie=False):
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
        elif cookie and self.headers.get("X-Portal") == "1":     # the upload page's own requests
            role = _session_role(self.headers.get("Cookie"))
        if role is None:
            self.send_response(401)
            self.send_header("WWW-Authenticate", 'Basic realm="Tool store report", charset="UTF-8"')
            self._common()
            self.send_header("Content-Length", "0")
            self.end_headers()
        return role

    def _common(self, cache_control="no-store"):
        self.send_header("Cache-Control", cache_control)
        self.send_header("X-Robots-Tag", "noindex, nofollow")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        scoped = self.path.startswith("/qr/")
        self.send_header("Referrer-Policy", "no-referrer" if scoped else "same-origin")
        if scoped:
            self.send_header("Content-Security-Policy", qr_access.CSP)
            camera = "(self)" if self.path.startswith("/qr/personal/") else "()"
            self.send_header("Permissions-Policy", f"camera={camera}, microphone=(), geolocation=()")

    def _redirect(self, where, cookie=None):
        self.send_response(303)
        self.send_header("Location", where)
        if cookie is not None:
            self.send_header("Set-Cookie", "s={}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age={}".format(cookie, SESSION_HOURS * 3600 if cookie else 0))
        self._common()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _send(self, code, body, ctype, *, headers=(), cache_control="no-store"):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        for key, value in headers:
            self.send_header(key, value)
        self._common(cache_control)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def _published_report(self):
        return _web_report.load(os.path.join(DATA_DIR, "report.html"),
                                mmg_job=JOB_DIR if is_mmg(JOB_DIR) else None)

    def _report_page(self, path):
        if not self._role(page=True):
            return
        try:
            report = self._published_report()
        except FileNotFoundError:
            if path == "/":
                return self._send(200, _shell(EMPTY), FILES["report.html"])
            return self._send(404, b"Picture not found", "text/plain")
        if path == "/":
            headers = [("Vary", "Accept-Encoding")]
            body = report.html
            if accepts_gzip(self.headers.get("Accept-Encoding", "")):
                headers.append(("Content-Encoding", "gzip"))
                body = report.gzip
            return self._send(200, body, FILES["report.html"], headers=headers)

        key = path.removeprefix("/report-media/")
        item = report.images.get(key)
        if item is None:
            return self._send(404, b"Picture not found", "text/plain")
        etag = '"' + key + '"'
        if self.headers.get("If-None-Match") == etag:
            self.send_response(304)
            self.send_header("ETag", etag)
            self._common("private, no-cache")
            self.end_headers()
            return
        return self._send(200, item[1], item[0], headers=[("ETag", etag)], cache_control="private, no-cache")

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path.startswith(("/qr/", "/upload/report-qr/")) and is_mmg(JOB_DIR):
            return qr_access.serve(self, DATA_DIR, JOB_DIR)
        if path == "/upload/qr-reports" and is_mmg(JOB_DIR):
            return self._qr_admin()
        if path == "/upload/worker-register.xlsx" and is_mmg(JOB_DIR):
            return self._worker_register()
        if path == "/stocktake/entries" and is_mmg(JOB_DIR):
            return self._stocktake_entries()
        if path == "/stocktake/shift-review" and is_mmg(JOB_DIR):
            return self._stocktake_shift_review()
        if path in ("/swms/status", "/swms/current.pdf", "/swms/current.docx") and is_mmg(JOB_DIR):
            return self._swms(path)
        if path == "/upload/sds-label-check.zip" and is_mmg(JOB_DIR):
            return self._label_check_pack()
        if path.startswith("/sds/") and is_mmg(JOB_DIR):
            if not self._role(page=True):
                return
            name = path.removeprefix("/sds/")
            if sds_library.PDF_NAME.fullmatch(name):
                try:
                    with open(os.path.join(DATA_DIR, "sds", "pdfs", name), "rb") as document:
                        return self._send(200, document.read(), "application/pdf",
                                          headers=[("Content-Disposition", f'inline; filename="{name}"')])
                except FileNotFoundError:
                    pass
            return self._send(404, b"Document not found.", "text/plain")
        if path in MOBILE_FILES or path == "/install":
            if not is_mmg(JOB_DIR):
                return self._send(404, b"Not found", "text/plain")
            if path == "/install":
                with open(os.path.join(HERE, "mobile", "install.html"), encoding="utf-8") as page:
                    return self._send(200, _shell(page.read()), "text/html; charset=utf-8")
            name, content_type = MOBILE_FILES[path]
            body = public_asset(os.path.join(HERE, "mobile"), name)
            etag = '"' + hashlib.sha256(body).hexdigest() + '"'
            validators = self.headers.get("If-None-Match", "").split(",")
            if any(v.strip().removeprefix("W/") in (etag, "*") for v in validators):
                self.send_response(304)
                self.send_header("ETag", etag)
                self._common("public, no-cache")
                self.end_headers()
                return
            return self._send(200, body, content_type, headers=[("ETag", etag)], cache_control="public, no-cache")
        if path == "/health":
            return self._send(200, b"ok", "text/plain")
        if path == "/login":
            if _session_role(self.headers.get("Cookie")):
                return self._redirect("/")
            return self._send(200, _login_page(), "text/html; charset=utf-8")
        if path == "/logout":
            return self._redirect("/login", cookie="")
        if path in ("/upload", "/upload/status"):
            role = self._role(page=True)
            if not role:
                return
            if path == "/upload/status":
                return self._send(200, json.dumps(_status(role)).encode(), "application/json")
            return self._send(200, _upload_page(role), "text/html; charset=utf-8")
        if path == "/" or path.startswith("/report-media/"):
            return self._report_page(path)
        name = path[1:]
        if name not in FILES or name == "report.html":
            return self._send(404, b"Not found", "text/plain")
        if not self._role(page=True):
            return
        try:
            with open(os.path.join(DATA_DIR, name), "rb") as f:
                body = f.read()
        except FileNotFoundError:
            return self._send(404, b"That file is not loaded yet.", "text/plain")
        self._send(200, body, FILES[name])

    do_HEAD = do_GET

    def do_POST(self):
        if self.path.startswith("/qr/") and is_mmg(JOB_DIR):
            return qr_access.serve(self, DATA_DIR, JOB_DIR)
        if self.path == "/upload/qr-work-review" and is_mmg(JOB_DIR):
            return self._qr_work_review()
        if self.path.split("?", 1)[0] == "/swms/manager-review" and is_mmg(JOB_DIR):
            return self._swms("/swms/manager-review")
        if self.path.split("?", 1)[0] == "/stocktake/entries" and is_mmg(JOB_DIR):
            return self._stocktake_entries(write=True)
        if self.path.split("?", 1)[0] == "/upload/rebuild-current" and is_mmg(JOB_DIR):
            return self.do_POST_build(current=True)
        if self.path.split("?", 1)[0] == "/upload/build":
            return self.do_POST_build()
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

    def _qr_admin(self, *, add_only=False):
        write = self.command == "PUT"
        role = self._role(cookie=write, page=not write)
        if not role:
            return
        if role not in ("store", "manager") or (write and role != "manager"):
            return self._send(403, b"Access restricted.", "text/plain")
        if not write:
            try:
                notes = qr_work_notes.entries(DATA_DIR) if role == "manager" else []
            except sqlite3.Error:
                return self._send(503, b"QR work milestones are temporarily unavailable.", "text/plain")
            headers = (("X-Roster-Add-Endpoint", "/upload/qr-roster-add.xlsx"),) if role == "manager" else ()
            stamp = worker_register.updated(DATA_DIR) if role == "manager" else None
            return self._send(200, qr_admin.page(role, qr_roster.status(DATA_DIR), notes, register_updated=stamp,
                                                mmg_logo=qr_brand.public_mmg_logo(JOB_DIR)),
                              "text/html; charset=utf-8", headers=headers)
        body = self._body(12 * 1024 * 1024)
        if body is None:
            return
        try:
            mode = self.headers.get("X-Roster-Mode")
            if mode is not None and not (add_only and mode == "add"):
                raise ValueError("Use the dedicated additive roster endpoint for adding worker badges.")
            result = qr_roster.import_roster(DATA_DIR, body, confirmed_mmg=self.headers.get("X-Confirm-MMG") == "1",
                                             add_only=add_only)
        except ValueError as exc:
            return self._send(400, json.dumps({"error": str(exc)}).encode(), "application/json")
        return self._send(200, json.dumps(result).encode(), "application/json")

    def _correct_worker_barcodes(self):
        role = self._role(cookie=True)
        if not role:
            return
        if role != "manager":
            return self._send(403, b"Manager access required.", "text/plain")
        if self.headers.get_content_type() != "application/json":
            return self._send(415, b"Send worker barcode corrections as JSON.", "text/plain")
        body = self._body(128 * 1024)
        if body is None:
            return
        try:
            payload = json.loads(body)
        except (ValueError, UnicodeError):
            return self._send(400, b"Invalid JSON.", "text/plain")
        try:
            result = qr_roster.correct_verified(DATA_DIR, payload)
        except ValueError as exc:
            return self._send(400, json.dumps({"error": str(exc)}).encode(), "application/json")
        return self._send(200, json.dumps(result).encode(), "application/json")

    def _worker_register(self):
        write = self.command == "PUT"
        role = self._role(cookie=write, page=not write)
        if not role:
            return
        if role != "manager":
            return self._send(403, b"Manager access required.", "text/plain")
        if not write:
            try:
                with open(os.path.join(DATA_DIR, worker_register.FILE), "rb") as f:
                    body = f.read()
            except FileNotFoundError:
                return self._send(404, b"No worker register has been uploaded.", "text/plain")
            return self._send(200, body, worker_register.MIME,
                              headers=(("Content-Disposition", 'attachment; filename="MMG_Full_Worker_Register.xlsx"'),
                                       ("ETag", worker_register.etag(body))))
        body = self._body(qr_roster.MAX_BYTES)
        if body is None:
            return
        try:
            result = worker_register.install(DATA_DIR, body, if_match=self.headers.get("If-Match"))
        except worker_register.RegisterChanged as exc:
            return self._send(412, json.dumps({"error": str(exc)}).encode(), "application/json")
        except ValueError as exc:
            return self._send(400, json.dumps({"error": str(exc)}).encode(), "application/json")
        return self._send(200, json.dumps(result).encode(), "application/json")

    def _qr_work_review(self):
        role = self._role(cookie=True)
        if not role:
            return
        def reply(status, payload):
            return self._send(status, json.dumps(payload).encode(), "application/json")
        if role != "manager" or self.headers.get("X-Portal") != "1":
            return reply(403, {"error": "A manager must review work milestones."})
        if self.headers.get_content_type() != "application/json":
            return reply(415, {"error": "Send a JSON review."})
        body = self._body(2048)
        if body is None:
            return
        try:
            qr_work_notes.review(DATA_DIR, json.loads(body))
        except qr_work_notes.NoteError as exc:
            return reply(exc.status, {"error": str(exc)})
        except (ValueError, UnicodeError):
            return reply(400, {"error": "Choose a milestone and a review action."})
        except sqlite3.Error:
            return reply(503, {"error": "Work milestones are temporarily unavailable."})
        return reply(200, {"ok": True})

    def _label_check_pack(self):
        write = self.command == "PUT"
        role = self._role(page=not write)
        if not role:
            return
        if role not in (("manager",) if write else ("manager", "store")):
            return self._send(403, b"Staff access required.", "text/plain")
        if write:
            body = self._body(sds_library.MAX_BUNDLE)
            if body is None:
                return
            try:
                count = sds_library.install_label_check(body, DATA_DIR)
            except ValueError as exc:
                return self._send(400, str(exc).encode(), "text/plain")
            return self._send(200, f"Loaded {count} PDFs for staff label checks.".encode(), "text/plain")
        try:
            with open(os.path.join(DATA_DIR, sds_library.LABEL_CHECK_NAME), "rb") as pack:
                self.send_response(200)
                self.send_header("Content-Type", "application/zip")
                self.send_header("Content-Length", str(os.fstat(pack.fileno()).st_size))
                self.send_header("Content-Disposition", 'attachment; filename="MMG-SDS-Supplier-Label-Checks.zip"')
                self._common()
                self.end_headers()
                if self.command != "HEAD":
                    shutil.copyfileobj(pack, self.wfile)
        except FileNotFoundError:
            return self._send(404, b"The supplier label-check pack is not loaded.", "text/plain")

    def _swms(self, path):
        write = self.command in ("PUT", "POST")
        role = self._role(cookie=write, page=not write)
        if not role:
            return

        def reply(status, payload):
            return self._send(status, json.dumps(payload).encode(), "application/json")

        if write and role != "manager":
            return reply(403, {"error": "The manager login is required."})
        try:
            if path == "/upload/swms.zip":
                body = self._body(swms_store.MAX_BUNDLE)
                if body is None:
                    return
                version = swms_store.publish(DATA_DIR, body)
                return reply(200, {"version": version, "pdf": "/swms/current.pdf", "docx": "/swms/current.docx"})
            if path.startswith("/swms/current."):
                ext = path.rsplit(".", 1)[1]
                params = urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query, keep_blank_values=True)
                requested = params.get("version", [None])
                if len(requested) != 1:
                    return reply(400, {"error": "Choose one document version."})
                head = self.command == "HEAD"
                version, content = swms_store.document(DATA_DIR, ext, requested[0], head)
                mime, disposition = swms_store.FORMATS[ext]
                self.send_response(200)
                self.send_header("Content-Type", mime)
                self.send_header("Content-Length", str(content if head else len(content)))
                self.send_header("Content-Disposition", f'{disposition}; filename="MMG-Dugald-River-SWMS.{ext}"')
                self.send_header("X-SWMS-Version", version)
                self._common()
                self.end_headers()
                if not head:
                    self.wfile.write(content)
                return
            identity = swms_store.manager_identity(JOB_DIR) if role == "manager" else None
            if write:
                if self.headers.get("X-Portal") != "1":
                    return reply(403, {"error": "Use the portal review action to record a review."})
                if self.headers.get_content_type() != "application/json":
                    return reply(415, {"error": "Send a JSON acknowledgement."})
                body = self._body(2048)
                if body is None:
                    return
                try:
                    payload = json.loads(body)
                except (ValueError, UnicodeError):
                    return reply(400, {"error": "Invalid review acknowledgement."})
                status = swms_store.review(DATA_DIR, payload, identity)
            else:
                status = swms_store.current_status(DATA_DIR)
            return reply(200, {**status, "reviewer_name": identity[1] if identity else None,
                               "can_review": bool(identity and status["version"] and not status["reviewed_at"])})
        except swms_store.SwmsError as exc:
            return reply(exc.status, {"error": str(exc)})
        except sqlite3.Error:
            return reply(503, {"error": "SWMS records are unavailable. Try again."})

    def _stocktake_shift_review(self):
        role = self._role(cookie=True)
        if not role:
            return
        if role != "manager":
            return self._send(403, b"Manager sign-in required for shift review.", "text/plain")
        try:
            analysis = stocktake_store.shift_review(DATA_DIR)
        except stocktake_store.CountError as exc:
            return self._send(exc.status, json.dumps({"error": str(exc)}).encode(), "application/json")
        except sqlite3.Error:
            return self._send(503, b'{"error":"The stocktake ledger is unavailable. Try again."}', "application/json")
        body = json.dumps(analysis, separators=(",", ":")).encode()
        headers = [("Vary", "Accept-Encoding")]
        if accepts_gzip(self.headers.get("Accept-Encoding", "")):
            body = gzip.compress(body, compresslevel=4, mtime=0)
            headers.append(("Content-Encoding", "gzip"))
        return self._send(200, body, "application/json", headers=headers)

    def _stocktake_entries(self, write=False):
        def reply(status, payload):
            return self._send(status, json.dumps(payload).encode(), "application/json")

        role = self._role(cookie=True)
        if not role:
            return
        can_record = role in stocktake_store.COUNT_ROLES
        roster = uploaders(JOB_DIR)
        try:
            if not write:
                return reply(200, {"entries": stocktake_store.all_entries(DATA_DIR),
                                   "controllers": roster, "can_record": can_record,
                                   "can_review_shifts": role == "manager"})
            if not can_record or self.headers.get("X-Portal") != "1":
                return reply(403, {"error": "Use a signed-in staff account to record stocktakes."})
            if self.headers.get_content_type() != "application/json":
                return reply(415, {"error": "Send a JSON count entry."})
            body = self._body(8192)
            if body is None:
                return
            try:
                payload = json.loads(body)
            except (ValueError, UnicodeError):
                return reply(400, {"error": "Cannot read this count entry."})
            entry = stocktake_store.record(DATA_DIR, payload, roster)
            return reply(200, {"entry": entry})
        except stocktake_store.CountError as exc:
            return reply(exc.status, {"error": str(exc)})
        except sqlite3.Error:
            return reply(503, {"error": "Stocktake records are unavailable. Try again."})

    def _uploader(self):
        return self._role(cookie=True)       # every login may upload exports (Andrew, 27 Nov 2026)

    def _body(self, limit):
        try:
            size = int(self.headers.get("Content-Length", ""))
        except ValueError:
            self._send(411, b"Content-Length needed.", "text/plain")
            return None
        if not 0 < size <= limit:
            self._send(413, b"Too large.", "text/plain")
            return None
        body = self.rfile.read(size)
        if len(body) != size:
            self._send(400, b"Upload cut short.", "text/plain")
            return None
        return body

    def _put_export(self):
        if not self._uploader():
            return
        if _build_lock.locked():
            return self._send(409, b"A rebuild is running. Try again in a minute.", "text/plain")
        body = self._body(MAX_UPLOAD)
        if body is None:
            return
        if not body.startswith(b"PK"):
            return self._send(400, b"That is not an Excel export.", "text/plain")
        q = urllib.parse.parse_qs(self.path.partition("?")[2])
        name = re.sub(r"[^A-Za-z0-9._ -]", "_", os.path.basename(q.get("name", ["export.xlsx"])[0]))[:80] or "export.xlsx"
        if is_mmg(JOB_DIR):
            identity = self._batch_identity()
            if not identity:
                return
            who, batch, folder = identity
            source = io.BytesIO(body)
            try:
                kind = mmg_daily_kind(source, name)
                check_workbook(source)
            except (Stop, ValueError) as exc:
                return self._send(400, str(exc).encode(), "text/plain")
            if not _build_lock.acquire(blocking=False):
                return self._send(409, b"A rebuild is running. Try again in a minute.", "text/plain")
            try:
                base = os.path.dirname(folder)
                os.makedirs(base, exist_ok=True)
                if q.get("first"):
                    for old in os.scandir(base):
                        if old.is_dir() and old.stat().st_mtime < time.time() - 86400:
                            shutil.rmtree(old.path)
                    if len(os.listdir(base)) >= 64 and not os.path.isdir(folder):
                        return self._send(409, b"Too many unfinished uploads. Try again later.", "text/plain")
                    shutil.rmtree(folder, ignore_errors=True)
                    os.makedirs(folder)
                if not os.path.isdir(folder):
                    return self._send(409, b"Start this upload again.", "text/plain")
                if any(file.startswith(kind + "__") for file in os.listdir(folder)):
                    return self._send(400, b"Choose one file of each export type.", "text/plain")
                with open(os.path.join(folder, kind + "__" + name), "wb") as f:
                    f.write(body)
            finally:
                _build_lock.release()
            return self._send(200, b"ok", "text/plain")
        inc = os.path.join(JOB_DIR, "incoming")
        if q.get("first"):                       # a new batch: forget any half-finished one
            shutil.rmtree(inc, ignore_errors=True)
        os.makedirs(inc, exist_ok=True)
        if len(os.listdir(inc)) >= 8:
            return self._send(400, b"Too many files. Start again.", "text/plain")
        with open(os.path.join(inc, "{:02d}__{}".format(len(os.listdir(inc)), name)), "wb") as f:
            f.write(body)
        self._send(200, b"ok", "text/plain")

    def _batch_identity(self):
        who = self.headers.get("X-Upload-By", "")
        batch = self.headers.get("X-Upload-Batch", "")
        if who not in uploaders(JOB_DIR) or not re.fullmatch(r"[a-fA-F0-9]{8}-(?:[a-fA-F0-9]{4}-){3}[a-fA-F0-9]{12}", batch):
            self._send(400, b"Choose your first and last name and start a new upload.", "text/plain")
            return None
        return who, batch, os.path.join(DATA_DIR, ".upload-batches", hashlib.sha256(who.encode()).hexdigest()[:16] + "-" + batch)

    def _put_pack(self):
        role = self._role()
        if not role:
            return
        if role != "manager":
            return self._send(403, b"Manager login needed to load the job pack.", "text/plain")
        body = self._body(MAX_PACK)
        if body is None:
            return
        os.makedirs(DATA_DIR, exist_ok=True)
        fd, tmp = tempfile.mkstemp(dir=DATA_DIR, prefix=".pack-")
        with os.fdopen(fd, "wb") as f:
            f.write(body)
        try:
            if not _build_lock.acquire(blocking=False):
                return self._send(409, b"A rebuild is running. Try again in a minute.", "text/plain")
            try:
                n = _load_pack(tmp)
            finally:
                _build_lock.release()
        except Exception as e:
            return self._send(400, ("That pack could not be loaded: {}".format(e)).encode(), "text/plain")
        finally:
            os.remove(tmp)
        self._send(200, "Job pack loaded ({} files).".format(n).encode(), "text/plain")

    def do_POST_build(self, current=False):
        role = self._uploader()
        if not role:
            return
        if not os.path.isfile(os.path.join(JOB_DIR, "job.json")):
            return self._send(409, b"The job pack is not loaded yet.", "text/plain")
        if current and role != "manager":
            return self._send(403, b"Manager login needed.", "text/plain")
        identity = None
        if not current and is_mmg(JOB_DIR):
            identity = self._batch_identity()
            if not identity:
                return
        if not _build_lock.acquire(blocking=False):
            return self._send(409, b"A rebuild is already running.", "text/plain")
        try:
            name, batch = None, None
            if identity:
                name, batch, folder = identity
                if not os.path.isdir(folder) or not os.listdir(folder):
                    _build_lock.release()
                    return self._send(409, b"No files in this upload. Choose your files again.", "text/plain")
                incoming = os.path.join(JOB_DIR, "incoming")
                shutil.rmtree(incoming, ignore_errors=True)
                os.replace(folder, incoming)
            _set_status(state="running", message="Building the report…", started=time.time(), by=role)
            threading.Thread(target=_rebuild, args=(name, batch, current), daemon=True).start()
        except Exception:
            _build_lock.release()
            raise
        self._send(202, b"started", "text/plain")

    def _put_history(self, kind):
        role = self._role()
        if not role:
            return
        if role != "manager":
            return self._send(403, b"The manager login is needed to import a past pull.", "text/plain")
        body = self._body(MAX_UPLOAD)
        if body is None:
            return
        if not _build_lock.acquire(blocking=False):
            return self._send(409, b"A rebuild is running. Try again in a minute.", "text/plain")
        try:
            with tempfile.TemporaryDirectory(dir=DATA_DIR) as staging:
                path = os.path.join(staging, kind + ".xlsx")
                with open(path, "wb") as f:
                    f.write(body)
                try:
                    stamp = import_history(JOB_DIR, DATA_DIR, path, kind)
                except (ValueError, KeyError, StopIteration, IndexError):
                    return self._send(400, b"Choose an earlier MMG export of the requested type with a valid, distinct SiteIQ pull.", "text/plain")
        finally:
            _build_lock.release()
        return self._send(200, ("Recorded {} history for {}.".format(kind, stamp)).encode(), "text/plain")

    def do_PUT(self):
        path = self.path.split("?", 1)[0]
        if path == "/upload/qr-roster-corrections" and is_mmg(JOB_DIR):
            return self._correct_worker_barcodes()
        if path in ("/upload/qr-roster.xlsx", "/upload/qr-roster-add.xlsx") and is_mmg(JOB_DIR):
            return self._qr_admin(add_only=path == "/upload/qr-roster-add.xlsx")
        if path == "/upload/worker-register.xlsx" and is_mmg(JOB_DIR):
            return self._worker_register()
        if path == "/upload/sds-label-check.zip" and is_mmg(JOB_DIR):
            return self._label_check_pack()
        if path == "/upload/swms.zip" and is_mmg(JOB_DIR):
            return self._swms(path)
        if path == "/upload/sds-register.zip" and is_mmg(JOB_DIR):
            role = self._role()
            if not role:
                return
            if role != "manager":
                return self._send(403, b"Manager login needed.", "text/plain")
            body = self._body(sds_library.MAX_BUNDLE)
            if body is None:
                return
            if not _build_lock.acquire(blocking=False):
                return self._send(409, b"Another build is running.", "text/plain")
            try:
                count = sds_library.install(body, DATA_DIR)
            except (ValueError, zipfile.BadZipFile, RuntimeError):
                return self._send(400, b"Check the MMG register index and PDF files.", "text/plain")
            finally:
                _build_lock.release()
            return self._send(200, f"Loaded {count} documents for the next build.".encode(), "text/plain")
        if path in ("/upload/variant-history", "/upload/stocktake-history") and is_mmg(JOB_DIR):
            return self._put_history("RENTAL_STOCK" if path == "/upload/variant-history" else "STOCKTAKE")
        if path == "/upload/export":
            return self._put_export()
        if path == "/upload/pack.zip":
            return self._put_pack()
        name = path[len("/upload/"):] if path.startswith("/upload/") else ""
        if name not in FILES:
            return self._send(404, b"Not found", "text/plain")
        role = self._role()
        if not role:
            return
        if role != "manager":
            return self._send(403, b"Manager login needed to load a report.", "text/plain")
        if is_mmg(JOB_DIR):
            return self._send(400, b"Build MMG reports from verified SiteIQ exports on the upload page.", "text/plain")
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
