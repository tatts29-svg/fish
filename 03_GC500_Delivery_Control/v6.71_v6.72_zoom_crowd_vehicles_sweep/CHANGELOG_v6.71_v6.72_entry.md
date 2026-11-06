## v6.71–v6.72 — 26 Sep 2026 — smooth map zoom, a real crowd, finished Special Editions, the sweep

Andrew: "Maps zooming still clunky, needs work, needs improving. Showcase: detail of the crowd needs improving; details of the new vehicles need improving. Once these are done, deep look into any bugs, any load issues, any scroll issues, any navigation issues — let's get them all sorted. We are on the home stretch."

### Map zoom (v6.71, `patch_v671_map.py`)
What made it clunky:
- Every map pin had a 0.18 s transform transition, so after each zoom step all 66 pins slid behind the drawing.
- The pins shared the drawing's layer, so resizing them repainted the 2,600-pixel sheet on every step.
- A wheel notch jumped 18% in one frame and a button 50%.
- Pinch and drag painted on every finger event.

Now:
- Zoom eases to its target over about 0.1 s, anchored on the cursor or fingers.
- While the drawing moves, the pins drop their transition and sit on their own layers. The sheet is redrawn sharp once it settles.
- Pinch and drag follow the fingers, once a frame.
- Double-click (desktop) and double-tap (phone) zoom in on the spot. At full zoom the same gesture goes back out.
- Test: the pins stay locked to the drawing through the whole zoom (P12 sits at 0.4291 / 0.4253 of the sheet at every step). Buttons, double-click, double-tap, reset and drag all work, and tapping a pin still opens its record.

### The crowd (v6.72, `crowd_v672.js`)
- Each spectator is now built to human proportions: two legs (long pants, or shorts with bare shins) on shoes, a torso that widens to the shoulders, a neck and a head.
- Heads have hair in four colours, or a cap with a brim, or a bucket hat. Some wear sunglasses and some shirts carry a team band.
- Arms hang at the sides as a sleeve and bare forearm, or go up in the air. Some raised hands hold a phone filming the cars. About one in fourteen is a child.
- The cheering bounce is unchanged.
- Phones (Balanced detail) leave off the small parts, so a phone draws about what it drew before. On High and Ultra: 4,653 figures, about 515k vertices.

### Special Editions (v6.72, `vehdetail_v672.js`)
- **Forklift:** head and tail lamps, a rear bumper, mirrors, a seat, a grab handle, and hoses up the mast.
- **Boom lift:** the basket's rotator bracket (the basket had no visible link to the boom), side plates on the jib, hoses along the boom, lamps, chassis hazard stripes and a fuel tank.
- **Scissor lift:** an access ladder, pothole guards, the lift cylinder, lamps and the control cable.
- **Tractor:** front weights, head, roof and tail lamps, mirrors, the three-point linkage, an exhaust cap and cab steps.
- **Both trailers:** safety chains, a number plate and amber side markers.

### The sweep (v6.72, `patch_v672b.py`)
- **Closing a record or the showcase no longer moves the page.** It used to nudge 10–16 px because focus went back to the button with a scroll-into-view.
- **Links:** a link to a page that doesn't exist (#nothing-here) now shows #today in the address bar instead of keeping the bad hash.
- **Small phones (360 px):** the branch-code buttons on Plant, the delivery card's footer line and long item codes now wrap. The "Show the working" table scrolls inside its own box.
- **Checked and working:**
  - Every deep link, including #register and #docs/photos.
  - Back and Forward through the tabs, with each tab's scroll position restored.
  - Escape and Back close the drawer and the showcase.
  - Search opens on Enter and clears on Escape.
  - A reload keeps the page you're on.
  - No script errors on any tab, desktop or phone.
- **Load:** 12 requests, a 1.8 MB page (gzip), first paint at 184 ms locally. Media is addressed by SHA-256 and the page is revalidated by ETag.
- **Test harness:** `S.camDebug` is a fixed camera in the 3D scene, set only by tests, used for the close-up comparisons in `shots/`.
