"""Manager confirmation of the final SiteIQ consumables pull for the MMG shutdown."""
from datetime import datetime
from functools import lru_cache
import json
from pathlib import Path

from consumable_usage import AEST, JOB, SOURCE
from shutdown_history import SALES_FILE, write_archive
from stocktake_store import published_report, report_version
from upload_policy import MMG_PROJECT, MMG_SCHEDULE

MANAGER = "Andrew Fisher"


class CloseoutError(ValueError):
    def __init__(self, message, status=409):
        super().__init__(message)
        self.status = status


def clock():
    return datetime.now(AEST)


def instant(value):
    if not isinstance(value, str) or "T" not in value:
        raise ValueError("A sales pull must include its time.")
    when = datetime.fromisoformat(value)
    return when.astimezone(AEST) if when.tzinfo else when.replace(tzinfo=AEST)


@lru_cache(maxsize=1)
def _snapshot(report_path, report_revision, facts_path, facts_revision):
    facts = json.loads(facts_path.read_text(encoding="utf-8"))
    if facts.get("schema") != 1 or facts.get("project") != MMG_PROJECT or facts.get("schedule") != MMG_SCHEDULE:
        raise ValueError("Different job")
    policy = facts["return_instruction"]
    if policy["timezone"] != "AEST" or policy["night_store_finish"] != "06:00":
        raise ValueError("Unknown final night shift")
    finish = instant(policy["night_finish_date"] + "T" + policy["night_store_finish"])
    usage = published_report(report_path)["consumable_usage"]
    if usage.get("project") != JOB or usage.get("source") != SOURCE or not usage.get("rows"):
        raise ValueError("Missing verified sales rows")
    # The QR facts currently store the minute. The dashboard retains the actual
    # REQUESTED export time including seconds, which binds final figures to one pull.
    raw = usage["as_at"]
    pulled = instant(raw)
    qr_stamp = facts["sales_asat"]
    qr_time = instant(qr_stamp)
    if qr_time != (pulled.replace(second=0,microsecond=0) if len(qr_stamp) == 16 else pulled):
        raise ValueError("Published sales snapshots disagree")
    return raw, pulled, finish


def _state(data_dir, now):
    root = Path(data_dir)
    result = dict(status="unavailable", eligible=False, sales_as_at="", final_shift_end="",
                  confirmed_by="", confirmed_at="", message="Rebuild the report with the current MMG sales export and final shift dates.")
    try:
        report, facts = root / "report.html", root / "qr-report-data.json"
        stamp, pulled, finish = _snapshot(report, report_version(report.stat()), facts, report_version(facts.stat()))
    except (OSError, KeyError, TypeError, AttributeError, ValueError, OverflowError):
        return result, None
    result.update(sales_as_at=stamp, final_shift_end=finish.isoformat())
    path = root / SALES_FILE
    try:
        archive = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(archive, dict) or archive.get("job") != JOB or not isinstance(archive.get("shuts"), list):
            raise ValueError
    except FileNotFoundError:
        archive = {"job": JOB, "shuts": []}
    except (OSError, ValueError):
        result["message"] = "The saved consumables history could not be verified. Review the history before confirming."
        return result, None
    if now < finish or pulled < finish:
        result.update(status="waiting", message="Confirmation needs a sales export taken at or after the end of the final night shift.")
    elif pulled > now:
        result.update(status="waiting", message="The recorded sales pull is later than the current Queensland time. Check the export time.")
    else:
        saved = archive.get("current_closeout")
        if isinstance(saved, dict) and saved.get("schedule") == MMG_SCHEDULE and saved.get("sales_as_at") == stamp and saved.get("confirmed_by") == MANAGER:
            result.update(status="confirmed", confirmed_by=MANAGER, confirmed_at=saved.get("confirmed_at", ""),
                          message="Andrew Fisher confirmed this sales pull as the final consumables record.")
        else:
            result.update(status="ready", eligible=True, message="The final night shift has ended. Andrew Fisher can confirm this sales pull.")
    return result, archive


def status(data_dir):
    return _state(data_dir, clock())[0]


def confirm(data_dir, payload):
    """Called while the same build lock used by historical imports is held."""
    if (not isinstance(payload, dict) or payload.get("confirmed_by") != MANAGER
            or payload.get("confirmed_complete") is not True or not isinstance(payload.get("sales_as_at"), str)):
        raise CloseoutError("Andrew Fisher must explicitly confirm this sales pull is complete.", 400)
    now = clock()
    state, archive = _state(data_dir, now)
    if payload["sales_as_at"] != state["sales_as_at"]:
        raise CloseoutError("The published sales pull has changed. Refresh and review it before confirming.")
    if state["status"] == "confirmed":
        return state
    if not state["eligible"]:
        raise CloseoutError(state["message"])
    at = now.isoformat(timespec="seconds")
    archive["current_closeout"] = {"schedule": MMG_SCHEDULE, "sales_as_at": state["sales_as_at"],
                                  "confirmed_by": MANAGER, "confirmed_at": at}
    write_archive(Path(data_dir) / SALES_FILE, archive)
    state.update(status="confirmed", eligible=False, confirmed_by=MANAGER, confirmed_at=at,
                 message="Andrew Fisher confirmed this sales pull as the final consumables record.")
    return state
