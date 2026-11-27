"""Run manually with Playwright and Chromium: python tests/qr_privacy_browser.py.

Exercises the real scoped report UI with synthetic SiteIQ data and a controlled
browser clock. No credentials, production report, or external services are used.
"""
import os
from pathlib import Path
import shutil
import sys
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

APP = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(APP))
from test_qr_reports import ScopedReports
import qr_access
import qr_reports
import qr_views


def exercise(browser, scope, fixture):
    ctx = browser.new_context(viewport={"width":390,"height":844}, reduced_motion="reduce")
    page = ctx.new_page()
    page.clock.install()
    supplied = []
    errors = []
    downloads = []
    page.on("download",lambda download: downloads.append(download.suggested_filename))
    page.on("pageerror",lambda error: errors.append(str(error)))
    choices = qr_reports.companies(fixture.dir)
    badge = fixture.person["barcode"]
    company_id = choices["companies"][0]["id"]
    report = qr_reports.personal(fixture.dir,badge) if scope == "personal" else qr_reports.company(fixture.dir, company_id)
    base = f"https://example.test/qr/{scope}/"
    def route(r):
        parsed = urlsplit(r.request.url)
        name = parsed.path.split("/")[-1]
        assert parsed.hostname == "example.test"
        assert badge not in r.request.url
        if parsed.path in ("/mobile/mygear-mmg-32.png","/mobile/mygear-mmg-180.png"):
            return r.fulfill(path=APP/"mobile"/name,content_type="image/png")
        if parsed.path == "/before":
            return r.fulfill(body="<p>Previous page</p>", content_type="text/html")
        if not name:
            return r.fulfill(body=qr_views.page(scope,job_dir=fixture.dir),content_type="text/html",
                             headers={"Content-Security-Policy":qr_access.CSP})
        if name in ("qr_report.js","qr_report.css","qr_motion.js"):
            return r.fulfill(path=APP/name,content_type="text/javascript" if name.endswith(".js") else "text/css")
        if name == "companies":
            return r.fulfill(json=choices)
        if name == "report":
            supplied.append(r.request.method)
            return r.fulfill(json=report)
        if name == "report.pdf":
            return r.fulfill(body=b"%PDF-1.7\nTest file\n%%EOF",content_type="application/pdf")
        raise AssertionError(parsed.path)
    ctx.route("**/*",route)
    page.goto("https://example.test/before")
    page.goto(base)
    field = page.locator("#identity")
    def choose():
        if scope == "personal":
            field.fill(badge)
        else:
            field.select_option(company_id)
    def open_report():
        choose()
        page.locator("#lookup-form button[type=submit]").click()
        expect(page.locator("#report-heading")).to_have_text(report["name"])
    def cleansed():
        expect(page.locator("#report")).to_be_hidden()
        expect(field).to_have_value("")
        for selector in ("#report-heading","#hero-count","#report-body","#section-nav","#report-subtitle","#send-status"):
            assert not page.locator(selector).inner_html(), selector
        assert not page.locator("dialog[open]").count() and not urlsplit(page.url).fragment
        assert page.evaluate("localStorage.length + sessionStorage.length") == 0
        expect(page.locator("#clear-entry")).to_be_hidden()
        assert not page.locator("#email-draft").get_attribute("href")
    open_report()
    entries = page.evaluate("history.length")
    page.locator('#section-nav a[href="#past-chapters"]').click()
    assert urlsplit(page.url).fragment == "past-chapters"
    assert page.evaluate("history.length") == entries
    page.locator("#finish-report").click()
    cleansed()
    expect(page.locator("#message")).to_have_text("Screen cleared.")
    page.go_back()
    assert page.url.endswith("/before")
    page.go_forward()
    cleansed()
    # Keyboard/reading interaction at minute three extends the deadline.
    open_report()
    page.clock.fast_forward(180_000)
    page.keyboard.press("Tab")
    page.clock.fast_forward(185_000)
    expect(page.locator("#idle-dialog")).to_be_hidden()
    page.clock.fast_forward(56_000)
    expect(page.locator("#keep-open")).to_be_focused()
    page.locator("#keep-open").click()
    page.clock.fast_forward(239_000)
    expect(page.locator("#idle-dialog")).to_be_hidden()
    page.clock.fast_forward(2_000)
    expect(page.get_by_role("alertdialog")).to_be_visible()
    page.clock.fast_forward(60_000)
    cleansed()
    expect(page.locator("#message")).to_contain_text("5 minutes")
    # A submitted print remains available while the native print UI is active.
    open_report()
    page.evaluate("window.dispatchEvent(new Event('beforeprint'))")
    page.clock.fast_forward(315_000)
    expect(page.locator("#report-heading")).to_have_text(report["name"])
    page.evaluate("window.dispatchEvent(new Event('afterprint'))")
    page.clock.fast_forward(241_000)
    expect(page.locator("#idle-dialog")).to_be_visible()
    page.locator("#finish-idle").click()
    cleansed()
    # Simulate a suspended background that did not run its timer callbacks.
    open_report()
    page.evaluate("Object.defineProperty(document,'hidden',{get:()=>true,configurable:true});document.dispatchEvent(new Event('visibilitychange'))")
    page.evaluate("Date.now=(()=>{const real=Date.now;return ()=>real()+301000})()")
    page.evaluate("delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))")
    cleansed()
    # Hold a report response and then a PDF response. Neither may repopulate a
    # cleared tab, start a deferred download, or leave the prepared email UI.
    page.evaluate("""() => {
        const real=window.fetch.bind(window);
        window.hold = name => {
          window.fetch = (input, opts) => {
            if (String(input).split('?')[0]!==name) return real(input, opts);
            return new Promise(resolve => {
              window.resume = () => resolve(name === 'report' ? Response.json(window.testReport)
                                      : new Response('%PDF-1.7\\n%%EOF'));
              window.heldSignal = opts.signal;
            });
          };
        };
    }""")
    page.evaluate("(r)=>{window.testReport=r;window.hold('report')}",report)
    choose()
    page.locator("#lookup-form button[type=submit]").click()
    page.locator("#clear-entry").click()
    assert page.evaluate("window.heldSignal.aborted")
    page.evaluate("window.resume()")
    cleansed()
    page.evaluate("window.hold('report.pdf')")
    open_report()
    page.locator("#email").click()
    expect(page.locator("#send-dialog")).to_be_visible()
    page.clock.fast_forward(301_000)
    assert page.evaluate("window.heldSignal.aborted")
    page.evaluate("window.resume()")
    cleansed()
    open_report()
    page.locator("#save").click()
    page.locator("#reset").click()
    assert page.evaluate("window.heldSignal.aborted")
    page.evaluate("window.resume()")
    cleansed()
    assert not downloads
    if scope == "personal":
        # Close while permission is pending: when the media device becomes
        # available its tracks must stop without restoring the retired preview.
        page.evaluate("""() => {
            navigator.mediaDevices.getUserMedia = () => new Promise(resolve => {
                window.grantCamera = () => {
                    window.stream = document.createElement("canvas").captureStream();
                    resolve(window.stream);
                }
            });
        }""")
        page.locator("#camera").click()
        page.locator("#clear-entry").click()
        page.evaluate("window.grantCamera()")
        assert page.evaluate("window.stream.getTracks().every(t=>t.readyState==='ended')")
        expect(page.locator("#scan-box")).to_be_hidden()
        cleansed()
    # The browser cache restore path must also discard partially entered data.
    choose()
    page.evaluate("window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))")
    cleansed()
    assert not errors, errors
    assert supplied
    ctx.close()


if __name__ == "__main__":
    fixture = ScopedReports()
    fixture.setUp()
    try:
        with sync_playwright() as runner:
            browser = runner.chromium.launch(executable_path=os.environ.get("CHROMIUM") or shutil.which("chromium"))
            for scope in ("personal","company"):
                exercise(browser,scope,fixture)
                print(scope, "privacy checks passed", flush=True)
            browser.close()
    finally:
        fixture.doCleanups()
