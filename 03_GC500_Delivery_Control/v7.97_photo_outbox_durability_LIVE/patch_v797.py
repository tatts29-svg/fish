#!/usr/bin/env python3
"""Author: Andrew Fisher. Durable photo outbox and truthful acknowledgement."""
from pathlib import Path
import hashlib
import re
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
# Exact original spans and hashes. These refuse an unexpectedly modified base.
SPANS = {
    'photoIdb': ('function photoIdb(mode, fn){', 'async function photoOutboxPut(e){', 'bace3bf3593c259be0a67a39eafa1decabb85a84193107c562ed322ba3451006'),
    'photoOutboxPut': ('async function photoOutboxPut(e){', 'async function photoOutboxDelete(id){', 'd9822246d71164af03b521ff8046417b8c8b6d58905caac046ac988bc79172c6'),
    'photoOutboxDelete': ('async function photoOutboxDelete(id){', 'async function photoOutboxAll(){', '980b87fda1b6dadf3e2cfcbeb3dc830592ea7732e01c03a1114a8b3e144f3fea'),
    'photoSend': ('async function photoSend(e, say){', '/* everything waiting on this device goes', 'bb8bbb8ec56c102716cb23c47b5401f009f0ed5f5a59b81e3efdbc950fa5fe07'),
    'photoOutboxResume': ('async function photoOutboxResume(why){', '/* once, when the service link is up', '7705e3da2838762965a442d4e3f264842b32a4495b28b04c46aa1333ad6fc852'),
    'photoOutboxBoot': ('function photoOutboxBoot(){', '/* forget one that is waiting', '1319b8e0845e3d8181a034bfcb7833a23beae648a93d8cabde9922645aae670e'),
    'photoOutboxForget': ('async function photoOutboxForget(id, say){', '/* ------------------------------------------------------------------ photographs on the service', '5969e2929cc48faf0fafd271532d8a7d7de635e30cd13620e263ef8d0ffb1a4e'),
    'photoSendingCell': ('function photoSendingCell(e, lab, can){', 'function dropPhotoSlots(key, unit, opts){', 'ffbbece4e10520989c5430b1973781c7a25894f5f4859eacf4d3154e4510ba40'),
    'dropPhotoAddUnlocked': ('async function dropPhotoAddUnlocked(key, slot, file, say, unit){', 'async function dropPhotoRemove(key, slot, say, unit){', '56a815f9113500c0cf9873bb8521fcff12c07ff65ddb356fb6b89b51068ddddf'),
}
def apply(text, path):
    if 'function photoRecordAck797(' in text:
        raise SystemExit('v7.97 photo durability already applied')
    if 'const PHOTO_OUTBOX = new Map();' not in text or 'function syncSettled(name, id, body, j){' not in text:
        raise SystemExit('v7.97 requires the document-based photo outbox and acknowledgement queue')
    chunks = re.split(r'/\* PHOTO797: (\w+) \*/\n', (HERE / 'photo797_src.js').read_text())
    parts = dict(zip(chunks[1::2], chunks[2::2]))
    for name, (start, end, digest) in SPANS.items():
        if text.count(start) != 1:
            raise SystemExit('v7.97 expected exactly one ' + name)
        a = text.index(start)
        b = text.find(end, a)
        if b < 0:
            raise SystemExit('v7.97 missing end of ' + name)
        old = text[a:b]
        if hashlib.sha256(old.encode()).hexdigest() != digest:
            raise SystemExit('v7.97 base changed in ' + name + '; review before patching')
        new = parts[name]
        if name == 'photoSend':
            new = parts['helpers'] + new
        text = rep(text, old, new, 'Photo durability: ' + name, path)
    return text
if __name__ == '__main__':
    path = Path(sys.argv[1])
    path.write_text(apply(path.read_text(), str(path)))
    print('v7.97 photo outbox durability applied')
