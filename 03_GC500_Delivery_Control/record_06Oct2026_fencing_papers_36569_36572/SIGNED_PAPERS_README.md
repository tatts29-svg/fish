# Signed papers, 2 Oct 2026 — six more for the record and the Documents gallery

Author: Andrew Fisher · 6 Oct 2026

Andrew (6 Oct, Claude chat): "Have more fencing dockets.. these are also to be attached to please." Six signed Advanced papers, all dated 2 Oct 2026:

| Hire agreements (red book) | Service notes (green book) |
|---|---|
| 36569 Event - ELEC · 36570 Telstra COW · 36571 Triangle to Gate 6 beach run · 36572 S14 construction zone | 24466 Telstra COW · 24467 Phillip Park - Advanced compound |

`papers.json` is the transcription: every figure as written, with `to_confirm` for what the paper does not say and `read_with_care` for hurried handwriting. Nothing here changes the record; Codex (edit key) enters the papers and uploads the photographs, as for 36564–36568.

## For Codex

1. **Enter the six papers** through the Fencing tab forms from `papers.json`, recorded as "Andrew Fisher": F-AFV-0011 (36569), F-AFV-0012 (36570), F-AFV-0013 (36571), F-AFV-0014 (36572), N-AFV-0006 (24466), N-AFV-0007 (24467). Work date 2 Oct 2026; week sheet "Week 3" (see `week_note`). The two `to_confirm` scrim items (36569 at 82.5 m by Andrew's 2 Oct rule; 36570 at 25 m from service note 24466) go in as written here unless Andrew says otherwise; both are named so they can be taken off in one move.
2. **Upload the six photographs** on the Documents tab as Fencing dockets, named by paper number (`36569.jpg` …). This repository is public and the papers carry signatures and names, so they are here only as an encrypted file. **The password is not in this repository or in any GitHub comment; Andrew gives it to Codex directly.**

`signed_papers_6.zip.enc` — AES-256-CBC, PBKDF2 (300,000 iterations), salted; 22,355,792 bytes; SHA-256 `efe314762f1d679b097410bc57838aff063147eb3a334c587380f330ea45aeea`. Inside: `signed_papers_6/` with the six photographs named by paper number and `SHA256SUMS`.

```
openssl enc -d -aes-256-cbc -pbkdf2 -iter 300000 -in signed_papers_6.zip.enc -out signed_papers_6.zip   # asks for the password
unzip signed_papers_6.zip && (cd signed_papers_6 && sha256sum -c SHA256SUMS)
```

3. Record the live bytes read back and the record version on the board, then delete the encrypted file from the repository, as last time.

## Effect at the card, as transcribed

| Paper | Charged (ex GST) | Paid to Advanced |
|---|---|---|
| 36569 — 82.5 m clean + 82.5 m scrim | $3,439.48 | $2,838.00 |
| 36570 — 25 m scrim (metres from note 24466) | $638.25 | $610.00 |
| 36571 — 337.5 m clean | $5,454.24 | $3,375.00 |
| 36572 — 15 m clean | $242.41 | $150.00 |
| 24466 + 24467 — 0.75 h | within the card rates | $75.00 |
| **Total** | **$9,774.38** | **$7,048.00** |

Rates: Clean $16.1607/m charged, $10.00/m paid; Scrim $25.53/m charged, $24.40/m paid; labour $100/h paid (the 2026 card and the tracker, as the page holds them). $2,744.48 of the charge rests on the two scrim items marked to_confirm.
