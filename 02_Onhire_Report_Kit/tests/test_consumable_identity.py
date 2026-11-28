import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from consumable_usage import description_matches, product_description


def product(code, name, barcode="", unit=""):
    return {"sku": code, "name": name, "product_barcode": barcode, "unit": unit}


class ConsumableIdentity(unittest.TestCase):
    def test_unique_names_and_barcode_with_site_tags(self):
        today = [product("new", "Visor,Faceshield,Clear.MMG", "10097538MMG")]
        old = [product("historic", "MMG VISOR, FACESHIELD, CLR", "10097538"),
               product("other", "VISOR,FACESHIELD,INDUST,CLR,230X400MM")]
        alias = description_matches(today, old, {row["sku"] for row in old})["new"]
        self.assertEqual(alias, {"match_method":"barcode", "source_sku":"historic", "source_name": old[0]["name"]})
        old[0]["product_barcode"] = "MMG117"
        self.assertEqual(description_matches(today, old, {"historic","other"})["new"]["match_method"], "description")
        for a,b in [("2XLMMG2025","2XL"), ("252,SIKA 2MMG2025", "252, SIKA 2024MMG")]:
            self.assertEqual(product_description(a), product_description(b))

    def test_conflicting_ambiguous_or_already_counted_stock(self):
        current = [product("new", "A,1.5MM", "2025MMG10000001")]
        old = product("old", "MMG A, 1.5MM", "10000001")
        self.assertFalse(description_matches(current, [old], {"new","old"}))
        self.assertFalse(description_matches(current, [old,{**old, "sku":"other"}], {"old","other"}))
        self.assertFalse(description_matches(current+[dict(current[0], sku="b")], [old], {"old"}))
        self.assertFalse(description_matches(current+[product("old","Different")], [old], {"old"}))
        for extra in [{"product_barcode":"10000099"}, {"unit":"box"}, {"name":"A,15MM"}, {"name":"A,1.5MM BOX/10"}]:
            self.assertFalse(description_matches(current, [{**old, **extra}], {"old"}))
        self.assertNotEqual(product_description(".5mm"), product_description("5mm"))
