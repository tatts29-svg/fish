"""Author: Andrew Fisher. Bounded opening smoke and allocation-free particle updates."""
from rep import rep

def patch_smoke(s):
    def change(old,new):
        nonlocal s
        s=rep(s,old,new,'v9.71 opening smoke',__file__)
    change('burnFrom_s:1.05, burnRamp_s:.55, burnTo_s:3.26, burnHook_s:.26,',
           'burnFrom_s:1.35, burnRamp_s:.22, burnTo_s:2.15, burnHook_s:.22,\n openingSmokeEvery_s:.045, maxOpeningSmoke:96, openingSmokeLife_s:1.25, openingSmokeSize:.9, openingSmokeAlpha:.70,')
    change('return Math.round((m.burn>.45?T.maxSmokeBurn:T.maxSmoke)*k);};',
           'return Math.round((!go?T.maxOpeningSmoke:(m.burn>.45?T.maxSmokeBurn:T.maxSmoke))*k);};')
    change('const pushSmoke=x=>{const cap=smokeCap();if(m.smoke.length>=cap)m.smoke.shift();m.smoke.push(x);};',
           'const pushSmoke=x=>{const cap=smokeCap();if(cap<1)return;const excess=m.smoke.length-cap+1;if(excess>0)m.smoke.splice(0,excess);m.smoke.push(x);};')
    change('m.nextSmokeAt=S.clock+T.smokeEvery_s/(.35+b*1.95);',
           'm.nextSmokeAt=S.clock+(go?T.smokeEvery_s:T.openingSmokeEvery_s)/(.35+b*1.95);')
    change('const per=b>.72?2:1;', 'const per=go&&b>.72?2:1;')
    change('k:1+b*(T.burnSize-1),a:.85+b*(T.burnAlpha-.85),l:T.smokeLife_s+b*(T.burnLife_s-T.smokeLife_s),',
           'k:go?1+b*(T.burnSize-1):T.openingSmokeSize,a:go?.85+b*(T.burnAlpha-.85):T.openingSmokeAlpha,l:go?T.smokeLife_s+b*(T.burnLife_s-T.smokeLife_s):T.openingSmokeLife_s,')
    change('''m.smoke=m.smoke.filter(s2=>S.clock-s2.c<(s2.l||T.smokeLife_s));
 /* v5.71 — IT RISES. Tyre smoke boils out sideways and then lifts as it thins, and the first pass had it
 dragging to a stop at deck height, which is why the cloud sat in a flat bar behind the car. Sideways
 motion is dragged out; upward motion is fed. */
 m.smoke.forEach(s2=>{s2.p=[s2.p[0]+s2.v[0]*dt,s2.p[1]+s2.v[1]*dt,s2.p[2]+s2.v[2]*dt];
 s2.v[0]*=1-dt*1.35;s2.v[2]*=1-dt*1.35;s2.v[1]=s2.v[1]*(1-dt*.30)+dt*.55;});''',
           '''/* v9.71 — Retain particle/position arrays and honour a lower budget immediately,
 even on a step that emits no new smoke. Keep the same rise and drag equations. */
 {let kept=0;const cap=smokeCap(),first=Math.max(0,m.smoke.length-cap);
 for(let i=first;i<m.smoke.length;i++){const s2=m.smoke[i];
 if(S.clock-s2.c>=(s2.l||T.smokeLife_s))continue;
 s2.p[0]+=s2.v[0]*dt;s2.p[1]+=s2.v[1]*dt;s2.p[2]+=s2.v[2]*dt;
 s2.v[0]*=1-dt*1.35;s2.v[2]*=1-dt*1.35;s2.v[1]=s2.v[1]*(1-dt*.30)+dt*.55;
 m.smoke[kept++]=s2;}m.smoke.length=kept;}''')
    return s
