#!/usr/bin/env python3
"""v6.51 - THE V8 FROM THREE GENERATED LOOPS, AND A CROWD (Andrew Fisher, 26 Sep 2026: "Improve the v8 sound").

Until now the showcase's engine was either a pulse train designed in the page (the default) or one generated clip pitched
up and down. Now three generated V8 loops - idle, mid revs, high revs, made on his ElevenLabs account and treated by the
sound pipeline - are crossfaded by the revs the car's own gearbox reports, each loop pitched from its own note, so the
engine climbs through the gears with real exhaust texture instead of a pitched puff. The intake noise, the tyre scrub, the
upshift cut, the downshift blip, the overrun pops, the distance, the pan and the Doppler all stay exactly as designed and
ride on the loops. A crowd bed from the grandstands sits under it, up on the wide and drone shots, down close to the car.
The designed V8 stays one pick away (Engine: Designed V8, beside the Sound button, kept on the device); the loops are the
default when the three have decoded. Sound stays off until its button, as always.

  python3 patch_v651.py <page.html> <bundle gc3d_bundle.js> <kit media dir> <sound_extra.json> [builder.py]
"""
import base64, hashlib, json, os, re, sys

page, bundle, kit_media, extra_path = sys.argv[1:5]; builder = sys.argv[5] if len(sys.argv) > 5 else None

def rep(text, old, new, what, path):
    # indent-tolerant: the page's copy of the bundle and of the builder drops leading whitespace on some lines
    pat = '\\n'.join('[ \\t]*' + re.escape(l.lstrip()) for l in old.split('\n'))
    ms = list(re.finditer(pat, text))
    if len(ms) != 1: sys.exit(f'{what} in {os.path.basename(path)}: expected once, found {len(ms)}: {old[:90]!r}')
    m = ms[0]; return text[:m.start()] + new + text[m.end():]

# ---------------------------------------------------------------------------------------------------- the bundle (and its copy in the page)
BUNDLE_EDITS = [
 ('clip keys (setClips)',
  "  for(const k of ['launch','engine','whoosh'])if(old[k]!==((next||{})[k])){",
  "  for(const k of CLIP_KEYS)if(old[k]!==((next||{})[k])){"),
 ('clip keys (decodeAll)',
  "  ['launch','engine','whoosh'].forEach(k=>{\n    const source=c[k];if(!source||SND.bufs[k]||SND.bufs[k+'_pending'])return;",
  "  CLIP_KEYS.forEach(k=>{\n    const source=c[k];if(!source||SND.bufs[k]||SND.bufs[k+'_pending'])return;"),
 ('decoded -> mode',
  "      ctx.decodeAudioData(arr.slice(0),buf=>{if(!current())return;SND.bufs[k]=buf;delete SND.bufs[k+'_pending'];log('decoded '+k+' '+buf.duration.toFixed(2)+'s');},",
  "      ctx.decodeAudioData(arr.slice(0),buf=>{if(!current())return;SND.bufs[k]=buf;delete SND.bufs[k+'_pending'];log('decoded '+k+' '+buf.duration.toFixed(2)+'s');SND.autoMode();},"),
 ('setMode + loops',
  "SND.setMode=function(m){SND.mode=m==='clips'?'clips':'engine';engineStop();log('mode '+SND.mode);};",
  """/* v6.51 - THE V8 FROM THREE GENERATED LOOPS (Andrew Fisher, 26 Sep 2026: "Improve the v8 sound"). Idle, mid and high
   loops made on his ElevenLabs account and treated by the sound pipeline; each is pitched from its own note by the revs
   the gearbox reports and the three are crossfaded by rpm (equal power over a trapezoid each), so the engine climbs
   through the gears with real exhaust texture. Everything designed around the engine - intake, scrub, cut, blip, pops,
   distance, pan, Doppler - rides on them unchanged. 'loops' is the default once the three have decoded; 'engine' is the
   designed V8, one pick away and kept on the device; 'clips' is the old single-clip way, still there for a test. */
const CLIP_KEYS=['launch','engine','whoosh','engine_lo','engine_mid','engine_hi','crowd'];
const LOOPS=[['engine_lo',1300,[0,1300,3000,3700]],['engine_mid',4000,[2500,3500,5200,5900]],['engine_hi',6800,[4700,5700,9000,9000]]];
function loopWeight(rpm,w){const a=w[0],b=w[1],c=w[2],d=w[3];if(rpm<=a||rpm>=d)return 0;if(rpm<b)return (rpm-a)/(b-a);if(rpm<=c)return 1;return (d-rpm)/(d-c);}
const loopsReady=()=>!!(SND.bufs.engine_lo&&SND.bufs.engine_mid&&SND.bufs.engine_hi);
SND.modePref=function(){try{return localStorage.getItem('gc500.showengine')==='engine'?'engine':'loops';}catch(e){return 'loops';}};
SND.autoMode=function(){if(SND.mode==='clips')return;const want=SND.modePref();const m=want==='loops'&&loopsReady()?'loops':'engine';if(m!==SND.mode){SND.mode=m;engineStop();log('mode '+m+(m==='loops'?' (three generated loops)':' (designed V8)'));}};
SND.setMode=function(m){const want=m==='clips'?'clips':m==='loops'?'loops':'engine';try{if(want!=='clips')localStorage.setItem('gc500.showengine',want);}catch(e){}SND.mode=want==='loops'&&!loopsReady()?'engine':want;engineStop();log('mode '+SND.mode+(want==='loops'&&SND.mode!=='loops'?' (loops not decoded yet)':''));};
function crowdStart(t){if(SND.nodes.crowd||!SND.bufs.crowd||!SND.g.crowd)return;const src=SND.ctx.createBufferSource();src.buffer=SND.bufs.crowd;src.loop=true;src.connect(SND.g.crowd);src.start(t);SND.nodes.crowd=src;log('crowd start',null,t);}"""),
 ('gains list',
  "  ['beep','launch','engine','whoosh'].forEach(k=>{const g=ctx.createGain();g.gain.value=k==='engine'?0:1;g.connect(master);SND.g[k]=g;});",
  "  ['beep','launch','engine','whoosh','crowd'].forEach(k=>{const g=ctx.createGain();g.gain.value=(k==='engine'||k==='crowd')?0:1;g.connect(master);SND.g[k]=g;});   /* v6.51 - the crowd has its own gain, quiet, straight to the master */"),
 ('engineStart loops',
  "  const ctx=SND.ctx,src=ctx.createBufferSource();src.buffer=SND.bufs.pulse;src.loop=true;src.playbackRate.value=SND.rpm/R0;src.connect(SND.nodes.pulseIn);src.start(t);SND.nodes.engine=src;",
  """  const ctx=SND.ctx;crowdStart(t);
  if(SND.mode==='loops'&&loopsReady()){
    /* v6.51 - the three loops, each through its own gain into the same lowpass the designed engine uses, so distance dulls them the same way */
    SND.nodes.loops=LOOPS.map(L=>{const s=ctx.createBufferSource();s.buffer=SND.bufs[L[0]];s.loop=true;s.playbackRate.value=1;const g=ctx.createGain();g.gain.value=0;s.connect(g);g.connect(SND.nodes.lp);s.start(t);return {src:s,g:g,name:L[0],native:L[1],win:L[2]};});
    SND.nodes.engine=SND.nodes.loops[0].src;
    const n2=ctx.createBufferSource();n2.buffer=SND.bufs.noise;n2.loop=true;n2.connect(SND.nodes.intakeBp);n2.start(t);SND.nodes.intake=n2;
    const sc2=ctx.createBufferSource();sc2.buffer=SND.bufs.noise;sc2.loop=true;sc2.connect(SND.nodes.scrubBp);sc2.start(t);SND.nodes.scrub=sc2;
    log('engine start (three generated loops)',S,t);return;
  }
  const src=ctx.createBufferSource();src.buffer=SND.bufs.pulse;src.loop=true;src.playbackRate.value=SND.rpm/R0;src.connect(SND.nodes.pulseIn);src.start(t);SND.nodes.engine=src;"""),
 ('engineStop loops',
  "function engineStop(t){['engine','intake','scrub'].forEach(k=>{const src=SND.nodes[k];if(!src)return;try{src.stop(t!=null?t:undefined);}catch(e){}SND.nodes[k]=null;});",
  "function engineStop(t){['engine','intake','scrub','crowd'].forEach(k=>{const src=SND.nodes[k];if(!src)return;try{src.stop(t!=null?t:undefined);}catch(e){}SND.nodes[k]=null;});if(SND.nodes.loops){SND.nodes.loops.forEach(L=>{try{L.src.stop(t!=null?t:undefined);}catch(e){}});SND.nodes.loops=null;}"),
 ('tick: rate per loop',
  "    SND.rate=(r.rpm/R0)*(1+dop);\n    set(SND.nodes.engine.playbackRate,SND.rate,ta,.03);",
  """    SND.rate=(r.rpm/R0)*(1+dop);
    if(SND.nodes.loops){const ws=SND.nodes.loops.map(L=>loopWeight(r.rpm,L.win)),sw=ws.reduce((a,b)=>a+b,0)||1;
      SND.nodes.loops.forEach((L,i)=>{set(L.src.playbackRate,(r.rpm/L.native)*(1+dop),ta,.03);set(L.g.gain,Math.sqrt(ws[i]/sw)*(.62+.38*r.thr),ta,.05);});}
    else set(SND.nodes.engine.playbackRate,SND.rate,ta,.03);
    /* v6.51 - the crowd: up on the wide, drone and overhead shots, down beside the car, gone while the words take the scene */
    if(SND.nodes.crowd&&SND.g.crowd)set(SND.g.crowd.gain,((shot==='wide'||shot==='heli'||shot==='top')?.16:.06)*calm*(S.sim.go?1:.7),ta,.4);"""),
]

# ---------------------------------------------------------------------------------------------------- the page: the Engine chooser
PAGE_EDITS = [
 ('engine chooser markup',
  """        <button class="shbtn" id="showSound" aria-pressed="false" hidden title="Sound for the 3D circuit — off unless you turn it on, on this device only">Sound off</button>""",
  """        <button class="shbtn" id="showSound" aria-pressed="false" hidden title="Sound for the 3D circuit — off unless you turn it on, on this device only">Sound off</button>
        <label class="shloop shengl" id="showEngineL" hidden title="Which V8 you hear: three generated loops crossfaded by the revs (v6.51), or the V8 designed in the page">Engine <select id="showEngine" class="shbtn shsel" aria-label="Engine sound"><option value="loops">Generated loops</option><option value="engine">Designed V8</option></select></label>"""),
 ('engine chooser sync',
  """  const on = S.isOn();
  b.textContent = on ? 'Sound on' : 'Sound off'; b.setAttribute('aria-pressed', on ? 'true' : 'false');""",
  """  const on = S.isOn();
  b.textContent = on ? 'Sound on' : 'Sound off'; b.setAttribute('aria-pressed', on ? 'true' : 'false');
  /* v6.51 - the Engine chooser shows with the sound on */
  const el = $('#showEngineL'); if (el) { el.hidden = !on; const sel = $('#showEngine'); if (sel && S.modePref) sel.value = S.modePref(); }"""),
 ('engine chooser wiring',
  """  on('showSound', () => showSoundToggle());""",
  """  on('showSound', () => showSoundToggle());
  { const se = $('#showEngine'); if (se) se.onchange = () => { if (window.GC3D && GC3D.sound && GC3D.sound.setMode) GC3D.sound.setMode(se.value); }; }   /* v6.51 */"""),
]

for path in [bundle, page] + ([builder] if builder else []):
    t = open(path, encoding='utf-8').read(); bom = t.startswith('﻿'); t = t.lstrip('﻿'); n0 = len(t)
    # the bundle: its own edits; the page: the bundle's edits (it carries the bundle inline) and the page's; the builder: the page's only (it inlines the bundle at build time)
    if path != builder:
        for what, old, new in BUNDLE_EDITS: t = rep(t, old, new, what, path)
    if path != bundle:
        for what, old, new in PAGE_EDITS: t = rep(t, old, new, what, path)
    open(path, 'w', encoding='utf-8').write(('﻿' if bom else '') + t); print('ok', os.path.basename(path), n0, '->', len(t))

# ---------------------------------------------------------------------------------------------------- the page's DATA: the clips as hosted media
def canonical(v):
    if isinstance(v, list): return '[' + ','.join(canonical(x) for x in v) + ']'
    if isinstance(v, dict): return '{' + ','.join(json.dumps(k, ensure_ascii=False) + ':' + canonical(v[k]) for k in sorted(v)) + '}'
    return json.dumps(v, ensure_ascii=False)
extra = json.load(open(extra_path))
added = {}
for k, uri in extra['clips'].items():
    raw = base64.b64decode(uri.split(',')[1], validate=True); sha = hashlib.sha256(raw).hexdigest(); fn = sha + '.mp3'
    dst = os.path.join(kit_media, fn)
    if not os.path.exists(dst): open(dst, 'wb').write(raw)
    added[k] = {'bytes': len(raw), 'file': fn, 'scope': 'view', 'sha256': sha, 'type': 'audio/mpeg'}
mp = os.path.join(kit_media, 'manifest.json'); man = json.load(open(mp)); have = {a['file'] for a in man['assets']}
for a in added.values():
    if a['file'] not in have: man['assets'].append(a)
man['assets'].sort(key=lambda a: a['file'])
man['sha256'] = hashlib.sha256(canonical({'schema': 'gc500-media-v1', 'assets': man['assets']}).encode('utf-8')).hexdigest()
json.dump(man, open(mp, 'w'), indent=1); print('manifest', len(man['assets']), 'assets, digest', man['sha256'][:12])
s = open(page, encoding='utf-8').read(); bom = s.startswith('﻿'); s = s.lstrip('﻿')
i = s.find('const DATA = '); j = s.find('\n', i); line = s[i:j]; assert line.endswith(';')
obj = json.loads(line[len('const DATA = '):-1])
assert json.dumps(obj, ensure_ascii=False, separators=(',', ':')) == line[len('const DATA = '):-1], 'DATA would not re-serialise byte for byte'
for a in added.values(): obj['media'][a['sha256']] = {'file': a['file'], 'sha256': a['sha256'], 'type': a['type'], 'bytes': a['bytes'], 'scope': a['scope']}
assert len(obj['media']) == len(man['assets']), (len(obj['media']), len(man['assets']))
obj['hostedMedia']['manifest'] = man['sha256']
ss = obj['showSound']
for k, a in added.items(): ss[k] = {'media': a['sha256']}
ss['about']['clips'].update(extra['about'])
ss['about']['made_on'] = ss['about']['made_on'] + '; the three engine loops and the crowd on 26 Sep 2026 - flows 320nEUwxJJ0G85eJlBqA, 1GUwG3kMm1ksxM8AHiZQ, qHpMyxq0kEonkBkETLJC, psL9D2b7AbA23SWxcvJ3, the same model, picked by analysis'
ss['about']['engine'] = 'v6.51: three generated loops (idle, mid, high) crossfaded by the revs the gearbox reports, each pitched from its own note; the designed V8 stays one pick away'
s = s[:i] + 'const DATA = ' + json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + ';' + s[j:]
open(page, 'w', encoding='utf-8').write(('﻿' if bom else '') + s); print('DATA.showSound:', sorted(k for k in ss if k != 'about'))
