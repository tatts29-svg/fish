#!/usr/bin/env python3
"""Author: Andrew Fisher. Whole-lap photo refinement and bounded rendering work."""
from pathlib import Path
import importlib.util
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep


def load(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def apply(t, p):
    if 'G.photoRefinement792=' in t:
        raise SystemExit('v7.92 already applied')
    if '/* v7.89 - compact header (one row, three equal pods' not in t:
        raise SystemExit('v7.92 requires the v7.89-or-later live page')
    prior = HERE.parent / 'v7.88_full_lap_detail_DRAFT'
    if 'G.fullLap788=' not in t:
        t = load(prior / 'patch_v788.py', 'whole_lap_base788').apply(t, p)
    def r(a, b, label):
        nonlocal t
        t = rep(t, a, b, label, p)
    for stem in ['vegetation', 'track_detail', 'architecture', 'sky', 'full_lap']:
        r((prior / (stem + '788_src.js')).read_text(),
          (HERE / (stem + '792_src.js')).read_text(), 'Photo refinement: ' + stem)
    # Helper definitions are available before the first scene is opened. They
    # construct static additions only; the original simulation and car remain.
    helpers = '\n'.join((HERE / name).read_text() for name in [
        'photo_structures792_src.js', 'signage792_src.js', 'smoothness792_src.js'])
    end = t.index('</script>', t.index('G.fullLap788='))
    t = t[:end] + helpers + '\n' + t[end:]
    t = load(HERE / 'patch_signage792.py', 'signage792').apply(t, p)
    r('G.detail781Sun=G.V.norm([-.55,.45,.70]);',
      'G.detail781Sun=G.V.norm([-.35,.78,.52]);', 'Clear coastal daytime sunlight')
    sunlight_lines = [line for line in t.splitlines() if 'vec3(-.55,.45,.70),uDetail781)' in line]
    if len(sunlight_lines) != 3 or len(set(sunlight_lines)) != 3:
        raise SystemExit('Expected the three known surface/composite sunlight lines')
    for line in sunlight_lines:
        r(line, line.replace('vec3(-.55,.45,.70),uDetail781)', 'vec3(-.35,.78,.52),uDetail781)'),
          'Surface/composite sunlight matches the detail sky')
    r('if(S.standDecor&&S.standDecor.ni){flat(0,L.mat.kerb);S.standDecor.draw();}',
      'if(S.standDecor&&S.standDecor.ni){flat(0,L.mat.kerb);const lettering792=S.detail781Enabled&&S.trackDetail781&&S.trackDetail781.signDecor;(lettering792||S.standDecor).draw();}',
      'Keep sign panels with typeset lettering in the detailed scene')
    r('const max=gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);',
      'const max=G.renderLimit792(gl,gl.MAX_RENDERBUFFER_SIZE);', 'Cache the context render limit')
    r('const size=Math.min(Q.shadow,gl.getParameter(gl.MAX_TEXTURE_SIZE));',
      'const size=Math.min(Q.shadow,G.renderLimit792(gl,gl.MAX_TEXTURE_SIZE));', 'Cache the context shadow limit')
    r('if(S.fps<26&&!G.noGuard){slow++;',
      'if(G.shouldReduceQuality792(S)&&!G.noGuard){slow++;', 'Reduce pixel work before visible stutter persists')
    r('if(S.gl&&G.freeTarget)[S.rt,S.b1,S.b2,S.c1,S.c2].forEach(t=>G.freeTarget(S.gl,t));',
      'if(S.gl&&!S.lost&&G.freeTarget)[S.rt,S.b1,S.b2,S.c1,S.c2].forEach(t=>G.freeTarget(S.gl,t));S.rt=S.b1=S.b2=S.c1=S.c2=null;',
      'Context loss already released the old render targets')
    r("S.cv.addEventListener('webglcontextlost',e=>{e.preventDefault();S.lost=true;});",
      "S.cv.addEventListener('webglcontextlost',e=>{e.preventDefault();S.contextState792=G.captureContextState792(S);S.lost=true;S.last=null;});",
      'Remember the active lap and camera before graphics recovery')
    r("S.cv.addEventListener('webglcontextrestored',()=>{if(G.S===S)G.mount(pack,look);});",
      "S.cv.addEventListener('webglcontextrestored',()=>{if(G.S===S){const back=S.contextState792;G.mount(pack,back&&back.look||look);G.restoreContextState792(G.S,back);}});",
      'Restore the active lap and camera after graphics recovery')
    r("G.fullLap788={version:'v7.92'", "G.photoRefinement792={version:'v7.92',references:39};\nG.fullLap788={version:'v7.92'", 'Photo refinement release marker')
    return t


if __name__ == '__main__':
    path = Path(sys.argv[1])
    path.write_text(apply(path.read_text(), str(path)))
    print('v7.92 Showcase photo refinement applied')
