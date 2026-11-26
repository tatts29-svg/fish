"""draft_tool_names: SiteIQ's own words set out in the house style."""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import build_showcase  # noqa: E402
from draft_tool_names import draft  # noqa: E402


class HouseStyle(unittest.TestCase):
    def test_sockets(self):
        for raw, want in (
            ("Socket - Impact - Long 24mm 3/4in Dr", "Socket - Impact - Long - 24mm - 3/4 Inch Drive"),
            ("Socket - Impact - Long 1-3/16-3/4in Drive", "Socket - Impact - Long - 1 3/16 Inch (30.2mm) - 3/4 Inch Drive"),
            ("Socket - 1/2inch Drive - Metric - 12mm", "Socket - Metric - 12mm - 1/2 Inch Drive"),
            ("Socket - Impact -Extension - 1in - Drive - 150mm", "Socket - Impact - Extension - 150mm - 1 Inch Drive"),
            ("Socket Adaptor 1/2in To 3/4in Drive", "Socket - Adaptor - 1/2 Inch to 3/4 Inch Drive"),
            ("Socket - Breaker Bar - 3/4in Drive", "Socket - Breaker Bar - 3/4 Inch Drive"),
            ("1 Inch 41Mm Socket", "Socket - Metric - 41mm - 1 Inch Drive"),
        ):
            self.assertEqual(draft(raw), want)

    def test_spanners(self):
        for raw, want in (
            ("Spanner - Combo (25mm)", "Spanner - Combo - 25mm"),
            ("Spanner - Combo 1 - 9/16", "Spanner - Combo - 1 9/16 Inch (39.7mm)"),
            ("Spanner - Flogging - 2 1/4inch", "Spanner - Flogging - 2 1/4 Inch (57.2mm)"),
            ("Spanner - Shifter - 375mm (15in )", "Spanner - Shifter - 375mm (15 Inch)"),
            ("Spanner - Podger - Ratchet - 21mm / 24mm", "Spanner - Podger - Ratchet - 21mm / 24mm"),
        ):
            self.assertEqual(draft(raw), want)

    def test_everything_else_keeps_its_words(self):
        self.assertEqual(draft("Spirit Level 400mm"), "Spirit Level - 400mm")
        self.assertEqual(draft("Straight Edge - 1M"), "Straight Edge - 1 Metre")
        self.assertEqual(draft("Broom"), "Broom")

    def test_a_blank_variant_never_takes_an_approved_name(self):
        import csv
        import json
        import tempfile
        import draft_tool_names
        d = tempfile.mkdtemp()
        page, idx, out = (os.path.join(d, n) for n in ("r.html", "i.csv", "o.csv"))
        tools = {"RADIO": {"name": "Radio", "site": 2, "var": None}, "BROOM": {"name": "Broom", "site": 1, "var": "BRM"}}
        open(page, "w", encoding="utf-8").write("const D=" + json.dumps({"tools": tools}) + ";")
        with open(idx, "w", newline="", encoding="utf-8") as f:
            csv.writer(f).writerows([["Product variant", "Item"], ["", "Something Else"], ["BRM", "Broom - Yard"]])
        draft_tool_names.main([page, out, "--approved", idx])
        got = {r["SiteIQ description"]: (r["Plain name"], r["Source"]) for r in csv.DictReader(open(out, encoding="utf-8-sig"))}
        self.assertEqual(got, {"Radio": ("Radio", "Drafted"), "Broom": ("Broom - Yard", "Approved")})

    def test_the_list_is_applied_and_the_original_kept(self):
        import csv
        import tempfile
        data = {"tools": {"HAMMER - CLAW": {"name": "Hammer - Claw"}, "BROOM": {"name": "Broom"}},
                "kinds": [{"name": "Hammer - Claw"}], "tools_util": [], "onhire": [{"desc": "Hammer - Claw"}], "tagged": {"groups": []}, "people": []}
        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, newline="", encoding="utf-8") as f:
            csv.writer(f).writerows([["SiteIQ description", "Plain name"], ["Hammer - Claw", "Claw hammer"]])
        try:
            build_showcase.plain_tool_names(data, f.name)
        finally:
            os.unlink(f.name)
        self.assertEqual(data["tools"]["HAMMER - CLAW"], {"name": "Claw hammer"})        # the SiteIQ wording is not kept
        self.assertEqual(data["tools"]["BROOM"]["name"], "Broom")           # not on the list: as SiteIQ has it
        self.assertEqual(data["kinds"][0], {"name": "Claw hammer", "dk": "HAMMER - CLAW"})
        self.assertEqual(data["onhire"][0], {"desc": "Claw hammer"})

    def test_a_group_takes_the_name_its_tools_share(self):
        self.assertEqual(build_showcase._shared_name(["Socket - Impact - Long - 30mm - 3/4 Inch Drive", "Socket - Impact - Long - 32mm - 3/4 Inch Drive"]),
                         "Socket - Impact - Long - 3/4 Inch Drive")
        self.assertEqual(build_showcase._shared_name(["Spanner - Combo - 25mm", "Spanner - Combo - 1 Inch (25.4mm)"]), "Spanner - Combo")
        self.assertEqual(build_showcase._shared_name(["Broom"]), "Broom")


if __name__ == "__main__":
    unittest.main()
