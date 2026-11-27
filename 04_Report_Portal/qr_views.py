"""Scoped MyGear HQ shells. Job data is fetched only after report selection."""

import os
from pathlib import Path

from qr_brand import lockup


def page(scope, *, barcode_ready=True, job_dir=None):
    if scope not in ("company", "personal"):
        raise ValueError("Unknown report scope")
    personal = scope == "personal"
    job = Path(job_dir) if job_dir is not None else Path(os.environ.get("DATA_DIR", "/data")) / "job"
    brand = lockup("mmg-logo.png" if (job / "logo.png").is_file() else None)
    fonts = job / "kit" / "_fonts"
    font_class = "job-font" if all((fonts / f"Inter-{w}.ttf").is_file() for w in ("Regular", "Bold")) else ""
    title = "Personal on-hire report" if personal else "Company on-hire report"
    trail = "Personal report" if personal else "Company report"
    intro = ("See what is on hire to you, your returns and your tool-store history."
             if personal else "See your company’s gear on hire and its work history at Dugald River.")
    fields = ('''<label for="identity">Scan or enter your assigned barcode number</label>
        <input id="identity" type="text" required maxlength="256" autocomplete="off"
               autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Enter your barcode number">
        <div class="form-actions"><button class="primary" type="submit">View my report</button>
        <button id="camera" type="button" hidden>Scan barcode</button></div>
        <div id="scan-box" hidden><video id="preview" aria-label="Barcode camera preview" playsinline muted></video>
        <p>Hold your barcode inside the frame.</p>
        <button id="stop-scan" type="button">Close camera</button></div>'''
        if personal else '''<label for="identity">Company</label>
        <select id="identity" required disabled><option value="">Loading companies…</option></select>
        <div class="form-actions"><button class="primary" type="submit" disabled>View on-hire report</button>
        <button id="retry-companies" type="button" hidden>Retry company list</button></div>''')
    return_jump = ('<a class="return-jump screen-only" href="#return-rating">Your return record</a>'
                   if personal else "")
    setup = personal and not barcode_ready
    form_title = "Worker access" if personal else "Company selection"
    if setup:
        intro = "Worker barcode access is being set up. Please ask the tool store."
        fields = '<button type="button" id="refresh">Refresh availability</button>'
    return f'''<!doctype html>
<html lang="en-AU"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#101419"><meta name="referrer" content="no-referrer">
<meta name="robots" content="noindex,nofollow"><title>{title} · MyGear HQ</title>
<link rel="stylesheet" href="qr_report.css"><script defer src="qr_report.js"></script></head>
<body class="hq-shell {font_class}" data-scope="{scope}" data-setup="{int(setup)}">
<a class="skip screen-only" href="#main">Skip to content</a>
<header class="brandbar hq-topbar"><div class="frame top in">
<a class="hq-brand" href="#main" aria-label="MyGear HQ and MMG, skip to report">{brand}</a>
<div class="job hq-site"><span class="account"><b>COATES</b><small>Tool store</small></span><span class="jn">Dugald River</span></div>
</div></header>
<main id="main" class="frame wrap hq-main" tabindex="-1">
<nav class="crumbs screen-only" aria-label="Report location"><span>Dugald River</span><span class="sep" aria-hidden="true">/</span>
<span>{trail}</span><span class="sep" aria-hidden="true">/</span><span id="trail-current" aria-current="page">Lookup</span></nav>
<section id="lookup" class="entry-card hq-entry"><header class="ch intro"><p class="eyebrow">Coates tool store</p>
<h1>{title}</h1><p class="lede">{intro}</p></header>
<form id="lookup-form" class="lookup-readout readout" aria-labelledby="lookup-title" autocomplete="off">
<h2 class="readout-head" id="lookup-title">{form_title}</h2><div class="form-fields">{fields}</div></form>
<noscript>Enable JavaScript to open this report.</noscript></section>
<p id="message" class="message" role="status" aria-live="polite" aria-atomic="true"></p>
<article id="report" hidden><header class="ch report-head"><div class="hero-copy">
<p class="eyebrow">{'Your time at MMG Dugald River' if personal else 'Company record · MMG Dugald River'}</p>
<h1 id="report-heading" tabindex="-1"></h1><p class="lede" id="report-subtitle"></p>{return_jump}</div>
<a href="#current-gear" class="side hero-holding" aria-label="Jump to the current on-hire list"><span id="hero-count"></span>
<span><span id="hero-label">{'Assets on hire to you' if personal else 'Assets on hire now'}</span> <b aria-hidden="true">↘</b></span></a>
</header>
<div class="report-tools"><button type="button" id="reset">{'Finish and clear' if personal else 'Change company'}</button>
<nav class="actions" aria-label="Report actions">
<button id="print" type="button">Print</button><button id="save" type="button">Save PDF</button>
<button id="share" type="button">Share PDF</button><button id="email" type="button">Email PDF</button>
</nav></div><nav id="section-nav" class="record-links screen-only" aria-label="Report sections"></nav>
<div id="report-body"></div></article>
</main><footer class="frame foot hq-footer"><p id="pull">SiteIQ pull time available with the report.</p>
<p>Author: Andrew Fisher <span aria-hidden="true">·</span> <strong>Powered by SiteIQ</strong></p>
<small>Designed and built by Andrew Fisher · © 2026 Andrew Fisher. All rights reserved. Not to be copied or reproduced without permission.</small></footer>
<dialog id="send-dialog" aria-labelledby="send-title"><div class="dialog-head"><h2 id="send-title">Share PDF</h2>
<button id="close-dialog" type="button" aria-label="Close"></button></div>
<p id="send-status" role="status"></p><div class="dialog-actions">
<button id="native-share" class="primary" type="button" hidden>Choose an app</button>
<button id="dialog-save" type="button" disabled>Save PDF</button>
<a id="email-draft" class="button" hidden>Open email draft</a>
</div></dialog></body></html>'''
