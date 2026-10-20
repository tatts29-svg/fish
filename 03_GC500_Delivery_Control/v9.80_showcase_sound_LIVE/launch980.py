# Author: Andrew Fisher. One continuous, correctly scaled Showcase launch.
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep as strict_rep


def rep(s, old, new):
    return strict_rep(s, old, new, 'Showcase launch980', __file__)


def apply_launch980(s):
    if 'v9.80 — ONE CLUTCH RELEASE' in s:
        raise ValueError('Launch v9.80 already applied')
    if 'v9.74 — PROGRESSIVE TYRE LOAD' not in s:
        raise ValueError('Launch v9.80 requires the current progressive tyre-load simulation')

    s = rep(s, ' T.aLat = T.gLat*9.81*q;', ''' T.aLat = T.gLat*9.81*q;
 /* Raw tyre speeds are metres/second; consumers use points/second, like road speed.
 Re-running units for a pace change derives fresh values without multiplying twice. */
 T.burnCreep = Math.max(0,T.burnCreep_ms||0)*tc/M;
 T.burnSpin = Math.max(0,T.burnSpin_ms||0)*tc/M;''')
    s = rep(s, 'burn:0,pitch:0,roll:0,lat:0,slip:0,air:0,',
            'burn:0,launch980:0,launchAge980:0,launchRealAge980:0,launchLoad980:0,launchSpin980:0,pitch:0,roll:0,lat:0,slip:0,air:0,')
    s = rep(s, ' const go=m.go=S.clock>G.GRID,pv=m.v;\n if(go){const tg=S.vAt(m.s+1.5);m.v=tg>m.v?Math.min(tg,m.v+T.acc*1.25*dt):Math.max(tg,m.v-T.brk*1.15*dt);m.s+=m.v*dt;', ''' /* v9.80 — ONE CLUTCH RELEASE: parked through the lights, then a continuous launch.
 launchAge980 is scene seconds; launchRealAge980 follows the selected playback pace.
 The shared clutch envelope drives sound without inventing a second launch clock. */
 const wasGoing980=m.go,go=m.go=S.clock>G.GRID,pv=m.v;
 const ease980=x=>{const a=Math.max(0,Math.min(1,x));return a*a*(3-2*a);};
 m.launchAge980=go?Math.max(0,S.clock-G.GRID):0;
 m.launchRealAge980=go?(wasGoing980?(m.launchRealAge980||0)+dt*(T.tc||1):m.launchAge980*(T.tc||1)):0;
 m.launch980=go?(!wasGoing980?1:1-ease980(m.launchRealAge980)):0;
 m.launchLoad980=go?ease980(m.launchRealAge980/.28):0;
 m.launchSpin980=go&&!S.calmDrive?.16*ease980(m.launchRealAge980/.10)*(1-ease980((m.launchRealAge980-.10)/.65)):0;
 if(go){const tg=S.vAt(m.s+1.5);m.v=tg>m.v?Math.min(tg,m.v+T.acc*1.25*m.launchLoad980*dt):Math.max(tg,m.v-T.brk*1.15*dt);m.s+=m.v*dt;''')
    old = ''' {const want=S.calmDrive?0:(!go
 ? Math.max(0,Math.min(1,(S.clock-T.burnFrom_s)/T.burnRamp_s))*Math.max(0,Math.min(1,(T.burnTo_s-S.clock)/T.burnHook_s))
 : Math.max(0,Math.min(1,(Math.abs(m.slip)-.072)/.10)));
 m.burn+=(want-m.burn)*(1-Math.exp(-dt*(want>m.burn?11:4.5)));}'''
    new = ''' {const want=(S.calmDrive||!go)?0:Math.max(m.launchSpin980,
 Math.max(0,Math.min(1,(Math.abs(m.slip)-.072)/.10)));
 const burnPace980=m.launch980>0?(T.tc||1):1;
 m.burn+=(want-m.burn)*(1-Math.exp(-dt*(want>m.burn?11:4.5)*burnPace980));}'''
    s = rep(s, old, new)
    s = rep(s, ''' /* A BURNOUT THAT DOES NOT MOVE LAYS NO RUBBER. It creeps, the way a real one does, so what it leaves on
 the grid is a pair of black strips rather than a single smudge. */''',
            ' /* Hold both axles still on the grid; the brief tyre effect belongs to the moving release. */')
    s = rep(s, ' if(!go){m.v=S.calmDrive?0:T.burnCreep_ms*m.burn;m.s+=m.v*dt;}',
            ' if(!go){m.v=0;m.burn=0;m.latV=0;} /* brakes hold the car at its grid position */')
    s = rep(s, 'braking=go?S.vAt(m.s+5)<m.v-1.5:(!S.calmDrive&&m.burn>.15),k=S.kAt(m.s+1);',
            'braking=go?S.vAt(m.s+5)<m.v-1.5:true,k=S.kAt(m.s+1);')
    s = rep(s, ' m.latV=(m.latV||0)+(latTarget-(m.latV||0))*(1-Math.exp(-dt*5));',
            ' m.latV=go?(m.latV||0)+(latTarget-(m.latV||0))*(1-Math.exp(-dt*5)):0;')
    s = rep(s, ' m.wheelspin=(!go?m.burn:Math.max(0,Math.min(1,(Math.abs(m.slip)-.072)/.10))*powerLoad);',
            ' m.wheelspin=(!go?0:Math.max(m.launch980>0?m.burn:0,Math.max(0,Math.min(1,(Math.abs(m.slip)-.072)/.10))*powerLoad));')
    s = rep(s, 'return Math.round((!go?T.maxOpeningSmoke:(m.burn>.45?T.maxSmokeBurn:T.maxSmoke))*k);};',
            'return Math.round((!go||m.launch980>0?T.maxOpeningSmoke:(m.burn>.45?T.maxSmokeBurn:T.maxSmoke))*k);};')
    s = rep(s, 'm.nextSmokeAt=S.clock+(go?T.smokeEvery_s:T.openingSmokeEvery_s)/(.35+b*1.95);',
            'm.nextSmokeAt=S.clock+(go&&m.launch980===0?T.smokeEvery_s:T.openingSmokeEvery_s)/(.35+b*1.95);')
    s = rep(s, ' m.wheelR+=(m.v+T.burnSpin_ms*m.burn)*dt/(.135*T.carS);',
            ' m.wheelR+=(m.v+T.burnSpin*m.burn)*dt/(.135*T.carS);')
    return s
