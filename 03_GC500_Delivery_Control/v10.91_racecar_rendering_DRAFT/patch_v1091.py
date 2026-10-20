"""Author: Andrew Fisher. Bounded car rendering changes; exact base required.
Usage: patch_v1091.py INPUT [OUTPUT] [--development]
Development is pinned to verified v10.89. Publication requires verified v10.90 base.json.
"""
from pathlib import Path
import argparse, hashlib, json, sys
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent / 'toolchain'))
from rep import rep
DEV_SHA = '2254fce73cefb76fdecb371509d7d37e1873d394d77193975842288f14ed3eae'

def patch(text, path='page.html', development=False):
    if 'compactRaceCarParts1091' in text:
        raise ValueError('v10.91 already applied')
    base = {'version':'v10.89','sha256':DEV_SHA} if development else json.loads((HERE/'base.json').read_text())
    if base['version'] != ('v10.89' if development else 'v10.90'):
        raise ValueError('Unexpected predecessor version')
    if hashlib.sha256(text.encode()).hexdigest() != base['sha256']:
        raise ValueError('Exact verified live predecessor SHA-256 mismatch')
    def change(old,new,label):
        nonlocal text
        text=rep(text,old,new,label,path)
    change("' · "+base['version']+"'", "' · v10.91'", 'release version')
    change("if(!state||!S.pose){gl.uniform1i(u.uReflectCount,0);return;}",
           "if(!state||!S.pose||S.reflOff===true){if(state){state.activeCount=0;state.clock=null;}gl.uniform1i(u.uReflectCount,0);return;}",
           'honour adaptive car reflection-off state')
    change("else if(S.reflOff!==true&&Q.name!=='balanced'){S.reflOff=true;S.qualityStep='reflections off';if(G.setQuality)G.setQuality('balanced',true);}",
           "else if(S.reflOff!==true){S.reflOff=true;S.qualityStep='reflections off';if(G.setQuality)G.setQuality('balanced',true);}",
           'allow default Balanced to shed facade rays')
    change("return Q.name==='ultra'||(Q.name!=='balanced'&&S.reflOff!==true)||(S.o.ss||1)>G.smoothness792.minDetailScale+.001;",
           "return Q.name==='ultra'||S.reflOff!==true||(S.o.ss||1)>G.smoothness792.minDetailScale+.001;", 'recognise restored Balanced reflection quality budget')
    change("const qualityFirst=Q.name==='ultra'||(Q.name!=='balanced'&&S.reflOff!==true);",
           "const qualityFirst=Q.name==='ultra'||S.reflOff!==true;", 'shed reflection rays before pixel detail')
    change("G.syncRaceCarQuality=function(S){", (HERE/'car_batches1091.js').read_text()+"\nG.syncRaceCarQuality=function(S){", 'car draw batching helper')
    change("const model=kind==='car'?G.raceCarModel(level):G.plantModel(kind,level),parts=model.parts.slice().sort((a,b)=>(a.material==='glass')-(b.material==='glass'));\n if(kind==='car'&&G.raceCarDecals)parts.push(...G.raceCarDecals());",
           "const model=kind==='car'?G.raceCarModel(level):G.plantModel(kind,level);let parts=model.parts.slice().sort((a,b)=>(a.material==='glass')-(b.material==='glass'));\n if(kind==='car'&&G.raceCarDecals)parts.push(...G.raceCarDecals());\n const sourceParts1091=parts.length;if(kind==='car')parts=G.compactRaceCarParts1091(parts);", 'batch compatible car parts only')
    change("S.raceCarStats={parts:parts.length,triangles,vertices,gpuBytes,quality:level};",
           "S.raceCarStats={parts:parts.length,sourceParts1091,triangles,vertices,gpuBytes,quality:level};", 'report preserved geometry and reduced car draws')
    # Bound texture sampling to4x, retaining trilinear fallback on unsupported devices.
    change("textures.set(gl,texture);return texture;\n};\nG.raceCarLiveryInfo=",
           "const aniso=gl.getExtension('EXT_texture_filter_anisotropic');\n if(aniso){const maximum=gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT);if(Number.isFinite(maximum)&&maximum>1)gl.texParameterf(gl.TEXTURE_2D,aniso.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(4,maximum));}\n textures.set(gl,texture);return texture;\n};\nG.raceCarLiveryInfo=", 'retain angled car lettering clarity')
    # Derivatives are computed before any divergent paint branch.
    change("vec3 base=uColor;float rough=uRough,metal=uMetal,alpha=1.;\n if(uKind<1.5){",
           "vec3 base=uColor;float rough=uRough,metal=uMetal,alpha=1.;\n float stripeAA1091=max(fwidth(vLocal.y-.095-.063*clamp((.60-vLocal.x)/1.35,0.,1.)),.00001);\n float lowerAA1091=max(fwidth(vLocal.y-.092-.020*clamp((vLocal.x+.4)/.9,0.,1.)),.00001);\n float accentAA1091=max(fwidth(abs(vLocal.z)),.00001);\n if(uKind<1.5){", 'stable car livery derivative footprints')
    change("float vehicleD800(float nh,float rough){", "float vehicleBand1091(float x,float lo,float hi,float aa){return smoothstep(lo-aa,lo+aa,x)*(1.-smoothstep(hi-aa,hi+aa,x));}\nfloat vehicleD800(float nh,float rough){", 'anti-aliased livery band helper')
    change("if(y>sweep-.023&&y<sweep-.006)base=orange;\n if(y>sweep&&y<sweep+.013)base=ivory;", "base=mix(base,orange,vehicleBand1091(y-sweep,-.023,-.006,stripeAA1091));\n base=mix(base,ivory,vehicleBand1091(y-sweep,0.,.013,stripeAA1091));", 'smooth side livery boundaries')
    change("if(x>-.43&&x<.52&&y>lower&&y<lower+.006)base=ivory;", "if(x>-.43&&x<.52)base=mix(base,ivory,vehicleBand1091(y-lower,0.,.006,lowerAA1091));", 'smooth fine sill stripe')
    change("if(x>.32&&x<.98&&y>.285&&N.y>.45&&z>.302&&z<.307)base=vec3(.83,.57,.004);", "if(x>.32&&x<.98&&y>.285&&N.y>.45)base=mix(base,vec3(.83,.57,.004),vehicleBand1091(z,.302,.307,accentAA1091));", 'smooth bonnet accent')
    # Exact final decal/emissive colours never use the expensive BRDF or facade lookup.
    change("if(uKind>7.5&&uKind<9.5){if(dot(normalize(vNormal),V)<=0.)discard;alpha=texture(uAtlas,vUV).r;if(alpha<.015)discard;}\n // Separate coated machines",
           "if(uKind>7.5&&uKind<9.5){if(dot(normalize(vNormal),V)<=0.)discard;alpha=texture(uAtlas,vUV).r;if(alpha<.015)discard;}\n if(uKind>7.5){\n  float decalLight1091=clamp(dot(N,L),0.,1.);vec3 decalColour1091=base*(.65+.35*decalLight1091)*mix(.65,1.,uDay);\n  if(uKind>8.5&&uKind<9.5)decalColour1091=uColor*mix(1.25,2.4,1.-uDay);\n  if(uKind>9.5)decalColour1091=uColor*(.30+2.6*uBrake)*mix(.9,1.7,1.-uDay);\n  decalColour1091*=.70+.30*smoothstep(.015,.18,vLocal.y);\n  alpha*=uOpacity*(1.-smoothstep(uFog.x,uFog.y,vDistance));o=vec4(decalColour1091*alpha,alpha);return;\n }\n // Separate coated machines", 'skip overwritten decal and emissive lighting work')
    return text

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('input',type=Path);parser.add_argument('output',type=Path,nargs='?');parser.add_argument('--development',action='store_true')
    args=parser.parse_args();output=args.output or args.input
    result=patch(args.input.read_text(),str(args.input),args.development);output.parent.mkdir(parents=True,exist_ok=True);output.write_text(result)
    print(json.dumps({'sha256':hashlib.sha256(result.encode()).hexdigest(),'bytes':len(result.encode()),'development':args.development}))
