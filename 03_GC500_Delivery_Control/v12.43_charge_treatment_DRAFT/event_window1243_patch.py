"""Author: Andrew Fisher. Read one fresh event-day array per event window."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'toolchain'))
from rep import rep


OLD = """function eventWindow(){
 if (!EVENT_DAYS.length) return null;
 return {from: EVENT_DAYS[0], to: EVENT_DAYS[EVENT_DAYS.length - 1], days: EVENT_DAYS.length};
}"""

NEW = """function eventWindow(){
 /* Author: Andrew Fisher. The frozen days are fresh for this call; no callbacks
    run between these reads and no answer is retained for the next call. */
 const days1243=EventConfig1013.current().eventDays;
 if (!days1243.length) return null;
 return {from: days1243[0], to: days1243[days1243.length - 1], days: days1243.length};
}"""


def patch(text, path):
    if 'const days1243=EventConfig1013.current().eventDays;' in text:
        raise ValueError('v12.43 event window read is already applied')
    if text.count(OLD) != 1:
        raise ValueError('event window read requires one exact source match')
    start = text.index(OLD)
    return text[:start] + rep(OLD, OLD, NEW, 'one fresh event-day read per window', path) + text[start + len(OLD):]
