# Easy Peasy Gifty

A gift finder that suggests presents to suit the person, counts down to their
birthday, and remembers what you already gave them so you never repeat one.

One file, `index.html`. No server, no accounts, no database. Everything a user
saves lives in their own browser. Open it locally, host it anywhere, or put it
behind a domain — it works the same.

---

## Why there is no Shopify store

The original plan was a Shopify store. It's the wrong tool for this model.

Shopify's job is taking payment for products you sell. Gifty doesn't sell
anything — it sends people to Amazon and takes a cut. There's no checkout to
run, so Shopify would be a monthly bill for a feature that never gets used.

Shopify becomes the right answer at **phase 3** below, when there are curated
gift boxes to actually sell. Not before.

---

## Turning it on: the affiliate tag

This is the only step between the app and it earning money.

1. Sign up at **associates.amazon.com.au**. Free, takes about ten minutes.
   They'll ask for a website — give them wherever this is hosted.
2. They issue a tracking tag that looks like `yourname-22`.
3. Open `index.html`, find the `AFFILIATE` block at the top of the `<script>`,
   and put the tag in:

   ```js
   const AFFILIATE = {
     tag: "yourname-22",
     template: "https://www.amazon.com.au/s?k={query}&tag={tag}",
     label: "Have a look"
   };
   ```

Every "Have a look" button now pays a commission on anything bought in the
next 24 hours — not only the item clicked. Rates run roughly 1–6% depending on
the category.

**Amazon's rule to know:** you must make three qualifying sales within 180
days or they close the account. Worth knowing before the clock starts, so turn
the tag on when there's traffic to send, not the day you sign up.

### Other retailers

`template` takes any retailer's search URL. Keep the `{query}` and `{tag}`
placeholders and it all keeps working.

- **Commission Factory** (commissionfactory.com.au) — Myer, Big W, Catch,
  THE ICONIC, Kmart. Better rates than Amazon and Australian shoppers trust
  the names. Per-merchant links, so it's a bit more setup.
- **eBay Partner Network** — good for the cheaper bands.

---

## Where the money comes from, in order

**1. Affiliate commissions.** The engine. No stock, no postage, no returns,
and the app stays free — which is what gets the volume in the first place.
Scales directly with traffic, which makes traffic the whole game.

**2. Corporate gifting.** The sleeper, and probably the fastest real revenue.
HR teams buy for staff birthdays and work anniversaries and hate doing it.
One company is worth a hundred consumers, they pay annually, and they don't
churn. This is a conversation, not a marketing campaign — which suits the
contacts already in hand.

**3. Subscription.** Later, once there's a base. Free tier caps at 3 people;
paid unlocks unlimited people, reminders and shared lists. Around $29/year.
Don't put this in early — a paywall on an app nobody uses yet just stops it
being used.

**4. Gift boxes.** Curated boxes and cards, sold properly. This is the phase
where Shopify earns its keep.

---

## Getting people through the door

**Shared lists are the growth engine.** It's already built. One person makes a
list and sends it to the family, and eight people open the app who'd never
heard of it. That loop costs nothing and compounds. Everything else is paid
for in time or money — this isn't.

**The Christmas window is the year.** A gift app does most of its business
between October and December. Search content takes three to four months to
rank, so the gift-guide pages need to go up in **August and September** to be
ranking by November. Miss that and the next window is a year away.

**Pinterest is underrated.** It's effectively a gift search engine and pins
keep working for years, unlike posts. Barely any competition from other apps.

**Short-form video.** "Gift ideas for someone who has everything" is one of
the highest-performing formats there is. The catalogue in this app is already
a script list — 93 gifts, each with a one-line reason.

---

## What's actually built

- **Find a gift** — relationship, occasion, interests and budget, scored
  against a 93-item catalogue. Every combination returns nine results.
- **My people** — birthdays with a live countdown, sorted by what's next.
  Records the last gift given so it doesn't get repeated. "Find them
  something" pre-fills the finder from their interests.
- **My list** — save ideas, share the whole list by link. The list travels
  inside the URL, so sharing works with no account and no server.
- Works on a phone, light and dark, affiliate links marked `rel="sponsored"`.

## What it doesn't do yet

- No accounts, so a list doesn't follow someone to a new device.
- Prices are bands, not live. Real prices need a product API.
- The catalogue is hand-written and Australian. It needs seasonal rotation.

---

## Legal bits worth doing properly

The affiliate disclosure in the footer isn't decoration — the ACCC requires
paid links to be disclosed, and Amazon's terms require it too. Leave it there.

Once there are users, it needs a privacy policy, even though nothing leaves
their device. Say exactly that: no accounts, no tracking, nothing collected.
It's a genuine selling point.
