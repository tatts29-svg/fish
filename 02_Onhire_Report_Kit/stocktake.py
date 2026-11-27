"""Reconcile dated SiteIQ sightings with the current MMG asset and SKU registers."""
import datetime as dt
import json
from collections import Counter
from pathlib import Path

import openpyxl

import catalogue


# Exact SiteIQ PROJECT SCHEDULE spelling. Dates are Brisbane local time.
NOVEMBER_SCHEDULE = "MMG Shutdown Novermber26-December26"
NOVEMBER_ROUNDS = [
    {"label": "Opening stocktake", "start": "2026-11-22", "end": "2026-11-25"},
    {"label": "Closeout stocktake", "start": "2026-11-25", "end": "2026-12-03",
     "evidence_start": "2026-11-25", "evidence_end": "2026-12-03"},
]
COUNT_ACTIONS = {"stocktake", "stock take", "stock count", "physical count", "cycle count"}


def text(value):
    return str(value).strip() if value is not None else ""


def timestamp(value):
    if not isinstance(value, dt.datetime):
        raw = text(value)
        for fmt in ("%d/%m/%Y %I:%M %p", "%d/%m/%Y %I:%M:%S %p", "%d/%m/%Y %H:%M",
                    "%d/%m/%Y %H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%dT%H:%M:%S"):
            try:
                value = dt.datetime.strptime(raw, fmt)
                break
            except ValueError:
                continue
        else:
            return ""
    return value.isoformat(timespec="seconds" if value.second or value.microsecond else "minutes")


def quantity(value):
    if isinstance(value, bool):
        return None
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    return int(n) if n.is_integer() else None


def category(kind, name):
    if not name:
        return "Uncategorised"
    return catalogue.tool_category(name) if kind == "tool" else catalogue.cons_category(name)


def inventory(rental, stock):
    items = {}
    for kind, rows, id_field, desc, barcode in (
        ("tool", rental, "ITEM_NUMBER", "ITEM_DESCRIPTION", "ITEM_BARCODE"),
        ("cons", stock, "SKU_NUMBER", "SKU_DESCRIPTION", "SKU_BARCODE"),
    ):
        for r in rows:
            key, name = text(r.get(id_field)), text(r.get(desc))
            if not key:
                continue
            items.setdefault((kind, key.casefold()), {
                "kind": kind, "key": key, "name": name, "category": category(kind, name),
                "family": text(r.get("PRODUCT_FAMILY")), "product": text(r.get("PRODUCT")),
                "storage_unit": text(r.get("STORAGE_UNIT")), "tool_store": text(r.get("TOOLSTORE")),
                "barcode": text(r.get(barcode)), "owner": text(r.get("OWNER")),
                "expected": 1 if kind == "tool" else quantity(r.get("AVAILABLE_QUANTITY")),
                "status": text(r.get("ITEM_STATUS")), "sighted": "", "who": "", "action": "",
                "quantity": None, "round": None, "checks": [],
            })
    return items


def shift_info(rec, sighted):
    time = dt.datetime.fromisoformat(sighted)
    recorded = text(rec.get("LAST_SIGHTED_SHIFT") or rec.get("SHIFT_NAME") or rec.get("SHIFT"))
    shift = {"day": "Day", "day shift": "Day", "night": "Night", "night shift": "Night"}.get(recorded.casefold())
    source = "SiteIQ" if shift else "Time of sighting"
    if not shift:
        shift = "Day" if 6 <= time.hour < 18 else "Night"
    shift_date = time.date() - dt.timedelta(days=int(shift == "Night" and time.hour < 6))
    return {"shift": shift, "shift_source": source, "shift_date": shift_date.isoformat()}


def sightings(path):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    try:
        sheet = wb["STOCKTAKE"].values
        headers = [text(c).upper() for c in next(sheet)]
        for row in sheet:
            yield dict(zip(headers, row))
    finally:
        wb.close()


def event_type(kind, action, count, who):
    if " ".join(action.casefold().split()) not in COUNT_ACTIONS:
        return "activity"
    if count is None or count < 0 or (kind == "tool" and count > 1):
        return "quantity_unconfirmed"
    return "physical_count" if who else "unattributed_count"


def category_totals(items, checked):
    totals = Counter((row['kind'], row['category']) for row in items.values())
    done = Counter((items[key]['kind'], items[key]['category']) for key in checked)
    return [{"kind": kind, "category": cat, "checked": done[kind, cat], "total": total}
            for (kind, cat), total in sorted(totals.items())]


def accepted_opening(round_data, baseline_path, schedule):
    """Display the manager's direction separately from recorded physical checks."""
    approval = {"status": "accepted", "approved_by": "Andrew Fisher", "role": "Shutdown Manager",
                "approved_on": "2026-11-28", "baseline_available": baseline_path is not None}
    round_data["carry_forward"] = approval
    round_data["physical_checks"] = {label: round_data[label]["checked"] for label in ("tools", "cons")}
    round_data.update(categories=[], baseline_rows=[], tools={"total": None, "checked": None},
                      cons={"total": None, "checked": None})
    if baseline_path is None:
        return
    with Path(baseline_path).open(encoding="utf-8") as f:
        snapshot = json.load(f)
    if not isinstance(snapshot, dict) or snapshot.get("schedule") != schedule or not isinstance(snapshot.get("rows"), list):
        raise ValueError("The opening stocktake snapshot must contain the approved MMG schedule and register rows.")
    frozen = {}
    for record in snapshot["rows"]:
        if not isinstance(record, dict):
            raise ValueError("The opening stocktake snapshot contains an invalid register row.")
        kind, key = record.get("kind"), text(record.get("key"))
        if kind not in ("tool", "cons") or not key or (kind, key.casefold()) in frozen:
            raise ValueError("The opening stocktake snapshot contains an invalid or duplicate register identity.")
        row = {field: text(record.get(field)) for field in ("name", "category", "barcode", "owner", "status", "family",
                                                             "product", "tool_store", "storage_unit")}
        row.update(kind=kind, key=key, expected=quantity(record.get("expected")))
        row["category"] = row["category"] or category(kind, row["name"])
        frozen[kind, key.casefold()] = row
    if not frozen:
        raise ValueError("The opening stocktake snapshot contains no register identities.")
    for label in ("inventory_asat", "rental_asat", "sales_asat"):
        if snapshot.get(label):
            approval[label] = text(snapshot[label])
    round_data["baseline_rows"] = list(frozen.values())
    round_data["categories"] = category_totals(frozen, frozen)
    for kind, label in (("tool", "tools"), ("cons", "cons")):
        n = sum(row["kind"] == kind for row in frozen.values())
        round_data[label] = {"total": n, "checked": n}


def build(folder, current_file, schedule, rental, stock, opening_baseline=None):
    folder = Path(folder)
    config = folder / "stocktake.json"
    if config.is_file():
        policy = json.loads(config.read_text(encoding="utf-8"))
    elif schedule == NOVEMBER_SCHEDULE:
        policy = {"rounds": NOVEMBER_ROUNDS, "departure": "2026-12-02"}
    else:
        return None
    items = inventory(rental, stock)
    periods = policy["rounds"]
    if schedule == NOVEMBER_SCHEDULE:
        # Older copies of this job can still contain the previous one-day window.
        periods = [dict(period) for period in periods]
        periods[1].update(evidence_start="2026-11-25", evidence_end="2026-12-03", includes_routine_counts=True)
    arrival = policy.get("arrival") or periods[0]["start"]
    activity, windows = {}, {}
    snapshots = []
    current_path = Path(current_file) if current_file else None
    paths = set((folder / "stocktake_history").glob("*.xlsx"))
    if current_path:
        paths.add(current_path)
    for path in sorted(paths):
        wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
        try:
            rows = wb["REFERENCE_INFO"].values
            headers = [text(c).upper() for c in next(rows)]
            ref = dict(zip(headers, next(rows)))
            if text(ref.get("PROJECT SCHEDULE")).casefold() != schedule.casefold():
                continue
            pulled = timestamp(ref.get("REQUESTED_DATE/TIME (LOCAL TIME)"))
            if not pulled:
                continue
            windows[pulled] = {"asat": pulled, "start": timestamp(ref.get("FROM_DATE/TIME")),
                               "end": timestamp(ref.get("TO_DATE/TIME"))}
            snapshots.append((pulled, path == current_path, path))
        finally:
            wb.close()
    for pulled, _, path in sorted(snapshots):
        # A newer pull supersedes earlier versions of the same item/time.
        # Preserve distinct evidence inside one pull, including same-minute recounts.
        snapshot = {}
        for rec in sightings(path):
            kind = {"rental": "tool", "consumable": "cons"}.get(text(rec.get("PRODUCT_CATEGORY")).casefold())
            key = text(rec.get("ITEM_OR_CONSUMABLE") if kind == "tool" else rec.get("SKU_NUMBER"))
            sighted = timestamp(rec.get("LAST_SIGHTED_DATE_TIME"))
            if not key or not kind or not sighted or sighted[:len(pulled)] > pulled:
                continue
            identity = kind, key.casefold()
            item = items.get(identity)
            action, who = text(rec.get("LAST_SIGHTED_ACTION")), text(rec.get("LAST_SIGHTED_BY"))
            count = quantity(rec.get("SIGHTED_QUANTITY"))
            evidence = event_type(kind, action, count, who)
            period = None
            if evidence == "physical_count":
                period = next((i for i, r in enumerate(periods)
                               if r.get("evidence_start", r["start"]) <= sighted[:10]
                               < r.get("evidence_end", r["end"])), None)
            name = text(rec.get("DESCRIPTION")) or (item["name"] if item else "")
            key_at_time = snapshot.setdefault((identity, sighted), {})
            key_at_time[who.casefold(), action.casefold(), count] = {
                "kind": kind, "key": item["key"] if item else key, "name": name, "current": item is not None,
                "category": item["category"] if item else category(kind, name),
                "family": text(rec.get("PRODUCT_FAMILY")) or (item["family"] if item else ""),
                "storage_unit": text(rec.get("STORAGE_UNIT")), "tool_store": text(rec.get("TOOL_STORE")),
                "sighted": sighted, "who": who, "action": action, "quantity": count, "round": period,
                "evidence": evidence, **shift_info(rec, sighted),
            }
        activity.update(snapshot)
    events = sorted((event for group in activity.values() for event in group.values()),
                    key=lambda event: event["sighted"], reverse=True)
    physical = [event for event in events if event["evidence"] in {"physical_count", "unattributed_count"}]
    checked = [set() for _ in periods]
    overall = set()
    unmatched = set()
    for event in events:
        identity = event["kind"], event["key"].casefold()
        item = items.get(identity)
        if item is None:
            unmatched.add(identity)
            continue
        fields = {k: event[k] for k in ("sighted", "who", "action", "quantity", "round", "shift", "shift_date", "shift_source", "evidence")}
        if not item["sighted"]:
            item.update(fields)
        if event["evidence"] in {"physical_count", "unattributed_count"}:
            if event["sighted"][:10] >= arrival:
                overall.add(identity)
            period = event["round"]
            if period is not None:
                item["checks"].append(fields)
                checked[period].add(identity)
    rounds = []
    for i, r in enumerate(periods):
        result = dict(r, categories=category_totals(items, checked[i]))
        for kind, label in (("tool", "tools"), ("cons", "cons")):
            result[label] = {"total": sum(key[0] == kind for key in items),
                             "checked": sum(key[0] == kind for key in checked[i])}
        rounds.append(result)
    if schedule == NOVEMBER_SCHEDULE:
        accepted_opening(rounds[0], opening_baseline, schedule)
    return {"asat": max(windows, default=""), "schedule": schedule, "windows": [windows[k] for k in sorted(windows)],
            "arrival": arrival, "departure": policy.get("departure"), "rows": list(items.values()),
            "rounds": rounds, "categories": category_totals(items, overall), "unmatched": len(unmatched),
            "physical_counts": physical, "sightings": events}
