"""Author: Andrew Fisher. Compose the bounded v10.98 release on its exact live base."""
import importlib.util
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent


def component(stem, filename):
    folders = [ROOT / (stem + suffix) for suffix in ('_DRAFT', '_LIVE')]
    matches = [folder / filename for folder in folders if (folder / filename).is_file()]
    if len(matches) != 1:
        raise ValueError('Exactly one version of each release component is required')
    spec = importlib.util.spec_from_file_location(stem, matches[0])
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def patch(text):
    parts = [
        ('v10.98_servicing_location', 'patch_v1098.py'),
        ('v10.98_completion_tally', 'patch_completion1098.py'),
        ('v10.98_installation_dates', 'patch_installation_dates.py'),
        ('v10.98_vms_arrival', 'patch_vms_arrival.py'),
    ]
    for stem, filename in parts:
        text = component(stem, filename).patch(text)
    return text


if __name__ == '__main__':
    if len(sys.argv) != 2:
        raise SystemExit('usage: patch_release.py PAGE')
    page = Path(sys.argv[1])
    page.write_text(patch(page.read_text(encoding='utf-8')), encoding='utf-8')
