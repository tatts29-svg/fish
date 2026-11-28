"""Current fleet and dated rental-use evidence by exact product variant."""
from collections import Counter, defaultdict
import json
from datetime import date, datetime, time

from openpyxl import load_workbook

from variant_history import requested_time, snapshot_key, unique_assets
from qr_facts import rental_transactions


def clean(value):
    return "" if value is None else str(value).strip()


def stamp(day, clock):
    if isinstance(day, datetime):
        day = day.date()
    if not isinstance(day, date):
        try:
            day = datetime.strptime(clean(day), "%d/%m/%Y").date()
        except ValueError:
            return None
    if not isinstance(clock, time):
        for fmt in ("%H:%M:%S", "%H:%M", "%I:%M %p", "%I:%M:%S %p"):
            try:
                clock = datetime.strptime(clean(clock), fmt).time()
                break
            except ValueError:
                continue
        else:
            return None
    return datetime.combine(day, clock)


def record(evidence, item, when, source):
    if item not in evidence or when > evidence[item][0]:
        evidence[item] = (when, source)


def transaction_use(path, window, fleet_ids):
    """A dated named rental interval is evidence. Fixed charges and sales aren't."""
    evidence = {}
    start, end = window
    wb = load_workbook(path, data_only=True, read_only=True)
    try:
        for sheet in ("TRANSACTION_CHARGES", "TRANSACTION_WITHOUT_CHARGES", "CUSTOMER_CONTRACTOR_EQUIP"):
            if sheet not in wb.sheetnames:
                continue
            rows = wb[sheet].values
            fields = [clean(h) for h in next(rows, ())]
            for values in rows:
                r = dict(zip(fields, values))
                item = clean(r.get("SKU/ITEM_NUMBER"))
                if item not in fleet_ids or clean(r.get("PRODUCT_CATEGORY")).casefold() != "rental":
                    continue
                try:
                    positive = float(r.get("QUANTITY")) > 0
                except (ValueError, TypeError):
                    positive = False
                if not positive or not clean(r.get("HIRER_NAME")):
                    continue
                issued = stamp(r.get("TRAN_START_DATE"), r.get("TRAN_START_TIME"))
                returned = stamp(r.get("TRAN_END_DATE"), r.get("TRAN_END_TIME"))
                if not issued or issued > end or (returned and returned < issued):
                    continue
                if start <= issued:
                    record(evidence, item, issued, "Rental issue")
                if returned and start <= returned <= end:
                    record(evidence, item, returned, "End of recorded hire")
                if issued < start and returned and returned > end:
                    record(evidence, item, end, "Recorded hire spans period")
    finally:
        wb.close()
    return evidence


def unavailable_average(label, reason):
    return {"label": label, "start": None, "end": None, "quality": "unavailable",
            "reason": reason, "excluded_rows": 0, "total": {"average": None, "peak": None},
            "owners": {}, "variants": {}, "variant_owners": {}}


def interval_measure(by_asset, duration):
    """Combine overlaps for each physical asset, then count simultaneous assets."""
    changes = Counter()
    elapsed = 0.0
    for intervals in by_asset.values():
        merged = []
        for start, end in sorted(intervals):
            if merged and start <= merged[-1][1]:
                merged[-1] = (merged[-1][0], max(merged[-1][1], end))
            else:
                merged.append((start, end))
        for start, end in merged:
            elapsed += (end - start).total_seconds()
            changes[start] += 1
            changes[end] -= 1
    current = peak = 0
    for at in sorted(changes):
        current += changes[at]
        peak = max(peak, current)
    return {"average": round(elapsed / duration, 4), "peak": peak}


def concurrent_hires(path, label, start, end, fleet=None, owner_label=clean, *, coverage_note=""):
    """Measure unique identified rental assets concurrently out, over [start, end).

    The caller supplies the local covered period from this specific export. A
    blank return means open at the pull. Dated returns lacking a time are unknown.
    Current rental IDs, when supplied, fill gaps in group metadata only.
    """
    period = unavailable_average(label, "No timed rental transaction export covers this period.")
    if not path or not start or not end or end <= start:
        return period
    period.update(start=start.isoformat(), end=end.isoformat())
    events = {}
    contested = set()
    missing = 0
    for row in rental_transactions(path):
        if clean(row.get("PRODUCT_CATEGORY")).casefold() != "rental":
            continue
        item = clean(row.get("SKU/ITEM_NUMBER"))
        key = (clean(row.get("TRANSACTION_ID")), item)
        issued = stamp(row.get("TRAN_START_DATE"), row.get("TRAN_START_TIME"))
        if issued and issued >= end:
            continue
        returned = stamp(row.get("TRAN_END_DATE"), row.get("TRAN_END_TIME"))
        if returned and returned <= start and issued and issued <= returned:
            continue
        date_present = bool(clean(row.get("TRAN_END_DATE")) or clean(row.get("TRAN_END_TIME")))
        try:
            one_asset = float(row.get("QUANTITY")) == 1
        except (TypeError, ValueError):
            one_asset = False
        if not all(key):
            missing += 1
            continue
        if not issued or not one_asset or (date_present and not returned) or (returned and returned < issued):
            contested.add(key)
            continue
        timing = (issued, returned)
        prior, owners, variants, descriptions = events.setdefault(key, (timing, set(), set(), set()))
        if prior != timing:
            contested.add(key)
        for keys, field in ((owners, "ITEM_OWNER"), (variants, "PRODUCT_VARIANT_ID"), (descriptions, "SKU/ITEM DESCRIPTION")):
            value = clean(row.get(field))
            if value:
                keys.add(value.upper())
    by_item = defaultdict(list)
    for key, (timing, owners, variants, descriptions) in events.items():
        if key not in contested:
            by_item[key[1]].append((timing[0], timing[1], owners, variants, descriptions))
    durations = defaultdict(lambda: defaultdict(list))
    missing_owner = missing_variant = 0
    for item, rows in by_item.items():
        rows.sort(key=lambda entry: entry[0])
        stock = (fleet or {}).get(item, {})
        for index, (issued, returned, owners, variants, descriptions) in enumerate(rows):
            if returned is None and index+1 < len(rows) and rows[index+1][0] > issued:
                # The item was reissued. It cannot safely be assumed out continuously.
                missing += 1
                continue
            interval = (max(start, issued), min(end, returned or end))
            if interval[0] >= interval[1]:
                continue
            # The rental snapshot uses PRODUCT_VARIANT (the code). In
            # TRANSACTIONS, PRODUCT_VARIANT_ID is that code and PRODUCT_VARIANT is a name.
            raw_owner = next(iter(owners)) if len(owners)==1 else (clean(stock.get("OWNER")) if not owners else "")
            owner = clean(owner_label(raw_owner)).casefold() if raw_owner else ""
            variant = next(iter(variants)) if len(variants)==1 else (clean(stock.get("PRODUCT_VARIANT")) if not variants else "")
            description = clean(stock.get("ITEM_DESCRIPTION")) or (next(iter(descriptions)) if len(descriptions)==1 else "")
            variant_key = ""
            if len(variants)<=1 and (variant or raw_owner and description):
                variant_key = snapshot_key(dict(PRODUCT_VARIANT=variant, OWNER=raw_owner, ITEM_DESCRIPTION=description))
            durations[("", "")][item].append(interval)
            if owner:
                durations[("", owner)][item].append(interval)
            else:
                missing_owner += 1
            if variant_key:
                durations[(variant_key, "")][item].append(interval)
                if owner:
                    durations[(variant_key, owner)][item].append(interval)
            else:
                missing_variant += 1
    excluded = missing + len(contested)
    period["excluded_rows"] = excluded
    notes = [coverage_note] if coverage_note else []
    if excluded:
        notes.append(f"{excluded} rental record(s) with incomplete or conflicting evidence excluded.")
    if not durations:
        period["reason"] = " ".join(notes + ["No timed rental intervals could be measured."])
        return period
    period["quality"] = "partial" if notes else "recorded"
    period["reason"] = " ".join(notes)
    period["unassigned_owner"] = missing_owner
    period["unassigned_variant"] = missing_variant
    seconds = (end-start).total_seconds()
    for (variant, owner), assets in durations.items():
        measure = interval_measure(assets, seconds)
        if variant and owner:
            period["variant_owners"].setdefault(variant, {})[owner] = measure
        elif variant:
            period["variants"][variant] = measure
        elif owner:
            period["owners"][owner] = measure
        else:
            period["total"] = measure
    return period


def archived_average(path, label, start, end, *, expected_schedule, owner_label=clean, coverage_note=""):
    """Read one trusted historical workbook, bounded by both its reference and its pull."""
    if not clean(label) or not clean(expected_schedule):
        raise ValueError("A shutdown label and its verified SiteIQ schedule are required.")
    wb = load_workbook(path, read_only=True, data_only=True, keep_links=False)
    try:
        rows = iter(wb["REFERENCE_INFO"].values)
        ref = dict(zip([clean(v).upper() for v in next(rows)], next(rows)))
        if clean(ref.get("PROJECT SCHEDULE")) != expected_schedule:
            raise ValueError("The transaction export identifies another project schedule.")
        bounds = clean(ref["REPORT_PERIOD"]).split(" - ")
        lo, hi = (datetime.strptime(value.strip(), "%d/%m/%Y %H:%M:%S") for value in bounds)
        pulled = requested_time(wb)
        if not any(sheet in wb.sheetnames for sheet in ("TRANSACTION_WITHOUT_CHARGES", "TRANSACTION_CHARGES", "CUSTOMER_CONTRACTOR_EQUIP")):
            raise ValueError("The historical file has no rental transaction sheet.")
    except (KeyError, StopIteration, IndexError) as exc:
        raise ValueError("A historical SiteIQ transaction export with a dated report period is required.") from exc
    finally:
        wb.close()
    if start is None or end is None or start >= end:
        raise ValueError("Choose a positive local-time comparison period.")
    first, last = max(start, lo), min(end, hi, pulled)
    if first >= last:
        raise ValueError("The comparison period is outside this transaction export.")
    if first != start or last != end:
        coverage_note = (coverage_note + " The requested dates extend outside the available transaction coverage.").strip()
    result = concurrent_hires(path, label, first, last, owner_label=owner_label, coverage_note=coverage_note)
    result.update(report_start=lo.isoformat(), report_end=hi.isoformat(), exported_at=pulled.isoformat())
    return result


def load_interval_history(path):
    with open(path, encoding="utf-8") as file:
        history = json.load(file)
    if not isinstance(history, dict) or history.get("schema") != 1 or not isinstance(history.get("periods"), list):
        raise ValueError("Invalid historical rental interval data.")
    labels = set()
    for period in history["periods"]:
        if (not isinstance(period, dict) or not clean(period.get("label")) or period["label"] in labels
                or period.get("quality") not in ("recorded", "partial", "unavailable")
                or not all(isinstance(period.get(key), dict) for key in ("total", "owners", "variants", "variant_owners"))):
            raise ValueError("Invalid or duplicate historical rental interval summary.")
        labels.add(period["label"])
    return history["periods"]


def past_concurrency(history, archived=()):
    history = history or {}
    recorded = {p["label"]: p for p in history.get("average_on_hire", []) if p.get("label")}
    recorded.update((p["label"], p) for p in archived)
    labels = dict.fromkeys(row["label"] for series in ("tools", "cons") for row in history.get(series, []) if row.get("label"))
    labels.update(dict.fromkeys(recorded))
    return [recorded.get(label) or unavailable_average(label, "Timed rental issue and return records are unavailable for this shutdown.")
            for label in labels]


def build(rental, asat, transactions, txref, schedule, prior_peaks=None, owner_label=clean, *, history=None, interval_history=(), shutdown_start=None):
    period = txref.get("period") if transactions and schedule and txref.get("schedule") == schedule else None
    if period:
        start, end = period
        end = min(end, asat, txref.get("requested") or asat)
        period = (start, end) if start <= end else None
    supported, excluded, conflicts = unique_assets(rental)
    fleet = {clean(r.get("ITEM_NUMBER")): r for r in supported}
    evidence = transaction_use(transactions, period, fleet) if period and transactions else {}
    groups = {}
    names_by_group = {}
    for asset_id, r in fleet.items():
        variant = clean(r.get("PRODUCT_VARIANT"))
        name = clean(r.get("ITEM_DESCRIPTION"))
        owner = owner_label(r.get("OWNER"))
        # Genuine variant IDs group across description and owner aliases. No-code items
        # share a group only when their description AND owner match.
        key = snapshot_key(r)
        group = groups.setdefault(key, {"history_key": key, "variant": variant, "assets": [], "names": Counter(),
                                        "owners": set(), "on": 0, "used": 0 if period else None})
        status = clean(r.get("ITEM_STATUS"))
        on = status.casefold() == "on hire"
        issued = stamp(r.get("ON_HIRE_DATE"), r.get("ON_HIRE_TIME")) if on else None
        if period and on:
            if issued and issued <= period[1]:
                # A current, unbroken hire from that date covered the period endpoint.
                record(evidence, asset_id, period[1], "Current hire spans period end")
        use = evidence.get(asset_id)
        group["assets"].append({"id": asset_id, "barcode": clean(r.get("ITEM_BARCODE")), "owner": owner, "status": status,
                                "on": on, "on_since": issued.isoformat() if issued else None,
                                "used": bool(use) if period else None,
                                "last_used": use[0].isoformat() if use else None,
                                "source": use[1] if use else None})
        norm = " ".join(name.upper().split())
        names_by_group.setdefault(norm, set()).add(key)
        group["names"][name] += 1
        group["owners"].add(owner)
        group["on"] += on
        if use:
            group["used"] += 1
    for group in groups.values():
        group["fleet"] = len(group["assets"])
        names = group.pop("names")
        group["name"] = names.most_common(1)[0][0]
        group["aliases"] = sorted(names)
        norm = " ".join(group["name"].upper().split())
        group["prior_peak"] = ((prior_peaks or {}).get(norm) if len(names) == 1
                               and len(names_by_group[norm]) == 1 else None)
        group["owner"] = ", ".join(sorted(filter(None, group.pop("owners"))))
        group["assets"].sort(key=lambda a: a["id"])
    variants = sorted(groups.values(), key=lambda g: (g["name"].casefold(), g["variant"], g["owner"]))
    current_start, current_end = period or (None, None)
    coverage = []
    if current_start and shutdown_start:
        if current_start > shutdown_start:
            coverage.append("The transaction window begins after the shutdown opened.")
        current_start = max(current_start, shutdown_start)
    if current_end and current_end < asat:
        coverage.append("The rental stock pull is later than the transaction window.")
    current = concurrent_hires(transactions, "Current shutdown", current_start, current_end, fleet, owner_label,
                               coverage_note=" ".join(coverage))
    return {"average_on_hire": {"current": current, "previous": past_concurrency(history, interval_history)},
            "asat": asat.isoformat(), "period": {"start": period[0].isoformat(), "end": period[1].isoformat()} if period else None,
            "variants": variants, "excluded_missing_id": excluded, "excluded_conflicting_id": conflicts,
            "totals": {"fleet": len(fleet), "on": sum(g["on"] for g in variants),
                       "used": len(evidence) if period else None}}
