"""Company-contributed MMG work milestones and manager publication."""
from contextlib import closing
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
import re
import sqlite3


class NoteError(ValueError):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def _path(data_dir):
    return Path(data_dir) / "qr-company-notes.sqlite3"


def validate(payload):
    if not isinstance(payload, dict) or set(payload) != {"company", "date", "title", "description"}:
        raise NoteError(400, "Enter a work date, title and description.")
    company = payload["company"]
    if not isinstance(company, str) or not re.fullmatch(r"[a-f0-9]{32}", company):
        raise NoteError(400, "Choose a company from the report.")
    day = payload["date"]
    try:
        parsed = date.fromisoformat(day)
        if parsed.isoformat() != day or parsed > datetime.now(timezone(timedelta(hours=10))).date():
            raise ValueError
    except (TypeError, ValueError):
        raise NoteError(400, "Enter a valid work date up to today.") from None
    values = []
    for key, limit in (("title", 90), ("description", 600)):
        value = payload[key]
        if not isinstance(value, str) or len(value) > limit:
            raise NoteError(400, f"Enter a {key} of up to {limit} characters.")
        value = " ".join(value.split())
        if not value or not value.isprintable():
            raise NoteError(400, f"Enter a readable {key}.")
        values.append(value)
    return company, day, *values


def submit(data_dir, company_id, company_name, day, title, description):
    with closing(sqlite3.connect(_path(data_dir))) as db, db:
        db.execute("""CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY, company_id TEXT NOT NULL, company_name TEXT NOT NULL,
            date TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            UNIQUE(company_id, date, title, description))""")
        db.execute("BEGIN IMMEDIATE")
        if db.execute("SELECT 1 FROM notes WHERE company_id=? AND date=? AND title=? AND description=?",
                      (company_id, day, title, description)).fetchone():
            return
        if db.execute("SELECT count(*) FROM notes WHERE company_id=? AND status='pending'",
                      (company_id,)).fetchone()[0] >= 30:
            raise NoteError(429, "The tool store is reviewing this company’s submissions. Please try again later.")
        db.execute("INSERT INTO notes(company_id, company_name, date, title, description) VALUES(?,?,?,?,?)",
                   (company_id, company_name, day, title, description))


def entries(data_dir, company_id=None):
    path = _path(data_dir)
    if not path.is_file():
        return []
    with closing(sqlite3.connect(path)) as db:
        db.row_factory = sqlite3.Row
        if company_id is not None:
            rows = db.execute("""SELECT date,title,description FROM notes WHERE company_id=? AND status='published'
                                 ORDER BY date DESC,id DESC""", (company_id,))
        else:
            rows = db.execute("""SELECT id,company_name,date,title,description,status FROM notes
                                 WHERE status IN ('pending','published')
                                 ORDER BY (status='pending') DESC,id DESC""")
        return [dict(row) for row in rows]


def review(data_dir, payload):
    if (not isinstance(payload, dict) or set(payload) != {"id", "action"}
            or type(payload["id"]) is not int or not 0 < payload["id"] < 2**63
            or payload["action"] not in ("publish", "decline", "withdraw")):
        raise NoteError(400, "Choose a work milestone and a review action.")
    initial, final = {"publish": ("pending", "published"), "decline": ("pending", "declined"),
                      "withdraw": ("published", "withdrawn")}[payload["action"]]
    if not _path(data_dir).is_file():
        raise NoteError(404, "Work milestone unavailable.")
    with closing(sqlite3.connect(_path(data_dir))) as db, db:
        changed = db.execute("UPDATE notes SET status=? WHERE id=? AND status=?",
                             (final, payload["id"], initial)).rowcount
        if not changed:
            raise NoteError(409, "This milestone has already been reviewed. Refresh the review list.")
