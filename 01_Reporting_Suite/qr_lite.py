#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# =====================================================================
#  COATES | QR LITE - QR codes with nothing installed
#  Cement Australia K2 Shutdown 2026 - Gladstone
#  Author: Andrew Fisher | POWERED BY SITEIQ
#
#  A small, complete QR encoder so the store's posters can be rebuilt
#  on any machine with nothing but Python - no pip, no internet, no
#  website that "generates a QR for you" and quietly logs the address.
#
#  Byte mode, error correction level M (recoverable through a bit of
#  dust and tape), versions 1-10, all eight masks scored the way the
#  standard says. Output is SVG so it prints razor sharp at any size.
# =====================================================================

_EXP = [0] * 512
_LOG = [0] * 256
_x = 1
for _i in range(255):
    _EXP[_i] = _x
    _LOG[_x] = _i
    _x <<= 1
    if _x & 0x100:
        _x ^= 0x11D
for _i in range(255, 512):
    _EXP[_i] = _EXP[_i - 255]


def _mul(a, b):
    return 0 if a == 0 or b == 0 else _EXP[_LOG[a] + _LOG[b]]


def _rs_generator(n):
    g = [1]
    for i in range(n):
        g2 = [0] * (len(g) + 1)
        for j, c in enumerate(g):
            g2[j] ^= c
            g2[j + 1] ^= _mul(c, _EXP[i])
        g = g2
    return g


def _rs_encode(data, n):
    g = _rs_generator(n)
    res = list(data) + [0] * n
    for i in range(len(data)):
        c = res[i]
        if c:
            for j in range(1, len(g)):
                res[i + j] ^= _mul(g[j], c)
    return res[len(data):]


#  version -> (total codewords, ec codewords per block, blocks) at level M
_M = {
    1: (26, 10, 1), 2: (44, 16, 1), 3: (70, 26, 1), 4: (100, 18, 2),
    5: (134, 24, 2), 6: (172, 16, 4), 7: (196, 18, 4), 8: (242, 22, 4),
    9: (292, 22, 5), 10: (346, 26, 5),
}
_ALIGN = {1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
          7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50]}
_FORMAT_M = {0: 0x5412, 1: 0x5125, 2: 0x5E7C, 3: 0x5B4B, 4: 0x45F9,
             5: 0x40CE, 6: 0x4F97, 7: 0x4AA0}
_VERSION_BITS = {
    7: 0x07C94, 8: 0x085BC, 9: 0x09A99, 10: 0x0A4D3,
}


def _capacity(ver):
    total, ecc, blocks = _M[ver]
    return total - ecc * blocks


def _pick_version(nbytes):
    for v in range(1, 11):
        cci = 8 if v < 10 else 16
        need = (4 + cci + nbytes * 8 + 7) // 8
        if need <= _capacity(v):
            return v
    raise ValueError("too much data for this little encoder")


def _bitstream(data, ver):
    cci = 8 if ver < 10 else 16
    bits = []

    def put(val, n):
        for i in range(n - 1, -1, -1):
            bits.append((val >> i) & 1)

    put(0b0100, 4)                      # byte mode
    put(len(data), cci)
    for b in data:
        put(b, 8)
    cap = _capacity(ver) * 8
    put(0, min(4, cap - len(bits)))     # terminator
    while len(bits) % 8:
        bits.append(0)
    words = [int("".join(str(b) for b in bits[i:i + 8]), 2)
             for i in range(0, len(bits), 8)]
    pad = [0xEC, 0x11]
    i = 0
    while len(words) < _capacity(ver):
        words.append(pad[i % 2])
        i += 1
    return words


def _interleave(words, ver):
    total, ecc_n, nblocks = _M[ver]
    dcount = _capacity(ver)
    short = dcount // nblocks
    extra = dcount % nblocks
    blocks, ecs, pos = [], [], 0
    for b in range(nblocks):
        size = short + (1 if b >= nblocks - extra else 0)
        blk = words[pos:pos + size]
        pos += size
        blocks.append(blk)
        ecs.append(_rs_encode(blk, ecc_n))
    out = []
    for i in range(max(len(b) for b in blocks)):
        for b in blocks:
            if i < len(b):
                out.append(b[i])
    for i in range(ecc_n):
        for e in ecs:
            out.append(e[i])
    return out


def _matrix(ver, words):
    size = ver * 4 + 17
    m = [[None] * size for _ in range(size)]

    def finder(r, c):
        for i in range(-1, 8):
            for j in range(-1, 8):
                rr, cc = r + i, c + j
                if 0 <= rr < size and 0 <= cc < size:
                    on = (0 <= i <= 6 and j in (0, 6)) or \
                         (0 <= j <= 6 and i in (0, 6)) or \
                         (2 <= i <= 4 and 2 <= j <= 4)
                    m[rr][cc] = 1 if on else 0
    finder(0, 0)
    finder(0, size - 7)
    finder(size - 7, 0)
    for i in range(8, size - 8):
        v = 1 if i % 2 == 0 else 0
        m[6][i] = v
        m[i][6] = v
    for r in _ALIGN[ver]:
        for c in _ALIGN[ver]:
            if m[r][c] is not None:
                continue
            for i in range(-2, 3):
                for j in range(-2, 3):
                    m[r + i][c + j] = 1 if (max(abs(i), abs(j)) != 1) else 0
    m[size - 8][8] = 1                  # dark module
    for i in range(9):                  # format areas reserved
        if m[8][i] is None:
            m[8][i] = 0
        if m[i][8] is None:
            m[i][8] = 0
    for i in range(8):
        if m[8][size - 1 - i] is None:
            m[8][size - 1 - i] = 0
        if m[size - 1 - i][8] is None:
            m[size - 1 - i][8] = 0
    if ver >= 7:
        bits = _VERSION_BITS[ver]
        for i in range(18):
            b = (bits >> i) & 1
            m[i // 3][size - 11 + i % 3] = b
            m[size - 11 + i % 3][i // 3] = b

    bits = []
    for w in words:
        for i in range(7, -1, -1):
            bits.append((w >> i) & 1)
    idx, up, col = 0, True, size - 1
    while col > 0:
        if col == 6:
            col -= 1
        rows = range(size - 1, -1, -1) if up else range(size)
        for r in rows:
            for c in (col, col - 1):
                if m[r][c] is None:
                    m[r][c] = bits[idx] if idx < len(bits) else 0
                    idx += 1
        up = not up
        col -= 2
    return m, size


def _apply_mask(m, size, mask, ver):
    import copy
    g = copy.deepcopy(m)
    reserved = _reserved(size, ver)
    for r in range(size):
        for c in range(size):
            if reserved[r][c]:
                continue
            f = [r + c, r, c, r + c, r // 2 + c // 3, r * c, r * c, r + c]
            cond = [
                (r + c) % 2 == 0, r % 2 == 0, c % 3 == 0, (r + c) % 3 == 0,
                (r // 2 + c // 3) % 2 == 0, (r * c) % 2 + (r * c) % 3 == 0,
                ((r * c) % 2 + (r * c) % 3) % 2 == 0,
                ((r + c) % 2 + (r * c) % 3) % 2 == 0][mask]
            if cond:
                g[r][c] ^= 1
    fmt = _FORMAT_M[mask]
    for i in range(15):
        b = (fmt >> i) & 1
        if i < 6:
            g[i][8] = b
        elif i == 6:
            g[7][8] = b
        elif i == 7:
            g[8][8] = b
        elif i == 8:
            g[8][7] = b
        else:
            g[8][14 - i] = b
        if i < 8:
            g[8][size - 1 - i] = b
        else:
            g[size - 15 + i][8] = b
    g[size - 8][8] = 1
    return g


def _reserved(size, ver):
    res = [[False] * size for _ in range(size)]

    def block(r, c, h, w):
        for i in range(h):
            for j in range(w):
                if 0 <= r + i < size and 0 <= c + j < size:
                    res[r + i][c + j] = True
    block(0, 0, 9, 9)
    block(0, size - 8, 9, 8)
    block(size - 8, 0, 8, 9)
    for i in range(size):
        res[6][i] = True
        res[i][6] = True
    for r in _ALIGN[ver]:
        for c in _ALIGN[ver]:
            if (r < 9 and c < 9) or (r < 9 and c > size - 10) or \
                    (r > size - 10 and c < 9):
                continue
            block(r - 2, c - 2, 5, 5)
    if ver >= 7:
        block(0, size - 11, 6, 3)
        block(size - 11, 0, 3, 6)
    return res


def _penalty(g, size):
    p = 0
    for line in list(g) + [list(col) for col in zip(*g)]:
        run, prev = 0, None
        for v in line:
            if v == prev:
                run += 1
            else:
                if run >= 5:
                    p += 3 + (run - 5)
                run, prev = 1, v
        if run >= 5:
            p += 3 + (run - 5)
    for r in range(size - 1):
        for c in range(size - 1):
            s = g[r][c] + g[r][c + 1] + g[r + 1][c] + g[r + 1][c + 1]
            if s in (0, 4):
                p += 3
    dark = sum(sum(r) for r in g)
    p += 10 * (abs(dark * 100 // (size * size) - 50) // 5)
    return p


def qr_matrix(text):
    """The QR as a list of rows of 0/1."""
    data = text.encode("utf-8")
    ver = _pick_version(len(data))
    words = _interleave(_bitstream(data, ver), ver)
    base, size = _matrix(ver, words)
    best, bestp = None, None
    for mask in range(8):
        g = _apply_mask(base, size, mask, ver)
        p = _penalty(g, size)
        if bestp is None or p < bestp:
            best, bestp = g, p
    return best


def qr_svg(text, px=232, quiet=2, dark="#101317", light="#ffffff"):
    """A ready-to-drop SVG string - crisp at any print size."""
    m = qr_matrix(text)
    n = len(m)
    total = n + quiet * 2
    rects = []
    for r in range(n):
        c = 0
        while c < n:
            if m[r][c]:
                run = 1
                while c + run < n and m[r][c + run]:
                    run += 1
                rects.append("<rect x='{}' y='{}' width='{}' height='1'/>"
                             .format(c + quiet, r + quiet, run))
                c += run
            else:
                c += 1
    return ("<svg width='{px}' height='{px}' viewBox='0 0 {t} {t}' "
            "shape-rendering='crispEdges' xmlns='http://www.w3.org/2000/svg'>"
            "<rect width='{t}' height='{t}' fill='{lt}'/>"
            "<g fill='{dk}'>{r}</g></svg>").format(
        px=px, t=total, lt=light, dk=dark, r="".join(rects))


if __name__ == "__main__":
    import sys
    print(qr_svg(sys.argv[1] if len(sys.argv) > 1 else "https://coates.com.au"))
