# Personal daily-run messages — DRAFT

Author: Andrew Fisher.

Andrew requested a personal greeting, the recipient's name, the day's weather, a Take 5 reminder and the daily-run link.

Message daily runs now shows the text inside its existing panel. The greeting uses the selected person's first name, followed by the exact run date, a sourced Surfers Paradise forecast, a concise Take 5 reminder and the existing daily-page link last. Future runs use their selected day's forecast. Missing or stale weather is clearly unavailable; current observations are never substituted for another date. Further-out forecasts are labelled outlooks.

Andrew also requested removal of the generic Timeline Email control, since emailing is available within the document groups. Those group controls remain. The Event Portables inventory already exists in the supplier delivery plan on Timeline; this release adds the missing print action to Equipment.

Preview waits briefly for the existing weather loaders, records the weather shown and checks it again before sending. A changed or expired forecast requires a fresh preview. The existing deliberate-send button, edit permissions, recipient checks, current-record checks, quotas, receipt status, duplicate prevention and unknown-send locks remain. Text stays within the service's 480-character limit. No automated send or external message is part of this release work.

Base: v8.60 `ae6880d9fc3e5555f34ad30eed47e31ed873847065927b4b6737dc5604b20073`. Candidate `a02c7b5eff2c525c69f8890dafc3f9da747da1f443e4f38a8f38360a2ed9cae7`, 10,997,956 bytes. Standard build checks, 20 weather cases and 48 isolated browser send cases pass. The first native laptop/phone UI checks and both route sweeps passed. The final candidate includes the Timeline and Equipment follow-up; expanded native UI and both final navigation sweeps are underway. No shared-record, financial-model or backend changes. Codex owns implementation, independent review and publication; Claude remains paused. Private generated messages, contact evidence and screenshots remain outside Git.
