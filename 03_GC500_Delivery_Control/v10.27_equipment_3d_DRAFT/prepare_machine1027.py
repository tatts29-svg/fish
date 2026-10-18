"""Author: Andrew Fisher. Exact-source 3D viewer and bridge, retaining all other media."""
from pathlib import Path
import hashlib, json, sys
HERE=Path(__file__).resolve().parent
BASE={
 'poc3d/index.html':'9ec808d7c60035dbf0161a574316c8bd5a5cd3bdaaa9f92b67467f6c44288518',
 'explorer/explorer-merge.js':'06dbdafb5338e7498e605852918fe2783769d144beab32ea2107dabf703ca0f0',
 'explorer/index.html':'653458ff38a28b0749bdef4b8427625a1f054f77fa5b11669574d51c1e972f19'
}
def sha(b):return hashlib.sha256(b).hexdigest()
def replace(s,a,b):
    if s.count(a)!=1:raise ValueError('Expected one anchor: '+a[:90])
    return s.replace(a,b)
def prepare(source,target):
    files={}
    for name,digest in BASE.items():
        raw=(source/name).read_bytes()
        if sha(raw)!=digest:raise ValueError('Source changed: '+name)
        files[name]=raw.decode()
    for name in ['equipment_geometry1027.js','equipment_layout1027.js','equipment_viewer1027.js']:
        files['poc3d/'+name]=(HERE/name).read_text()
    viewer=files['poc3d/index.html']
    viewer=replace(viewer,'<title>GC500 3D Proof</title>','<title>GC500 3D Equipment Map</title>')
    viewer=replace(viewer,"const exclude = pinEntities.slice(); if (RING) exclude.push(RING);", "const exclude = [pinBB,pinLB,...pinEntities]; if (RING) exclude.push(RING); if(window.GC500EquipmentView1027)exclude.push(...window.GC500EquipmentView1027.exclude());")
    viewer=replace(viewer,'for (const r of pinEntities) { if (!r.show) continue;', 'for (const r of pinEntities) { if (!r.l.show && !window.GC500EquipmentView1027?.samplingVisible?.(r._gc.k)) continue;')
    viewer=replace(viewer,'</body>', ''.join('<script src="'+name+'?v='+sha(files['poc3d/'+name].encode())[:12]+'"></script>\n' for name in ['equipment_geometry1027.js','equipment_layout1027.js','equipment_viewer1027.js'])+'</body>')
    files['poc3d/index.html']=viewer
    merge=files['explorer/explorer-merge.js']
    merge=replace(merge,'let wait3dTimer813 = 0, load3dEpoch813 = 0;','let wait3dTimer813 = 0, load3dEpoch813 = 0, last3dCode1027 = null;')
    merge=replace(merge,'if (ready3d) sync3d(!!lastCode);','if (ready3d) sync3d(lastCode !== last3dCode1027); /* Preserve the camera unless the 2D selection changed. */')
    merge=replace(merge,'if (!in3d) return; in3d = false;', 'if (!in3d) return; last3dCode1027 = lastCode; in3d = false;')
    merge=replace(merge,"  const api3d = () =>", '''  /* The 3D view reads the same dashboard projection as the rest of the job. */
  window.GC500EquipmentBridge1027 = {
    snapshot: refs => { const h=host(); return h && h.GC500Equipment1027 ? h.GC500Equipment1027.snapshot(llOf,refs) : {available:false,items:[]}; },
    catalogue: () => { const h=host(); return h && h.GC500Equipment1027 ? h.GC500Equipment1027.catalogue() : []; },
    open: (ref,action) => { const h=host(); return !!(h && h.GC500Equipment1027 && h.GC500Equipment1027.open(ref,action)); },
    active: () => in3d,
    cardVisible: value => document.body.classList.toggle('equipment-card1027', !!value),
    clear: () => { if(window.GC500Explorer)window.GC500Explorer.clearPick813(); }
  };
  const equipmentStyle=document.createElement('style');
  equipmentStyle.textContent='body.in3d.equipment-card1027 #xcard{display:none!important}';
  document.head.appendChild(equipmentStyle);
  const api3d = () =>''')
    merge=replace(merge,"frame.src = '../poc3d/index.html?embed=1&back='", "frame.src = '../poc3d/index.html?v="+sha(viewer.encode())[:12]+"&embed=1&back='")
    files['explorer/explorer-merge.js']=merge
    files['explorer/index.html']=replace(files['explorer/index.html'],'explorer-merge.js?v='+BASE['explorer/explorer-merge.js'][:12],'explorer-merge.js?v='+sha(merge.encode())[:12])
    evidence={'author':'Andrew Fisher','files':{}}
    for name,text in files.items():
        p=target/name;p.parent.mkdir(parents=True,exist_ok=True);b=text.encode();p.write_bytes(b)
        evidence['files'][name]={'base':BASE.get(name),'sha256':sha(b),'bytes':len(b)}
    (target/'source-bound.json').write_text(json.dumps(evidence,indent=2)+'\n')
    print('Prepared',len(files),'files')
if __name__=='__main__':prepare(*map(Path,sys.argv[1:3]))
