"""Author: Andrew Fisher. Bounded phone-table presentation tests; synthetic data only."""
import os
from pathlib import Path
import re
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from staff_table834 import HEAD_ANCHOR, NEW_WRAPPER, OLD_WRAPPER, STYLE, apply


CARD = 'function eventStaffingCard833() {'
MODEL = "function eventStaffingModel833() { return {fixture: 'unchanged'}; }"
DATA = "const DATA = {fixture: 'synthetic — not an operational record'};"
OTHER_TABLE = '<div class="tblwrap"><table class="progtbl"><tr><td>Another table</td></tr></table></div>'
FIXTURE = (
    '<!doctype html><html><head><style>.existing{color:inherit}</style></head>\n<body>\n'
    '<script>\n' + DATA + '\n' + MODEL + '\n' + CARD + '\n'
    ' return `' + OLD_WRAPPER + '</tr></thead><tbody>${roster}</tbody></table></div>`;\n'
    '}\nfunction unrelated() { return "unchanged"; }\n</script>\n'
    + OTHER_TABLE + '\n</body></html>\n'
)


def restored(text):
    """Remove only the two declared output fragments, leaving every other byte intact."""
    if text.count(NEW_WRAPPER) != 1 or text.count(STYLE) != 1:
        raise AssertionError('Expected exactly one scoped wrapper and one complete stylesheet')
    return text.replace(NEW_WRAPPER, OLD_WRAPPER, 1).replace(STYLE, '', 1)


class StaffTable834Tests(unittest.TestCase):
    def test_only_the_reviewed_table_wrapper_and_stylesheet_change(self):
        actual = apply(FIXTURE)
        expected = FIXTURE.replace(OLD_WRAPPER, NEW_WRAPPER, 1).replace(HEAD_ANCHOR, STYLE + HEAD_ANCHOR, 1)
        self.assertEqual(actual, expected)
        self.assertEqual(restored(actual).encode('utf-8'), FIXTURE.encode('utf-8'))
        self.assertIn(OTHER_TABLE, actual)
        self.assertIn(MODEL, actual)
        self.assertIn(DATA, actual)
        self.assertEqual(actual.count(CARD), 1)
        self.assertEqual(actual.count('</head>'), 1)

    def test_css_changes_only_first_column_position_on_narrow_costs_table(self):
        css = re.sub(r'/\*.*?\*/', '', STYLE, flags=re.S)
        outer = re.fullmatch(r'\s*<style id="staff-table834">\s*@media\s*\(max-width:\s*640px\)\s*\{(.*)\}\s*</style>\s*', css, re.S)
        self.assertIsNotNone(outer, 'The override is confined to the requested phone breakpoint')
        rule = re.fullmatch(r'\s*([^{}]+)\{\s*position\s*:\s*static\s*;?\s*\}\s*', outer.group(1), re.S)
        self.assertIsNotNone(rule, 'There are no additional declarations or global rules')
        self.assertEqual(
            [selector.strip() for selector in rule.group(1).split(',')],
            [
                '#pane-costs .event833-table table.progtbl>thead>tr>th:first-child',
                '#pane-costs .event833-table table.progtbl>tbody>tr>td:first-child',
            ],
        )
        self.assertEqual(NEW_WRAPPER, OLD_WRAPPER.replace('class="tblwrap"', 'class="tblwrap event833-table"', 1))

    def test_reapplying_or_partially_applied_output_is_rejected(self):
        for text in [apply(FIXTURE), FIXTURE.replace(HEAD_ANCHOR, STYLE + HEAD_ANCHOR), FIXTURE.replace(OLD_WRAPPER, NEW_WRAPPER)]:
            with self.subTest(partial=text.count(STYLE)):
                with self.assertRaisesRegex(ValueError, 'already applied'):
                    apply(text)

    def test_wrong_or_ambiguous_staff_card_is_rejected(self):
        for text in [FIXTURE.replace(CARD, 'function differentCard() {'), FIXTURE + '\n' + CARD]:
            with self.subTest(count=text.count(CARD)):
                with self.assertRaisesRegex(ValueError, 'reviewed event staffing card'):
                    apply(text)

    def test_missing_or_ambiguous_table_anchor_is_rejected(self):
        for text in [FIXTURE.replace(OLD_WRAPPER, '<div>Changed card</div>'), FIXTURE + OLD_WRAPPER]:
            with self.subTest(count=text.count(OLD_WRAPPER)):
                with self.assertRaises(SystemExit):
                    apply(text)

    def test_missing_or_ambiguous_document_head_is_rejected(self):
        for text in [FIXTURE.replace(HEAD_ANCHOR, ''), FIXTURE + HEAD_ANCHOR]:
            with self.subTest(count=text.count(HEAD_ANCHOR)):
                with self.assertRaises(SystemExit):
                    apply(text)

    def test_embedded_print_documents_are_untouched(self):
        embedded = '<script>const paper="<html><head></head><body>Print</body></html>";</script>'
        original = FIXTURE + embedded
        patched = apply(original)
        self.assertTrue(patched.endswith(embedded))
        self.assertEqual(patched.count(STYLE), 1)
        self.assertEqual(restored(patched), original)

    def test_whitespace_outside_the_table_anchor_is_preserved(self):
        for indentation in ['    ', '\t  ']:
            with self.subTest(indentation=repr(indentation)):
                original = FIXTURE.replace(OLD_WRAPPER, '\n' + indentation + OLD_WRAPPER, 1)
                self.assertEqual(restored(apply(original)), original)

    @unittest.skipUnless(os.environ.get('BASE'), 'Set BASE to a private reviewed page for whole-page byte preservation')
    def test_private_base_preserves_every_other_source_and_data_byte(self):
        original_bytes = Path(os.environ['BASE']).read_bytes()
        original = original_bytes.decode('utf-8')
        patched = apply(original)
        self.assertEqual(patched.count(NEW_WRAPPER), 1)
        self.assertEqual(patched.count(STYLE), 1)
        self.assertEqual(restored(patched).encode('utf-8'), original_bytes)
        self.assertEqual(patched.count('<script'), original.count('<script'))
        self.assertEqual(patched.count('</script>'), original.count('</script>'))
        with self.assertRaisesRegex(ValueError, 'already applied'):
            apply(patched)


if __name__ == '__main__':
    unittest.main()
