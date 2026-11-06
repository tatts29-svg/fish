#!/usr/bin/env python3
"""Author: Andrew Fisher. Guarded, offline source-plan note transcription patch.

Source strings belong in a private JSON spec, never in this helper. No host code is
executed. Only two existing note-text string tokens may change; the rest of the
input bytes and all other parsed DATA values must remain identical.
"""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
from pathlib import Path
import re


class GuardError(ValueError):
    """The input does not match the reviewed, narrowly permitted change."""


def digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def data_region(text: str):
    matches = list(re.finditer(r"\bconst\s+DATA\s*=\s*", text))
    if len(matches) != 1:
        raise GuardError("Expected exactly one embedded DATA assignment")
    start = matches[0].end()
    try:
        data, length = json.JSONDecoder().raw_decode(text[start:])
    except (ValueError, TypeError) as exc:
        raise GuardError("Embedded DATA is not literal JSON") from exc
    if not isinstance(data, dict):
        raise GuardError("Embedded DATA must be an object")
    return data, start, start + length


def note_path(pointer: str) -> list[str | int]:
    match = re.fullmatch(
        r"/fencing/week_sheets/(0|[1-9]\d*)/plan_update/notes/(0|[1-9]\d*)/text",
        pointer,
    )
    if not match:
        raise GuardError("Only an existing plan-page note text may be patched")
    return ["fencing", "week_sheets", int(match[1]), "plan_update", "notes", int(match[2]), "text"]


def value_at(data, path):
    try:
        for key in path:
            data = data[key]
    except (KeyError, IndexError, TypeError) as exc:
        raise GuardError("The target note does not exist") from exc
    return data


def string_token_span(region: str, before: str) -> tuple[int, int]:
    # Decode string tokens rather than searching arbitrary raw substrings. This
    # accepts literal or escaped Unicode while refusing ambiguous occurrences.
    decoder = json.JSONDecoder()
    found = []
    i = 0
    while i < len(region):
        if region[i] != '"':
            i += 1
            continue
        value, token_end = decoder.raw_decode(region, idx=i)
        if value == before:
            found.append((i, token_end))
        i = token_end
    if len(found) != 1:
        raise GuardError("Reviewed note text is absent or not unique in DATA")
    return found[0]


def patch_host(host: bytes, spec: dict) -> tuple[bytes, dict]:
    if not isinstance(spec, dict):
        raise GuardError("Spec must be an object")
    expected_hash = spec.get("expected_host_sha256")
    if not isinstance(expected_hash, str) or not re.fullmatch(r"[0-9a-f]{64}", expected_hash):
        raise GuardError("A complete expected host SHA-256 is required")
    if digest(host) != expected_hash:
        raise GuardError("Host SHA-256 does not match the reviewed source")
    changes = spec.get("changes")
    if not isinstance(changes, list) or len(changes) != 2:
        raise GuardError("Exactly two reviewed note appends are required")
    try:
        text = host.decode("utf-8")
    except UnicodeError as exc:
        raise GuardError("Host must be UTF-8") from exc
    original, start, end = data_region(text)
    expected = copy.deepcopy(original)
    region = text[start:end]
    replacements = []
    seen = set()
    evidence = []
    for change in changes:
        if not isinstance(change, dict):
            raise GuardError("Each change must be an object")
        pointer = change.get("path")
        if not isinstance(pointer, str) or pointer in seen:
            raise GuardError("Target paths must be distinct strings")
        seen.add(pointer)
        path = note_path(pointer)
        before, append = change.get("before"), change.get("append")
        if not isinstance(before, str) or not isinstance(append, str) or not append.strip():
            raise GuardError("Existing text and a nonempty text append are required")
        if value_at(original, path) != before:
            raise GuardError("Target text differs from the reviewed before value")
        if append in before:
            raise GuardError("This append is already present")
        after = before + append
        container = value_at(expected, path[:-1])
        container[path[-1]] = after
        left, right = string_token_span(region, before)
        # Escaping '<' prevents source text from ending an HTML script element.
        token = json.dumps(after, ensure_ascii=True).replace("<", "\\u003c")
        replacements.append((left, right, token))
        evidence.append({
            "path": pointer,
            "before_text_sha256": digest(before.encode("utf-8")),
            "after_text_sha256": digest(after.encode("utf-8")),
            "existing_text_preserved": after.startswith(before),
        })
    changed_region = region
    for left, right, token in sorted(replacements, reverse=True):
        changed_region = changed_region[:left] + token + changed_region[right:]
    candidate_text = text[:start] + changed_region + text[end:]
    actual, actual_start, actual_end = data_region(candidate_text)
    if actual != expected:
        raise GuardError("Parsed DATA changed outside the reviewed notes")
    if candidate_text[:actual_start] != text[:start] or candidate_text[actual_end:] != text[end:]:
        raise GuardError("Host bytes outside DATA changed")
    candidate = candidate_text.encode("utf-8")
    return candidate, {
        "author": "Andrew Fisher",
        "input_sha256": digest(host),
        "output_sha256": digest(candidate),
        "input_bytes": len(host),
        "output_bytes": len(candidate),
        "changed_note_count": len(evidence),
        "changes": evidence,
        "all_other_data_values_equal": True,
        "all_bytes_outside_two_string_tokens_preserved": True,
        "attachment_or_host_code_executed": False,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--host", required=True, type=Path)
    parser.add_argument("--spec", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--evidence", required=True, type=Path)
    args = parser.parse_args()
    if len({p.resolve() for p in [args.host, args.spec, args.output, args.evidence]}) != 4:
        raise GuardError("Inputs, candidate and evidence paths must be distinct")
    if args.output.exists() or args.evidence.exists():
        raise GuardError("Refusing to overwrite an existing candidate or evidence file")
    spec = json.loads(args.spec.read_text(encoding="utf-8"))
    candidate, evidence = patch_host(args.host.read_bytes(), spec)
    args.output.write_bytes(candidate)
    args.evidence.write_text(json.dumps(evidence, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"candidate_sha256": evidence["output_sha256"], "changed_notes": 2}))


if __name__ == "__main__":
    main()
