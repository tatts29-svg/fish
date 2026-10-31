# v12.06 · Share a 50 metre map area — LIVE

Author: Andrew Fisher.

Andrew asked to share a 50 m × 50 m area around a selected map spot, naming its contents and showing the equipment icons, doors and which way doors face.

The existing press-and-hold/right-click spot dialog now prepares a fresh 3840 × 4160 PNG: a north-up 50 m square plus its caption. It includes the master-plan drawing, numbered equipment symbols, intersecting mapped footprints and recorded door swings/direction arrows, with the full reference list in the accompanying text. Plan chevrons are read as the recorded door edge. Truck loading sides remain separately labelled; unknown door positions are never guessed. Reference quantities are not represented as individually surveyed units inside the square. The picture and text carry their capture time.

Native file sharing sends the image and text to the user's chosen share target. Devices without file sharing save the picture separately and copy/share the text. Tests capture these calls without sending anything. This adds no operational-record writes and changes no positions, business calculations, machine files or another release's scope.

Status: LIVE, 25 Oct 2026 07:20:40 AEST; independently implemented, tested and published. Base v12.05 is pinned at `68a8da20f7576dc58357757efdb54471967c67deb49df68265ee4bf1ed1dc895`; candidate `8e371c70200d6b6566d59e7c078f70e5f4737654470a3d812b7fda9159166933`, 15,247,411 bytes, 194 inline scripts. The exact existing spot module is also pinned. All other page bytes, including the new Build and Servicing modules, are identical to the base except the release footer.

Final candidate: geometry 18/18, preservation 8/8, desktop 29/29, phone 27/27, viewport regression 9/9; replacement Build suite 28/28 on both sizes. Both navigation sweeps passed 27 routes, 19 direct panes, seven deep links and Back, with no page/console errors or attempted writes. Desktop, phone and the 3840 × 4160 export were inspected. Native sharing, cancellation, text-only and download/copy fallback were captured locally; tests did not contact recipients. Physical handset delivery was not tested.

Use the shared `toolchain/build.sh` and `upload_page.py --credential-proxy`, with the unchanged-live-base guard; never force an upload. This candidate was built in `build/GC500_v12.06-r2/`. Upload dry run passed. Guarded upload passed; separate public GET at 07:22:54 AEST matched every byte and the v12.06 footer. Actual public UI passed 7/7; desktop and phone images inspected. READY source `2f70ad3f3e3ff144f5625f3ba6e5ae0749b6f430`. Raw pages, screenshots and operational excerpts remain in private evidence storage.
