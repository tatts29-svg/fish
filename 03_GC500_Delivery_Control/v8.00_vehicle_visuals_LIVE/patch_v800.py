#!/usr/bin/env python3
"""Author: Andrew Fisher. Integrate reviewed vehicle geometry and materials."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
import patch_racecar800
import patch_plant800
import patch_material800
import patch_camera800

MARKER = '<!-- Vehicle visual refinement v8.00 -->'
METADATA = MARKER + '\n<meta name="gc500-release" content="v8.00">\n'


def refine(text, path='Showcase HTML'):
    """Apply the isolated vehicle components in dependency order."""
    for component in (patch_racecar800, patch_plant800, patch_material800, patch_camera800):
        text = component.apply(text, path)
    return text


def metadata(text, path='Showcase HTML'):
    text = rep(text, '<title>GC500 Delivery Control</title>\n',
               METADATA + '<title>GC500 Delivery Control</title>\n',
               'Vehicle release metadata', path)
    text = rep(text, "G.showcase794={version:'v7.94',paint};",
               "G.showcase794={version:'v8.00',paint};",
               'Showcase release report version', path)
    return rep(text, "return Object.assign(report,{version:'v7.94',cameraOverride:",
               "return Object.assign(report,{version:'v8.00',cameraOverride:",
               'Full-lap release report version', path)


def apply(text, path='Showcase HTML'):
    if any(marker in text for marker in (MARKER, 'G.raceCarVisual800=', 'G.plantVisuals800=true;',
                                         'uSurface800', 'G.vehicleCamera800=')):
        raise SystemExit('v8.00 vehicle visual refinements already or partially applied')
    for required in ('function photoRecordAck797(', 'function drawerSync798Word(',
                     'G.deriveCorridor794=', "G.showcase794={version:'v7.94',paint};"):
        if required not in text:
            raise SystemExit('v8.00 requires the complete v7.97, v7.98 and v7.94 build chain')
    if '<meta name="gc500-release"' in text:
        raise SystemExit('v8.00 release metadata requires review of the existing version tag')
    return metadata(refine(text, path), path)


if __name__ == '__main__':
    path = Path(sys.argv[1])
    path.write_text(apply(path.read_text(), str(path)))
    print('v8.00 applied: race car, selectable vehicles, shared materials and detail cameras')
