"""Author: Andrew Fisher. Guarded presentation helper; private review input stays private."""
from datetime import date
import hashlib
import json
import os
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

FIELDS = {
    'red': ['date', 'location', 'quantities', 'components'],
    'green': ['date', 'location', 'labour_hours', 'crew_note', 'metres'],
    'blue': ['date', 'location', 'collected', 'hire_agreements_written'],
}
HASH = re.compile(r'^[a-f0-9]{64}$')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def checked_file(path, expected_hash, label):
    require(isinstance(path, str) and Path(path).is_absolute(), label + ' needs a private absolute build path')
    require(isinstance(expected_hash, str) and HASH.fullmatch(expected_hash), label + ' needs a SHA-256')
    raw = Path(path).read_bytes()
    require(hashlib.sha256(raw).hexdigest() == expected_hash, label + ' hash changed')
    import io
    if raw.startswith(b'%PDF-'):
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(raw))
        require(not reader.is_encrypted, label + ' is encrypted')
        return {'media_type': 'application/pdf', 'pages': len(reader.pages)}
    if raw.startswith(b'\xff\xd8\xff'):
        from PIL import Image
        with Image.open(io.BytesIO(raw)) as image:
            require(image.format == 'JPEG', label + ' has an unsupported image format')
            image.verify()
        return {'media_type': 'image/jpeg', 'pages': 1}
    raise ValueError(label + ' must be a PDF or JPEG original')


def page_pixels(path, page):
    """Compare decoded source pixels without converting or editing the original file."""
    with open(path, 'rb') as stream:
        is_pdf = stream.read(5) == b'%PDF-'
    if is_pdf:
        import fitz
        with fitz.open(path) as doc:
            pix = doc.load_page(page - 1).get_pixmap(matrix=fitz.Matrix(1, 1), alpha=False)
            return pix.width, pix.height, hashlib.sha256(pix.samples).hexdigest()
    require(page == 1, 'A JPEG original has exactly one page')
    from PIL import Image, ImageOps
    with Image.open(path) as image:
        rgb = ImageOps.exif_transpose(image).convert('RGB')
        return rgb.width, rgb.height, hashlib.sha256(rgb.tobytes()).hexdigest()


def load_input(path=None):
    """Verify original/private PDF bytes, then remove every filesystem path."""
    path = path or os.environ.get('FENCE_REVIEW836_INPUT')
    require(bool(path), 'Set FENCE_REVIEW836_INPUT to the private reviewed manifest')
    data = json.loads(Path(path).read_text())
    require(data.get('schema') == 1 and data.get('author') == 'Andrew Fisher', 'Wrong review schema or author')
    require(isinstance(data.get('sources'), list) and data['sources'], 'Review sources are required')
    require(isinstance(data.get('rows'), list) and data['rows'], 'Reviewed rows are required')
    sources, by_id, source_paths = [], {}, {}
    for source in data['sources']:
        identity = source.get('id')
        require(isinstance(identity, str) and identity and '/' not in identity and '\\' not in identity and identity not in by_id, 'Source file identity must be unique and path-free')
        require(isinstance(source.get('title'), str) and source['title'].strip(), 'Source title is required')
        reader = checked_file(source.get('path'), source.get('sha256'), 'Source ' + identity)
        clean = {key: source[key] for key in ['id', 'title', 'sha256']}
        clean.update(reader)
        require(source.get('media_type', clean['media_type']) == clean['media_type'], 'Source media type differs from its actual bytes')
        require(clean['pages'] > 0, 'Source has no pages')
        by_id[identity] = clean
        source_paths[identity] = source['path']
        sources.append(clean)
    rows, ids, numbers = [], set(), set()
    for row in data['rows']:
        identity, number, book = row.get('record_id'), row.get('docket_no'), row.get('book')
        require(isinstance(identity, str) and identity and identity not in ids, 'Duplicate or missing reviewed record ID')
        require(isinstance(number, str) and number and number not in numbers, 'Duplicate or missing reviewed docket number')
        require(book in FIELDS, 'Unknown reviewed book')
        ids.add(identity)
        numbers.add(number)
        reviewed_on = row.get('reviewed_on')
        require(isinstance(reviewed_on, str) and date.fromisoformat(reviewed_on).isoformat() == reviewed_on, 'Review date must be an ISO day')
        original, summary = row.get('original'), row.get('summary')
        require(isinstance(original, dict) and original.get('source_id') in by_id, 'Original source is not bound')
        require(summary is None or isinstance(summary, dict) and summary.get('source_id') in by_id, 'Summary source is not bound')
        page = original.get('page')
        require(type(page) is int and 1 <= page <= by_id[original['source_id']]['pages'], 'Original local page is outside its PDF')
        one = checked_file(original.get('page_path'), original.get('page_sha256'), 'Reviewed page ' + identity)
        require(one['pages'] == 1, 'Reviewed page export must contain exactly one page')
        require(one['media_type'] == by_id[original['source_id']]['media_type'], 'Reviewed page must use its original media type')
        require(page_pixels(original['page_path'], 1) == page_pixels(source_paths[original['source_id']], page), 'Reviewed page export differs from its named original page')
        expected = row.get('expected')
        require(isinstance(expected, dict) and set(expected) == set(FIELDS[book]), 'Expected fields must match the reviewed book signature exactly')
        # Reject NaN/Infinity and non-JSON inputs before any values are embedded.
        json.dumps(expected, allow_nan=False)
        po = row.get('po')
        if po is not None:
            require(isinstance(po, dict) and isinstance(po.get('number'), str) and re.fullmatch(r'\d{4,12}', po['number']), 'P/O number is not valid')
            require(summary is not None and po.get('basis') == 'source_summary' and po.get('source_id') == summary['source_id'], 'P/O needs its explicit matching summary')
            po = {key: po[key] for key in ['number', 'basis', 'source_id']}
        query = row.get('query')
        require(isinstance(query, dict) and type(query.get('open')) is bool and isinstance(query.get('text'), str) and query['text'].strip(), 'Charge query scope must use an explicit boolean and explanation')
        rows.append({'record_id': identity, 'docket_no': number, 'book': book, 'reviewed_on': reviewed_on,
                     'original': {key: original[key] for key in ['source_id', 'page', 'page_sha256']},
                     'summary': {'source_id': summary['source_id']} if summary else None, 'po': po,
                     'expected': expected, 'query': {'open': query['open'], 'text': query['text']}})
    return {'schema': 1, 'author': 'Andrew Fisher', 'sources': sources, 'rows': rows}


def changes(manifest):
    payload = json.dumps(manifest, ensure_ascii=False, separators=(',', ':'), allow_nan=False)
    payload = payload.replace('<', '\\u003c').replace('>', '\\u003e').replace('&', '\\u0026').replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    source = 'const FENCE_REVIEW836 = ' + payload + ';\n' + (ROOT / 'fencing_review836_src.js').read_text()
    style = '<style id="fencing-review836">\n' + (ROOT / 'fencing_review836.css').read_text() + '</style>\n'
    return [
        ('function fencePrivatePapers(d){', source + '\nfunction fencePrivatePapers(d){', 'Add pure reviewed-source context'),
        (" const ps=fencePrivatePapers(d),ready=ps.filter(p=>p.result.state==='ready'),support=fenceSupportSources829(d);",
         " const ps=fencePrivatePapers(d),ready=ps.filter(p=>p.result.state==='ready'),support=fenceSupportSources829(d);\n const reviewed=fenceReviewContext836(d);\n if(!ready.length&&reviewed.paper)ready.push(reviewed.paper);", 'Use verified reviewed pack only as a missing-paper fallback'),
        ("${i?'Docket file '+(i+1):'Open docket'}", "${p.paper.reviewedSource?'Open reviewed docket'+(p.paper.reviewedPage?' · page '+esc(p.paper.reviewedPage):''):i?'Docket file '+(i+1):'Open docket'}", 'Name a reviewed pack page honestly'),
        ("${p.paper.byName?'matched by docket number':'linked to this record'}", "${p.paper.reviewedSource?'reviewed source'+(p.paper.reviewedPage?' · page '+esc(p.paper.reviewedPage):''):p.paper.byName?'matched by docket number':'linked to this record'}", 'Preserve link provenance'),
        (" const book=d.book||'red',paper=fencePrivatePaperState(d),no=d.docket_no||d.id;", " const book=d.book||'red',paper=fencePrivatePaperState(d),no=d.docket_no||d.id,review=fenceReviewContext836(d);", 'Read review context without changing native records'),
        ('<h4>${esc(no)}</h4>', '<h4>${esc(no)}${fenceReviewHeading836(review)}</h4>', 'Place P/O beside the existing docket heading'),
        ('<span class="fp-status fp-${paper.key}">${paper.key===\'ready\'?\'✓ \':\'\'}${paper.text}</span>', '<div class="fp-review-statuses"><span class="fp-status fp-${paper.key}">${paper.key===\'ready\'?\'✓ \':\'\'}${paper.text}</span><span class="fp-review-note">${fenceReviewStatus836(review)}</span></div>', 'Retain docket approval beside separate source and charge states'),
        ('<div class="fp-evidence-body">${d.usable===false?', '<div class="fp-evidence-body">${fenceReviewDetails836(review,paper)}${d.usable===false?', 'Keep association basis in the existing source details'),
        ('</head>\n<body>', style + '</head>\n<body>', 'Scope minimal review context styling'),
    ]


def apply(text, input_path=None):
    require('function pricingAction834(' in text and 'event833-table' in text, 'The checked cleanup and staff-table base must be present')
    require('const FENCE_REVIEW836 =' not in text and 'function fencingReview836(' not in text, 'Review presentation is already applied')
    manifest = load_input(input_path)
    for old, new, label in changes(manifest):
        rep(text, old, new, label, 'host')
        require(text.count(old) == 1, 'Exact reviewed source has changed: ' + label)
        text = text.replace(old, new, 1)
    return text
