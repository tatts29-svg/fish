# Author: Andrew Fisher. Strict source-only showcase dynamics patch.
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep as shared_rep

def rep(s, old, new):
    return shared_rep(s, old, new, "Showcase dynamics974", __file__)

def apply_dynamics974(s):
    if 'v9.74 — PROGRESSIVE TYRE LOAD' in s:
        raise ValueError('Dynamics v9.74 already applied')
    s=rep(s,'slipMax:.38, slipGain:23,','slipMax:.175, slipGain:23,')
    s=rep(s,'const path=Math.atan2(d[1],d[0]),hd=path+m.slip;','const path=Math.atan2(d[1],d[0]),hd=path+Math.atan2(m.latV||0,Math.max(.5,m.v))+m.slip;')
    s=rep(s,'m.lat+=(lineT-m.lat)*(1-Math.exp(-dt*T.lineResponse));','''/* v9.74 — Follow a bounded racing line with continuous lateral velocity. */
 const latWant=(lineT-m.lat)*T.lineResponse,latLimit=Math.max(.05,m.v*.035);
 const latTarget=Math.max(-latLimit,Math.min(latLimit,latWant));
 m.latV=(m.latV||0)+(latTarget-(m.latV||0))*(1-Math.exp(-dt*5));
 m.lat+=m.latV*dt;
 if(Math.abs(m.lat)>maxLat){m.lat=Math.sign(m.lat)*maxLat;m.latV=0;}''')
    old='const slipT=(S.calmDrive||!go)?0:Math.max(-T.slipMax,Math.min(T.slipMax,k*T.slipGain*Math.min(1,m.v/(T.vmax*.50))*(onPower?1:.22)));'
    new='''/* v9.74 — PROGRESSIVE TYRE LOAD: grip first, a caught rear step under exit power. */
 const latLoad=Math.min(1.2,Math.abs(k)*m.v*m.v/Math.max(.001,T.aLat));
 const powerLoad=onPower?Math.min(1,Math.max(0,acc)/Math.max(.001,T.acc*1.25)):0;
 const tyreLoad=Math.max(0,Math.min(1,(latLoad-.22)/.68));
 const slipT=(S.calmDrive||!go)?0:Math.sign(k)*Math.min(T.slipMax,
 .038*tyreLoad+T.slipMax*.72*powerLoad*tyreLoad);
 m.tyreLoad=tyreLoad;
 m.wheelspin=(!go?m.burn:Math.max(0,Math.min(1,(Math.abs(m.slip)-.072)/.10))*powerLoad);'''
    s=rep(s,old,new)
    s=rep(s,'const onPower=acc>2.5&&m.v<T.vmax*.90&&!S.calmDrive;', 'const onPower=acc>T.acc*.35&&m.v<T.vmax*.90&&!S.calmDrive;')
    s=rep(s,'const kS=onPower?30:10,cS=onPower?7.0:5.6;','const kS=onPower?42:32,cS=onPower?11:10;')
    s=rep(s,'(Math.abs(m.slip)-T.markSlip)/Math.max(.02,T.driftFull)','(Math.abs(m.slip)-.072)/.10')
    s=rep(s,'if(!S.calmDrive&&Math.abs(m.slip)>.17)','if(!S.calmDrive&&Math.abs(m.slip)>.12)')
    s=rep(s,'Math.max(-.07,Math.min(.07,k*m.v*m.v*.00085))','Math.max(-.032,Math.min(.032,k*m.v*m.v/Math.max(.001,T.aLat)*.027))')
    s=rep(s,'Math.max(-.028,Math.min(.075,-acc*.0009))','Math.max(-.030,Math.min(.036,-acc/Math.max(.001,T.brk)*.030))')
    s=rep(s,'roTgt+latN*.034-m.roll','roTgt+latN*.008-m.roll')
    s=rep(s,'geo*1.6-m.slip*1.05','geo-m.slip*.85')
    s=rep(s,'const kick=1.1+R2()*2.3,out=.5+R2()*1.25;','const kick=.35+R2()*.65,out=.12+R2()*.35;')
    s=rep(s,'s2.v[0]*=1-dt*1.35;s2.v[2]*=1-dt*1.35;s2.v[1]=s2.v[1]*(1-dt*.30)+dt*.55;','s2.v[0]*=Math.exp(-dt*.85);s2.v[2]*=Math.exp(-dt*.85);s2.v[1]=s2.v[1]*Math.exp(-dt*.45)+dt*.18;')
    s=rep(s,'(.22+age*T.smokeGrow)*Sx*(.60+s2.r*.85)','(.11+Math.sqrt(age)*T.smokeGrow*.46)*Sx*(.75+s2.r*.35)')
    s=rep(s,'Math.pow(1-age,1.55)*T.smokeAlpha','Math.pow(1-age,2.1)*T.smokeAlpha')
    s=rep(s,'k:go?1+b*(T.burnSize-1):T.openingSmokeSize,a:go?.85+b*(T.burnAlpha-.85):T.openingSmokeAlpha,l:go?T.smokeLife_s+b*(T.burnLife_s-T.smokeLife_s):T.openingSmokeLife_s,','k:go?.72+b*.28:T.openingSmokeSize,a:go?.48+b*.30:T.openingSmokeAlpha,l:go?1.15+b*.75:T.openingSmokeLife_s,')
    return s
