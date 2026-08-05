#!/usr/bin/env python3
"""Verify a Coates MyGear thumbnail release without misclassifying family reuse.

This checker validates exact release hashes when a manifest is supplied, blocks
the known 06-Aug-2026 placeholder by its full SHA-256, and checks JPEG type,
dimensions and file-size limits using only Python's standard library.

Byte-identical files are reported as shared family renders. Duplicate bytes do
not prove that an image is fake, and unique bytes do not prove that it is a
photograph.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import sys
from collections import defaultdict
from pathlib import Path


KNOWN_PLACEHOLDER_SHA256 = (
    "5797e41730a8aa1a8a55ae639f73ba7eaa0c5c7cfb684eca6e4e83116126c61a"
)
DEFAULT_MAX_BYTES = 80 * 1024
SOF_MARKERS = {
    0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
    0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF,
}


def jpeg_dimensions(payload: bytes) -> tuple[int, int]:
    """Return width and height from JPEG frame markers."""
    if len(payload) < 4 or payload[:2] != b"\xff\xd8":
        raise ValueError("not a JPEG file")
    index = 2
    while index < len(payload):
        while index < len(payload) and payload[index] != 0xFF:
            index += 1
        while index < len(payload) and payload[index] == 0xFF:
            index += 1
        if index >= len(payload):
            break
        marker = payload[index]
        index += 1
        if marker in {0x01, 0xD8, 0xD9}:
            continue
        if index + 2 > len(payload):
            break
        segment_length = int.from_bytes(payload[index:index + 2], "big")
        if segment_length < 2 or index + segment_length > len(payload):
            raise ValueError("invalid JPEG segment length")
        if marker in SOF_MARKERS:
            if segment_length < 7:
                raise ValueError("invalid JPEG frame header")
            height = int.from_bytes(payload[index + 3:index + 5], "big")
            width = int.from_bytes(payload[index + 5:index + 7], "big")
            if width <= 0 or height <= 0:
                raise ValueError("invalid JPEG dimensions")
            return width, height
        index += segment_length
    raise ValueError("JPEG frame marker not found")


def load_manifest(path: Path) -> dict[str, dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        rows = list(csv.DictReader(handle))
    required = {"output_filename", "output_sha256"}
    if not rows or not required.issubset(rows[0]):
        missing = sorted(required - set(rows[0] if rows else []))
        raise ValueError(f"manifest missing required columns: {', '.join(missing)}")
    records: dict[str, dict[str, str]] = {}
    for row in rows:
        filename = (row.get("output_filename") or "").strip()
        key = filename.casefold()
        if not filename:
            raise ValueError("manifest contains a blank output_filename")
        if key in records:
            raise ValueError(f"manifest contains a duplicate filename: {filename}")
        records[key] = row
    return records


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate a Coates MyGear thumbnail release."
    )
    parser.add_argument(
        "--thumbs-dir",
        type=Path,
        default=Path(__file__).resolve().parent / "thumbs",
        help="Folder containing the JPG files (default: ./thumbs beside this script).",
    )
    parser.add_argument(
        "--release-manifest",
        "--manifest",
        dest="manifest",
        type=Path,
        help="Release CSV used for exact filename and SHA-256 validation.",
    )
    parser.add_argument(
        "--max-bytes",
        type=int,
        default=DEFAULT_MAX_BYTES,
        help="Maximum JPG size in bytes (default: 81920, i.e. 80 KiB).",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    thumbs_dir = args.thumbs_dir.resolve()
    if not thumbs_dir.is_dir():
        print(f"ERROR: thumbnail folder not found: {thumbs_dir}")
        return 2

    manifest: dict[str, dict[str, str]] | None = None
    if args.manifest:
        try:
            manifest = load_manifest(args.manifest.resolve())
        except (OSError, ValueError) as exc:
            print(f"ERROR: cannot read release manifest: {exc}")
            return 2

    files = sorted(thumbs_dir.glob("*.jpg"), key=lambda item: item.name.casefold())
    if not files:
        print(f"ERROR: no JPG files found in {thumbs_dir}")
        return 2

    errors: list[str] = []
    by_hash: dict[str, list[str]] = defaultdict(list)
    actual_by_name: dict[str, Path] = {}
    for path in files:
        key = path.name.casefold()
        if key in actual_by_name:
            errors.append(f"case-insensitive filename collision: {path.name}")
            continue
        actual_by_name[key] = path
        try:
            payload = path.read_bytes()
            digest = hashlib.sha256(payload).hexdigest()
            width, height = jpeg_dimensions(payload)
        except (OSError, ValueError) as exc:
            errors.append(f"{path.name}: {exc}")
            continue
        by_hash[digest].append(path.name)
        if digest == KNOWN_PLACEHOLDER_SHA256:
            errors.append(f"{path.name}: blocked 06-Aug placeholder hash detected")
        if (width, height) != (800, 800):
            errors.append(f"{path.name}: {width}x{height}, expected 800x800")
        if len(payload) > args.max_bytes:
            errors.append(
                f"{path.name}: {len(payload):,} bytes, exceeds {args.max_bytes:,}"
            )
        if manifest is not None:
            expected = manifest.get(key)
            if expected is None:
                errors.append(f"{path.name}: not listed in release manifest")
            else:
                expected_hash = (expected.get("output_sha256") or "").strip().lower()
                if digest != expected_hash:
                    errors.append(
                        f"{path.name}: SHA-256 mismatch "
                        f"(expected {expected_hash}, got {digest})"
                    )

    if manifest is not None:
        missing = [
            row["output_filename"]
            for key, row in manifest.items()
            if key not in actual_by_name
        ]
        for filename in missing:
            errors.append(f"missing manifest file: {filename}")

    duplicate_groups = {digest: names for digest, names in by_hash.items() if len(names) > 1}
    duplicate_files = sum(len(names) for names in duplicate_groups.values())

    print("=" * 72)
    print(" COATES | MYGEAR THUMBNAIL RELEASE VERIFICATION")
    print("=" * 72)
    print(f" Folder                : {thumbs_dir}")
    print(f" JPG files checked     : {len(files):,}")
    print(f" Unique byte hashes    : {len(by_hash):,}")
    print(f" Shared-family files   : {duplicate_files:,} in {len(duplicate_groups):,} hash group(s)")
    print(f" Known placeholder hits: {sum(KNOWN_PLACEHOLDER_SHA256 in [h] for h in by_hash):,}")
    print(f" Manifest validation   : {'YES' if manifest is not None else 'NO'}")
    print("")
    print("Duplicate hashes are expected where one approved family render serves")
    print("multiple variant codes. They are not evidence that those files are the")
    print("blocked placeholder, and they are not proof of a real photograph.")

    if errors:
        print("")
        print(f"FAILED - {len(errors):,} issue(s):")
        for item in errors[:100]:
            print(f"  - {item}")
        if len(errors) > 100:
            print(f"  ... and {len(errors) - 100:,} more")
        return 1

    print("")
    print("PASS - filenames, exact hashes, JPEG dimensions, file sizes and the")
    print("known-placeholder blocklist all passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
