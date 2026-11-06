# v8.09 mechanical review

Author: Andrew Fisher

Reviewed immutable source `ba9fff7ec48d3d49d037f461c145b1abd6f2c957`, 2 Oct 2026. Scope: engine, clutch, differential, braking, oil movement, pit machinery and the related state transitions/register. CPU and source review only; the vehicle-visuals reviewer owns all browser/GPU work. No moving draft, live file, operational record or token touched.

Two small clutch corrections are ready as an isolated proposal. The new mechanisms already have useful moving detail; making their start and release agree between frames adds more credibility than adding further tiny parts.

## Actual bugs reproduced

1. **P2 — the first starter frame drives the gearbox before opening the clutch.** `work/car-app.js:262` calls `engine.animate(...)` before `engine.setStarter(drive.starting,lastDt)`. The latter passes the current starting state to the new clutch. The first starting frame therefore uses the previous state; catching the engine similarly leaves the clutch open for another frame. CPU replay of that exact call order with a 0.05-rad starting step passed all 0.05 rad into the input with engagement still 1. Moving `setStarter` before `animate` leaves the input at zero and engagement at zero. The existing browser test checks subsequent starting samples and can pass despite this first-frame error.

2. **P2 — clutch take-up depends on frame partition.** `work/mech-driveline.js:127` updates engagement and then multiplies the entire crank step by that final value. Releasing over the stated two-thirds radian transfers 0.666667 rad in one call, 0.500000 in two calls, 0.366667 in ten, and 0.336667 in 100. This contradicts the source's frame-independent claim and creates extra input-shaft travel on longer frames. Integrating the linear engagement ramp, including any fully clamped remainder, gives 0.333333 rad for all four partitions. The proposal also checks negative crank travel and travel beyond the ramp. This validates the existing illustrative take-up rule; it does not claim a physical clutch simulation.

## Additional source findings

- **Existing actual code defect, lower priority:** `work/car-powertrain.js:660` increments forced radiator-fan rotation by a fixed 0.45 radians on each `animate` call. At the same stopped-engine FAN-on state, 60 updates produce twice the turn of 30 updates. It also switches back to the crank's phase immediately when FAN turns off. This predates the v8.09 additions. A time-based accumulated phase would make the forced fans consistent across quality settings; no fan change is included in the small clutch proposal.
- **Test-evidence risk:** `work/car-app.js:189` fast-forwards drive, gears and dyno many times but calls `updateTransforms` only once at the end, using the old `lastDt`. The new clutch, input/main-shaft integration, oil matrices, brake heat and body-wheel rotation are updated there. A long `__cw.advance` across starting or a gear change therefore is not equivalent to the same rendered sequence: it can apply the final clutch/gear state to the whole accumulated crank interval. Brake cooling also uses wall-clock `performance.now`, not that synthetic interval. Keep these existing tests as smoke checks, but use repeated explicit mechanical steps or sampled rendered frames for timing/coherence claims. No harness change proposed because it has broader driver/service dependencies.
- **Register accuracy risk:** the timing-tensioner role in `work/mech-register.js:19` ends “the belt cannot jump a tooth”. The animation does not establish that absolute real-world claim. “Helps maintain belt tension” conveys the intended mechanism without claiming an infallible belt. The differential's road-steering illustration is already explicitly described in source; this review does not ask for different rear-wheel speeds on the common dyno rollers.

## Visual value and budget

**Subjective upgrade:** lead an engine inspection with the existing sectioned differential or clutch and make their related parts easy to inspect together. Their rotating tooth relationships and start/release motion are more legible than extra unlabelled hardware. The source notes that the tub/tunnel can hide them while assembled; a useful close view matters more than extra mesh detail. Requested assembled engine and focused clutch/differential captures from the sole browser owner; no visual acceptance claimed here.

Oil pulses are already one instanced mesh and stop updating when crank travel is unchanged. New brake/glow meshes are bounded; the glow is attached to the actual rear hubs. Pit machinery remains clock-driven with existing state labels and board updates limited to the visible board. This review makes no measured GPU or physical-phone performance claim.

## Isolated proposal and checks

The portable proposal is [mechanics/clutch.patch](mechanics/clutch.patch), affecting only `car-app.js` and `mech-driveline.js`. [mechanics/manifest.json](mechanics/manifest.json) binds each immutable input and proposal output to its SHA-256. No full source copy is included in this review package, and no proposal has been applied to Claude's draft.

The [patch generator](mechanics/patch_clutch.py) accepts `--source WORK --out OVERLAY` and writes the candidate files only to the separate output directory. It refuses a non-unique or repeated replacement. The [CPU test](mechanics/cpu_tests.cjs) accepts `--source WORK --output JSON`, plus `--proposal OVERLAY` to test that candidate. For example, from this review directory, substitute the immutable source and a separate scratch output path:

```sh
python3 mechanics/patch_clutch.py --source "$SOURCE_WORK" --out "$PROPOSAL_DIR"
node --experimental-vm-modules mechanics/cpu_tests.cjs --source "$SOURCE_WORK" --output "$EVIDENCE_DIR/reproduction.json"
node --experimental-vm-modules mechanics/cpu_tests.cjs --source "$SOURCE_WORK" --proposal "$PROPOSAL_DIR" --output "$EVIDENCE_DIR/proposal-check.json"
```

Recorded [baseline reproduction](mechanics/reproduction.json) and [proposal results](mechanics/proposal-check.json) preserve the observed values. The test evaluates the actual immutable modules with Three.js CPU objects and no renderer, browser, network or service writes. Four release partitions, first starter step, call order, forward/reverse saturated remainder, four restart/catch/stopped cycles, twelve stationary samples, a partial-engagement reversal in one versus fifty partitions, and a single step crossing full clamp all pass on the proposal. These checks validate illustrative mechanism maths, not real vehicle accuracy.

The integration reviewer has the isolated proposal for independent syntax/scope/replay review. Claude retains implementation ownership. Before accepting it into a release, check a real starting frame and catch frame in the existing engine view, then rerun the affected mechanical tests on the final source.
