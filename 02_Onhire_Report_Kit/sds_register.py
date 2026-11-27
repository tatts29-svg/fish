"""Join a job's reviewed SDS references to its current SiteIQ holdings."""
from datetime import date, timedelta
import json
from pathlib import Path
import re
from urllib.parse import urlsplit


STATUSES = {"verified", "review", "label", "article", "unassessed"}
PRODUCT_WORDS = re.compile(
    r"\b(?:adhesive|antiseize|cleaner|electrode|grease|lubricant|oil|sealant|"
    r"silicone|solvent|paint|resin|fuel|chemical|primer|battery|aerosol)\b", re.I)


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


def document_due(issued, today):
    try:
        cutoff = today.replace(year=today.year - 5)
    except ValueError:  # A leap day has no anniversary five years earlier.
        cutoff = (today - timedelta(days=1)).replace(year=today.year - 5)
    if not issued:
        return True
    earliest = date.fromisoformat(issued + "-01" if len(issued) == 7 else issued)
    return not cutoff < earliest <= today


def matches_name(record, name):
    allowed = record.get("stock_names")
    norm = lambda s: " ".join(str(s).casefold().split())
    return allowed is None or isinstance(allowed, list) and norm(name) in {norm(s) for s in allowed}


def standalone_milwaukee(group):
    # A light, charger or bare tool can mention a Milwaukee battery in its name.
    # Require the inventory line itself to describe the battery pack.
    names = [group["name"], *(group.get("aliases") or [])]
    return any(re.match(r"^batter(?:y|ies)\b", n, re.I) and
               re.search(r"\bMilwaukee\b", n, re.I) and
               not re.search(r"\b(?:charger|adaptor|adapter|holder|kit)\b", n, re.I)
               for n in names)


def describe(row, record, checked, folder, today):
    status = record.get("status", "unassessed")
    status = status if status in STATUSES else "unassessed"
    note = str(record.get("note") or "")
    issued = date_text(record.get("issued"), allow_month=True)
    document_type = str(record.get("document_type") or ("product" if status == "article" else "sds")).casefold()
    if document_type not in {"sds", "product", "technical", "guide"}:
        document_type = "product" if status == "article" else "sds"
    if status == "verified" and document_type != "sds":
        status = "article"
    if status == "article" and document_type == "sds":
        document_type = "product"
    url, source = safe_url(record.get("url")), safe_url(record.get("source"))
    filename = str(record.get("file") or "")
    file_url = ""
    if status in {"verified", "review", "article"} and re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*\.pdf", filename, re.I):
        if (folder / "pdfs" / filename).is_file():
            file_url = "/sds/" + filename
    if status == "verified":
        problem = ""
        if not record.get("supplier") or not record.get("product") or not url:
            problem = "Confirm the product, supplier and Australian SDS source."
        elif filename and not file_url:
            problem = "The registered copy is unavailable. Check the supplier document."
        elif document_due(issued, today):
            problem = "Confirm the latest revision with the supplier."
        if problem:
            status = "review"
            note = (note + " " + problem).strip()
    if not note:
        if status == "unassessed" and PRODUCT_WORDS.search(row["name"]):
            note = "Check the product label and supplier documentation."
        elif status == "unassessed":
            note = "This stock line is awaiting screening."
        elif status == "label":
            note = "Confirm the brand and product code from the container label."
    row.update(status=status, product=str(record.get("product") or ""),
               supplier=str(record.get("supplier") or ""), issued=issued,
               checked=date_text(record.get("checked") or checked) if record else "",
               url=url if status in {"verified", "review", "article"} else "", source=source,
               file=file_url, document_type=document_type if status in {"verified", "review", "article"} and (file_url or url) else "",
               note=note)
    return row


def build(data, register_path, today=None):
    path = Path(register_path)
    config = json.loads(path.read_text(encoding="utf-8-sig")) if path.is_file() else {}
    records = config.get("entries", config)
    checked = config.get("checked")
    today = today or date.today()
    result = []

    def append(row, key, fallback=None):
        record = records.get(key, fallback or {})
        if not matches_name(record, row["name"]):
            record = {"status": "label", "note": "This stock description differs from the reviewed product. Confirm the item label."}
        result.append(describe(row, record, checked, path.parent, today))

    for line in data["clines"]:
        code, sku = line.get("code") or "", line.get("sku") or ""
        row = dict(kind="consumable", name=line["name"], code=code, sku=sku, barcode=line.get("bar") or "",
                   quantity=line.get("stock_quantity", line.get("have")), owner=line.get("owner") or "")
        append(row, code or "sku:" + sku)
    for group in data["utilisation"]["variants"]:
        variant = group.get("variant") or ""
        row = dict(kind="rental", name=group["name"], code=variant, sku="", barcode="",
                   quantity=group["fleet"], owner=group["owner"])
        record = None
        if standalone_milwaukee(group):
            battery = records.get("__milwaukee", {})
            models = battery.get("variants")
            # Exact model text on the export can establish applicability.
            # Voltage or capacity alone cannot distinguish a cell pack model.
            model_text = " ".join([variant, group["name"], *group.get("aliases", [])]).upper()
            if models is None or any(re.search(r"(?<![A-Z0-9])" + re.escape(model.upper()) + r"(?![A-Z0-9])",
                                               model_text) for model in models if model):
                record = battery
            elif battery:
                record = {
                    "status": "label", "supplier": battery.get("supplier", "Milwaukee"),
                    "source": battery.get("source", ""),
                    "note": "Check the model number printed on the battery pack to match its supplier documentation."
                }
        append(row, group["history_key"], record)
    return result
