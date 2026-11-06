#!/usr/bin/env python3
"""Author: Andrew Fisher. Extend the exact published v13.02 machine."""
from pathlib import Path
import hashlib,shutil,sys
ROOT=Path(__file__).resolve().parent
sys.path.insert(0,str(ROOT.parent/'toolchain'))
from rep import rep
BASE='4284541268e9f01d443f2f3b4793f1713d1c1977ba882f0b1f7fd0aeb33d0625'
MODULES=['engine-lift-preview.js','workshop-ui.js','workshop-service.js','workshop-mechanic.js','workshop-lessons.js','workshop-showcase.js']
def prepare(source,target):
 target.mkdir(parents=True,exist_ok=False)
 raw=(source/'car-app.js').read_bytes();assert hashlib.sha256(raw).hexdigest()==BASE,'Live machine app changed: inspect and rebase'
 s=raw.decode()
 def replace(old,new,label):
  nonlocal s
  s=rep(s,old,new,label,str(source/'car-app.js'))
 replace("from './workshop-ui.js'","from './workshop-ui.js?v=13.03'",'version workshop controls')
 replace('workshop=mountWorkshop({T,scene,engine,body,studioRoot,drive,camera,controls,prepare()', 'workshop=mountWorkshop({T,scene,engine,body,studioRoot,drive,camera,controls,crew,crewPolish,prepare()','share existing crew')
 replace('const was=workshop.lift.progress;workshop.update(dt);if(workshop.shadowDirty||(was!==workshop.lift.progress&&now-workshopShadowAt>=66))', 'const was=workshop.motionKey;workshop.update(dt);if(workshop.shadowDirty||(was!==workshop.motionKey&&now-workshopShadowAt>=66))','track complete workshop movement')
 (target/'car-app.js').write_text(s)
 index=(source/'index.html').read_text()
 index=rep(index,'./car-app.js?v=13.02','./car-app.js?v=13.03','version machine app',str(source/'index.html'))
 index=rep(index,'Workshop v13.02','Workshop v13.03','machine release label',str(source/'index.html'))
 (target/'index.html').write_text(index)
 for name in MODULES:shutil.copyfile(ROOT/name,target/name)
 print('Prepared guarded v13.03 machine modules; release manifest and acceptance required separately')
if __name__=='__main__':prepare(Path(sys.argv[1]),Path(sys.argv[2]))
