# Personal daily-run messages — DRAFT

Author: Andrew Fisher.

Andrew requested a personal greeting, the recipient's name, the day's weather, a Take 5 reminder and the daily-run link.

Message daily runs now shows the text inside its existing panel. The greeting uses the selected person's first name, followed by the exact run date, a sourced Surfers Paradise forecast, a concise Take 5 reminder and the existing daily-page link last. Future runs use their selected day's forecast. Missing or stale weather is clearly unavailable; current observations are never substituted for another date. Further-out forecasts are labelled outlooks.

Preview waits briefly for the existing weather loaders, records the weather shown and checks it again before sending. A changed or expired forecast requires a fresh preview. The existing deliberate-send button, edit permissions, recipient checks, current-record checks, quotas, receipt status, duplicate prevention and unknown-send locks remain. Text stays within the service's 480-character limit. No automated send or external message is part of this release work.

Base: v8.60 `ae6880d9fc3e5555f34ad30eed47e31ed873847065927b4b6737dc5604b20073`. Candidate `808cb4c6f9825243cde862e35845d23031e3b39d5dbae968ea2873a604ba57cf`, 10,999,384 bytes. Standard build checks, 20 weather cases and 48 isolated browser send cases pass. Native UI and navigation checks are underway. No shared-record, financial-model or backend changes. Codex owns implementation, independent review and publication; Claude remains paused. Private generated messages, contact evidence and screenshots remain outside Git.
