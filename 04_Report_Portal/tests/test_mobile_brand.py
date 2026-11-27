"""The home-screen identity is public, scoped to MMG and independent of report builds."""
from io import BytesIO
import json
from unittest.mock import patch

from PIL import Image

from test_swms import PortalHTTPCase
import mobile_brand as mobile
import server


class MobileIdentity(PortalHTTPCase):
    def test_android_identity_revalidation_and_legacy_routes(self):
        code, headers, body = self.request("GET", "/manifest.webmanifest?v=from-shortcut")
        self.assertEqual((code, headers["Cache-Control"]), (200, "public, no-cache"))
        manifest = json.loads(body)
        self.assertEqual([manifest[key] for key in ("id", "start_url", "scope")], ["/"] * 3)
        self.assertEqual(manifest["display"], "standalone")
        for key in ("name", "short_name"):
            self.assertIn("MyGear HQ", manifest[key])
            self.assertIn("MMG", manifest[key])
        self.assertEqual([i["purpose"] for i in manifest["icons"]], ["any", "any", "maskable"])
        icons = []
        for item in manifest["icons"]:
            code, headers, png = self.request("GET", item["src"])
            self.assertEqual((code, headers["Content-Type"]), (200, "image/png"))
            size = int(item["sizes"].split("x")[0])
            with Image.open(BytesIO(png)) as icon:
                self.assertEqual((icon.format, icon.size, icon.mode), ("PNG", (size, size), "RGB"))
            if item["purpose"] == "any":
                self.assertEqual(self.request("GET", f"/mobile/icon-{size}.png")[2], png)
            self.assertEqual(self.request("GET", item["src"], headers={"If-None-Match": headers["ETag"]})[0], 304)
            icons.append(png)
        self.assertNotEqual(icons[1], icons[2])
        self.assertEqual(self.request("GET", "/")[0], 303)
        self.assertEqual(self.request("GET", "/upload/status")[0], 303)

    def test_iphone_install_shortcut_splash_and_browser_favicon(self):
        for path in ("/install", "/login"):
            code, _, page = self.request("GET", path)
            self.assertEqual(code, 200)
            self.assertIn(mobile.MOBILE_HEAD.encode(), page)
            self.assertNotIn(b'content="MMG Tool Store"', page)
        for alias in ("/mobile/icon-180.png", "/apple-touch-icon.png", "/apple-touch-icon-precomposed.png"):
            self.assertEqual(self.request("GET", alias)[2], self.request("GET", "/mobile/mygear-mmg-180.png")[2])
        self.assertEqual(Image.open(BytesIO(self.request("GET", "/favicon.ico")[2])).format, "ICO")
        for width, height in ((1170, 2532), (2532, 1170)):
            name = f"/mobile/startup-{width}x{height}.png"
            self.assertIn(name, mobile.MOBILE_HEAD)
            code, _, asset = self.request("GET", name)
            self.assertEqual(code, 200)
            with Image.open(BytesIO(asset)) as launch:
                self.assertEqual(launch.size, (width, height))
                self.assertEqual(launch.getpixel((0, 0)), (16, 20, 25))
                self.assertGreater(len(launch.crop((width//2-100, height//2-100, width//2+100, height//2+100)).getcolors(40000)), 20)
        self.assertEqual(self.request("GET", "/mobile/startup-99999x99999.png")[0], 404)
        with patch.object(server, "is_mmg", return_value=False):
            for path in ("/install", "/manifest.webmanifest", "/mobile/icon-180.png", "/favicon.ico"):
                self.assertEqual(self.request("GET", path)[0], 404)

    def test_upgrade_prebuilt_reports_without_rebuilding_stock(self):
        legacy = b"""<html><head></head><body>
<a href="/install">Add MMG Tool Store to your home screen</a>
<script>
  document.head.insertAdjacentHTML('beforeend','<link rel="manifest" href="/manifest.webmanifest"><meta name="apple-mobile-web-app-title" content="MMG Tool Store">');
</script></body></html>"""
        upgraded = mobile.web_report_html(legacy)
        self.assertIn(mobile.MOBILE_HEAD.encode(), upgraded)
        self.assertNotIn(b'MMG Tool Store', upgraded)
        self.assertEqual(mobile.web_report_html(upgraded), upgraded)
        self.assertEqual(upgraded.count(b'rel="manifest"'), 1)
        report = self.root / "report.html"
        report.write_bytes(legacy)
        code, headers, served = self.request("GET", "/", "client")
        self.assertEqual((code, headers["Cache-Control"]), (200, "no-store"))
        self.assertIn(mobile.MOBILE_HEAD.encode(), served)
        self.assertEqual(report.read_bytes(), legacy)
