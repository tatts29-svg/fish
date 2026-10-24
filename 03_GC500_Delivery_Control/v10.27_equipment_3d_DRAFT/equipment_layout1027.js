/* Author: Andrew Fisher. Pure record-to-geometry layout; no storage or network writes.
 * Drawing components establish positions, never extra inventory. Model fittings
 * and unmeasured dimensions remain illustrative. Local x=east, y=north, z=up.
 */
(function(root){
  'use strict';
  var DEG=Math.PI/180,EAST=111320,NORTH=110540;
  var DEFAULTS={building:[6,3,2.9],container:[6.06,2.44,2.59],toilet:[1.2,1.15,2.3],
    toilet_block:[6,3,2.9],accessible_toilet:[1.8,1.6,2.4],pee_panel:[1.6,1.6,1.5],
    generator:[3.4,1.5,2.1],light:[3,1.7,8],barrier:[2,.55,1]};
  var COMPONENTS={building:'building',container:'container',toilet:'toilet',toilet_block:'toilet_block',
    accessible_toilet:'accessible_toilet',pee_panel:'pee_panel',generator:'generator',
    light_tower:'light',light:'light',water_barrier:'barrier',barrier:'barrier'};
  function finite(v){return typeof v==='number'&&Number.isFinite(v);}
  function positive(v){return finite(v)&&v>0;}
  function ll(p){return p&&finite(p.lat)&&finite(p.lon)&&Math.abs(p.lat)<=90&&Math.abs(p.lon)<=180;}
  function key(s){return String(s||'').trim().toLowerCase().replace(/[ -]+/g,'_');}
  function family(item,row){
    var desc=String(item.description||''),kind=key(item.kind);
    if(/waste[_ -]?tank|fuel[_ -]?tank|water[_ -]?tank/.test(kind)||/\b(?:waste|fuel|water)\s*tank\b/i.test(desc))return null;
    if(/accessible|disabled|wheelchair/i.test(desc)||kind==='accessible_toilet')return 'accessible_toilet';
    if(/pee\s*panel|urinal/i.test(desc)||kind==='pee_panel')return 'pee_panel';
    if(/toilet.*block|ablution|\b\d+\s*pan\s*block/i.test(desc)||kind==='toilet_block')return 'toilet_block';
    if(/\bcont(?:ainer)?\b/i.test(desc)||kind==='container')return 'container';
    if(/\bFWF\b|portaloo|portable\s*toilet/i.test(desc)||kind==='toilet')return 'toilet';
    if(/light.*tower|tower.*light/i.test(desc)||kind==='light_tower'||kind==='light')return 'light';
    if(/\b(?:generator|genset)\b|\b\d+(?:\.\d+)?\s*kva\b/i.test(desc)||kind==='generator')return 'generator';
    if(/water.*barrier|barrier.*water/i.test(desc)||kind==='water_barrier'||kind==='barrier'||
       (key(row.kind)==='barrier'&&/^TL\s*2\b/i.test(desc)))return 'barrier';
    if(/building|office|shed|cabin|ticket\s*box/i.test(desc)||kind==='building')return 'building';
    return null;
  }
  function itemQuantity(item){
    if(item.quantity!==null&&item.quantity!==undefined&&item.quantity!==''){
      var n=Number(item.quantity);return Number.isFinite(n)&&n>0?Math.floor(n):0;
    }
    var text=String(item.description||'').trim();
    if(!text)return 0;
    var match=text.match(/\bqty\s*[:=]?\s*(\d+)\b/i);
    return match?Number(match[1]):1;
  }
  function centreOf(component){
    if(ll(component.centre))return {lat:component.centre.lat,lon:component.centre.lon};
    var polygon=(component.polygon||[]).filter(ll);
    if(polygon.length<3)return null;
    // Ignore a repeated closing point rather than biasing the footprint centre.
    if(polygon.length>3&&polygon[0].lat===polygon[polygon.length-1].lat&&polygon[0].lon===polygon[polygon.length-1].lon)polygon=polygon.slice(0,-1);
    return {lat:polygon.reduce(function(s,p){return s+p.lat;},0)/polygon.length,
      lon:polygon.reduce(function(s,p){return s+p.lon;},0)/polygon.length};
  }
  function footprint(component,centre,kind){
    var points=(component.polygon||[]).filter(ll),longest=0,shortest=Infinity,angle=0;
    for(var i=0;i<points.length;i++){
      var a=points[i],b=points[(i+1)%points.length];
      var dx=(b.lon-a.lon)*Math.cos(centre.lat*DEG)*EAST,dy=(b.lat-a.lat)*NORTH,size=Math.hypot(dx,dy);
      if(size>.1)shortest=Math.min(shortest,size);
      if(size>longest+.001){longest=size;angle=-Math.atan2(dx,dy);}
    }
    if(!longest&&Array.isArray(component.sizeM)){
      longest=Math.max.apply(Math,component.sizeM.filter(positive));
      shortest=Math.min.apply(Math,component.sizeM.filter(positive));
    }
    // Doors in these generic models sit on -Y, except ablution doors on +X.
    // Only choose a compatible half-turn; never rotate the long footprint 90°.
    var bearing=component.doorBearingDeg;
    if(finite(bearing)&&['building','container','toilet','accessible_toilet','toilet_block'].indexOf(kind)>=0){
      var target=(kind==='toilet_block'?Math.PI/2:Math.PI)-bearing*DEG;
      var delta=Math.atan2(Math.sin(target-angle),Math.cos(target-angle));
      if(Math.abs(Math.abs(delta)-Math.PI)<20*DEG)angle+=Math.PI;
    }
    return {length:positive(longest)?longest:null,width:positive(shortest)?shortest:null,angle:angle};
  }
  function dimensions(item,component,centre,kind){
    var d=item.dimensions||{},fallback=DEFAULTS[kind],shape=footprint(component,centre,kind);
    var physical=kind==='building'||kind==='container'||kind==='toilet_block';
    var length=positive(d.lengthMm)?d.lengthMm/1000:(physical&&shape.length?shape.length:fallback[0]);
    var width=positive(d.widthMm)?d.widthMm/1000:(physical&&shape.width?shape.width:fallback[1]);
    var height=positive(d.heightMm)?d.heightMm/1000:fallback[2];
    // Match the model engine's supported dimensions rather than changing scale silently.
    if(length<.25||length>50||width<.25||width>15||height<.25||height>10)return null;
    var door=doorInfo(component,shape.angle,kind,centre,width,length);
    return {spec:{kind:kind,length:length,width:width,height:height,quantity:1,
      doorSide:door.side,doorConfirmed:door.confirmed,doorOpen:door.confirmed,doorCount:door.count,doorAdapted:door.adapted,doors:door.doors},
      angle:shape.angle,doorSourceNote:door.source};
  }
  function doorInfo(component,angle,kind,centre,bodyWidth,bodyLength){
    var unknown={side:null,confirmed:false,count:0,source:'',doors:[],adapted:false};
    if(['building','container','toilet_block','toilet','accessible_toilet'].indexOf(kind)<0)return unknown;
    var basis=String(component.doorBasis||''),hasDoors=Array.isArray(component.doors)&&component.doors.length>0;
    if(/uncertain|unknown|not confirmed|no door|not shown/i.test(basis))return unknown;
    var candidates=hasDoors?component.doors:[{bearingDeg:component.doorBearingDeg,edgeIndex:component.doorEdge,source:component.source}];
    var valid=[];
    candidates.forEach(function(door){
      var bearing=door.bearingDeg,edge=door.edgeIndex;
      var sourced=/^master(?:_|$)/.test(key(door.source||component.source))||component.doorVerified===true||component.doorConfirmed===true;
      if(!sourced||!finite(bearing)||!Number.isInteger(edge)||edge<0)return;
      if(Array.isArray(component.polygon)&&component.polygon.length&&edge>=component.polygon.length)return;
      var localX=Math.sin(bearing*DEG+angle),localY=Math.cos(bearing*DEG+angle);
      if(Math.max(Math.abs(localX),Math.abs(localY))<Math.cos(25*DEG))return;
      var side=Math.abs(localX)>Math.abs(localY)?(localX>0?'right':'left'):(localY>0?'back':'front');
      var offset=0,positioned=ll(door.mid);
      if(positioned){
        var dx=(door.mid.lon-centre.lon)*Math.cos(centre.lat*DEG)*EAST,dy=(door.mid.lat-centre.lat)*NORTH;
        var x=dx*Math.cos(angle)+dy*Math.sin(angle),y=-dx*Math.sin(angle)+dy*Math.cos(angle);
        offset=side==='front'?x:side==='back'?-x:side==='left'?-y:y;
      }
      var width=positive(door.widthM)?door.widthM:1.05;
      // Match normaliseSpec and confirmedDoors in the geometry engine exactly.
      // A source position may sit outside a smaller illustrative/recorded body.
      var span=side==='left'||side==='right'?bodyLength:bodyWidth;
      var renderedWidth=Math.min(Math.max(.2,Math.min(8,width)),span*.9);
      var normalOffset=Math.max(-50,Math.min(50,offset));
      var renderedOffset=Math.max(-span/2+renderedWidth/2,Math.min(span/2-renderedWidth/2,normalOffset));
      var adapted=Math.abs(renderedWidth-width)>1e-9||Math.abs(renderedOffset-offset)>1e-9;
      valid.push({side:side,confirmed:true,open:true,offset:offset,width:width,positioned:positioned,
        adapted:adapted,renderedOffset:renderedOffset,renderedWidth:renderedWidth});
    });
    if(!valid.length)return unknown;
    var count=basis.match(/\b(\d+)\s+doors?\b/i);
    var source=/^master(?:_|$)/.test(key(component.source))?'the master plan':'the verified location record';
    var adapted=hasDoors&&valid.some(function(d){return d.adapted;});
    return {side:valid[0].side,confirmed:true,count:hasDoors?valid.length:(count?Math.max(1,Math.min(4,Number(count[1]))):1),
      doors:hasDoors?valid:[],adapted:adapted,source:adapted?
        'Door side from '+source+'; doorway position adapted to the illustrative model.':hasDoors&&valid.every(function(d){return d.positioned;})?
        'Doorway positions and sides from '+source+'.':'Door side from '+source+'; doorway position is illustrative.'};
  }
  function specOf(row){
    if(!row||row.extrudable===false||row.areaOnly||!ll(row.location)||row.location.areaOnly)return null;
    var items=Array.isArray(row.items)?row.items:[],components=Array.isArray(row.components)?row.components:[];
    var requested=0,knownRequested=0,excluded=0,requests=[];
    items.forEach(function(item){
      var count=itemQuantity(item),kind=family(item,row);requested+=count;
      if(!kind){excluded+=count;return;}
      knownRequested+=count;
      requests.push({item:item,kind:kind,quantity:count,matched:0});
    });
    if(!knownRequested)return null;
    var seenIds=new Set(),seenCentres=new Set(),available=[];
    components.forEach(function(component,index){
      if(!component||component.areaOnly||component.extrudable===false)return;
      var kind=COMPONENTS[key(component.kind)],centre=centreOf(component);
      if(!kind||!centre)return;
      var id=component.id?String(component.id):'index:'+index;
      var position=centre.lat.toFixed(7)+':'+centre.lon.toFixed(7);
      if(seenIds.has(id)||seenCentres.has(position))return;
      seenIds.add(id);seenCentres.add(position);
      available.push({component:component,centre:centre,kind:kind,id:id,used:false});
    });
    var placed=[],grouped=false;
    requests.forEach(function(request){
      for(var i=0;i<available.length&&request.matched<request.quantity;i++){
        var candidate=available[i];
        if(candidate.used||candidate.kind!==request.kind)continue;
        var built=dimensions(request.item,candidate.component,candidate.centre,request.kind);
        if(!built)continue;
        candidate.used=true;request.matched++;
        placed.push({spec:built.spec,angle:built.angle,centre:candidate.centre,componentId:candidate.id,doorSourceNote:built.doorSourceNote});
      }
    });
    // A point entered on site establishes the group's location, not individual slots.
    // A drawn master location without matching components must never use this fallback.
    if(!components.length&&['pin','place'].indexOf(key(row.location.kind))>=0&&row.extrudable===true){
      if(knownRequested>48)return null;
      grouped=knownRequested>1;
      requests.forEach(function(request){
        var built=dimensions(request.item,{polygon:[]},row.location,request.kind);
        if(!built)return;
        for(var i=0;i<request.quantity;i++){
          placed.push({spec:Object.assign({},built.spec),angle:0,centre:row.location,componentId:null,doorSourceNote:''});
          request.matched++;
        }
      });
    }
    if(!placed.length||placed.length>48)return null;
    var centre={lat:placed.reduce(function(s,p){return s+p.centre.lat;},0)/placed.length,
      lon:placed.reduce(function(s,p){return s+p.centre.lon;},0)/placed.length};
    var eastScale=Math.cos(centre.lat*DEG)*EAST;
    var parts=placed.map(function(part){return {spec:part.spec,
      offset:[(part.centre.lon-centre.lon)*eastScale,(part.centre.lat-centre.lat)*NORTH,0],
      angle:part.angle,componentId:part.componentId,doorSourceNote:part.doorSourceNote};});
    if(grouped){
      var fullWidth=parts.reduce(function(sum,p){return sum+p.spec.width;},0)+.16*(parts.length-1),cursor=-fullWidth/2;
      parts.forEach(function(part){part.offset=[cursor+part.spec.width/2,0,0];cursor+=part.spec.width+.16;});
    }
    var bounds={min:[Infinity,Infinity,0],max:[-Infinity,-Infinity,0]},height=0;
    parts.forEach(function(part){
      var co=Math.cos(part.angle),si=Math.sin(part.angle),hw=part.spec.width/2,hl=part.spec.length/2;
      [-1,1].forEach(function(sx){[-1,1].forEach(function(sy){
        var x=part.offset[0]+sx*hw*co-sy*hl*si,y=part.offset[1]+sx*hw*si+sy*hl*co;
        bounds.min[0]=Math.min(bounds.min[0],x);bounds.max[0]=Math.max(bounds.max[0],x);
        bounds.min[1]=Math.min(bounds.min[1],y);bounds.max[1]=Math.max(bounds.max[1],y);
      });});
      height=Math.max(height,part.spec.height);
    });
    bounds.max[2]=height;
    var doorCount=parts.filter(function(part){return part.spec.doorConfirmed&&part.spec.doorOpen;}).length;
    var doorAdapted=parts.some(function(part){return part.spec.doorAdapted;});
    var doorSources=Array.from(new Set(parts.filter(function(part){return !doorAdapted||part.spec.doorAdapted;}).map(function(part){return part.doorSourceNote;}).filter(Boolean)));
    var missing=requests.filter(function(r){return r.matched<r.quantity;}).map(function(r){
      return (r.quantity-r.matched)+' '+String(r.item.description||r.kind)+' position'+(r.quantity-r.matched===1?' is':'s are')+' not individually marked';
    });
    var notes=[];
    if(placed.length<requested)notes.push('3D shows '+placed.length+' of '+requested+' items.');
    if(missing.length)notes.push(missing.join('; ')+'.');
    if(excluded)notes.push(excluded+' other item'+(excluded===1?' remains':'s remain')+' in the equipment list.');
    if(grouped)notes.push('Illustrative row at the recorded group location; individual positions are not established.');
    return {kind:'group',quantity:parts.length,requestedQuantity:requested,parts:parts,
      length:Math.max(.25,2*Math.max(Math.abs(bounds.min[1]),Math.abs(bounds.max[1])))+.12+(doorCount?2.5:0),
      width:Math.max(.25,2*Math.max(Math.abs(bounds.min[0]),Math.abs(bounds.max[0])))+.12+(doorCount?2.5:0),
      height:height,angle:0,centre:centre,bounds:bounds,partialNote:notes.join(' '),
      groupedPosition:grouped,doorsIllustrative:true,doorCount:doorCount,doorAdapted:doorAdapted,
      doorSourceNote:doorSources.join(' ')+(doorCount?' Open position shown for clarity; not a live door-open status.':'Door side is not confirmed on the source drawing.')};
  }
  root.GC500EquipmentLayout1027=Object.freeze({version:'10.27',specOf:specOf});
})(typeof window!=='undefined'?window:globalThis);
