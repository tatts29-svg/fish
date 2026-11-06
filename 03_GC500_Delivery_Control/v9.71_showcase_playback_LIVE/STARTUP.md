# Static scene preparation — v9.71 component

Author: Andrew Fisher

The previous startup installed track detail, architecture and vegetation on separate render calls, but drew the heavy scene between uploads. A read-only WebGL trace measured a 15.55-second `bufferData` wait when vegetation arrived behind the first heavy GPU work.

`startup971.js` retains the original installers and geometry. It prepares one static group per animation frame, including a final pass for the replacement tree mesh’s visibility indices, before allowing the first heavy render. The existing flat circuit remains visible and its credit displays preparation progress. The 3D canvas is revealed only after a successful render. Preparation holds elapsed simulation baseline without changing the simulation clock, seek position, driving, cameras or stored preferences. Unmount cancels a pending preparation callback immediately and releases its scene state. Hidden, closed, replaced and lost scenes defer; paused scenes can still finish their first picture. Failure uses the existing full-lap fallback.

Integration is the scoped `apply_startup971` function in `startup_patch971.py`; the root release patch supplies its exact-match replacement function. The native simulation frame body, geometry builders and shaders remain unchanged.

Validation: 15 deterministic scheduler/clock/visibility/fallback tests passed, and the isolated live-v9.69-plus-startup candidate parsed all 50 scripts. The paired SwiftShader trace recorded zero draw calls before preparation completed. Vegetation installation measured 566 ms versus 16,065 ms; the longest `bufferData` call measured 183 ms versus 15,548 ms. Graphics settings and native records were unchanged, with zero page errors or actual writes. Initial context creation and shader compilation still vary; these timings are not a physical-device frame-rate claim.

Sanitised figures and source hashes are in `evidence/startup-validation.json`. Full trace, CPU profile and screenshot are private under `/workspace/private-startup971`. Root owns the final combined scene/graphics/navigation checks and publication.

The profile preceded the final unmount-cleanup revision; its upload scheduling is unchanged. A new close-before-next-hidden-frame test verifies immediate cancellation, preserved native unmount arguments/receiver, one wrapper per scene and cleared state.
