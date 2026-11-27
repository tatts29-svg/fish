"""Private manager download of the MMG worker register, independent of badge access."""
import contextlib
import datetime as dt
import io
import os
from pathlib import Path
import re
import tempfile
from xml.etree import ElementTree as ET
import zipfile

from qr_roster import _open, _headers, _field
from upload_policy import MMG_PROJECT, MMG_SCHEDULE

FILE = 'manager-worker-register.xlsx'
MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
AEST = dt.timezone(dt.timedelta(hours=10))


def _reject_active_content(body):
    # The register is distributed exactly as supplied. Only passive Excel content is supported.
    with zipfile.ZipFile(io.BytesIO(body)) as archive:
        for file in archive.infolist():
            name = file.filename.lower()
            if name.endswith(('.bin', '.vml')) or name.startswith((
                    'xl/externallinks/', 'xl/embeddings/', 'xl/activex/', 'xl/macrosheets/',
                    'xl/dialogsheets/', 'xl/querytables/', 'xl/connections.', 'customui/')):
                raise ValueError('Choose a plain Excel register without active content.')
            if not name.endswith(('.rels', '.xml')):
                continue
            content = archive.read(file)
            if re.search(rb'<!\s*(?:DOCTYPE|ENTITY)', content, re.I):
                raise ValueError('Choose a standard Excel workbook.')
            if name.endswith('.rels'):
                if any(r.get('TargetMode', '').lower() == 'external' for r in ET.fromstring(content)):
                    raise ValueError('The register must contain no external links.')
            elif re.search(rb'<(?:[\w.-]+:)?(?:f|formula|formula1|formula2|calculatedColumnFormula|totalsRowFormula)\b', content):
                raise ValueError('The register must contain values only. Remove workbook formulas.')


def _validate(body):
    try:
        with contextlib.closing(_open(body)) as book:
            _reject_active_content(body)
            if not {'REFERENCE_INFO', 'Worker register'} <= set(book.sheetnames):
                raise ValueError('Include the Worker register and REFERENCE_INFO worksheets.')
            ref = book['REFERENCE_INFO']
            ref.reset_dimensions()
            rows = ref.iter_rows()
            fields = _headers(next(rows, ()))
            if not {'project', 'project schedule'} <= fields.keys():
                raise ValueError('The register must identify the MMG project and shutdown schedule.')
            found = False
            for row in rows:
                if not any(c.value is not None for c in row):
                    continue
                expected = {'project': MMG_PROJECT, 'project schedule': MMG_SCHEDULE}
                if any(fields[k] >= len(row) or _field(row[fields[k]]).casefold() != v.casefold()
                       for k, v in expected.items()):
                    raise ValueError('The register is for a different MMG project or schedule.')
                found = True
            if not found:
                raise ValueError('The MMG project and schedule values are missing.')
            sheet = book['Worker register']
            sheet.reset_dimensions()
            headings = {'company', 'worker', 'assigned barcode'}
            rows = sheet.iter_rows(max_col=64)
            for _, row in zip(range(12), rows):
                if headings <= {_field(c).strip().casefold() for c in row}:
                    fields = _headers(row)
                    break
            else:
                raise ValueError('The Worker register needs Company, Worker and Assigned barcode headings.')
            count = 0
            for row in rows:
                if not _field(row[fields['worker']]):
                    continue
                badge = row[fields['assigned barcode']]
                if badge.value is not None and badge.data_type not in ('s', 'inlineStr'):
                    raise ValueError('Store assigned barcodes as text to preserve their printed digits.')
                count += 1
            if not count:
                raise ValueError('The Worker register contains no worker rows.')
            return count
    except ValueError:
        raise
    except Exception as exc:
        raise ValueError('Choose a readable, plain Excel worker register.') from exc


def updated(data_dir):
    try:
        stamp = (Path(data_dir) / FILE).stat().st_mtime
    except FileNotFoundError:
        return None
    return dt.datetime.fromtimestamp(stamp, AEST)


def install(data_dir, body):
    count = _validate(body)
    root = Path(data_dir)
    root.mkdir(parents=True, exist_ok=True)
    tmp = None
    try:
        with tempfile.NamedTemporaryFile(dir=root, prefix='.manager-register-', delete=False) as handle:
            tmp = Path(handle.name)
            handle.write(body)
            handle.flush()
            os.fsync(handle.fileno())
            stamp = dt.datetime.fromtimestamp(os.fstat(handle.fileno()).st_mtime, AEST)
        os.replace(tmp, root / FILE)
        fd = os.open(root, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(fd)
        finally:
            os.close(fd)
    finally:
        if tmp is not None:
            tmp.unlink(missing_ok=True)
    return {'rows': count, 'updated': stamp.isoformat(timespec='seconds')}
