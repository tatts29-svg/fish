# Supported multisampling

Author: Andrew Fisher

The captured WebGL2 context reports 4× support for both the HDR colour and depth/stencil formats, with no 2× mode. Balanced requests 2×; the prior intersection discarded 4× and silently rendered with one sample. The bounded selector now accepts a common 4× mode for that otherwise-unsatisfied 2× request. It keeps 2× when available and never substitutes 8×. Other requested counts retain their previous selection.

Only the capability selector changes. Existing allocation, incomplete-framebuffer fallback, resolve, target disposal, render sizing and adaptive quality paths remain byte-identical. The patch verifies the original allocator's SHA-256 before making that replacement.

CPU checks pass 26/26, including all 1,024 combinations of the 0/1/2/4 colour/depth capabilities and requested count, HDR and RGBA8 storage, failed framebuffer cleanup, resolve and repeated disposal. Four patch guards and the official static page check pass. These use a mocked WebGL contract and do not establish real-device frame rate or memory use.

| HDR target size | Extra 4× storage versus former no-MSAA fallback | Extra versus intended 2× storage |
|---|---:|---:|
| Desktop 1280 × 517 | 30.29 MiB | 15.15 MiB |
| Phone 390 × 590 | 10.53 MiB | 5.27 MiB |
| Balanced cap, 1,800,000 pixels | 82.40 MiB | 41.20 MiB |

These are attachment estimates: 8 bytes of HDR colour plus 4 bytes of depth/stencil per sample, or 48 bytes per pixel for 4×. RGBA8 needs 32 bytes per pixel. Existing resolved textures and post-processing targets are unchanged. Driver padding and measured GPU performance are outside this CPU evidence.

Final private candidate `85adb462803e6830e1a7162a88f20d25fcd678fc854ad2c70d8b95335ae21467` passed 82 GPU checks, including actual 4× allocation at both native sizes, High/Balanced buffer replacement, explicit target deletion and context recovery. The ten final images were independently inspected. Official fresh-live candidate `07d618803b0b6ee97b27265ce4eeadd0390190a4a61dd25a7c1d428ca1bc2992` has byte-identical non-business scripts; the binding is in `source802_checks.json`. The browser run establishes these lifecycle and rendering results on its test context, not phone hardware frame rate or driver memory consumption.

Reproduce on an exact pre-AA input and AA output:

```bash
node evidence/aa802_checks.cjs INPUT_HTML OUTPUT_HTML evidence/aa802_checks.json
python3 evidence/aa802_patch_checks.py INPUT_HTML evidence/aa802_guards.json
```

The initial CPU output `/workspace/private-aa802-candidate.html` is built on the earlier v8.00 `43a74f7b` visual candidate solely to isolate AA. It is not the final publication build and predates the accepted orange-paint tuning. Final release evidence must name the combined candidate.
