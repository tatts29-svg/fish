#!/usr/bin/env python3
"""Author: Andrew Fisher. Apply the two reviewed v10.90 scopes to exact live v10.89."""
import argparse
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / "toolchain"))
from rep import rep


def load_patch(name):
    spec = importlib.util.spec_from_file_location(name, HERE / (name + ".py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.patch


def patch(text, path):
    base = json.loads((HERE / "base.json").read_text())
    if base["version"] != "v10.89":
        raise ValueError("Unexpected release base")
    if hashlib.sha256(text.encode()).hexdigest() != base["sha256"]:
        raise ValueError("Live base SHA-256 mismatch; rebuild and review against current live")
    text = load_patch("patch_area_photos1090")(text, path)
    text = load_patch("patch_showcase1090")(text, path)
    return rep(text, "' · v10.89'", "' · v10.90'", "release version", path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path, nargs="?")
    args = parser.parse_args()
    output = args.output or args.input
    result = patch(args.input.read_text(), str(args.input))
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(result)
    print(json.dumps({
        "sha256": hashlib.sha256(result.encode()).hexdigest(),
        "bytes": len(result.encode()),
        "version": "v10.90"
    }))
