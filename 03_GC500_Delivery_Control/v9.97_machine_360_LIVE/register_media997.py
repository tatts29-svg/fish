#!/usr/bin/env python3
"""Author: Andrew Fisher. Dry-run by default; append immutable hero media only with --apply."""
import argparse
import json
import os
from pathlib import Path
import sys
import tempfile
import urllib.request
sys.path.insert(0,str(Path(__file__).resolve().parent.parent/'toolchain'))
from upload_page import curl
from media997 import canonical, literal, load_report, manifest, require, sha, update_data
from patch_v997 import BASE_SHA, MARKER
VIEW='https://gc500-production.up.railway.app/v/Coates-GC500-2026'

def live_guard(base):
    raw=urllib.request.urlopen(VIEW,timeout=120).read()
    require(raw == base and sha(raw) == BASE_SHA,'Live base changed; rebuild and retest before registering media')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('page',type=Path);parser.add_argument('--apply',action='store_true');parser.add_argument('--credential-proxy',action='store_true')
    args=parser.parse_args();page=args.page.read_bytes();basepath=args.page.parent/'base_live.html';base=basepath.read_bytes()
    require(sha(base) == BASE_SHA,'Expected exact v9.96 base_live.html beside candidate')
    require(MARKER in page.decode(),'Expected machine film candidate')
    roles=load_report(os.environ.get('MACHINE997_REPORT'),os.environ.get('MACHINE997_REPORT_SHA256'))
    before,_,_=literal(base.decode());after,_,_=literal(page.decode())
    require(after == update_data(before,roles),'Candidate DATA differs from exactly reviewed film update')
    desired=manifest(after['media']);live_guard(base)
    code,body=curl('GET','/api/version');require(code == 200 and json.loads(body).get('level') == 'edit','Service must confirm edit access')
    code,body=curl('GET','/api/admin/media');require(code == 200,'Cannot verify current media inventory')
    inventory=json.loads(body);saved={row['file']:row for row in inventory['files']};assets={row['file']:row for row in inventory['assets']}
    newfiles={row['file']:row for row in roles.values()}
    for row in desired['assets']:
        previous=assets.get(row['file'])
        if previous is not None: require(previous == row,'Existing media metadata or permissions differ')
        if row['file'] not in newfiles:
            require(previous == row and row['file'] in saved and saved[row['file']]['sha256'] == row['sha256'] and saved[row['file']]['bytes'] == row['bytes'],'Existing required media missing or changed')
    pending=[row for row in roles.values() if row['file'] not in saved or saved[row['file']]['sha256'] != row['sha256'] or saved[row['file']]['bytes'] != row['bytes']]
    print(json.dumps({'author':'Andrew Fisher','mode':'apply' if args.apply else 'dry-run','new_assets':sum(row['file'] not in assets for row in roles.values()),'upload_needed':len(pending),'manifest':desired['sha256'],'files':len(desired['assets']),'candidate_sha256':sha(page)}))
    if not args.apply:
        print('Dry run passed. No media, page or record changed.');return
    for row in pending:
        live_guard(base)
        code,body=curl('PUT','/api/admin/media/'+row['file'],data=row['path'],ctype=row['type'])
        require(code == 200,'Media upload rejected; no page uploaded')
        response=json.loads(body);require(response.get('sha256') == row['sha256'] and response.get('bytes') == row['bytes'],'Media upload readback differs')
    live_guard(base)
    code,body=curl('GET','/api/admin/media');require(code == 200,'Cannot recheck media inventory')
    before_register={row['file']:row for row in json.loads(body)['assets']}
    require(all(before_register.get(name) == row for name,row in assets.items()),'Existing registered metadata changed during preparation')
    with tempfile.TemporaryDirectory(prefix='gc500-machine997-manifest-') as folder:
        path=Path(folder)/'manifest.json';path.write_bytes(canonical(desired))
        code,body=curl('POST','/api/admin/media/manifest',data=str(path),ctype='application/json')
    require(code == 200 and json.loads(body).get('sha256') == desired['sha256'],'Media manifest registration rejected')
    code,body=curl('GET','/api/admin/media');require(code == 200,'Cannot verify registered inventory')
    after_register={row['file']:row for row in json.loads(body)['assets']}
    require(all(after_register.get(name) == row for name,row in before_register.items()),'Registration did not preserve all existing assets, including other manifests')
    require(all(after_register.get(row['file']) == row for row in desired['assets']),'Registered candidate metadata differs')
    for row in roles.values():
        raw=urllib.request.urlopen('https://gc500-production.up.railway.app/m/Coates-GC500-2026/'+row['file'],timeout=120).read()
        require(sha(raw) == row['sha256'] and len(raw) == row['bytes'],'Public media bytes differ')
    print('Reviewed film media registered and public bytes verified. Page and operational records unchanged.')
if __name__ == '__main__':main()
