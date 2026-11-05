#!/usr/bin/env python3
"""Build the guarded machine workshop candidate from an exact public module. Author: Andrew Fisher."""
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
    rep("import {ENGINE_LAYOUT", "import {mountWorkshop} from './workshop-ui.js';\nimport {installWorkshopFinish} from './workshop-finish.js';\nimport {mountCrewPolish} from './crew-polish.js';\nlet workshop=null,finish=null,crewPolish=null,workshopShadowAt=-1e9;\nimport {ENGINE_LAYOUT")
    rep("FXQ.setQuality(quality,{renderer,scene});   /* v8.09: mipmaps", "finish=installWorkshopFinish({T,engine,studioRoot,renderer,camera,quality});crewPolish=mountCrewPolish({T,crew,driver:DX.man});window.__workshopFinish=finish;window.__crewPolish=crewPolish;FXQ.setQuality(quality,{renderer,scene});   /* v8.09: mipmaps")
    rep("ready=true;failed=false;drive.speed=", "ready=true;failed=false;workshop=mountWorkshop({T,scene,engine,body,studioRoot,drive,camera,controls,prepare(){reset();camTween=null;followPart=false;drive.stop();audio.quiet();occl?.restore();if(DX.man){DX.state='workshop';DX.phase=null;DX.man.place(DX_SAFE[0],DX_SAFE[1],0);DX.man.update(0);driverShow(true);}crewPolish?.setWorkshopMode(true);Object.assign(keyLight.shadow.camera,{left:-5,right:5,top:4,bottom:-4,far:18});keyLight.shadow.camera.updateProjectionMatrix();},restore(){driverHome();crewPolish?.setWorkshopMode(false);Object.assign(keyLight.shadow.camera,{left:-3.2,right:3.2,top:2.2,bottom:-1.4,far:13});keyLight.shadow.camera.updateProjectionMatrix();updateTransforms();updateVisibility();setView('car');renderer.shadowMap.needsUpdate=true;}});window.__workshop=workshop;drive.speed=")
    rep("if(occl)occl.update(dt);detailStep();shadowStep(now);", "if(occl&&!workshop?.active)occl.update(dt);detailStep();finish?.update({camera,quality});shadowStep(now);if(workshop?.active){const was=workshop.lift.progress;workshop.update(dt);if(workshop.shadowDirty||(was!==workshop.lift.progress&&now-workshopShadowAt>=66)){renderer.shadowMap.needsUpdate=true;workshop.shadowDirty=false;workshopShadowAt=now;}}")
    rep("canvas.addEventListener('pointerdown',e=>{pointers.add", "canvas.addEventListener('pointerdown',e=>{if(workshop?.active)return;pointers.add")
    rep("const release=e=>{pointers.delete", "const release=e=>{if(workshop?.active){start=null;grab=null;look=null;return;}pointers.delete")
    rep("canvas.addEventListener('keydown',e=>{if(![", "canvas.addEventListener('keydown',e=>{if(workshop?.active){if(e.key==='+'||e.key==='-'){e.preventDefault();zoom(e.key==='+'?.8:1.2);}return;}if(![")
    rep("if(!drag)fit(followPart?'part':view);", "if(!drag&&!workshop?.active)fit(followPart?'part':view);")
    rep("if(crew)crew.update(dt*(slow?.15:1),crewState());driverStep(dt*(slow?.15:1));", "if(crew&&!workshop?.active)crew.update(dt*(slow?.15:1),crewState());if(!workshop?.active)driverStep(dt*(slow?.15:1));crewPolish?.update(dt);")
    rep("if(studioRoot&&studioRoot.userData.tick)studioRoot.userData.tick(dt,", "if(studioRoot&&studioRoot.userData.tick&&!workshop?.active)studioRoot.userData.tick(dt,")
    rep("const rim=new T.DirectionalLight(0xffa36e,LOOK.rim)", "const rim=new T.DirectionalLight(0xdce8ff,LOOK.rim)")
    rep("key: 5.2, fill: 1.05, rim: 3.6", "key: 5.2, fill: 1.15, rim: 3.8")
    rep("garageEnv: 1, envGarage: 1.25", "garageEnv: 1, envGarage: 1.10")
    (target/'car-app.js').write_text(s)
    for name in ['index.html','car.css']:
        shutil.copyfile(source/name,target/name)
    for name in ['workshop-ui.js','engine-lift-preview.js','workshop-finish.js','crew-polish.js','workshop-learning.js']:
        shutil.copyfile(ROOT/name,target/name)
    index=(target/'index.html').read_text()
    assert index.count('src=\"./car-app.js\"')==1
    index=index.replace('src=\"./car-app.js\"','src=\"./car-app.js?v=13.02\"').replace('V8 · 326 PARTS','V8 · 326 PARTS')
    index=index.replace('<footer><span>', '<footer><span><small id=\"machine-release\">Workshop v13.02</small> · ',1)
    (target/'index.html').write_text(index)
    print('Prepared machine workshop candidate; publication requires separate guarded manifest checks')
if __name__=='__main__':prepare(pathlib.Path(sys.argv[1]),pathlib.Path(sys.argv[2]))
