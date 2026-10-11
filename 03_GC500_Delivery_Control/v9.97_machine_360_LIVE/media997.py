"""Author: Andrew Fisher. Verify immutable film bytes before changing the hosted catalogue."""
from copy import deepcopy
from fractions import Fraction
import hashlib
import json
import math
from pathlib import Path
import re
import subprocess

MAX_FILE = 32 * 1024 * 1024
HEX = re.compile(r'^[a-f0-9]{64}$')
TYPES = {'webp':'image/webp','jpg':'image/jpeg','png':'image/png','gif':'image/gif','bmp':'image/bmp','svg':'image/svg+xml','mp4':'video/mp4','webm':'video/webm','mp3':'audio/mpeg','m4a':'audio/mp4','wav':'audio/wav','ogg':'audio/ogg','woff2':'font/woff2','woff':'font/woff'}
def require(value, message):
    if not value: raise ValueError(message)
def canonical(value): return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode()
def sha(value): return hashlib.sha256(value).hexdigest()
def literal(text):
    marker = 'const DATA = '
    require(text.count(marker) == 1, 'Expected one DATA literal')
    start = text.index(marker) + len(marker)
    data, length = json.JSONDecoder().raw_decode(text[start:])
    require(text[start+length] == ';', 'DATA terminator changed')
    return data, start, start+length

def manifest(catalogue):
    require(isinstance(catalogue, dict) and 1 <= len(catalogue) <= 2000, 'Media catalogue exceeds service capacity')
    assets = []
    for key, item in catalogue.items():
        require(set(item) == {'file','sha256','type','bytes','scope'}, 'Media descriptor schema changed')
        require(isinstance(key, str) and HEX.fullmatch(key) and item['sha256'] == key, 'Media key/hash mismatch')
        name = item['file'].split('.')
        require(len(name) == 2 and name[0] == key and TYPES.get(name[1]) == item['type'], 'Media filename/MIME mismatch')
        require(type(item['bytes']) is int and 0 < item['bytes'] <= MAX_FILE and item['scope'] in ('view','edit'), 'Invalid media size/scope')
        assets.append(deepcopy(item))
    result = {'schema':'gc500-media-v1', 'assets':sorted(assets, key=lambda x:x['file'])}
    result['sha256'] = sha(canonical(result))
    require(len(canonical(result)) <= 1024*1024, 'Manifest exceeds service limit')
    return result

def load_report(path, expected_sha):
    require(isinstance(path, str) and Path(path).is_absolute(), 'Absolute private media report path required')
    require(isinstance(expected_sha, str) and HEX.fullmatch(expected_sha), 'Exact private media report SHA-256 required')
    raw = Path(path).read_bytes()
    require(len(raw) <= 512*1024 and sha(raw) == expected_sha, 'Private media report changed')
    report = json.loads(raw)
    require(report.get('author') == 'Andrew Fisher', 'Expected media author')
    require(report.get('native_endpoints_identical') is True and report.get('full_pose_endpoints_identical') is True and report.get('zero_velocity_at_loop_join') is True, 'Native seamless-loop proofs required')
    require(report.get('orbit_degrees') == 360 and report.get('native_frames') == 960 and report.get('inspection_returns_home') is True, 'Full 360-degree, 32-second inspection proof required')
    rows = report.get('outputs')
    require(isinstance(rows,list) and len(rows) == 3, 'Exactly 4K, preview and poster outputs required')
    roles = {}
    for row in rows:
        source = Path(row['path'])
        require(source.is_absolute() and source.is_file(), 'Private media file missing')
        content = source.read_bytes()
        require(type(row['bytes']) is int and 0 < row['bytes'] <= MAX_FILE and len(content) == row['bytes'] and sha(content) == row['sha256'], 'Reviewed media bytes/hash changed')
        if row['mime'] == 'video/mp4':
            result = subprocess.run(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(source)],capture_output=True,text=True,check=True,timeout=90)
            probe = json.loads(result.stdout); streams = probe['streams']; stream = streams[0]
            require(len(streams) == 1 and stream['codec_type'] == 'video' and stream['codec_name'] == 'h264' and stream['pix_fmt'] == 'yuv420p', 'Expected one H.264 yuv420p video stream without audio')
            require('mp4' in probe['format']['format_name'].split(','), 'Expected MP4 container')
            require(all(stream.get(key) == 'bt709' for key in ('color_space','color_transfer','color_primaries')) and stream.get('color_range') == 'tv', 'Expected reviewed Rec.709 colour conversion and range')
            dimensions = (stream['width'],stream['height'])
            require(dimensions in ((3840,2160),(1920,1080)) and dimensions == (row['width'],row['height']), 'Wrong video dimensions')
            role = 'full' if dimensions[0] == 3840 else 'preview'
            require(float(Fraction(stream['avg_frame_rate'])) == row['fps'] == 30 and int(stream['nb_read_frames']) == 960 and abs(float(probe['format']['duration'])-32) < .001 and row['duration'] == 32, 'Expected 960 frames, 30 fps and 32 seconds')
            require(type(row.get('decoded_seam_mae')) in (int,float) and math.isfinite(row['decoded_seam_mae']) and 0 <= row['decoded_seam_mae'] < 2, 'Decoded loop seam exceeds threshold')
            # Faststart is a structural condition, not a filename or codec claim.
            pos = 0; boxes = []
            while pos + 8 <= len(content):
                size = int.from_bytes(content[pos:pos+4],'big'); kind = content[pos+4:pos+8]; header = 8
                if size == 1: size = int.from_bytes(content[pos+8:pos+16],'big'); header = 16
                if size == 0: size = len(content)-pos
                require(size >= header and pos+size <= len(content), 'Malformed MP4 box')
                boxes.append(kind); pos += size
            require(b'moov' in boxes and b'mdat' in boxes and boxes.index(b'moov') < boxes.index(b'mdat'), 'MP4 faststart required')
            ext = 'mp4'
        else:
            from PIL import Image
            require(row['mime'] == 'image/webp', 'Expected WebP poster')
            with Image.open(source) as image:
                require(image.format == 'WEBP' and image.size == (1920,1080) and image.size == (row['width'],row['height']) and getattr(image,'n_frames',1) == 1, 'Expected one 1920×1080 WebP poster')
                image.verify()
            role, ext = 'poster', 'webp'
        require(role not in roles and sha(source.read_bytes()) == row['sha256'], 'Duplicate role or media changed during verification')
        roles[role] = {'path':str(source), 'file':row['sha256']+'.'+ext, 'sha256':row['sha256'], 'bytes':row['bytes'], 'type':row['mime'], 'scope':'view'}
    require(set(roles) == {'full','preview','poster'} and len({r['sha256'] for r in roles.values()}) == 3, 'Three distinct media roles required')
    return roles

def update_data(data, roles):
    require(data['hostedMedia']['schema'] == 'gc500-media-v1' and data['hostedMedia']['manifest'] == manifest(data['media'])['sha256'], 'Existing manifest mismatch')
    updated = deepcopy(data)
    for row in roles.values():
        require(row['sha256'] not in data['media'] or data['media'][row['sha256']] == {k:row[k] for k in ('file','sha256','type','bytes','scope')}, 'Existing media descriptor changed')
        updated['media'][row['sha256']] = {k:row[k] for k in ('file','sha256','type','bytes','scope')}
    ref = lambda role: {'media':roles[role]['sha256']}
    updated['machine']['hero'] = {'src':ref('poster'), 'poster':ref('poster'), 'still':ref('poster'), 'mp4':ref('full'), 'preview_mp4':ref('preview'), 'width':3840,'height':2160,'still_width':1920,'still_height':1080,'is':'The Coates Way cog separates and reassembles in a seamless 32-second loop with a full 360-degree inspection'}
    updated['hostedMedia']['manifest'] = manifest(updated['media'])['sha256']
    return updated

def value_span(raw, keys, start=0):
    decoder = json.JSONDecoder(); require(raw[start] == '{', 'Expected DATA object')
    pos = start+1
    while True:
        while raw[pos].isspace() or raw[pos] == ',': pos += 1
        require(raw[pos] != '}', 'Scoped DATA field missing')
        key, used = decoder.raw_decode(raw[pos:]); pos += used
        while raw[pos].isspace(): pos += 1
        require(raw[pos] == ':', 'DATA separator changed'); pos += 1
        while raw[pos].isspace(): pos += 1
        _, used = decoder.raw_decode(raw[pos:])
        if key == keys[0]: return value_span(raw, keys[1:], pos) if len(keys)>1 else (pos,pos+used)
        pos += used

def replace_data(text, updated):
    _,start,end = literal(text); raw=text[start:end]; edits=[]
    for keys,value in [(('machine','hero'),updated['machine']['hero']), (('media',),updated['media']), (('hostedMedia','manifest'),updated['hostedMedia']['manifest'])]:
        a,b = value_span(raw,keys); encoded=canonical(value).decode().replace('<','\\u003c').replace('>','\\u003e').replace('&','\\u0026').replace('\u2028','\\u2028').replace('\u2029','\\u2029'); edits.append((a,b,encoded))
    for a,b,encoded in sorted(edits,reverse=True): raw=raw[:a]+encoded+raw[b:]
    result=text[:start]+raw+text[end:];require(literal(result)[0] == updated,'Scoped DATA replacement mismatch');return result


def main():
    import argparse, os
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write-test-map',type=Path,required=True)
    args=parser.parse_args()
    roles=load_report(os.environ.get('MACHINE997_REPORT'),os.environ.get('MACHINE997_REPORT_SHA256'))
    for role,row in roles.items():
        row.update(width=3840 if role == 'full' else 1920,height=2160 if role == 'full' else 1080)
    args.write_test_map.parent.mkdir(parents=True,exist_ok=True)
    args.write_test_map.write_text(json.dumps({'scope':'Verified native 3840×2160 full film and matching1920×1080 preview/poster', 'roles':roles},indent=2))
    print('Verified three actual media files; private test map written. No network or record writes.')
if __name__ == '__main__':main()
