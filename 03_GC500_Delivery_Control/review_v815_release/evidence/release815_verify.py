#!/usr/bin/env python3
"""Author: Andrew Fisher. Read-only page and shared-record publication proof.

Before publication:
  python3 release815_verify.py before --private-dir /private/release815
After publication:
  python3 release815_verify.py after /path/to/tested.html --private-dir /private/release815

The private directory must resolve outside this repository. Snapshots contain
collection fingerprints and the private record version, never raw records.
Stdout contains aggregate evidence only. Exit 1 means page mismatch or a
verification error; exit 2 means the record changed and needs inspection.
This helper makes GET requests only; it cannot publish or change the record.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import secrets
import sys
import urllib.request

HOST = 'https://gc500-production.up.railway.app'
VIEW = '/v/Coates-GC500-2026'
REPO = Path(__file__).resolve().parents[3]


class VerificationError(Exception):
    """A diagnostic whose text contains no operational data."""


def sha(value):
    return hashlib.sha256(value).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'),
                      ensure_ascii=False, allow_nan=False).encode('utf-8')


def get(path):
    # A unique query and no-cache headers avoid reusing a prior public response.
    request = urllib.request.Request(
        HOST + path + '?release815_verify=' + secrets.token_hex(12),
        headers={'x-gc500-token': 'Coates-GC500-2026',
                 'Cache-Control': 'no-cache, no-store, max-age=0',
                 'Pragma': 'no-cache'}, method='GET')
    with urllib.request.urlopen(request, timeout=180) as response:
        return response.read()


def state_summary():
    state = json.loads(get('/api/state'))
    if (not isinstance(state, dict) or 'version' not in state
            or not isinstance(state.get('docs'), dict)):
        raise VerificationError('State response lacks the required version or collections.')
    return {'version': state['version'], 'collections': {
        name: sha(canonical(value)) for name, value in state['docs'].items()
    }}


def write_private(path, value):
    # Refuse overwriting an earlier snapshot or following a final-path symlink.
    flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, 'O_NOFOLLOW', 0)
    fd = os.open(path, flags, 0o600)
    with os.fdopen(fd, 'w', encoding='utf-8') as stream:
        json.dump(value, stream, indent=2, ensure_ascii=False, allow_nan=False)
        stream.write('\n')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('mode', choices=('before', 'after'))
    parser.add_argument('tested_page', nargs='?')
    parser.add_argument('--private-dir', type=Path, required=True)
    args = parser.parse_args()
    if (args.mode == 'after') != bool(args.tested_page):
        raise VerificationError('Supply the tested page for after mode only.')
    private = args.private_dir.expanduser().resolve()
    if private == REPO or REPO in private.parents:
        raise VerificationError('--private-dir must resolve outside the repository.')
    private.mkdir(parents=True, exist_ok=True, mode=0o700)
    before_path = private / 'publication_before.json'

    if args.mode == 'before':
        if before_path.exists() or before_path.is_symlink():
            raise VerificationError('Before snapshot already exists; use a new private directory.')
        served = get(VIEW)
        state = state_summary()
        result = {'author': 'Andrew Fisher', 'state': state,
                  'livePageSha256': sha(served), 'livePageBytes': len(served)}
        write_private(before_path, result)
        print(json.dumps({'livePageSha256': result['livePageSha256'],
                          'livePageBytes': result['livePageBytes'],
                          'recordSha256': sha(canonical(state))}))
        return 0

    if before_path.is_symlink() or not before_path.is_file():
        raise VerificationError('A private before snapshot is required.')
    previous = json.loads(before_path.read_text(encoding='utf-8'))
    prior = previous['state']
    if not isinstance(prior.get('collections'), dict) or 'version' not in prior:
        raise VerificationError('The before snapshot is incomplete.')
    candidate = Path(args.tested_page).read_bytes()
    served = get(VIEW)
    state = state_summary()
    changed = sorted(name for name in set(prior['collections']) | set(state['collections'])
                     if prior['collections'].get(name) != state['collections'].get(name))
    result = {'candidateSha256': sha(candidate), 'candidateBytes': len(candidate),
              'servedSha256': sha(served), 'servedBytes': len(served),
              'exactPageMatch': served == candidate,
              'beforeRecordSha256': sha(canonical(prior)),
              'afterRecordSha256': sha(canonical(state)),
              'recordUnchanged': canonical(state) == canonical(prior), 'changedCollections': changed}
    # Each after attempt is retained separately; a failed comparison never
    # replaces the before snapshot or an earlier after result.
    after_path = private / ('publication_after_' + secrets.token_hex(12) + '.json')
    write_private(after_path, {'author': 'Andrew Fisher', 'state': state, 'result': result})
    print(json.dumps(result))
    if not result['exactPageMatch']:
        print('Public page differs from the tested candidate; publication is not verified.', file=sys.stderr)
    if not result['recordUnchanged']:
        print('Shared record or version changed; inspect private snapshots before claiming preservation.',
              file=sys.stderr)
    if not result['exactPageMatch']:
        return 1
    return 0 if result['recordUnchanged'] else 2


if __name__ == '__main__':
    try:
        sys.exit(main())
    except VerificationError as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
    except Exception:
        # Exception bodies can include private paths, URLs or response values.
        print('Verification could not complete; inspect the private inputs or service availability.',
              file=sys.stderr)
        sys.exit(1)
