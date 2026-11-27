"""Compact fleet and on-hire totals from a particular SiteIQ rental pull."""
import datetime as dt
from openpyxl import load_workbook
from build_onhire_workbook import read_aliases


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
        positions = {key: columns.index(key) for key in fields}
        counts, labels, seen = {}, {}, set()
        for values in rows:
            row = {key: str(values[i] or "").strip() for key, i in positions.items()}
            asset = row["ITEM_NUMBER"]
            if not asset or asset in seen:
                continue
            seen.add(asset)
            row["OWNER"] = owners.get(row["OWNER"].upper(), row["OWNER"])
            key = snapshot_key(row)
            status = statuses.get(row["ITEM_STATUS"].upper(), row["ITEM_STATUS"])
            totals = counts.setdefault(key, [0, 0])
            totals[0] += 1
            totals[1] += status.casefold() == "on hire"
            label = labels.setdefault(key, {"name": row["ITEM_DESCRIPTION"], "owner": row["OWNER"],
                                            "variant": row["PRODUCT_VARIANT"]})
            if label["owner"] != row["OWNER"]:
                label["owner"] = "Multiple owners"
        return {"asat": stamp.isoformat(timespec="seconds"), "counts": counts, "labels": labels}
    except (ValueError, KeyError, StopIteration, IndexError) as exc:
        raise ValueError("A dated SiteIQ rental-stock export with variant and status columns is required.") from exc
    finally:
        wb.close()
