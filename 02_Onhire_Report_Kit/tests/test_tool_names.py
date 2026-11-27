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


    def test_the_clients_own_gear_says_so(self):
        import csv
        import tempfile
        data = {"tools": {"RADIO": {"name": "Radio", "own": "MMG"}, "BROOM": {"name": "Broom", "own": "Coates"}},
                "kinds": [], "tools_util": [], "onhire": [{"desc": "Radio"}, {"desc": "Broom"}], "tagged": {"groups": []}, "people": []}
        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, newline="", encoding="utf-8") as f:
            csv.writer(f).writerows([["SiteIQ description", "Plain name"], ["Radio", "Radio - Handheld"], ["Broom", "Broom"]])
        try:
            build_showcase.plain_tool_names(data, f.name)
        finally:
            os.unlink(f.name)
        self.assertEqual(data["tools"]["RADIO"]["name"], "Radio - Handheld (MMG Owned)")
        self.assertEqual(data["tools"]["BROOM"]["name"], "Broom")
        self.assertEqual([r["desc"] for r in data["onhire"]], ["Radio - Handheld (MMG Owned)", "Broom"])

    def test_two_descriptions_with_one_name_become_one_tool(self):
        import csv
        import tempfile
        data = {"tools": {"LEAD 10A": {"name": "Lead 10A", "site": 6, "on": 1, "best": 5, "var": "A", "pic": None},
                          "LEAD NEOPRENE 10A": {"name": "Lead Neoprene 10A", "site": 1, "on": 2, "best": 1, "var": "B", "pic": 3}},
                "kinds": [{"name": "Lead 10A", "on": 1, "fleet": 6}, {"name": "Lead Neoprene 10A", "on": 2, "fleet": 1}], "tools_util": [],
                "onhire": [{"desc": "Lead Neoprene 10A", "dk": "LEAD NEOPRENE 10A"}], "tagged": {"groups": [{"kinds": [{"name": "Lead 10A", "n": 6}, {"name": "Lead Neoprene 10A", "n": 1}]}]},
                "people": [], "cat": {"tools": [{"kinds": [{"name": "x", "n": 7, "o": 3, "sizes": [], "d": ["LEAD 10A", "LEAD NEOPRENE 10A"]}]}]}}
        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, newline="", encoding="utf-8") as f:
            csv.writer(f).writerows([["SiteIQ description", "Plain name"], ["Lead 10A", "Extension Lead - 10A"], ["Lead Neoprene 10A", "Extension Lead - 10A"]])
        try:
            build_showcase.plain_tool_names(data, f.name)
        finally:
            os.unlink(f.name)
        self.assertEqual(list(data["tools"]), ["LEAD 10A"])
        self.assertEqual(data["tools"]["LEAD 10A"], {"name": "Extension Lead - 10A", "site": 7, "on": 3, "best": 5, "var": "A, B", "pic": 3})
        self.assertEqual(data["onhire"][0]["dk"], "LEAD 10A")                      # the item on hire points at the one tool
        self.assertEqual([(k["name"], k["on"], k["fleet"]) for k in data["kinds"]], [("Extension Lead - 10A", 3, 7)])
        self.assertEqual(data["tagged"]["groups"][0]["kinds"], [{"name": "Extension Lead - 10A", "n": 7}])
        self.assertEqual(data["cat"]["tools"][0]["kinds"][0]["d"], ["LEAD 10A"])



class ConsumableNames(unittest.TestCase):
    def test_house_style(self):
        import catalogue
        for raw, want in (
            ("Wheel, abrasive, cut-off, 127x1x22mm", "Wheel - Abrasive - Cut-Off - 127 x 1 x 22mm"),
            ("Tape, barricade, red/wht, 75mmx50m", "Tape - Barricade - Red/White - 75mm x 50 Metre"),
            ("Gloves, cut 3, GFPR200, non-vend, size 10", "Gloves - Cut 3 - GFPR200 - Non-Vend - Size 10"),
            ("Sling, endless, rnd, 1T, 3m, WRS-010-030-E", "Sling - Endless - Round - 1T - 3 Metre - WRS-010-030-E"),
            ("Respirator, medium, 7502 70071042785, 3m", "Respirator - Medium - 7502 70071042785 - 3M"),
            ("Disc, flap, zirconia, 127, x, 22mm, 80, grit", "Disc - Flap - Zirconia - 127 x 22mm - 80 Grit"),
        ):
            self.assertEqual(catalogue.house_cons(raw), want)
            self.assertEqual(catalogue.house_cons(want), want)          # running it twice changes nothing


class IndividualOwnerTests(unittest.TestCase):
    def test_identically_described_assets_keep_their_own_owner(self):
        import build_showcase
        data = {'tools': {'RADIO': {'name':'Radio', 'own':'Coates'}},
                'onhire': [{'desc':'Radio', 'own':o} for o in ['MMG', 'Coates', '', 'Contractor']]}
        build_showcase._apply_tool_names(data, {'RADIO':'Radio - Motorola'})
        self.assertEqual([r['desc'] for r in data['onhire']],
                         ['Radio - Motorola (MMG Owned)', 'Radio - Motorola', 'Radio - Motorola', 'Radio - Motorola (Contractor Owned)'])


if __name__ == "__main__":
    unittest.main()
