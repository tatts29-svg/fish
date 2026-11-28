"""Run with python tests/qr_chart_browser.py. Uses intercepted synthetic MMG records."""
from pathlib import Path
import re
import shutil
import sys
from urllib.parse import urlsplit

from playwright.sync_api import expect, sync_playwright

APP = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(APP))
import qr_reports
import qr_views
from test_qr_reports import ScopedReports


def check(browser, fixture):
    bp = browser.new_context(viewport={"width":390,"height":844}, reduced_motion="reduce")
    page = bp.new_page()
    badge = fixture.person["barcode"]
    report = qr_reports.personal(fixture.dir, badge)
    report["returns"].update(score=None, eligible=3, same_day=2)
    errors = []
    page.on("pageerror", lambda err: errors.append(str(err)))
    def route(req):
        uri = urlsplit(req.request.url)
        assert uri.hostname == "test.invalid"
        name = uri.path.rsplit("/", 1)[-1]
        if not name:
            return req.fulfill(body=qr_views.page("personal", job_dir=fixture.dir), content_type="text/html")
        if name == "report":
            return req.fulfill(json=report)
        if name.startswith("qr_") and name.endswith((".js", ".css")):
            return req.fulfill(path=APP/name)
        return req.fulfill(status=404)
    bp.route("**/*", route)
    page.goto("https://test.invalid/qr/personal/")
    def lookup():
        page.locator("#identity").fill(badge)
        page.locator("#lookup-form button[type=submit]").click()
        expect(page.locator("#report-heading")).to_have_text(report["name"])
    lookup()
    preview = page.locator("#return-preview")
    item = report["hires"][0]["items"][0]
    expect(preview).to_contain_text(item["item"])
    expect(preview).to_contain_text(item["time"])
    expect(preview.locator("a")).to_have_attribute("href", "#current-gear")
    assert preview.evaluate("element=>element.getBoundingClientRect().bottom<=innerHeight")
    expect(page.locator("#name-rating")).to_contain_text("3 of 5 qualifying hires")
    assert not page.locator("#name-rating .rating-stars").count()
    # Inspect rendered CSS geometry and the final SVG wet-layer clip, including subpixel values.
    result = page.evaluate("""() => {
        const d=document.createElement("div"), p=document.createElement("span");
        document.body.append(d,p);
        p.style.cssText="position:absolute;width:242px;height:12px;box-sizing:border-box";
        const cases=[[0,12],[1,100000],[3,12],[6,12],[9,12],[12,12],[Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER]];
        const rows=cases.map(([n,total])=>{
          MMGReportInstruments.mount(d,{issued:n,returned:total});
          const clip=d.querySelector('clipPath rect'), dial=d.querySelector('.direction-dial'), wet=dial.querySelector('.direction-water');
          MMGReportInstruments.pill(p,n,total);
          const fill=p.querySelector('.direction-pill-fill'), measuredWidth=fill?.getBoundingClientRect().width || 0;
          return {n,total,y:Number(clip.getAttribute('y')),h:Number(clip.getAttribute('height')),allWetClipped:
            wet ? wet.getAttribute('clip-path')==='url(#'+clip.parentElement.id+')' : n===0,
            width:measuredWidth / p.clientWidth,number:dial.querySelector('strong').textContent};
        });
        for(const [value,total] of [[1,0],[-3,9],[null,4],[8,5],[3,NaN]]) {
          MMGReportInstruments.pill(p,value,total);
          if(!p.classList.contains('direction-unmeasured') || p.children.length) throw Error('Unknown pill incorrectly marked');
        }
        for(const n of [null,-1,NaN,2**53]) {
          MMGReportInstruments.mount(d,{issued:n,returned:0});
          if(!d.querySelector('.direction-unmeasured') || d.querySelector('.direction-water')) throw Error('Unknown tube incorrectly marked');
        }
        const area=document.createElement('section');document.body.append(area);
        MMGStoreStory.append(area,{kind:'person',store_activity:{active_days:1,interactions:100001,timed_events:100001,
          hourly:[{hour:0,interactions:100000},{hour:1,interactions:1},{hour:2,interactions:0},{hour:3,interactions:-3}],
          busiest_hours:[2]}});
        const bars=area.querySelectorAll('.store-hour-bar');
        const clock={tiny:bars[1].getBoundingClientRect().height,full:bars[0].getBoundingClientRect().height,
          missing:area.querySelectorAll('.store-hour-unknown').length, highest:area.querySelector('.store-peak-readout').textContent};
        area.remove();d.remove();p.remove();return {rows,clock};
    }""")
    for row in result["rows"]:
        fraction = row["n"] / row["total"]
        assert abs(row["h"] - 80 * fraction) < .000001, row
        assert abs(row["y"] + row["h"] - 96) < .000001 and row["allWetClipped"], row
        assert abs(row["width"] - fraction) < 1/240, row
        assert row["number"].replace(",", "") == str(row["n"]), row
    clock = result["clock"]
    assert clock["full"] > 30 and clock["tiny"] <= .016 and clock["missing"] == 21, clock
    assert "00:00–01:00" in clock["highest"], clock
    # Inspect the painted fluid, including the light ink used by browser print.
    # A token rename must not leave a tube, pill or movement series in the old scheme.
    palette_js = """() => {
        const host=document.createElement("div");
        document.body.append(host);
        MMGReportInstruments.mount(host, {issued:3, returned:2});
        const colours = {};
        for (const role of ["issued", "returned"]) {
            const dial = host.querySelector('[data-series="'+role+'"]');
            const liquid = dial.querySelector('linearGradient[id$="-liquid"]');
            const pill = document.createElement("span");
            host.append(pill);
            MMGReportInstruments.pill(pill, 2, 3, role);
            colours[role] = {
                liquid:getComputedStyle(liquid.children[3]).stopColor,
                pill:getComputedStyle(pill.querySelector(".direction-pill-liquid")).backgroundImage,
            };
        }
        host.remove();
        return colours;
    }"""
    dark = page.evaluate(palette_js)
    for series, colour in (("issued","rgb(249, 120, 64)"), ("returned","rgb(139, 216, 167)")):
        assert dark[series]["liquid"] == colour and colour in dark[series]["pill"], dark
    page.emulate_media(media="print")
    paper = page.evaluate(palette_js)
    assert paper["issued"]["liquid"] == "rgb(185, 79, 29)", paper
    assert paper["returned"]["liquid"] == "rgb(52, 117, 78)", paper
    page.emulate_media(media="screen")
    page.emulate_media(reduced_motion="no-preference")
    page.evaluate("""() => {
      const host=document.createElement('section');
      host.id='motion-probe';host.style.cssText='position:fixed;top:0;left:0;width:200px;z-index:10';
      document.body.append(host);
      const pair=document.createElement('div'),pill=document.createElement('span');
      host.append(pair,pill);pill.style.cssText='display:block;width:200px;height:14px';
      MMGReportInstruments.mount(pair,{issued:9,returned:12});MMGReportInstruments.pill(pill,3,4);
    }""")
    probe=page.locator("#motion-probe")
    expect(probe.locator(".direction-pill")).to_have_class(re.compile("glass-seen"))
    expect(probe.locator(".direction-dials")).to_have_class(re.compile("glass-seen"))
    aligned=probe.evaluate("""p=>{
      const liquid=p.querySelector('.glass-rise'),cap=p.querySelector('.glass-cap-lift'),
        fill=p.querySelector('.direction-pill-liquid'),lens=p.querySelector('.direction-pill-lens');
      const runs=[liquid,cap,fill,lens].map(n=>n.getAnimations()[0]);
      runs.forEach(a=>a.pause());
      const span=parseFloat(getComputedStyle(cap).getPropertyValue('--glass-travel'));
      const matrix=node=>new DOMMatrixReadOnly(getComputedStyle(node).transform);
      return [150,325,650,950,1149].map(t=>{
        runs.forEach(a=>a.currentTime=t);
        return [matrix(liquid).d,1-matrix(cap).f/span,matrix(fill).a,1+matrix(lens).e/fill.parentElement.getBoundingClientRect().width];
      });
    }""")
    for row in aligned:
        assert max(row)-min(row)<.0001, row
    assert aligned[0][0]==0 and aligned[-1][0]>.9999
    probe.evaluate("e=>e.remove()")
    page.emulate_media(reduced_motion="reduce")
    # Exercise the complete report renderer and its actual daily series and star graphics.
    page.locator("#finish-report").click()
    report["returns"].update(score=2.5, eligible=8, same_day=3)
    source = next(ch for ch in report["story"] if ch["current"])
    source["activity"] = [{"date":"2026-11-26","issued":1,"returned":100000},
                          {"date":"2026-11-27","issued":None,"returned":-2}]
    lookup()
    for selector in ("#name-rating", "#return-rating"):
        assert page.locator(selector+" .rating-fill").count() == 3
        fills = page.locator(selector+" .rating-fill")
        assert float(fills.last.get_attribute("width")) == 24
        assert fills.evaluate_all("xs => xs.every(x=>getComputedStyle(x).fill === 'rgb(242, 98, 34)')")
        assert page.locator(selector+" .rating-face").count() == 5
    page.emulate_media(media="print")
    for selector in ("#name-rating", "#return-rating"):
        expect(page.locator(selector+" .rating-fill").first).to_be_visible()
        expect(page.locator(selector+" .rating-fill").first).to_have_css("fill", "rgb(242, 98, 34)")
    page.emulate_media(media="screen")
    assert page.locator(".movement-figure .chart-unavailable").count() == 2
    expect(page.locator(".movement-figure svg")).to_have_attribute("aria-label", re.compile("issued unavailable, returned unavailable"))
    bounds=page.locator(".movement-figure defs clipPath rect").evaluate_all("(rows)=>rows.map(r=>+r.getAttribute('height'))")
    assert len(bounds)==2 and abs(bounds[0]/bounds[1]-1/100000)<1e-8, bounds
    page.locator("#finish-report").click()
    report["returns"].update(score=7,eligible=8)
    lookup()
    assert not page.locator(".rating-fill,.qualifying-track").count()
    expect(page.locator("#return-rating")).to_contain_text("Rating unavailable")
    # A late section may be unable to reach the sticky header on a tall screen.
    # The tab the worker opens must remain selected even at the scroll limit.
    page.set_viewport_size({"width":3840,"height":2160})
    for target in ("return-rating", "handover", "past-chapters"):
        link=page.locator(f'#section-nav a[href="#{target}"]')
        link.click()
        expect(link).to_have_attribute("aria-current", "location")
        expect(page.locator("#"+target)).to_be_focused()
    # Only a measured aggregate counts. The final grouped value stays available
    # to assistive technology, and the temporary drawing lives inside the report.
    page.locator("#finish-report").click()
    page.emulate_media(reduced_motion="no-preference")
    page.set_viewport_size({"width":390,"height":844})
    report["hire_count"]=1234
    report["returns"].update(issues=65,returned=42)
    lookup()
    balance=page.locator("#hero-count")
    drawing=balance.locator(".measured-count-drawing")
    expect(drawing).to_have_attribute("aria-hidden","true")
    expect(balance).to_have_text("1,234")
    page.wait_for_function("""() => {
        const d=document.querySelector('#hero-count .measured-count-drawing');
        const v=Number((d?.dataset.reading || '').replaceAll(',',''));
        return v>0 && v<1234;
    }""")
    checks=page.evaluate("""() => new Promise(resolve => {
        const dials=[...document.querySelectorAll('.direction-dial')];
        const samples=[[],[]];
        const ends=performance.now()+1500;
        function compare() {
            dials.forEach((dial,i)=>{
                const n=dial.querySelector('[data-count-to]');
                const drawing=n?.querySelector('.measured-count-drawing');
                const liquid=dial.querySelector('.glass-rise');
                if (!drawing || !liquid) return;
                const fraction=new DOMMatrix(getComputedStyle(liquid).transform).d;
                if (fraction>.03 && fraction<.9999) samples[i].push([
                    Number(drawing.dataset.reading),fraction*Number(n.dataset.countTo)
                ]);
            });
            if(performance.now()>=ends) resolve(samples);
            else requestAnimationFrame(compare);
        }
        requestAnimationFrame(compare);
    })""")
    for i, samples in enumerate(checks):
        assert len(samples)>2, checks
        assert all(0<=value<[65,42][i] and abs(value-liquid)<=1.00001 for value,liquid in samples), samples
    expect(drawing).to_have_count(0)
    expect(balance).to_have_text("1,234")
    assert not page.locator("#report-heading [data-count-to], #current-gear [data-count-to]").count()
    page.locator('#section-nav a[href="#handover"]').click()
    balance.scroll_into_view_if_needed()
    expect(drawing).to_have_count(0)
    page.locator("#reset").click()
    lookup()
    expect(drawing).to_have_count(1)
    page.evaluate("window.dispatchEvent(new Event('beforeprint'))")
    expect(drawing).to_have_count(0)
    expect(balance).to_have_text("1,234")
    page.evaluate("window.dispatchEvent(new Event('afterprint'))")
    page.locator("#reset").click()
    lookup()
    expect(drawing).to_have_count(1)
    page.emulate_media(reduced_motion="reduce")
    expect(drawing).to_have_count(0)
    expect(balance).to_have_text("1,234")
    page.locator("#reset").click()
    page.emulate_media(reduced_motion="no-preference")
    lookup()
    expect(drawing).to_have_count(1)
    page.evaluate("document.getElementById('reset').click()")
    expect(balance).to_be_empty()
    expect(page.locator("#report [data-count-to]")).to_have_count(0)
    assert not errors, errors
    bp.close()


if __name__ == "__main__":
    fixture=ScopedReports()
    fixture.setUp()
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=shutil.which("chromium"),args=["--disable-background-networking"])
            check(browser,fixture)
            browser.close()
            print("Scoped gauge geometry, measurement validity and fractional ratings passed")
    finally:
        fixture.doCleanups()
