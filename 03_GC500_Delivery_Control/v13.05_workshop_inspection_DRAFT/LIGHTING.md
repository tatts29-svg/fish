# Inspection lighting

Author: Andrew Fisher

`workshop-lighting.js` refines the three existing directional lights during an
engine/component close inspection. At full strength the key is 94% of its current
host intensity, fill is 125%, and rim is 103%. This modest shift reduces the hot
key and opens dark recesses while preserving the existing light colours. It does
not change the car's paint, materials, lights' positions or targets, renderer
exposure, environment, quality ladder, pixel ratio, shadows or postprocessing.
No lights, shadow casters or render passes are added. Final visual acceptance is
required on the assembled candidate; pure tests do not establish device speed.

## Host integration

```js
const inspectionLighting = installWorkshopLighting({
  lights: {key, fill, rim},
  reducedMotion: () => matchMedia('(prefers-reduced-motion: reduce)').matches,
  onChange: () => workshopRender.invalidate('inspection-lighting'),
});
// After workshop.update(dt), before the existing render plan:
inspectionLighting.update(dt, {
  active: !!workshop?.active,
  inspection: !!workshop?.inspection.active,
});
// Inside the workshop restore callback (immediate, even before the next frame):
inspectionLighting.restore();
// On final teardown, not persisted pagehide/bfcache:
inspectionLighting.dispose();
```

The helper has no animation loop. It advances with host seconds through a 0.35 s
smoothstep blend. Manual overview fades back to the normal lighting; leaving the
workshop or disposing restores immediately. Reduced-motion mode applies the
selected endpoint immediately. Reversing an incomplete blend starts at the current
amount. Original light ownership and all non-intensity properties are retained.

The baseline is captured when inspection starts, after host setup. Any finite,
nonnegative intensity written by the host while inspection owns the lights becomes
that channel's new authoritative baseline. Restore also checks for a write since
the last update, so it does not resurrect stale values. Zero-intensity lights stay
off. Invalid time steps do not move the preset; invalid later intensity values do
not replace the last known finite baseline. Once restored, the helper releases its
ownership and does nothing until another inspection starts.

`active`, `transitioning` and `diagnostics` are read-only inspection hooks. The
change callback runs only when a real intensity value changes, allowing the host
stationary-frame coordinator to redraw a changing preset without permanent
invalidations. The shadow maps can remain unchanged because the helper never
moves a light, model or shadow parameter.

Validation: `node tests/test_lighting1305.mjs` passes 33 checks covering exact
restoration, preservation of non-intensity properties, latest host changes,
reduced motion, equal elapsed-time behavior at 30/60 Hz, interruptions, stationary
writes, zero and invalid input handling, and idempotent disposal. Browser/visual
validation is coordinated by the release owner.
