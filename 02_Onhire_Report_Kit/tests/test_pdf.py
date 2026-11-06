"""Font validity regressions for the standard-library PDF writer."""
import importlib.util
from pathlib import Path
import struct
import unittest

spec = importlib.util.spec_from_file_location("coates_pdf", Path(__file__).resolve().parents[1] / "coates_pdf.py")
pdf = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pdf)


class EmbeddedFontTests(unittest.TestCase):
    def test_subset_sfnt_has_valid_whole_font_checksum(self):
        # Independent sum over padded uint32s, including a non-aligned table.
        font = pdf._TrueType._sfnt({"head": bytes(54), "name": b"example"})
        actual = sum(struct.unpack(">%dI" % (len(font) // 4), font)) & 0xFFFFFFFF
        self.assertEqual(actual, 0xB1B0AFBA)
        # Per-table head checksum must exclude checkSumAdjustment.
        tag, checksum, offset, length = struct.unpack(">4sIII", font[12:28])
        self.assertEqual(tag, b"head")
        head = bytearray(font[offset:offset + length])
        head[8:12] = bytes(4)
        head.extend(bytes((-len(head)) % 4))
        expected = sum(struct.unpack(">%dI" % (len(head) // 4), head)) & 0xFFFFFFFF
        self.assertEqual(checksum, expected)


if __name__ == "__main__":
    unittest.main()
