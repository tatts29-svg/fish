# Personal daily-run messages — READY TO UPLOAD

Author: Andrew Fisher.

Andrew requested a personal greeting, the recipient's name, the day's weather, a Take 5 reminder and the daily-run link.

Message daily runs now shows the text inside its existing panel. The greeting uses the selected person's first name, followed by the exact run date, a sourced Surfers Paradise forecast, a concise Take 5 reminder and the existing daily-page link last. Future runs use their selected day's forecast. Missing or stale weather is clearly unavailable; current observations are never substituted for another date. Further-out forecasts are labelled outlooks.

Andrew also requested removal of the generic Timeline Email control, since emailing is available within the document groups. Those group controls remain. The Event Portables inventory already exists in the supplier delivery plan on Timeline; this release adds the missing print action to Equipment.

Preview waits briefly for the existing weather loaders, records the weather shown and checks it again before sending. A changed or expired forecast requires a fresh preview. The existing deliberate-send button, edit permissions, recipient checks, current-record checks, quotas, receipt status, duplicate prevention and unknown-send locks remain. Text stays within the service's 480-character limit. No automated send or external message is part of this release work.

Base: v8.60 `ae6880d9fc3e5555f34ad30eed47e31ed873847065927b4b6737dc5604b20073`. Candidate `a02c7b5eff2c525c69f8890dafc3f9da747da1f443e4f38a8f38360a2ed9cae7`, 10,997,956 bytes. Standard build checks, 20 weather cases and 48 isolated browser send cases pass. Final native laptop/phone checks pass: personal message preview, selected day page, duplicate Email removal, preserved group/supplier email and actual three-page inventory PDF from Equipment. Both final 21-route/seven-link/Back sweeps pass with zero runtime or console errors. Phone screenshots inspected. Independent final source review found no release-blocking issue. No shared-record, financial-model or backend changes. Implementation source: `e24e829b`. Codex completed implementation and independent review; guarded publication is next. Andrew has now authorised shared build/publication work by Claude and Codex; either agent may publish a ready, tested release after coordinating the exact source and current live base. Private generated messages, contact evidence and screenshots remain outside Git.
