"""Reconcile dated SiteIQ sightings with the current MMG asset and SKU registers."""
import datetime as dt
import json
from pathlib import Path

import openpyxl


# Exact SiteIQ PROJECT SCHEDULE spelling. Dates are Brisbane local time.
NOVEMBER_SCHEDULE = "MMG Shutdown Novermber26-December26"
NOVEMBER_ROUNDS = [
    {"label": "Opening stocktake", "start": "2026-11-22", "end": "2026-11-25"},
    {"label": "Closeout stocktake", "start": "2026-11-25", "end": "2026-12-03",
     "evidence_start": "2026-12-02", "evidence_end": "2026-12-03"},
]
COUNT_ACTIONS = {"stocktake", "stock take", "stock count", "physical count", "cycle count"}


def text(value):
    return str(value).strip() if value is not None else ""


def timestamp(value):
    if isinstance(value, dt.datetime):
        return value.isoformat(timespec="minutes")
    for fmt in ("%d/%m/%Y %I:%M %p", "%d/%m/%Y %H:%M", "%Y-%m-%dT%H:%M"):
        try:
            return dt.datetime.strptime(text(value), fmt).isoformat(timespec="minutes")
        except ValueError:
            continue
    return ""


def quantity(value):
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    return int(n) if n.is_integer() else None


def inventory(rental, stock):
    items = {}
    for kind, rows, id_field, desc, barcode in (
        ("tool", rental, "ITEM_NUMBER", "ITEM_DESCRIPTION", "ITEM_BARCODE"),
        ("cons", stock, "SKU_NUMBER", "SKU_DESCRIPTION", "SKU_BARCODE"),
    ):
        for r in rows:
            key = text(r.get(id_field))
            if not key:
                continue
            items.setdefault((kind, key.casefold()), {
                "kind": kind, "key": key, "name": text(r.get(desc)),
                "barcode": text(r.get(barcode)), "owner": text(r.get("OWNER")),
                "expected": 1 if kind == "tool" else quantity(r.get("AVAILABLE_QUANTITY")),
                "status": text(r.get("ITEM_STATUS")), "sighted": "", "who": "", "action": "",
                "quantity": None, "round": None, "checks": [],
            })
    return items


def sightings(path):
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    try:
        sheet = wb["STOCKTAKE"].values
        headers = [text(c).upper() for c in next(sheet)]
        for row in sheet:
            yield dict(zip(headers, row))
    finally:
        wb.close()


def build(folder, current_file, schedule, rental, stock):
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
    checks = {}
    unmatched = set()
    activity = {}
    asat = ""
    windows = {}
    # Process older pulls first so corrections in the newest export win timestamp ties.
    snapshots = []
    paths = set((folder / "stocktake_history").glob("*.xlsx"))
    if current_file:
        paths.add(Path(current_file))
    for path in sorted(paths):
        with path.open("rb") as f:
            wb = openpyxl.load_workbook(f, read_only=True, data_only=True)
            try:
                rows = wb["REFERENCE_INFO"].values
                headers = [text(c).upper() for c in next(rows)]
                ref = dict(zip(headers, next(rows)))
                if text(ref.get("PROJECT SCHEDULE")).casefold() != schedule.casefold():
                    continue
                pulled = timestamp(ref.get("REQUESTED_DATE/TIME (LOCAL TIME)"))
                windows[pulled] = {"asat": pulled, "start": timestamp(ref.get("FROM_DATE/TIME")),
                                   "end": timestamp(ref.get("TO_DATE/TIME"))}
                snapshots.append((pulled, path == Path(current_file) if current_file else False, path))
            finally:
                wb.close()
    for pulled, _, path in sorted(snapshots):
        asat = max(asat, pulled)
        for rec in sightings(path):
            kind = {"rental": "tool", "consumable": "cons"}.get(text(rec.get("PRODUCT_CATEGORY")).casefold())
            key = text(rec.get("ITEM_OR_CONSUMABLE") if kind == "tool" else rec.get("SKU_NUMBER"))
            identity = kind, key.casefold()
            item = items.get(identity)
            if not key or not kind:
                continue
            if item is None:
                unmatched.add(identity)
            sighted = timestamp(rec.get("LAST_SIGHTED_DATE_TIME"))
            if not sighted or (pulled and sighted > pulled):
                continue
            action = text(rec.get("LAST_SIGHTED_ACTION"))
            who = text(rec.get("LAST_SIGHTED_BY"))
            count = quantity(rec.get("SIGHTED_QUANTITY"))
            period = None
            if who and count is not None and count >= 0 and action.casefold() in COUNT_ACTIONS:
                period = next((i for i, r in enumerate(periods)
                               if r.get("evidence_start", r["start"]) <= sighted[:10]
                               < r.get("evidence_end", r["end"])), None)
            event = {"sighted": sighted, "who": who, "action": action, "quantity": count,
                     "shift": "Day" if "06:00" <= sighted[11:] < "18:00" else "Night", "round": period}
            entry_key = (identity, sighted, who.casefold(), action.casefold(), count)
            activity[entry_key] = dict(event, kind=kind, key=key, name=text(rec.get("DESCRIPTION")),
                                       current=item is not None)
            if item is None:
                continue
            if sighted >= item["sighted"]:
                item.update(event)
            check_key = identity, period
            if period is not None and sighted >= checks.get(check_key, {}).get("sighted", ""):
                checks[check_key] = event
    for (identity, _), event in checks.items():
        items[identity]["checks"].append(event)
    rounds = []
    for i, r in enumerate(periods):
        result = dict(r)
        for kind, label in (("tool", "tools"), ("cons", "cons")):
            result[label] = {"total": sum(key[0] == kind for key in items),
                             "checked": sum(key[0] == kind and period == i for key, period in checks)}
        rounds.append(result)
    return {"asat": asat, "schedule": schedule, "windows": [windows[k] for k in sorted(windows)],
            "departure": policy.get("departure"), "rows": list(items.values()),
            "rounds": rounds, "unmatched": len(unmatched),
            "sightings": sorted(activity.values(), key=lambda event: event["sighted"], reverse=True)}
