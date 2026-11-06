/* Author: Andrew Fisher. Lightweight illustrative equipment models, GC500 v10.27.
 * Geometry is visual guidance, not measured CAD. Positions, quantities and status
 * come from the application. This module reads no records and performs no writes.
 * Input dimensions are per unit, in metres. The footprint is centred at 0,0 and
 * the bottom is z=0. Local x=width, y=length, z=up; the GLB uses glTF Y-up.
 */
(function (root) {
  'use strict';

  var VERSION = '10.27';
  var MATERIALS = [
    ['Warm white cladding', [0.84, 0.86, 0.84, 1], 0.12, 0.72],
    ['Roof and light trim', [0.93, 0.94, 0.9, 1], 0.18, 0.52],
    ['Brushed structural metal', [0.31, 0.38, 0.4, 1], 0.68, 0.4],
    ['Dark chassis and seals', [0.055, 0.075, 0.082, 1], 0.12, 0.76],
    ['Blue grey glazing', [0.19, 0.34, 0.41, 1], 0.3, 0.23],
    ['Orange canopy and labels', [1, 0.285, 0.025, 1], 0.12, 0.58],
    ['Deep teal cubicle', [0.055, 0.29, 0.29, 1], 0, 0.72],
    ['Teal door inset', [0.09, 0.39, 0.38, 1], 0, 0.65],
    ['Cool shadow trim', [0.4, 0.47, 0.47, 1], 0.32, 0.65],
    ['Inset control display', [0.12, 0.22, 0.24, 1], 0, 0.4],
    ['Stainless sanitary panels', [0.66, 0.73, 0.76, 1], 0.85, 0.3],
    ['Accessible identification blue', [0.06, 0.25, 0.58, 1], 0, 0.65]
  ];

  function finitePositive(value, fallback, min, max) {
    var n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.max(min, Math.min(max, n)) : fallback;
  }

  function Builder() {
    this.parts = MATERIALS.map(function () { return { p: [], n: [], i: [] }; });
    this.min = [Infinity, Infinity, Infinity];
    this.max = [-Infinity, -Infinity, -Infinity];
    this.transform = null;
    this.activeBounds = null;
  }

  Builder.prototype.vertex = function (part, p, normal) {
    if(this.transform){
      var t=this.transform,px=p[0],py=p[1],nx=normal[0],ny=normal[1];
      p=[px*t.cos-py*t.sin+t.offset[0],px*t.sin+py*t.cos+t.offset[1],p[2]+t.offset[2]];
      normal=[nx*t.cos-ny*t.sin,nx*t.sin+ny*t.cos,normal[2]];
    }
    // glTF's default up axis is Y. Cesium's Y-up -> Z-up correction restores ENU.
    var id = part.p.length / 3;
    part.p.push(p[0], p[2], -p[1]);
    part.n.push(normal[0], normal[2], -normal[1]);
    for (var k = 0; k < 3; k++) {
      this.min[k] = Math.min(this.min[k], p[k]);
      this.max[k] = Math.max(this.max[k], p[k]);
      if(this.activeBounds){
        this.activeBounds.min[k]=Math.min(this.activeBounds.min[k],p[k]);
        this.activeBounds.max[k]=Math.max(this.activeBounds.max[k],p[k]);
      }
    }
    return id;
  };

  Builder.prototype.face = function (points, material, normal) {
    var part = this.parts[material], b = part.p.length / 3;
    if (!normal) {
      var a = points[0], u = points[1], v = points[2];
      var ux = u[0] - a[0], uy = u[1] - a[1], uz = u[2] - a[2];
      var vx = v[0] - a[0], vy = v[1] - a[1], vz = v[2] - a[2];
      var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      var len = Math.hypot(nx, ny, nz) || 1;
      normal = [nx / len, ny / len, nz / len];
    }
    for (var j = 0; j < points.length; j++) this.vertex(part, points[j], normal);
    for (var i = 1; i < points.length - 1; i++) part.i.push(b, b + i, b + i + 1);
  };

  Builder.prototype.box = function (x, y, z, w, l, h, material) {
    var a = x - w / 2, b = x + w / 2, c = y - l / 2, d = y + l / 2, e = z, f = z + h;
    this.face([[a,c,e],[a,d,e],[b,d,e],[b,c,e]], material, [0,0,-1]);
    this.face([[a,c,f],[b,c,f],[b,d,f],[a,d,f]], material, [0,0,1]);
    this.face([[a,c,e],[b,c,e],[b,c,f],[a,c,f]], material, [0,-1,0]);
    this.face([[b,d,e],[a,d,e],[a,d,f],[b,d,f]], material, [0,1,0]);
    this.face([[a,d,e],[a,c,e],[a,c,f],[a,d,f]], material, [-1,0,0]);
    this.face([[b,c,e],[b,d,e],[b,d,f],[b,c,f]], material, [1,0,0]);
  };

  Builder.prototype.roundedPrism = function (x, y, z, w, l, h, radius, material, taper) {
    var r = Math.min(radius, w * .45, l * .45), ring = [], upper = [], scale = taper || 1;
    var centres = [[w/2-r,l/2-r,0],[-w/2+r,l/2-r,90],[-w/2+r,-l/2+r,180],[w/2-r,-l/2+r,270]];
    centres.forEach(function (c) {
      for (var i = 0; i <= 3; i++) {
        var angle = (c[2] + i * 30) * Math.PI / 180;
        var px = c[0] + r * Math.cos(angle), py = c[1] + r * Math.sin(angle);
        ring.push([x + px, y + py, z]);
        upper.push([x + px * scale, y + py * scale, z + h]);
      }
    });
    this.face(ring.slice().reverse(), material, [0,0,-1]);
    this.face(upper, material, [0,0,1]);
    for (var j = 0; j < ring.length; j++) {
      var next = (j + 1) % ring.length;
      this.face([ring[j], ring[next], upper[next], upper[j]], material);
    }
  };

  Builder.prototype.cylinder = function (x, y, z, radius, height, material, segments) {
    var bottom = [], top = [], count = segments || 10;
    for (var i = 0; i < count; i++) {
      var a = i * Math.PI * 2 / count;
      bottom.push([x + radius * Math.cos(a), y + radius * Math.sin(a), z]);
      top.push([x + radius * Math.cos(a), y + radius * Math.sin(a), z + height]);
    }
    this.face(bottom.slice().reverse(), material, [0,0,-1]);
    this.face(top, material, [0,0,1]);
    for (var j = 0; j < count; j++) this.face([bottom[j], bottom[(j+1)%count], top[(j+1)%count], top[j]], material);
  };

  Builder.prototype.axleCylinder = function (x, y, z, radius, width, material) {
    var left=[],right=[],count=12;
    for(var i=0;i<count;i++) {
      var a=i*Math.PI*2/count;
      left.push([x-width/2,y+radius*Math.cos(a),z+radius*Math.sin(a)]);
      right.push([x+width/2,y+radius*Math.cos(a),z+radius*Math.sin(a)]);
    }
    this.face(left.slice().reverse(),material,[-1,0,0]);
    this.face(right,material,[1,0,0]);
    for(var j=0;j<count;j++)this.face([left[j],left[(j+1)%count],right[(j+1)%count],right[j]],material);
  };

  function withPlacement(g,x,y,z,angle,run){
    var previous=g.transform,co=Math.cos(angle),si=Math.sin(angle),offset=[x,y,z];
    if(previous){
      offset=[x*previous.cos-y*previous.sin+previous.offset[0],x*previous.sin+y*previous.cos+previous.offset[1],z+previous.offset[2]];
      var nextCo=previous.cos*co-previous.sin*si;
      si=previous.sin*co+previous.cos*si;co=nextCo;
    }
    g.transform={offset:offset,cos:co,sin:si};
    try{run();}finally{g.transform=previous;}
  }

  function confirmedDoors(g,x,w,l,h,floor,options,style){
    if(!options||!options.doorConfirmed)return;
    var doors=(options.doors||[]).slice();
    if(!doors.length){
      var side=options.doorSide,length=side==='left'||side==='right'?l:w;
      var count=Math.max(1,Math.min(4,options.doorCount||1));
      var width=Math.min(style==='accessible'?1.25:1.05,length*.78/count);
      for(var i=0;i<count;i++)doors.push({side:side,width:width,offset:(i-(count-1)/2)*Math.min(length/count,width*1.65),open:options.doorOpen});
    }
    var material=style==='toilet'||style==='accessible'?7:style==='container'?0:1;
    doors.forEach(function(door){
      var side=door.side,length=side==='left'||side==='right'?l:w;
      var width=Math.min(door.width||1.05,length*.9),height=(h-floor)*.79;
      var along=Math.max(-length/2+width/2,Math.min(length/2-width/2,door.offset||0));
      var px=side==='left'?x-w/2:side==='right'?x+w/2:x;
      var py=side==='front'?-l/2:side==='back'?l/2:0;
      var yaw=side==='front'?0:side==='back'?Math.PI:side==='left'?-Math.PI/2:Math.PI/2;
      withPlacement(g,px,py,0,yaw,function(){
        // Dark recess, light jambs and a low threshold make the actual side clear.
        g.box(along,-.012,floor,width,.035,height,3);
        g.box(along-width/2-.018,-.034,floor,.04,.065,height+.045,2);
        g.box(along+width/2+.018,-.034,floor,.04,.065,height+.045,2);
        g.box(along,-.034,floor+height,width+.08,.065,.04,2);
        g.box(along,-.075,Math.max(0,floor-.025),width+.09,.18,.025,2);
        var opening=door.open?-Math.PI/2:0;
        withPlacement(g,along-width/2,-.04,floor,opening,function(){
          g.box(width/2,0,0,width,.035,height,material);
          if(door.open)g.box(width-.012,0,0,.03,.05,height,5);
          g.box(width*.88,-.031,height*.49,.028,.035,height*.09,2);
          if(style==='container'){
            [width*.2,width*.7].forEach(function(dx){g.cylinder(dx,-.04,.03,.014,height-.06,2,8);});
          }else if(style==='accessible'){
            g.box(width*.5,-.021,height*.69,width*.24,.01,width*.24,11);
          }
        });
      });
    });
  }

  function building(g, x, w, l, h, options, ablution) {
    var floor = h * .085, roof = h * .046, bodyH = h - floor - roof;
    var post = Math.min(w * .026, .075), panel = Math.min(w * .008, .025);
    // Bearers and skids are inside the supplied footprint; no fabricated stairs.
    g.box(x-w*.34, 0, 0, w*.055, l*.94, floor*.55, 3);
    g.box(x+w*.34, 0, 0, w*.055, l*.94, floor*.55, 3);
    g.box(x, 0, floor*.55, w*.985, l*.985, floor*.45, 2);
    g.box(x, 0, floor, w*.976, l*.986, bodyH, 0);
    [-1,1].forEach(function (sx) {
      [-1,1].forEach(function (sy) { g.box(x+sx*(w/2-post/2), sy*(l/2-post/2), floor, post, post, bodyH, 1); });
      var seams = Math.max(4, Math.min(64, Math.floor(l/.25)));
      for (var i = 1; i < seams; i++) {
        var cy = -l/2+l*i/seams;
        g.box(x+sx*(w*.489), cy, floor+.012, panel, panel, bodyH-.024, 8);
      }
    });
    // Slightly raised metal roof with four-edge flashing and low standing seams.
    g.box(x, 0, h-roof, w, l, roof*.62, 1);
    [-1,1].forEach(function (sign) {
      g.box(x+sign*(w/2-post/2), 0, h-roof*.45, post, l, roof*.45, 2);
      g.box(x, sign*(l/2-post/2), h-roof*.45, w, post, roof*.45, 2);
    });
    var ribs = Math.max(3, Math.min(14, Math.round(w/.28)));
    for (var r = 1; r < ribs; r++) g.box(x-w/2+w*r/ribs, 0, h-roof*.38, panel*.75, l*.98, roof*.2, 8);
    // Windows remain illustrative. A door is only drawn on a sourced door side.
    var windowCount = Math.max(1, Math.min(4, Math.floor(l/2.6)));
    for (var n = 0; n < windowCount; n++) {
      var wy = l*(n+.5)/windowCount-l/2, wl = Math.min(l/windowCount*.56,1.45), wh = bodyH*.32, wz = floor+bodyH*.4;
      if(ablution){wh=bodyH*.12;wz=floor+bodyH*.79;wl*=.63;}
      [-1,1].forEach(function (side) {
        g.box(x+side*(w/2-.005), wy, wz, .035, wl+.075, wh+.075, 3);
        g.box(x+side*(w/2+.011), wy, wz+.038, .014, wl, wh, 4);
        g.box(x+side*(w/2+.022), wy, wz+.03, .016, .026, wh+.016, 1);
        g.box(x+side*(w/2+.012), wy, wz+.018, .055, wl+.08, .025, 1);
      });
    }
    // No generic end-door remains to contradict the confirmed wall.
    confirmedDoors(g,x,w,l,h,floor,options,ablution?'block':'building');
    if(ablution){
      [-1,1].forEach(function(sign){g.box(x+sign*w*.26,l*.32,h-roof*.33,w*.06,l*.08,roof*.33,3);});
    }
  }

  function toilet(g, x, w, l, h, options, accessible) {
    var base = h*(accessible ? .012 : .045), canopy = h*.095, bodyH = h-base-canopy, r = Math.min(w,l)*.07;
    g.roundedPrism(x,0,0,w*.98,l*.98,base,r,3);
    g.roundedPrism(x,0,base,w*.94,l*.94,bodyH,r,6,.98);
    // The pale rounded roof is immediately recognisable from an aerial angle.
    g.roundedPrism(x,0,h-canopy,w,l,canopy*.38,r*1.3,1);
    g.roundedPrism(x,0,h-canopy*.62,w,l,canopy*.62,r*1.3,1,.82);
    var front=-l*.474;
    // Vent slots sit above the door; side moulding gives depth without textures.
    for (var i=0;i<5;i++) g.box(x+w*(i-2)*.095,front-l*.02,base+bodyH*.948,w*.06,l*.02,h*.016,3);
    [-1,1].forEach(function (side) {
      for (var j=0;j<3;j++) g.box(x+side*w*.468,l*(j-1)*.22,base+bodyH*.09,w*.023,l*.043,bodyH*.72,7);
    });
    // Roof vent stays within the total provided height.
    g.cylinder(x+w*.27,l*.25,h-canopy*.24,w*.04,canopy*.21,3,8);
    confirmedDoors(g,x,w,l,h-canopy,base,options,accessible?'accessible':'toilet');
    if(accessible&&(!options||!options.doorConfirmed)){
      var sy=front-l*.049,sz=base+bodyH*.64,mark=w*.18;
      g.box(x,sy,sz,mark,l*.016,mark,11);
      // A small geometric access symbol is illustrative, not an asset label.
      var yy=sy-l*.0082,cx=x-mark*.06,cz=sz+mark*.35,rr=mark*.22;
      for(var n=0;n<12;n++){
        var a=n*Math.PI/6,b=(n+1)*Math.PI/6;
        g.face([[cx+rr*Math.cos(a),yy,cz+rr*Math.sin(a)],
          [cx+rr*Math.cos(b),yy,cz+rr*Math.sin(b)],
          [cx+rr*.69*Math.cos(b),yy,cz+rr*.69*Math.sin(b)],
          [cx+rr*.69*Math.cos(a),yy,cz+rr*.69*Math.sin(a)]],1);
      }
      g.box(x-mark*.06,yy,sz+mark*.52,mark*.09,l*.001,mark*.2,1);
      g.box(x+mark*.07,yy,sz+mark*.44,mark*.27,l*.001,mark*.07,1);
      g.box(x+mark*.18,yy,sz+mark*.28,mark*.07,l*.001,mark*.21,1);
      g.box(x-mark*.06,yy,sz+mark*.78,mark*.12,l*.001,mark*.12,1);
    }
  }

  function toiletBlock(g,x,w,l,h,options){building(g,x,w,l,h,options,true);}
  function accessibleToilet(g,x,w,l,h,options){toilet(g,x,w,l,h,options,true);}

  function peePanel(g,x,w,l,h){
    var thickness=Math.min(w,l)*.018,base=h*.045;
    g.roundedPrism(x,0,0,w*.94,l*.94,base,Math.min(w,l)*.1,3);
    // Four open stations divided by a stainless cross; never a closed cubicle.
    g.box(x,0,base,w*.96,thickness,h-base,10);
    g.box(x,0,base,thickness,l*.96,h-base,10);
    g.box(x,0,base,thickness*2.5,thickness*2.5,h-base,2);
    [-1,1].forEach(function(sx){[-1,1].forEach(function(sy){
      var bx=x+sx*w*.22,by=sy*l*.22;
      g.roundedPrism(bx,by,h*.27,w*.28,l*.28,h*.2,Math.min(w,l)*.055,10,.83);
      g.roundedPrism(bx,by,h*.464,w*.21,l*.21,h*.012,Math.min(w,l)*.04,3);
      g.cylinder(bx,by,h*.47,Math.min(w,l)*.025,h*.007,2,8);
    });});
    g.box(x,0,h-thickness,w*.97,thickness*1.6,thickness,2);
    g.box(x,0,h-thickness,thickness*1.6,l*.97,thickness,2);
  }

  function generator(g, x, w, l, h) {
    var base=h*.18, roof=h*.045, bodyH=h-base-roof, front=-l*.49;
    g.box(x-w*.34,0,0,w*.085,l*.94,base*.45,3);
    g.box(x+w*.34,0,0,w*.085,l*.94,base*.45,3);
    g.roundedPrism(x,0,base*.35,w*.97,l*.98,base*.65,w*.026,3);
    g.roundedPrism(x,0,base,w*.94,l*.96,bodyH,w*.025,5);
    g.roundedPrism(x,0,h-roof,w*.975,l*.985,roof,w*.03,5,.97);
    // Large end radiator grille: separate recessed dark panel and metal louvres.
    g.box(x,front,base+bodyH*.11,w*.79,l*.021,bodyH*.76,3);
    for(var i=0;i<10;i++) g.box(x,front-l*.012,base+bodyH*(.15+i*.067),w*.73,l*.015,bodyH*.024,2);
    [-1,1].forEach(function (side) {
      var sx=x+side*w*.477;
      // Side access panel edges, inset ventilation and service handles.
      g.box(sx,-l*.12,base+bodyH*.065,w*.018,l*.016,bodyH*.85,3);
      g.box(sx,l*.32,base+bodyH*.065,w*.018,l*.016,bodyH*.85,3);
      g.box(sx,l*.105,base+bodyH*.055,w*.019,l*.445,bodyH*.014,3);
      g.box(sx,l*.105,base+bodyH*.905,w*.019,l*.445,bodyH*.014,3);
      g.box(sx+side*w*.012,l*.27,base+bodyH*.42,w*.024,l*.035,bodyH*.12,3);
      g.box(sx,-l*.32,base+bodyH*.13,w*.02,l*.24,bodyH*.7,3);
      for(var j=0;j<7;j++) g.box(sx+side*w*.01,-l*.32,base+bodyH*(.19+j*.085),w*.015,l*.22,bodyH*.027,2);
      g.box(sx+side*w*.005,l*.13,base+bodyH*.6,w*.023,l*.14,bodyH*.18,1);
      g.box(sx+side*w*.019,l*.13,base+bodyH*.63,w*.018,l*.105,bodyH*.12,9);
    });
    // Low-profile exhaust and lifting mounts; no cable routing is invented.
    g.cylinder(x+w*.23,l*.27,h-roof*1.8,w*.032,roof*1.75,3,10);
    [-1,1].forEach(function (side) { g.box(x+side*w*.32,0,h-roof*.7,w*.07,l*.08,roof*.65,2); });
  }

  function container(g, x, w, l, h, options) {
    var rail=Math.min(w*.032,h*.027),skin=Math.min(w*.009,.027);
    g.box(x,0,0,w,l,rail*1.7,3);
    g.box(x,0,rail*1.7,w*.982,l*.99,h-rail*2.7,0);
    // The corner posts and corrugations identify a closed shipping container.
    [-1,1].forEach(function(sx) {
      [-1,1].forEach(function(sy){g.box(x+sx*(w/2-rail/2),sy*(l/2-rail/2),0,rail,rail,h,2);});
      g.box(x+sx*(w/2-rail/2),0,h-rail,rail,l,rail,2);
      var ribs=Math.max(5,Math.min(80,Math.floor(l/.24)));
      for(var i=1;i<ribs;i++)g.box(x+sx*(w*.492),-l/2+l*i/ribs,rail*1.8,skin,l/ribs*.28,h-rail*3,8);
    });
    g.box(x,0,h-rail*.9,w*.99,l*.99,rail*.75,0);
    var roofRibs=Math.max(5,Math.min(64,Math.floor(l/.32)));
    for(var r=1;r<roofRibs;r++)g.box(x,-l/2+l*r/roofRibs,h-rail*.25,w*.94,skin,rail*.25,8);
    confirmedDoors(g,x,w,l,h,rail*1.7,options,'container');
  }

  function light(g, x, w, l, h) {
    var wheelR=Math.min(w*.155,h*.06),chassisZ=wheelR*.65;
    var bodyH=Math.min(h*.18,w*.62),bodyBottom=wheelR*.95;
    // Low trailer base with tyres and hubs, independent of the mast height.
    g.box(x,-l*.07,chassisZ,w*.72,l*.7,wheelR*.36,3);
    [-1,1].forEach(function(side) {
      g.axleCylinder(x+side*w*.43,-l*.03,wheelR,wheelR,w*.13,3);
      g.axleCylinder(x+side*w*.498,-l*.03,wheelR,wheelR*.48,w*.006,2);
      g.box(x+side*w*.42,-l*.03,wheelR*1.72,w*.15,l*.32,wheelR*.15,2);
    });
    g.roundedPrism(x,-l*.13,bodyBottom,w*.69,l*.52,bodyH,w*.045,5,.96);
    g.box(x,-l*.13,bodyBottom+bodyH*.98,w*.71,l*.53,bodyH*.05,2);
    // Tow bar and stabiliser feet stay inside the requested footprint.
    g.box(x,l*.31,chassisZ,w*.055,l*.36,wheelR*.22,2);
    g.box(x,l*.476,chassisZ,w*.11,l*.045,wheelR*.28,3);
    [-1,1].forEach(function(sx) {[-1,1].forEach(function(sy) {
      g.box(x+sx*w*.38,sy*l*.33,0,w*.14,l*.055,wheelR*.12,3);
      g.box(x+sx*w*.38,sy*l*.33,wheelR*.12,w*.032,l*.025,chassisZ,2);
      g.box(x+sx*w*.22,sy*l*.33,chassisZ,w*.36,l*.023,wheelR*.16,2);
    });});
    [-1,1].forEach(function(side){
      g.box(x+side*w*.348,-l*.16,bodyBottom+bodyH*.2,w*.015,l*.29,bodyH*.57,3);
      for(var j=0;j<5;j++)g.box(x+side*w*.357,-l*.16,bodyBottom+bodyH*(.25+j*.1),w*.012,l*.26,bodyH*.032,2);
    });
    var mastBottom=bodyBottom+bodyH*.1,mastTop=h-Math.min(h*.06,w*.21),mastY=l*.105;
    for(var s=0;s<3;s++) {
      var mh=(mastTop-mastBottom)/3,ms=w*(.07-s*.014);
      g.box(x,mastY,mastBottom+(mastTop-mastBottom)*s/3,ms,ms,mh,2);
      g.box(x,mastY,mastBottom+(mastTop-mastBottom)*s/3,ms*1.3,ms*1.3,Math.min(mh*.045,.055),3);
    }
    // Four framed lamp heads, with pale lenses facing the same direction.
    var lampW=w*.2,lampH=h-mastTop,lampD=Math.min(l*.08,w*.09);
    g.box(x,mastY,mastTop-lampH*.05,w*.87,w*.035,lampH*.12,2);
    for(var n=0;n<4;n++) {
      var lx=x+(n-1.5)*w*.235;
      g.box(lx,mastY,mastTop,lampW,lampD,lampH,3);
      g.box(lx,mastY-lampD*.505,mastTop+lampH*.1,lampW*.82,lampD*.035,lampH*.8,1);
    }
  }

  function barrier(g, x, w, l, h) {
    // Generic hollow water-filled barrier: broad stable base, tapered shoulders.
    // This is visual equipment only; it does not assert a certified barrier type.
    g.roundedPrism(x,0,0,w*.99,l*.98,h*.16,Math.min(w,l)*.12,5);
    g.roundedPrism(x,0,h*.16,w*.94,l*.97,h*.67,Math.min(w,l)*.1,5,.55);
    g.roundedPrism(x,0,h*.83,w*.515,l*.53,h*.17,Math.min(w,l)*.07,5,.94);
    // White visibility panels follow the sloping long faces without floating.
    [-1,1].forEach(function(side) {
      var lowZ=h*.34,highZ=h*.65;
      var lowX=x+side*w*(.47-(.47-.2585)*(.34-.16)/.67)+side*.002;
      var highX=x+side*w*(.47-(.47-.2585)*(.65-.16)/.67)+side*.002;
      var lowY=l*(.485-(.485-.26675)*(.34-.16)/.67)*.92;
      var highY=l*(.485-(.485-.26675)*(.65-.16)/.67)*.92;
      var points=[[lowX,-lowY,lowZ],[lowX,lowY,lowZ],[highX,highY,highZ],[highX,-highY,highZ]];
      g.face(side>0?points:points.reverse(),1);
    });
    // Recessed base forklift pockets and moulded fill cap.
    [-1,1].forEach(function(side){[-1,1].forEach(function(slot){
      g.box(x+side*w*.496,slot*l*.23,h*.02,w*.008,l*.13,h*.085,3);
    });});
    g.cylinder(x,0,h*.96,Math.min(w*.09,l*.035),h*.039,2,10);
  }

  function encodeGLB(g, extras) {
    var buffers = [], byteLength = 0;
    var doc = {
      asset:{version:'2.0',generator:'GC500 Equipment '+VERSION,extras:extras},
      scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,name:extras.kind+' illustrative equipment'}],
      meshes:[{primitives:[]}],materials:[],accessors:[],bufferViews:[],buffers:[{byteLength:0}]
    };
    MATERIALS.forEach(function(m) {
      doc.materials.push({name:m[0],pbrMetallicRoughness:{baseColorFactor:m[1],metallicFactor:m[2],roughnessFactor:m[3]},doubleSided:false});
    });
    function append(array, target) {
      var padding=(4-byteLength%4)%4;
      if(padding){buffers.push(new Uint8Array(padding));byteLength+=padding;}
      var index=doc.bufferViews.length;
      doc.bufferViews.push({buffer:0,byteOffset:byteLength,byteLength:array.byteLength,target:target});
      buffers.push(new Uint8Array(array.buffer,array.byteOffset,array.byteLength));
      byteLength+=array.byteLength;
      return index;
    }
    var vertices=0,triangles=0,materials=0;
    g.parts.forEach(function(part,mat) {
      if(!part.i.length)return;
      var positions=new Float32Array(part.p),normals=new Float32Array(part.n),count=positions.length/3;
      var wide=count>65535,indices=wide?new Uint32Array(part.i):new Uint16Array(part.i);
      var pmin=[Infinity,Infinity,Infinity],pmax=[-Infinity,-Infinity,-Infinity];
      for(var i=0;i<positions.length;i++) {var axis=i%3;pmin[axis]=Math.min(pmin[axis],positions[i]);pmax[axis]=Math.max(pmax[axis],positions[i]);}
      var pi=doc.accessors.length;
      doc.accessors.push({bufferView:append(positions,34962),componentType:5126,count:count,type:'VEC3',min:pmin,max:pmax});
      var ni=doc.accessors.length;
      doc.accessors.push({bufferView:append(normals,34962),componentType:5126,count:count,type:'VEC3'});
      var ii=doc.accessors.length;
      doc.accessors.push({bufferView:append(indices,34963),componentType:wide?5125:5123,count:indices.length,type:'SCALAR'});
      doc.meshes[0].primitives.push({attributes:{POSITION:pi,NORMAL:ni},indices:ii,material:mat,mode:4});
      vertices+=count;triangles+=indices.length/3;materials++;
    });
    doc.buffers[0].byteLength=byteLength;
    var json=new TextEncoder().encode(JSON.stringify(doc)),jsonLength=(json.byteLength+3)&~3,binLength=(byteLength+3)&~3;
    var total=12+8+jsonLength+8+binLength,glb=new ArrayBuffer(total),view=new DataView(glb),bytes=new Uint8Array(glb);
    view.setUint32(0,0x46546c67,true);view.setUint32(4,2,true);view.setUint32(8,total,true);
    view.setUint32(12,jsonLength,true);view.setUint32(16,0x4e4f534a,true);
    bytes.fill(32,20,20+jsonLength);bytes.set(json,20);
    var offset=20+jsonLength;
    view.setUint32(offset,binLength,true);view.setUint32(offset+4,0x004e4942,true);offset+=8;
    buffers.forEach(function(buffer){bytes.set(buffer,offset);offset+=buffer.byteLength;});
    return {glb:glb,stats:{kind:extras.kind,quantity:extras.quantity,requestedQuantity:extras.requestedQuantity,
      vertices:vertices,triangles:triangles,materials:materials,bytes:total,
      bounds:{min:g.min.slice(),max:g.max.slice()},coordinateSystem:'local x=width,y=length,z=up'}};
  }

  function normaliseSpec(options) {
    options=options||{};
    var kind=options.kind;
    var specifications={building:[building,3,6,2.9],toilet:[toilet,1.15,1.2,2.3],generator:[generator,1.5,3.4,2.1],
      container:[container,2.44,6.06,2.59],light:[light,1.7,3,8],barrier:[barrier,.55,2,1],
      pee_panel:[peePanel,1.6,1.6,1.5],toilet_block:[toiletBlock,3,6,2.9],accessible_toilet:[accessibleToilet,1.6,1.8,2.4]};
    var specification=Object.prototype.hasOwnProperty.call(specifications,kind)&&specifications[kind];
    if(!specification)throw new Error('Unsupported equipment kind: '+String(kind));
    var defaults=specification.slice(1);
    var w=finitePositive(options.width,defaults[0],.25,15),l=finitePositive(options.length,defaults[1],.25,50),h=finitePositive(options.height,defaults[2],.25,10);
    var requested=Number(options.quantity),requestedQuantity=Number.isFinite(requested)&&requested>0?Math.floor(requested):1;
    var sides=['front','back','left','right'];
    var doors=Array.isArray(options.doors)?options.doors.slice(0,16).filter(function(d){return d&&d.confirmed===true&&sides.indexOf(d.side)>=0;}).map(function(d){return {
      side:d.side,confirmed:true,open:d.open===true,offset:Number.isFinite(d.offset)?Math.max(-50,Math.min(50,d.offset)):0,
      width:finitePositive(d.width,1.05,.2,8),adapted:d.adapted===true,
      renderedOffset:Number.isFinite(d.renderedOffset)?d.renderedOffset:undefined,
      renderedWidth:Number.isFinite(d.renderedWidth)?d.renderedWidth:undefined};}):[];
    var doorSide=sides.indexOf(options.doorSide)>=0?options.doorSide:(doors.length?doors[0].side:null);
    var doorConfirmed=doors.length>0||(options.doorConfirmed===true&&doorSide!==null);
    var doorCount=Math.floor(finitePositive(options.doorCount,1,1,4));
    return {kind:kind,quantity:Math.max(1,Math.min(48,requestedQuantity)),requestedQuantity:requestedQuantity,
      width:w,length:l,height:h,render:specification[0],doorSide:doorSide,doorConfirmed:doorConfirmed,
      doorOpen:doorConfirmed&&(options.doorOpen===true||doors.some(function(d){return d.open;})),doorCount:doorConfirmed?(doors.length||doorCount):0,
      doorAdapted:options.doorAdapted===true||doors.some(function(d){return d.adapted;}),doors:doors};
  }

  function appendEquipment(g,spec) {
    var gap=Math.min(.22,spec.width*.12);
    for(var i=0;i<spec.quantity;i++)spec.render(g,(i-(spec.quantity-1)/2)*(spec.width+gap),spec.width,spec.length,spec.height,spec);
  }

  function make(options) {
    var spec=normaliseSpec(options),g=new Builder();
    appendEquipment(g,spec);
    return encodeGLB(g,{kind:spec.kind,quantity:spec.quantity,requestedQuantity:spec.requestedQuantity,
      doorSide:spec.doorSide,doorConfirmed:spec.doorConfirmed,doorOpen:spec.doorOpen,doorCount:spec.doorCount,doorAdapted:spec.doorAdapted,doors:spec.doors,
      dimensionsMetres:{width:spec.width,length:spec.length,height:spec.height},author:'Andrew Fisher',
      note:'Illustrative equipment geometry. Not surveyed CAD. No asset identity, position or operational status is asserted by this model.'});
  }

  function makeGroup(parts) {
    if(!Array.isArray(parts)||!parts.length||parts.length>48)throw new Error('Equipment group must contain 1 to 48 placed parts');
    var quantity=0,requested=0;
    var prepared=parts.map(function(part){
      if(!part||typeof part!=='object')throw new Error('Equipment group part is required');
      var spec=normaliseSpec(part.spec),offset=part.offset===undefined?[0,0,0]:part.offset;
      var angle=part.angle===undefined?0:part.angle;
      if(!Array.isArray(offset)||offset.length!==3||offset.some(function(v){return typeof v!=='number'||!Number.isFinite(v)||Math.abs(v)>1e6;}))
        throw new Error('Equipment group offset must contain three finite metre coordinates');
      if(typeof angle!=='number'||!Number.isFinite(angle))throw new Error('Equipment group angle must be finite radians');
      quantity+=spec.quantity;requested+=spec.requestedQuantity;
      return {spec:spec,offset:offset.slice(),angle:angle};
    });
    // Do not silently drop a described family from an over-large mixed group.
    if(quantity>48||requested>48)throw new Error('Equipment group exceeds 48 units; split it into smaller groups');
    var g=new Builder(),partStats=[];
    prepared.forEach(function(part){
      var spec=part.spec;
      var beforeVertices=g.parts.reduce(function(sum,p){return sum+p.p.length/3;},0);
      var beforeTriangles=g.parts.reduce(function(sum,p){return sum+p.i.length/3;},0);
      g.transform={offset:part.offset,cos:Math.cos(part.angle),sin:Math.sin(part.angle)};
      g.activeBounds={min:[Infinity,Infinity,Infinity],max:[-Infinity,-Infinity,-Infinity]};
      appendEquipment(g,spec);
      partStats.push({kind:spec.kind,quantity:spec.quantity,requestedQuantity:spec.requestedQuantity,
        doorSide:spec.doorSide,doorConfirmed:spec.doorConfirmed,doorOpen:spec.doorOpen,doorCount:spec.doorCount,doorAdapted:spec.doorAdapted,doors:spec.doors,
        dimensionsMetres:{width:spec.width,length:spec.length,height:spec.height},offset:part.offset,angle:part.angle,
        vertices:g.parts.reduce(function(sum,p){return sum+p.p.length/3;},0)-beforeVertices,
        triangles:g.parts.reduce(function(sum,p){return sum+p.i.length/3;},0)-beforeTriangles,
        bounds:g.activeBounds});
      g.transform=null;g.activeBounds=null;
    });
    var result=encodeGLB(g,{kind:'group',quantity:quantity,requestedQuantity:requested,parts:partStats,
      author:'Andrew Fisher',note:'Illustrative equipment geometry. Not surveyed CAD. Positions are caller-provided local placements; this model makes no operational status claim.'});
    result.stats.parts=partStats;
    return result;
  }

  root.GC500EquipmentGeometry1027=Object.freeze({version:VERSION,make:make,makeGroup:makeGroup});
})(typeof window!=='undefined'?window:globalThis);
