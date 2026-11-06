"""Author: Andrew Fisher. Assertion proof, not process success, decides a suite pass."""
import unittest
from assertion_evidence import assertions


class EvidenceTests(unittest.TestCase):
    def test_missing_and_zero_are_not_passes(self):
        for text in ['', 'navigation finished', 'a price was 25/25', '0/0 passed', '1/1 passed']:
            self.assertFalse(assertions('daycards', text)[0], text)

    def test_legacy_actual_formats(self):
        self.assertTrue(assertions('daycards', 'ok   one\nok   two\n2/2 passed')[0])
        self.assertTrue(assertions('printgate-phone', 'PASS one\nALL PASS 1/1')[0])
        self.assertFalse(assertions('daycards', 'ok   one\n1/2 passed')[0])
        self.assertFalse(assertions('daycards', 'ok   one\n2/2 passed')[0])

    def test_failures_override_success(self):
        for line in ['FAIL nope', '  AssertionError: bad', '{"pass":false}', '{"passed":false}']:
            self.assertFalse(assertions('daycards', 'ok   one\n1/1 passed\n' + line)[0])

    def test_map_requires_matching_complete_evidence(self):
        checks = ['assertion ' + str(i) for i in range(11)]
        log = '\n'.join('PASS ' + c for c in checks)
        evidence = {'checks': checks, 'errors': [], 'counts': {'blocked': 0}}
        self.assertTrue(assertions('interactions-phone', log, evidence)[0])
        self.assertFalse(assertions('interactions-phone', log)[0])
        self.assertFalse(assertions('integrated-desktop', log, evidence)[0])
        self.assertFalse(assertions('interactions-phone', log, {**evidence, 'checks': checks[:-1]})[0])
        self.assertFalse(assertions('interactions-phone', log, {**evidence, 'errors': ['error']})[0])
        self.assertFalse(assertions('interactions-phone', log, {**evidence, 'counts': {}})[0])
        self.assertFalse(assertions('interactions-phone', log + '\nPASS extra', evidence)[0])


if __name__ == '__main__':
    unittest.main()
