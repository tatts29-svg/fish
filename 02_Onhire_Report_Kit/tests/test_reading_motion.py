"""Exercise the actual dashboard counter and glass on a browser clock."""
import shutil
import unittest
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    sync_playwright = None


@unittest.skipUnless(sync_playwright and shutil.which("chromium"), "Chromium and Playwright needed")
class ReadingMotion(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        page = (Path(__file__).resolve().parents[1] / "showcase_page.html").read_text()
        code = page[page.index("function createReadingMotion(){"): page.index("/* Run continuous glass motion")]
        cls.html = """<div data-motion-gauge id="gauge">
        <span data-motion-value="65" data-motion-suffix="%">65%</span></div>
        <span data-motion-value="0">0</span><span data-motion-value="99">&gt;99%</span>
        <svg viewBox="0 0 180 40"><g id="column" data-motion-gauge>
        <text x="0" y="20" data-motion-value="27" data-motion-suffix=" at 07:00">27 at 07:00</text></g></svg>
        <b id="barcode">10014377</b><script>""" + code + """
        window.motion=createReadingMotion();motion.register(document.body,true);
        </script>"""
        cls.pw = sync_playwright().start()
        try:
            cls.browser = cls.pw.chromium.launch(executable_path=shutil.which("chromium"),
                                                 args=["--no-sandbox", "--disable-dev-shm-usage"])
        except Exception:
            cls.pw.stop()
            raise

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def open(self, motion="no-preference"):
        page = self.browser.new_page(reduced_motion=motion)
        self.addCleanup(page.close)
        page.set_content(self.html)
        return page

    def test_reading_tracks_the_same_fill_and_restores_its_exact_text(self):
        page = self.open()
        share, value, final, hidden = page.wait_for_function("""()=>{
          const gauge=document.querySelector('#gauge');
          const p=Number(gauge.style.getPropertyValue('--motion-progress'));
          if(!(p>.1 && p<.95))return false;
          return [p, gauge.querySelector('.reading-frame').dataset.frame,
            gauge.querySelector('.reading-final').textContent,
            gauge.querySelector('.reading-frame').getAttribute('aria-hidden')];
        }""", polling="raf").json_value()
        self.assertAlmostEqual(int(value.rstrip("%")), share * 65, delta=1)
        self.assertEqual((final, hidden), ("65%", "true"))
        page.wait_for_function("()=>!document.querySelector('#gauge .reading-frame')")
        self.assertEqual(page.locator("#gauge").inner_text(), "65%")
        page.evaluate("motion.register(document.body,true)")
        self.assertFalse(page.locator("#gauge").evaluate("el=>el.style.getPropertyValue('--motion-progress')==='0'"))
        self.assertEqual(page.locator("#barcode").inner_text(), "10014377")

    def test_chart_labels_move_the_measure_and_keep_the_hour(self):
        page = self.open()
        frame, exact = page.wait_for_function(r"""()=>{
          const visual=document.querySelector('#column .reading-svg-frame');
          if(!visual || !/^[1-9]\d? at 07:00$/.test(visual.textContent))return false;
          return [visual.textContent, document.querySelector('#column .reading-svg-final').textContent];
        }""", polling="raf").json_value()
        self.assertLess(int(frame.split()[0]), 27)
        self.assertEqual(exact, "27 at 07:00")
        page.evaluate("window.dispatchEvent(new Event('beforeprint'))")
        self.assertEqual(page.locator("#column text").count(), 1)
        self.assertEqual(page.locator("#column text").text_content(), exact)

    def test_reduced_motion_and_print_keep_the_final_reading(self):
        quiet = self.open("reduce")
        self.assertEqual(quiet.locator(".reading-frame").count(), 0)
        self.assertEqual(quiet.locator("#gauge").inner_text(), "65%")
        page = self.open()
        page.wait_for_selector(".reading-frame", state="attached")
        page.evaluate("window.dispatchEvent(new Event('beforeprint'))")
        self.assertEqual(page.locator(".reading-frame").count(), 0)
        self.assertEqual(page.locator("#gauge").inner_text(), "65%")
        self.assertEqual(page.locator("[data-motion-value='99']").inner_text(), ">99%")
