#!/usr/bin/env python3
"""v6.64 - PEOPLE IN THE CROWD, FIREWORKS THAT SPELL IT, AND THE VMS SIDE-ON (Andrew Fisher, 26 Sep 2026: "I want crowd as in
people, in the scenes, spectators ... VMS make sure its sign is on the side ... nights you could even add fireworks, and when
they splatter in the view it spells Coates GC500 2026 - highlight that scene when it happens, camera moves to view it by far").

  * Spectators are solid figures (crowd_fw_v664.js G.meshPerson) in their own batch, drawn in the flat shader's new mode 12,
    which bounces the cheering ones on their own phase. The stands, the fence and the marshals use them (up to 6,500; past
    that the old capsule stays). New raised terraces, three rows deep, behind the fence at the eight sharpest corners and down
    both sides of the grid straight (terrace_v664.js), so the crowd is seen over the concrete from the track.
  * Fireworks after dark every fifty seconds: shells climb, burst, and the stars settle into COATES GC500 2026 in the sky;
    the camera cuts to a far shot framing the words over the skyline while they burst, then back. Not by day, not under
    reduced motion.
  * The VMS board is turned side-on and lit on both faces, each reading the right way round; the towing chase camera sits
    wider so it sees the face.

  python3 patch_v664.py <page.html> <bundle gc3d_bundle.js> <crowd_fw_v664.js> <terrace_v664.js>
"""
import os, re, sys
page, bundle, cfw, ter = sys.argv[1:5]
CFW = open(cfw, encoding='utf-8').read(); TER = open(ter, encoding='utf-8').read()

def rep(text, old, new, what, path):
    pat = '\n'.join('[ \t]*' + r'\s+'.join(re.escape(tok) for tok in l.split()) if l.split() else '[ \t]*' for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what} in {os.path.basename(path)}: expected once, found {len(ms)}: {old[:90]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

def slice_rep(text, a_mark, b_mark, new, what, path, include_end=False):
    a = text.find(a_mark)
    if a < 0 or text.find(a_mark, a + 1) >= 0: sys.exit(f'{what}: start marker not unique/found in {os.path.basename(path)}')
    b = text.find(b_mark, a)
    if b < 0: sys.exit(f'{what}: end marker not found')
    if include_end: b += len(b_mark)
    return text[:a] + new + text[b:]

VMS = """/* v6.64 - the board turned side-on (Andrew: make sure its sign is on the side), lit on both faces, each read the right way */
  const bd=group('board',BK),BY0=.98,BY1=1.90,BXc=-.20,BW=.72,BZ0=.045,XA=BXc-BW,XB=BXc+BW;
  box(bd,XA,XB,BY0,BY1,-BZ0,BZ0);box(group('board rim',BK),XA-.01,XB+.01,BY1-.01,BY1+.01,-BZ0-.01,BZ0+.01);
  box(group('board frame',OR),XA,XB,BY0-.035,BY0,-BZ0-.006,BZ0+.006);
  const m=.04,fz=BZ0+.004;
  add(group('LED face right','ledAmber',{vmsFace:true}),[[XA+m,BY1-m,fz],[XB-m,BY1-m,fz],[XB-m,BY0+m,fz],[XA+m,BY0+m,fz]],[0,1,2,0,2,3],[[0,0],[1,0],[1,1],[0,1]],[0,0,1]);
  add(group('LED face left','ledAmber',{vmsFace:true}),[[XB-m,BY1-m,-fz],[XA+m,BY1-m,-fz],[XA+m,BY0+m,-fz],[XB-m,BY0+m,-fz]],[0,1,2,0,2,3],[[0,0],[1,0],[1,1],[0,1]],[0,0,-1]);
  const sp=group('solar panel','solar');quad(sp,[XA+.12,BY1+.10,-.30],[XB-.12,BY1+.10,-.30],[XB-.12,BY1+.24,.30],[XA+.12,BY1+.24,.30],[0,1,-.45]);
  box(st,BXc-.30,BXc+.30,BY1,BY1+.06,-.03,.03);tube(st,[BXc-.25,BY1+.03,0],[BXc-.25,BY1+.15,.10],.012,6);tube(st,[BXc+.25,BY1+.03,0],[BXc+.25,BY1+.15,.10],.012,6);"""

EDITS = [
 ('flat VS bounces mode 12',
  "void main(){vec4 p=uVP*vec4(aPos,1.);gl_Position=p;vCol=aCol;vUV=aUV;vW=p.w;vP=aPos.xz;vWorld=aPos;}",
  "uniform float uMode;uniform float uTime;\nvoid main(){vec3 q=aPos;if(uMode>11.5&&uMode<12.5){float b=max(0.,sin(uTime*7.+aUV.x));q.y+=aUV.y*b*b;}   /* v6.64 - the crowd bounces */\n vec4 p=uVP*vec4(q,1.);gl_Position=p;vCol=aCol;vUV=aUV;vW=p.w;vP=q.xz;vWorld=q;}"),
 ('flat FS mode 12 is plain', "if(uMode<.5){", "if(uMode<.5||uMode>11.5){"),
 ('crowd batch', "const pp=S.people=new G.LineBatch(gl,S.quad,8192,false),",
  "const cm=S.crowdMesh=new G.MeshBatch(gl,[3,4,2],false);cm.people=0;   /* v6.64 - the spectators as figures */\n  const pp=S.people=new G.LineBatch(gl,S.quad,8192,false),"),
 ('person is a figure',
  "pp.seg(foot,neck,shirt,shirt,.052*s,.046*s,.9);pp.seg(head,head,skin,skin,.048*s,.048*s,.9);",
  "if(G.meshPerson&&S.crowdMesh&&S.crowdMesh.people<6500)G.meshPerson(S,S.crowdMesh,foot,rnd,s,shirt,skin);else{pp.seg(foot,neck,shirt,shirt,.052*s,.046*s,.9);pp.seg(head,head,skin,skin,.048*s,.048*s,.9);}"),
 ('crowd upload',
  "mesh.upload();ed.upload();cw.upload();pp.upload();dec.upload();",
  "mesh.upload();ed.upload();cw.upload();pp.upload();dec.upload();S.crowdMesh.upload();"),
 ('crowd draw',
  "if(S.standDecor&&S.standDecor.ni){flat(0,L.mat.kerb);S.standDecor.draw();}",
  "if(S.standDecor&&S.standDecor.ni){flat(0,L.mat.kerb);S.standDecor.draw();}\n  if(S.crowdMesh&&S.crowdMesh.ni){flat(12,L.day?null:{tint:[.46,.48,.56],lift:[.004,.004,.006]});S.crowdMesh.draw();}   /* v6.64 - the crowd, bouncing */"),
 ('fireworks each frame',
  "gl_.clear();co.clear();ad.clear();dc.clear();",
  "gl_.clear();co.clear();ad.clear();dc.clear();\n  if(G.fireworksFrame)G.fireworksFrame(S,ad,co);   /* v6.64 - fireworks after dark */"),
 ('fireworks drawn with their own opacity',
  "if(L.lines.dynAdd>0){lines(true,L.lines.dynAdd,false,.0004);S.dynAdd.draw();}",
  "if(L.lines.dynAdd>0){lines(true,L.lines.dynAdd,false,.0004);S.dynAdd.draw();}\n  if(S.fwLines&&S.fwLines.n){lines(true,1,false,0);gl.uniform1f(pr.line.u.uAlpha,1);gl.blendEquationSeparate(gl.FUNC_ADD,gl.FUNC_ADD);gl.blendFuncSeparate(gl.ONE,gl.ONE,gl.ONE,gl.ONE);S.fwLines.draw();}   /* v6.64 - fireworks */"),
 ('fireworks shot sound', "const SOUND_OF={grid:1,", "const SOUND_OF={fireworks:2,grid:1,"),
 ('fireworks take the camera',
  "S.shotI=SOUND_OF[name]",
  "/* v6.64 - the fireworks take the picture while they burst: a cut out to the far shot, and a cut back */\n  if(S.fw&&S.fw.cam&&G.fireworksShot){if(!S._fwCut){S._fwCut=true;S.camBase=null;}name='fireworks';cur=G.fireworksShot(S);}\n  else if(S._fwCut){S._fwCut=false;S.camBase=null;}\n  S.shotI=SOUND_OF[name]"),
 ('towing chase sees the side',
  "if(name==='chase')return {eye:behind(9.4+.8*sp,3.3,side*2.4),",
  "if(name==='chase')return {eye:behind(7.6+.8*sp,2.7,side*4.3),"),
]

for path in [bundle, page]:
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    t = slice_rep(t, "const bd=group('board',BK)", "tube(st,[BX1,BY1,.5],[BX1+.2,BY1+.2,.5],.012,6);", VMS, 'vms board', path, include_end=True)
    t = slice_rep(t, '/* 6. the crowd along the fence', 'stats.corners=', TER.lstrip() + '  ', 'terraces', path)
    if t.count('G.inPoly=function(p,P){') != 1: sys.exit('inPoly anchor')
    t = t.replace('G.inPoly=function(p,P){', CFW + 'G.inPoly=function(p,P){', 1)
    for what, old, new in EDITS: t = rep(t, old, new, what, path)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))
