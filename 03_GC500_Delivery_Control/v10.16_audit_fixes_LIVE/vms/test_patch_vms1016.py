"""Author: Andrew Fisher. Exact lexical reader and append-only runtime patch guards."""
import unittest
from patch_vms1016 import apply

NATIVE='function gcModel925(a,options){return model925(a,nativeEnv925(options));}'
SHELL='<html><body>\n<script>'+NATIVE+'</script>\n</body>\n</html>'

class PatchGuards(unittest.TestCase):
    def test_shared_lexical_reader_and_runtime(self):
        result=apply(SHELL)
        self.assertIn('VmsAssignment1016.model(a,result)',result)
        self.assertEqual(result.count('id="vms-assignment1016-script"'),1)
    def test_refuses_repeat(self):
        with self.assertRaises(Exception):
            apply(apply(SHELL))
    def test_refuses_missing_reader(self):
        with self.assertRaises(SystemExit):
            apply(SHELL.replace(NATIVE,''))
    def test_refuses_ambiguous_reader(self):
        with self.assertRaises(SystemExit):
            apply(SHELL.replace(NATIVE,NATIVE+NATIVE))

if __name__=='__main__':
    unittest.main()
