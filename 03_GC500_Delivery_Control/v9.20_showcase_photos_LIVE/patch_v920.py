# Author: Andrew Fisher.
import os,sys
from pathlib import Path
sys.path.insert(0,os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','toolchain'))
from rep import rep as shared_rep
def rep(s,a,b): return shared_rep(s,a,b,"Photo track detail",sys.argv[1])
p=Path(sys.argv[1]);s=p.read_text()
if 'photoTrack920' in s: raise SystemExit('Photo track detail already installed')
if 'showStability918' not in s: raise SystemExit('Requires Showcase stability v9.18 or later')
s=rep(s,"const paint=orange?[.86,.125,.016,1]:[.66,.665,.635,1];","const paint=[.66,.665,.635,1]; /* v9.20: pale concrete seen across the supplied photos; signage stays separate. */")
s=rep(s,"const metal=[.29,.34,.365,1],darkMetal=[.12,.15,.165,1],wireCol=[.19,.23,.25,.92];","const metal=[.48,.50,.505,1],darkMetal=[.28,.295,.30,1],wireCol=[.31,.325,.33,.92]; /* v9.20 galvanised framed mesh, photo construction character. */")
s=rep(s,"stats.barrierModules++;\n /* The wire mesh sits",Path(__file__).with_name('photo_track920_src.js').read_text()+"\n stats.barrierModules++;\n /* The wire mesh sits")
s=rep(s,"stats.fencePanels+=2;distance+=section;moduleIndex++;","""/* Flat joining plates share the original posts batch and frame plane. Sparse,
    not new posts, wire strands, supports or corridor geometry. */
 if(moduleIndex%4===0){
  const half=.065/M,lo=base+vertical-.075/M,hi=base+vertical+.075/M;
  const q0=add(ma,tangent,-half),q1=add(ma,tangent,half),depth=-.002/M;
  face(posts,[[q0[0]+na0[0]*depth,lo,q0[2]+na0[2]*depth],
   [q1[0]+na0[0]*depth,lo,q1[2]+na0[2]*depth],
   [q1[0]+na0[0]*depth,hi,q1[2]+na0[2]*depth],
   [q0[0]+na0[0]*depth,hi,q0[2]+na0[2]*depth]],darkMetal);
  stats.photoTrack920.framePlates++;
 }
 stats.fencePanels+=2;distance+=section;moduleIndex++;""")
s=rep(s,"surveyedEventEquipment:false};\n const vertex=", """surveyedEventEquipment:false};
 stats.photoTrack920={author:'Andrew Fisher',source:'Andrew’s circuit photos 21016–21162, visual construction character',
  referenceExamples:['21016.jpg','21044.jpg','21080.jpg','21154.jpg','21157.jpg'],
  paleConcrete:true,galvanisedFrames:true,liftingRecesses:0,framePlates:0,
  sourceBoundariesUnchanged:true,roadWidthUnchanged:true,signageUnchanged:true,
  newLandmarkPlacements:0,newGPUResources:0,newDrawCalls:0,perFrameWork:0,
  surveyedReconstruction:false};
 const vertex=""")
s=rep(s,' · v9.18',' · v9.20')
p.write_text(s)
