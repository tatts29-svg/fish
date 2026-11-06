"""Author: Andrew Fisher. v12.64 - the page's contract lines matched to Baseplan (11) on the lines (11) moved.

Andrew, 30 Oct 2026 15:1x AEST: "Can we match baseplan data on those" - the lines that moved between Baseplan (10) and (11)
(`review_30Oct2026_baseplan11/README.md`): the VMS contract 9961265 re-rated to fixed amounts with VMS19 487T, VMS20 475T and
VMS05a at nought (net +807.36), and the water barriers WB01, WB03 (to Baseplan's 19 Oct term) and WB04 (net -397.66). The pin
table is re-struck on those nineteen lines; WB02 stays unpinned as in v12.55. Charge to the V8s moves +409.70. Nothing else.

Chained on v12.63 (the merge honours tombstones): this patch runs after patch_v1263.py on the live v12.61 and needs its footer.

    python3 patch_v1264.py page.html      (in place, after patch_v1263.py)
"""
import re, sys
from pathlib import Path
HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from baseplan11_pins import replace_pins

FOOTER = re.compile(r"\+' · (v12\.\d+(?:\.\d+)?)'; /\* v8\.19 release922")


def patch(text):
    if 'Baseplan (11) charges this line' in text: raise ValueError('v12.64 already applied')
    if 'gone1263' not in text: raise ValueError('v12.64 chains on v12.63: apply patch_v1263.py first')
    found = FOOTER.findall(text)
    if found != ['v12.63']: raise ValueError('release footer: expected one v12.63 footer, found ' + repr(found))
    styles = re.findall(r'<style\b[^>]*>[\s\S]*?</style>', text)
    text = replace_pins(text)
    if re.findall(r'<style\b[^>]*>[\s\S]*?</style>', text) != styles: raise ValueError('the release changed existing styles')
    return FOOTER.sub(lambda m: m.group(0).replace(m.group(1), 'v12.64'), text, count=1)


if __name__ == '__main__':
    p = Path(sys.argv[1]); t = p.read_text(encoding='utf-8')
    p.write_text(patch(t), encoding='utf-8')
    print('patch_v1264 applied: nineteen contract lines pinned to Baseplan (11); footer v12.63 -> v12.64')
