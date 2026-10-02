# v8.08 Coates Way machine: the people (the driver and the pit crew)

Author: Andrew Fisher · draft, not live · 2 Oct 2026

Andrew Fisher, 2 Oct 2026, on the Coates Way machine: "...Add more mecahnical features. The guy who is the driver looks like he
crawls out of vehicle. Make this all 4k crystal clear. Improve every thing on here. 10/10".

This part of the job covers the people only: the race driver, the six pit crew, the safety officer and the forklift operator. The
other parts (the car's mechanics, the garage and the picture quality) are being done alongside, in other files.

## What was wrong

**"The driver crawling out of the vehicle" was the safety control officer.** He wears the white helmet with the 26 and the SAFETY
vest. He started on the far aisle right behind the car (1.8, -2.95) and checked the far tie-down and the far chock from there. Both
opening cameras look across the car at that aisle and sit low. "The car" looks from 1.5 m up and "V8 powertrain" from 4.2 m. So the car
hid him from the knees down, and his body and helmet showed above the roof. In "The car" view he stood behind the roof. In "V8
powertrain" the body panels are hidden, so his feet were lost behind the roll cage and he looked like he was walking on the roof.
There was nothing wrong with his anchor, offset or scale (he is 1.79 m and the car is 1.35 m to the top of the wing). What was wrong
was where he stood. The base test (below) reproduces it: he stood on that spot, legs hidden and helmet over the car, in 12 samples
from the car view.

**The race driver really did crawl through the car**, when **Explode** is pressed. car-app.js swaps the seated driver for a walking
figure crouched in the seat (0.70, -0.32). That figure crouch-walks out through the door frame to the sill, and his head goes through
the roof and the B-pillar. He then walks to a "safe spot" (3.0, -3.95) that is also behind the car from both cameras. The base test
shows his shins in the lower space frame and the headers, and his head in the roof. That file is not mine. The edit it needs is
below.

**The crew figures were crude.** They had stick limbs with a ball at each joint and a sphere for a helmet. The SAFETY vest was a
separate cylinder hung on the chest. The gloves were mittens. The boots had spikes, and their toe caps went up to 7 cm into the floor
whenever a heel lifted.

**Pre-existing clipping found by the new test:**
- The mechanic laid the wheel in the rack standing 11 cm from its middle, inside its frame.
- The pit technician's forward boot went under the side skirt when he knelt at the sill.
- The mechanic's helmet went into the rear quarter when he bent over the nut.
- Crew walked into each other.
- When the car came apart, crew kept doing chores at the wheels while the wheels moved out into them.

## What changed (files: `work/crew.js`, `work/car-driver.js`, new `work/people-figure.js`, new `work/people-atlas.js`)

### Where people stand and walk (crew.js)
- `behindCar(x, z)` works out, for the two opening camera directions, where the car hides the floor.
  - Posts and patrol stops are kept out of that zone.
  - A walk between two places in plain view goes round by the aisle points the car doesn't hide.
  - The far aisle is used only when the job is there: a far wheel, a far tyre or the engine bay.
- **The safety officer:**
  - He starts at the near corner behind the tail (3.3, 3.7), on the floor in plain view, watching the car. This is just off the
    crew's aisle, not on its corner point.
  - His round is the near rear tie-down (from the cell side), the rollers from behind the cell, the far front tie-down and the far
    front chock (from 2.75, -2.0, clear of the engine bay), then back to his corner. All of these are in plain view from both cameras,
    and none is on an aisle the crew walk.
  - While the car is apart he holds his corner.
  - While a wheel service is under way his round stops. He watches the wheel from his corner (or, for a near-side wheel, from behind
    the cell at 5.6, 1.1), out of the way of the mechanic, the pit technician and the lead.
  - While the V8 runs he holds the line at (1.8, 3.75), just behind the cell line.
- **Posts moved off the aisles:** each of these stood within 0.4 to 0.6 m of an aisle point or leg, and people brushed past whoever
  stood there:
  - mechanic: (-6.5, -3.1) to (-6.2, -3.6);
  - pit technician: (4.95, 2.45) to (5.6, 2.15);
  - lead: (-3.75, -3.05) to (-3.75, -3.45).
- In a far-wheel service the crew lead now supervises from behind the tail (6.0, 0.2) instead of the far aisle.
- **Nobody walks into anybody:**
  - Someone standing, kneeling or waiting on a walker's way is walked round, by replanning the route with that person as a box on the
    floor.
  - A walker waits for someone ahead going the same way, or for someone crossing who has the way. The order is mechanic, pit
    technician, lead, engine technician, then safety officer.
  - When someone comes straight at him, he steps out of their way (to the clear place within 1.5 m furthest from where they are going)
    and lets them pass. Two people held up by each other: the one without the way steps aside.
  - Where there is no way round someone (a narrow aisle), the walker waits while the other steps aside.
  - Personal space, the last check before every step: nobody steps to within 0.3 m of the floor a person standing or kneeling still
    takes up (his feet included). Two walkers keep 0.95 m between where each will be, because a stride reaches 0.45 m ahead.
  - In a 15-minute headless run, nobody is held up mid-walk for more than 2.8 s.
  - Routes never fall back to a straight line through the car.
- Chores at the car are dropped the moment the V8 starts, a service needs the crew, or the car is coming apart. A walk to a chore stops
  where the person is.
- The fixes for the clipping found by the test:
  - the mechanic lays the wheel from beside the rack;
  - the pit technician kneels at the sill 25 cm further out and leans less;
  - the mechanic kneels at the wheel 13 cm further out and bends less over the nut.
- **New animation:**
  - **Idle:** a real weight shift (hips 3 to 4 cm over one foot, the other hip drops and that knee softens, the shoulders tilt back
    against it), the head settling and looking about, loose wrists.
  - **Walk:** more arm swing with soft elbows, the head steadying against the bob.
  - **Toes:** the boot now bends at the ball of the foot (two new toe bones). A heel coming up rolls over the toes, and the toe cap no
    longer goes into the floor.
- `crew.plan(from, to, self)`, `crew.obstacles()` and `crew.addPerson(m)` are new, for car-app.js's race driver.
- `crewState().apart` is new and optional; if car-app.js doesn't send it, nothing breaks.

### The figure (people-figure.js, people-atlas.js; crew.js re-exports `buildFigure`, `BONES`, `crewAtlas`)
It has the same 19 joints at the same places, plus two toe bones. Every walk, kneel, reach and gesture works unchanged. It is still one
skinned mesh and one draw per person.
- **Torso:** lofted through 16 sections (seat, waist, ribs, chest, shoulder slope). The suit texture is laid by height, so the belt
  sits at the waist and Coates sits on the chest.
- **Legs and arms:** each leg is one continuous loft from hip to ankle, skinned across the knee and into the pelvis. Each arm is an
  upper arm and a forearm skinned across the elbow, with a rounded deltoid. Knees and elbows bend like cloth over a joint, and a
  knee cap on the shin keeps a bent knee from pinching.
- **Gloves:** palm, four fingers in two joints each (relaxed and a little curled), thumb, cuff.
- **Work boots:** toe box, instep, heel, ankle collar, rubber sole, heel block, laces, pull tab and a reflective heel strip. The sole is
  the floor (y 0).
- **Full-face helmet:**
  - the shell (crew orange crown or lead white, with Coates, 26 and THE COATES WAY);
  - a smoked visor in its gasket, with pivots;
  - chin bar, crown vents, rear spoiler, neck roll;
  - the operator's boom mic.
- **Coates suit detail:** belt and buckle, cloth twill, reflective hoops on the shins and forearms.
- **The safety officer's hi-vis vest** is now part of his own skin:
  - lime, with two silver hoops and braces over the shoulders;
  - SAFETY across the back and Coates over the heart;
  - it bends with him, and the separate vest mesh and its material are gone.
- **Cost:**
  - 13,282 triangles a person (was 10,068), about 116,000 for the whole crew (was 90,000);
  - crew 20 draws (was 21);
  - one atlas, now 2048 x 2048 (was 2048 x 1536).

### The seated driver (car-driver.js)
His seat, head, helmet, arms and the first-person cockpit are unchanged. Each glove now closes round the grip:
- the back of the hand runs from the cuff to the knuckles;
- four fingers wrap over, round and behind the rim in three joints;
- the thumb lies over the front toward the spokes.

The wrist moved 3 cm back so the hand is a hand's length. Each glove is one mesh (it was six).

## Tests (`evidence/people_tests.js`, run in the real machine through `machine_rig.js`)

Each run opens the machine, stops the drawing loop and steps it with its own fast-forward, sampling every 0.25 s through four
scenarios:
1. the hall at rest, with chores (150 s);
2. the V8 running (40 s);
3. a far-rear wheel service, end to end;
4. Explode, with the driver getting out and back in.

Every person's skinned mesh, as drawn, is checked in each sample against six things:
1. **The car:** walking inside the car's box is a fail. Any body point inside a car part (an oriented box, then ray parity against the
   part's own surface) is a fail. Hands and forearms may touch what they work on.
2. **The hall, the props and each other:** no body point inside a hall object, a prop or another person.
3. **The floor:** at least one sole within 3 cm of the floor, and none more than 1.5 cm into it.
4. **Planted feet:** no planted toe moves more than 5 mm.
5. **The opening cameras:** nobody standing still has the car hiding his legs while his helmet shows over it.
6. **The seated driver:** inside the car, with his helmet top clear of the roof.

There must also be no page errors.

| run | result |
|---|---|
| base, desktop | 21 fails. The safety officer stands behind the car with his legs hidden and his helmet over it, 12 samples from the car view (Andrew's "driver"). The race driver crawls through the car. Soles go up to 7 cm into the floor. The mechanic's foot is in the rack. The pit technician's head is in the side skirt. The mechanic's head is in the rear quarter. Crew walk into each other. |
| work, desktop (before the car-app.js edit) | 6 fails, all in Explode. The hall at rest, the V8 run and the far-wheel service have none. In Explode the race driver crawls through the car, and the crew are not told it is coming apart. Both need the car-app.js edit below. |
| work + the car-app.js edit (scratch copy), desktop and phone | PASS |
| **work, with the car-app.js edit applied (final), `people_tests.js work both`** | **desktop 1440 x 900: PASS, 1,575 samples. Phone 390 x 844 at dpr 2: PASS, 1,575 samples. Run twice, both PASS.** |

A later run showed the mechanic brushing the safety officer in 2 of 1,565 samples during the far-wheel service. That was fixed in the
crew's behaviour, not by loosening the test:
- the safety officer stops his round and watches from his corner during a service;
- his corner and checks, and three crew posts, are moved off the aisles;
- step-aside and personal space added (above).

The one change to the test itself: someone mid-walk who is waiting for another to pass counts as on the move, not as standing still,
in the "seen over the car" check.

Other results from the passing runs:
- **Seated driver:** helmet top 7.4 cm under the roof and inside the car.
- **Feet:** no slide (0.0 mm) and no sole into the floor.
- **No page errors.**

What the test could not check: the gloves on the rim. The test did not find the rim mesh by name, so the grip was checked by eye on
the cockpit screenshot.

Run it from `03_GC500_Delivery_Control`:
`CHROMIUM_PATH=/opt/pw-browsers/chromium NODE_PATH=$(npm root -g) node v8.08_coates_way_machine_DRAFT/evidence/people_tests.js work both`

The first argument can also be `base`, or a folder holding a copy with car-app.js edited.

Screenshots were taken at desktop size (dpr 2) and looked at before this was written. They are in the session scratchpad, not the
repo, as asked:
- **The car:** nobody stands over or behind the roof.
- **V8 powertrain:** nobody on the roof; the seated driver's helmet is inside the cage, under the roof.
- **The cockpit:** gloves on the rim at nine and three.
- **Close-ups:** the safety officer's front and back, the lead, the mechanic and the seated driver.

There are no phone screenshots: a dpr 2 frame takes minutes on the software renderer. The phone was checked by the test run above
(390 x 844 at dpr 2, PASS).

## The edit to `work/car-app.js` (now applied in work by its owner)

The race driver should get out beside his door and never through the car. The crew should be told when the car is coming apart.
Make these eight exact replacements. Each search text appears once, except the last, which appears twice. All of them were checked
against the current car-app.js.

1. `const DX_SEAT=[.70,-.32],DX_SILL=[-.10,-1.45],DX_SAFE=[3.0,-3.95],DX_FACE=[.4,-.2];`
   → `const DX_SEAT=[.70,-.32],DX_SILL=[.70,-1.50],DX_SAFE=[-4.4,-3.75],DX_FACE=[.4,-.2];`
   - The new standing spot is outside the open door, behind it, clear of its swing.
   - The new safe spot is in plain view, behind the painted line, at the nose end.
2. `function crewState(){return {running:drive.running&&drive.omega>1e-3,rpm:PT.rpm};}`
   → `function crewState(){return {running:drive.running&&drive.omega>1e-3,rpm:PT.rpm,apart:drive.spread>.01||drive.spreadTarget>.01||DX.state!=='seated'};}`
   - The crew leave the car before it comes apart.
3. In `buildDriverWalker`, after `crew.root.add(fig.root);` insert `if(crew.addPerson)crew.addPerson(man);`
   - The crew walk round him and give him the way.
4. `if(DX.phase==='crawlout'||DX.phase==='rise'){m.crouch(1);m.walkTo([DX_SEAT],{speed:.6});DX.phase='crawlin';return;}`
   → `if(DX.phase==='crawlout'||DX.phase==='rise'){m.crouch(1);DX.phase='duck';return;}`
5. `if(P==='door'&&DX.door>=1){m.place(DX_SEAT[0],DX_SEAT[1],Math.PI);m.post={kind:'crouch',k:1,want:1,stage:null,rate:1.4,seat:null,kneel:null};driverShow(true);m.walkTo([DX_SILL],{speed:.7});DX.phase='crawlout';}`
   → `if(P==='door'&&DX.door>=1){m.place(DX_SILL[0],DX_SILL[1],Math.PI);m.post={kind:'crouch',k:1,want:1,stage:null,rate:1.4,seat:null,kneel:null};driverShow(true);DX.phase='crawlout';}`
   - He appears crouched outside the open door, as if just out of the seat, and stands up. No crawl through the car.
6. `else if(P==='rise'&&m.post.kind==='stand'&&m.post.k<=0){m.walkTo(crewRoute([m.pos.x,m.pos.z],DX_SAFE,CREW_OBSTACLES,CREW_NODES),{face:[0,0],clearOf:CREW_OBSTACLES});DX.doorTo=0;DX.phase='walkaway';}`
   → `else if(P==='rise'&&m.post.kind==='stand'&&m.post.k<=0){DX.doorTo=0;if(DX.door<=0){m.walkTo(crew.plan([m.pos.x,m.pos.z],DX_SAFE,m).slice(1),{face:[0,0],clearOf:CREW_OBSTACLES});DX.phase='walkaway';}}`
   - He shuts the door, then walks off round the crew.
7. `if(P==='walkback'){if(Math.hypot(m.pos.x-DX_SILL[0],m.pos.z-DX_SILL[1])<1.4)DX.doorTo=1;if(m.arrived&&DX.door>=1){m.crouch(1);DX.phase='duck';}}`
   → `if(P==='walkback'){if(m.arrived)DX.doorTo=1;if(m.arrived&&DX.door>=1){m.crouch(1);DX.phase='duck';}}`
   - The door opens when he gets there, not into him on the way.
8. `else if(P==='duck'&&m.post.k>=1){m.walkTo([DX_SEAT],{speed:.6});DX.phase='crawlin';}`
   → `else if(P==='duck'&&m.post.k>=1){DX.phase='crawlin';}`
   - Plus both `m.walkTo(crewRoute([m.pos.x,m.pos.z],DX_SILL,CREW_OBSTACLES,CREW_NODES),` → `m.walkTo(crew.plan([m.pos.x,m.pos.z],DX_SILL,m).slice(1),`
     (the two walks back to the door).

The `crewRoute`, `CREW_NODES` and `buildFigure` imports can stay; nothing else in car-app.js needs to change.

## Notes
- **Far side of the car:** crew still go there to work on a far wheel, a far tyre or the engine bay. From the opening cameras they
  are then seen behind the car, as they would be in a photo. The test counts those as "at work", not as standing over the car.
- **Visibility depends on the camera:** what is "behind the car" depends on the camera. Orbiting round will always put someone behind
  it from some angle. The posts and the safety officer's round are set for the two opening views on a laptop and on a phone.
