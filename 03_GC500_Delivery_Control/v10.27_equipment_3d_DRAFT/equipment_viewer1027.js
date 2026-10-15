/* Author: Andrew Fisher. Mapped equipment layer: a view of the shared record,
 * never a second inventory. Model appearance is illustrative; source geometry,
 * status and quantity remain the application's own. */
(function () {
  'use strict';
  const records = new Map(), models = new Map();
  let active = null, lastSnapshot = '', poll = 0, pulse = 0, enabled = true, stopped = false;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const bridge = () => { try { return window.parent.GC500EquipmentBridge1027; } catch (_) { return null; } };
  const sceneReady = () => viewer && !viewer.isDestroyed() && window.__ready;
  const render = () => { if (sceneReady()) viewer.scene.requestRender(); };
  const live = () => !document.hidden && (!EMBED3D || bridge()?.active());
  const findPin = ref => PINS.find(p => p.k === ref);
  const finite = n => typeof n === 'number' && Number.isFinite(n);
  const css = document.createElement('style');
  css.textContent = `
  .equipment1027-card{position:absolute;right:16px;top:108px;width:290px;box-sizing:border-box;z-index:4;background:linear-gradient(150deg,#202a2f,#101719);border:1px solid #ff873b;border-radius:16px;color:#fff;box-shadow:0 10px 30px #0008,0 0 18px #ff6a1328;padding:16px;font:14px/1.4 Inter,system-ui,sans-serif;max-height:calc(100% - 180px);overflow:auto;scrollbar-width:thin}
  .equipment1027-card[hidden]{display:none}.equipment1027-card h2{margin:0 48px 10px 0;font-size:24px;line-height:1.2}.equipment1027-card p{margin:5px 0;color:#e2e8e9}.equipment1027-close{position:absolute;right:7px;top:6px;font-size:28px!important;width:44px;padding:0!important}
  .equipment1027-card button,.equipment1027-tools button{min-height:44px;border-radius:10px;border:1px solid #879399;background:#19252a;color:#fff;font:700 13px/1.3 Inter,system-ui,sans-serif;padding:8px 12px;cursor:pointer;touch-action:manipulation}.equipment1027-card button:hover,.equipment1027-tools button:hover{border-color:#ff8b40;background:#293b43}.equipment1027-card button:focus-visible,.equipment1027-tools button:focus-visible{outline:3px solid #ff9a4d;outline-offset:2px;box-shadow:0 0 16px #ff6a13}
  .equipment1027-status{display:flex;gap:10px;align-items:center;font-weight:800;font-size:17px;color:#53f2ac;margin:14px 0;padding:12px 0;border-top:1px solid #647076;border-bottom:1px solid #647076}.equipment1027-status.pending{color:#ffd166}.equipment1027-status svg{flex:none;width:30px;height:30px}.equipment1027-actions{display:flex;gap:8px}.equipment1027-actions button{flex:1}.equipment1027-card details{margin-top:12px;color:#dbe2e4;font-size:12px}.equipment1027-card summary{cursor:pointer;min-height:30px;display:flex;align-items:center;font-weight:700}.equipment1027-card details p{font-size:12px}.equipment1027-card [data-meta]{font-size:12px}
  .equipment1027-tools{position:absolute;left:12px;top:calc(var(--hh) + 10px);z-index:3;display:flex;gap:6px}.equipment1027-tools[hidden]{display:none}.equipment1027-tools button[aria-pressed=true]{border-color:#ffa362;box-shadow:0 0 12px #ff6a1355;background:#51301d}.equipment1027-caption{position:absolute;left:12px;bottom:26px;z-index:3;max-width:calc(100% - 30px);font-size:11px;background:#101719e8;color:#e2e8ea;border:1px solid #6c7478;border-radius:8px;padding:5px 9px;pointer-events:none}.equipment1027-caption[hidden]{display:none}
  body.equipment1027 .rose3d{top:auto;bottom:62px}body.equipment1027 .pill{top:calc(var(--hh) + 60px);max-width:calc(100% - 350px)}body.equipment1027 .q button{min-height:38px}body.equipment1027 .views button{min-height:36px}
  @media(max-width:900px){.equipment1027-tools{left:10px;top:calc(var(--hh) + 48px)}.equipment1027-tools button{font-size:12px;padding:7px 10px}.equipment1027-card{right:10px;left:10px;top:auto;bottom:58px;width:auto;max-height:42%;padding:12px;border-radius:13px}.equipment1027-card h2{font-size:21px;margin-bottom:4px}.equipment1027-card p{font-size:13px;margin:2px 0}.equipment1027-status{margin:8px 0;padding:8px 0;font-size:15px}.equipment1027-status svg{width:25px;height:25px}.equipment1027-card details{margin-top:6px}.equipment1027-actions button{font-size:12px}.equipment1027-caption{bottom:24px;left:10px;max-width:calc(100% - 40px);font-size:10px}body.equipment1027 .rose3d{top:calc(var(--hh) + 100px);bottom:auto}body.equipment1027 .pill{max-width:calc(100% - 130px);top:calc(var(--hh) + 101px)}
  `;
  document.head.appendChild(css);
  const card = document.createElement('section'); card.className = 'equipment1027-card'; card.hidden = true;
  card.setAttribute('aria-label', 'Selected equipment');
  card.innerHTML = '<button type="button" class="equipment1027-close" aria-label="Close equipment details">×</button><h2 data-ref></h2><div data-description></div><p data-supplier></p><div class="equipment1027-status" role="status"><span data-icon></span><span data-status></span></div><div class="equipment1027-actions"><button type="button" data-action="photos">View photos</button><button type="button" data-action="details">Details</button></div><details><summary>More info</summary><p data-location></p><p data-visual></p><p data-meta></p></details>';
  document.body.appendChild(card);
  const tools = document.createElement('div'); tools.className = 'equipment1027-tools'; tools.hidden = true;
  tools.innerHTML = '<button type="button" data-gate>Gate 6</button><button type="button" data-models aria-pressed="true">3D equipment</button><button type="button" data-zoom="in" aria-label="Zoom in">+</button><button type="button" data-zoom="out" aria-label="Zoom out">−</button>';
  document.body.appendChild(tools);
  const caption = document.createElement('div'); caption.className = 'equipment1027-caption'; caption.hidden = true;
  caption.textContent = 'Illustrative equipment · recorded locations and quantities'; document.body.appendChild(caption);
  function suppressParentCard(show) { try { bridge()?.cardVisible(show); } catch (_) {} }
  function updateCard() {
    const row = records.get(active);
    card.hidden = !row; suppressParentCard(!!row);
    if (!row) return;
    card.querySelector('[data-ref]').textContent = row.quantityLabel;
    const desc = row.items.map(item => `${item.quantity == null ? '' : item.quantity + ' × '}${item.description}`).join(' · ');
    card.querySelector('[data-description]').textContent = desc;
    card.querySelector('[data-supplier]').textContent = row.supplier;
    card.querySelector('[data-status]').textContent = row.completionLabel;
    card.querySelector('.equipment1027-status').classList.toggle('pending', !row.complete);
    card.querySelector('[data-icon]').innerHTML = row.complete ? '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M10 2h12l8 8v12l-8 8H10l-8-8V10Z" stroke="currentColor" stroke-width="2"/><path d="m8 16 5 5L24 10" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M16 2 30 16 16 30 2 16Z" stroke="currentColor" stroke-width="2"/><path d="M9 16h14" stroke="currentColor" stroke-width="3"/></svg>';
    card.querySelector('[data-location]').textContent = row.sourceNote;
    card.querySelector('[data-visual]').textContent = row.visualNote;
    const entry=models.get(row.ref),note=entry?.spec.partialNote;
    card.querySelector('[data-meta]').textContent = (note ? note+' ' : '')+`${row.photos.recorded} recorded photo${row.photos.recorded === 1 ? '' : 's'} · changes read from the shared record. Model doors and fittings are illustrative; use the loading record for orientation.`;
    card.querySelector('[data-action="photos"]').hidden = row.photos.recorded === 0;
  }
  card.querySelector('.equipment1027-close').onclick = () => { active = null; ringAt(null); try { bridge()?.clear(); } catch (_) {} updateCard(); render(); };
  card.querySelectorAll('[data-action]').forEach(b => b.onclick = () => { if (active) bridge()?.open(active, b.dataset.action); });
  card.addEventListener('keydown', e => { if (e.key === 'Escape') { card.querySelector('.equipment1027-close').click(); tools.querySelector('[data-gate]').focus(); e.stopPropagation(); } });
  tools.querySelector('[data-gate]').onclick = () => focusGate();
  tools.querySelector('[data-models]').onclick = e => { enabled = !enabled; e.currentTarget.setAttribute('aria-pressed', String(enabled)); applyVisibility(); render(); };
  tools.querySelectorAll('[data-zoom]').forEach(b => b.onclick = () => { if (!sceneReady()) return; stopMotion813(); const centre = lookTarget(); const distance = centre ? Cesium.Cartesian3.distance(viewer.camera.positionWC, centre) : 100; viewer.camera[b.dataset.zoom === 'in' ? 'zoomIn' : 'zoomOut'](Math.max(3, distance * .22)); render(); });

  function pinSelection(ref) { return ref ? findPin(ref) : null; }
  function modelMatrix(row, spec) {
    const p = findPin(row.ref), ll = spec.centre || row.location;
    const position = Cesium.Cartesian3.fromDegrees(ll.lon, ll.lat, p ? pinH(p) + .08 : SITE_H + .08);
    const enu = Cesium.Transforms.eastNorthUpToFixedFrame(position);
    return Cesium.Matrix4.multiply(enu, Cesium.Matrix4.fromRotationTranslation(Cesium.Matrix3.fromRotationZ(spec.angle)), new Cesium.Matrix4());
  }
  function specOf(row) { return GC500EquipmentLayout1027.specOf(row); }
  function dispose(entry) { if (!entry) return; entry.dead = true; if (entry.model && sceneReady()) viewer.scene.primitives.remove(entry.model); if (entry.url) URL.revokeObjectURL(entry.url); }
  async function buildModel(row) {
    const spec = specOf(row), signature = JSON.stringify(spec);
    const old = models.get(row.ref);
    if (old?.signature === signature) return;
    if (old) { dispose(old); models.delete(row.ref); }
    if (!spec || !sceneReady()) return;
    const entry = {signature,spec,model:null,dead:false}; models.set(row.ref, entry);
    try {
      const generated = GC500EquipmentGeometry1027.makeGroup(spec.parts);
      entry.url = URL.createObjectURL(new Blob([generated.glb], {type:'model/gltf-binary'}));
      const model = await Cesium.Model.fromGltfAsync({url:entry.url,modelMatrix:modelMatrix(row,spec),id:{_gc:findPin(row.ref)},allowPicking:true,minimumPixelSize:0,maximumScale:1,incrementallyLoadTextures:false,shadows:Cesium.ShadowMode.DISABLED,distanceDisplayCondition:new Cesium.DistanceDisplayCondition(0,1200)});
      if (entry.dead || stopped || !sceneReady() || models.get(row.ref) !== entry) { model.destroy(); return; }
      entry.model = model; entry.stats = generated.stats; viewer.scene.primitives.add(model);
      URL.revokeObjectURL(entry.url); entry.url = null;
      model.readyEvent.addEventListener(() => { if (!entry.dead) { applyVisibility(); updateLabels(); render(); } });
      model.errorEvent.addEventListener(() => { entry.failed = true; applyVisibility(); render(); });
      applyVisibility(); render();
    } catch (error) { if(entry.url){URL.revokeObjectURL(entry.url);entry.url=null;} entry.failed = true; entry.error=String(error?.message||error).slice(0,180); applyVisibility(); render(); }
  }
  function applyVisibility() {
    for (const [ref,entry] of models) {
      const p=findPin(ref), vis=!!(p && (visible(p)||ref===active));
      if (entry.model) entry.model.show=enabled && vis;
    }
    updateLabels();
  }
  function updateLabels() {
    if (!sceneReady()) return;
    for (const rec of pinEntities) {
      const row=records.get(rec._gc.k),entry=models.get(rec._gc.k);
      if (!row) { if(rec._original1027){Object.assign(rec.l,rec._original1027);rec.b.show=rec.l.show=visible(rec._gc);delete rec._original1027;} continue; }
      if(!rec._original1027)rec._original1027={text:rec.l.text,font:rec.l.font,fillColor:rec.l.fillColor,backgroundColor:rec.l.backgroundColor,pixelOffset:rec.l.pixelOffset,backgroundPadding:rec.l.backgroundPadding,distanceDisplayCondition:rec.l.distanceDisplayCondition,position:rec.l.position};
      const isShown=visible(rec._gc)||row.ref===active, selected=row.ref===active;
      const modelShown=enabled && entry?.model?.ready && !entry.failed && isShown;
      rec.b.show = isShown && (!modelShown || entry.spec.quantity!==row.quantity);
      rec.l.show = isShown;
      rec.l.text = row.quantityLabel + (selected ? '\n'+row.completionLabel : '');
      rec.l.font = selected ? '800 15px Inter, system-ui, sans-serif' : '700 13px Inter, system-ui, sans-serif';
      rec.l.fillColor = Cesium.Color.WHITE; rec.l.backgroundColor=Cesium.Color.fromCssColorString('#101b20').withAlpha(.95);
      rec.l.outlineWidth=0; rec.l.pixelOffset=new Cesium.Cartesian2(0,selected?-22:-12);
      rec.l.backgroundPadding=new Cesium.Cartesian2(9,6);
      rec.l.position=Cesium.Cartesian3.fromDegrees(rec._gc.ll[1],rec._gc.ll[0],pinH(rec._gc)+(modelShown?entry.spec.height:0));
      rec.l.distanceDisplayCondition = selected ? DDC.all : new Cesium.DistanceDisplayCondition(0,650);
      if(entry?.model){
        entry.model.id={_gc:rec._gc};
        entry.model.silhouetteSize=selected?3:0;
        entry.model.silhouetteColor=Cesium.Color.fromCssColorString(row.complete?'#32ee9b':'#ff9a38');
      }
    }
    declutter();
  }
  function declutter(){
    if(!sceneReady()||!Cesium.SceneTransforms?.worldToWindowCoordinates)return;
    const placed=[],order=pinEntities.filter(rec=>records.has(rec._gc.k)).sort((a,b)=>(b._gc.k===active?1:0)-(a._gc.k===active?1:0));
    for(const rec of order){
      if(!(visible(rec._gc)||rec._gc.k===active)){rec.l.show=false;continue;}
      const pos=Cesium.SceneTransforms.worldToWindowCoordinates(viewer.scene,rec.l.position);if(!pos)continue;
      const lines=String(rec.l.text).split('\n'),w=Math.max(...lines.map(t=>t.length))*7+20,h=lines.length*20+12;
      const box={l:pos.x-w/2,r:pos.x+w/2,t:pos.y-h-22,b:pos.y-15};
      const overlaps=placed.some(p=>box.l<p.r+5&&box.r>p.l-5&&box.t<p.b+4&&box.b>p.t-4);
      rec.l.show=!overlaps||rec._gc.k===active;if(rec.l.show)placed.push(box);
    }
  }
  const selectionEntities=[];
  function clearSelectionGeometry() { while(selectionEntities.length) { const e=selectionEntities.pop(); if(sceneReady())viewer.entities.remove(e); } }
  function drawSelection() {
    clearSelectionGeometry(); clearInterval(pulse); pulse=0; updateLabels();
    if(!sceneReady() || !active) return;
    const row=records.get(active),p=findPin(active); if(!row||!p)return;
    const color=Cesium.Color.fromCssColorString(row.complete?'#32ee9b':'#ff9a38'),h=pinH(p)+.16;
    for(const component of row.components){
      if(component.polygon.length<3)continue;
      // Keep the selection rim outside the equipment body so it remains visible.
      const c=component.centre||row.location,scale=Math.cos(c.lat*Math.PI/180)*111320;
      const coords=component.polygon.flatMap(q=>{
        const x=(q.lon-c.lon)*scale,y=(q.lat-c.lat)*110540,d=Math.hypot(x,y),k=d>.01?(d+.22)/d:1;
        return [c.lon+x*k/scale,c.lat+y*k/110540,h];
      });
      const positions=Cesium.Cartesian3.fromDegreesArrayHeights(coords);
      selectionEntities.push(viewer.entities.add({polygon:{hierarchy:positions,perPositionHeight:true,material:color.withAlpha(.19)},polyline:{positions:[...positions,positions[0]],width:5,material:new Cesium.PolylineGlowMaterialProperty({glowPower:.25,color})}}));
    }
    if(RING){viewer.entities.remove(RING);RING=null;}
    updateLabels(); startPulse(); render();
  }
  function startPulse(){
    clearInterval(pulse); pulse=0;
    if(!active||reduced.matches||!live()||!selectionEntities.length)return;
    let phase=0;
    // Only a selected footprint requests low-frequency animation. Motion and hidden
    // frames suspend the pulse, retaining the solid selection boundary.
    pulse=setInterval(()=>{
      if(!sceneReady()||!live()||!active){clearInterval(pulse);pulse=0;return;}
      if(ADAPT.moving)return;
      phase+=.23;const alpha=.15+.055*(1+Math.sin(phase));
      const row=records.get(active),color=Cesium.Color.fromCssColorString(row?.complete?'#32ee9b':'#ff9a38');
      for(const e of selectionEntities)e.polygon.material=color.withAlpha(alpha);
      const selected=models.get(active)?.model;
      if(selected)selected.silhouetteColor=color.withAlpha(.72+.28*(1+Math.sin(phase))/2);
      render();
    },100);
  }
  function focusGate(){
    if(!sceneReady())return;
    stopMotion813();
    const gate=['P60','P62','P63','WC49','GN06'];
    const cat=bridge()?.catalogue?.() || [...records.values()];
    const points=cat.filter(r=>gate.includes(r.ref)&&r.location).map(r=>Cesium.Cartesian3.fromDegrees(r.location.lon,r.location.lat,pinH(findPin(r.ref)||{})));
    if(!points.length)return;
    const sphere=Cesium.BoundingSphere.fromPoints(points);
    viewer.camera.flyToBoundingSphere(sphere,{offset:new Cesium.HeadingPitchRange(Cesium.Math.toRadians(20),Cesium.Math.toRadians(-48),Math.max(90,sphere.radius*3.8)),duration:reduced.matches?0:1.3});
    render();
  }
  function setSelection(p){
    const next=p?.k&&records.has(p.k)?p.k:null,changed=next!==active;
    active=next; if(changed){card.querySelector('details').open=false;card.scrollTop=0;}
    updateCard();drawSelection();
  }
  const originalRing=ringAt;
  ringAt=function(p){originalRing(p);setSelection(p);};
  if(typeof flyToPin==='function'){
    const oldFly=flyToPin;
    flyToPin=function(p,pick=true){
      oldFly(p,pick);
      if(!sceneReady()||!p)return;
      let row=records.get(p.k);
      if(!row){try{row=bridge()?.snapshot([p.k])?.items.find(r=>r.ref===p.k);}catch(_){}if(row){records.set(p.k,row);buildModel(row);setSelection(p);}}
      if(!row)return;
      const spec=specOf(row);if(!spec)return;
      const centre=spec.centre||row.location,position=Cesium.Cartesian3.fromDegrees(centre.lon,centre.lat,pinH(p));
      stopMotion813();
      viewer.camera.flyToBoundingSphere(new Cesium.BoundingSphere(position,5),{offset:new Cesium.HeadingPitchRange(viewer.camera.heading,Cesium.Math.toRadians(-48),Math.max(42,Math.max(spec.length,spec.width)*4)),duration:reduced.matches?0:1.2});
      render();
    };
  }
  const originalDraw=drawPins;
  drawPins=function(){originalDraw();updateLabels();};
  const originalHeights=heightBatch;
  heightBatch=async function(){await originalHeights();if(sceneReady()){for(const [ref,entry]of models){const row=records.get(ref);if(entry.model&&row)entry.model.modelMatrix=modelMatrix(row,entry.spec);}updateLabels();if(active)drawSelection();}};
  const originalGroups=GC500_3D.showGroups;
  GC500_3D.showGroups=function(ids){originalGroups(ids);applyVisibility();};
  GC500_3D.setPins=function(list){
    const old=new Map(PINS.map(p=>[p.k,p])),selectedRef=ringPin?.k;
    PINS=(list||[]).filter(p=>p&&p.ll&&p.ll.length===2&&p.ll.every(finite)).map(p=>{
      const prior=old.get(p.k);if(prior&&prior.ll[0]===p.ll[0]&&prior.ll[1]===p.ll[1])return Object.assign(prior,p);
      return {...p};
    });
    window.__pendingPins=PINS;
    if(viewer){drawPins();ringAt(PINS.find(p=>p.k===selectedRef)||null);applyVisibility();}
  };
  function sync(){
    if(stopped||!sceneReady()||!live())return;
    let snapshot;try{
      const api=bridge();
      if(api?.catalogue && !ADAPT.moving){
        const cat=api.catalogue(),cam=viewer.camera.positionWC;
        const nearby=cat.map(row=>{const p=findPin(row.ref);return {row,p,d:p?Cesium.Cartesian3.distance(cam,pinPos(p)):Infinity};}).filter(x=>x.p&&(x.d<1000||x.row.ref===active||x.row.ref===ringPin?.k)).sort((a,b)=>a.d-b.d);
        const refs=nearby.slice(0,LOWPOWER?14:24).map(x=>x.row.ref);
        if(active&&!refs.includes(active))refs.push(active);
        if(ringPin&&!refs.includes(ringPin.k))refs.push(ringPin.k);
        snapshot=api.snapshot(refs);
        tools.hidden=cat.length===0;
      }else if(api?.catalogue){return;}else snapshot=api?.snapshot();
    }catch(_){return;}
    if(!snapshot?.available)return;
    const sig=JSON.stringify(snapshot);if(sig===lastSnapshot){if(active&&!pulse)startPulse();return;}lastSnapshot=sig;
    const previous=active;records.clear();for(const row of snapshot.items)records.set(row.ref,row);
    for(const [ref,entry]of models)if(!records.has(ref)){dispose(entry);models.delete(ref);}
    for(const row of records.values())buildModel(row);
    document.body.classList.toggle('equipment1027',true);caption.hidden=!records.size;
    if(previous&&!records.has(previous))active=null;
    if(!active&&ringPin&&records.has(ringPin.k))active=ringPin.k;
    updateLabels();updateCard();drawSelection();render();
  }
  window.GC500EquipmentView1027={
    refresh:sync,focusGate,
    samplingVisible:ref=>!!models.get(ref)?.model?.show,
    exclude:()=>[...models.values()].map(x=>x.model).filter(Boolean).concat(selectionEntities),
    get state(){return {active,enabled,records:records.size,models:[...models].map(([ref,e])=>({ref,ready:!!e.model?.ready,failed:!!e.failed,error:e.error,quantity:e.spec.quantity,kind:e.spec.kind,stats:e.stats})),pulse:!!pulse};}
  };
  document.addEventListener('visibilitychange',()=>{if(!live()){clearInterval(pulse);pulse=0;}else{sync();startPulse();}});
  reduced.addEventListener?.('change',startPulse);
  window.addEventListener('pagehide',()=>{stopped=true;clearInterval(poll);clearInterval(pulse);for(const e of models.values())dispose(e);clearSelectionGeometry();});
  let attached=false,lastDeclutter=0;
  poll=setInterval(()=>{sync();if(!attached&&sceneReady()){attached=true;viewer.scene.postRender.addEventListener(()=>{const now=performance.now();if(now-lastDeclutter>100){lastDeclutter=now;declutter();}});}},2000);sync();
})();
