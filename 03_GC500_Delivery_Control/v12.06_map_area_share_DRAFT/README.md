# v12.06 · Share a 50 metre map area — DRAFT

Author: Andrew Fisher.

Andrew asked to share a 50 m × 50 m area around a selected map spot, naming its contents and showing the equipment icons, doors and which way doors face.

The existing press-and-hold/right-click spot dialog now prepares a fresh 3840 × 4160 PNG: a north-up 50 m square plus its caption. It includes the master-plan drawing, numbered equipment symbols, intersecting mapped footprints and recorded door swings/direction arrows, with the full reference list in the accompanying text. Plan chevrons are read as the recorded door edge. Truck loading sides remain separately labelled; unknown door positions are never guessed. Reference quantities are not represented as individually surveyed units inside the square. The picture and text carry their capture time.

Native file sharing sends the image and text to the user's chosen share target. Devices without file sharing save the picture separately and copy/share the text. Tests capture these calls without sending anything. This adds no operational-record writes and changes no positions, business calculations, machine files or another release's scope.

Current state: implemented, browser verification in progress; NOT READY and NOT LIVE. Rebased on verified v12.05, pinned in BASE_SHA256. The patch also binds the existing spot module's exact hash. Rebuild and retest if live changes. The shared toolchain performs the final guarded release.

Checks so far: geometry 18/18, whole-page preservation 8/8, initial desktop export verified crisp at 3840 × 4160 with all ten recorded toilet door edges. Desktop 29/29, phone 27/27 and viewport regression 9/9 passed on the earlier base. Final checks are being rerun on v12.05, including the new Build regression suite. Raw screenshots and operational excerpts stay in private evidence storage.
