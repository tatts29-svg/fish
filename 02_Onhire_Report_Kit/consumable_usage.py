"""MMG consumables. SiteIQ sales, explicit credits, stock and qualified prior shutdowns."""
from collections import defaultdict
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
import json
from pathlib import Path
import re

import openpyxl

JOB = "MMG Dugald River"
SOURCE = "SiteIQ SALES_STOCK"
AEST = timezone(timedelta(hours=10))


def text(value):
    return str(value).strip() if value is not None else ""


def quantity(value):
    if isinstance(value, bool):
        return None
    try:
        raw = text(value)
        if "," in raw and not re.fullmatch(r"\d{1,3}(,\d{3})+(\.\d+)?", raw):
            return None
        result = Decimal(raw.replace(",", ""))
    except InvalidOperation:
        return None
    return result if result.is_finite() and result >= 0 else None


def number(value):
    if value is None:
        return None
    return int(value) if value == value.to_integral_value() else float(value)


def total(values):
    return sum(values, Decimal(0)) if values and None not in values else None


def line(sku, rows):
    units = {text(row.get("UOM") or row.get("UNIT_OF_MEASURE")).casefold() for row in rows} - {""}
    quantities = defaultdict(list)
    bins = defaultdict(set)
    stock = []
    for row in rows:
        sold, credit = quantity(row.get("SALES_QUANTITY")), quantity(row.get("RETURN_QUANTITY"))
        has_activity = any(text(row.get(k)) for k in ("COMPANY_NAME", "HIRER", "SALES_DATE", "RETURN_REASON"))
        if has_activity or sold or credit:
            quantities["issued"].append(sold)
            quantities["credited"].append(credit)
        else:
            stock.append(row)
            place = tuple(text(row.get(k)).casefold() for k in ("TOOLSTORE", "STORAGE_UNIT"))
            bins[place].add(quantity(row.get("AVAILABLE_QUANTITY")))
    def movement(measure, field):
        if quantities[measure]:
            return total(quantities[measure])
        return Decimal(0) if stock and all(quantity(row.get(field)) == 0 for row in stock) else None
    issued = movement("issued", "SALES_QUANTITY")
    credited = movement("credited", "RETURN_QUANTITY")
    # A store-wide balance can overlap its named bins. An unexplained change for
    # the same bin in one snapshot is also ambiguous.
    stock_total = None
    if bins and all(len(values) == 1 for values in bins.values()):
        stores = defaultdict(set)
        for store, location in bins:
            stores[store].add(location)
        ambiguous = (len(stores) > 1 and "" in stores) or any("" in locs and len(locs) > 1 for locs in stores.values())
        if not ambiguous:
            stock_total = total([next(iter(values)) for values in bins.values()])
    if len(units) > 1:
        issued = credited = stock_total = None
    title = next((text(r.get("SKU_DESCRIPTION")) for r in stock + rows if text(r.get("SKU_DESCRIPTION"))), sku)
    unit = next(iter(units), "") if len(units) < 2 else None
    return {"sku": sku, "name": title, "unit": unit,
            "available_for_mmg": number(stock_total), "issued": number(issued), "credited": number(credited),
            "net": number(issued - credited) if issued is not None and credited is not None else None,
            "history": [], "average_issued": None, "average_shuts": 0}


def summarise_rows(sales_rows):
    """Collapse one complete SALES_STOCK snapshot to SKU-level non-personal figures."""
    groups = defaultdict(list)
    for row in sales_rows:
        sku = text(row.get("SKU_NUMBER"))
        if sku:
            groups[sku].append(row)
    return sorted((line(sku, group) for sku, group in groups.items()), key=lambda r: (r["name"].casefold(), r["sku"]))


def local_time(value):
    when = value if isinstance(value, datetime) else datetime.fromisoformat(value)
    return when.astimezone(AEST).replace(tzinfo=None) if when.tzinfo else when


def shut_key(value):
    key = re.sub(r"[^a-z0-9]+", "-", text(value).casefold()).strip("-")
    return re.sub(r"\bjul\b", "july", key) if re.fullmatch(r"jul-\d{4}", key) else key


def dated_day(header, year):
    try:
        return datetime.strptime(f"{header} {year}", "%a %d %b %Y").date().isoformat()
    except ValueError:
        return ""


def observed_history(path, cutoff):
    """The workbook represents draws for observed shifts, with zero-filled rows for today's catalogue."""
    if not path or not Path(path).is_file():
        return {}
    book = openpyxl.load_workbook(path, read_only=True, data_only=True)
    periods = {}
    try:
        if "Min Max" not in book or not text(book["Min Max"]["A1"].value).upper().startswith("MMG CONSUMABLES"):
            return periods
        for title in book.sheetnames:
            if not title.endswith(" Daily"):
                continue
            label = title[:-6]
            year = re.search(r"\b(20\d\d)\b", label)
            if not year:
                continue
            rows = book[title].iter_rows(min_row=5, values_only=True)
            header = list(next(rows, ()))
            if header[:2] != ["SKU", "Line"] or "Total" not in header:
                continue
            end = header.index("Total")
            dates = [dated_day(cell, year[1]) for cell in header[2:end]]
            if not dates or not all(dates) or max(dates) >= cutoff.isoformat():
                continue
            period = {"id": shut_key(label), "label": label, "status": "partial", "source": f"MMG Min Max · {title}",
                      "days_observed": len(set(dates)), "first_observed": min(dates), "last_observed": max(dates),
                      "start": "", "end": "", "as_at": ""}
            values = {}
            for row in rows:
                sku = text(row[0])
                if not sku:
                    continue
                # build_minmax produces a zero even when an old stock line was
                # absent. Only a positive observed draw proves the line existed.
                q = quantity(row[end])
                if q is not None and q > 0:
                    values[sku] = ("", q)
            periods[period["id"]] = (period, values)
        return periods
    finally:
        book.close()


def archive_history(path, current_schedule, cutoff, periods, warnings):
    if not path or not Path(path).is_file():
        return {}
    try:
        archive = json.loads(Path(path).read_text(encoding="utf-8"))
        if not isinstance(archive, dict) or archive.get("job") != JOB or not isinstance(archive.get("shuts", []), list):
            raise ValueError
    except (OSError, ValueError):
        warnings.append("The historical usage file could not be verified for MMG Dugald River.")
        return {}
    candidates = defaultdict(list)
    for entry in archive.get("shuts", []):
        try:
            label, schedule, source = (text(entry[k]) for k in ("label", "schedule", "source"))
            key = shut_key(entry["id"])
            if not key or not schedule or not source or not label or not isinstance(entry["rows"], list):
                raise ValueError
            if entry.get("job", JOB) != JOB or schedule.casefold() == current_schedule.casefold():
                continue
            status = entry.get("status")
            pulled = local_time(entry["as_at"])
            start, end = (date.fromisoformat(entry[k]) if entry.get(k) else None for k in ("start", "end"))
            if status not in ("complete", "partial"):
                continue
            if start and end and (start > end or end >= cutoff):
                raise ValueError
            if status == "complete" and (not start or not end or pulled.date() <= end):
                raise ValueError
            if status == "partial" and pulled.date() >= cutoff and not (end and end < cutoff):
                continue
            values = {}
            for row in entry["rows"]:
                sku = text(row["sku"])
                if not sku or sku in values:
                    raise ValueError
                values[sku] = (text(row.get("unit")).casefold(), quantity(row.get("issued")))
            period = {"id": key, "label": label, "status": status, "source": source,
                      "start": start.isoformat() if start else "", "end": end.isoformat() if end else "", "as_at": pulled.isoformat(),
                      "days_observed": None, "first_observed": "", "last_observed": ""}
            candidates[key].append((schedule.casefold(), period, values))
        except (KeyError, AttributeError, TypeError, ValueError):
            warnings.append("A historical shutdown record lacks consistent scope, dates or SKU evidence.")
    schedule_keys = defaultdict(set)
    for key, pulls in candidates.items():
        for schedule, _, _ in pulls:
            schedule_keys[schedule].add(key)
    for key, pulls in candidates.items():
        schedules = {schedule for schedule, _, _ in pulls}
        windows = {(p["start"], p["end"]) for _, p, _ in pulls if p["start"] and p["end"]}
        if len(schedules) != 1 or len(windows) > 1 or any(len(schedule_keys[s]) > 1 for s in schedules):
            warnings.append("Conflicting shutdown identities or dates were excluded from the previous-shutdown average.")
            continue
        # An explicitly complete closeout is stronger than a later extract
        # marked partial. Same-period snapshots always replace, never add.
        pulls = [record for record in pulls if record[1]["status"] == "complete"] or pulls
        latest = max(p["as_at"] for _, p, _ in pulls)
        matches = [(p, vals) for _, p, vals in pulls if p["as_at"] == latest]
        if any(vals != matches[0][1] for _, vals in matches):
            warnings.append("Two historical snapshots disagree at the same time and were excluded from the average.")
            continue
        meta, values = matches[0]
        if key in periods:
            prior, prior_values = periods[key]
            meta["additional_sources"] = [prior]
            meta["_prior_values"] = prior_values
        periods[key] = (meta, values)
    return archive.get("current_closeout") or {}


def build(rows, sales_ref, expected_schedule, current_start, minmax=None, archive=None, closeout_after=None):
    warnings = []
    schedule = text(sales_ref.get("schedule"))
    pulled = sales_ref.get("requested")
    items = []
    if expected_schedule and schedule.casefold() == expected_schedule.casefold():
        items = summarise_rows(rows)
        if any(not text(row.get("SKU_NUMBER")) for row in rows):
            warnings.append("A sales stock row is missing its SKU number and could not be assigned.")
    else:
        warnings.append("The sales export's MMG project schedule could not be verified.")
    if not archive and minmax:
        archive = Path(minmax).with_name("consumable_usage_history.json")
    periods = observed_history(minmax, current_start)
    approval = archive_history(archive, expected_schedule, current_start, periods, warnings)
    status = "provisional"
    if isinstance(approval, dict) and items and pulled and closeout_after and approval.get("schedule") == schedule and approval.get("confirmed_by") == "Andrew Fisher":
        try:
            closed_at = local_time(approval["sales_as_at"])
            if closed_at == local_time(pulled) and closed_at >= local_time(closeout_after):
                status = "final"
        except (KeyError, TypeError, ValueError):
            warnings.append("The closeout confirmation has no valid sales snapshot time.")
    for item in items:
        qualified = []
        for meta, values in periods.values():
            matched = values.get(item["sku"])
            amount = matched[1] if matched and matched[0] == item["unit"] else None
            use = amount is not None and meta["status"] == "complete"
            if use:
                qualified.append(amount)
            reading = {"id": meta["id"], "issued": number(amount), "qualified": use}
            prior = meta.get("_prior_values", {}).get(item["sku"])
            if prior and prior[0] == item["unit"]:
                older = meta["additional_sources"][0]
                reading["observations"] = [{"source": older["source"], "issued": number(prior[1]),
                                            "first_observed": older["first_observed"], "last_observed": older["last_observed"], "as_at": older["as_at"]}]
            item["history"].append(reading)
        if qualified:
            item["average_shuts"] = len(qualified)
            item["average_issued"] = number(round(sum(qualified) / len(qualified), 2))
    for meta, _ in periods.values():
        meta.pop("_prior_values", None)
    return {"project": JOB, "source": SOURCE, "as_at": pulled.isoformat() if pulled else "",
            "status": status, "comparison_measure": "issued", "history": [p for p, _ in periods.values()],
            "rows": items, "warnings": list(dict.fromkeys(warnings))}
