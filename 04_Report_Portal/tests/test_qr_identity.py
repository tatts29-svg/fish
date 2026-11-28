import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from qr_identity import IdentityIndex, ambiguous_people, matched_pairs


def person(name='Taylor Smith', company='Mine Crew', badge='worker-1', **extra):
    return dict(hirer=name, company=company, barcode=badge, **extra)


def fact(name, employer='MINE CREW', native=''):
    return dict(hirer=name, employer=employer, company='Presentation name', hirer_id=native)


class CurrentIdentity(unittest.TestCase):
    def test_single_raw_spelling_resolves_only_on_raw_employer(self):
        owner = person()
        row = fact('TAYLOR   -  Smith')
        other = fact('Taylor Smith', 'Another Company')
        blank = dict(other, employer='', company='Mine Crew')
        index = IdentityIndex({'hires': [row, other, blank]}, [owner])
        self.assertEqual(index.match(owner), {('TAYLOR   -  Smith', 'MINE CREW')})
        self.assertTrue(index.has_activity(owner))
        self.assertFalse(index.has_activity(person('Taylor Smith', 'PRESENTATION NAME')))
        self.assertEqual(index.match(owner, resolve_spelling=False), set())

    def test_zero_activity_and_rejected_are_different(self):
        owner = person()
        self.assertEqual(matched_pairs({}, owner, [owner]), set())
        for rejected in [dict(owner, active=False), dict(owner, inactive=True), dict(owner, conflicting=True)]:
            index = IdentityIndex({'hires': [fact('Taylor Smith')]}, [rejected])
            self.assertIsNone(index.match(rejected))
            self.assertTrue(index.has_activity(rejected))

    def test_native_separators_join_only_when_independent_source_kinds_support_them(self):
        owner = person()
        rental = fact('Taylor - Smith')
        move = fact('TAYLOR SMITH')
        sale = fact('Taylor Smith', 'Mine Crew')
        D = {'hires':[rental], 'movements':[move], 'draws':[sale], 'workers':[rental, move, sale]}
        expected = {(r['hirer'], r['employer']) for r in D['workers']}
        self.assertEqual(matched_pairs(D, owner, [owner]), expected)
        self.assertEqual(matched_pairs(dict(D, workers=[]), owner, [owner]), expected)
        for disputed in [
            dict(D, hires=[rental, move]),
            dict(D, draws=[sale, move]),
            dict(D, workers=D['workers'] + [fact('tAYLOR sMITH')]),
            dict(D, hires=[move], movements=[rental]),
            {'workers': [rental, move]},
            {'draws': [sale], 'movements': [move]},
        ]:
            self.assertIsNone(matched_pairs(disputed, owner, [owner]))

    def test_real_hyphens_and_employer_punctuation_are_preserved(self):
        owner = person('Taylor Jones-Smith', 'Mine-Crew')
        other = person('Taylor Jones Smith', 'Mine Crew', 'worker-2')
        rows = [fact('Taylor - Jones-Smith', 'Mine-Crew'), fact('Taylor - Jones Smith', 'Mine Crew'),
                fact('Taylor Jones Smith', 'Mine-Crew'), fact('Jones-Smith Taylor', 'Mine-Crew'),
                fact('Taylor- Jones-Smith', 'Mine-Crew'), fact('Taylor Jones-Smith -', 'Mine-Crew')]
        expected = {('Taylor - Jones-Smith', 'Mine-Crew')}
        self.assertEqual(matched_pairs({'hires':rows}, owner, [owner, other]), expected)

    def test_multiple_stable_ids_including_one_missing_from_summary_prevent_a_match(self):
        owner = person(hirer_id='a')
        rental = fact('Taylor - Smith', native='a')
        sale = fact('Taylor Smith', native='b')
        self.assertIsNone(matched_pairs({'workers':[rental], 'hires':[rental], 'draws':[sale]}, owner, [owner]))
        self.assertIsNone(matched_pairs({'hires':[fact('Taylor Smith', native='b')]}, owner, [owner]))
        self.assertIsNone(matched_pairs({'hires':[rental, fact('Other Person', native='a')]}, owner, [owner]))

    def test_correlated_stable_id_or_reviewed_aliases_only(self):
        owner = person()
        raw = [fact('Taylor SMITH', native='id-one'), fact('taylor smith', native='id-one')]
        expect = {(r['hirer'], r['employer']) for r in raw}
        index = IdentityIndex({'workers':raw}, [owner])
        self.assertEqual(index.match(owner), expect)
        self.assertEqual(index.native_ids(expect), {'id-one'})
        raw[1]['hirer_id'] = ''
        self.assertIsNone(matched_pairs({'workers':raw}, owner, [owner]))
        reviewed = dict(owner, aliases=[dict(hirer=n, company=c) for n,c in expect])
        self.assertEqual(matched_pairs({'workers':raw}, reviewed, [reviewed]), expect)

    def test_collisions_across_an_entire_roster_and_incomplete_claims(self):
        owner = person()
        other = person('Different Person', 'Other Employer', 'worker-1')
        absent = person('Outsider', 'Other Employer', 'other')
        known = (owner['hirer'],owner['company'])
        for alternative in [other, person(' taylor SMITH ', badge='different'),
                            person('Taylor - Smith',badge='worker-1'),
                            dict(other, hirer=''), dict(other,company='')]:
            index = IdentityIndex({'hires':[fact('Taylor - Smith')]}, [owner, alternative, absent])
            self.assertIn(known,index.ambiguous)
            self.assertIsNone(index.match(owner))
            self.assertEqual(index.match(absent),set())
        case_only_badge = dict(other, barcode='WORKER-1')
        self.assertFalse(ambiguous_people([owner,case_only_badge]))

    def test_duplicate_rows_and_verified_aliases_do_not_collide_with_their_owner(self):
        owner = person()
        self.assertFalse(ambiguous_people([owner, dict(owner)]))
        alias = dict(hirer='Taylor Smith', company='Alias Mine Ltd')
        owner['aliases'] = [alias]
        self.assertEqual(matched_pairs({'workers':[fact('Taylor Smith', 'Alias Mine Ltd')]},owner,[owner]), {('Taylor Smith','Alias Mine Ltd')})
        second = person('Other Worker','Alias Mine Ltd','worker-2',aliases=[alias])
        self.assertEqual(ambiguous_people([owner,second]), {('Taylor Smith','Mine Crew'),('Other Worker','Alias Mine Ltd')})

    def test_shared_native_or_reviewed_ids_never_bridge_distinct_primary_claimants(self):
        for field in ('hirer_id','person_id'):
            owner = person(**{field:'verified-1'})
            other = person('Other Worker',badge='worker-2', **{field:'verified-1'})
            self.assertEqual(ambiguous_people([owner,other]), {('Taylor Smith','Mine Crew'),('Other Worker','Mine Crew')})
            same = dict(owner,barcode='worker-3')
            self.assertEqual(ambiguous_people([owner,same]),set())
            contradictory = dict(owner, **{field:'verified-2'})
            self.assertEqual(ambiguous_people([owner,contradictory]),{('Taylor Smith','Mine Crew')})


if __name__ == '__main__':
    unittest.main()
