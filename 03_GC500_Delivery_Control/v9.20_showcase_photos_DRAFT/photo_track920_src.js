 /* Author: Andrew Fisher. The repeated dark lifting recesses visible in the
    supplied concrete barriers are static shallow face marks. The source face,
    cap and course remain fixed; this is construction character, not a survey.
    Keep each pair inside its own module, at its original track-facing face. */
 if(section*M>.75){
  const socketWidth=Math.min(.22/M,section*.14),socketY=H+.075/M,
   socketHeight=.070/M;
  for(const fraction of [.20,.80]){
   const c=add(front,tangent,section*fraction),l=add(c,tangent,-socketWidth/2),
    r=add(c,tangent,socketWidth/2);
   face(scuffs,[[l[0],socketY,l[2]],[r[0],socketY,r[2]],
    [r[0],socketY+socketHeight,r[2]],[l[0],socketY+socketHeight,l[2]]],[.025,.026,.025,.8]);
   stats.photoTrack920.liftingRecesses++;
  }
 }
