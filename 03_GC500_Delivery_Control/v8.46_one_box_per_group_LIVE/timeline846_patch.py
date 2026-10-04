"""Author: Andrew Fisher. Callable presentation-only Timeline adapter."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parent / 'toolchain'))
from rep import rep


def apply(text):
    if 'function timeline846Line(' in text:
        raise ValueError('Timeline v8.46 already present')
    if 'function timeline841Project(' not in text:
        raise ValueError('Native five-stage Timeline is required')
    start = text.index('function ldLine(d, g, n, open, timed){')
    end = text.index('/* the day\'s loads of one kind', start)
    original = text[start:end]
    replacement = (ROOT / 'timeline846_src.js').read_text() + '\nfunction ldLine(d, g, n, open, timed){ return timeline846Line(d, g, n, open, timed); }\n'
    text = rep(text, original, replacement, 'Compact native load presentation', 'v8.46')
    text = rep(text, '</head>\n<body>', '<style id="timeline-v846">\n' + (ROOT / 'timeline846_src.css').read_text() + '\n</style>\n</head>\n<body>', 'Scoped Timeline Option A layout', 'v8.46')
    return text
