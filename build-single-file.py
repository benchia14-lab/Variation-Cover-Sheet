#!/usr/bin/env python3
"""Bundle the app into one self-contained .html file.

    python3 build-single-file.py                       # -> Variation Cover Sheet.html
    python3 build-single-file.py --out somewhere.html

To deploy the app AS a single file — which is how this site is published — build
it straight to the name Netlify serves, and drag that one file:

    python3 build-single-file.py --out build/single-file/index.html

Everything is inlined — stylesheet, the html2pdf bundle, the logo and every
script — so the result is a single file that runs with no server, no install
and no network. Double-click it and the app opens.

That matters more here than it looks: the letterhead logo has to be drawn into
the PDF by html2canvas, and a logo fetched from a neighbouring file taints the
canvas when the page is opened from disk, which silently blanks it. Inlined, it
always renders.

Settings are kept per browser AND per file location, so a rebuilt copy saved to
the same path keeps its flow URLs, and a copy saved elsewhere starts fresh.
"""
import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEFAULT_OUT = ROOT / 'Variation Cover Sheet.html'


def read(rel):
    path = ROOT / rel
    if not path.exists():
        sys.exit('missing: %s' % rel)
    return path.read_text(encoding='utf-8')


def guard(text, rel):
    """A literal </script> inside inlined JS would close the tag early and the
    rest of the app would render as text. Nothing does this today; check anyway,
    because the failure is silent and total."""
    if re.search(r'</\s*script', text, re.I):
        sys.exit('%s contains a literal </script> — escape it before inlining' % rel)
    return text


def build():
    html = read('index.html')

    css = read('assets/styles.css')
    html = html.replace(
        '<link rel="stylesheet" href="assets/styles.css">',
        '<style>\n' + css + '\n</style>')

    for rel in ['vendor/html2pdf.bundle.min.js', 'assets/settings-password.js',
                'assets/settings-lock.js', 'assets/logo.js',
                'assets/state-register.js', 'assets/flow-config.js', 'assets/flow-urls.js',
                'assets/flows.js', 'assets/app.js']:
        tag = '<script src="%s"></script>' % rel
        if tag not in html:
            sys.exit('index.html no longer loads %s — the builder is out of date' % rel)
        html = html.replace(tag, '<script>\n' + guard(read(rel), rel) + '\n</script>')

    if 'src="assets/' in html or 'src="vendor/' in html or 'href="assets/' in html:
        sys.exit('something still points at a separate file; not shipping a broken bundle')
    return html


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--out', default=str(DEFAULT_OUT), help='where to write the bundle')
    args = ap.parse_args()

    html = build()
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding='utf-8')
    print('%s  (%.1f MB)' % (out.name, len(html.encode('utf-8')) / 1048576))


if __name__ == '__main__':
    main()
