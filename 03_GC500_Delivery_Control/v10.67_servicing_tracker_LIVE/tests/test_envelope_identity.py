#!/usr/bin/env python3
"""Author: Andrew Fisher. Prove a release differs only by the upload identity comment.

python3 test_envelope_identity.py v10.67 ORIGINAL_PAGE ENVELOPE_PAGE
The committed manifest contains hashes only; private pages remain outside Git.
"""
import hashlib
import json
from pathlib import Path
import re
import sys

manifest = json.loads((Path(__file__).with_name('envelope_equivalence.json')).read_text())
version, original_path, candidate_path = sys.argv[1:]
row = next(item for item in manifest['candidates'] if item['version'] == version)
original, candidate = Path(original_path).read_bytes(), Path(candidate_path).read_bytes()
comment = manifest['comment'].encode()
prefix = b'\xef\xbb\xbf<!doctype html>\n'
sha = lambda value: hashlib.sha256(value).hexdigest()
assert sha(original) == row['original_sha256'], 'original test source changed'
assert sha(candidate) == row['candidate_sha256'], 'candidate changed'
assert len(original) == row['original_bytes']
assert len(candidate) == row['candidate_bytes'] == len(original) + 32
assert candidate.count(comment) == 1 and candidate.startswith(prefix + comment)
assert candidate.replace(comment, b'', 1) == original, 'bytes beyond the comment differ'
# The live server applies these exact two whole-document acceptance conditions.
text = candidate.decode('utf-8')
assert re.search('GC500', text[:5000])
assert re.search(r'</html>\s*$', text[-200:])
print(json.dumps({'author': 'Andrew Fisher', 'version': version,
                  'candidate_sha256': sha(candidate), 'checks': 8, 'passed': True,
                  'runtime_style_data_unchanged': True, 'live_writes': 0}))
