"""Brand the MMG sign-in while preserving the existing portal login contract."""
import base64
from pathlib import Path
from unittest.mock import patch

from test_swms import PortalHTTPCase
import server


class LoginBrand(PortalHTTPCase):
    def test_mmg_login_uses_fixed_job_logo_or_text_and_carries_login_errors(self):
        code, _, body = self.request("GET", "/login")
        self.assertEqual(code, 200)
        self.assertIn(b'<span class="brand-client">MMG</span>', body)
        self.assertIn(b'<span class="portal-site"><b>COATES</b><span>Dugald River</span></span>', body)
        self.assertIn(b'<h1>Sign in to MyGear HQ</h1>', body)
        self.assertIn(b'method="post" action="/login"', body)
        self.assertNotIn(b"Test Manager", body)
        logo = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/qooAAAAASUVORK5CYII=")
        (Path(server.JOB_DIR) / "logo.png").write_bytes(logo)
        code, _, failed = self.request("POST", "/login", body="username=unknown&password=wrong",
                                       headers={"Content-Type": "application/x-www-form-urlencoded"})
        self.assertEqual(code, 401)
        self.assertIn(b'<img src="data:image/png;base64,' + base64.b64encode(logo) + b'" alt="MMG">', failed)
        self.assertIn(b'role="alert"', failed)
        self.assertNotIn(b'password=wrong', failed)

    def test_other_project_keeps_generic_portal_heading(self):
        with patch.object(server, "is_mmg", return_value=False), patch.dict("os.environ", {"PORTAL_NAME":"Example Tool Store"}):
            code, _, body = self.request("GET", "/login")
        self.assertEqual(code, 200)
        self.assertIn(b'<div class="brand">COATES</div>', body)
        self.assertIn(b'<h1>Sign in to the Example Tool Store</h1>', body)
        self.assertNotIn(b"brand-lockup", body)
        self.assertNotIn(b"MMG", body)
