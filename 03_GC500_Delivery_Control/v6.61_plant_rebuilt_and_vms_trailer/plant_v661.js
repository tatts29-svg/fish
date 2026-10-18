/* v6.61 - COATES PLANT, REBUILT FROM THE PHOTOGRAPHS (Andrew Fisher, 26 Sep 2026, with photographs of a Coates rough-terrain
   forklift, a Compact rough-terrain scissor lift and an Optimum slab scissor, a 4WD articulating boom with two operators in the
   basket, and a solar VMS trailer: "improve the quality of the vehicles ... make sure they are Coates and are orange").
   The same part format the car uses - {name, material, vertices (pos, normal, uv), indices, wheel?, sway?, tex?} - so the car's
   own draw call draws them, the wheels turn on their axles, and the quality steps apply. Local units are the car's (half a car
   length is one; y=0 is the road; x forward; z to the driver's right). The machines travel the way they travel on a site:
   platform down, boom stowed, operators inside the rails - safety first, even on a race track. The shapes are the recognisable
   ones in the Coates orange; nothing here is a claim about a particular machine, and the credit line says the backdrop is
   decoration. */
G.PLANT={forklift:{label:'Forklift',speed:.48,grip:.62,note:.60},boom:{label:'Boom lift',speed:.38,grip:.55,note:.55},scissor:{label:'Scissor lift',speed:.34,grip:.52,note:.55},tractor:{label:'Tractor',speed:.55,grip:.66,note:.50}};
G.plantKit=function(level){
  const TAU=Math.PI*2,parts=[],byName={},segments=n=>level==='high'||n<=8?n:Math.max(8,Math.ceil(n*.6/4)*4);
  const sub=(a,b)=>a.map((x,i)=>x-b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=a=>{const l=Math.hypot(...a)||1;return a.map(x=>x/l);},mix=(a,b,t)=>a+(b-a)*t;
  const sgnp=(t,e)=>Math.sign(t)*Math.pow(Math.abs(t),e);
  function group(name,material,opts){const key=name+'|'+material+'|'+JSON.stringify(opts||{});if(byName[key])return byName[key];
    const p={name,material,vertices:[],indices:[]};if(opts)Object.assign(p,opts);parts.push(p);byName[key]=p;return p;}
  function add(p,positions,indices,uvs,expected){
    const ns=positions.map(()=>[0,0,0]),clean=[];
    for(let i=0;i<indices.length;i+=3){
      let a=indices[i],b=indices[i+1],c=indices[i+2],n=cross(sub(positions[b],positions[a]),sub(positions[c],positions[a]));
      if(Math.hypot(...n)<1e-14)continue;
      const center=positions[a].map((v,k)=>(v+positions[b][k]+positions[c][k])/3);
      if(expected&&dot(n,typeof expected==='function'?expected(center):expected)<0){indices[i+1]=c;indices[i+2]=b;n=n.map(x=>-x);}
      clean.push(indices[i],indices[i+1],indices[i+2]);
      for(const j of [a,b,c])for(let k=0;k<3;k++)ns[j][k]+=n[k];
    }
    const base=p.vertices.length/8;
    positions.forEach((q,i)=>{const fb=expected?(typeof expected==='function'?expected(q):expected):[0,1,0],n=norm(Math.hypot(...ns[i])>1e-15?ns[i]:fb);p.vertices.push(...q,...n,...(uvs&&uvs[i]||[0,0]));});
    for(const j of clean)p.indices.push(base+j);
  }
  function patch(p,fn,nu,nv,expected){nu=segments(nu);nv=segments(nv);const vs=[],uv=[],ix=[];
    for(let i=0;i<=nu;i++)for(let j=0;j<=nv;j++){vs.push(fn(i/nu,j/nv));uv.push([i/nu,j/nv]);}
    for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;ix.push(a,b,b+1,a,b+1,a+1);}
    add(p,vs,ix,uv,expected);}
  function quad(p,a,b,c,d,out){add(p,[a,b,c,d],[0,1,2,0,2,3],[[0,0],[1,0],[1,1],[0,1]],out);}
  function box(p,x0,x1,y0,y1,z0,z1){
    quad(p,[x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],[0,0,-1]);quad(p,[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1]);
    quad(p,[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[0,-1,0]);quad(p,[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1],[0,1,0]);
    quad(p,[x0,y0,z0],[x0,y1,z0],[x0,y1,z1],[x0,y0,z1],[-1,0,0]);quad(p,[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[x1,y0,z1],[1,0,0]);}
  /* a rounded box: a superellipsoid, boxy in the middle and soft at every edge - the pressed panels of real plant */
  function rbox(p,cx,cy,cz,a,b,c,e,nu,nv){const C=[cx,cy,cz];e=e||.22;
    patch(p,(u,v)=>{const eta=-Math.PI/2+v*Math.PI,om=-Math.PI+u*TAU,ce=Math.cos(eta);
      return[cx+a*sgnp(ce,e)*sgnp(Math.cos(om),e),cy+b*sgnp(Math.sin(eta),e),cz+c*sgnp(ce,e)*sgnp(Math.sin(om),e)];},nu||24,nv||12,q=>sub(q,C));}
  function tube(p,a,b,r,n,caps){n=n||10;const axis=norm(sub(b,a)),side=norm(cross(axis,Math.abs(axis[1])<.85?[0,1,0]:[1,0,0])),up=cross(axis,side);
    patch(p,(t,u)=>{const ang=u*TAU;return a.map((v,k)=>mix(v,b[k],t)+r*(side[k]*Math.cos(ang)+up[k]*Math.sin(ang)));},1,n,q=>{const v=sub(q,a),t=dot(v,axis);return v.map((w,k)=>w-axis[k]*t);});
    if(caps!==false)for(const [c,d] of [[a,-1],[b,1]]){const pts=[];for(let k=0;k<n;k++){const ang=k/n*TAU;pts.push(c.map((v,i)=>v+r*(side[i]*Math.cos(ang)+up[i]*Math.sin(ang))));}const ix=[];for(let k=1;k<n-1;k++)ix.push(0,k,k+1);add(p,pts,ix,null,axis.map(v=>v*d));}}
  /* a square section bar between two points - channel steel, rails, forks */
  function bar(p,a,b,w,h){const axis=norm(sub(b,a)),s=norm(cross(axis,Math.abs(axis[1])<.9?[0,1,0]:[1,0,0])),u=cross(axis,s);
    const C=(q,i,j)=>q.map((v,k)=>v+s[k]*w*i/2+u[k]*(h||w)*j/2),cs=[[-1,-1],[1,-1],[1,1],[-1,1]];
    for(let k=0;k<4;k++){const [i0,j0]=cs[k],[i1,j1]=cs[(k+1)%4];quad(p,C(a,i0,j0),C(a,i1,j1),C(b,i1,j1),C(b,i0,j0),q=>{const m=a.map((v,kk)=>(v+b[kk])/2);const d=sub(q,m),t=dot(d,axis);return d.map((w2,kk)=>w2-axis[kk]*t);});}
    quad(p,C(a,-1,-1),C(a,1,-1),C(a,1,1),C(a,-1,1),axis.map(v=>-v));quad(p,C(b,-1,-1),C(b,1,-1),C(b,1,1),C(b,-1,1),axis);}
  function ball(p,c,r,n){patch(p,(a,b)=>{const th=a*TAU,ph=b*Math.PI;return[c[0]+r*Math.cos(th)*Math.sin(ph),c[1]+r*Math.cos(ph),c[2]+r*Math.sin(th)*Math.sin(ph)];},n||14,n?Math.ceil(n/2):8,q=>sub(q,c));}
  function disc(p,c,r0,r1,axis,n){n=n||24;const zs=axis;const pts=[],ix=[];for(let k=0;k<=n;k++){const t=k/n*TAU;pts.push([c[0]+Math.cos(t)*r0,c[1]+Math.sin(t)*r0,c[2]],[c[0]+Math.cos(t)*r1,c[1]+Math.sin(t)*r1,c[2]]);}
    for(let k=0;k<n;k++){const a=2*k;ix.push(a,a+2,a+3,a,a+3,a+1);}add(p,pts,ix,null,[0,0,zs]);}
  /* a wheel: tyre carcass, sidewalls, tread lugs in a chevron, a coloured rim and a hub - all turning on the axle */
  function wheel(x,y,z,R,W,opts){opts=opts||{};const n=opts.n||28,rimCol=opts.rim||'plant',lugs=opts.lugs!==false,zs=z<0?-1:1,z0=z-W/2*zs,z1=z+W/2*zs,wh={wheel:{x,y}};
    const tyre=group('tyre','rubber',wh),rim=group('rim',rimCol,wh),hub=group('hub','plantBlack',wh);
    const Rc=lugs?R*.93:R;
    patch(tyre,(a,b)=>{const t=a*TAU,bulge=Math.sin(b*Math.PI)*R*.03;return[x+Math.cos(t)*(Rc+bulge),y+Math.sin(t)*(Rc+bulge),mix(z0,z1,b)];},n,4,q=>[q[0]-x,q[1]-y,0]);
    const rr=R*(opts.rimR||.56);
    for(const [zz,d] of [[z0,-zs],[z1,zs]])disc(tyre,[x,y,zz],rr,Rc,d,n);
    const zo=z1+.004*zs;disc(rim,[x,y,zo],rr*.28,rr,zs,n);disc(hub,[x,y,zo+.006*zs],0,rr*.3,zs,12);
    for(let k=0;k<6;k++){const t=k/6*TAU;ball(hub,[x+Math.cos(t)*rr*.45,y+Math.sin(t)*rr*.45,zo+.008*zs],rr*.06,6);}
    if(lugs){const nl=opts.nl||18,h=R*.075,wl=R*.19;
      for(let k=0;k<nl;k++){const t=(k+.5)/nl*TAU;for(const side of [0,1]){
        const za=side?mix(z0,z1,.52):mix(z0,z1,.04),zb=side?mix(z0,z1,.96):mix(z0,z1,.48),tt=t+(side?.07:-.07),rd=[Math.cos(tt),Math.sin(tt),0],tg=[-Math.sin(tt),Math.cos(tt),0];
        const P=(r,s,zz)=>[x+rd[0]*r+tg[0]*s,y+rd[1]*r+tg[1]*s,zz];
        const r0=Rc-.002,r1=Rc+h;
        const pts=[P(r0,-wl/2,za),P(r0,wl/2,za),P(r1,wl/2*.8,za),P(r1,-wl/2*.8,za),P(r0,-wl/2,zb),P(r0,wl/2,zb),P(r1,wl/2*.8,zb),P(r1,-wl/2*.8,zb)];
        const F=[[0,1,2,3],[4,5,6,7],[0,1,5,4],[3,2,6,7],[0,3,7,4],[1,2,6,5]];
        for(const f of F)add(tyre,[pts[f[0]],pts[f[1]],pts[f[2]],pts[f[3]]],[0,1,2,0,2,3],null,q=>[q[0]-x,q[1]-y,(q[2]-z)*.4]);}}}
  }
  /* a curved guard over a wheel: a half-shell following the tyre */
  function guard(p,x,y,z,R,W,a0,a1,th){const zs=z<0?-1:1;patch(p,(u,v)=>{const t=mix(a0,a1,u);return[x+Math.cos(t)*R,y+Math.sin(t)*R,z+mix(-W/2,W/2,v)];},20,2,q=>[q[0]-x,q[1]-y,0]);
    if(th)for(const zz of [z-W/2,z+W/2])patch(p,(u,v)=>{const t=mix(a0,a1,u),r=mix(R,R-th,v);return[x+Math.cos(t)*r,y+Math.sin(t)*r,zz];},20,1,[0,0,zz>z?1:-1]);}
  /* the Coates wordmark from the car's own typeset atlas (DejaVu Sans Bold, not an official logo), as a flat decal */
  const ATW=1024,ATH=512,RC=[24,24,758,150];
  function wordmark(x0,x1,y0,y1,z,side,colour){const p=group('Coates '+(side>0?'right':'left')+' '+x0.toFixed(2),'decal',{color:colour||[.97,.97,.96]}),o=side*.004;
    const uv=(u,v)=>[(RC[0]+.5+u*(RC[2]-1))/ATW,(RC[1]+.5+v*(RC[3]-1))/ATH];
    const X=u=>mix(x0,x1,side>0?u:1-u);
    add(p,[[X(0),y1,z+o],[X(1),y1,z+o],[X(1),y0,z+o],[X(0),y0,z+o]],[0,1,2,0,2,3],[uv(0,0),uv(1,0),uv(1,1),uv(0,1)],[0,0,side]);}
  function stripes(p1,p2,x0,x1,y0,y1,z,side,n){const w=(x1-x0)/n;for(let i=0;i<n;i++){const g=i%2?p2:p1;quad(g,[x0+i*w,y0,z],[x0+(i+.5)*w,y0,z],[x0+(i+1)*w,y1,z],[x0+(i+.5)*w,y1,z],[0,0,side]);}}
  /* a person in a hard hat and hi-vis, standing - the operators ride inside the rails */
  function operator(x,y,z,face){const hv=group('hi-vis','hivis'),dk=group('workwear','plantBlack'),sk=group('skin','skin'),hat=group('hard hat','plantWhite');
    rbox(dk,x,y+.10,z-.035,.035,.10,.03,.4,10,6);rbox(dk,x,y+.10,z+.035,.035,.10,.03,.4,10,6);
    rbox(hv,x,y+.29,z,.06,.10,.09,.45,12,8);box(group('reflective tape','plantWhite'),x-.061,x+.061,y+.25,y+.27,z-.091,z+.091);
    rbox(hv,x+.02*face,y+.30,z-.11,.03,.08,.03,.5,8,6);rbox(hv,x+.02*face,y+.30,z+.11,.03,.08,.03,.5,8,6);
    ball(sk,[x,y+.44,z],.045,12);ball(hat,[x,y+.47,z],.05,12);box(hat,x-.065,x+.065,y+.455,y+.462,z-.06,z+.06);}
  function beacon(x,y,z){const p=group('beacon','beacon');tube(group('beacon base','plantBlack'),[x,y,z],[x,y+.02,z],.03,10);tube(p,[x,y+.02,z],[x,y+.07,z],.026,10);ball(p,[x,y+.07,z],.026,10);}
  function railBox(p,x0,x1,y0,y1,z0,z1,r){for(const [x,z] of [[x0,z0],[x0,z1],[x1,z0],[x1,z1]])tube(p,[x,y0,z],[x,y1,z],r,6);
    for(const y of [y1,mix(y0,y1,.52)]){tube(p,[x0,y,z0],[x1,y,z0],r,6);tube(p,[x0,y,z1],[x1,y,z1],r,6);tube(p,[x0,y,z0],[x0,y,z1],r,6);tube(p,[x1,y,z0],[x1,y,z1],r,6);}
    const mid=(x0+x1)/2;tube(p,[mid,y0,z0],[mid,y1,z0],r*.8,6);tube(p,[mid,y0,z1],[mid,y1,z1],r*.8,6);}
  return {parts,group,add,patch,quad,box,rbox,tube,bar,ball,disc,wheel,guard,wordmark,stripes,operator,beacon,railBox,mix};
};
G.plantModel=function(kind,quality){
  const cache=G._plantModels||(G._plantModels={}),level=quality==='balanced'?'balanced':'high',key=kind+':'+level;
  if(cache[key])return cache[key];
  const K=G.plantKit(level),{group,box,rbox,tube,bar,ball,wheel,guard,wordmark,stripes,operator,beacon,railBox,quad,patch}=K;
  const OR='plant',BK='plantBlack';
  if(kind==='forklift'){
    /* rough-terrain forklift: orange body with the big rounded counterweight and rear guards, black engine cover and ROPS
       canopy, black two-stage mast with its chains, a load backrest, long orange tines, knobbly tyres on orange rims */
    const body=group('body',OR),blk=group('black trim',BK),st=group('steel','steel');
    rbox(body,-.10,.36,0,.52,.15,.33,.25,26,12);
    rbox(body,-.66,.42,0,.20,.21,.40,.28,24,12);
    guard(body,-.50,.21,.345,.27,.14,.05,Math.PI-.05,.02);guard(body,-.50,.21,-.345,.27,.14,.05,Math.PI-.05,.02);
    guard(body,.34,.22,.345,.27,.13,.25,Math.PI-.35,.02);guard(body,.34,.22,-.345,.27,.13,.25,Math.PI-.35,.02);
    box(body,.02,.30,.30,.34,.30,.44);box(body,.02,.30,.30,.34,-.44,-.30);
    rbox(blk,-.28,.60,0,.28,.07,.30,.3,20,8);
    rbox(blk,-.30,.66,0,.10,.03,.10,.3,12,6);box(blk,-.42,-.16,.64,.70,-.13,.13);box(blk,-.44,-.39,.70,.92,-.14,.14);
    box(blk,.18,.28,.52,.72,-.18,.18);tube(st,[.22,.72,0],[.10,.84,0],.016,8);tube(blk,[.10,.84,-.001],[.10,.84,.001],.10,16);
    const rops=group('ROPS canopy',BK);
    for(const z of [-.31,.31]){tube(rops,[.30,.52,z],[.24,1.10,z],.028,8);tube(rops,[-.55,.58,z],[-.55,.92,z],.03,8);tube(rops,[-.55,.92,z],[-.46,1.10,z],.03,8);}
    rbox(rops,-.11,1.12,0,.40,.03,.34,.2,16,6);for(let i=0;i<5;i++){const x=-.36+i*.12;tube(rops,[x,1.155,-.3],[x,1.155,.3],.012,6);}
    tube(blk,[-.60,.52,.30],[-.60,1.22,.30],.045,12);tube(group('exhaust guard',BK),[-.60,.95,.30],[-.60,1.18,.30],.056,12);
    const mast=group('mast',BK),inner=group('mast inner',BK),chain=group('chains','steel');
    for(const z of [-.22,.22]){bar(mast,[.66,.10,z],[.64,1.22,z],.05,.09);bar(inner,[.70,.14,z*.82],[.68,1.26,z*.82],.04,.07);tube(chain,[.72,.25,z*.55],[.71,1.20,z*.55],.012,6);}
    for(const y of [.20,.72,1.20])bar(mast,[.65,y,-.24],[.65,y,.24],.04,.05);
    tube(st,[.62,.15,0],[.60,1.05,0],.035,10);tube(st,[.30,.40,.20],[.60,.55,.22],.025,8);tube(st,[.30,.40,-.20],[.60,.55,-.22],.025,8);
    const car2=group('carriage',BK);box(car2,.73,.77,.12,.46,-.32,.32);for(let i=0;i<7;i++){const z=-.30+i*.1;bar(car2,[.75,.46,z],[.75,.86,z],.025,.02);}bar(car2,[.75,.86,-.31],[.75,.86,.31],.03,.03);
    const tines=group('tines',OR);for(const z of [-.17,.17]){box(tines,.77,.81,.06,.44,z-.035,z+.035);patch(tines,(u,v)=>{const x=.77+u*.62,t=(1-u)*.035+.012;return[x,.06+v*t,z];},6,1,[0,0,1]);
      box(tines,.77,1.39,.055,.075,z-.035,z+.035);}
    wordmark(-.58,-.16,.30,.38,.402,1);wordmark(-.58,-.16,.30,.38,-.402,-1);
    beacon(-.12,1.19,0);operator(-.30,.52,0,1);
    wheel(.34,.22,.37,.22,.17,{nl:18});wheel(.34,.22,-.37,.22,.17,{nl:18});wheel(-.50,.21,.37,.21,.15,{nl:16});wheel(-.50,.21,-.37,.21,.15,{nl:16});
  }else if(kind==='scissor'){
    /* rough-terrain scissor (the Compact in the photograph): orange chassis, black outrigger jacks at the corners, the folded
       orange scissor pack, the platform with its roll-out deck, guardrails with a mid-rail and kickplate, the control box */
    const ch=group('chassis',OR),blk=group('black trim',BK),st=group('steel','steel');
    rbox(ch,0,.34,0,.64,.14,.34,.18,28,10);box(blk,-.62,.62,.18,.26,-.345,.345);
    for(const [x,z] of [[.52,.36],[.52,-.36],[-.52,.36],[-.52,-.36]]){box(blk,x-.05,x+.05,.30,.52,z-.04,z+.04);tube(st,[x,.30,z],[x,.16,z],.022,8);box(blk,x-.06,x+.06,.13,.15,z-.06,z+.06);}
    const arms=group('scissor pack',OR);
    for(let i=0;i<4;i++){const b=.49+i*.075;for(const z of [-.24,.24]){bar(arms,[-.58,b,z],[.58,b+.06,z],.05,.035);bar(arms,[.58,b,z],[-.58,b+.06,z],.05,.035);}tube(st,[0,b+.03,-.26],[0,b+.03,.26],.018,8);}
    const pl=group('platform',OR);box(pl,-.72,.72,.80,.86,-.34,.34);box(pl,.72,1.02,.80,.84,-.30,.30);
    stripes(group('hazard black',BK),group('hazard yellow','hivisPanel'),-.72,.72,.86,.94,.342,1,18);stripes(group('hazard black',BK),group('hazard yellow','hivisPanel'),-.72,.72,.86,.94,-.342,-1,18);
    box(pl,-.72,.72,.86,.94,-.34,-.33);box(pl,-.72,.72,.86,.94,.33,.34);
    railBox(group('guardrails',OR),-.70,.70,.94,1.44,-.32,.32,.016);railBox(group('extension rails',OR),.72,1.00,.84,1.34,-.28,.28,.014);
    box(blk,.50,.62,1.20,1.32,-.08,.08);tube(blk,[.56,1.32,0],[.56,1.36,0],.012,6);
    wordmark(-.50,.10,.34,.44,.342,1);wordmark(-.50,.10,.34,.44,-.342,-1);
    wordmark(-.40,.20,.96,1.04,.323,1,[1,1,1]);wordmark(-.40,.20,.96,1.04,-.323,-1,[1,1,1]);
    beacon(-.62,1.44,.30);operator(.05,.86,0,1);
    wheel(.44,.19,.38,.19,.15,{nl:16,rim:'plantBlack'});wheel(.44,.19,-.38,.19,.15,{nl:16,rim:'plantBlack'});wheel(-.44,.19,.38,.19,.15,{nl:16,rim:'plantBlack'});wheel(-.44,.19,-.38,.19,.15,{nl:16,rim:'plantBlack'});
  }else if(kind==='boom'){
    /* 4WD articulating boom, stowed for travel: orange chassis between four big knobbly tyres, the turret and its counterweight,
       the folded riser, the telescopic boom laid forward over the chassis, the jib, and the basket at the front with two
       operators in hi-vis inside the rails - the basket swings a little with the corners, as a real one does */
    const ch=group('chassis',OR),blk=group('black trim',BK),st=group('steel','steel');
    rbox(ch,0,.36,0,.78,.13,.40,.2,28,10);box(blk,-.80,.80,.26,.30,-.41,.41);
    for(const x of [.58,-.58])for(const z of [.46,-.46])guard(ch,x,.26,z,.30,.16,.25,Math.PI-.25,.02);
    const tu=group('turret',OR);rbox(tu,-.18,.62,0,.40,.14,.36,.2,24,10);rbox(group('counterweight',OR),-.58,.60,0,.14,.17,.38,.25,18,10);
    wordmark(-.50,-.02,.52,.62,.372,1,[.06,.06,.07]);wordmark(-.50,-.02,.52,.62,-.372,-1,[.06,.06,.07]);
    const riser=group('riser',OR);bar(riser,[-.30,.78,-.12],[.40,.84,-.12],.07,.10);bar(riser,[-.30,.78,.12],[.40,.84,.12],.07,.10);
    tube(st,[-.20,.72,0],[.30,.86,0],.03,8);
    const bm=group('boom',OR),bi=group('boom inner','plantBlack');bar(bm,[.10,.96,0],[1.35,.92,0],.16,.14);bar(bi,[1.30,.92,0],[1.62,.90,0],.12,.10);
    stripes(group('boom tape',BK),group('boom tape yellow','hivisPanel'),.20,.60,.93,.98,.081,1,6);
    const jib=group('jib',OR);bar(jib,[1.62,.90,0],[1.74,.72,0],.08,.08);
    const bs=group('basket',OR,{sway:{p:[1.74,.72,0],roll:.9,pitch:.5}}),br=group('basket rails',OR,{sway:{p:[1.74,.72,0],roll:.9,pitch:.5}});
    box(bs,1.74,2.16,.36,.40,-.36,.36);box(bs,1.74,2.16,.40,.50,-.36,-.34);box(bs,1.74,2.16,.40,.50,.34,.36);box(bs,1.74,1.76,.40,.50,-.36,.36);box(bs,2.14,2.16,.40,.50,-.36,.36);
    railBox(br,1.75,2.15,.50,.90,-.35,.35,.016);
    const cb=group('basket control box',BK,{sway:{p:[1.74,.72,0],roll:.9,pitch:.5}});box(cb,1.76,1.84,.74,.86,-.12,.12);
    const opA=K.parts.length;operator(1.86,.40,-.15,1);operator(2.02,.40,.16,1);for(let i=opA;i<K.parts.length;i++)K.parts[i].sway={p:[1.74,.72,0],roll:.9,pitch:.5};
    beacon(-.50,.64,.30);
    wheel(.58,.26,.46,.26,.19,{nl:18});wheel(.58,.26,-.46,.26,.19,{nl:18});wheel(-.58,.26,.46,.26,.19,{nl:18});wheel(-.58,.26,-.46,.26,.19,{nl:18});
  }else{
    /* tractor: orange bonnet and cab, black grille and roof, big rear drive wheels and small fronts, both lugged */
    const hood=group('hood',OR),blk=group('black trim',BK),st=group('steel','steel');
    rbox(hood,.50,.52,0,.38,.17,.24,.22,24,10);box(blk,.87,.90,.38,.66,-.22,.22);for(let i=0;i<6;i++)box(st,.90,.91,.40+i*.045,.415+i*.045,-.20,.20);
    rbox(group('cab lower',OR),-.12,.48,0,.25,.14,.30,.2,20,8);
    const gl2=group('cab glass','glass');box(gl2,-.34,.12,.62,1.04,-.285,.285);
    const pil=group('cab frame',BK);for(const [x,z] of [[-.34,-.29],[-.34,.29],[.12,-.29],[.12,.29]])tube(pil,[x,.62,z],[x,1.06,z],.02,6);rbox(pil,-.11,1.08,0,.30,.04,.34,.25,16,6);
    tube(st,[.55,.66,.17],[.55,1.18,.17],.026,8);tube(st,[.40,.66,-.16],[.40,1.02,-.16],.03,8);
    for(const z of [.44,-.44])guard(group('mudguard',OR),-.35,.36,z,.40,.20,.2,Math.PI-.2,.02);
    wordmark(.24,.74,.44,.54,.242,1,[.06,.06,.07]);wordmark(.24,.74,.44,.54,-.242,-1,[.06,.06,.07]);
    beacon(-.12,1.12,0);operator(-.12,.55,0,1);
    wheel(-.35,.36,.44,.36,.22,{nl:22,rimR:.62});wheel(-.35,.36,-.44,.36,.22,{nl:22,rimR:.62});wheel(.60,.19,.32,.19,.13,{nl:14});wheel(.60,.19,-.32,.19,.13,{nl:14});
  }
  return (cache[key]=G.finishModel(K.parts,level,'original parametric '+kind));
};
G.finishModel=function(parts,level,kind){
  const bounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};let triangles=0,vertices=0;
  for(const p of parts){
    for(let i=0;i<p.vertices.length;i+=8){for(let k=0;k<8;k++)if(!Number.isFinite(p.vertices[i+k]))throw Error('Non-finite model vertex: '+p.name);for(let k=0;k<3;k++){bounds.min[k]=Math.min(bounds.min[k],p.vertices[i+k]);bounds.max[k]=Math.max(bounds.max[k],p.vertices[i+k]);}}
    triangles+=p.indices.length/3;vertices+=p.vertices.length/8;p.vertices=new Float32Array(p.vertices);p.indices=new Uint32Array(p.indices);
  }
  return {parts:parts.filter(p=>p.indices.length),bounds,stats:{triangles,vertices,parts:parts.length,quality:level,kind}};
};
/* ---- the VMS trailer: a single-axle orange trailer with an A-frame drawbar and jockey wheel, stabiliser legs, the mast, a
   black board whose amber LED face reads COATES / GC500 / 2026 (Andrew Fisher's words), and the solar panel on top. The face
   is its own small texture: every LED a dot, lit ones amber and glowing at night, the rest dark. The board faces rearward,
   the way a towed message board faces the traffic behind it. Local frame: origin on the ground under the axle, x forward to
   the coupling at x=L. */
G.VMS={L:1.95,text:['COATES','GC500','2026']};
const VMS_FONT={C:['.###.','#...#','#....','#....','#....','#...#','.###.'],O:['.###.','#...#','#...#','#...#','#...#','#...#','.###.'],
  A:['.###.','#...#','#...#','#####','#...#','#...#','#...#'],T:['#####','..#..','..#..','..#..','..#..','..#..','..#..'],E:['#####','#....','#....','####.','#....','#....','#####'],
  S:['.####','#....','#....','.###.','....#','....#','####.'],G:['.###.','#...#','#....','#.###','#...#','#...#','.###.'],'5':['#####','#....','####.','....#','....#','#...#','.###.'],
  '0':['.###.','#...#','#..##','#.#.#','##..#','#...#','.###.'],'2':['.###.','#...#','....#','...#.','..#..','.#...','#####'],'6':['..##.','.#...','#....','####.','#...#','#...#','.###.']};
G.vmsTexture=function(gl){
  const cache=G._vmsTex||(G._vmsTex=new WeakMap());if(cache.has(gl))return cache.get(gl);
  const COLS=44,ROWS=29,CELL=8,W=COLS*CELL,H=ROWS*CELL,px=new Uint8Array(W*H),lit=new Uint8Array(COLS*ROWS);
  G.VMS.text.forEach((line,li)=>{const w=line.length*6-1,c0=Math.floor((COLS-w)/2),r0=2+li*9;
    [...line].forEach((ch,ci)=>{const g=VMS_FONT[ch];if(!g)return;for(let r=0;r<7;r++)for(let c=0;c<5;c++)if(g[r][c]==='#')lit[(r0+r)*COLS+c0+ci*6+c]=1;});});
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const on=lit[r*COLS+c],cx=c*CELL+CELL/2,cy=r*CELL+CELL/2,rad=on?3.3:2.6,val=on?255:30;
    for(let y=Math.floor(cy-rad-1);y<=cy+rad+1;y++)for(let x=Math.floor(cx-rad-1);x<=cx+rad+1;x++){if(x<0||y<0||x>=W||y>=H)continue;const d=Math.hypot(x+.5-cx,y+.5-cy);const a=Math.max(0,Math.min(1,rad+.5-d));if(a>0)px[y*W+x]=Math.max(px[y*W+x],Math.round(val*a));}}
  const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_ALIGNMENT,1);gl.texImage2D(gl.TEXTURE_2D,0,gl.R8,W,H,0,gl.RED,gl.UNSIGNED_BYTE,px);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  cache.set(gl,t);G.vmsTexInfo={cols:COLS,rows:ROWS,lit:lit.reduce((a,b)=>a+b,0)};return t;
};
G.vmsModel=function(quality){
  const cache=G._vmsModels||(G._vmsModels={}),level=quality==='balanced'?'balanced':'high';if(cache[level])return cache[level];
  const K=G.plantKit(level),{group,box,rbox,tube,bar,ball,wheel,guard,wordmark,quad,add}=K,L=G.VMS.L,OR='plant',BK='plantBlack';
  const fr=group('trailer frame',OR),st=group('steel','steel'),blk=group('black trim',BK);
  bar(fr,[-.62,.30,-.40],[.62,.30,-.40],.06,.06);bar(fr,[-.62,.30,.40],[.62,.30,.40],.06,.06);for(const x of [-.60,0,.60])bar(fr,[x,.30,-.40],[x,.30,.40],.05,.05);
  box(fr,-.60,.60,.33,.36,-.40,.40);
  bar(fr,[.55,.30,-.36],[L-.12,.26,0],.06,.06);bar(fr,[.55,.30,.36],[L-.12,.26,0],.06,.06);bar(fr,[L-.14,.26,0],[L-.02,.25,0],.07,.06);
  box(blk,L-.06,L+.04,.22,.30,-.04,.04);ball(st,[L,.22,0],.03,8);
  tube(st,[L-.45,.18,.07],[L-.45,.48,.07],.022,8);tube(st,[L-.45,.48,.07],[L-.41,.52,.07],.02,6);
  K.wheel(L-.45,.07,.07,.07,.04,{lugs:false,rim:'plantWhite',n:14});
  for(const [x,z] of [[-.58,-.42],[-.58,.42],[.58,-.42],[.58,.42]]){tube(st,[x,.34,z],[x,.04,z],.025,8);box(blk,x-.05,x+.05,.02,.04,z-.05,z+.05);tube(st,[x,.34,z],[x,.40,z],.015,6);}
  rbox(group('battery box',OR),-.10,.48,0,.30,.12,.32,.25,16,8);
  wordmark(-.36,.16,.44,.53,.323,1,[.06,.06,.07]);wordmark(-.36,.16,.44,.53,-.323,-1,[.06,.06,.07]);
  for(const z of [.52,-.52])guard(fr,0,.19,z,.25,.14,.05,Math.PI-.05,.02);
  K.wheel(0,.19,.52,.19,.13,{lugs:false,rim:'plantWhite',rimR:.6});K.wheel(0,.19,-.52,.19,.13,{lugs:false,rim:'plantWhite',rimR:.6});
  tube(fr,[-.20,.36,0],[-.20,1.00,0],.05,12);tube(st,[-.20,.60,0],[-.20,1.02,0],.035,10);
  const bd=group('board',BK),BY0=1.00,BY1=1.86,BZ=.74,BX0=-.30,BX1=-.22;
  box(bd,BX0,BX1,BY0,BY1,-BZ,BZ);box(group('board rim',BK),BX0-.01,BX1+.01,BY1-.01,BY1+.01,-BZ-.01,BZ+.01);
  box(group('board frame',OR),BX1,BX1+.03,BY0+.08,BY1-.08,-.10,.10);
  const face=group('LED face','ledAmber',{vmsFace:true});const fx=BX0-.004,m=.04;
  add(face,[[fx,BY1-m,BZ-m],[fx,BY1-m,-BZ+m],[fx,BY0+m,-BZ+m],[fx,BY0+m,BZ-m]],[0,1,2,0,2,3],[[1,0],[0,0],[0,1],[1,1]],[-1,0,0]);   /* read from behind: the viewer's left is the board's +z */
  const sp=group('solar panel','solar');quad(sp,[BX0-.05,BY1+.10,-.62],[BX0-.05,BY1+.10,.62],[BX1+.35,BY1+.30,.62],[BX1+.35,BY1+.30,-.62],[.4,1,0]);
  box(st,BX0-.05,BX1+.35,BY1+.06,BY1+.09,-.60,.60);tube(st,[BX1,BY1,-.5],[BX1+.2,BY1+.2,-.5],.012,6);tube(st,[BX1,BY1,.5],[BX1+.2,BY1+.2,.5],.012,6);
  const tl=group('tail lights','lampRed');box(tl,-.66,-.62,.30,.36,-.40,-.30);box(tl,-.66,-.62,.30,.36,.30,.40);
  return (cache[level]=G.finishModel(K.parts,level,'original parametric VMS trailer'));
};
/* the trailer follows the hitch the way a real one does: its axle is dragged towards the tow ball, so it tracks inside on a
   corner and swings out when the car slides. Stepped once a frame from the car's own pose; a jump in the car's position
   (a new lap, a reset) re-hitches it straight behind. */
G.trailerStep=function(S){
  if(!S.towVms||!S.pose||!G.raceCarMatrix)return null;
  const M=G.raceCarMatrix(),s=S.tune.carS,L=G.VMS.L*s,h=[M[0]*-1.10+M[4]*.14+M[12],M[1]*-1.10+M[5]*.14+M[13],M[2]*-1.10+M[6]*.14+M[14]];
  let T=S.trailer;const f=S.pose.fwd;
  if(!T||Math.hypot(h[0]-T.hx,h[2]-T.hz)>L*8){T=S.trailer={ax:h[0]-f[0]*L,az:h[2]-f[2]*L,hx:h[0],hz:h[2],spin:0,roll:0,rv:0,t:S.clock};}
  const dx=h[0]-T.ax,dz=h[2]-T.az,d=Math.hypot(dx,dz)||1,nax=h[0]-dx/d*L,naz=h[2]-dz/d*L,moved=Math.hypot(nax-T.ax,naz-T.az);
  const dt=Math.max(0,Math.min(.1,S.clock-T.t));T.t=S.clock;
  const hd=Math.atan2(dz,dx),prev=T.hd==null?hd:T.hd;let dh=hd-prev;while(dh>Math.PI)dh-=2*Math.PI;while(dh<-Math.PI)dh+=2*Math.PI;
  const lat=dt>0?-(dh/dt)*(moved/Math.max(dt,1e-3))/(s*6):0;T.rv+=((Math.max(-.08,Math.min(.08,lat))-T.roll)*60-T.rv*9)*dt;T.roll+=T.rv*dt;
  T.ax=nax;T.az=naz;T.hx=h[0];T.hz=h[2];T.hd=hd;T.spin+=moved/(.19*s);
  return T;
};
G.trailerMatrix=function(S){const T=S.trailer,s=S.tune.carS,c=Math.cos(T.hd),si=Math.sin(T.hd),y0=S.tune.deckH,cr=Math.cos(T.roll),sr=Math.sin(T.roll);
  const fwd=[c,0,si],rt=[-si,0,c],up=[0,1,0],u2=[up[0]*cr+rt[0]*sr,up[1]*cr+rt[1]*sr,up[2]*cr+rt[2]*sr],r2=[rt[0]*cr-up[0]*sr,rt[1]*cr-up[1]*sr,rt[2]*cr-up[2]*sr];
  return new Float32Array([fwd[0]*s,fwd[1]*s,fwd[2]*s,0,u2[0]*s,u2[1]*s,u2[2]*s,0,r2[0]*s,r2[1]*s,r2[2]*s,0,T.ax,y0,T.az,1]);};
/* secondary motion: a basket, a mast or a platform on a spring, leaning out of the corners and nodding under the brakes */
G.swayStep=function(S){const m=S.sim,T=S.tune,w=S.sway||(S.sway={r:0,rv:0,p:0,pv:0,t:S.clock});const dt=Math.max(0,Math.min(.1,S.clock-w.t));w.t=S.clock;if(!dt)return w;
  const k=S.kAt?S.kAt(m.s):0,aLat=Math.max(-1.5,Math.min(1.5,k*m.v*m.v/Math.max(1e-6,T.aLat||1))),aLon=Math.max(-1.5,Math.min(1.5,(m.accel||0)/Math.max(1e-6,(T.acc||1)*1.2)));
  w.rv+=((-aLat*.10-w.r)*38-w.rv*5.2)*dt;w.r+=w.rv*dt;w.pv+=((aLon*.06-w.p)*30-w.pv*4.6)*dt;w.p+=w.pv*dt;return w;};
G.swayMatrix=function(M,sw,w){const a=w.r*(sw.roll||0),b=w.p*(sw.pitch||0),ca=Math.cos(a),sa=Math.sin(a),cb=Math.cos(b),sb=Math.sin(b),p=sw.p;
  /* R = Rz(b) * Rx(a), about the pivot p */
  const R=[cb,sb,0, -sb*ca,cb*ca,sa, sb*sa,-cb*sa,ca];
  const Rp=[R[0]*p[0]+R[3]*p[1]+R[6]*p[2],R[1]*p[0]+R[4]*p[1]+R[7]*p[2],R[2]*p[0]+R[5]*p[1]+R[8]*p[2]];
  return G.matMul(M,new Float32Array([R[0],R[1],R[2],0,R[3],R[4],R[5],0,R[6],R[7],R[8],0,p[0]-Rp[0],p[1]-Rp[1],p[2]-Rp[2],1]));};
