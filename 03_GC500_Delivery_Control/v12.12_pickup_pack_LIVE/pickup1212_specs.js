/* Author: Andrew Fisher. Read-only transport facts bound to the selected physical units. */
(function(W){
 'use strict';
 const positive=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
 const value=n=>positive(n)?n.toLocaleString('en-AU',{maximumFractionDigits:3}):'?';
 function describe(info){
  const actual=info?.unit&&info.recordCurrent===true&&info.actualVerified===true?info.record?.actual:null;
  const lines=['Transport size per unit (L x W x H): '+[actual?.lengthMm,actual?.widthMm,actual?.heightMm].map(value).join(' x ')+' mm',
   'Transport weight per unit: '+(positive(actual?.massKg)?value(actual.massKg)+' kg':'not recorded')];
  if(actual){lines.push('Recorded actual'+(actual.model?' | '+actual.model:'')+(actual.configuration?' | '+actual.configuration:''));}
  else{
   const nominal=(info?.facts||[]).find(f=>f.label==='Contract-listed footprint'||f.label==='Nominal description');
   if(nominal?.values?.length)lines.push(nominal.label+': '+nominal.values.join(' | ')+' (not verified transport size).');
  }
  if(!actual||![actual.lengthMm,actual.widthMm,actual.heightMm,actual.massKg].every(positive))lines.push('Confirm missing transport dimensions/weight before allocating the truck. ? = not recorded.');
  return lines;
 }
 function read(rows){
  const run=()=>rows.map(r=>{const a=assetOf(r.key),L=W.Loading931;
   if(!a||!L?.info931||!L?.unitsFor)throw new Error('Loading information is unavailable. Reopen the area and try again.');
   const units=L.unitsFor(a),source=typeof ONHIRE_ROWS!=='undefined'?ONHIRE_ROWS:(typeof DATA!=='undefined'?DATA.rental_on_hire?.rows||[]:[]);
   return {...r,items:r.items.map(it=>{const groups=new Map();
    function add(label,u){const info=L.info931(a,it.type,u,source),lines=describe(info),key=JSON.stringify(lines);if(!groups.has(key))groups.set(key,{labels:[],lines});groups.get(key).labels.push(label);}
    for(const picked of it.units){const unit=units.find(u=>u.physical===true&&u.id===picked.id&&String(u.assetNo||'')===String(picked.number||''));add('Asset '+(picked.number||'not recorded'),unit||null);}
    if(it.unidentified)add(it.unidentified+' without individual asset IDs',null);
    return {...it,specs:[...groups.values()]};
   })};
  });return typeof holdAssets==='function'?holdAssets(run):run();
 }
 const fingerprint=rows=>JSON.stringify(rows.map(r=>[r.key,r.items.map(i=>[i.type,i.specs])]));
 W.MapPickupSpecs1212=Object.freeze({read,describe,fingerprint});
})(window);
