#!/usr/bin/env python3
"""Author: Andrew Fisher. Vehicle-only finish, draw ordering and livery filtering."""
from pathlib import Path
import hashlib
import sys

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

OLD_FS_SHA = '254c5cf229890452d5f98c4d245088a189a06cd7dbc53dbd796858d3dc83a160'

def apply(text, path='Showcase HTML'):
    if 'uSurface800' in text:
        raise SystemExit('v8.00 vehicle materials already applied')
    marker = '/* Original surfaced race car.'
    if text.count(marker) != 1:
        raise SystemExit('v8.00 vehicle materials require the surfaced vehicle renderer')
    start = text.index('const FS=`', text.index(marker)) + len('const FS=`')
    end = text.index('`;\nfunction program', start)
    old = text[start:end]
    if hashlib.sha256(old.encode()).hexdigest() != OLD_FS_SHA:
        raise SystemExit('v8.00 vehicle material baseline has changed')
    shader = (HERE / 'material800_src.glsl').read_text().rstrip('\n')
    text = text[:start] + shader + text[end:]
    pairs = [
        ("'uAtlas','uDetail781',", "'uAtlas','uDetail781','uSurface800',"),
        ('const materials={paint:',
         "/* Author: Andrew Fisher. Existing named materials keep their mesh contract. */\n"
         "const vehicleSurfaces800={paint:1,plant:2,plantBlack:2,plantWhite:2,rubber:3,alloy:4,steel:4,carbon:5,grille:5,glass:6};\n"
         "const vehicleLayer800=p=>p.material==='decal'||p.material==='ledAmber'?2:p.material==='glass'||p.name.includes('spokes')?1:0;\n"
         "G.vehicleMaterial800={version:'8.00',newTextures:0,newDrawCalls:0,reflectionLookups:1,liveryMipBytes:174763,opaqueBeforeGlass:true};\n"
         'const materials={paint:'),
        ('gl.uniform1f(u.uPanel,part.name===',
         'gl.uniform1f(u.uSurface800,vehicleSurfaces800[part.material]||0);gl.uniform1f(u.uPanel,part.name==='),
        (' for(const part of S.raceCarParts)drawPart(part,M,carAngle,wheelTransforms);',
         " // Opaque cabin and wheels precede glass; authored labels remain on top.\n"
         " const drawOrdered800=(parts,model,angle,transforms)=>{for(let layer=0;layer<3;layer++)for(const part of parts)if(vehicleLayer800(part)===layer)drawPart(part,model,angle,transforms);};\n"
         ' drawOrdered800(S.raceCarParts,M,carAngle,wheelTransforms);'),
        (' for(const part of S.trailerParts)drawPart(part,TM,w=>-T.spin*(.19/(w.r||.19)),tw);',
         ' drawOrdered800(S.trailerParts,TM,w=>-T.spin*(.19/(w.r||.19)),tw);'),
        (' gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,W,H,0,gl.RED,gl.UNSIGNED_BYTE,unpack());\n gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);',
         ' gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,W,H,0,gl.RED,gl.UNSIGNED_BYTE,unpack());\n'
         ' gl.generateMipmap(gl.TEXTURE_2D); /* immutable 1024 x 512 R8 livery: +174763 bytes */\n'
         ' gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);'),
    ]
    for i, (old, new) in enumerate(pairs):
        text = rep(text, old, new, 'Vehicle material hook ' + str(i + 1), path)
    return text

if __name__ == '__main__':
    p = Path(sys.argv[1])
    p.write_text(apply(p.read_text(), str(p)))
