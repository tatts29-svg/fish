#!/usr/bin/env python3
"""Author: Andrew Fisher. CPU/source contracts; GPU/visual checks remain separate."""
import json
from pathlib import Path
import re
import sys
from finish794_patch import apply

HERE = Path(__file__).resolve().parent
path = Path(sys.argv[1]) if len(sys.argv) > 1 else HERE.parent / 'build/GC500_v7.94/GC500_Delivery_Control_hosted.html'
before = path.read_text()
after = apply(before, str(path))
checks = []


def check(name, condition):
    checks.append({'name': name, 'pass': bool(condition)})
    assert condition, name


def shader(text, name):
    return re.search(r'const ' + name + r' = `([\s\S]*?)`;', text).group(1)


def without_changed_shaders(text):
    for name in ('FLAT_FS', 'COMP_FS'):
        text = text.replace(shader(text, name), '<' + name + '>')
    return text


comp_before, comp_after = shader(before, 'COMP_FS'), shader(after, 'COMP_FS')
flat_before, flat_after = shader(before, 'FLAT_FS'), shader(after, 'FLAT_FS')
check('Only FLAT_FS and COMP_FS change; all geometry, cameras, paint, runtime and resource setup preserved',
      without_changed_shaders(before) == without_changed_shaders(after))
check('Existing shader uniform declarations preserved',
      re.findall(r'uniform[^;]*;', comp_before) == re.findall(r'uniform[^;]*;', comp_after)
      and re.findall(r'uniform[^;]*;', flat_before) == re.findall(r'uniform[^;]*;', flat_after))
check('Existing sky, depth reconstruction and ambient contact functions unchanged',
      comp_before[:comp_before.index('void main(){')] in comp_after)
check('Composite main keeps exposure, bloom, alpha and sky expressions exactly',
      comp_before[comp_before.index('void main(){'):].replace('texture(uScene,vUV)', 'finishEdges794(texture(uScene,vUV))', 1)
      == comp_after[comp_after.index('void main(){'):])
check('Only six additional scene reads, no new depth or bloom reads',
      comp_after.count('texture(uScene,') - comp_before.count('texture(uScene,') == 6
      and comp_after.count('texture(uDepth,') == comp_before.count('texture(uDepth,')
      and comp_after.count('texture(uBloom,') == comp_before.count('texture(uBloom,'))
helper = comp_after[comp_after.index('vec4 finishEdges794('):comp_after.index('void main(){')]
check('Baseline and night bypass before neighbour sampling',
      helper.index('if(uDetail781<.5||centre.a<.999)return centre;') < helper.index('texture(')
      and 'const detail781=S.detail781Enabled&&L.day?1:0;' in after)
check('Transparent centre, diagonals and directional taps guarded',
      all(s in helper for s in ('centre.a<.999', 'min(sw.a,se.a))<.999', 'min(p.a,q.a)<.999', 'centre.a);')))
check('Low contrast pixels skip both directional taps',
      helper.index('if(hi-lo<max(.022,hi*.18))return centre;') < helper.index('vec4 p=texture('))
check('Two-texel direction bound and luminance range protection',
      'vec2(-2.),vec2(2.)' in helper and 'if(luma<lo||luma>hi)return centre;' in helper)
check('No loops, random/time inputs, allocations or added texture resources',
      not re.search(r'\b(for|while|uTime|random|createTexture|createFramebuffer)\b', helper))
check('Original baseline asphalt scales retained outside detail mode',
      'uDetail781>.5?420.:220.' in flat_after and 'uDetail781>.5?165.:68.' in flat_after)
check('Fine noise retains derivative filtering',
      all(s in flat_after for s in ('fwidth(grainP.x)', 'fwidth(aggregateP.x)', 'surfaceDetail(binderP)', 'surfaceDetail(settleP)')))
check('Broad road modulation amplitude reduced by over 80 percent',
      (.040 + .012 + .014) / (.22 + .16 + .10) < .2)
check('Day roughness remains matte and grazing sheen is reduced',
      '.86,.97' in flat_after and 'broad*grazing*.045*visibility' in flat_after)
check('Opaque road atmospheric coverage unchanged',
      'o=vec4(asphalt*fg,fg);' in flat_before and 'o=vec4(asphalt*fg,fg);' in flat_after)
try:
    apply(after)
except SystemExit as error:
    check('Duplicate application rejected', 'already applied' in str(error))
else:
    check('Duplicate application rejected', False)
try:
    apply(before.replace('G.photoRefinement792=', 'G.wrongBase='))
except SystemExit as error:
    check('Wrong base rejected', 'requires v7.92' in str(error))
else:
    check('Wrong base rejected', False)

print(json.dumps({'author': 'Andrew Fisher', 'checks': checks, 'passed': len(checks),
                  'scope': 'CPU/source contracts only; no browser, GPU compilation or physical-phone timing claim',
                  'resourceBudget': {'newPasses': 0, 'newTextures': 0, 'newUniforms': 0,
                                     'extraSceneReadsOpaqueFlat': 4, 'extraSceneReadsOpaqueEdgeMaximum': 6}}, indent=2))
