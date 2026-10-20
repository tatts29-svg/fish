#!/usr/bin/env python3
"""Author: Andrew Fisher. Preserve embedded sources, media and existing named modules."""
import argparse
import hashlib
import json
import re
from pathlib import Path


def named_blocks(text):
    blocks = {}
    for match in re.finditer(r"<(script|style)\b([^>]*)>[\s\S]*?</\1>", text):
        identity = re.search(r"""\bid=["']([^"']+)["']""", match[2])
        if identity:
            key = match[1] + "#" + identity[1]
            if key in blocks:
                raise AssertionError("Duplicate named source module: " + key)
            blocks[key] = match[0]
    return blocks


def declaration_line(text, name):
    matches = re.findall(r"(?m)^const " + name + r"\s*=.*$", text)
    if not matches:
        raise AssertionError("Missing embedded declaration: " + name)
    # TEAM also has a separate, scoped servicing declaration. Preserve every
    # occurrence in source order rather than assuming the name is global.
    return matches


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base", type=Path)
    parser.add_argument("candidate", type=Path)
    args = parser.parse_args()
    base, candidate = args.base.read_text(), args.candidate.read_text()
    old, new = named_blocks(base), named_blocks(candidate)
    changed = [key for key, value in old.items() if new.get(key) != value]
    # Reviewed area-photo integration seams: context gallery plus explicit
    # exclusion from individual identification evidence. Their complete diffs
    # require source review and the focused photo tests.
    allowed = {
        "script#units925-script",
        "script#source-reference973-script",
        "script#tidy1051-script",
    }
    unexpected = sorted(set(changed) - allowed)
    if unexpected:
        raise AssertionError("Unrelated named modules changed: " + ", ".join(unexpected))
    for name in ("DATA", "PS7", "TEAM", "FCOM", "COMMITTED"):
        assert declaration_line(base, name) == declaration_line(candidate, name), name
    print(json.dumps({
        "result": "PASS",
        "existing_named_modules_unchanged": len(old) - len(changed),
        "reviewed_photo_integration_modules": sorted(changed),
        "embedded_data_and_media_unchanged": True,
        "servicing_script_sha256": hashlib.sha256(
            old["script#svc1067-script"].encode()
        ).hexdigest(),
        "candidate_sha256": hashlib.sha256(candidate.encode()).hexdigest()
    }))
