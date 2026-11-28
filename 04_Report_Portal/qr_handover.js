"use strict";

(() => {
  const months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ");
  const numerals = new Intl.NumberFormat("en-AU");
  const measured = value => Number.isSafeInteger(value) && value >= 0;
  const count = value => measured(value) ? numerals.format(value) : "Unavailable";
  const units = (n, name) => count(n) + " " + name + (n === 1 ? "" : "s");

  function node(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function panel(parent, id, title, cls) {
    const section = node("section", "full readout panel handover-report " + cls);
    section.id = id;
    section.tabIndex = -1;
    section.append(node("h2", "", title));
    parent.append(section);
    return section;
  }

  // The server sends project-local SiteIQ dates, sometimes with no clock.
  function stamp(value) {
    const d = typeof value === "string" && value.match(/^(\d{4})-(\d\d)-(\d\d)(?:T(\d\d:\d\d(?::\d\d)?))?$/);
    if (!d || !months[Number(d[2]) - 1]) return "Time unavailable";
    const date = Number(d[3]) + " " + months[Number(d[2]) - 1] + " " + d[1];
    return date + (d[4] ? ", " + d[4] + " AEST" : "");
  }

  function elapsed(n) {
    const days = Math.floor(n / 1440), hours = Math.floor(n % 1440 / 60), minutes = n % 60;
    return [days && units(days, "day"), hours && units(hours, "hour"), (minutes || !n) && units(minutes, "minute")]
      .filter(Boolean).join(" ");
  }

  function artwork(r, item) {
    if (!r.product_art || !Object.hasOwn(r.product_art, item.item)) return null;
    const url = r.product_art[item.item];
    const scope = r.kind === "company" ? "company" : "personal";
    const prefix = "/qr/" + scope + "/";
    if (typeof url !== "string") return null;
    const filename = url.startsWith(prefix) ? url.slice(prefix.length) : url;
    if (!/^art-[0-9a-f]{64}\.(?:webp|jpeg|png)\.[A-Za-z0-9_-]{43}$/.test(filename)) return null;
    const figure = node("figure","handover-reference");
    const img = node("img");
    img.alt = "Product reference for " + item.name;
    img.width = 80; img.height = 80; img.loading = "lazy"; img.decoding = "async";
    img.addEventListener("error", () => figure.remove(), {once:true});
    img.src = prefix + filename;
    figure.append(img,node("figcaption","","Product reference"));
    return figure;
  }

  function assetCard(r, asset, returned) {
    const card = node("div","handover-asset");
    const pic = artwork(r, asset);
    if (pic) card.append(pic);
    const body = node("div","handover-asset-copy");
    body.append(node("strong","",asset.name || "Equipment"));
    if (asset.item) body.append(node("span","handover-asset-id","Asset " + asset.item));
    if (asset.issued_at) body.append(node("span","","Issued " + stamp(asset.issued_at)));
    if (returned && asset.returned_at) body.append(node("span","","Returned " + stamp(asset.returned_at)));
    if (!returned && r.kind === "company" && asset.holder) body.append(node("span","","Held by " + asset.holder));
    card.append(body);
    return card;
  }

  function receipt(parent, r) {
    const section = panel(parent,"return-receipt","Latest return receipt","direction-receipt");
    const summary = r.handover?.latest_return;
    if (!summary || !Array.isArray(summary.items) || !summary.items.length) {
      const covered = Boolean(r.coverage?.transactions_asat && r.coverage?.transaction_periods?.length);
      const read = r.handover && Object.hasOwn(r.handover,"latest_return") && covered;
      section.append(node("p","empty",read ? "No dated return was recorded in the transaction periods covered by this report."
        : "The available transaction data cannot establish a latest return receipt."));
      return;
    }
    const dateOnly = summary.precision === "date";
    const label = dateOnly ? "Latest return date" : "Returned";
    section.append(node("p","handover-headline",units(summary.count,"asset") + " · " + label + " " + stamp(summary.returned_at)));
    if (dateOnly) section.append(node("p","note","These returns share the latest recorded date. Some entries have no return time."));
    if (summary.precision === "minute") section.append(node("p","note","These returns share the latest recorded minute."));
    const list = node("ul","handover-assets");
    for (const asset of summary.items) {
      const row = node("li");
      row.append(assetCard(r,asset,true));
      list.append(row);
    }
    if (summary.items.length > 4) {
      const more = node("details","handover-details");
      more.append(node("summary","","View " + units(summary.items.length,"returned asset")),list);
      section.append(more);
    } else section.append(list);
  }

  function hourRange(start) {
    const clock = start.slice(11,16);
    const nextHour = String((Number(clock.slice(0,2)) + 1) % 24).padStart(2, "0");
    return clock + "–" + nextHour + ":00";
  }

  function peak(peaks, s, key, label) {
    const row = node("div","direction-peak");
    row.append(node("strong","",label));peaks.append(row);
    if (!measured(s[key]) || s.hourly.some(h=>!measured(h[key]))) {
      row.append(node("span","","Peak unavailable · incomplete times"));
      return;
    }
    const sum = s.hourly.reduce((total,h)=>total+h[key],0);
    if (sum!==s[key] || new Set(s.hourly.map(h=>h.start)).size!==s.hourly.length) {
      row.append(node("span","","Peak unavailable · hourly counts differ from the shift record"));
      return;
    }
    if (!sum) {
      row.append(node("span","","None recorded this shift"));
      return;
    }
    const high = Math.max(...s.hourly.map(h=>h[key]));
    const matches = s.hourly.filter(h=>h[key]===high);
    row.append(node("span","handover-peak-time",matches.map(h => hourRange(h.start)).join(", ")));
    const tube = node("span","direction-pill-host");
    row.append(tube,node("span","handover-peak-count",count(high) + " of " + count(sum) + (matches.length > 1 ? " in each hour" : "")));
    window.MMGReportInstruments?.pill(tube,high,sum);
  }

  function shift(parent, r) {
    if (r.kind !== "company") return;
    const section = panel(parent,"shift-review","Last fully covered shift","handover-shift");
    const s = r.handover?.shift;
    if (!s || !Array.isArray(s.hourly)) {
      section.append(node("p","empty","The transaction export does not cover a full shift with the data needed for this review."));
      return;
    }
    section.append(node("p","note",s.name + " shift · " + stamp(s.start) + " to " + stamp(s.end)));
    const title = node("p","handover-headline");
    title.textContent = "Issued " + count(s.issued) + " · Returned " + count(s.returned);
    section.append(title);
    const peaks = node("div","direction-peaks");
    section.append(peaks);
    peak(peaks,s,"issued","Peak issues");
    peak(peaks,s,"returned","Peak returns");
    const details = node("details","handover-details");
    details.append(node("summary","","View hourly issues and returns"));
    const tbl = node("table","paper"), thead = tbl.createTHead(), headings = thead.insertRow();
    for (const col of ["Hour starting (AEST)","Issued","Returned"]) {
      const th = node("th","",col);
      th.scope="col";headings.append(th);
    }
    const body = tbl.createTBody();
    for (const hour of s.hourly) {
      const row=body.insertRow();
      const th=node("th","",stamp(hour.start).replace(" AEST",""));
      th.scope="row";
      row.append(th,node("td","num",count(hour.issued)),node("td","num",count(hour.returned)));
    }
    const wrap = node("div","table-wrap");
    wrap.append(tbl);
    details.append(wrap);
    section.append(details);
  }

  function oldest(parent,r) {
    if (r.kind !== "company") return;
    const section = panel(parent,"oldest-held","Longest-held item","direction-oldest");
    const asset = r.handover?.oldest;
    if (!asset) {
      const clear = r.hire_count === 0 && (r.asat || r.coverage?.rental_asat);
      section.append(node("p","empty",clear ? "No equipment was on hire to this company at the rental stock snapshot."
        : "The dated stock records cannot establish which current asset has been out longest."));
      return;
    }
    const asat = r.asat || r.coverage?.rental_asat;
    if (measured(asset.elapsed_minutes)) {
      section.append(node("p","handover-headline",elapsed(asset.elapsed_minutes) + " on hire at the stock snapshot"));
    } else {
      section.append(node("p","note","The issue date is recorded. The time needed to calculate the duration is unavailable."));
    }
    section.append(assetCard(r,asset,false));
    if (asset.tied_count > 1) section.append(node("p","note","This is one of " + count(asset.tied_count) + " assets tied at the earliest recorded issue time."));
    if (asat) section.append(node("p","note","Rental stock snapshot · " + stamp(asat)));
  }

  window.QRHandover = Object.freeze({receipt, shift, oldest, artwork});
})();
