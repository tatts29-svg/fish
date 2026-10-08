# Andrew's files, 8 Oct 2026 (private inputs, encrypted)

Author: Andrew Fisher. Encrypted because they may hold rates, names, contacts or phone numbers (the VMS plan's photos show
trailer numbers). The method and password are the same as the v8.71 and 7 Oct inputs (the papers password), and the password is not
in this repo.

`inputs_08oct.zip.enc` sha256 `7abeebb4f7c48c42440b3d36102fd9337f0386f6015a119fdcf26aba3fe3ebd6` (zip inside: `ef93aa6036c33686…`).
The round trip was proved when it was made.

```
openssl enc -d -aes-256-cbc -pbkdf2 -iter 300000 -in 03_GC500_Delivery_Control/inputs_08Oct2026/inputs_08oct.zip.enc -out /tmp/inputs_08oct.zip   # asks for the password
```

| File | sha256 | For |
|---|---|---|
| GC500_26_Schedule_6.xlsx | `228801df246f21b2…` | Schedule 6, saved by Andrew 8 Oct 2026 12:23 AEST: "please see attached and analyse update any new relevant data please and costs or anything we have missed". Page built on Schedule (5) `6383ebdd…` until a release applies it. |
| VMS001-26003-01_GC500_COATES_VMS_LOCATIONS.pdf | `9ef1527d1fd9c6c7…` | iEDM VMS plan (17 pages, PowerPoint export of 2 Sep 2026), sent ~11:00 AEST: "please see attached update of vms boards" |
| v900_fencing_addition.json | `ee576e40d18d1440…` | v9.00's private input: the fencing crew member Andrew added on 8 Oct (name and company only), bound by SHA-256 in `v9.00_crew_vms_counts_DRAFT/patch_v900_crew.py` and `patch_v900_broadcast.py` (env `V900_TEAM`) |
