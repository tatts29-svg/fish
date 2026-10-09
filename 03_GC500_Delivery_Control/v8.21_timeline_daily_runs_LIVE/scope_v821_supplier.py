"""Author: Andrew Fisher. Preserve supplier-card styling without editing either owner source."""
import re

EXCLUSION = ':not(:where(.ep819 *))'

def split_selectors(value):
    parts, start, depth = [], 0, 0
    for index, char in enumerate(value):
        if char in '([':
            depth += 1
        elif char in ')]':
            depth -= 1
        elif char == ',' and depth == 0:
            parts.append(value[start:index])
            start = index + 1
        if depth < 0:
            raise SystemExit('Unbalanced Timeline selector')
    if depth:
        raise SystemExit('Unbalanced Timeline selector')
    return parts + [value[start:]]

def scope_css(css):
    if EXCLUSION in css:
        raise SystemExit('Supplier CSS exclusion already applied')
    count = 0
    def scope(match):
        nonlocal count
        selectors = split_selectors(match.group(1))
        if not all(s.strip().startswith('#pane-timeline ') for s in selectors):
            raise SystemExit('Unexpected selector in frozen Timeline stylesheet')
        if any('::' in s for s in selectors):
            raise SystemExit('Pseudo-element needs an explicit scoping review')
        count += len(selectors)
        # :where contributes zero specificity, preserving every native Timeline rule.
        return ','.join(s.rstrip() + EXCLUSION for s in selectors) + '{'
    scoped = re.sub(r'(#pane-timeline[^{}]+)\{', scope, css)
    if count < 50 or scoped.count(EXCLUSION) != count:
        raise SystemExit('Unexpected Timeline selector count')
    return scoped, count

def patch(page, css):
    if 'const EP819 =' not in page and 'const EP819=' not in page:
        raise SystemExit('Supplier styling adapter requires the supplier-plan source')
    if page.count(css) != 1:
        raise SystemExit('Expected exactly one unchanged v821 stylesheet')
    scoped, count = scope_css(css)
    return page.replace(css, scoped), count
