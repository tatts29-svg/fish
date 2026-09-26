/* v6.72 - THE SPECIAL EDITIONS, FINISHED (Andrew, 26 Sep 2026: "details of the new vehicles need improving"). What each
   one lacked next to the real machine, added in the same parametric kit and the same materials (the car's lampWhite and
   lampRed light up like its own lamps):
   forklift - head and tail lamps, a rear bumper, mirrors, a seat, a grab handle, the tilt and lift hoses up the mast;
   boom lift - the basket's rotator bracket, which the basket was hanging off in mid-air without, hoses along the boom,
     lamps, hazard stripes on the chassis ends, the fuel tank;
   scissor lift - the access ladder at the back, the pothole guards, the lift cylinder inside the scissor pack, lamps, the
     control cable;
   tractor - front weights, head, roof and tail lamps, mirrors, the three-point linkage, the exhaust cap, the cab step;
   both trailers - safety chains, a number plate and amber side markers.
   Nothing here moves or changes a figure; it is decoration on decoration. */
G.plantDetail=function(kind,K){
  const {group,box,rbox,tube,bar,stripes}=K,BK='plantBlack',OR='plant';
  const lw=group('head lamps','lampWhite'),lr=group('tail lamps','lampRed'),blk=group('detail black',BK),st=group('detail steel','steel'),hose=group('hoses',BK);
  const lamp=(g,x,y,z,a,b,c)=>rbox(g,x,y,z,a,b,c,.5,10,6);
  if(kind==='forklift'){
    for(const z of [-.30,.30]){lamp(lw,.31,.97,z,.022,.028,.028);lamp(lr,-.875,.52,z*.9,.01,.025,.035);}
    box(blk,-.91,-.85,.12,.20,-.36,.36);
    for(const z of [-.36,.36]){tube(st,[.27,1.02,z*.86],[.27,1.02,z],.008,6);box(blk,.25,.29,.98,1.08,z-.03*Math.sign(z)-.005,z+.005);}
    rbox(blk,-.44,.72,0,.05,.13,.19,.4,12,6);rbox(blk,-.36,.60,0,.10,.04,.19,.4,12,6);
    tube(st,[.28,.62,.33],[.25,.96,.33],.012,6);
    for(const z of [-.09,.09])tube(hose,[.62,.28,z],[.66,1.16,z],.012,6);
  }else if(kind==='boom'){
    const br=group('basket rotator',OR,{sway:{p:[1.74,.72,0],roll:.9,pitch:.5}});
    box(br,1.66,1.76,.40,.86,-.09,.09);tube(group('rotator pin','steel',{sway:{p:[1.74,.72,0],roll:.9,pitch:.5}}),[1.71,.74,-.12],[1.71,.74,.12],.03,10);
    bar(group('jib side plates',OR),[1.60,.94,-.07],[1.72,.74,-.07],.03,.10);bar(group('jib side plates',OR),[1.60,.94,.07],[1.72,.74,.07],.03,.10);
    for(const z of [-.10,.10])tube(hose,[.22,1.05,z],[1.58,.99,z],.012,6);
    for(const z of [-.30,.30]){lamp(lw,.80,.31,z,.012,.025,.035);lamp(lr,-.80,.31,z,.012,.025,.035);}
    for(const [x0,x1] of [[.56,.78],[-.78,-.56]])for(const sd of [1,-1])stripes(group('chassis tape',BK),group('chassis tape yellow','hivisPanel'),x0,x1,.28,.34,.405*sd,sd,6);
    rbox(blk,.05,.30,.42,.16,.08,.04,.3,12,6);
  }else if(kind==='scissor'){
    const ld=group('ladder','steel');for(const z of [-.12,.12])tube(ld,[-.66,.30,z],[-.76,.86,z],.014,6);
    for(let i=1;i<6;i++){const t=i/6,x=-.66-.10*t,y=.30+.56*t;tube(ld,[x,y,-.12],[x,y,.12],.011,6);}
    for(const sd of [1,-1])box(blk,-.42,.42,.08,.15,.345*sd-.012,.345*sd+.012);
    tube(st,[-.28,.52,0],[.30,.74,0],.03,10);tube(blk,[-.28,.52,0],[.02,.63,0],.045,10);
    for(const z of [-.24,.24]){lamp(lw,.645,.28,z,.01,.025,.035);lamp(lr,-.645,.28,z,.01,.025,.035);}
    tube(blk,[.56,1.20,.08],[.60,.94,.28],.008,6);
  }else if(kind==='tractor'){
    for(let i=0;i<4;i++)box(blk,.91,1.00,.28+i*.06,.33+i*.06,-.19,.19);box(st,.90,1.01,.26,.28,-.21,.21);
    for(const z of [-.17,.17])lamp(lw,.905,.60,z,.012,.03,.03);
    for(const [x,z] of [[.10,-.30],[.10,.30],[-.30,-.30],[-.30,.30]])lamp(lw,x,1.10,z,.025,.02,.025);
    for(const z of [-.44,.44])lamp(lr,-.74,.60,z,.02,.03,.025);
    for(const sd of [1,-1]){const z=.29*sd;tube(st,[.12,.96,z],[.14,.96,z+.10*sd],.008,6);box(blk,.12,.16,.90,1.02,z+.09*sd-.02,z+.09*sd+.02);}
    for(const z of [-.15,.15])bar(st,[-.55,.40,z],[-.86,.30,z*1.3],.03,.03);bar(st,[-.55,.72,0],[-.86,.56,0],.03,.03);bar(st,[-.86,.30,-.20],[-.86,.30,.20],.025,.025);
    tube(blk,[.55,1.18,.17],[.55,1.23,.17],.034,10);
    for(const sd of [1,-1])box(blk,-.10,.06,.30,.33,.30*sd-.05,.30*sd+.05);
  }
};
/* the two trailers: safety chains from the drawbar to the hitch, a number plate, amber side markers */
G.trailerDetail=function(K,L,halfW){
  const {group,box,tube}=K,st=group('safety chains','steel'),pl=group('number plate','plantWhite'),mk=group('side markers','hivisPanel');
  for(const z of [-.05,.05]){const a=[L-.30,.25,z*2.4],b=[L-.16,.19,z*1.6],c=[L-.03,.22,z];tube(st,a,b,.008,5);tube(st,b,c,.008,5);}
  box(pl,-.674,-.668,.205,.265,-.115,.115);box(group('plate border','plantBlack'),-.669,-.663,.195,.275,-.125,.125);
  for(const x of [-.45,.45])for(const z of [-halfW,halfW])box(mk,x-.03,x+.03,.28,.32,z-.006,z+.006);
};
