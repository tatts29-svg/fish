"""Author: Andrew Fisher. Retain 3D choice and daylight colour when reducing GPU cost."""
import hashlib,sys
from pathlib import Path
HERE=Path(__file__).resolve().parent
sys.path.insert(0,str(HERE.parent/'toolchain'))
from rep import rep

def patch(html):
    if 'ShowcaseStable1175' in html: raise ValueError('v11.75 already applied')
    if hashlib.sha256(html.encode()).hexdigest()!=(HERE/'BASE_SHA256').read_text().strip():raise ValueError('Wrong live base for v11.75')
    for oldname,newname in [('gpu1174_src.js','gpu1175_src.js'),('quick1174_src.js','quick1175_src.js')]:
        html=rep(html,(HERE.parent/'v11.74_showcase_playback_LIVE'/oldname).read_text(),(HERE/newname).read_text(),newname,'page')
    start=html.index('G.render=function(){\n const S=G.S,gl=S.gl,cv=S.cv,T=S.tune,pr=S.prog;')
    end=html.index('\n/* A camera and playback strip',start)
    old=html[start:end]
    if hashlib.sha256(old.encode()).hexdigest()!=(HERE/'RENDER_BASE_SHA256').read_text().strip():raise ValueError('Core render changed')
    html=rep(html,old,(HERE/'render1175_src.js').read_text(),'retain colour pass without glow','page')
    html=rep(html,'vec3 b=texture(uBloom,vUV).rgb*.62+texture(uBloom2,vUV).rgb*.85;', 'vec3 b=uK>0.?(texture(uBloom,vUV).rgb*.62+texture(uBloom2,vUV).rgb*.85):vec3(0.);','skip disabled glow texture samples','page')
    html=rep(html,'const enabled=G.fullLap788.enabled&&S.bloom!==false&&!S.fullLapFailed788;', 'const enabled=G.fullLap788.enabled&&!S.fullLapFailed788; // Colour conversion remains available without glow.','retain daylight detail across quality changes','page')
    names="['crowdMesh','dayTrees','dayTreeTrunks','trees','bMesh','trackConcrete','trackFencePosts','trackFenceWire','trackScuffs','dayRoadShoulder','dayRoadSurface','cityDetail','standDecor','standMesh','pitLane','pitWallMesh']"
    html=rep(html,"const names=['crowdMesh','dayTrees','dayTreeTrunks','trees'];",'const names='+names+';','cull off-camera static circuit meshes','page')
    html=rep(html,"for(const name of ['crowdMesh','dayTrees','dayTreeTrunks','trees'])yield* G.visibilitySteps1157(G.S[name]);",'for(const name of '+names+')yield* G.visibilitySteps1157(G.S[name]);','prepare added culling cooperatively','page')
    html=rep(html,'try{if(S.bMesh)S.bMesh.draw();if(trees)trees.draw();if(S.dayTreeTrunks)S.dayTreeTrunks.draw();}finally{S.visibilityVP918=cameraVP918;}', 'try{if(S.bMesh)S.bMesh.draw();if(trees)trees.draw();if(S.dayTreeTrunks)S.dayTreeTrunks.draw();','start shadow-view culling scope','page')
    html=rep(html,'if(detail781)for(const batch of S.detail781ShadowMeshes||[])if(batch&&batch.draw)batch.draw();\n gl.disable(gl.POLYGON_OFFSET_FILL);', 'if(detail781)for(const batch of S.detail781ShadowMeshes||[])if(batch&&batch.draw)batch.draw();\n }finally{S.visibilityVP918=cameraVP918;}\n gl.disable(gl.POLYGON_OFFSET_FILL);','restore camera culling after all shadow casters','page')
    return rep(html,"+' · v11.74'; /* v8.19 release922","+' · v11.75'; /* v8.19 release922",'footer','page')
if __name__=='__main__':
    p=Path(sys.argv[1]);p.write_text(patch(p.read_text()));print('v11.75 stable 3D choice and daylight colour applied')
