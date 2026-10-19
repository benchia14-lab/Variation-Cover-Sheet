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


FLOW_LABELS = [('projectsUrl', 'projects'), ('fileUrl', 'file'),
               ('logReadUrl', 'log read'), ('logWriteUrl', 'log write'),
               ('describeUrl', 'describe')]


def flows_in(flow_config):
    """Which of the five URLs this build will carry. Reads the file that is
    actually going into the build, not the one in the repository."""
    import re
    path = Path(flow_config) if flow_config else ROOT / 'assets' / 'flow-config.js'
    if not path.exists():
        return []
    text = path.read_text(encoding='utf-8')
    found = []
    for key, label in FLOW_LABELS:
        m = re.search(key + r":\s*'([^']*)'", text)
        if m and m.group(1).strip():
            found.append(label)
    return found


def build_info(flow_config):
    """A stamp anyone can read, naming nothing secret: when this copy was built
    and which flows are in it. Enough to tell a stale deploy from a fresh one."""
    import datetime, json
    found = flows_in(flow_config)
    stamp = datetime.datetime.now().astimezone().strftime('%Y-%m-%d %H:%M %Z')
    return ('/* Generated at build time — see assets/build-info.js. */\n'
            'const BUILD_INFO = {\n'
            "  builtAt: %s,\n"
            '  flows: %d,\n'
            '  flowNames: %s\n'
            '};\n') % (json.dumps(stamp), len(found), json.dumps(found))


def read_private(path_text, needle, what):
    """A generated file kept outside the repository. Checked rather than
    trusted: pointing at the wrong one should fail here, not produce a site
    with no flows or no password and no sign of why."""
    path = Path(path_text)
    if not path.exists():
        sys.exit('missing: %s' % path_text)
    source = path.read_text(encoding='utf-8')
    if needle not in source:
        sys.exit('%s does not declare %s — wrong file?' % (path_text, what))
    return source


def build(flow_config=None, settings_password=None):
    html = read('index.html')

    css = read('assets/styles.css')
    html = html.replace(
        '<link rel="stylesheet" href="assets/styles.css">',
        '<style>\n' + css + '\n</style>')

    for rel in ['vendor/html2pdf.bundle.min.js', 'assets/settings-password.js',
                'assets/settings-lock.js', 'assets/logo.js',
                'assets/state-register.js', 'assets/flow-config.js', 'assets/flow-urls.js',
                'assets/build-info.js', 'assets/flows.js', 'assets/app.js']:
        tag = '<script src="%s"></script>' % rel
        if tag not in html:
            sys.exit('index.html no longer loads %s — the builder is out of date' % rel)
        source = read(rel)
        # The URLs and the administrator password hash can both come from files
        # kept outside the repository, so a build carrying them never needs a
        # secret committed to get there.
        if rel == 'assets/flow-config.js' and flow_config:
            source = read_private(flow_config, 'const FLOW_URLS', 'FLOW_URLS')
        if rel == 'assets/settings-password.js' and settings_password:
            source = read_private(settings_password, 'const SETTINGS_LOCK', 'SETTINGS_LOCK')
        if rel == 'assets/build-info.js':
            source = build_info(flow_config)
        html = html.replace(tag, '<script>\n' + guard(source, rel) + '\n</script>')

    if 'src="assets/' in html or 'src="vendor/' in html or 'href="assets/' in html:
        sys.exit('something still points at a separate file; not shipping a broken bundle')
    return html


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--out', default=str(DEFAULT_OUT), help='where to write the bundle')
    ap.add_argument('--flow-config', metavar='PATH',
                    help='use this flow-config.js instead of the one in assets/. '
                         'Keep a filled-in one OUTSIDE the repository: this repository is '
                         'public, and a committed copy publishes the trigger URLs.')
    ap.add_argument('--settings-password', metavar='PATH',
                    help='use this settings-password.js instead of the one in assets/, '
                         'so the administrator password hash is not committed either.')
    args = ap.parse_args()

    html = build(args.flow_config, args.settings_password)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(html, encoding='utf-8')
    print('%s  (%.1f MB)' % (out.name, len(html.encode('utf-8')) / 1048576))


if __name__ == '__main__':
    main()
