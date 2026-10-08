# Author: Andrew Fisher.
import sys, os
from pathlib import Path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'toolchain'))
from rep import rep
p=sys.argv[1];s=Path(p).read_text()
assert 'showStability918' not in s and 'drops911' in s
changes=[
("const audio=BC.el=new Audio(take.audio);audio.preload='auto';", "const audio=BC.el=BC.player918||(BC.player918=new Audio());audio.src=take.audio;audio.preload='auto';", 'reuse active race Broadcast player'),
("if(S.bMesh)S.bMesh.draw();if(trees)trees.draw();if(S.dayTreeTrunks)S.dayTreeTrunks.draw();", "const cameraVP918=S.visibilityVP918;S.visibilityVP918=R.vp;\n try{if(S.bMesh)S.bMesh.draw();if(trees)trees.draw();if(S.dayTreeTrunks)S.dayTreeTrunks.draw();}finally{S.visibilityVP918=cameraVP918;}", 'sunlight uses its own visibility matrix'),
("if(S&&(S.lost||document.hidden)){S.last=null;S.needsRender=true;return;}", "if(S&&S.gl&&S.gl.isContextLost()){S.contextState792=G.captureContextState792(S);S.lost=true;}\n if(S&&(S.lost||document.hidden)){S.last=null;S.needsRender=true;return;}", 'stop GPU uploads before context-loss event'),
("if (is3dBack(back) && G.failed && !G.S)", "if(is3dBack(back)&&G.S&&G.S.lost)return {which:'3d',why:'the graphics context was lost; restoring the scene'};\n if (is3dBack(back) && G.failed && !G.S)", 'immediate context-loss explanation'),
("const dist=V.len(V.sub(cam.eye,cam.tgt)),fog=", "S.visibilityVP918=VP;\n const dist=V.len(V.sub(cam.eye,cam.tgt)),fog=", 'camera visibility matrix'),
("+ ' · v9.11'; /* v8.19", "+ ' · v9.18'; /* v8.19", 'release footer'),
("if(!S.trackDetail781)G.installTrackDetail781(S);\n if(!S.architecture781&&S.architecture781Source)G.installArchitecture781(S);\n if(!S.vegetation781&&S.vegetation781Source)G.installVegetation781(S);", "if(!S.trackDetail781){G.installTrackDetail781(S);return;}\n if(!S.architecture781&&S.architecture781Source){G.installArchitecture781(S);return;}\n if(!S.vegetation781&&S.vegetation781Source){G.installVegetation781(S);return;}", 'spread track detail preparation across frames'),
("const a = new Audio(t.audio);", "const a = BC.player918 || (BC.player918 = new Audio());\n a.src=t.audio;", 'reuse gesture-unlocked broadcast player'),
("S.quality=Q;S.needsRender=true;", "S.quality=Q;S.needsRender=true;S.guardAfter918=performance.now()+6000;", 'quality change warmup'),
('playing: false, loop: false, launch:', 'playing: false, loop: true, launch:', 'continuous presentation'),
("if(touchFirst)return 'high'; /* a tablet */\n if(px>5.0e6)return 'balanced';\n if(px>2.6e6)return 'high';\n return 'ultra';\n }catch(e){return 'high';}","return 'balanced'; /* stable opening on every screen; manual detail remains available */\n }catch(e){return 'balanced';}", 'bounded opening quality'),
("else{G.failed='frame rate';S.qualityStep='handed back to the flat circuit';S.unmount();}","else{S.qualityStep='performance detail';S.needsRender=true;}", 'retain scene at minimum quality'),
('const gen=window.__gc3dGen=', 'let guardAfter918=performance.now()+6000;\n const gen=window.__gc3dGen=', 'mount warmup'),
('if(dtm>STALL_MS){stalled++;', 'if(performance.now()<Math.max(guardAfter918,S.guardAfter918||0)){stalled=0;slow=0;return;}\n if(dtm>STALL_MS){stalled++;', 'ignore setup stalls'),
('S.stalledAt=Math.round(dtm);if(!G.noGuard)G.stepDown();', 'S.stalledAt=Math.round(dtm);if(!G.noGuard){G.stepDown();guardAfter918=performance.now()+6000;}', 'rung cooldown'),
('if(G.shouldReduceQuality792(S)&&!G.noGuard){slow++;if(slow>=2){slow=0;G.stepDown();}}else slow=0;', 'if(G.shouldReduceQuality792(S)&&!G.noGuard){slow++;if(slow>=3){slow=0;G.stepDown();guardAfter918=performance.now()+6000;}}else slow=0;', 'sustained quality samples'),
("SND.ctx.state==='suspended'&&!isOffline()", "(SND.ctx.state==='suspended'||SND.ctx.state==='interrupted')&&!isOffline()", 'resume interrupted audio'),
('function render(){ const kept840', 'let showPendingRender918=false;\nfunction render(){ if(document.body.classList.contains(\'showing\')){showPendingRender918=true;return;} const kept840', 'defer background redraw'),
("document.body.classList.remove('showing');\n (SHOW.inert", "document.body.classList.remove('showing');\n if(window.GC3D){for(const k of ['_raceCarModels','_plantModels','_vmsModels','_looModels','_rollParts','_raceCarDecals','_vmsTex'])delete window.GC3D[k];}\n if(showPendingRender918){showPendingRender918=false;setTimeout(render,0);}\n (SHOW.inert", 'release caches and catch up'),
("changed(false); tick = requestAnimationFrame(watch);", "if(!document.body.classList.contains('showing'))changed(false); tick = requestAnimationFrame(watch);", 'pause underlying map layout')]
for old,new,label in changes:s=rep(s,old,new,label,p)
s=rep(s,'function showRender(){','function showRender(){\n /* showStability918: hidden figures are rebuilt once when the viewer asks for them. */\n const focus918=document.getElementById(\'showcase\');\n if(focus918&&focus918.classList.contains(\'car-focus\')){showSyncControls();showSchedule();return;}', 'skip invisible figure work',p)
s=rep(s, "showDriveControls(which); if (window.GC3D", "showDriveControls(which); if(!showCarFocusGet())showRender(); if (window.GC3D", 'refresh figures on request',p)
src=Path(__file__).with_name('showcase918_src.js').read_text()
anchor="if(typeof module!=='undefined'&&module.exports)module.exports=Workers911;\n\n</script>\n</body></html>"
s=rep(s,anchor,anchor.replace('</body>', '<script>\n'+src+'\n</script>\n</body>'), 'nearby detail submission',p)
Path(p).write_text(s)
