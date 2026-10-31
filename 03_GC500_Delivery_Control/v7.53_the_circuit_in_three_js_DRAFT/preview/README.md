# Preview of the circuit — for Andrew to judge on his own screen

Andrew, 1 Oct: "With the showcase with the car going around the track don't change anything until I see a preview.
Just seen your pics above, they look worse." So v7.53 is on HOLD (STATUS.md) and this is the preview:
https://claude.ai/artifact/56TcGu6UQJYn8FiuNW3Suf (private to Andrew).

`GC500_Circuit_Preview.html` is the engine (`../src/*.js`), the race-control CSS (`../gc3dx.css`) and the circuit and
Surfers Paradise data lifted from the live page, in one page with a control strip (look, camera, quality, car, pause,
restart). Three.js loads from jsDelivr as it does on the page. It reads no record and holds no key. `assemble.py`
rebuilds it from the sources; `test_preview.js` starts it in the harness (software GL) — it built, drew and ran with 0
errors; `preview_check.png` is that check's sunset chase frame.

The evidence stills in `../evidence/` were drawn by software GL at 1600 × 587, balanced quality (no shadows, no
anti-aliasing); a real screen runs high or ultra with shadows and anti-aliasing, so judge the preview, not the stills.
