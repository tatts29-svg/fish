"""Author: Andrew Fisher. Exact public observation backfill and stable integration boundaries."""
from pathlib import Path
import csv,io,json,sys,unittest
HERE=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(HERE))
from weather_archive1299 import extension,rows_of,number
from weather_integration1299 import apply
BASE=Path(sys.argv.pop(1)).read_text()
def archive(page):
 at=page.index('const ARCHIVE = ')+len('const ARCHIVE = ')
 return json.JSONDecoder().raw_decode(page[at:])[0]
class WeatherHistory(unittest.TestCase):
 @classmethod
 def setUpClass(cls):cls.old=archive(BASE);cls.new=apply(BASE);cls.updated=archive(cls.new);cls.ext=json.loads((HERE/'weather_additions1299.json').read_text())
 def test_all_original_rows_sources_and_periods_unchanged(self):
  self.assertEqual(len(self.old['days']),46);self.assertEqual(len(self.updated['days']),59)
  for day,row in self.old['days'].items():self.assertEqual(row,self.updated['days'][day])
  for key,value in self.old['sources'].items():self.assertEqual(value,self.updated['sources'][key])
  self.assertEqual(self.old['periods'],self.updated['periods']);self.assertEqual(self.old['timezone'],self.updated['timezone'])
 def test_extension_is_reproduced_from_frozen_official_snapshots(self):
  self.assertEqual(extension(self.old),self.ext);self.assertEqual(self.ext['checked_existing_october_rows'],22)
  self.assertEqual(len(self.ext['days']),13);self.assertEqual(self.updated['coverage']['through'],'2026-11-04')
 def test_observation_fields_against_independent_header_lookup(self):
  for month in ['202610','202611']:
   raw=(HERE/'weather_sources'/f'IDCJDW4050.{month}.csv').read_bytes().decode('latin-1');rows=list(csv.reader(io.StringIO(raw)))
   header=next(r for r in rows if len(r)>20 and r[1]=='Date');idx={s.strip():i for i,s in enumerate(header)}
   for r in rows:
    if len(r)<22 or not r[1].startswith('2026-'):continue
    y,m,d=r[1].split('-');day=f'{y}-{int(m):02d}-{int(d):02d}'
    if day not in self.ext['days']:continue
    got=self.ext['days'][day]
    for key,label in [('min_c','Minimum temperature (°C)'),('max_c','Maximum temperature (°C)'),('rain_to_9am_mm','Rainfall (mm)'),('gust_kph','Speed of maximum wind gust (km/h)')]:self.assertEqual(got[key],number(r[idx[label]]),(day,key))
    self.assertIsNone(got['rain_pc']);self.assertIsNone(got['rain_mm']);self.assertEqual(got['kind'],'unknown');self.assertFalse(got['sky_recorded'])
 def test_partial_latest_day_never_promotes_an_instant_to_daily_maximum(self):
  row=self.ext['days']['2026-11-04'];self.assertTrue(row['partial']);self.assertIsNone(row['max_c']);self.assertIsNone(row['gust_kph']);self.assertEqual(row['readings'][-1]['temp_c'],32.8)
  self.assertEqual([d for d,r in self.ext['days'].items() if r['partial']],['2026-11-04'])
 def test_station_and_duplicate_rows_rejected(self):
  raw=(HERE/'weather_sources'/'IDCJDW4050.202611.csv').read_bytes().decode('latin-1')
  with self.assertRaises(ValueError):rows_of(raw.replace('station 040764','station 999999'),'test')
  with self.assertRaises(ValueError):rows_of(raw+'\n'+next(x for x in raw.splitlines() if x.startswith(',2026-11-3,')),'test')
  with self.assertRaises(ValueError):number('NaN')
 def test_patch_is_scoped_to_weather_and_refuses_reapplication(self):
  import re
  old=re.findall(r'<script([^>]*)>(.*?)</script>',BASE,re.S);new=re.findall(r'<script([^>]*)>(.*?)</script>',self.new,re.S)
  self.assertEqual(len(old),len(new));changed=[]
  for a,b in zip(old,new):
   if a!=b:changed.append(re.search(r'id="([^"]+)"',a[0])[1])
  self.assertEqual(set(changed),{'past984-script','demob-weather996-source'})
  with self.assertRaises(ValueError):apply(self.new)
if __name__=='__main__':unittest.main()
