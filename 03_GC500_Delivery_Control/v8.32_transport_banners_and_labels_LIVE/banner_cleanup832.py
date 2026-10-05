#!/usr/bin/env python3
"""Author: Andrew Fisher. Remove decorative tab banners, retaining Today's board.

This offline helper never executes host code or writes records. The hosted media
catalog stays intact: only banner selections and their rendering paths change.
"""
from __future__ import annotations

import copy
import json
from pathlib import Path
import re
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / 'toolchain'))
from rep import rep

MARKER = '/* v8.32 — Today keeps the only car banner and its original player. */'
PAGE_KEYS = {'progress', 'timeline', 'register', 'map', 'docs', 'plant',
             'fencing', 'journal', 'breakdowns', 'variances', 'costs',
             'edit', 'add', 'pricing', 'about'}


def data_region(text):
    starts = list(re.finditer(r'\bconst\s+DATA\s*=\s*', text))
    if len(starts) != 1:
        raise ValueError('Expected one embedded DATA assignment')
    start = starts[0].end()
    data, end = json.JSONDecoder().raw_decode(text, start)
    if not isinstance(data, dict):
        raise ValueError('Embedded DATA must be an object')
    return data, start, end


def members(region):
    """Find top-level JSON value tokens without reserialising other values."""
    decoder = json.JSONDecoder()
    pos = 1
    result = {}
    while True:
        while region[pos].isspace():
            pos += 1
        if region[pos] == '}':
            return result
        key_start = pos
        key, pos = decoder.raw_decode(region, pos)
        if not isinstance(key, str) or key in result:
            raise ValueError('DATA has an invalid or duplicate property')
        while region[pos].isspace():
            pos += 1
        if region[pos] != ':':
            raise ValueError('Expected a JSON property separator')
        pos += 1
        while region[pos].isspace():
            pos += 1
        value_start = pos
        _, pos = decoder.raw_decode(region, pos)
        result[key] = (key_start, value_start, pos)
        while region[pos].isspace():
            pos += 1
        if region[pos] == ',':
            pos += 1
        elif region[pos] != '}':
            raise ValueError('Expected a JSON member separator')


def bounded_section(text, start, end):
    if text.count(start) != 1 or text.count(end) != 1:
        raise ValueError('Source boundary is missing or ambiguous')
    left = text.index(start)
    right = text.index(end, left)
    return text[left:right]


def apply_banner_cleanup(text):
    if MARKER in text:
        raise ValueError('Banner cleanup has already been applied')
    original, start, end = data_region(text)
    if set(original.get('pageBanners', {})) != PAGE_KEYS:
        raise ValueError('Page-banner inventory differs from the reviewed base')
    if set(original.get('raceBanners', {})) != {'where', 'timeline'}:
        raise ValueError('Legacy-banner inventory differs from the reviewed base')
    if not original.get('board', {}).get('run'):
        raise ValueError('The original Today MP4 must be present')
    expected = copy.deepcopy(original)
    expected['pageBanners'] = {}
    expected['raceBanners'] = {}
    region = text[start:end]
    tokens = members(region)
    for key in ('pageBanners', 'raceBanners'):
        left, value, right = tokens[key]
        old = region[left:right]
        new = region[left:value] + '{}'
        text = rep(text, old, new, 'Clear ' + key + ' selections', 'host')

    def change(old, new, name):
        nonlocal text
        text = rep(text, old, new, name, 'host')

    change("+ esc(label + ' — ' + DATA.event.name) + '</h2>' + (tab === 'map' ? '' : pageBanner(tab));",
           "+ esc(label + ' — ' + DATA.event.name) + '</h2>';",
           'Keep pane heading without its decorative banner')
    page_renderer = bounded_section(text,
        '/* v5.54 — ONE ILLUSTRATIVE BANNER UNDER EACH PAGE HEADING',
        '/* Skip is local navigation within the selected work view;')
    if page_renderer.count('function pageBanner(') != 1:
        raise ValueError('Unexpected page-banner source')
    change(page_renderer, MARKER + '\n', 'Remove page-banner renderer')

    map_contexts = [
        "</div>${pageBanner('map')}`;\n /* the same chooser as the sheets, wired the same way;",
        "</div>${pageBanner('map')}`;\n $('#pane-map').querySelectorAll('[data-sheet]').forEach(b => b.onclick = () => {\n if (b.dataset.sheet !== SAT_3D)",
        "</div>${pageBanner('map')}`;\n\n setHash('sheet/' + sh.key, {replace: location.hash === '#map'});",
    ]
    for index, old in enumerate(map_contexts, 1):
        change(old, old.replace("${pageBanner('map')}", ''),
               'Remove map banner path ' + str(index))

    change(' <div class="dsnband">${(DATA.pageBanners || {}).timeline ? \'\' : (raceBanner(\'timeline\') || dsnBoard(today, dsnState(today), \'still\'))}</div>\n',
           '', 'Remove Timeline legacy fallback and empty container')
    change("return ((DATA.pageBanners || {}).progress ? '' : (raceBanner('where') || dsnBoard(asOf, X, 'still'))) +dsnHead(asOf)",
           'return dsnHead(asOf)', 'Remove Progress legacy fallback')
    race_renderer = bounded_section(text,
        '/* v5.49 — A PHOTOGRAPH, AND NOTHING OVER IT.',
        'function dsnBoard(asOf, X, mode){')
    if race_renderer.count('function raceBanner(') != 1:
        raise ValueError('Unexpected legacy-banner source')
    change(race_renderer, '', 'Remove legacy photographic banner renderer')
    change("    const hero = pane.querySelector(':scope > .rbhero');\n    if (hero) { const art = fold('equipment-image', 'The equipment behind race week', 'View the illustration', [hero]); pane.append(art); }\n",
           '', 'Remove unused Equipment illustration fold')

    actual, _, _ = data_region(text)
    if actual != expected:
        raise ValueError('DATA changed outside the two banner-selection objects')
    if re.search(r'\b(?:pageBanner|raceBanner)\s*\(', text):
        raise ValueError('A removed banner render path remains')
    if 'DATA.pageBanners' in text or 'DATA.raceBanners' in text:
        raise ValueError('A banner fallback remains')
    if text.count("dsnBoard(today, dsnState(today), 'video')") != 1:
        raise ValueError('The Today video render path changed')
    return text
