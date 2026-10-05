# Immersive selected Timeline weather — v8.56

Author: Andrew Fisher.

DRAFT, not live. Codex owns implementation and independent review; Claude remains intentionally paused.

Andrew found the earlier motion too weak and authorised reworking it. The selected card uses a full-depth weather backdrop with a contrasting date corridor and orange selection edge. Clouds travel visibly; sun and rays are stronger. Rain, heavy rain and storm types get a new layered moving rain field. Figures keep their solid data panels. Storms have a larger flashing lightning bolt in the clear sky area. Rain and snow also cross the entire foreground card; transparent, pointer-free layers preserve readability and controls. Sun and partly cloudy scenes have a rotating corona; strong wind follows the native WINDY flag. The native forecast source/values and existing weather classification are retained. Only the selected visible card runs; reduced-motion, hidden/tab-departure and print safeguards remain.

Base v8.55: `69dbf48d271dc73a17d9f3eb437eb3a425e68f075f954a8e769f92f69087c584`.
Candidate: `51e3a3876ab8fa20908b81dbc77face665e350871d2bf758e3bd8bf4731ab624`, 10,967,191 bytes.

Standard build and focused laptop/phone selected-motion checks pass. Final full-colour screenshots inspected; inherited quiet-day opacity is removed only for selected weather cards. New rain layer position movement and full face opacity are verified on phone/laptop. Final native sweeps running. No financial, operational record, weather source/model, load control, server or media changes. Evidence remains private.

Final browser-only weather matrix passes all nine scenes at both widths: sun, partly cloudy, cloud, rain, heavy rain, storm, fog, snow/sleet and sunny strong wind, plus unavailable forecast without invented artwork. Preview captures are labelled sample conditions and remain private. Final release sweeps running.
