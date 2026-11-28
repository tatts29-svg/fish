"""Build the register from held products with identity-confirmed Australian SDS documents."""
import base64
import binascii
from calendar import monthrange
from datetime import date, datetime, timedelta, timezone
from functools import lru_cache
import hashlib
import io
import json
import math
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit


DETAIL_FIELDS = {
    "document_id", "version", "product_identifier", "ghs_classification", "signal_word",
    "hazard_statements", "pictograms", "dangerous_goods", "un_number", "shipping_name",
    "transport_class", "packing_group", "poisons_schedule", "emergency_contact",
    "revision_history", "storage", "use",
}


def stock_quantity(value):
    """A missing or unreadable physical balance is unknown, including error cells."""
    if value is None or isinstance(value, bool):
        return None
    text = str(value).strip()
    if "," in text and not re.fullmatch(r"[+-]?\d{1,3}(?:,\d{3})+(?:\.\d+)?", text):
        return None
    try:
        amount = float(text.replace(",", ""))
    except ValueError:
        return None
    if not math.isfinite(amount):
        return None
    return int(amount) if amount.is_integer() else amount


def safe_url(value):
    url = str(value or "").strip()
    if re.search(r'[\s\x00-\x1f\x7f\\<>"\']', url):
        return ""
    try:
        parts = urlsplit(url)
        if parts.scheme == "https" and parts.hostname and not parts.username and not parts.password:
            return url
    except ValueError:
        pass
    return ""


def date_text(value, allow_month=False):
    try:
        text = str(value)
        if allow_month and re.fullmatch(r"\d{4}-\d{2}", text):
            date.fromisoformat(text + "-01")
            return text
        return date.fromisoformat(text).isoformat()
    except ValueError:
        return ""


def review_dates(issued, today):
    if not issued:
        return "", "review_required"
    month_only = len(issued) == 7
    # Use the first of the month for a conservative check, and preserve the
    # manufacturer's date precision in the visible register.
    start = date.fromisoformat(issued + "-01" if month_only else issued)
    year = start.year + 5
    due = date(year, start.month, min(start.day, monthrange(year, start.month)[1]))
    status = "in_date" if start <= today < due else "review_required"
    return due.isoformat()[:7] if month_only else due.isoformat(), status


def matches_name(record, name):
    allowed = record.get("stock_names")
    norm = lambda s: " ".join(str(s).casefold().split())
    return allowed is None or isinstance(allowed, list) and norm(name) in {norm(s) for s in allowed}


def approved_photo(record):
    """Keep a verified catalogue photo with its caption and supplier attribution."""
    uri = record.get("photo_data") or ""
    caption = str(record.get("photo_caption") or "").strip()
    source = safe_url(record.get("photo_source"))
    prefix = "data:image/webp;base64,"
    if not isinstance(uri, str) or len(uri) > 3 * 1024 * 1024 or not uri.startswith(prefix) or not caption or not source:
        return {}
    try:
        from PIL import Image
        from style_pictures import has_catalogue_frame, styled
    except ImportError:
        return {}
    try:
        raw = base64.b64decode(uri[len(prefix):], validate=True)
        with Image.open(io.BytesIO(raw)) as image:
            if image.format != "WEBP" or not 0 < max(image.size) <= 3840:
                return {}
            image.load()
            tile = uri
            if not has_catalogue_frame(image):
                # A supplier group photo may have a reviewed mask for this exact
                # source only. It isolates the registered pack without repainting it.
                mask_path = Path(__file__).with_name("sds_photo_masks") / (hashlib.sha256(raw).hexdigest() + ".png")
                if mask_path.is_file():
                    with Image.open(mask_path) as mask:
                        if mask.size == image.size:
                            image.putalpha(mask.convert("L"))
                preview = io.BytesIO()
                styled(image).save(preview, "WEBP", quality=90, method=4)
                tile = prefix + base64.b64encode(preview.getvalue()).decode("ascii")
    except (ValueError, OSError, binascii.Error, Image.DecompressionBombError):
        return {}
    return {"photo": uri, "photo_tile": tile, "photo_caption": caption, "photo_source": source}


def confirmed_document(record, folder, checked, today):
    # A legacy 'review' encompasses brand guesses as well as old sheets; only an
    # explicit match can promote a reviewed record into the operational register.
    confirmed = record.get("status") == "verified" or (
        record.get("status") == "review" and record.get("match_confirmed") is True)
    if not confirmed or record.get("match_confirmed") is False or record.get("document_type", "sds") != "sds":
        return None
    if str(record.get("jurisdiction", "AU")).strip().casefold() not in {"au", "australia", "australian", "au/nz", "australia and new zealand"}:
        return None
    url = safe_url(record.get("url"))
    direct = url and (unquote(urlsplit(url).path).lower().endswith(".pdf") or record.get("direct_pdf") is True)
    name = record.get("file") or ""
    if not direct or not record.get("supplier") or not record.get("product"):
        return None
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*\.pdf", name, re.I):
        return None
    try:
        with (folder / "pdfs" / name).open("rb") as stream:
            if stream.read(5) != b"%PDF-":
                return None
    except OSError:
        return None

    details = {}
    for key, val in (record.get("sds_details") or {}).items():
        if key in DETAIL_FIELDS and (isinstance(val, str) or isinstance(val, list) and all(isinstance(x, str) for x in val)):
            details[key] = val
    issued = date_text(record.get("issued"), allow_month=True)
    due, review_status = review_dates(issued, today)
    return {
        "status": "verified", "document_type": "sds", "product": record["product"], "supplier": record["supplier"],
        "manufacturer": record.get("manufacturer") or "", "issued": issued, "review_due": due,
        "review_status": review_status, "checked": date_text(record.get("checked") or checked),
        "url": url, "source": safe_url(record.get("source")), "file": "/sds/" + name,
        "sds_details": details, "note": str(record.get("note") or ""), **approved_photo(record),
    }


def build(data, register_path, *, encode_qr, context=None, today=None):
    path = Path(register_path)
    if not path.is_file():
        return []
    config = json.loads(path.read_text(encoding="utf-8-sig"))
    records = config.get("entries", config)
    checked = config.get("checked")
    today = today or datetime.now(timezone(timedelta(hours=10))).date()
    context = context or {}
    groups = {}

    @lru_cache(maxsize=None)
    def document(key):
        return confirmed_document(records[key], path.parent, checked, today) if key in records else None

    for line in data["clines"]:
        code, sku = line.get("code") or "", line.get("sku") or ""
        key = code or "sku:" + sku
        doc = document(key)
        if not doc or not matches_name(records[key], line["name"]):
            continue
        # SiteIQ sales balances represent the product itself. Rental equipment
        # and its fitted batteries or fluids do not add stock to this register.
        owner = line.get("owner") or ""
        uom = line.get("uom") or records[key].get("uom") or ""
        # A single manufacturer's sheet may cover different products or sizes.
        identity = code or key, owner, uom, doc["product"], doc["file"], doc["url"]
        if identity not in groups:
            groups[identity] = dict(doc, name=line["name"], kind="consumable", code=code, owner=owner, uom=uom,
                                    pack=str(records[key].get("pack") or ""),
                                    source_export="SALES_STOCK", stock_asat=context.get("SALES_STOCK", ""),
                                    job=context.get("job", ""), location=context.get("location", ""),
                                    bins=set(), places=set(), skus=set(), bars=set(), amounts={})
        row = groups[identity]
        for source, target in [("sku", "skus"), ("bar", "bars"), ("bin", "bins"), ("storage_location", "places")]:
            if line.get(source):
                row[target].add(line[source])
        balance = sku, line.get("bar"), line.get("storage_location"), line.get("bin")
        amount = line.get("stock_quantity", line.get("have"))
        if balance in row["amounts"] and row["amounts"][balance] != amount:
            amount = None  # Conflicting balances for the same holding cannot be added.
        row["amounts"][balance] = amount

    qr_cache = {}
    for row in groups.values():
        quantities = row.pop("amounts").values()
        row["quantity"] = sum(quantities) if all(q is not None for q in quantities) else None
        row["available"] = row["quantity"]
        for packed, label in [("bins", "bin"), ("places", "storage_location"), ("skus", "sku"), ("bars", "barcode")]:
            row[label] = ", ".join(sorted(row.pop(packed)))
        if row["url"] not in qr_cache:
            qr_cache[row["url"]] = encode_qr(row["url"])
            if not qr_cache[row["url"]]:
                raise ValueError("The qrcode package is needed to build the SDS register.")
        row["qr"] = qr_cache[row["url"]]
    return sorted(groups.values(), key=lambda row: (row["name"].casefold(), row["code"], row["owner"]))
