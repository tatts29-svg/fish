# Andrew's files, 9 Oct 2026: Event Portables quotes Q6844–Q6847 (private inputs, encrypted)

Author: Andrew Fisher. These hold the supplier's prices, so they are kept encrypted. The method and password are the same as
for the v8.71, 7 Oct and 8 Oct inputs (the papers password), and the password is not in this repo.

**Where they came from:** Andrew uploaded them to Claude on 9 Oct 2026, about 02:00 AEST, with the words "Give these to codex."
Earlier, at about 00:10, he had said: "We are going off what their price is. Thats all i have."

`inputs_09oct.zip.enc` sha256 `07c8ecf2940ec2865ce141d6219c0e2693e87f05f17a11b8945d098f0e975865` (zip inside:
`e1ddfb72b10cbb1a51b744b2a725700b8d2f7f5affca338185467d8c059e01d3`). The round trip was proved when it was made.

```
openssl enc -d -aes-256-cbc -pbkdf2 -iter 300000 -in 03_GC500_Delivery_Control/inputs_09Oct2026/inputs_09oct.zip.enc -out /tmp/inputs_09oct.zip   # asks for the password
```

| File (as uploaded, `_2`) | sha256 | Pages | What it covers (quantities only, no prices here) |
|---|---|---|---|
| Q6844_2.pdf | `8c795f410ff1444f…` | 3 | Services: 780 Chemical Toilet Fresh Water Flush services, 24 holding tank pump-outs, 51 toilet block cleans. Last updated 28 Jul 2026 13:19 |
| Q6845_2.pdf | `e5a86ee60344b8e4…` | 3 | Hire: 246 Fleet Fresh Flush toilets, 4 Comfort Inn accessible toilets, 6 pee panels, 3 VIP 5 Star combo toilet blocks, **1** 16 Pan toilet block; delivery and pickup. Last updated 28 Jul 2026 12:17 |
| Q6846_2.pdf | `e47a7ac7f921074a…` | 3 | Water: 6 water deliveries, 1 × 3000 L free drinking water tank. Last updated 28 Jul 2026 13:25 |
| Q6847_2.pdf | `4d395843cc37d7d7…` | 3 | Luxury toilet trailers. Last updated 28 Jul 2026 12:25 |

All four are billed to Coates Hire, delivered to V8s Gold Coast 2026, and printed 28 Jul 2026. Page 1 is the quote; the
other two pages are the supplier's hire terms.

**Noted for the units and sub-hire work (Codex):**
- Q6845 covers **one** 16 Pan block. WC31's second 16Pan block has no quote line in these four. Ask Andrew.
- Q6844 is service and cleaning, not hire, so its lines belong with the Event Portables service costs, not with units.
- No price from these files goes into the repo in clear text.
