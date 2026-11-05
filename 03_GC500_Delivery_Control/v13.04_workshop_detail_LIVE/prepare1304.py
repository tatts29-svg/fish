#!/usr/bin/env python3
"""Author: Andrew Fisher. Detail pass on the exact published v13.03 machine."""
from pathlib import Path
import hashlib, json, shutil, sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep

BASE_APP = '585deb2b5eea6ccc2d9464cbb60cdc7a29afdd1e9c02cd0ad62bd26a2930c3f2'
BASE_INDEX = '83bc23b84c2cb2c215f464502093af4267a39d99e8c988af2905395048225c09'
MODULES = ['workshop-finish.js', 'workshop-mechanic.js', 'workshop-service.js',
           'workshop-showcase.js', 'workshop-ui.js', 'workshop-render.js', 'workshop-lessons.js']

def prepare(source, target):
    raw = (source / 'car-app.js').read_bytes()
    assert hashlib.sha256(raw).hexdigest() == BASE_APP, 'Live application changed: reconcile first'
    index_raw = (source / 'index.html').read_bytes()
    assert hashlib.sha256(index_raw).hexdigest() == BASE_INDEX, 'Live entry changed: reconcile first'
    scope = json.loads((ROOT / 'release/scope1304.json').read_text())
    assert scope['confirmed'] and set(scope['replacements'] + scope['additions']) == set(MODULES + ['car-app.js', 'index.html'])
    target.mkdir(parents=True, exist_ok=False)
    s = raw.decode()
    def replace(old, new, label):
        nonlocal s
        s = rep(s, old, new, label, str(source / 'car-app.js'))
    replace("from './workshop-ui.js?v=13.03'", "from './workshop-ui.js?v=13.04'", 'version workshop controls')
    replace("from './workshop-finish.js'", "from './workshop-finish.js?v=13.04'", 'version surface detail')
    replace('let workshop=null,finish=null,crewPolish=null,workshopShadowAt=-1e9;',
            "import {createWorkshopRenderControl} from './workshop-render.js';\nconst workshopRender=createWorkshopRenderControl();\nwindow.__workshopRender=workshopRender;\nlet workshop=null,finish=null,crewPolish=null;", 'one workshop draw and shadow coordinator')
    replace("function onResize(){if(!renderer||!camera)return;", "function onResize(){if(!renderer||!camera)return;workshopRender.invalidate('resize');", 'invalidate cleared drawing buffer')
    replace('adapt(now,now-lastRender);lastFrame=lastRender=now;',
            'if(!workshop?.active||!workshopRender.idle)adapt(now,now-lastRender);lastFrame=lastRender=now;', 'exclude deliberate still reuse from adaptive samples')
    replace('function frame(now){const t0=performance.now();frameBody(now);const c=performance.now()-t0;',
            'function frame(now){const t0=performance.now(),beforeDraw=workshopRender.drawCount;frameBody(now);if(workshop?.active&&(workshopRender.idle||workshopRender.drawCount===beforeDraw))return;const c=performance.now()-t0;', 'sample only actual active drawing work')
    start = s.index('frameCount++;if(now-fpsTime>1000)')
    end = s.index('updateCallout();updateServiceCallouts();', start)
    fps_block = s[start:end]
    replace(fps_block, '', 'move frame statistics to actual drawing')
    old = 'motionStep(now);if(occl&&!workshop?.active)occl.update(dt);detailStep();finish?.update({camera,quality});shadowStep(now);if(workshop?.active){const was=workshop.motionKey;workshop.update(dt);if(workshop.shadowDirty||(was!==workshop.motionKey&&now-workshopShadowAt>=66)){renderer.shadowMap.needsUpdate=true;workshop.shadowDirty=false;workshopShadowAt=now;}}(composer?composer.render():renderer.render(scene,camera));'
    new = '''if(workshop?.active)workshop.update(dt);
motionStep(now);if(occl&&!workshop?.active)occl.update(dt);detailStep();finish?.update({camera,quality});shadowStep(now);
const externalMotion=!!(drive.running||!drive.stationary||dynoSpin>0||service.moving||Math.abs(drive.spread-drive.spreadTarget)>1e-4||drive.pulls.some((value,index)=>Math.abs(value-drive.pullTargets[index])>1e-4)||cabin.fan||cabin.fanAuto||cabin.ign||shiftHand>0||cockpit?.selfTesting||cockpit?.joints?.some(joint=>Math.abs(joint.to-joint.at)>1e-4||Math.abs(joint.v)>1e-3));
const decision=workshopRender.plan({now,workshop,camera,renderer,quality,externalMotion,detailKey:detailHidden+'|'+(finish?.diagnostics?.detailVisible||0),shadowDirty:renderer.shadowMap.needsUpdate});
if(decision.resetTiming){fpsTime=now;frameCount=fps=frameEma=slowSince=0;adaptAt=now;}
if(decision.shadow)renderer.shadowMap.needsUpdate=true;
if(decision.draw){if(!decision.idle){''' + fps_block + '''}
(composer?composer.render():renderer.render(scene,camera));workshopRender.commit(decision);if(workshop?.active&&decision.shadow)workshop.shadowDirty=false;}'''
    replace(old, new, 'draw final workshop pose with pending final shadow and bounded still reuse')
    replace("if(fps)setT('render-stats',`${fps} fps · ${renderer.domElement.width} × ${renderer.domElement.height}`);",
            "if(fps||workshopRender.idle)setT('render-stats',`${workshopRender.idle?'Still view':fps+' fps'} · ${renderer.domElement.width} × ${renderer.domElement.height}`);", 'truthful still-view display')
    replace("window.addEventListener('pagehide',()=>{audio.quiet();renderer?.setAnimationLoop(null);});",
            "window.addEventListener('pagehide',e=>{audio.quiet();renderer?.setAnimationLoop(null);if(e.persisted)workshopRender.reset();else workshopRender.dispose();});", 'dispose render input listeners on real page departure')
    replace("if(e.persisted&&ready){resetFrameTiming();renderer.setAnimationLoop(frame);}",
            "if(e.persisted&&ready){workshopRender.reset();resetFrameTiming();renderer.setAnimationLoop(frame);}", 'resume cached-page render state')
    (target / 'car-app.js').write_text(s)
    index = index_raw.decode()
    index = rep(index, './car-app.js?v=13.03', './car-app.js?v=13.04', 'version machine app', str(source / 'index.html'))
    index = rep(index, 'Workshop v13.03', 'Workshop v13.04', 'machine release label', str(source / 'index.html'))
    (target / 'index.html').write_text(index)
    for name in MODULES:
        shutil.copyfile(ROOT / name, target / name)
    print('Prepared guarded v13.04 modules; candidate assembly and acceptance remain required')

if __name__ == '__main__':
    prepare(Path(sys.argv[1]), Path(sys.argv[2]))
