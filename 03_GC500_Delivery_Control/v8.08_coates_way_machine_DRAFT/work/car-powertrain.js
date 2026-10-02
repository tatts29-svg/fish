import {buildTimingDrive} from './timing-drive.js';
import {valveLift,camProfileRadius,camLobePhase,ENGINE_LAYOUT} from './engine-kinematics.js';
import {buildFrontDrive} from './front-drive.js';
import {buildAccessories} from './engine-accessories.js';
import {buildSystems} from './engine-systems.js';
import './mech-register.js';   /* v8.08: the new mechanisms' references, before the register is drawn */
import {buildDriveline} from './mech-driveline.js';
import {buildBrakes} from './mech-brakes.js';
import {buildOilGalleries} from './mech-oil.js';
import {ENGINE_FIT} from './engine-kinematics.js';
import {CAR_AXLES} from './car-gc500.js';
// Illustrative, mechanically legible cutaway; dimensions are in metres.
// Receives the host's Three.js instance so this asset has no external imports.
export function buildPowertrain(T, materials = {}) {
  const root = new T.Group();
  root.name = 'V8 race car — mechanical assemblies';
  const removable = [];
  const fallback = {
    orange: 0xff6a13, black: 0x15181b, carbon: 0x23272a, chrome: 0xc4d2d7,
    rubber: 0x111313, steel: 0x66777e, dark: 0x303d43, white: 0xe4e9e9,
    redlight: 0xe54a39, headlight: 0xffffda, glass: 0x83c2d1,
  };
  const mats = {};
  for (const [key, color] of Object.entries(fallback)) {
    mats[key] = materials[key] || new T.MeshStandardMaterial({
      color, metalness: ['chrome','steel','dark'].includes(key) ? 0.75 : 0.2,
      roughness: key === 'chrome' ? 0.24 : 0.53,
    });
  }
  const UP = new T.Vector3(0, 1, 0);
  const position = new T.Vector3();
  const quaternion = new T.Quaternion();
  const matrix = new T.Matrix4();
  const scale = new T.Vector3(1, 1, 1);
  const euler = new T.Euler();
  function transformed(geometry, p = [0,0,0], r = [0,0,0]) {
    position.set(p[0], p[1], p[2]);
    euler.set(r[0], r[1], r[2]);
    quaternion.setFromEuler(euler);
    matrix.compose(position, quaternion, scale);
    geometry.applyMatrix4(matrix);
    return geometry;
  }
  const boxBase = new T.BoxGeometry(1,1,1);
  function box(w,h,d,p,r) {
    const geometry = boxBase.clone();
    geometry.scale(w,h,d);
    return transformed(geometry,p,r);
  }
  function cyl(rt,rb,h,p,r,radialSegments = 12) {
    return transformed(new T.CylinderGeometry(rt,rb,h,radialSegments,1,false),p,r);
  }
  function tube(points,radius,segments = 24,radialSegments = 8) {
    const curve = new T.CatmullRomCurve3(points.map(p => new T.Vector3(...p)));
    return new T.TubeGeometry(curve,segments,radius,radialSegments,false);
  }
  function torus(radius,thickness,p,r) {
    return transformed(new T.TorusGeometry(radius,thickness,6,20),p,r);
  }
  function roundedBox(w,h,d,p,r) {
    const s = new T.Shape();
    const a = -w/2, b = -h/2, rad = Math.min(.035,h*.35);
    s.moveTo(a+rad,b); s.lineTo(a+w-rad,b); s.quadraticCurveTo(a+w,b,a+w,b+rad);
    s.lineTo(a+w,b+h-rad); s.quadraticCurveTo(a+w,b+h,a+w-rad,b+h);
    s.lineTo(a+rad,b+h); s.quadraticCurveTo(a,b+h,a,b+h-rad);
    s.lineTo(a,b+rad); s.quadraticCurveTo(a,b,a+rad,b);
    const g = new T.ExtrudeGeometry(s,{depth:d-.012,bevelEnabled:true,bevelThickness:.006,bevelSize:.006,bevelSegments:2,steps:1,curveSegments:3});
    g.translate(0,0,-(d-.012)/2);
    return transformed(g,p,r);
  }
  function merged(geometries) {
    const chunks = geometries.filter(Boolean).map(g => {
      if (!g.attributes.normal) g.computeVertexNormals();
      const unindexed = g.index ? g.toNonIndexed() : g;
      if (unindexed !== g) g.dispose();
      return unindexed;
    });
    let count = 0;
    for (const g of chunks) count += g.attributes.position.count;
    const positions = new Float32Array(count*3), normals = new Float32Array(count*3), uvs = new Float32Array(count*2);
    let at = 0;
    for (const g of chunks) {
      positions.set(g.attributes.position.array,at);
      normals.set(g.attributes.normal.array,at);
      if (!g.attributes.uv) throw Error("Surface mapping missing: " + g.type);
      uvs.set(g.attributes.uv.array,at/3*2);
      at += g.attributes.position.array.length;
      g.dispose();
    }
    const result = new T.BufferGeometry();
    result.setAttribute('position',new T.BufferAttribute(positions,3));
    result.setAttribute('normal',new T.BufferAttribute(normals,3));
    result.setAttribute('uv',new T.BufferAttribute(uvs,2));
    result.computeBoundingSphere();
    return result;
  }
  function mesh(group,geometry,key,name) {
    const m = new T.Mesh(geometry,mats[key]);
    m.name = name || key;
    m.castShadow = true; m.receiveShadow = true;
    group.add(m);
    return m;
  }
  function batch(group,key,geometries,name) {
    return mesh(group,merged(geometries),key,name);
  }
  function assembly(id,name,home,pull) {
    const g = new T.Group();
    g.name = name; g.position.fromArray(home);
    g.userData.partId = id;
    root.add(g);
    removable.push({id,name,group:g,home:home.slice(),pull:pull.slice()});
    return g;
  }
  function boltBatch(group,placements,radius = .019) {
    if (!placements.length) return;
    const geometry = new T.CylinderGeometry(radius,radius,.017,6);
    const bolts = new T.InstancedMesh(geometry,mats.chrome,placements.length);
    bolts.name = 'Hex fasteners';
    placements.forEach((p,i) => {
      position.set(p[0],p[1],p[2]);
      euler.set(p[3] || 0,p[4] || 0,p[5] || 0);
      quaternion.setFromEuler(euler);
      matrix.compose(position,quaternion,scale);
      bolts.setMatrixAt(i,matrix);
    });
    bolts.castShadow = true; bolts.receiveShadow = true;
    group.add(bolts);
  }

  const {engineX,crankY} = ENGINE_LAYOUT, bankCos = Math.SQRT1_2;
  const engineHome = [engineX,crankY,0];
  const stations = [-.45,-.15,.15,.45];
  const phases = [0,Math.PI/2,Math.PI*1.5,Math.PI];
  const crankRadius = .069, rodLength = .285;
  const bankPoint = (x,d,side) => [x,d*bankCos,side*d*bankCos];

  // The near halves of the liners are absent, exposing each real piston mesh.
  const block = assembly('engine-block','V8 cutaway cylinder block',engineHome,[-.2,.55,-1.5]);
  const blockMetal = [box(1.31,.085,.39,[0,-.09,0]),box(1.31,.10,.065,[0,-.025,-.215])];
  const blockDark = [];
  const blockOrange = [];
  for (const side of [-1,1]) {
    const rot = [side*Math.PI/4,0,0];
    for (const x of stations) {
      const liner = new T.CylinderGeometry(.115,.115,.245,16,1,true,Math.PI/2,Math.PI);
      blockMetal.push(transformed(liner,bankPoint(x,.275,side),rot));
      const lowerCollar = new T.TorusGeometry(.114,.008,5,20,Math.PI);
      blockDark.push(transformed(lowerCollar,bankPoint(x,.17,side),[Math.PI/2+side*Math.PI/4,0,Math.PI/2]));
      // Deliberately small ribs give the sectioned casting a readable edge.
      blockOrange.push(box(.020,.22,.017,bankPoint(x-.125,.28,side),rot));
    }
    blockMetal.push(box(1.32,.053,.035,bankPoint(0,.385,side),rot));
    blockOrange.push(box(1.30,.020,.025,bankPoint(0,.403,side),rot));
  }
  for (const x of [-.625,-.30,0,.30,.625]) {
    blockMetal.push(box(.045,.17,.33,[x,-.027,0]));
    blockDark.push(torus(.058,.018,[x,0,0],[0,Math.PI/2,0]));
  }
  batch(block,'steel',blockMetal,'Sectioned aluminium casting and cylinder sleeves');
  batch(block,'dark',blockDark,'Main bearing journals and liner seams');
  batch(block,'orange',blockOrange,'Cutaway orange section edges');
  boltBatch(block,stations.flatMap(x => [[x,-.04,.19],[x,-.04,-.19]]));

  const crank = assembly('crankshaft','Cross-plane crankshaft',engineHome,[-.10,-.33,.95]);
  const rotor = new T.Group(); rotor.name = 'Rotating crankshaft'; crank.add(rotor);
  const crankMetal = [cyl(.038,.038,1.46,[0,0,0],[0,0,Math.PI/2],16)];
  const crankWeights = [];
  for (let i = 0; i < 4; i++) {
    const x = stations[i], phase = phases[i];
    const y = crankRadius*Math.cos(phase), z = crankRadius*Math.sin(phase);
    crankMetal.push(cyl(.032,.032,.14,[x,y,z],[0,0,Math.PI/2],14));
    for (const dx of [-.095,.095]) {
      crankWeights.push(box(.035,.115,.074,[x+dx,y*.4,z*.4],[phase,0,0]));
      crankWeights.push(cyl(.060,.060,.035,[x+dx,-y*.6,-z*.6],[0,0,Math.PI/2],12));
    }
  }
  crankMetal.push(cyl(.15,.15,.030,[.72,0,0],[0,0,Math.PI/2],24));
  crankWeights.push(cyl(.114,.114,.060,[-.735,0,0],[0,0,Math.PI/2],24));
  batch(rotor,'chrome',crankMetal,'Main journals, crank pins and flywheel');
  batch(rotor,'dark',crankWeights,'Crank webs and counterweights');
  batch(rotor,'orange',[torus(.145,.006,[.742,0,0],[0,Math.PI/2,0])],'Flywheel edge');

  const pistonGeometry = merged([
    cyl(.101,.097,.082,[0,0,0],undefined,20),
    cyl(.101,.101,.013,[0,.046,0],undefined,20),
    cyl(.035,.035,.184,[0,-.01,0],[0,0,Math.PI/2],12),
    box(.065,.018,.115,[0,.038,0]),
  ]);
  const ringGeometry = merged([-.012,.009,.030].map(y => torus(.1015,.0031,[0,y,0],[Math.PI/2,0,0])));
  const rodGeometry = merged([
    cyl(.017,.024,rodLength-.05,[0,rodLength*.5,0],undefined,10),
    box(.009,rodLength-.045,.046,[0,rodLength*.5,0]),
    torus(.033,.011,[0,0,0],[0,Math.PI/2,0]),
    torus(.025,.009,[0,rodLength,0],[0,Math.PI/2,0]),
    box(.021,.015,.084,[0,-.020,0]),
  ]);
  const pistonMotions = [];
  for (const side of [-1,1]) {
    for (let i = 0; i < 4; i++) {
      const n = side < 0 ? i*2+2 : i*2+1;
      const id = 'piston-'+n;
      const g = assembly(id,'Piston '+n+' crown, skirt & rings',[engineX+stations[i]+side*.019,crankY,0],[side*.15,.9,side*1.1]);
      const piston = new T.Group(); piston.name = 'Piston crown and skirt';
      piston.rotation.x = side*Math.PI/4;
      g.add(piston);
      mesh(piston,pistonGeometry,'chrome','Machined piston '+n);
      mesh(piston,ringGeometry,'dark','Three piston rings');
      const rodId='connecting-rod-'+n;
      const rodAssembly=assembly(rodId,'Connecting rod '+n,[engineX+stations[i]+side*.019,crankY,0],[side*.20,-.20,side*1.3]);
      const rod = mesh(rodAssembly,rodGeometry,'steel','Connecting rod '+n);
      pistonMotions.push({id,rodId,piston,rod,side,phase:phases[i]});
    }
  }

  const camRotors = [], valveMotions = [];
  const bankRot = side => [side*Math.PI/4,0,0];
  for (const side of [-1,1]) {
    const bankName = side > 0 ? 'near' : 'far';
    const rot = bankRot(side);
    const headId='cylinder-head-'+bankName;
    const head = assembly(headId,(side>0?'Right':'Left')+' cylinder head',engineHome,[0,.6,side*1.1]);
    batch(head,'steel',[box(1.29,.065,.231,bankPoint(0,.429,side),rot)],'Machined cylinder head');
    const camId='camshaft-'+bankName;
    const camGroup=assembly(camId,(side>0?'Right':'Left')+' camshaft & phased lobes',engineHome,[0,.8,side*.8]);
    const cam = new T.Group(); cam.position.fromArray(bankPoint(0,.570,side)); camGroup.add(cam);
    const camParts = [cyl(.021,.021,1.37,[0,0,0],[0,0,Math.PI/2],16)];
    for (let i=0;i<stations.length;i++) {
      const x=stations[i], n=side<0?i*2+2:i*2+1;
      for (const [kind,dx] of [['intake',-.032],['exhaust',.032]]) {
        const id=kind+'-valve-'+n;
        const home=[engineX+x+dx,crankY,0], pull=[dx*3,.8,side*1.1];
        const valve=assembly(id,kind[0].toUpperCase()+kind.slice(1)+' valve '+n,home,pull);
        const movingValve=new T.Group();movingValve.rotation.x=side*Math.PI/4;valve.add(movingValve);
        batch(movingValve,'chrome',[
          cyl(.008,.008,.115,[0,.471,0],undefined,10),
          cyl(.031,.026,.012,[0,.409,0],undefined,16)
        ],'Valve stem and sealing face');
        const springId=kind+'-spring-'+n;
        const springAssembly=assembly(springId,kind[0].toUpperCase()+kind.slice(1)+' return spring '+n,home,[0,.95,side*1.2]);
        const springAxis=new T.Group();springAxis.rotation.x=side*Math.PI/4;springAssembly.add(springAxis);
        const coilPoints=[];
        for(let k=0;k<=80;k++){const t=k/80,a=t*2*Math.PI*6;coilPoints.push([Math.cos(a)*.018,t*.068,Math.sin(a)*.018]);}
        const spring=mesh(springAxis,tube(coilPoints,.0035,96,5),'orange','Six-turn valve spring');spring.position.y=.460;
        mesh(springAxis,torus(.019,.004,[0,.460,0],[Math.PI/2,0,0]),'steel','Spring seat');
        const followerId=kind+'-follower-'+n;
        const followerAssembly=assembly(followerId,kind[0].toUpperCase()+kind.slice(1)+' bucket follower '+n,home,[0,1.05,side*1.3]);
        const followerAxis=new T.Group();followerAxis.rotation.x=side*Math.PI/4;followerAssembly.add(followerAxis);
        const follower=mesh(followerAxis,cyl(.023,.023,.014,[0,0,0],undefined,16),'chrome','Direct acting cam follower');
        follower.position.y=.537;
        valveMotions.push({id,springId,followerId,headId,camId,movingValve,spring,follower,n,kind,side,phase:phases[i]});
        // Cam section is extruded along the longitudinal shaft. Each profile
        // reaches the corresponding tappet at its own four-stroke phase.
        const phase=camLobePhase(n,kind,side,phases[i]);
        const outline=new T.Shape();
        for(let k=0;k<=96;k++){
          const a=k/96*Math.PI*2,r=camProfileRadius(a-phase);
          const y=r*Math.cos(a),z=r*Math.sin(a);
          if(k===0)outline.moveTo(y,z);else outline.lineTo(y,z);
        }
        const geo=new T.ExtrudeGeometry(outline,{depth:.024,bevelEnabled:false,steps:1,curveSegments:1});
        // shape X/Y -> engine Y/Z, extrusion Z -> engine X
        geo.applyMatrix4(new T.Matrix4().set(0,0,1,x+dx-.012,1,0,0,0,0,1,0,0,0,0,0,1));
        camParts.push(geo);
      }
    }
    batch(cam,'dark',camParts,'Camshaft and eight profiled cam lobes');
    camRotors.push({id:camId,rotor:cam});

    const cover = assembly('valve-cover-'+bankName,(side>0?'Right':'Left')+' orange valve cover',engineHome,[0,1.0,side*.75]);
    batch(cover,'orange',[roundedBox(1.28,.095,.245,bankPoint(0,.562,side),rot)],'Orange ribbed rocker cover');
    const fins = [];
    for (const offset of [-.065,0,.065]) {
      const p = bankPoint(0,.616,side);
      p[1] -= side*offset*bankCos; p[2] += offset*bankCos;
      fins.push(box(1.12,.006,.008,p,rot));
    }
    batch(cover,'chrome',fins,'Three polished cover fins');
    const fasteners = [];
    for (const x of [-.55,-.18,.18,.55]) for (const lateral of [-.095,.095]) {
      const p = bankPoint(x,.614,side);
      fasteners.push([p[0],p[1]-side*lateral*bankCos,p[2]+lateral*bankCos,side*Math.PI/4]);
    }
    boltBatch(cover,fasteners,.011);
  }

  const intake = assembly('intake-trumpets','Eight velocity stacks & fuel rails',engineHome,[0,.9,.15]);
  const stacks = [], stackMouths = [], fuel = [];
  const trumpetProfile = [new T.Vector2(.030,0),new T.Vector2(.030,.055),new T.Vector2(.034,.086),new T.Vector2(.046,.108),new T.Vector2(.064,.120),new T.Vector2(.067,.124)];
  const trumpetBase = new T.LatheGeometry(trumpetProfile,16);
  for (const x of stations) for (const side of [-1,1]) {
    stacks.push(transformed(trumpetBase.clone(),[x,.398,side*.103]));
    stacks.push(torus(.064,.005,[x,.521,side*.103],[Math.PI/2,0,0]));
    stackMouths.push(cyl(.031,.031,.006,[x,.452,side*.103],undefined,16));
    fuel.push(cyl(.019,.019,.045,[x,.445,side*.186],undefined,8));
  }
  for (const side of [-1,1]) fuel.push(cyl(.013,.013,1.17,[0,.44,side*.188],[0,0,Math.PI/2],10));
  batch(intake,'chrome',stacks,'Eight open aluminium velocity stacks');
  batch(intake,'black',stackMouths,'Intake throat interiors');
  batch(intake,'orange',fuel,'Fuel rails and injector bodies');
  trumpetBase.dispose();
  const airbox = assembly('airbox','Carbon induction airbox',engineHome,[.10,1.25,-.15]);
  batch(airbox,'carbon',[
    roundedBox(.78,.067,.355,[.12,.535,0]),
    roundedBox(.10,.08,.36,[-.32,.529,0]),
    tube([[-.34,.535,0],[-.58,.510,0],[-.79,.46,0]],.055,14,12),
  ],'Carbon airbox lid and intake snorkel');
  batch(airbox,'orange',[box(.68,.006,.021,[.12,.576,0]),torus(.057,.008,[-.79,.46,0],[0,Math.PI/2,0])],'Orange airbox stripe and coupling');

  for (const side of [-1,1]) {
    const g = assembly('exhaust-'+(side>0?'near':'far'),(side>0?'Right':'Left')+' four-into-one exhaust',[0,0,0],[.15,.05,side*1.15]);
    const pipes = [], flanges = [];
    for (let i=0;i<4;i++) {
      const x = engineX+stations[i];
      pipes.push(tube([[x,.828,side*.35],[x-.04,.78,side*.49],[x-.075,.59,side*.62],[x+.14,.32,side*.64],[.16+(i*.025),.265,side*(.63+i*.018)]],.033,23,8));
      flanges.push(box(.117,.016,.091,[x,.829,side*.355],[side*Math.PI/4,0,0]));
    }
    pipes.push(tube([[.15,.265,side*.675],[.39,.24,side*.725],[.72,.24,side*.78],[1.02,.26,side*.865]],.058,20,12));
    batch(g,'chrome',pipes,'Four curved headers and side exhaust');
    batch(g,'dark',[
      ...flanges,
      cyl(.068,.068,.35,[.52,.242,side*.75],[0,0,Math.PI/2],16),
      cyl(.047,.047,.013,[1.027,.26,side*.868],[0,0,Math.PI/2],16),
    ],'Header flanges, collector sleeve and exhaust mouth');
  }

  const gearbox = assembly('gearbox','Six-speed gearbox & bellhousing',[-.255,.435,0],[.20,.20,1.10]);
  const gearMetal = [
    /* the bellhousing is sectioned on its near-top quarter so the flywheel ring gear and the starter pinion can be seen working */
    transformed(new T.CylinderGeometry(.215,.235,.25,20,1,false,Math.PI/2,Math.PI*1.5),[-.025,0,0],[0,0,Math.PI/2]),
    /* v5.80 — the main case is sectioned on its near-top quarter, like the bellhousing, so the gear train, the dog rings, the forks and the selector drum can be watched working */
    transformed(new T.CylinderGeometry(.123,.183,.44,20,1,false,Math.PI/2,Math.PI*1.5),[.30,-.018,0],[0,0,Math.PI/2]),
    box(.43,.10,.21,[.285,-.078,0]),box(.43,.10,.105,[.285,.022,-.0525]),box(.43,.012,.105,[.285,.066,.0525]),
    cyl(.087,.113,.16,[.59,-.026,0],[0,0,Math.PI/2],12),
  ];
  for(let i=0;i<7;i++) gearMetal.push(box(.017,.10,.245-i*.009,[.11+i*.058,-.08,0]));   /* the cooling fins on the lower half, clear of the open quarter */
  batch(gearbox,'steel',gearMetal,'Ribbed gearbox case and bellhousing');
  batch(gearbox,'dark',[torus(.218,.009,[-.157,0,0],[0,Math.PI/2,0]),box(.13,.07,.13,[.30,.131,0])],'Bellhousing seam and shift tower');
  boltBatch(gearbox,Array.from({length:10},(_,i)=>{const a=i*Math.PI/5;return[-.157,Math.cos(a)*.195,Math.sin(a)*.195,0,0,Math.PI/2];}),.012);

  /* THE SEQUENTIAL BOX INSIDE (v5.80). Andrew Fisher, 24 Sep 2026: in the gearbox, everything has a purpose and a
     movement. A constant-mesh six-speed the way a race box is laid out: the input shaft turns the lay shaft
     through the input pair; six gear pairs are always in mesh, the six on the main shaft freewheeling at their
     own rates; three dog rings on the main shaft slide onto the gear the selector drum's track calls for, and
     the main shaft turns at that gear's rate — the same illustrative ratios the cockpit's readout uses. A shift
     turns the drum one notch (seven positions: neutral and six gears), the drum's track moves one fork, the
     fork moves its dog ring. Built in the gearbox's own units; the case is open on its near-top quarter. */
  /* v5.81 — THE RADII THE RIGHT WAY ROUND. v5.80 put the big gear of 1st on the lay shaft and the small one on the
     main, so the main shaft turned FASTEST in first (1.21× the input) while the wheels turned slowest — the box
     and the car disagreed. A reduction is a small driver on a big driven gear: 1st is the 32 mm lay gear on the
     58 mm main gear, 6th the 60 on the 30; the input pair (36 on 54) is a 1.5:1 reduction ahead of them. The
     rates that fall out — 1st .368 (2.72:1) … 6th 1.333 (0.75:1) — are what the wheels, the rollers, the prop
     shaft, the half shafts and the cockpit's km/h now read (car-app.js `powertrain`), so there is one ladder. */
  const GB={main:[-.005,.03],lay:[-.07,-.032],x:[.12,.18,.24,.30,.36,.42],rMain:[.058,.050,.045,.040,.035,.030],rLay:[.032,.040,.045,.050,.055,.060],inPair:[.036,.054]};   /* the shafts 90 mm apart, every pair summing to 90; all inside the case's 200 × 210 */
  const gearRotors={mains:[],dogs:[],forks:[]};
  {const gear=(r,w,teeth,p,rot)=>{const geos=[cyl(r,r,w,p,rot,Math.max(18,teeth))];for(let k=0;k<teeth;k++){const a=k/teeth*Math.PI*2;geos.push(box(.006,.005,w*.96,[p[0],p[1]+Math.cos(a)*(r+.0022),p[2]+Math.sin(a)*(r+.0022)],[a,0,0]));}return geos;};
   /* the input shaft and its pair: the input gear on the main shaft's line, its mate on the lay shaft */
   const inputG=new T.Group();inputG.position.set(.07,GB.main[0],GB.main[1]);gearbox.add(inputG);
   batch(inputG,'chrome',[cyl(.016,.016,.10,[-.02,0,0],[0,0,Math.PI/2],14),...gear(GB.inPair[0],.024,20,[.03,0,0],[0,0,Math.PI/2])],'Input shaft and input gear');gearRotors.input=inputG;
   const layG=new T.Group();layG.position.set(.07,GB.lay[0],GB.lay[1]);gearbox.add(layG);
   const layGeos=[cyl(.014,.014,.44,[.20,0,0],[0,0,Math.PI/2],14),...gear(GB.inPair[1],.024,30,[.03,0,0],[0,0,Math.PI/2])];
   GB.x.forEach((x,i)=>layGeos.push(...gear(GB.rLay[i],.022,Math.round(GB.rLay[i]*500),[x-.07,0,0],[0,0,Math.PI/2])));
   batch(layG,'chrome',layGeos,'Lay shaft with its constant-mesh gears');gearRotors.lay=layG;
   /* the main shaft: it turns at the engaged gear's rate; the six gears on it freewheel until a dog ring locks one */
   const mainG=new T.Group();mainG.position.set(.30,GB.main[0],GB.main[1]);gearbox.add(mainG);
   batch(mainG,'chrome',[cyl(.015,.015,.40,[0,0,0],[0,0,Math.PI/2],14),cyl(.012,.012,.20,[.30,0,0],[0,0,Math.PI/2],12)],'Main shaft to the tail');gearRotors.output=mainG;
   GB.x.forEach((x,i)=>{const g=new T.Group();g.position.set(x,GB.main[0],GB.main[1]);gearbox.add(g);batch(g,'chrome',gear(GB.rMain[i],.022,Math.round(GB.rMain[i]*500),[0,0,0],[0,0,Math.PI/2]),(i+1)+(['st','nd','rd','th','th','th'][i])+' gear, freewheeling on the main shaft');gearRotors.mains.push(g);});
   /* three dog rings between the pairs, three forks above them on a rail, the selector drum beyond */
   [0,1,2].forEach(k=>{const x=(GB.x[2*k]+GB.x[2*k+1])/2;const d=new T.Group();d.position.set(x,GB.main[0],GB.main[1]);gearbox.add(d);
    batch(d,'steel',[cyl(.030,.030,.020,[0,0,0],[0,0,Math.PI/2],24),...Array.from({length:8},(_,j)=>{const a=j/8*Math.PI*2;return box(.010,.006,.004,[0,Math.cos(a)*.031,Math.sin(a)*.031],[a,0,0]);})],'Dog ring '+(k+1)+' ('+(2*k+1)+'–'+(2*k+2)+')');
    gearRotors.dogs.push({group:d,home:x});
    const f=new T.Group();f.position.set(x,GB.main[0]+.005,GB.main[1]+.10);gearbox.add(f);   /* on the rail on the open side of the main shaft, its arm reaching in to the dog ring */
    batch(f,'dark',[box(.012,.022,.024,[0,0,0]),box(.010,.006,.07,[0,0,-.04]),box(.010,.05,.006,[0,-.02,-.055]),box(.010,.05,.006,[0,-.02,-.095])],'Selector fork '+(k+1));
    gearRotors.forks.push({group:f,home:x});});
   batch(gearbox,'steel',[cyl(.006,.006,.34,[.27,GB.main[0]+.005,GB.main[1]+.10],[0,0,Math.PI/2],10)],'Fork rail');
   const drum=new T.Group();drum.position.set(.27,GB.main[0]+.05,GB.main[1]+.115);gearbox.add(drum);
   const drumGeos=[cyl(.022,.022,.34,[0,0,0],[0,0,Math.PI/2],20)];
   for(let k=0;k<3;k++){const x=(GB.x[2*k]+GB.x[2*k+1])/2-.27;for(let j=0;j<7;j++){const a=j/7*Math.PI*2;drumGeos.push(box(.014,.003,.006,[x+(j%2?.008:-.008)*(k%2?1:-1),Math.cos(a)*.0225,Math.sin(a)*.0225],[a,0,0]));}}
   batch(drum,'steel',drumGeos,'Selector drum with its three tracks');gearRotors.drum=drum;
   batch(gearbox,'dark',[cyl(.008,.008,.05,[.455,GB.main[0]+.05,GB.main[1]+.115],[0,0,Math.PI/2],10),box(.018,.09,.014,[.47,GB.main[0]+.095,GB.main[1]+.115])],'Drum ratchet and the shift arm up to the tower');}
  let gearNow=0;
  /* the box in a gear: the drum turns a notch, the fork and dog ring of that pair slide onto the gear (setGear) */
  function setGear(g){gearNow=Math.max(0,Math.min(6,g|0));gearRotors.drum.rotation.x=gearNow*Math.PI*2/7;
   gearRotors.dogs.forEach((d,k)=>{const dx=gearNow===2*k+1?-.02:gearNow===2*k+2?.02:0;d.group.position.x=d.home+dx;gearRotors.forks[k].group.position.x=gearRotors.forks[k].home+dx;});}
  const gearRateOf=g=>g?(GB.rLay[g-1]/GB.rMain[g-1])*(GB.inPair[0]/GB.inPair[1]):0;
  const FINAL_DRIVE=3.9;   /* the differential's illustrative ratio, crown wheel over pinion */
  /* the shafts downstream of the dogs are INTEGRATED, not proportioned: `out = angle × rate` jumped the main shaft,
     the prop and the axles to a new angle at every gear change. mainAngle grows by the crank's step times the
     engaged gear's rate, holds in neutral, and the prop shaft and the half shafts are read off it. */
  let mainAngle=0,prevCrank=null;

  const shaft = assembly('prop-shaft','Prop shaft & universal joints',[.91,.404,0],[0,.1,1.0]);
  const shaftMetal = [cyl(.044,.044,1.095,[0,0,0],[0,0,Math.PI/2],14)];
  for (const x of [-.55,.55]) {
    shaftMetal.push(cyl(.068,.068,.06,[x,0,0],[0,0,Math.PI/2],14));
    shaftMetal.push(cyl(.02,.02,.13,[x,0,0],undefined,10));
    shaftMetal.push(cyl(.02,.02,.13,[x,0,0],[Math.PI/2,0,0],10));
  }
  const shaftRotor=new T.Group();shaft.add(shaftRotor);
  batch(shaftRotor,'chrome',shaftMetal,'Drive shaft and U-joint crosses');

  const diff = assembly('rear-differential','Rear differential & CV axle shafts',[1.65,.404,0],[.30,.45,-.55]);
  /* v8.08 — the case is sectioned on its near-top quarter, like the gearbox, so the pinion, the crown wheel, the carrier, the
     spider gears and the side gears inside can be watched working (mech-driveline.js). Its fins stay on the closed lower half. */
  /* the open quarter is the front-top one, toward the V8 view's camera, and the near end is open; the nose is open on its near half */
  const diffMetal = [transformed(new T.CylinderGeometry(.173,.173,.37,28,1,true,Math.PI*1.5,Math.PI*1.5),[0,0,0],[Math.PI/2,0,0]),
    transformed(new T.CylinderGeometry(.173,.173,.012,28,1,false,Math.PI*1.5,Math.PI*1.5),[0,0,-.18],[Math.PI/2,0,0]),
    transformed(new T.CylinderGeometry(.090,.14,.22,16,1,true,Math.PI/2,Math.PI),[-.16,0,0],[0,0,Math.PI/2])];
  const boots = [];
  for(let i=0;i<4;i++){const y=-.10-i*.022;diffMetal.push(box(2*Math.sqrt(.173*.173-y*y)+.05,.012,.31,[0,y,0]));}
  for (const side of [-1,1]) {
    {const ax=cyl(.030,.030,.79,[0,0,side*.465],[Math.PI/2,0,0],12);ax.userData={axle:true,side};diffMetal.push(ax);}   /* from the side gear's hub out to the hub */
    for (const z of [.25,.81]) for(let j=0;j<5;j++) boots.push(torus(.054-Math.abs(j-2)*.004,.012,[0,0,side*(z+j*.022)],undefined));
  }
  /* the half shafts turn at the wheels' rate: their own rotor about the axle, read off the main shaft through the final drive —
     v8.08: one rotor each side, splined to its side gear, so a steered differential turns them at different speeds */
  const axleRotors=[1,-1].map(side=>{const r=new T.Group();r.userData.side=side;diff.add(r);return r;});
  batch(diff,'steel',diffMetal.filter(g=>!(g.userData&&g.userData.axle)),'Finned differential case (sectioned)');
  for(const r of axleRotors)batch(r,'steel',diffMetal.filter(g=>g.userData&&g.userData.axle&&g.userData.side===r.userData.side),(r.userData.side>0?'Left':'Right')+' half shaft to the hub');
  batch(diff,'rubber',boots,'Pleated inboard and outboard CV boots');
  boltBatch(diff,Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return[Math.sin(a)*.142,Math.cos(a)*.142,.195,Math.PI/2];}),.011);

  /* 81 mm lower than it was (60 mm in the car) — set when the cog's drive shaft ran back over the core to a
     distribution case; that drive is off the engine now (23 Sep 2026) and the core keeps the height. */
  const coolingY=.479;
  const cooling = assembly('cooling-system','Radiator, twin fans & coolant hoses',[-2.09,coolingY,0],[-.72,.2,0]);
  const core = [box(.08,.49,.93,[0,0,0]),box(.14,.55,.075,[0,0,-.495]),box(.14,.55,.075,[0,0,.495])];
  const coolingBright = [], hose = [], fanRotors=[];
  for(let i=0;i<23;i++) coolingBright.push(box(.012,.007,.905,[-.048,-.225+i*.02,0]));
  for (const z of [-.255,.255]) {
    coolingBright.push(torus(.173,.012,[.065,0,z],[0,Math.PI/2,0]));
    const fanId=z<0?'radiator-fan-left':'radiator-fan-right';
    const fanAssembly=assembly(fanId,z<0?'Left cooling fan':'Right cooling fan',[-2.09,coolingY,z],[-.85,.15,z]);
    const fanRotor=new T.Group();fanAssembly.add(fanRotor);
    const fans=[cyl(.054,.054,.045,[.084,0,0],[0,0,Math.PI/2],12)];
    for(let i=0;i<7;i++) {
      const a=i*Math.PI*2/7;
      fans.push(box(.017,.129,.045,[.083,Math.cos(a)*.104,Math.sin(a)*.104],[a,0,0]));
    }
    batch(fanRotor,'black',fans,'Seven-blade fan rotor');fanRotors.push({id:fanId,rotor:fanRotor});
  }
  hose.push(tube([[.04,.23,-.47],[.24,.28,-.46],[.44,.25,-.48],[.57,.27,-.36]],.037,18,10));
  hose.push(tube([[.04,-.21,.47],[.18,-.27,.50],[.46,-.27,.48],[.65,-.05,.28]],.036,18,10));
  coolingBright.push(cyl(.041,.041,.024,[.022,.295,-.48],undefined,12));
  batch(cooling,'dark',core,'Radiator core and end tanks');
  batch(cooling,'chrome',coolingBright,'Radiator fins, fan cages and pressure cap');
  batch(cooling,'rubber',hose,'Upper and lower coolant hoses');

  // Supporting tubular space frame. The front bay stays low and open so the
  // engine, belt drive, and exhaust remain the visual focus.
  const supportFrame = new T.Group();
  supportFrame.name = 'Tubular chassis and safety cage';
  root.add(supportFrame);
  const frameSteel = [];
  const frameOrange = [];
  const chassisBar = (target, a, b, radius = 0.027) => {
    target.push(tube([a, b], radius, 4, 6));
  };
  for (const side of [-1, 1]) {
    const z = side * 0.77;
    chassisBar(frameSteel, [-2.10, 0.29, z], [1.94, 0.29, z], 0.037);
    chassisBar(frameSteel, [-1.92, 0.30, z], [-0.25, 0.56, z], 0.028);
    chassisBar(frameSteel, [-0.25, 0.56, z], [1.38, 0.56, z], 0.030);
    chassisBar(frameSteel, [1.38, 0.56, z], [1.94, 0.29, z]);
    chassisBar(frameSteel, [-0.20, 0.29, z], [0.58, 0.56, z]);
    chassisBar(frameSteel, [0.58, 0.29, z], [1.38, 0.56, z]);
    // A-pillar, rear hoop, and roof edge describe the open cockpit.
    chassisBar(frameOrange, [-0.12, 0.56, z], [0.25, 1.43, side * 0.66], 0.034);
    chassisBar(frameOrange, [0.25, 1.43, side * 0.66], [1.14, 1.43, side * 0.66], 0.034);
    chassisBar(frameOrange, [1.14, 1.43, side * 0.66], [1.30, 0.32, z], 0.035);
    chassisBar(frameSteel, [1.14, 1.40, side * 0.66], [1.94, 0.34, z], 0.026);
  }
  for (const x of [-2.10, -0.22, 0.65, 1.36, 1.94]) {
    chassisBar(frameSteel, [x, 0.29, -0.77], [x, 0.29, 0.77], 0.030);
  }
  chassisBar(frameSteel, [-0.22, 0.29, -0.77], [1.36, 0.29, 0.77], 0.023);
  chassisBar(frameSteel, [-0.22, 0.29, 0.77], [1.36, 0.29, -0.77], 0.023);
  chassisBar(frameSteel, [1.21, 0.80, -0.74], [1.21, 0.80, 0.74], 0.030);
  chassisBar(frameOrange, [0.25, 1.43, -0.66], [0.25, 1.43, 0.66], 0.034);
  chassisBar(frameOrange, [1.14, 1.43, -0.66], [1.14, 1.43, 0.66], 0.034);
  batch(supportFrame, 'steel', frameSteel, 'Triangulated lower space frame');
  batch(supportFrame, 'orange', frameOrange, 'Orange rollover cage');

  const cockpit = assembly('cockpit', 'Seats, harnesses and controls', [0, 0, 0], [0.18, 1.72, 0]);
  const cockpitCarbon = [
    box(1.55, 0.025, 1.40, [0.56, 0.315, 0]),
    box(0.18, 0.22, 1.40, [-0.10, 0.76, 0]),
    box(0.79, 0.15, 0.18, [0.54, 0.40, 0]),
  ];
  const cockpitBlack = [];
  const cockpitOrange = [];
  const cockpitSteel = [];
  const cockpitWhite = [];
  for (const seatZ of [-0.39, 0.39]) {
    cockpitCarbon.push(
      box(0.63, 0.09, 0.55, [0.60, 0.42, seatZ]),
      box(0.12, 0.66, 0.52, [0.95, 0.77, seatZ], [0, 0, -0.15]),
      box(0.18, 0.24, 0.40, [1.01, 1.12, seatZ], [0, 0, -0.15]),
      box(0.58, 0.22, 0.07, [0.61, 0.55, seatZ - 0.26]),
      box(0.58, 0.22, 0.07, [0.61, 0.55, seatZ + 0.26]),
    );
    cockpitBlack.push(
      box(0.49, 0.055, 0.39, [0.57, 0.483, seatZ]),
      box(0.04, 0.50, 0.39, [0.867, 0.76, seatZ], [0, 0, -0.15]),
      box(0.04, 0.16, 0.28, [0.901, 1.12, seatZ], [0, 0, -0.15]),
    );
    for (const strapOffset of [-0.105, 0.105]) {
      cockpitOrange.push(
        box(0.025, 0.52, 0.055, [0.835, 0.78, seatZ + strapOffset], [0, 0, -0.15]),
        box(0.30, 0.024, 0.055, [0.72, 0.525, seatZ + strapOffset]),
      );
    }
    cockpitOrange.push(box(0.035, 0.065, 0.38, [0.55, 0.523, seatZ]));
    cockpitSteel.push(box(0.055, 0.035, 0.075, [0.55, 0.55, seatZ]));
    // Twin harness slots reinforce the bucket-seat silhouette.
    cockpitBlack.push(
      box(0.025, 0.045, 0.10, [0.91, 1.035, seatZ - 0.115]),
      box(0.025, 0.045, 0.10, [0.91, 1.035, seatZ + 0.115]),
    );
  }
  /* v5.79 — the plain wheel that was here is gone: the Coates Way cog IS the steering wheel now, on the column
     at this same place (engine-kinematics.js COG_CAR.fitted is this point in world metres), tilted up 22°.
     The column boss on the dash stays, angled up to meet it. */
  cockpitSteel.push(cyl(0.037, 0.037, 0.16, [0.02, 0.84, -0.39], [0, 0, Math.PI / 2 - 0.384], 10));
  cockpitBlack.push(box(0.014, 0.115, 0.22, [0.0, 0.78, -0.38]));
  cockpitWhite.push(box(0.006, 0.052, 0.132, [0.010, 0.793, -0.38]));   /* this rig cockpit is replaced by the original GC500 cabin in car-fit.js, which adds the dash display and the firewall */
  cockpitSteel.push(cyl(0.014, 0.020, 0.19, [0.35, 0.56, 0], [0, 0, -0.13], 8));
  cockpitBlack.push(cyl(0.038, 0.030, 0.050, [0.363, 0.672, 0], [0, 0, -0.13], 10));
  batch(cockpit, 'carbon', cockpitCarbon, 'Bucket seat shells, floor and dashboard');
  batch(cockpit, 'black', cockpitBlack, 'Seat pads and steering wheel');
  batch(cockpit, 'orange', cockpitOrange, 'Four-point orange safety harnesses');
  batch(cockpit, 'steel', cockpitSteel, 'Steering spokes, buckles and gear lever');
  batch(cockpit, 'white', cockpitWhite, 'Digital instrument face');

  for (const [suspensionId, suspensionName, axleX, pullZ] of [
    ['front-suspension', 'Front double-wishbone suspension', -1.60, -1.70],
    ['rear-suspension', 'Rear double-wishbone suspension', 1.65, 1.70],
  ]) {
    const suspension = assembly(suspensionId, suspensionName, [0, 0, 0], [0, 0.36, pullZ]);
    const suspensionSteel = [];
    const suspensionOrange = [];
    const suspensionDark = [];
    for (const side of [-1, 1]) {
      const innerZ = side * 0.60;
      const outerZ = side * 0.94;
      for (const [innerY, outerY, radius] of [[0.34, 0.35, 0.024], [0.65, 0.56, 0.021]]) {
        for (const offset of [-0.29, 0.29]) {
          chassisBar(suspensionSteel, [axleX + offset, innerY, innerZ], [axleX, outerY, outerZ], radius);
        }
      }
      // Upright and inboard spring/damper, with separate bump-stop collars.
      chassisBar(suspensionSteel, [axleX, 0.33, outerZ], [axleX, 0.60, outerZ], 0.034);
      const springX = axleX - 0.075;
      const springZ = side * 0.715;
      suspensionSteel.push(cyl(0.022, 0.022, 0.48, [springX, 0.62, springZ], undefined, 10));
      suspensionDark.push(
        cyl(0.046, 0.046, 0.25, [springX, 0.53, springZ], undefined, 12),
        cyl(0.091, 0.091, 0.028, [springX, 0.433, springZ], undefined, 12),
        cyl(0.091, 0.091, 0.028, [springX, 0.81, springZ], undefined, 12),
      );
      const coilPoints = [];
      for (let coilStep = 0; coilStep <= 104; coilStep++) {
        const t = coilStep / 104;
        const a = t * Math.PI * 2 * 6.5;
        coilPoints.push([springX + Math.cos(a) * 0.070, 0.45 + t * 0.345, springZ + Math.sin(a) * 0.070]);
      }
      suspensionOrange.push(tube(coilPoints, 0.012, 156, 6));
      chassisBar(suspensionSteel, [springX, 0.84, springZ], [axleX + 0.17, 0.61, side * 0.61], 0.024);
      for (const offset of [-0.29, 0.29]) {
        suspensionDark.push(box(0.085, 0.080, 0.060, [axleX + offset, 0.35, innerZ]));
      }
    }
    batch(suspension, 'steel', suspensionSteel, suspensionName + ' arms and dampers');
    batch(suspension, 'orange', suspensionOrange, suspensionName + ' coil springs');
    batch(suspension, 'dark', suspensionDark, suspensionName + ' mounts and shock bodies');
  }


  /* THE STEERING RACK (v5.79). Andrew Fisher, 23 Sep 2026: the Coates Way sets our direction — and turning
     the wheel steers. The cog's telescoping shaft runs down the column's line to a rack-and-pinion behind the
     front axle; the rack bar slides across the car as the wheel turns (setRack), its tie rods follow it to the
     uprights' steering arms, and the front wheels turn on their kingpins (car-app.js updateTransforms). Built at
     the true front axle (car-fit.js shifts the suspension to −1.482, not this) in rig units. */
  let rackBar=null,rackTravel=0,steerYaw=0;const tieRods=[],knuckles=[];
  const STEER_ROAD=18*Math.PI/180,RACK_MAX=.074,ARM=RACK_MAX/Math.sin(STEER_ROAD);
  const KINGPIN={x:(CAR_AXLES.front-ENGINE_FIT.x)/ENGINE_FIT.scale,y:.45,z:.94};   /* the front axle line (car-fit.js moves the wishbones there) at the upright */
  {
    const rack = assembly('steering-rack', 'Rack and pinion steering', [0, 0, 0], [0, 0.34, -0.6]);
    const rackSteel = [], rackDark = [];
    /* behind the axle and low, its pinion outboard of the exhaust on the driver's side — the one line from the
       wheel's coupling that clears the heads, the valve covers and the primaries (measured; STEER_PINION) */
    rackBar=new T.Mesh(cyl(0.024, 0.024, 1.66, [-0.95, 0.50, 0], [Math.PI / 2, 0, 0], 12),mats.steel);rackBar.name='Rack bar';rackBar.castShadow=rackBar.receiveShadow=true;rack.add(rackBar);   /* the rack bar, across the car — its own mesh, so it can slide */
    rackDark.push(cyl(0.048, 0.048, 0.70, [-0.95, 0.50, 0], [Math.PI / 2, 0, 0], 14));            /* its housing */
    rackDark.push(box(0.12, 0.13, 0.14, [-0.95, 0.52, -0.80]));                                    /* the pinion housing, driver's side */
    rackDark.push(cyl(0.034, 0.034, 0.22, [-0.92, 0.66, -0.83], [0, 0, -0.2], 12));                /* the pinion's upper bearing housing, up to the shaft's joint */
    rackSteel.push(cyl(0.018, 0.018, 0.10, [-0.905, 0.735, -0.845], [0, 0, -0.2], 10));           /* the pinion's input stub */
    for (const z of [-0.80, 0.80]) rackDark.push(cyl(0.040, 0.040, 0.05, [-0.95, 0.50, z], [Math.PI / 2, 0, 0], 12)); /* the rack's end bosses */
    for (const [id, name, side] of [['steering-tie-rod-left', 'Left steering tie rod', 1], ['steering-tie-rod-right', 'Right steering tie rod', -1]]) {
      const rod = assembly(id, name, [0, 0, 0], [0, 0.30, side * 0.55]);
      const rodDark = [];
      /* the rod itself is laid out every frame between the rack's end and the upright's arm (layTieRods) */
      const bar=new T.Mesh(new T.CylinderGeometry(0.014,0.014,1,8).rotateZ(Math.PI/2).translate(.5,0,0),mats.steel);bar.name=name;bar.castShadow=bar.receiveShadow=true;rod.add(bar);
      const end=new T.Mesh(cyl(0.026, 0.026, 0.05, [0, 0, 0], [Math.PI / 2, 0, 0], 10),mats.dark);end.name=name+' end';end.castShadow=true;rod.add(end);   /* the track-rod end on the upright's arm */
      tieRods.push({side,bar,end,inner:new T.Vector3(-0.95,0.50,side*0.82),outer:new T.Vector3(-1.36,0.45,side*0.92)});
    }
    /* v8.08 — THE STEERING KNUCKLES. The tie rods used to end in mid-air beside a fixed upright while the wheels turned on their
       own. Now each front upright turns on its kingpin, carrying a steering arm that trails back to the tie rod's outer ball
       joint: the rack pushes the rod, the rod swings the arm, the arm turns the upright — and the upright's turn is the wheel's,
       18° at full lock (car-app.js STEER_ROAD). The arm's length is what makes those agree: the rack's 55 mm of travel each way
       (0.074 rig units) is the arm's swing, so arm × sin 18° = 0.074. With a rack behind the axle and trailing arms, a right
       turn moves the rack to the left (+z) — the rack's direction is corrected to match (it used to go the other way). */
    for(const side of [1,-1]){
      const id='steering-knuckle-'+(side>0?'left':'right');
      const k=assembly(id,(side>0?'Left':'Right')+' front upright & steering arm',[KINGPIN.x,KINGPIN.y,side*KINGPIN.z],[-.15,.30,side*.95]);
      const turn=new T.Group();k.add(turn);
      const kDark=[box(.07,.30,.05,[0,0,0]),cyl(.03,.03,.06,[0,.17,0],undefined,10),cyl(.03,.03,.06,[0,-.17,0],undefined,10)];
      const kSteel=[box(ARM,.022,.03,[ARM/2,-.02,0]),cyl(.016,.016,.03,[ARM,-.02,0],undefined,10),cyl(.045,.045,.07,[0,0,side*.05],[Math.PI/2,0,0],16)];
      batch(turn,'dark',kDark,'Upright and kingpin bosses');batch(turn,'steel',kSteel,'Steering arm, ball-joint eye and stub axle');
      knuckles.push({id,side,turn});
    }
    batch(rack, 'steel', rackSteel, 'Pinion');
    batch(rack, 'dark', rackDark, 'Rack housing and pinion housing');
  }
  const tieDir=new T.Vector3(),tieX=new T.Vector3(1,0,0);
  /* t: the wheel's turn, −1…1 (full left to full right). The rack's travel is ±55 mm at full lock (rig units
     ×.74 in the car); a right turn pulls the bar toward the driver's side (−z) and the arms swing the uprights */
  /* the outer joint is wherever the knuckle's arm has put it: the kingpin plus the arm, turned by the upright's yaw */
  function layTieRods(){for(const r of tieRods){const inner=r.inner.clone();inner.z+=rackTravel;const outer=new T.Vector3(KINGPIN.x+ARM*Math.cos(steerYaw),KINGPIN.y-.02,r.side*KINGPIN.z-ARM*Math.sin(steerYaw));r.outer.copy(outer);
    tieDir.subVectors(outer,inner);const L=tieDir.length();r.bar.position.copy(inner);r.bar.scale.set(L,1,1);r.bar.quaternion.setFromUnitVectors(tieX,tieDir.normalize());r.end.position.copy(outer);}
    for(const k of knuckles)k.turn.rotation.y=steerYaw;}
  /* t: the wheel's turn, −1…1. The rack slides 0.074 rig units (55 mm in the car) at full lock; the uprights turn by the angle
     whose arm swing is that travel — the same 18° the wheels are given (car-app.js roadYaw = −t × 18°) */
  function setRack(t){const c=Math.max(-1,Math.min(1,t||0));rackTravel=c*RACK_MAX;steerYaw=-Math.asin(c*RACK_MAX/ARM);if(rackBar)rackBar.position.z=rackTravel;layTieRods();if(brakes)brakes.setSteer(c);if(driveline)driveline.setSteer(c);}
  let brakes=null,driveline=null;
  setRack(0);
  let fanForce=false,fanSpin=0;function setFans(on){fanForce=!!on;}
  const timing=buildTimingDrive(T,mats,assembly,mesh);
  const frontDrive=buildFrontDrive(T,mats,assembly,mesh,batch);
  const accessories=buildAccessories(T,mats,assembly,mesh,batch,{cyl,box,tube,transformed});
  const systems=buildSystems(T,mats,assembly,mesh,batch,{cyl,box,tube,transformed});
  /* v8.08 — the mechanisms added for Andrew Fisher's 2 Oct 2026 brief: the clutch and the opened differential (mech-driveline.js),
     the brakes from the balance bar to the pads and the discs' heat (mech-brakes.js), the oil in the block's drillings (mech-oil.js) */
  driveline=buildDriveline(T,mats,assembly,mesh,batch,{cyl,box,tube,transformed});
  brakes=buildBrakes(T,mats,assembly,mesh,batch,{cyl,box,tube,transformed});
  const oil=buildOilGalleries(T,mats,assembly,mesh,batch,{cyl,box,tube,transformed});
  setRack(0);
  let lastStepDt=1/60,inputAngle=0;
  function setStarter(active,dt=1/60){lastStepDt=Math.max(0,Math.min(.1,dt||0));driveline.setClutch(active);systems.setStarter(active,dt);}

  // A scalar crank angle drives each actual piston and conrod. The callback is
  // consulted per removable assembly, so detached parts freeze in their pose.
  const animDirection = new T.Vector3();
  const alwaysConnected = () => true;
  let crankNow=0;
  function animate(angle,connectedFn) {
    const connected = connectedFn || alwaysConnected;crankNow=angle;
    if (connected('crankshaft')) rotor.rotation.x = angle;
    for (const item of camRotors) if (connected(item.id)) item.rotor.rotation.x = angle*.5;
    /* the fans follow the running V8, or the FAN switch on the cockpit panel, which runs them with the V8 off */
    if(fanForce)fanSpin+=.45;for(const item of fanRotors)if(connected(item.id))item.rotor.rotation.x=fanForce?fanSpin+angle*1.4:angle*1.4;
    /* the crank's step this call; the main shaft integrates it at the engaged gear's rate and holds in neutral */
    /* v8.08 — the gearbox's input is the clutch disc, not the crank: held in while the V8 is started, it stands still */
    inputAngle=driveline.clutchStep(angle,lastStepDt,connected);
    const dCrank=prevCrank===null?0:inputAngle-prevCrank;prevCrank=inputAngle;if(gearNow&&connected('gearbox')&&connected('clutch'))mainAngle+=dCrank*gearRateOf(gearNow);
    if(connected('prop-shaft'))shaftRotor.rotation.x=mainAngle;
    const shafts=driveline.animate(mainAngle,connected);
    if(connected('rear-differential')){axleRotors[0].rotation.z=shafts.left;axleRotors[1].rotation.z=shafts.right;}
    /* the gear train (v5.80): the input at crank speed, the lay shaft through the input pair, each main-shaft gear at its own rate, the main shaft at the engaged gear's */
    if(connected('gearbox')){gearRotors.input.rotation.x=inputAngle;const lay=-inputAngle*GB.inPair[0]/GB.inPair[1];gearRotors.lay.rotation.x=lay;
     gearRotors.mains.forEach((g,i)=>{g.rotation.x=-lay*GB.rLay[i]/GB.rMain[i];});
     const out=mainAngle;gearRotors.output.rotation.x=out;gearRotors.dogs.forEach(d=>{d.group.rotation.x=out;});}
    timing.animate(angle,connected);
    frontDrive.animate(angle,connected);
    accessories.animate(angle,connected);
    systems.animate(angle,connected);
    oil.animate(angle,connected);
    brakes.animate(root,connected);
    for(const item of valveMotions){
      const lift=valveLift(angle,item.n,item.kind,item.side,item.phase);
      if(connected(item.id))item.movingValve.position.set(0,-lift*bankCos,-item.side*lift*bankCos);
      if(connected(item.springId))item.spring.scale.y=(.068-lift)/.068;
      if(connected(item.followerId))item.follower.position.y=.537-lift;
    }
    for (const item of pistonMotions) {
      const a = angle+item.phase;
      const py = crankRadius*Math.cos(a), pz = crankRadius*Math.sin(a);
      const projection = (py+item.side*pz)*bankCos;
      const distance = projection+Math.sqrt(rodLength*rodLength-crankRadius*crankRadius+projection*projection);
      const topY = distance*bankCos, topZ = item.side*distance*bankCos;
      if(connected(item.id))item.piston.position.set(0,topY,topZ);
      if(connected(item.rodId)){item.rod.position.set(0,py,pz);
      animDirection.set(0,topY-py,topZ-pz).normalize();
      item.rod.quaternion.setFromUnitVectors(UP,animDirection);}
    }
  }
  animate(0);
  /* v8.08 — what the mechanisms are doing, for the tests (evidence/mech_tests.js reads it off the scene) and nothing else */
  root.userData.mech={driveline,brakes,oil,timing,knuckles,axleRotors,get crank(){return crankNow;},get input(){return inputAngle;},get main(){return mainAngle;},get steerYaw(){return steerYaw;},get rackTravel(){return rackTravel;},get gear(){return gearNow;},tieRods};
  root.updateMatrixWorld(true);
  root.traverse(obj => {
    if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; }
  });
  const bounds = new T.Box3().setFromObject(root);
  boxBase.dispose();
  return {root,removable,animate,setThrottle:accessories.setThrottle,setStarter,setBrake:brakes.setBrake,setRack,driveline,brakes,oil,knuckles,get steerYaw(){return steerYaw;},get inputAngle(){return inputAngle;},axleRotors,setFans,setGear,gearRateOf,finalDrive:FINAL_DRIVE,get mainAngle(){return mainAngle;},gearbox,get rackTravel(){return rackTravel;},tieRods,bounds,valveMotions,pistonMotions,camRotors,timing,frontDrive,accessories,systems};
}
