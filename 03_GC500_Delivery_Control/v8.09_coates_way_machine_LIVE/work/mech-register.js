/* THE NEW MECHANISMS IN THE REGISTER (v8.09). Andrew Fisher, 2 Oct 2026: "Push your limits further. Add more mechanical
   features ... Improve every thing on here. 10/10". Every part that moves now has a reference, its exact wording, what it is
   assembled to, what it does, what it connects to and a suggested Coates link — the link is a teaching association,
   labelled as such wherever it shows (car-app.js renders it as "Cog link", titled "Suggested teaching association"), never
   an official mapping.

   References follow car-references.js: engine additions carry explicit semantic ids (ENG-...), and a reference, once given,
   is never changed. They are added to CAR_REFERENCES here, at module load, so the register (car-app.js `extraSpecs`, which
   reads CAR_REFERENCES[id]) lists them without car-references.js being edited; moving the lines below into that file is
   the tidy-up whenever its owner next touches it. Nothing already in CAR_REFERENCES is overwritten. */
import {CAR_REFERENCES} from './car-references.js';

export const MECH_PARTS = Object.freeze([
 /* id, reference, the assembly's exact name (as it is built), assembled to, role, drives/connected parts, cog link */
 {id:'clutch',ref:'ENG-CLUTCH',assembly:'bellhousing, between the flywheel and the gearbox input',
  role:'A twin-plate clutch on the back of the flywheel. The pressure plate clamps two friction discs to the flywheel and they turn the gearbox input shaft. While the V8 is being started the release bearing pushes the diaphragm in, the plates open and the input shaft stands still; the moment the engine runs on its own the plates clamp again and the gear train turns with the crank.',
  drives:['crankshaft','ring-gear','gearbox','starter-motor'],cog:'Ease of Doing Business'},
 {id:'timing-tensioner',ref:'ENG-TIMING-TENSIONER',assembly:'front of the block, on the slack span of the timing belt',
  role:'A spring-loaded arm holds a smooth idler against the back of the timing belt between the crank sprocket and the right cam sprocket. The idler rides the belt’s back, so it turns the opposite way to the sprockets, at belt speed over its own radius — and the belt cannot jump a tooth.',
  drives:['timing-belt','timing-crank-sprocket','timing-cam-near'],cog:'Operating Cadence'},
 {id:'oil-galleries',ref:'ENG-OIL-GALLERIES',assembly:'drilled through the block, from the oil pump to the bearings and both heads',
  role:'The oil pump’s outlet climbs to the main gallery along the block; five drillings feed the main bearings and two risers feed the camshafts. The pump is a gear pump, so every turn of its gears moves the same amount of oil — the pulses you see travel with the pump, run faster with the revs and stop when the engine stops.',
  drives:['oil-pump','crankshaft','camshaft-near','camshaft-far','engine-block'],cog:'Culture'},
 {id:'diff-pinion',ref:'ENG-DIFF-PINION',assembly:'nose of the differential, on the end of the prop shaft',
  role:'Ten teeth on the end of the prop shaft. It turns with the gearbox’s main shaft and drives the 39-tooth crown wheel, a 3.9 to 1 reduction: the crown wheel and the rear wheels turn once for every 3.9 turns of the prop shaft.',
  drives:['prop-shaft','diff-crown-wheel'],cog:'Disciplined Execution'},
 {id:'diff-crown-wheel',ref:'ENG-DIFF-CROWN-WHEEL',assembly:'inside the sectioned differential case, on the axle line',
  role:'The crown wheel is bolted to the differential carrier, so the pinion turns them together. The carrier carries the cross pin and the two spider gears round with it; that is how the drive reaches both side gears.',
  drives:['diff-pinion','diff-spider-gears','rear-differential'],cog:'Performance-led Results'},
 {id:'diff-spider-gears',ref:'ENG-DIFF-SPIDER-GEARS',assembly:'on the cross pin inside the differential carrier',
  role:'Two spider gears on the carrier’s cross pin, in mesh with both side gears. Straight ahead they do not turn on the pin — the carrier, the spiders and both side gears go round as one. Steer, and the outside wheel has further to go: the spiders turn on their pin and let one side gear run faster and the other slower by the same amount, with the push shared evenly between them.',
  drives:['diff-crown-wheel','diff-side-gear-left','diff-side-gear-right'],cog:'Balanced Scorecard'},
 {id:'diff-side-gear-left',ref:'ENG-DIFF-SIDE-GEAR-L',assembly:'splined to the left half shaft, inside the carrier',
  role:'Splined to the left half shaft. It turns at the carrier’s speed plus whatever the spider gears add or take away — faster on a right-hand turn, when the left wheel is on the outside.',
  drives:['diff-spider-gears','rear-differential'],cog:'Network'},
 {id:'diff-side-gear-right',ref:'ENG-DIFF-SIDE-GEAR-R',assembly:'splined to the right half shaft, inside the carrier',
  role:'Splined to the right half shaft. It turns at the carrier’s speed plus whatever the spider gears add or take away — faster on a left-hand turn, when the right wheel is on the outside.',
  drives:['diff-spider-gears','rear-differential'],cog:'Network'},
 {id:'brake-master-cylinders',ref:'ENG-BRAKE-MASTER',assembly:'engine side of the firewall, in line with the brake pedal',
  role:'The brake pedal pushes the balance bar; the bar pushes two master cylinders, one for the front brakes and one for the rear, set 60 to 40 toward the front. Their pistons push fluid down the lines to the calipers — press the brake and watch the push rods go in.',
  drives:['brake-lines','cockpit'],cog:'Safety'},
 {id:'brake-lines',ref:'ENG-BRAKE-LINES',assembly:'from the master cylinders along the chassis to all four calipers',
  role:'Two hard lines, front and rear circuits, from the master cylinders to the four calipers. Fluid does not compress, so the master cylinders’ push arrives at every caliper piston at once; the lines brighten while they carry pressure.',
  drives:['brake-master-cylinders','brake-pads-front-left','brake-pads-front-right','brake-pads-rear-left','brake-pads-rear-right'],cog:'Network'},
 ...[['front','left','FL'],['front','right','FR'],['rear','left','RL'],['rear','right','RR']].map(([axle,side,k])=>({
  id:`brake-pads-${axle}-${side}`,ref:`ENG-BRAKE-PADS-${k}`,assembly:`inside the ${side} ${axle} caliper, either side of the disc`,
  role:`Two pads and their caliper pistons, one each side of the ${side} ${axle} disc. With the brake off they stand clear of it; press the brake and fluid from the lines pushes the pistons and the pads clamp the disc.`+(axle==='rear'?' The rear discs are the ones turning on the rollers: brake against the running V8 and they heat up, dull red to orange, and cool over the next half minute.':' The front wheels sit in the chocks, so their discs never turn and never heat.')+(axle==='front'?' The caliper is on the steering upright, so the pads turn with the wheel.':''),
  drives:['brake-lines',axle==='rear'?'rear-differential':'steering-knuckle-'+side],cog:'Safety'})),
 ...['left','right'].map(side=>({id:'steering-knuckle-'+side,ref:'ENG-STEERING-KNUCKLE-'+(side==='left'?'L':'R'),assembly:`${side} front corner, between the wishbones`,
  role:`The ${side} front upright turns on its kingpin, carrying the hub, the wheel and the caliper. Its steering arm reaches back to the tie rod’s outer ball joint, so when the rack slides the arm swings and the upright turns the wheel. The arm’s length sets how far the wheel turns for the rack’s travel — 18 degrees at full lock.`,
  drives:['steering-tie-rod-'+side,'front-suspension','brake-pads-front-'+side],cog:'Customer'})),
]);

/* the register's references for these parts — added, never overwriting one already given */
for(const p of MECH_PARTS)if(!(p.id in CAR_REFERENCES))CAR_REFERENCES[p.id]=p.ref;

/* role, connected parts and teaching link for part-connections.js; null for a part this file does not describe */
const BY_ID=new Map(MECH_PARTS.map(p=>[p.id,p]));
export function mechConnection(id){const p=BY_ID.get(id);return p?{role:p.role+' Fitted: '+p.assembly+'.',drives:p.drives.slice(),cog:p.cog,assembledTo:p.assembly}:null;}
