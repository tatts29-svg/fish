#!/usr/bin/env python3
"""Build a local-only machine preview from an exact public module. Author: Andrew Fisher."""
import hashlib, pathlib, shutil, sys

ROOT=pathlib.Path(__file__).resolve().parent
BASE='d2964c3138eb1b2429a542cfb598adb507ae345b6b92858c78231fdbe49ff3c8'
def prepare(source, target):
    target.mkdir(parents=True,exist_ok=True)
    raw=(source/'car-app.js').read_bytes()
    assert hashlib.sha256(raw).hexdigest()==BASE, 'Current machine module differs: inspect and rebase first'
    s=raw.decode()
    def rep(old,new):
        nonlocal s
        assert s.count(old)==1,(old,s.count(old))
        s=s.replace(old,new)
    rep("import {ENGINE_LAYOUT", "import {mountWorkshop} from './workshop-ui.js';\nlet workshop=null;\nimport {ENGINE_LAYOUT")
    rep("ready=true;failed=false;drive.speed=", "ready=true;failed=false;workshop=mountWorkshop({T,scene,engine,body,studioRoot,drive,camera,controls,prepare(){reset();camTween=null;followPart=false;drive.stop();audio.quiet();occl?.restore();},restore(){updateTransforms();updateVisibility();setView('car');renderer.shadowMap.needsUpdate=true;}});window.__workshop=workshop;drive.speed=")
    rep("if(occl)occl.update(dt);detailStep();shadowStep(now);", "if(occl&&!workshop?.active)occl.update(dt);detailStep();shadowStep(now);if(workshop?.active){const was=workshop.lift.progress;workshop.update(dt);if(was!==workshop.lift.progress||workshop.shadowDirty){renderer.shadowMap.needsUpdate=true;workshop.shadowDirty=false;}}")
    rep("canvas.addEventListener('pointerdown',e=>{pointers.add", "canvas.addEventListener('pointerdown',e=>{if(workshop?.active)return;pointers.add")
    rep("const release=e=>{pointers.delete", "const release=e=>{if(workshop?.active){start=null;grab=null;look=null;return;}pointers.delete")
    rep("canvas.addEventListener('keydown',e=>{if(![", "canvas.addEventListener('keydown',e=>{if(workshop?.active){if(e.key==='+'||e.key==='-'){e.preventDefault();zoom(e.key==='+'?.8:1.2);}return;}if(![")
    rep("if(!drag)fit(followPart?'part':view);", "if(!drag&&!workshop?.active)fit(followPart?'part':view);")
    (target/'car-app.js').write_text(s)
    for name in ['index.html','car.css']:
        shutil.copyfile(source/name,target/name)
    for name in ['workshop-ui.js','engine-lift-preview.js']:
        shutil.copyfile(ROOT/name,target/name)
    print('Prepared local-only review; no publication manifest generated')
if __name__=='__main__':prepare(pathlib.Path(sys.argv[1]),pathlib.Path(sys.argv[2]))
