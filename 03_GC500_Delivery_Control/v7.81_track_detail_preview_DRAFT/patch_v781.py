#!/usr/bin/env python3
"""Author: Andrew Fisher. Build an opt-in track-detail preview; not a live release."""
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
from materials781 import apply as materials


def apply(text, path):
    if 'G.preview781=' in text:
        raise SystemExit('v7.81 preview is already applied')
    if 'save775Inner' not in text:
        raise SystemExit('Expected the reviewed v7.77-or-later live base')
    text = materials(text, rep, path)
    text = rep(text, ' /* start gantry: five red lamps, one at a time, then out */',
        ' if(!S.detail781Enabled){\n /* start gantry: five red lamps, one at a time, then out */',
        'Hide nominal wire gantry in detail preview', path)
    text = rep(text, ' /* aviation lights on the tallest towers */',
        ' }\n /* aviation lights on the tallest towers */', 'End nominal wire gantry gate', path)
    text = rep(text, 'if(S.gantry){const m=S.sim||{},t=clock;',
        'if(!S.detail781Enabled&&S.gantry){const m=S.sim||{},t=clock;', 'Hide detached nominal lamps', path)
    text = rep(text, 'if(S.pitWallMesh&&S.pitWallMesh.ni){flat(0,L.mat.walls);S.pitWallMesh.draw();}',
        'if(S.pitWallMesh&&S.pitWallMesh.ni){flat(S.detail781Enabled?5:0,S.detail781Enabled?{tint:[.17,.17,.17],lift:[.003,.003,.003]}:L.mat.walls);S.pitWallMesh.draw();}',
        'Matte pit-wall surface in preview', path)
    for old in (
        'if(S.standDecor&&S.standDecor.ni)',
        'if(S.standMesh&&S.standMesh.ni)',
        'if(S.standEdge)S.standEdge.draw();',
        'if(S.crowdMesh&&S.crowdMesh.ni)',
        'if(S.people&&S.people.n&&tg>0)',
        'if(S.crowd&&(L.lines.dynAdd==null?1:L.lines.dynAdd)>0)',
    ):
        text = rep(text, old, old.replace('if(', 'if(!S.detail781Enabled&&', 1),
            'Hide nominal dressing during illustrative section preview', path)
    text = rep(text, ' /* 1. buildings: opaque, fogged to transparent so the page shows through at distance */',
        ' if(G.drawSky781)G.drawSky781(S,cam,fov,w/h,shiftX,T.shiftY);\n\n /* 1. buildings: opaque, fogged to transparent so the page shows through at distance */',
        'Opt-in procedural sky', path)
    text = rep(text, ' /* v5.66 — rubber first: it lies ON the road, under the car\'s own shadow, and writes no depth so the',
        ' if(S.detail781Enabled){G.drawTrackDetail781(S,VP,fog);G.drawArchitecture781(S,VP,fog);gl.enable(gl.BLEND);}\n /* v5.66 — rubber first: it lies ON the road, under the car\'s own shadow, and writes no depth so the',
        'Opt-in static track and architecture', path)
    modules = '\n'.join((HERE / name).read_text() for name in (
        'track_detail781_src.js', 'architecture781_src.js', 'sky781_src.js', 'preview781_src.js'))
    return rep(text, '</script>\n</body></html>', '</script>\n<script>\n'+modules+'\n</script>\n</body></html>', 'Preview modules', path)


if __name__ == '__main__':
    path = Path(sys.argv[1])
    result = apply(path.read_text(), str(path))
    path.write_text(result)
