# v10.91 racecar rendering — DRAFT

Author: Andrew Fisher

Andrew requested a better-looking car and smoother, faster rendering on 20 Oct 2026. The surrounding Showcase backgrounds and photographs are preserved. This release follows v10.90 and must rebuild on its verified live bytes.

The solid-car shader ignored the adaptive reflection-off flag: its report said reflections were off while four facade rays remained active. The fix honours the flag, makes that quality step available from the default Balanced setting, and recognises the same remaining work after state restoration.

Compatible car parts share draws without changing their geometry, normals, UVs, wheel transforms, materials, or blended/decal order. The car uses 28 draws instead of 43 (35% fewer); Balanced retains all 86,862 triangles and 64,796 vertices. Decals and emissive materials skip lighting work whose result was already overwritten. Fine livery stripes use filtered edges, and the existing lettering atlas gains anisotropic filtering capped at 4× where supported. Unsupported devices retain trilinear filtering. No new models or assets are introduced.

The authored car model, physics, cameras, surrounding scene rendering, audio, operational data, contact projection and Showcase content are unchanged. No native records are written.

Tests and evidence:

- `tests/source1091.py`: exact predecessor guard, repeat-patch rejection and protected source parity.
- `tests/geometry1091.cjs`: actual candidate geometry, draw semantics, source-array immutability and exact blended order at both geometry qualities.
- `tests/atlas1091.cjs`: unsupported, low, bounded and invalid optional filtering capabilities.
- `tests/draw-semantics1091.cjs`: independent native draw functions at three speeds and both detail levels; exact per-part transforms, uniforms, blend state and depth writes.
- `tests/shader-adaptive1091.cjs`: independent shader-expression and adaptive-ladder contracts, including restored minimum-scale states.
- `tests/controls1091.cjs`: actual GL reflection uniforms, adaptive/manual quality controls, vehicle selection, unchanged records and cleanup on desktop and phone.
- `tests/capture1091.cjs`: deterministic camera and canvas captures with draw submissions and GL errors. `tests/pixel_compare1091.py` compares its raw RGBA output.

Private screenshots and detailed browser evidence remain outside the repository. Chromium uses ANGLE SwiftShader software rendering here; its timings are comparative diagnostics, never claims about physical-device frame rate.

Status: development implementation and tests frozen; development desktop/phone controls and independent review passed. Not ready to upload. Final v10.90 rebase, desktop/phone controls, required sweeps and guarded publication are outstanding. `validation_development.json` records exact source and evidence hashes.
