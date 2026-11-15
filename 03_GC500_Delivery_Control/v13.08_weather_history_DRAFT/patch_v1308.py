"""Author: Andrew Fisher. Verified historical weather through the final demob day."""
from pathlib import Path
import hashlib
import json
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
from weather_archive1308 import update_archive

BASE_SHA = 'e632b5bbe5aaab781bb7242b892d102e1e8e8894dd973223d6a57e1839443428'


def archive_from_page(text):
    at = text.index('const ARCHIVE = ') + len('const ARCHIVE = ')
    return json.JSONDecoder().raw_decode(text[at:])[0]


def patch(text, path='page'):
    if '202611-15nov1308' in text:
        raise ValueError('Historical weather v13.08 already applied')
    if hashlib.sha256(text.encode()).hexdigest() != BASE_SHA:
        raise ValueError('v13.08 requires the exact verified live v13.07 base')
    at = text.index('const ARCHIVE = ') + len('const ARCHIVE = ')
    archive, length = json.JSONDecoder().raw_decode(text[at:])
    updated = update_archive(archive)
    text = rep(text, ' const ARCHIVE = ' + text[at:at + length], ' const ARCHIVE = ' + json.dumps(updated, indent=2, ensure_ascii=False),
               'complete 4 November and add nine verified final demob weather days', path)
    return rep(text, "+' · v13.07'; /* v8.19 release922", "+' · v13.08'; /* v8.19 release922",
               'v13.08 footer', path)


if __name__ == '__main__':
    page = Path(sys.argv[1])
    page.write_text(patch(page.read_text(), str(page)))
    print('v13.08: 68 observation dates through 13 November; 4 November completed')
