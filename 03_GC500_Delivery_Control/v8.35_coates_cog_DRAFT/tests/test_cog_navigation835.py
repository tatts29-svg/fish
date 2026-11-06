"""Author: Andrew Fisher. Exercise the real film history hook with synthetic navigation."""
import json
from pathlib import Path
import subprocess
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from cog_film835 import POP_NEW


# The existing generic navigation tail, after the other modal-dismissal handlers.
# Its duplicate-entry rule must see the old NAV state until routing takes over.
NAV_TAIL = '''
 navScrollSave();
 if (location.hash === NAV.cur && gc < (NAV.curGc || 0) && gc > 0) { NAV.curGc = gc; history.back(); return; }
 NAV.pop = true;
 route(); navBackShow();
}
'''

NODE = r'''
const fs = require('node:fs');
const vm = require('node:vm');
const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const results = input.cases.map(fixture => {
 const events = [];
 const context = {
  COG_FILM835: {dialog: fixture.dialog ? {} : null},
  location: {hash: fixture.destination},
  state: {tab: 'coatesway'},
  NAV: {cur: '#coatesway', curGc: fixture.previousGc, pop: false},
  history: {state: fixture.historyState, back() {events.push({action:'history.back'});}},
 };
 context.cogFilmClose835 = function(restoreFocus = true) {
  events.push({action:'close', restoreFocus, nav: {...context.NAV}});
  context.COG_FILM835.dialog = null;
 };
 context.navScrollSave = () => events.push({action:'saveScroll', nav:{...context.NAV}});
 context.navBackShow = () => events.push({action:'backControl', nav:{...context.NAV}});
 context.route = () => {
  events.push({action:'route', nav:{...context.NAV}});
  context.state.tab = context.location.hash.slice(1);
  context.NAV.cur = context.location.hash;
  context.NAV.curGc = typeof context.history.state?.gc === 'number' ? context.history.state.gc : 0;
  context.NAV.pop = false;
 };
 vm.createContext(context);
 vm.runInContext(input.source + input.tail + '\nonPop();', context, {timeout:1000});
 return {name:fixture.name, events, tab:context.state.tab, nav:context.NAV, dialogOpen:!!context.COG_FILM835.dialog};
});
process.stdout.write(JSON.stringify(results));
'''


class CogNavigation835Tests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cases = [
            {'name': 'single-back', 'dialog': True, 'destination': '#coatesway', 'previousGc': 2, 'historyState': {'gc': 1}},
            {'name': 'multi-back', 'dialog': True, 'destination': '#today', 'previousGc': 2, 'historyState': {'gc': 0}},
            {'name': 'no-dialog', 'dialog': False, 'destination': '#today', 'previousGc': 1, 'historyState': {'gc': 0}},
            {'name': 'closed-duplicate', 'dialog': False, 'destination': '#coatesway', 'previousGc': 3, 'historyState': {'gc': 2}},
            {'name': 'untracked-destination', 'dialog': True, 'destination': '#docs', 'previousGc': 2, 'historyState': None},
        ]
        completed = subprocess.run(
            ['node', '-e', NODE],
            input=json.dumps({'source': POP_NEW, 'tail': NAV_TAIL, 'cases': cases}),
            text=True, capture_output=True, check=True,
        )
        cls.results = {row['name']: row for row in json.loads(completed.stdout)}

    def test_single_back_closes_film_and_stays_on_its_pane(self):
        row = self.results['single-back']
        self.assertEqual([event['action'] for event in row['events']], ['close', 'backControl'])
        self.assertFalse(row['dialogOpen'])
        self.assertTrue(row['events'][0]['restoreFocus'])
        self.assertEqual(row['tab'], 'coatesway')
        self.assertEqual(row['nav'], {'cur': '#coatesway', 'curGc': 1, 'pop': False})

    def test_multi_entry_back_closes_then_routes_using_previous_navigation_state(self):
        row = self.results['multi-back']
        self.assertEqual([event['action'] for event in row['events']], ['close', 'saveScroll', 'route', 'backControl'])
        self.assertFalse(row['dialogOpen'])
        self.assertFalse(row['events'][0]['restoreFocus'], 'A changed destination must not refocus the pane being left')
        for event in row['events'][:3]:
            self.assertEqual(event['nav']['cur'], '#coatesway', event['action'])
            self.assertEqual(event['nav']['curGc'], 2, event['action'])
        self.assertTrue(row['events'][2]['nav']['pop'])
        self.assertEqual(row['tab'], 'today')
        self.assertEqual(row['nav'], {'cur': '#today', 'curGc': 0, 'pop': False})

    def test_no_dialog_preserves_normal_navigation(self):
        row = self.results['no-dialog']
        self.assertEqual([event['action'] for event in row['events']], ['saveScroll', 'route', 'backControl'])
        self.assertEqual(row['tab'], 'today')
        self.assertEqual(row['events'][1]['nav'], {'cur': '#coatesway', 'curGc': 1, 'pop': True})

    def test_no_dialog_preserves_existing_duplicate_entry_skip(self):
        row = self.results['closed-duplicate']
        self.assertEqual([event['action'] for event in row['events']], ['saveScroll', 'history.back'])
        self.assertEqual(row['tab'], 'coatesway')
        self.assertEqual(row['nav'], {'cur': '#coatesway', 'curGc': 2, 'pop': False})

    def test_changed_hash_without_numeric_history_state_still_routes(self):
        row = self.results['untracked-destination']
        self.assertEqual([event['action'] for event in row['events']], ['close', 'saveScroll', 'route', 'backControl'])
        self.assertEqual(row['tab'], 'docs')
        self.assertEqual(row['nav'], {'cur': '#docs', 'curGc': 0, 'pop': False})


if __name__ == '__main__':
    unittest.main()
