#!/usr/bin/env python3
"""Author: Andrew Fisher. Retain exact ownership of nominal pit render ranges."""
from pathlib import Path
import sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep

def apply(text, path):
    if 'const pitRanges794=' in text:
        raise SystemExit('v7.94 pit range tagging already applied')
    if 'G.photoRefinement792=' not in text:
        raise SystemExit('v7.94 pit range tagging requires v7.92')
    # All tags are CPU metadata only: the original emitter, vertex/index ordering,
    # source lists, random sequence, deconfliction and camera height map stay intact.
    pairs = [
      (' S.beacons=[];let count=0;\n list.forEach(b=>{',
       ' const pitRanges794={mesh:[],edges:[]};\n S.beacons=[];let count=0;\n list.forEach((b,sourceIndex794)=>{'),
      ('const rect=[Math.min(sa,sb),Math.max(sa,sb),y0,h],entry={rect,a,dx,dz,sa,sb,nx,nz,sign,u,hash,glow,area:len*(h-y0)};',
       'const rect=[Math.min(sa,sb),Math.max(sa,sb),y0,h],entry={rect,a,dx,dz,sa,sb,nx,nz,sign,u,hash,glow,area:len*(h-y0),pit794:b.pit?sourceIndex794:null};'),
      (' roofs.add(roofKey);\n const base=mesh.nv;',
       ' roofs.add(roofKey);\n const roofStart794=mesh.i.length;\n const base=mesh.nv;'),
      ('const t=G.earclip(P);for(let k=0;k<t.length;k+=3)mesh.tri(base+t[k],base+t[k+1],base+t[k+2]);\n }else stats.duplicateRoofs++;',
       'const t=G.earclip(P);for(let k=0;k<t.length;k+=3)mesh.tri(base+t[k],base+t[k+1],base+t[k+2]);\n if(b.pit)pitRanges794.mesh.push({sourceIndex:sourceIndex794,start:roofStart794,end:mesh.i.length,kind:"roof"});\n }else stats.duplicateRoofs++;'),
      (' const tall=Math.min(1,h/16),ec=',
       ' const edgeStart794=edges.n;\n const tall=Math.min(1,h/16),ec='),
      (' if(h>20)S.beacons.push([mx,h+.4,mz,hash]);',
       ' if(b.pit)pitRanges794.edges.push({sourceIndex:sourceIndex794,start:edgeStart794,end:edges.n});\n if(h>20)S.beacons.push([mx,h+.4,mz,hash]);'),
      (' pieces.forEach(p=>{\n const a=vertex(p[0],p[2]),b=vertex(p[1],p[2]),c=vertex(p[1],p[3]),d=vertex(p[0],p[3]);',
       ' pieces.forEach(p=>{\n const wallStart794=mesh.i.length;\n const a=vertex(p[0],p[2]),b=vertex(p[1],p[2]),c=vertex(p[1],p[3]),d=vertex(p[0],p[3]);'),
      (' covered.push(p);stats.emittedWallFaces++;stats.renderedWallArea+=(p[1]-p[0])*(p[3]-p[2]);',
       ' if(face.pit794!==null)pitRanges794.mesh.push({sourceIndex:face.pit794,start:wallStart794,end:mesh.i.length,kind:"wall"});\n covered.push(p);stats.emittedWallFaces++;stats.renderedWallArea+=(p[1]-p[0])*(p[3]-p[2]);'),
      (' stats.sourceBuildings=count;S.buildingGeometry=stats;\n mesh.upload();edges.upload();S.bMesh=mesh;S.bEdges=edges;S.bCount=count;',
       ' stats.sourceBuildings=count;S.buildingGeometry=stats;\n mesh.upload();edges.upload();S.bMesh=mesh;S.bEdges=edges;S.bCount=count;S.pitShellRanges794=pitRanges794;'),
    ]
    for n,(old,new) in enumerate(pairs):
        text=rep(text,old,new,'Exact pit render ownership '+str(n+1),path)
    return text

if __name__ == '__main__':
    path=Path(sys.argv[1]);path.write_text(apply(path.read_text(),str(path)))
