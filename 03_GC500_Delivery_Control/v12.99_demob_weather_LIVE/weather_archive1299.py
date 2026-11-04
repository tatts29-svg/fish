"""Author: Andrew Fisher. Extend reviewed observations using the same BOM station and daily periods."""
from pathlib import Path
import csv,hashlib,io,json,math,sys
HERE=Path(__file__).resolve().parent
STATION={'name':'Bureau of Meteorology','station':'Gold Coast Seaway','station_id':'040764'}
FIRST,THROUGH='2026-10-23','2026-11-04'
SKY={'kind','text','sky_recorded','condition_observations','condition_source'}
def number(value):
 value=(value or '').strip()
 if not value:return None
 if value.lower()=='calm':return 0.0
 n=float(value)
 if not math.isfinite(n):raise ValueError('Nonfinite weather observation')
 return n

def text(value):return (value or '').strip() or None

def rows_of(raw,source_id):
 rows=list(csv.reader(io.StringIO(raw)))
 if not any('Gold Coast Seaway {station 040764}' in ' '.join(row) for row in rows[:8]):raise ValueError('Wrong weather station')
 header=next((row for row in rows if len(row)>20 and row[1]=='Date'),None)
 if not header:raise ValueError('BOM daily observations header missing')
 out={}
 for r in rows:
  if len(r)<22 or not r[1].startswith('2026-'):continue
  y,m,d=r[1].split('-');iso=f'{y}-{int(m):02d}-{int(d):02d}'
  if iso in out:raise ValueError('Duplicate observation date '+iso)
  readings=[]
  for at,t,wd,ws in [('09:00',r[10],r[13],r[14]),('15:00',r[16],r[19],r[20])]:
   if any(x.strip() for x in [t,wd,ws]):readings.append({'time':at,'temp_c':number(t),'wind_kph':number(ws),'wind_direction':text(wd)})
  winds=[x['wind_kph'] for x in readings if x['wind_kph'] is not None]
  row={'date':iso,'src':'bom-history','historical':True,'kind':'unknown','code':None,'text':'Recorded observations',
       'min_c':number(r[2]),'max_c':number(r[3]),'rain_pc':None,'rain_mm':None,'rain_to_9am_mm':number(r[4]),
       'wind_kph':max(winds) if winds else None,'gust_kph':number(r[8]),'gust_time':text(r[9]),'gust_direction':text(r[7]),
       'observations':len(readings),'observation_times':[x['time'] for x in readings],'readings':readings}
  row['partial']=any(row[k] is None for k in ['min_c','max_c','rain_to_9am_mm','gust_kph']) or len(readings)<2 or any(v is None for x in readings for v in x.values())
  row['sky_recorded']=False;row['source_id']=source_id;out[iso]=row
 return out

def same(a,b):
 skip={'source_id'}|(SKY if a.get('condition_source') else set())
 return {k:v for k,v in a.items() if k not in skip}=={k:v for k,v in b.items() if k not in skip}

def extension(archive):
 made={};sources={};retrieval=json.loads((HERE/'weather_sources'/'retrieval.json').read_text())
 for month in ['202610','202611']:
  raw=(HERE/'weather_sources'/f'IDCJDW4050.{month}.csv').read_bytes();decoded=raw.decode('iso-8859-1');sid=month+'-04nov1299'
  if hashlib.sha256(raw).hexdigest()!=retrieval[month]['sha256']:raise ValueError('BOM snapshot differs from retrieval evidence')
  made.update(rows_of(decoded,sid))
  sources[sid]={**STATION,'url':f'https://www.bom.gov.au/climate/dwo/{month}/html/IDCJDW4050.{month}.shtml',
   'data_url':f'https://www.bom.gov.au/climate/dwo/{month}/text/IDCJDW4050.{month}.csv',
   'source_prepared':next(line.strip('"') for line in decoded.splitlines()[:3] if line.startswith('"Prepared at')),
   'retrieved_utc':retrieval[month]['retrieved_utc'],'snapshot_sha256':hashlib.sha256(decoded.encode()).hexdigest(),
   'snapshot_encoding':'UTF-8 copy of ISO-8859-1 source','original_bytes_sha256':hashlib.sha256(raw).hexdigest()}
 checked=[d for d in archive['days'] if d.startswith('2026-10-')]
 if len(checked)!=22 or any(d not in made or not same(archive['days'][d],made[d]) for d in checked):raise ValueError('Latest BOM source does not reproduce existing October history')
 additions={d:made[d] for d in sorted(made) if FIRST<=d<=THROUGH}
 expected=[f'2026-10-{d:02d}' for d in range(23,32)]+[f'2026-11-{d:02d}' for d in range(1,5)]
 if list(additions)!=expected:raise ValueError('Historical additions do not cover exact approved date range')
 return {'author':'Andrew Fisher','coverage':{'from':FIRST,'through':THROUGH},'checked_existing_october_rows':len(checked),'sources':sources,'days':additions}

if __name__=='__main__':
 archive=json.loads(Path(sys.argv[1]).read_text());out=extension(archive)
 Path(sys.argv[2]).write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n')
 print('Verified22 existing October rows; added13 observation dates; missing values remain null')
