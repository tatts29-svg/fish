"""v8.08 crystal clear: the edits car-app.js needs to wire fx-quality.js in. Author: Andrew Fisher.

car-app.js is not in the image-quality scope, so this is the exact change for whoever owns it to apply (or review and paste by
hand; each edit is listed in CHANGES_fx.md). Every replacement must match exactly once (toolchain/rep.py) and the patch refuses to
run twice. It writes the file it is given and nothing else.

    python3 fx_car_app_patch.py <path to car-app.js>

What it does:
  E1  imports fx-quality.js
  E2  adds the Ultra rung to the pixel-ratio ladder (still cap 4, moving 1.5)
  E3  Ultra's still ratio supersamples to 3840 x 2160 worth of pixels whatever the screen (FXQ.ratioFor)
  E4  the Quality button cycles Laptop, Balanced, High, Ultra
  E5  every rung change tells fx-quality (prints redrawn at the rung's scale, textures' anisotropy)
  E6  textures upgraded (mipmaps, anisotropy) once, before the garage capture uploads them: no texture is uploaded twice at load
  E7  the garage environment captured at the rung's size (512 on Balanced and up; 256 on Laptop, as now)
  E8  the 4K capture: a true 3840 x 2160 frame through the post stack, prints at full scale, shadow map redrawn
"""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'toolchain'))
from rep import rep

path = sys.argv[1]
t = open(path, encoding='utf-8').read()
if "from './fx-quality.js'" in t:
    sys.exit('car-app.js already carries the fx-quality wiring')

# E1
t = rep(t, "import {PARTS,COG_REFERENCES} from './parts.js';",
        "import {PARTS,COG_REFERENCES} from './parts.js';\nimport * as FXQ from './fx-quality.js';   /* v8.08: the rungs, the prints, the 4K still */",
        'E1 import', path)
# E2
t = rep(t, "const RATIO={still:{laptop:3,balanced:3,high:3},move:{laptop:1,balanced:1.25,high:1.5}}",
        "const RATIO={still:{laptop:3,balanced:3,high:3,ultra:4},move:{laptop:1,balanced:1.25,high:1.5,ultra:1.5}}",
        'E2 ratio ladder', path)
# E3
t = rep(t, "if(LOOK.stillDpr>0)cap=Math.min(cap,LOOK.stillDpr);return Math.max(Math.min(dev,.75),Math.min(dev,cap)*dprScales.still);}",
        "if(LOOK.stillDpr>0)cap=Math.min(cap,LOOK.stillDpr);/* v8.08: Ultra draws 3840 x 2160 worth of pixels on any screen (supersampled on a small one) */let want=dev;if(quality==='ultra'){const v=$('viewport').getBoundingClientRect();want=FXQ.ratioFor('ultra',{dev,cssW:v.width,cssH:v.height});}return Math.max(Math.min(dev,.75),Math.min(want,cap)*dprScales.still);}",
        'E3 ultra ratio', path)
# E4
t = rep(t, "const modes=['laptop','balanced','high'];quality=modes[(modes.indexOf(quality)+1)%3];",
        "const modes=FXQ.QUALITY_ORDER;quality=modes[(modes.indexOf(quality)+1)%modes.length];",
        'E4 quality button', path)
# E5
t = rep(t, "function applyQuality(){if(!renderer)return;",
        "function applyQuality(){if(!renderer)return;FXQ.setQuality(quality,{renderer,scene});",
        'E5 rung to fx-quality', path)
# E6
t = rep(t, "if(LOOK.garageEnv)await garageEnvironment(studio,[body.root,engine.root,cog.root]);",
        "FXQ.setQuality(quality,{renderer,scene});   /* v8.08: mipmaps and anisotropy on every texture before anything is uploaded */\nif(LOOK.garageEnv)await garageEnvironment(studio,[body.root,engine.root,cog.root]);",
        'E6 textures before upload', path)
# E7
t = rep(t, "new T.WebGLCubeRenderTarget(256,", "new T.WebGLCubeRenderTarget(FXQ.envSize(quality),", 'E7 env size', path)
# E8
old_capture = ("$('capture').onclick=()=>{if(!ready)return;const oldSize=renderer.getSize(new T.Vector2()),ratio=renderer.getPixelRatio(),aspect=camera.aspect;"
               "try{renderer.setPixelRatio(1);renderer.setSize(3840,2160,false);camera.aspect=3840/2160;camera.updateProjectionMatrix();renderer.render(scene,camera);"
               "renderer.domElement.toBlob(blob=>{if(blob){download(blob,'Coates_V8_Connected_4K.png');toast('4K image saved.');}else toast('The image could not be saved.');},'image/png');}"
               "catch{toast('This device could not create the 4K image.');}finally{renderer.setPixelRatio(ratio);renderer.setSize(oldSize.x,oldSize.y,false);camera.aspect=aspect;camera.updateProjectionMatrix();}};")
new_capture = ("/* v8.08 — THE 4K STILL (fx-quality.js capture4K): 3840 x 2160 through the same post stack as the screen, every print at its sharpest,"
               " the shadow map redrawn; the screen's own size goes back before the browser paints */"
               "$('capture').onclick=async()=>{if(!ready)return;try{const shot=await FXQ.capture4K({renderer,camera,composer,render:()=>{if(composer)composer.render();else renderer.render(scene,camera);}});"
               "download(shot.blob,'Coates_V8_Connected_4K.png');toast(`4K image saved: ${shot.width} × ${shot.height}.`);}catch(e){toast('This device could not create the 4K image.');}};")
t = rep(t, old_capture, new_capture, 'E8 capture', path)

open(path, 'w', encoding='utf-8').write(t)
print('car-app.js wired to fx-quality.js:', path)
