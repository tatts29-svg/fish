"""Product references for a single MMG QR report, from its published rental snapshot."""
import base64
import hmac
import json
import re
from datetime import datetime


_MEDIA = r'[a-f0-9]{64}\.(?:webp|jpeg|png)'
_REFERENCE = re.compile(r'/report-media/(' + _MEDIA + r')')
ROUTE = re.compile(r'art-(' + _MEDIA + r')\.([A-Za-z0-9_-]{43})')


def _norm(name):
    return ' '.join(name.casefold().split()) if isinstance(name, str) else ''


def catalogue(web):
    """Retain only exact asset/name associations reaching a job-pack product image."""
    marker = b'const D='
    start = web.html.find(marker)
    if start < 0:
        return None
    try:
        data, _ = json.JSONDecoder().raw_decode(web.html[start + len(marker):].decode('utf-8'))
        if _norm(data['job']['title']) != 'mmg dugald river':
            return None
        snapshot = datetime.strptime(data['asat'], '%d %b %Y %H:%M').isoformat(timespec='minutes')
        tools, pictures, assets = data['tools'], data['pics'], data['assets']
        if not isinstance(tools, dict) or not isinstance(pictures, list) or not isinstance(assets, list):
            return None
    except (ValueError, KeyError, TypeError):
        return None

    approved = {}
    for code, tool in tools.items():
        if not isinstance(tool, dict):
            continue
        picture_number = tool.get('pic')
        if type(picture_number) is not int or not 0 <= picture_number < len(pictures):
            continue
        ref = pictures[picture_number]
        match = _REFERENCE.fullmatch(ref) if isinstance(ref, str) else None
        if match and match[1] in web.images and _norm(tool.get('name')):
            approved[code] = (_norm(tool['name']), match[1])
    index = {}
    for asset in assets:
        if not isinstance(asset, dict):
            continue
        item, code = asset.get('i'), asset.get('dk')
        if not isinstance(item, str) or not item or not isinstance(code, str):
            continue
        entry = approved.get(code)
        if item in index and index[item] != entry:
            entry = None
        index[item] = entry
    return snapshot, {item: ref for item, ref in index.items() if ref}


def _rows(result):
    for group in result.get('hires', []):
        for row in group['items']:
            yield row['item'], group['name']
    handover = result.get('handover') or {}
    for row in (handover.get('latest_return') or {}).get('items', []):
        yield row['item'], row['name']
    oldest = handover.get('oldest')
    if oldest:
        yield oldest['item'], oldest['name']


def _signature(secret, scope, session, key):
    payload = '\0'.join(('mmg-product-art-v1', scope, session, key)).encode('ascii')
    return base64.urlsafe_b64encode(hmac.digest(secret, payload, 'sha256')).rstrip(b'=').decode('ascii')


def links(result, load, secret, scope, session):
    """Sign only pictures belonging to items already present in this response."""
    requested = {}
    for item, name in _rows(result):
        label = _norm(name)
        if item in requested and requested[item] != label:
            label = None
        requested[item] = label
    if not requested or not result.get('asat'):
        return {}
    try:
        refs = load().product_references
    except (OSError, ValueError):
        return {}
    if not refs or refs[0] != result['asat'][:16]:
        return {}
    images = {}
    for item, name in requested.items():
        ref = refs[1].get(item)
        if ref and ref[0] == name:
            key = ref[1]
            images[item] = f'/qr/{scope}/art-{key}.{_signature(secret, scope, session, key)}'
    return images


def fetch(match, load, secret, scope, session):
    key, signature = match.groups()
    if not hmac.compare_digest(signature, _signature(secret, scope, session, key)):
        return None
    try:
        return load().images.get(key)
    except (OSError, ValueError):
        return None
