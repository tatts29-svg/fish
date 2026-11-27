"""Isolated project report shells. The requested report is fetched after selection."""


import os
from pathlib import Path


def page(scope, *, barcode_ready=True):
    if scope not in ("company", "personal"):
        raise ValueError("Unknown report scope")
    personal = scope == "personal"
    job = Path(os.environ.get("DATA_DIR", "/data")) / "job"
    logo = ('<img class="client-logo" src="mmg-logo.png" alt="MMG">'
            if (job / "logo.png").is_file() else "")
    fonts = job / "kit" / "_fonts"
    font_class = "job-font" if all((fonts / f"Inter-{w}.ttf").is_file() for w in ("Regular", "Bold")) else ""
    title = "Your time at MMG Dugald River" if personal else "Company on-hire report"
    intro = ("Follow the gear on your card, your returns and your visits recorded by the tool store."
             if personal else "Choose your company to see its current gear and recorded tool-store history.")
    form = ('''<label for="identity">Your SiteIQ barcode</label>
        <input id="identity" type="text" required maxlength="256" autocomplete="off"
               autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Enter the code on your card">
        <div class="form-actions"><button class="primary" type="submit">View my report</button>
        <button id="camera" type="button" hidden>Scan my card</button></div>
        <div id="scan-box" hidden><video id="preview" playsinline muted></video>
        <p>Hold the code on your card inside the frame.</p>
        <button id="stop-scan" type="button">Close camera</button></div>'''
            if personal else '''<label for="identity">Company</label>
        <select id="identity" required disabled><option value="">Loading companies…</option></select>
        <div class="form-actions"><button class="primary" type="submit" disabled>View on-hire report</button>
        <button id="retry-companies" type="button" hidden>Retry company list</button></div>''')
    setup = personal and not barcode_ready
    if setup:
        intro = "Worker barcode access is being set up. Please ask the tool store."
        form = '<button type="button" id="refresh">Refresh availability</button>'
    return f'''<!doctype html><html lang="en-AU"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#2a313c"><meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex,nofollow"><title>{title} · Coates</title>
<link rel="stylesheet" href="qr_report.css"><script defer src="qr_report.js"></script></head>
<body class="{font_class}" data-scope="{scope}" data-setup="{int(setup)}"><header class="brandbar"><div class="frame top">
<strong class="brand">COATES</strong><i aria-hidden="true"></i>{logo}<span>MMG Dugald River</span>
</div></header><main id="main" class="frame">
<section id="lookup" class="entry-card"><div class="intro"><p class="eyebrow">Coates tool store</p>
<h1>{title}</h1><p>{intro}</p></div><form id="lookup-form" autocomplete="off">{form}</form>
<noscript>Enable JavaScript to open this report.</noscript></section>
<p id="message" class="message" role="status" aria-live="polite" aria-atomic="true"></p>
<article id="report" hidden><header class="report-head"><div class="hero-copy">
<p class="eyebrow">{'Your time at MMG Dugald River' if personal else 'Company record · MMG Dugald River'}</p>
<h1 id="report-heading" tabindex="-1"></h1><p id="report-subtitle"></p></div>
<a href="#current-gear" class="hero-holding" aria-label="Jump to the current on-hire list"><span id="hero-count"></span>
<span><span id="hero-label">{'Assets on hire to you' if personal else 'Assets on hire now'}</span> <b aria-hidden="true">↘</b></span></a>
</header>
<div class="report-tools"><button type="button" id="reset">{'Finish and clear' if personal else 'Change company'}</button>
<nav class="actions" aria-label="Report actions">
<button id="print" type="button">Print</button><button id="save" type="button">Save PDF</button>
<button id="share" type="button">Share PDF</button><button id="email" type="button">Email PDF</button>
</nav></div><div id="report-body"></div></article>
</main><footer class="frame foot"><p id="pull">SiteIQ pull time available with the report.</p>
<p>Author: Andrew Fisher <span aria-hidden="true">|</span> <strong>POWERED BY SITEIQ</strong></p>
<small>Designed and built by Andrew Fisher · © 2026 Andrew Fisher. All rights reserved. Not to be copied or reproduced without permission.</small></footer>
<dialog id="send-dialog" aria-labelledby="send-title"><div class="dialog-head"><h2 id="send-title">Share PDF</h2>
<button id="close-dialog" type="button" aria-label="Close">×</button></div>
<p id="send-status" role="status"></p><div class="dialog-actions">
<button id="native-share" class="primary" type="button" hidden>Choose an app</button>
<button id="dialog-save" type="button" disabled>Save PDF</button>
<a id="email-draft" class="button" hidden>Open email draft</a>
</div></dialog></body></html>'''
