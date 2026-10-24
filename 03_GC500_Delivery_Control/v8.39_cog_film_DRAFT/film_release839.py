"""Author: Andrew Fisher. Verified film media and exact current-host integration."""
from copy import deepcopy
from fractions import Fraction
import hashlib
import importlib.util
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parent
BASE_SHA256 = '400bb272d392322ad5a615fa23b83d724d38bc15811b0cde242377b0c5777929'
MARKER = '/* v8.39 verified steering-wheel film */'
MAX_FILE = 32 * 1024 * 1024
SCHEMA = 'gc500-media-v1'
TYPES = {'webp':'image/webp','jpg':'image/jpeg','png':'image/png','gif':'image/gif','bmp':'image/bmp','svg':'image/svg+xml','mp4':'video/mp4','webm':'video/webm','mp3':'audio/mpeg','m4a':'audio/mp4','wav':'audio/wav','ogg':'audio/ogg','woff2':'font/woff2','woff':'font/woff'}
HEX = re.compile(r'^[a-f0-9]{64}$')


def require(value, message):
    if not value:
        raise ValueError(message)


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False, separators=(',', ':'), allow_nan=False).encode()


def sha(value):
    return hashlib.sha256(value).hexdigest()


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, 'Duplicate private input key')
        result[key] = value
    return result


def number(value):
    return type(value) in (int, float) and math.isfinite(value) and value > 0


def video_info(path):
    require(shutil.which('ffprobe'), 'ffprobe is required to verify the film; install FFmpeg before building')
    try:
        done = subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', str(path)], capture_output=True, text=True, timeout=45, check=True)
        probe = json.loads(done.stdout)
        streams = probe['streams']
        require(len(streams) == 1 and streams[0].get('codec_type') == 'video', 'Film must contain one video stream and no audio or other tracks')
        stream = streams[0]
        require('mp4' in probe['format']['format_name'].split(','), 'Film must be an MP4 container')
        rate = float(Fraction(stream['avg_frame_rate']))
        duration = float(stream.get('duration') or probe['format']['duration'])
    except (KeyError, TypeError, ZeroDivisionError, subprocess.SubprocessError, json.JSONDecodeError) as error:
        raise ValueError('ffprobe could not verify the reviewed MP4') from error
    require(number(rate) and number(duration), 'Film frame rate and duration must be finite and positive')
    return {'width':stream['width'], 'height':stream['height'], 'codec':stream.get('codec_name'), 'pixel_format':stream.get('pix_fmt'), 'fps':rate, 'duration':duration}


def poster_info(path):
    try:
        from PIL import Image
    except ImportError as error:
        raise ValueError('Pillow is required to verify the poster; install Pillow before building') from error
    try:
        with Image.open(path) as image:
            info = {'width':image.width, 'height':image.height, 'type':{'PNG':'image/png','JPEG':'image/jpeg'}.get(image.format)}
            require(getattr(image, 'n_frames', 1) == 1, 'Poster must be one still image')
            image.verify()
    except (OSError, SyntaxError) as error:
        raise ValueError('Pillow could not verify the reviewed poster') from error
    require(info['type'], 'Poster must be PNG or JPEG')
    return info


def load_input(path, expected_sha256):
    require(isinstance(path, str) and Path(path).is_absolute(), 'Private input must be an absolute path')
    require(isinstance(expected_sha256, str) and HEX.fullmatch(expected_sha256), 'Private input SHA-256 is required')
    try:
        raw = Path(path).read_bytes()
    except OSError as error:
        raise ValueError('Private film input is unavailable') from error
    require(len(raw) <= 64 * 1024 and sha(raw) == expected_sha256, 'Private film input changed or exceeds its limit')
    data = json.loads(raw, object_pairs_hook=unique_object)
    require(isinstance(data, dict) and set(data) == {'schema','author','roles'} and type(data['schema']) is int and data['schema'] == 1 and data['author'] == 'Andrew Fisher', 'Expected exact film input schema and author')
    require(isinstance(data['roles'], dict) and set(data['roles']) == {'preview','full','poster'}, 'Exactly preview, full and poster roles are required')
    clean = {}
    common = {'path','sha256','bytes','type','width','height'}
    for role, item in data['roles'].items():
        fields = common if role == 'poster' else common | {'duration','fps','codec','pixel_format'}
        require(isinstance(item, dict) and set(item) == fields, 'Unexpected film role fields')
        require(isinstance(item['path'], str) and Path(item['path']).is_absolute(), 'Reviewed media paths must be absolute')
        require(isinstance(item['sha256'], str) and HEX.fullmatch(item['sha256']), 'Reviewed media SHA-256 required')
        require(type(item['bytes']) is int and 1 <= item['bytes'] <= MAX_FILE, 'Each media file must be 1–32 MiB')
        source = Path(item['path'])
        try:
            require(source.is_file() and source.stat().st_size == item['bytes'], 'Reviewed media byte count changed')
            content = source.read_bytes()
        except OSError as error:
            raise ValueError('Reviewed media file is unavailable') from error
        require(len(content) == item['bytes'] and sha(content) == item['sha256'], 'Reviewed media bytes or hash changed')
        require(type(item['width']) is int and type(item['height']) is int and item['width'] > 0 and item['height'] > 0, 'Media dimensions must be positive integers')
        if role == 'poster':
            actual = poster_info(source)
            require(all(actual[k] == item[k] for k in ('width','height','type')), 'Poster MIME or dimensions changed')
            require(item['width'] * 9 == item['height'] * 16, 'Poster must match the film aspect ratio')
            ext = 'png' if item['type'] == 'image/png' else 'jpg'
        else:
            require(item['type'] == 'video/mp4' and item['codec'] == 'h264' and item['pixel_format'] == 'yuv420p', 'Film must declare H.264 yuv420p MP4')
            actual = video_info(source)
            target = (1920,1080) if role == 'preview' else (3840,2160)
            require((item['width'],item['height']) == target, 'Preview and full film dimensions must match their roles')
            require(all(actual[k] == item[k] for k in ('width','height','codec','pixel_format')), 'Actual film dimensions or codec changed')
            require(number(item['fps']) and number(item['duration']), 'Reviewed film timing is required')
            require(abs(actual['fps'] - item['fps']) < 0.001 and abs(actual['duration'] - item['duration']) <= 1 / actual['fps'] + 0.000001, 'Actual film timing differs from reviewed timing')
            ext = 'mp4'
        require(source.stat().st_size == item['bytes'] and sha(source.read_bytes()) == item['sha256'], 'Reviewed media changed during metadata verification')
        cleaned = {'file':item['sha256'] + '.' + ext, 'sha256':item['sha256'], 'type':item['type'], 'bytes':item['bytes'], 'width':actual['width'], 'height':actual['height']}
        if role != 'poster':
            cleaned.update(duration=actual['duration'], fps=actual['fps'])
        clean[role] = cleaned
    require(len({x['sha256'] for x in clean.values()}) == 3, 'Film roles must reference three distinct reviewed assets')
    preview, full = clean['preview'], clean['full']
    require(abs(preview['fps'] - full['fps']) < 0.001 and abs(preview['duration'] - full['duration']) <= 1 / max(preview['fps'], full['fps']) + 0.000001, 'Preview and full film timing must agree within one frame')
    return {'roles':clean}


def media_manifest(catalogue):
    require(isinstance(catalogue, dict) and 1 <= len(catalogue) <= 2000, 'Media catalogue must contain 1–2000 entries')
    assets = []
    for key, value in catalogue.items():
        require(isinstance(value, dict) and set(value) == {'file','sha256','type','bytes','scope'}, 'Media descriptor schema changed')
        require(key == value['sha256'] and isinstance(key, str) and HEX.fullmatch(key), 'Media key and hash must agree')
        require(isinstance(value['file'], str), 'Media filename must be text')
        parts = value['file'].split('.')
        require(len(parts) == 2 and parts[0] == key and TYPES.get(parts[1]) == value['type'], 'Media filename, MIME and hash must agree')
        require(type(value['bytes']) is int and 1 <= value['bytes'] <= MAX_FILE and value['scope'] in ('view','edit'), 'Media size or scope is invalid')
        assets.append(deepcopy(value))
    body = {'schema':SCHEMA, 'assets':sorted(assets, key=lambda x:x['file'])}
    body['sha256'] = sha(canonical(body))
    require(len(canonical(body)) <= 1024 * 1024, 'Media manifest exceeds the server limit')
    return body


def media_updates(data, checked):
    require(isinstance(data.get('hostedMedia'), dict) and data['hostedMedia'].get('schema') == SCHEMA, 'Expected hosted media edition')
    require(data['hostedMedia'].get('manifest') == media_manifest(data['media'])['sha256'], 'Existing hosted media manifest does not match its catalogue')
    require(set(checked) == {'roles'} and set(checked['roles']) == {'preview','full','poster'}, 'Exactly three checked film roles required')
    result = deepcopy(data)
    for item in checked['roles'].values():
        require(item['sha256'] not in result['media'], 'Film must append new media without replacing an existing descriptor')
        result['media'][item['sha256']] = {**{k:item[k] for k in ('file','sha256','type','bytes')}, 'scope':'view'}
    p, full, still = (checked['roles'][k] for k in ('preview','full','poster'))
    ref = lambda item: {'media':item['sha256']}
    result['machine']['hero'] = {'src':ref(still), 'poster':ref(still), 'still':ref(still), 'mp4':ref(p), 'full_mp4':ref(full), 'width':p['width'], 'height':p['height'], 'still_width':still['width'], 'still_height':still['height'], 'is':'The Coates Way steering wheel', 'caption':'The steering wheel separates into its elements, then comes back together.'}
    result['hostedMedia']['manifest'] = media_manifest(result['media'])['sha256']
    return result


def literal(text):
    marker = 'const DATA = '
    require(text.count(marker) == 1, 'Expected one literal DATA object')
    start = text.index(marker) + len(marker)
    value, length = json.JSONDecoder().raw_decode(text[start:])
    require(text[start + length:start + length + 1] == ';', 'DATA terminator changed')
    return value, start, start + length


def value_span(raw, keys, start=0):
    """Find exact object value bytes without rewriting unrelated machine data."""
    decoder = json.JSONDecoder()
    require(raw[start] == '{', 'Expected object for scoped DATA replacement')
    pos = start + 1
    while True:
        while raw[pos].isspace() or raw[pos] == ',': pos += 1
        require(raw[pos] != '}', 'Scoped DATA field is missing')
        key, used = decoder.raw_decode(raw[pos:]); pos += used
        while raw[pos].isspace(): pos += 1
        require(raw[pos] == ':', 'DATA field separator changed'); pos += 1
        while raw[pos].isspace(): pos += 1
        value, used = decoder.raw_decode(raw[pos:])
        if key == keys[0]:
            return value_span(raw, keys[1:], pos) if len(keys) > 1 else (pos, pos + used)
        pos += used


def component():
    folders = list(ROOT.parent.glob('v8.35_coates_cog_*'))
    require(len(folders) == 1, 'Expected one preserved v8.35 film component')
    spec = importlib.util.spec_from_file_location('cog_film835_release_component', folders[0] / 'cog_film835.py')
    module = importlib.util.module_from_spec(spec); spec.loader.exec_module(module)
    return module


def apply(text, input_path=None, input_sha256=None):
    require(MARKER not in text and 'function createCogMedia835(' not in text, 'The film integration is already applied')
    require(sha(text.encode('utf-8')) == BASE_SHA256, 'Expected the exact current live host')
    checked = load_input(input_path or os.environ.get('COG_FILM839_INPUT'), input_sha256 or os.environ.get('COG_FILM839_INPUT_SHA256'))
    original, _, _ = literal(text)
    updated = media_updates(original, checked)
    result = component().apply(text)
    _, start, end = literal(result)
    raw = result[start:end]
    replacements = []
    for keys, value in [(('machine','hero'),updated['machine']['hero']), (('media',),updated['media']), (('hostedMedia','manifest'),updated['hostedMedia']['manifest'])]:
        a,b = value_span(raw, keys)
        encoded = canonical(value).decode().replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
        replacements.append((a,b,encoded))
    for a,b,value in sorted(replacements, reverse=True): raw = raw[:a] + value + raw[b:]
    result = result[:start] + raw + result[end:]
    require(literal(result)[0] == updated, 'Scoped film DATA update differs from the reviewed update')
    for old,new in [('<meta name="gc500-release" content="v8.38">','<meta name="gc500-release" content="v8.39">'),("+ ' · v8.38'; /* v8.19 - the footer names the release once */", "+ ' · v8.39'; /* v8.19 - the footer names the release once */")]:
        require(result.count(old) == 1, 'Exact release metadata changed'); result = result.replace(old,new,1)
    return result.replace('function createCogMedia835(', MARKER + '\nfunction createCogMedia835(', 1)
