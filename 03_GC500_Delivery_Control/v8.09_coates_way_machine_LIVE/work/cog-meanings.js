/* WHAT EACH PART OF THE MACHINE STANDS FOR. Andrew Fisher, 22 Sep 2026: each part of the cog comes apart, and
   each has a meaning in the Coates Way. The four plates carry the Coates Way's own words, verbatim, and need no
   help. Every other part of the 138 — the shaft that turns them, the bearings, the planets, the clutch, the
   motor, the base and its fasteners, and (v5.79) the wheel round the cog — is given a teaching association with a word that is already on the
   plates or one of the five stated Coates values. These are teaching links for the interface and the register,
   labelled as such wherever they appear; they are not policy, and they invent no wording. */
const VALUES = ['Care Deeply', 'Customer Focused', 'Be Our Best', 'One Team', 'Competitive Spirit'];
const RULES = [
  /* [test on ref prefix or name, Coates word or value, the association, one line] */
  [p => /^CW-CG-001/.test(p.ref), 'Best Service and Value', 'The centre cap carries the purpose. Everything else on the shaft is there to turn it.'],
  [p => /^CW-CG-002/.test(p.ref), 'People · Operations · Assets · Financials', 'Four pillars on one carrier: none of them turns without the others.'],
  [p => /^CW-CG-003/.test(p.ref), 'Balanced Scorecard · Operating Cadence · Disciplined Execution', 'The ring that measures the rhythm and keeps it honest.'],
  [p => /^CW-CG-004/.test(p.ref), 'The seven traits', 'The teeth that meet the work: seven behaviours around the outside, where the load is.'],
  /* v5.79 — the wheel round the cog (Andrew Fisher, 23 Sep 2026: the Coates Way sets our direction) */
  [p => /steering wheel rim/i.test(p.name), 'One Team', 'The rim is what every pair of hands holds. The same wheel, whoever is driving.'],
  [p => /spoke plate/i.test(p.name), 'Disciplined Execution', 'Seven spokes, one behind each tooth: what the hands do reaches the cog through every one of them.'],
  [p => /tooth bolt/i.test(p.name), 'Safety', 'A bolt through every tooth. The wheel is only the cog’s if all seven are torqued.'],
  [p => /quick-release/i.test(p.name), 'Ease of Doing Business', 'One pull and the wheel is off; one push and it is home and locked. Simple to do the right thing.'],
  [p => /common drive shaft/i.test(p.name), 'One Team', 'One shaft through every plate. Whatever turns, turns together, at the same angle.'],
  [p => /shaft key/i.test(p.name), 'Disciplined Execution', 'A key stops the plates slipping on the shaft: the small part that makes the connection real.'],
  [p => /retaining collar/i.test(p.name), 'Resilient Processes', 'Holds the stack in place so vibration cannot walk it apart.'],
  [p => /front bearing/i.test(p.name), 'Ease of Doing Business', 'A bearing takes the load and removes the friction. Good process does the same for a customer.'],
  [p => /dog coupling/i.test(p.name), 'Customer Solutions', 'Dogs engage cleanly or not at all: a connection you can see is made.'],
  [p => /drive coupling/i.test(p.name), 'Customer Focused', 'The flexible coupling absorbs misalignment between what drives and what is driven.'],
  [p => /^CW-MT-/.test(p.ref) && /rotor|windings/i.test(p.name), 'Competitive Spirit', 'The rotor and windings are where the drive begins: the energy behind the pace.'],
  [p => /^CW-MT-/.test(p.ref) && /fan/i.test(p.name), 'Care Deeply', 'The fan keeps the motor cool under load so it can keep going. Looking after the source.'],
  [p => /^CW-MT-/.test(p.ref) && /bolt/i.test(p.name), 'Safety', 'Every fastener torqued. The motor stays where it was put.'],
  [p => /^CW-MT-/.test(p.ref), 'Be Our Best', 'The motor: consistent, reliable output, every time it is asked.'],
  [p => /sun gear/i.test(p.name), 'Targeted Growth', 'The sun turns fastest and drives every planet from the centre.'],
  [p => /planet gear/i.test(p.name), 'People · Operations · Assets · Financials', 'Four planets share the load equally and orbit together. None can race ahead of the carrier.'],
  [p => /annulus/i.test(p.name) && !/bolt/i.test(p.name), 'Operating Cadence', 'The fixed ring that every planet rolls against: the frame that sets the rhythm.'],
  [p => /output carrier|carrier pin/i.test(p.name), 'One Team', 'The carrier turns because four planets push it together, at a quarter of the input speed.'],
  [p => /inspection cover/i.test(p.name) && !/bolt/i.test(p.name), 'Balanced Scorecard', 'A clear cover so the reduction can be inspected while it runs. Measured, not assumed.'],
  [p => /input bearing/i.test(p.name), 'Resilient Processes', 'Balls, races and rings take the input load so the gears never have to.'],
  [p => /^CW-GB-/.test(p.ref) && /bolt|screw/i.test(p.name), 'Disciplined Execution', 'Fasteners in a circle, each carrying its share.'],
  [p => /clutch hub/i.test(p.name), 'Customer Focused', 'The hub carries the plates that let the drive connect and let go on purpose.'],
  [p => /friction plate/i.test(p.name), 'Performance-led Results', 'Friction plates transmit the torque. Results are carried by contact, not by proximity.'],
  [p => /separator plate/i.test(p.name), 'Operational Excellence', 'Steel separators keep the pack even so the load is shared across every plate.'],
  [p => /return spring/i.test(p.name), 'Resilient Processes', 'Springs open the pack cleanly when the drive is released and close it again the same way.'],
  [p => /pressure bolt/i.test(p.name), 'Disciplined Execution', 'Six bolts set the clamping load. Too loose slips; too tight burns.'],
  [p => /^CW-BS-/.test(p.ref), 'Safety', 'The base: everything above it is only as steady as this is.'],
];
export function cogMeaning(part) {
  for (const [test, word, note] of RULES) if (test(part)) return {word, note, kind: VALUES.includes(word) ? 'Coates value' : 'Coates Way wording'};
  return {word: 'Every part matters', note: 'A named, removable part in the drive. The drive stops before it is withdrawn and cannot restart until it is back.', kind: 'Coates Way'};
}
export const COG_MEANING_LABEL = 'Coates Way link (teaching association)';

/* A SECTION OF THE COG SAYS WHAT IT MEANS. Andrew Fisher, 23 Sep 2026: selecting a cog section reveals its
   meaning. The four plates carry the original artwork (its UVs are the PNG's, byte for byte — tests/artwork
   .test.mjs), so a hit's uv is a point on that picture: angle and radius about its centre pick the section —
   the four pillars are the four quadrants of the second plate with their three words each in the inner band,
   the three scorecard words sit at the top, lower left and lower right of the third, and the seven traits are
   the seven equal sectors of the outer plate, a divider at twelve o'clock. What car-app.js then shows is the
   record's own content for that section (content.js: the pillar or trait text, the KPI targets for the centre)
   — nothing is written here that is not already on the plates or in the supplied presentation. */
const TRAIT_ORDER=['Customer Solutions','Targeted Growth','Performance-led Results','Operational Excellence','Resilient Processes','Customer-led Innovation','Ease of Doing Business'];   /* clockwise from twelve o'clock */
const PILLAR_WORDS={People:['Culture','Values','Safety'],Operations:['Customer','Solutions','Transport'],Assets:['Digital','Fleet','Network'],Financials:['Capital','Returns','Investment']};   /* each quadrant's three, from the top/right end round */
export function cogSectionAt(part,uv){const dx=uv.x-.5,dy=.5-uv.y,r=Math.hypot(dx,dy)*2;let deg=Math.atan2(dy,dx)*180/Math.PI;if(deg<0)deg+=360;   /* the plates' uv v runs DOWN the picture (glTF, tests/artwork.test.mjs: pixel row = v·1179), so .5−v is up; deg is the picture's own angle, anticlockwise from three o'clock */
 if(part===0)return {plate:0,name:'Best Service and Value',word:r<.30?'Coates':'Best Service and Value',kind:'purpose'};
 if(part===1){const q=deg<90?'Operations':deg<180?'People':deg<270?'Financials':'Assets';const within=deg%90;   /* 0 at the quadrant's clockwise edge for the upper right, anticlockwise for the others */
  const idx=q==='Operations'?Math.min(2,Math.floor((90-within)/30)):q==='People'?Math.min(2,Math.floor((within)/30)):q==='Financials'?Math.min(2,Math.floor(within/30)):Math.min(2,Math.floor((90-within)/30));
  const inner=r<.60;return {plate:1,name:q,word:inner?PILLAR_WORDS[q][idx]:q,kind:'pillar'};}
 if(part===2){const w=deg>=40&&deg<=140?'Balanced Scorecard':deg>150&&deg<270?'Operating Cadence':'Disciplined Execution';return {plate:2,name:w,word:w,kind:'scorecard'};}
 if(part===3){const k=Math.floor((((90-deg)%360+360)%360)/(360/7));return {plate:3,name:TRAIT_ORDER[k],word:TRAIT_ORDER[k],kind:'trait'};}
 return null;}
