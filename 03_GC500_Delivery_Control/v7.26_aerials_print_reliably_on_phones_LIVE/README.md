# v7.26: aerial photos print reliably from a phone (LIVE)

Author: Andrew Fisher

Andrew, 28 Sep 2026, with a printed install sheet for P38: "On the installs the aerial shots dont print". On that sheet, Close-up and Around it read "The aerial photograph could not be loaded", while the master plan printed.

**Cause.** The same sheet made on a computer prints both aerials, so the record is right. The phone didn't get the one large aerial (2 MB, 4,760 × 2,994) in time. The likely reasons are a weak signal on site, or a phone short of memory while building seven pages. The page gave up on the first failure.

**Fix:**
1. The aerial starts loading as soon as a Timeline day is on screen, before Print is pressed.
2. A failed load is tried three times (1.5 s and 3 s apart), and the picture is decoded before use.
3. If the full aerial still won't come, a lighter copy is used instead (60% scale, 1 MB). The sheet gets its aerials, slightly softer, instead of a grey box.

**Tested (install sheet P38, Mon 28 Sep):**
- normal: both aerials from the full photo, one request;
- full photo blocked: tried three times, then the lighter copy used, and both aerials printed;
- both blocked: the sheet still says the photo couldn't be loaded, as before.

The full sweep shows 0 errors, the money probe is identical, and pre-starts still print one page each.

**LIVE: 28 Sep 2026.** Byte for byte on the view link, and the lighter copy is served by the site.
