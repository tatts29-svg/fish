"""Author: Andrew Fisher. Isolated proposals; never edits the reviewed source."""
from pathlib import Path
import shutil
import hashlib
import json
import argparse

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', required=True, type=Path, help='Frozen work directory')
parser.add_argument('--output', required=True, type=Path, help='Separate proposal directory')
args = parser.parse_args()
SOURCE, OUT = args.source.resolve(), args.output.resolve()
if SOURCE == OUT or SOURCE in OUT.parents or OUT in SOURCE.parents:
    raise SystemExit('Output must be separate from the reviewed source')
EXPECTED = {
    'car-app.js': '718b2cfa403ae8fb0d6bc7b3bde6578719e62802b2eb23c38513e4d0700f1707',
    'vendor/addons/postprocessing/GTAOPass.js': '980b036767c439cf2aadd0e869b2e51b2ec00736a75a5ad1bb69dddb03254fe8',
}
for name, expected in EXPECTED.items():
    actual = hashlib.sha256((SOURCE/name).read_bytes()).hexdigest()
    if actual != expected:
        raise SystemExit('Source hash does not match frozen ba9fff7e: ' + name)
OUT.mkdir(exist_ok=True)
shutil.copytree(SOURCE / 'vendor', OUT / 'vendor', dirs_exist_ok=True)

def replace(text, old, new):
    assert text.count(old) == 1, ('Expected exactly one source match', old[:100], text.count(old))
    return text.replace(old, new)

app = (SOURCE / 'car-app.js').read_text()
app = replace(app,
    "}catch(e){composer=null;gtao=null;console.warn('Post stack unavailable, rendering straight:',e.message);}}",
    "}catch(e){dropComposer();console.warn('Post stack unavailable, rendering straight:',e.message);}}")
app = replace(app,
    "function dropComposer(){if(!composer)return;try{composer.dispose?.();}catch(e){}composer=null;gtao=null;}",
    "function dropComposer(){const old=composer,ao=gtao;composer=null;gtao=null;/* Passes own their targets and materials; EffectComposer only owns its two buffers. */for(const pass of new Set([...(old?.passes||[]),ao])){try{pass?.dispose?.();}catch(e){}}try{old?.dispose?.();}catch(e){}}")
app = replace(app,
    "document.addEventListener('visibilitychange',()=>{lastFrame=performance.now();drive.accumulator=0;audio.quiet();});",
    "document.addEventListener('visibilitychange',()=>{resetFrameTiming();audio.quiet();});")
app = replace(app,
    "if(e.persisted&&ready){lastFrame=lastRender=performance.now();drive.accumulator=0;renderer.setAnimationLoop(frame);}",
    "if(e.persisted&&ready){resetFrameTiming();renderer.setAnimationLoop(frame);}")
app = replace(app, 'function frame(now){',
    "/* Hidden time is not evidence of slow rendering. Start fresh sampling windows on resume. */\nfunction resetFrameTiming(){const now=performance.now();lastFrame=lastRender=fpsTime=now;lastFrameStart=frameCount=fps=frameEma=slowSince=0;adaptAt=lastUp=now;drive.accumulator=0;}\nfunction frame(now){")
(OUT / 'car-app.js').write_text(app)
gtao = (SOURCE / 'vendor/addons/postprocessing/GTAOPass.js').read_text()
gtao = replace(gtao, '\t\tthis.normalMaterial.dispose();', '\t\tthis.gtaoMaterial.dispose();\n\t\tthis.blendMaterial.dispose();\n\t\tthis.normalMaterial.dispose();')
(OUT / 'vendor/addons/postprocessing/GTAOPass.js').write_text(gtao)
binding = {'author': 'Andrew Fisher', 'source_commit': 'ba9fff7ec48d3d49d037f461c145b1abd6f2c957', 'files': {}}
for name in ['car-app.js', 'vendor/addons/postprocessing/GTAOPass.js']:
    binding['files'][name] = {'source_sha256': hashlib.sha256((SOURCE/name).read_bytes()).hexdigest(), 'proposal_sha256': hashlib.sha256((OUT/name).read_bytes()).hexdigest()}
(OUT / 'binding.json').write_text(json.dumps(binding, indent=2)+'\n')
print(json.dumps(binding, indent=2))
