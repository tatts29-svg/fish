# Author: Andrew Fisher
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep as strict_rep
def rep(s,old,new): return strict_rep(s,old,new,"audio974",__file__)

def apply_audio974(s):
    if 'v9.74 — engine load follows tyre spin' in s:
        raise SystemExit('audio974 already applied')

    s=rep(s,"if(!m.go){SND.gear=0;const lamps=clock>.5;rpm=lamps?Math.min(LIMIT,IDLE+(LIMIT-IDLE)*Math.min(1,(clock-.5)/.7))+(clock>1.2?150*Math.sin(clock*2*Math.PI*9):0):IDLE+80*Math.sin(clock*3);thr=lamps?1:.1;", """/* v9.74 — engine load follows tyre spin. Synthetic cross-plane V8; no recording claim.
 Stationary staging holds a modest throttle; the short visible burn controls the extra revs. */
 if(!m.go){SND.gear=0;const burn=Math.max(0,Math.min(1,m.burn||0)),ready=Math.max(0,Math.min(1,(clock-.5)/.8));rpm=IDLE+ready*850+burn*2300+35*Math.sin(clock*3);thr=.12+.16*ready+.42*burn;""")
    s=rep(s,"const since=clock-st.goAt,spin=since<.9?1-since/.9:0;", "const spin=Math.max(0,Math.min(1,Number.isFinite(m.wheelspin)?m.wheelspin:(Number.isFinite(m.spin)?m.spin:(m.burn||0))));")
    s=rep(s,"thr=braking?0:accel?1:.55;", "thr=Number.isFinite(m.throttle)?Math.max(0,Math.min(1,m.throttle)):(braking?0:accel?1:.55);")
    s=rep(s,"const TOP=[72,115,158,205];let g=SND.gear||0;", "const TOP=[65,95,130,170,210,250];let g=Math.max(0,Math.min(5,SND.gear||0));")
    s=rep(s,"while(g>0&&kmh<TOP[g-1]*.90)g--;", "while(g>0&&kmh<TOP[g-1]*.68)g--;")
    s=rep(s,"rpm=IDLE+(LIMIT-IDLE)*f;", "rpm=Math.max(IDLE,Math.min(6600,6500*kmh/hi)); /* steady gear ratio: road speed drives firing rate */")
    s=rep(s,"if(spin>0){rpm=Math.max(rpm,LIMIT-1400*(1-spin));thr=1;}\n return {rpm:rpm,thr:thr,spin:spin,braking:braking};", """if(spin>0&&m.rpm==null)rpm=Math.max(rpm,IDLE+1800+1800*spin);
 rpm=Math.max(IDLE,Math.min(LIMIT,rpm));
 return {rpm:rpm,thr:thr,spin:spin,braking:braking};""")
    s=rep(s,"burst(SND.nodes.sum,ta,1.0,1500,2600,1.2,.9,S,'wheelspin');log('launch (designed)',S,ta);", "log('launch (engine follows simulation)',S,ta);")
    s=rep(s,"const dry=ctx.createGain();dry.gain.value=.045;", "const dry=ctx.createGain();dry.gain.value=.028;")
    s=rep(s,"set(SND.nodes.intakeBp.frequency,500+r.rpm*.22,ta);set(SND.nodes.intakeG.gain,.03+.08*r.thr*(r.rpm/REDLINE),ta);", "set(SND.nodes.intakeBp.frequency,450+r.rpm*.18,ta);set(SND.nodes.intakeG.gain,.012+.045*r.thr*(r.rpm/REDLINE),ta);")
    s=rep(s,"set(SND.nodes.scrubG.gain,.17*scrub,ta,.10);set(SND.nodes.scrubBp.frequency,1050+700*scrub,ta,.10);", "set(SND.nodes.scrubG.gain,.10*scrub,ta,.12);set(SND.nodes.scrubBp.frequency,850+550*scrub,ta,.12);")
    return s
