#!/usr/bin/env python3
"""Key the background off a logo and write it into the office register.

    python3 tools/add-logo.py NZ path/to/logo.png
    python3 tools/add-logo.py --preview NZ path/to/logo.png   # don't write

The logos arrive as screenshots with the app's own cream background baked in,
which would print as a visible rectangle on a white letterhead. This removes it,
trims the leftover padding, and stores the result as a data URI in the `logo`
field of the matching row in assets/state-register.js.

A data URI rather than a file beside the app: html2canvas has to draw the logo
into the PDF, and an image fetched from a neighbouring file taints the canvas
when the app is opened from disk, which blanks the letterhead silently.

The background is removed by FLOOD FILL from the edges, not by colour distance.
Several of these logos are a dark ellipse with white lettering inside it, and
white is close enough to the cream background that a distance test would eat the
lettering. Flood fill only takes the background actually connected to the edge.
"""
import argparse
import base64
import io
import re
import sys
from collections import deque
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit('Pillow is needed: pip install pillow')

ROOT = Path(__file__).resolve().parent.parent
REGISTER = ROOT / 'assets' / 'state-register.js'

FILL_TOLERANCE = 18   # how far a pixel may drift from the background and still be background
EDGE_SOFT = 26        # anti-aliased pixels within this of the background get partial alpha


def background_colour(im):
    """Whatever colour occupies the border ring. These are screenshots, so it is
    flat, but take the most common rather than assuming the corner is typical."""
    w, h = im.size
    px = im.load()
    ring = [px[x, 0] for x in range(w)] + [px[x, h - 1] for x in range(w)] \
         + [px[0, y] for y in range(h)] + [px[w - 1, y] for y in range(h)]
    return max(set(ring), key=ring.count)[:3]


def distance(a, b):
    return max(abs(a[0] - b[0]), abs(a[1] - b[1]), abs(a[2] - b[2]))


def key_out(im):
    im = im.convert('RGBA')
    w, h = im.size
    px = im.load()
    bg = background_colour(im)

    # --- flood fill inward from every edge pixel that still looks like background
    seen = bytearray(w * h)
    queue = deque()
    for x in range(w):
        for y in (0, h - 1):
            queue.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        i = y * w + x
        if seen[i]:
            continue
        if distance(px[x, y][:3], bg) > FILL_TOLERANCE:
            continue
        seen[i] = 1
        queue.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    # --- clear the fill, and soften the anti-aliased ring left along its border
    for y in range(h):
        for x in range(w):
            i = y * w + x
            r, g, b, a = px[x, y]
            if seen[i]:
                px[x, y] = (r, g, b, 0)
                continue
            touches_bg = any(
                0 <= x + dx < w and 0 <= y + dy < h and seen[(y + dy) * w + (x + dx)]
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)))
            if not touches_bg:
                continue
            d = distance((r, g, b), bg)
            if d < EDGE_SOFT:
                px[x, y] = (r, g, b, int(a * d / EDGE_SOFT))

    box = im.getbbox()          # drop the padding the screenshot came with
    return im.crop(box) if box else im


def to_data_uri(im):
    """Optimised RGBA PNG. Not quantized: these logos need their alpha, and a
    palette image carries only one transparent index, which would turn the
    softened edges into a hard jagged one."""
    buf = io.BytesIO()
    im.save(buf, format='PNG', optimize=True)
    raw = buf.getvalue()
    return 'data:image/png;base64,' + base64.b64encode(raw).decode('ascii'), len(raw)


def write_register(code, uri):
    source = REGISTER.read_text()
    block = re.search(r'^const STATE_REGISTER = \[.*?^\];\n', source, re.S | re.M)
    if not block:
        sys.exit('Could not find the STATE_REGISTER block in %s' % REGISTER)
    text = block.group(0)

    row = re.search(r'\{\s*\n\s*code: "%s".*?\n  \}' % re.escape(code), text, re.S)
    if not row:
        sys.exit('No row with code "%s" in the register' % code)
    updated = re.sub(r'(\n    logo: )"[^"]*"', lambda m: m.group(1) + '"%s"' % uri, row.group(0), count=1)
    if updated == row.group(0):
        sys.exit('Row "%s" has no logo field to fill' % code)

    REGISTER.write_text(source.replace(text, text.replace(row.group(0), updated), 1))


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('code', help='the office code, e.g. NZ')
    ap.add_argument('image', help='the logo file')
    ap.add_argument('--preview', metavar='PATH', help='also save the keyed PNG here to eyeball it')
    ap.add_argument('--dry-run', action='store_true', help='report only, do not touch the register')
    args = ap.parse_args()

    im = key_out(Image.open(args.image))
    uri, size = to_data_uri(im)
    print('%-4s %dx%d after trim, %.1f kB png, %.1f kB as a data URI' %
          (args.code, im.width, im.height, size / 1024, len(uri) / 1024))
    if args.preview:
        im.save(args.preview)
    if not args.dry_run:
        write_register(args.code.upper(), uri)


if __name__ == '__main__':
    main()
