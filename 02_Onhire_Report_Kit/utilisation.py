"""Current fleet and dated rental-use evidence by exact product variant."""
from collections import Counter
from datetime import date, datetime, time

from openpyxl import load_workbook

from variant_history import snapshot_key, unique_assets


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


def build(rental, asat, transactions, txref, schedule, prior_peaks=None, owner_label=clean):
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
    return {"asat": asat.isoformat(), "period": {"start": period[0].isoformat(), "end": period[1].isoformat()} if period else None,
            "variants": variants, "excluded_missing_id": excluded, "excluded_conflicting_id": conflicts,
            "totals": {"fleet": len(fleet), "on": sum(g["on"] for g in variants),
                       "used": len(evidence) if period else None}}
