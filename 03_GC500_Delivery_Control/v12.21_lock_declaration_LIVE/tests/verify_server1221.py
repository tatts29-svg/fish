"""Author: Andrew Fisher. GET-only activation read-back; private snapshots stay outside Git."""
import argparse, hashlib, json, os, sys, urllib.request
from datetime import datetime, timezone
from pathlib import Path

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--before', required=True, help='Private stage-execute directory')
    ap.add_argument('--private-dir', required=True)
    args = ap.parse_args()
    os.umask(0o077)
    before, out = Path(args.before), Path(args.private_dir).resolve()
    assert not out.is_relative_to(Path(__file__).resolve().parents[3])
    key = os.environ['GC500_EDIT_TOKEN']
    def get(route):
        req = urllib.request.Request('https://gc500-production.up.railway.app' + route,
                                     headers={'x-gc500-token': key}, method='GET')
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.read()
    health = json.loads(get('/health'))
    assert health['build'] == 'v5.93' and health.get('lock_declarations_version') == 1
    assert health['ok'] and health['disk'] == 'writing'
    assert not health['record_recovered'] and not health['tracker_refusing']
    out.mkdir(parents=True, exist_ok=False)
    def save(name, raw):
        raw = raw if isinstance(raw, bytes) else json.dumps(raw, indent=2).encode()
        assert key.encode() not in raw
        (out / name).write_bytes(raw)
    save('health.json', health)
    inventory = json.loads(get('/api/admin/machine'))
    save('inventory.json', inventory)
    blobs = {b['sha256']: b['bytes'] for b in inventory['blobs']}
    old_inventory = json.loads((before / 'after-inventory').read_text())
    assert all(blobs.get(b['sha256']) == b['bytes'] for b in old_inventory['blobs'])
    assert blobs.get('8764451d3768fcfbfc493da48fb9901503dcd6af0f8df247478aa53fb9428f46') == 294310
    old = json.loads((before / 'after-histories.json').read_text())
    fresh, retained, additions = {}, 0, 0
    for token, history in old.items():
        pages, since = [], 0
        for i in range(100):
            page = json.loads(get('/api/ticks?token=' + token + '&links=1&voided=1&voids=1&since=' + str(since)))
            pages.append(page)
            assert not page.get('void_more')
            if not page.get('more'):
                break
            assert i < 99 and page['seq'] > since
            since = page['seq']
        events = [t for p in pages for t in p.get('ticks', [])]
        assert len(events) == pages[0]['historical_ticks']
        assert all(p['total_seq'] == pages[0]['total_seq'] for p in pages)
        by_id = {e['id']: e for e in events}
        assert all(by_id.get(e['id']) == e for e in history['events'])
        for field in ['tracker', 'links', 'epoch']:
            assert pages[0].get(field) == history['pages'][0].get(field)
        assert all(v in pages[0].get('voids', []) for v in history['pages'][0].get('voids', []))
        fresh[token] = {'pages': pages, 'events': events}
        retained += len(history['events'])
        additions += len(events) - len(history['events'])
    save('histories.json', fresh)
    cards = json.loads(get('/api/cards'))
    save('cards.json', cards)
    old_cards = json.loads((before / 'after-cards').read_text())
    strip = lambda c: {k: v for k, v in c.items() if k != 'last_open'}
    by_token = {c['token']: strip(c) for c in cards['cards']}
    assert all(by_token.get(c['token']) == strip(c) for c in old_cards['cards'])
    page = get('/v/Coates-GC500-2026')
    save('page.html', page)
    assert hashlib.sha256(page).hexdigest() == '6ccc030d201729e50015d77aa2f140ba63660fe32e0a5fc44c958d47b6636a16'
    save('state.json', get('/api/state'))
    receipt = {'author': 'Andrew Fisher', 'at': datetime.now(timezone.utc).isoformat(),
               'health_build': health['build'], 'lock_declarations_version': 1,
               'retained_history_entries': retained, 'concurrent_history_additions': additions,
               'tracker_configuration_and_signatures_unchanged': True, 'cards_unchanged': True,
               'page_unchanged': True, 'inventory_preserved': True,
               'boot_hash_verification': 'Deployment-owner evidence required; health does not expose the boot hash',
               'record_note': 'Captured, not asserted unchanged across concurrent authorised work',
               'live_writes': 0}
    save('receipt.json', receipt)
    print(json.dumps(receipt))

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(json.dumps({'status': 'blocked', 'error_type': type(e).__name__, 'live_writes': 0}))
        sys.exit(1)
