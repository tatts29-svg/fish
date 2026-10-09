# Selected-day weather source

Author: Andrew Fisher

This folder contains the reproducible source for the existing live v8.18 weather update. Only the selected native day animates; the page retains its forecast values, dates and motion controls.

Public release details and review status were supplied in [the approved handover](https://github.com/tatts29-svg/fish/pull/1#issuecomment-5968690701) and [acknowledged](https://github.com/tatts29-svg/fish/pull/1#issuecomment-5968693281).

Base SHA-256: `7ae89da4e80b070ade2977ef4e47ed3e766be6dc7722bd610e21ad78ddaa77d0`. Published SHA-256: `f3bb490b0a6a23ef820dc71d359b5e246a443778e0d1baef35dcf3393a259000`, 9,265,578 bytes.

To reproduce that release, apply `patch_v818.py` to the exact base above and run the shared attribution scrub and page checker. The patch refuses a second application. A future change starts from the then-current live page.

This source transfer excludes private evidence, source attachments, operational snapshots, contact information and financial records. The original bundled evidence commit is not published by this transfer.
