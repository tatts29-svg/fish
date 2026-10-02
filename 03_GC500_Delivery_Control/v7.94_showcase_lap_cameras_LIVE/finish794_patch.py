#!/usr/bin/env python3
"""Author: Andrew Fisher. Fine dry road and bounded existing-pass edge finish."""
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def apply(html, path='Showcase HTML'):
    """Patch the renderer only; the owning v7.94 patch adds presentation separately."""
    if 'vec4 finishEdges794(' in html:
        raise SystemExit('v7.94 surface finish already applied')
    if 'G.photoRefinement792=' not in html:
        raise SystemExit('v7.94 surface finish requires v7.92 photo refinement')
    html = rep(html, 'vec2 grainP=vP*220.,aggregateP=vP*68.;',
               '/* v7.94: approximately 14 mm fines and 36 mm aggregate; baseline retains its scales. */\n'
               ' vec2 grainP=vP*(uDetail781>.5?420.:220.),aggregateP=vP*(uDetail781>.5?165.:68.);',
               'Fine asphalt scales', path)
    html = rep(html, 'vec2 binderP=vP*23.,settleP=vP*6.8;',
               'vec2 binderP=vP*55.,settleP=vP*18.;', 'Restrained asphalt binder scales', path)
    html = rep(html, 'body*=1.+grain*.38+aggregate*.36+binder*.22+settle*.16+dryGrade*.10-laneAge*.024;',
               '/* Source footage shows quiet dry aggregate, not large cloudy road patches. */\n'
               '  body*=1.+grain*.28+aggregate*.20+binder*.040+settle*.012+dryGrade*.014-laneAge*.024;',
               'Restrained dry road variation', path)
    html = rep(html, 'float roughness=clamp(.84+binder*.12+dryGrade*.055+repairMask781*.045,.76,.94);',
               'float roughness=clamp(.90+binder*.05+dryGrade*.025+repairMask781*.045,.86,.97);',
               'Dry asphalt roughness', path)
    html = rep(html, 'asphalt+=vec3(1.02,.89,.73)*broad*grazing*.095*visibility;',
               'asphalt+=vec3(1.02,.89,.73)*broad*grazing*.045*visibility;',
               'Quiet grazing road sheen', path)
    anchor = 'void main(){\n vec4 s=texture(uScene,vUV);\n vec3 b=texture(uBloom,vUV).rgb*.62+texture(uBloom2,vUV).rgb*.85;'
    replacement = ((HERE / 'finish794_edges.glsl').read_text() + '\n' +
                   'void main(){\n vec4 s=finishEdges794(texture(uScene,vUV));\n'
                   ' vec3 b=texture(uBloom,vUV).rgb*.62+texture(uBloom2,vUV).rgb*.85;')
    return rep(html, anchor, replacement, 'Bounded composite edge finish', path)
