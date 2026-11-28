"""Compact fleet and on-hire totals from a particular SiteIQ rental pull."""
import datetime as dt
from openpyxl import load_workbook
from build_onhire_workbook import read_aliases


def unique_assets(rows):
    """Return one supported state per literal asset ID, omitting conflicting assignments."""
    items, signatures, conflicts = {}, {}, set()
    missing = 0
    fields = ("OWNER", "PRODUCT_VARIANT", "PRODUCT_FAMILY", "ITEM_DESCRIPTION", "ITEM_STATUS",
              "COMPANY_NAME", "HIRER_NAME", "ON_HIRE_DATE", "ON_HIRE_TIME", "ITEM_BARCODE")
    for row in rows:
        item = str(row.get("ITEM_NUMBER") or "").strip()
        if not item:
            missing += 1
            continue
        signature = tuple(" ".join(str(row.get(field) or "").split()).casefold() for field in fields)
        if item in items and signatures[item] != signature:
            conflicts.add(item)
        else:
            items[item], signatures[item] = row, signature
    return [r for item, r in items.items() if item not in conflicts], missing, len(conflicts)


def snapshot_key(row):
    def norm(field):
        return " ".join(str(row.get(field) or "").upper().split())
    variant = norm("PRODUCT_VARIANT")
    if variant:
        return "v:" + variant
    return "d:" + norm("OWNER") + "|" + norm("ITEM_DESCRIPTION")


def requested_time(wb):
    reference = iter(wb["REFERENCE_INFO"].values)
    header = next(reference)
    stamp = next(reference)[next(i for i, field in enumerate(header) if str(field).startswith("REQUESTED_DATE"))]
    if not isinstance(stamp, dt.datetime):
        stamp = dt.datetime.strptime(str(stamp).strip(), "%d/%m/%Y %I:%M %p")
    return stamp


def rental_snapshot(workbook, kit_folder):
    owners = read_aliases(str(kit_folder), "OWNER_ALIASES.txt")
    statuses = read_aliases(str(kit_folder), "STATUS_ALIASES.txt")
    wb = load_workbook(workbook, read_only=True, data_only=True, keep_links=False)
    try:
        stamp = requested_time(wb)
        rows = iter(wb["RENTAL_STOCK"].values)
        columns = [str(column or "").strip() for column in next(rows)]
        fields = ("ITEM_NUMBER", "OWNER", "PRODUCT_VARIANT", "ITEM_DESCRIPTION", "ITEM_STATUS")
        if any(field not in columns for field in fields):
            raise ValueError("Missing rental stock fields")
        company_aliases = read_aliases(str(kit_folder), "COMPANY_ALIASES.txt")
        def raw_rows():
            for values in rows:
                row = dict(zip(columns, values))
                owner = str(row.get("OWNER") or "").strip()
                status = str(row.get("ITEM_STATUS") or "").strip()
                row["OWNER"] = owners.get(owner.upper(), owner)
                row["ITEM_STATUS"] = statuses.get(status.upper(), status)
                yield row
        fleet, missing, conflicts = unique_assets(raw_rows())
        counts, labels, owner_counts = {}, {}, {}
        for row in fleet:
            key = snapshot_key(row)
            owner = str(row.get("OWNER") or "").strip()
            display = company_aliases.get(owner.upper(), owner)
            if display.casefold() == "coates":
                display = "Coates"
            on = row["ITEM_STATUS"].casefold() == "on hire"
            for totals in (counts.setdefault(key, [0, 0]), owner_counts.setdefault(key, {}).setdefault(display, [0, 0])):
                totals[0] += 1
                totals[1] += on
            label = labels.setdefault(key, {"name": row["ITEM_DESCRIPTION"], "owner": display,
                                            "variant": row["PRODUCT_VARIANT"]})
            if label["owner"] != display:
                label["owner"] = "Multiple owners"
        return {"asat": stamp.isoformat(timespec="seconds"), "counts": counts, "labels": labels,
                "owner_counts": owner_counts, "excluded_missing_id": missing, "excluded_conflicting_id": conflicts}
    except (ValueError, KeyError, StopIteration, IndexError) as exc:
        raise ValueError("A dated SiteIQ rental-stock export with variant and status columns is required.") from exc
    finally:
        wb.close()
