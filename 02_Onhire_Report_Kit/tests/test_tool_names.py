"""draft_tool_names: plain names reorder SiteIQ's own words and add none."""
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import build_showcase  # noqa: E402
from draft_tool_names import plain  # noqa: E402


class PlainNames(unittest.TestCase):
    def test_sockets(self):
        for raw, want in (
            ("Socket - Impact - Long 24mm 1/2in Drive", "24mm long impact socket, 1/2in drive"),
            ("Socket - Impact - Long 30mm 3/4in Dr", "30mm long impact socket, 3/4in drive"),
            ("Socket - Impact - 1 1/2in 3/4in Drive", "1 1/2in impact socket, 3/4in drive"),
            ("Socket - Impact - Long 1-1/16-3/4in Drive", "1 1/16in long impact socket, 3/4in drive"),
            ("Socket - 1/2inch Drive - Metric - 12mm", "12mm socket, 1/2in drive"),
            ("Socket - Impact -Extension - 1in - Drive - 250mm", "250mm impact extension bar, 1in drive"),
            ("Socket - Breaker Bar - 3/4in Drive", "Breaker bar, 3/4in drive"),
            ("1 Inch 41Mm Socket", "41mm socket, 1in drive"),
        ):
            self.assertEqual(plain(raw), want)

    def test_spanners(self):
        for raw, want in (
            ("Spanner - Combo (25mm)", "25mm combination spanner"),
            ("Spanner - Combo 1 - 1/16", "1 1/16in combination spanner"),
            ("Spanner - Flogging - Flat - 3inch", "3in flat flogging spanner"),
            ("Spanner - Shifter - 375mm (15in )", "375mm shifter (15in)"),
            ("Spanner - Podger - Ratchet - 21mm / 24mm", "21mm / 24mm ratchet podger spanner"),
        ):
            self.assertEqual(plain(raw), want)

    def test_everything_else_keeps_its_words(self):
        self.assertEqual(plain("Hammer - Ball Pein - 16 Oz"), "16oz ball pein hammer")
        self.assertEqual(plain("Pliers - Long Nose"), "Long nose pliers")
        self.assertEqual(plain("Broom"), "Broom")

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
        self.assertEqual(data["tools"]["HAMMER - CLAW"], {"name": "Claw hammer", "raw": "Hammer - Claw"})
        self.assertEqual(data["tools"]["BROOM"]["name"], "Broom")           # not on the list: as SiteIQ has it
        self.assertEqual(data["kinds"][0], {"name": "Claw hammer", "dk": "HAMMER - CLAW"})
        self.assertEqual(data["onhire"][0], {"desc": "Claw hammer", "raw": "Hammer - Claw"})


if __name__ == "__main__":
    unittest.main()
