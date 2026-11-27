"""Physical counts recorded by MMG shutdown staff, retained on the report volume."""
import datetime as dt
import json
import sqlite3
import uuid
from contextlib import closing
from functools import lru_cache
from pathlib import Path

from upload_policy import MMG_SCHEDULE

QUEENSLAND = dt.timezone(dt.timedelta(hours=10), "AEST")
COUNT_ROLES = {"manager", "store"}
FIELDS = ("round", "kind", "item_id", "quantity", "person")


class CountError(ValueError):
    def __init__(self, message, status=400):
        super().__init__(message)
        self.status = status


def shift_for(instant):
    local = instant.astimezone(QUEENSLAND)
    shift = "Day" if 6 <= local.hour < 18 else "Night"
    shift_day = local.date() - dt.timedelta(days=int(local.hour < 6))
    return local.isoformat(timespec="microseconds"), shift, shift_day.isoformat()


def published_report(report_path):
    html = Path(report_path).read_text(encoding="utf-8")
    start = html.index("const D=") + len("const D=")
    return json.JSONDecoder().raw_decode(html, start)[0]


@lru_cache(maxsize=1)
def _inventory(report_path, revision):
    # Rebuilds publish this file by atomic replacement.
    stocktake = published_report(report_path)["stocktake"]
    if stocktake["schedule"] != MMG_SCHEDULE:
        raise CountError("The published report belongs to a different stocktake schedule.", 409)
    rows = stocktake["rows"]
    rounds = stocktake.get("rounds") or []
    opening_accepted = bool(rounds and rounds[0].get("carry_forward", {}).get("status") == "accepted")
    return {(row["kind"], row["key"]): row for row in rows}, opening_accepted


def current_item(data_dir, kind, item_id, stage=None):
    path = Path(data_dir) / "report.html"
    try:
        stat = path.stat()
        inventory, opening_accepted = _inventory(path, (stat.st_ino, stat.st_size, stat.st_mtime_ns))
    except CountError:
        raise
    except (OSError, ValueError, KeyError, TypeError, IndexError) as exc:
        raise CountError("The current stock list is unavailable. Refresh the report and try again.", 503) from exc
    if stage == "opening" and opening_accepted:
        raise CountError("Opening inventory has been accepted. Record a during-shutdown or closeout count.", 409)
    row = inventory.get((kind, item_id))
    if row is None:
        raise CountError("This item is absent from the current MMG stock list. Refresh the report.", 409)
    return row


def connect(data_dir):
    conn = sqlite3.connect(Path(data_dir) / "stocktake.sqlite3", timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("""CREATE TABLE IF NOT EXISTS count_entries (
        schedule TEXT NOT NULL, request_id TEXT NOT NULL, round TEXT NOT NULL,
        kind TEXT NOT NULL, item_id TEXT NOT NULL, quantity INTEGER NOT NULL,
        person TEXT NOT NULL, counted_at TEXT NOT NULL, shift TEXT NOT NULL,
        shift_date TEXT NOT NULL, description TEXT NOT NULL, expected_quantity INTEGER,
        stock_status TEXT NOT NULL, PRIMARY KEY(schedule, request_id)
    )""")
    return conn


def all_entries(data_dir):
    with closing(connect(data_dir)) as conn:
        records = conn.execute("SELECT * FROM count_entries WHERE schedule=? ORDER BY rowid", (MMG_SCHEDULE,))
        return [dict(row) for row in records]


def record(data_dir, payload, roster):
    if not isinstance(payload, dict):
        raise CountError("Choose an item, your name, the count round and a quantity.")
    try:
        request_id = str(uuid.UUID(payload["request_id"]))
    except (ValueError, TypeError, AttributeError, KeyError) as exc:
        raise CountError("Start this count again to get a new entry ID.") from exc
    kind, quantity = payload.get("kind"), payload.get("quantity")
    if payload.get("round") not in ("opening", "routine", "closeout") or kind not in ("tool", "cons"):
        raise CountError("Select a stocktake round and a stock item.")
    if not isinstance(payload.get("item_id"), str) or not payload["item_id"]:
        raise CountError("Choose an item from the current stock list.")
    if payload.get("person") not in roster:
        raise CountError("Choose your first and last name from the roster.")
    limit = 1 if kind == "tool" else 2147483647
    if type(quantity) is not int or not 0 <= quantity <= limit:
        raise CountError("Record 0 or 1 for this tool." if kind == "tool" else "Enter a whole, non-negative quantity.")
    with closing(connect(data_dir)) as conn, conn:
        conn.execute("BEGIN IMMEDIATE")
        key = (MMG_SCHEDULE, request_id)
        prior = conn.execute("SELECT * FROM count_entries WHERE schedule=? AND request_id=?", key).fetchone()
        if prior:
            if any(prior[field] != payload[field] for field in FIELDS):
                raise CountError("This entry ID has already been used for a different count.", 409)
            return dict(prior)
        row = current_item(data_dir, kind, payload["item_id"], payload["round"])
        counted_at, shift, shift_date = shift_for(dt.datetime.now(dt.timezone.utc))
        entry = {field: payload[field] for field in FIELDS}
        entry.update(schedule=MMG_SCHEDULE, request_id=request_id, counted_at=counted_at, shift=shift,
                     shift_date=shift_date, description=row["name"], expected_quantity=row["expected"],
                     stock_status=row.get("status", ""))
        conn.execute("""INSERT INTO count_entries (
            schedule, request_id, round, kind, item_id, quantity, person, counted_at, shift,
            shift_date, description, expected_quantity, stock_status
        ) VALUES (
            :schedule, :request_id, :round, :kind, :item_id, :quantity, :person, :counted_at, :shift,
            :shift_date, :description, :expected_quantity, :stock_status
        )""", entry)
        return entry
