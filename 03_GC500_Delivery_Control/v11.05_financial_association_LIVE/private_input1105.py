"""Author: Andrew Fisher. Read a private, hash-guarded single-line build input.

No source rows, workbook paths, financial values or credentials belong in this module.
"""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess


def read_private_input(env=None):
    env = os.environ if env is None else env
    expected = env.get('GC500_FINANCIAL_ASSOCIATION_SHA256', '')
    if not re.fullmatch(r'[a-f0-9]{64}', expected):
        raise ValueError('A private association SHA-256 guard is required')
    payload_path = env.get('GC500_FINANCIAL_ASSOCIATION_INPUT', '')
    source_path = env.get('GC500_FINANCIAL_ASSOCIATION_SOURCE', '')
    if not payload_path or not source_path:
        raise ValueError('Private association and original source paths are required')
    payload = Path(payload_path).read_bytes()
    if len(payload) > 65536 or hashlib.sha256(payload).hexdigest() != expected:
        raise ValueError('Private association input failed its size or hash guard')
    data = json.loads(payload)
    source_sha = hashlib.sha256(Path(source_path).read_bytes()).hexdigest()
    if source_sha != data.get('source', {}).get('sha256'):
        raise ValueError('Original source failed its hash guard')
    module = Path(__file__).with_name('financialAssociation1105_src.js')
    check = subprocess.run(
        ['node', '-e', 'const fs=require("node:fs");const api=require(process.argv[1]);try{api.validate(JSON.parse(fs.readFileSync(0,"utf8")));}catch(e){process.exit(1)}', str(module)],
        input=payload, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False,
    )
    if check.returncode:
        raise ValueError('Private association input failed schema validation')
    # It is data, not executable code. Escaping prevents premature HTML script closure.
    encoded = json.dumps(data, ensure_ascii=True, separators=(',', ':')).replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026')
    return encoded, {'payload_sha256':expected, 'source_sha256':source_sha}
