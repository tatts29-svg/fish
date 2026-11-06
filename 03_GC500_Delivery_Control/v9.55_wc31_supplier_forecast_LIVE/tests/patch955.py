"""Author: Andrew Fisher. Strict-release/source-preservation proof."""
import hashlib,json,os,sys,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT))
from patch_v955 import patch

class Patch955(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base=Path(os.environ['BASE_PAGE']).read_text(encoding='utf-8-sig')
        cls.after=patch(cls.base)
    def test_wrong_release(self):
        with self.assertRaises(ValueError):patch(self.base.replace(" · v9.54'; /* v8.19"," · v9.53'; /* v8.19"))
    def test_reapplication(self):
        with self.assertRaises(ValueError):patch(self.after)
    def test_all_source_data_unchanged(self):
        read=lambda s:json.JSONDecoder().raw_decode(s.split('const DATA = ',1)[1])[0]
        self.assertEqual(read(self.base),read(self.after))
    def test_exact_data_declaration_unchanged(self):
        read=lambda s:s.split('const DATA = ',1)[1].split('\n',1)[0]
        self.assertEqual(read(self.base),read(self.after))
    def test_quote_authorisation_total_preserved(self):
        d=json.JSONDecoder().raw_decode(self.after.split('const DATA = ',1)[1])[0]['rehire_quotes']
        self.assertEqual(d['authorisation']['state'],'approved')
        self.assertEqual(sum(q['sub_total']+(q['delivery_charge'] or 0)+(q['pickup'] or 0) for q in d['quotes']),118575)
        line=next(l for q in d['quotes'] if q['quote']=='Q6845' for g in q['groups'] for l in g['lines'] if l['description']=='16 Pan Toilet Block')
        self.assertEqual((line['qty'],line['unit_price'],line['total_price']),(1,2750,2750))
    def test_exact_base_hash(self):
        self.assertEqual(hashlib.sha256(Path(os.environ['BASE_PAGE']).read_bytes()).hexdigest(),'84109458fde3ec9de584d411e8b87616718b0b21a2f37c32066066e684ee4d8f')

if __name__=='__main__':unittest.main()
