import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import catalogue as C  # noqa: E402


class CatalogueTests(unittest.TestCase):
    def test_tool_sizes_and_drive(self):
        self.assertEqual(C.tool_size("Socket - Impact - Long 24mm 1/2in Drive"), ("Socket – Impact – Long", "1/2in", 24.0, "24mm"))
        kind, drive, val, lab = C.tool_size("Socket - Impact - 1 1/16in 1/2in Drive")
        self.assertEqual((drive, lab), ("1/2in", "1 1/16in"))
        self.assertAlmostEqual(val, 26.9875)
        self.assertEqual(C.tool_size("3/4 30MM SOCKET")[1:], ("3/4in", 30.0, "30MM".lower()))
        self.assertEqual(C.tool_size("Hammer - Chipping")[2], None)

    def test_tool_categories(self):
        self.assertEqual(C.tool_category("MOTOROLA RADIO BATTERY"), "Radios")
        self.assertEqual(C.tool_category("Tool Lanyard Swl 7Kg Technique"), "Height safety and lanyards")
        self.assertEqual(C.tool_category("Breaker - Air - Light"), "Air tools and hoses")
        self.assertEqual(C.tool_category("Grinder Angle 125mm Battery"), "Cordless tools and batteries")
        self.assertEqual(C.tool_category("Broom"), C.TOOL_OTHER)

    def test_sizes_come_out_smallest_to_largest(self):
        rows = [{"ITEM_DESCRIPTION": "Spanner - Combo (%s)" % s} for s in ("41mm", "27mm", "1 1/4", "30mm")]
        cat = C.tool_catalogue(rows, lambda r: False)[0]
        self.assertEqual([s["s"] for s in cat["kinds"][0]["sizes"]], ["27mm", "30mm", "1 1/4in", "41mm"])

    def test_consumable_sizes(self):
        self.assertEqual(C.cons_category("GLOVER,RIGGER,GWORX600-SIZE-XL/10 MMG2025"), "Gloves")
        self.assertEqual(C.cons_size("GLOVES,CUT 3,GFPR200,NON-VEND,SZ-11 MMG2025")[1:], (11.0, "Size 11"))
        self.assertEqual(C.cons_size("COVERALLS,DISP,TYPE 5/6,WH,3XL MMG2025")[2], "3XL")
        self.assertEqual(C.cons_size("FILTER,PARTICULATE,P2,2PK,2125,3M MMG2025")[1], None)


if __name__ == "__main__":
    unittest.main()
