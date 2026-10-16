#!/usr/bin/env python3
"""Build the folders that get dragged onto Netlify, and zip them.

    python3 tools/make-deploy-folder.py
    python3 tools/make-deploy-folder.py --out /somewhere

It builds the site in both shapes, so you drag whichever suits:

    build/single-file/            index.html -- the whole app in one file
    build/variation-coversheet/   the same app as separate files

Both carry the Internal Tool Sign-In Standard's files — login.html,
msal-browser.min.js, app-config.js and the logo — because index.html sends
anyone not signed in to /login.html, and that page has to exist. Both also carry
netlify/functions/flow.js, which can hold the Power Automate trigger URLs so
nobody pastes them.

That is why a folder is dragged now, even for the single-file shape: one file
cannot carry the sign-in pages beside it.

The site is deployed by hand — Netlify is not linked to the repository — so what
goes live is whatever folder someone drags. This builds that folder so it holds
the site and nothing else.

Everything in the dragged folder is published at a public web address. The
repository also holds setup guides, the fill-in workbooks and these tools, and
none of that belongs on the open web, so none of it is copied.

The one file worth knowing about is assets/settings-password.js: the salt and
hash of the Settings password. It is copied as it stands, so a folder built from
an unlocked checkout deploys an unlocked site. Set the password in the app
(Settings -> C) or with tools/set-settings-password.js before building, or drop
the downloaded file into the built folder afterwards.
"""
import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NAME = 'variation-coversheet'

# Exactly what index.html loads, and the note that travels with it.
DIRS = ['assets', 'vendor']
README = 'READ ME FIRST.txt'
FUNCTIONS = Path('netlify') / 'functions'

# The Internal Tool Sign-In Standard's files, which sit beside index.html and
# are copied in unchanged. Without them the app redirects to a sign-in page that
# is not there, so a folder missing any of these is not deployable.
SIGN_IN = ['login.html', 'msal-browser.min.js', 'app-config.js', 'axis services group.jpg']
ICONS = ['favicon.ico', 'apple-touch-icon.png']


def check_references(folder):
    """Everything index.html asks for has to be in the folder, or the site is
    broken in a way nobody sees until it is live.

    Script and style bodies are cut out first. In the bundled build they hold
    the whole html2pdf library, which writes src="..." into pages of its own,
    and those are not this page's references."""
    import re
    html = (folder / 'index.html').read_text(encoding='utf-8')
    markup = re.sub(r'<(script|style)\b[^>]*>.*?</\1>', '', html, flags=re.S | re.I)
    for ref in re.findall(r'(?:src|href)="(?!https?:|#|data:)([^"]+)"', markup):
        if not (folder / ref).exists():
            sys.exit('index.html loads %s, which is not in %s' % (ref, folder))


def add_functions(folder):
    src = ROOT / FUNCTIONS
    if not src.is_dir():
        sys.exit('missing: %s/' % FUNCTIONS)
    shutil.copytree(src, folder / FUNCTIONS)


def add_sign_in(folder):
    for rel in SIGN_IN + ICONS:
        src = ROOT / rel
        if not src.exists():
            sys.exit('missing: %s — the sign-in standard needs it beside index.html' % rel)
        shutil.copy2(src, folder / rel)

    # index.html redirects to /login.html when nobody is signed in. Shipping one
    # without the other is a site that bounces everyone to a 404.
    html = (folder / 'index.html').read_text(encoding='utf-8')
    if '/login.html' in html and not (folder / 'login.html').exists():
        sys.exit('index.html redirects to /login.html, which is not in the folder')
    if 'msal-browser.min.js' in html and not (folder / 'msal-browser.min.js').exists():
        sys.exit('index.html loads msal-browser.min.js, which is not in the folder')


def report(folder, archive):
    files = sorted(f for f in folder.rglob('*') if f.is_file())
    total = sum(f.stat().st_size for f in files)
    print('%s/  (%d files, %.1f MB)' % (folder, len(files), total / 1e6))
    print('%s  (%.1f MB)' % (archive, Path(archive).stat().st_size / 1e6))


def fresh(folder):
    if folder.exists():
        shutil.rmtree(folder)
    folder.mkdir(parents=True)
    return folder


def build_multi(out_dir, flow_config=None, settings_password=None):
    """The app as separate files."""
    folder = fresh(out_dir / NAME)
    shutil.copy2(ROOT / 'index.html', folder / 'index.html')
    for rel in DIRS:
        src = ROOT / rel
        if not src.is_dir():
            sys.exit('missing: %s/' % rel)
        shutil.copytree(src, folder / rel)
    for given, name, needle in [(flow_config, 'flow-config.js', 'const FLOW_URLS'),
                                (settings_password, 'settings-password.js', 'const SETTINGS_LOCK')]:
        if not given:
            continue
        src = Path(given)
        if not src.exists():
            sys.exit('missing: %s' % given)
        if needle not in src.read_text(encoding='utf-8'):
            sys.exit('%s does not declare %s — wrong file?' % (given, needle.split()[1]))
        shutil.copy2(src, folder / 'assets' / name)
    note = ROOT / 'tools' / 'deploy-readme.txt'
    if note.exists():
        shutil.copy2(note, folder / README)
    add_functions(folder)
    add_sign_in(folder)
    check_references(folder)
    return folder, shutil.make_archive(str(out_dir / (NAME + '-site')), 'zip',
                                       root_dir=str(out_dir), base_dir=NAME)


def build_single(out_dir, flow_config=None, settings_password=None):
    """The whole app bundled into one index.html, plus the function."""
    folder = fresh(out_dir / 'single-file')
    # The bundler is the one definition of how the app inlines itself; running
    # it is better than a second copy of that logic living here.
    import subprocess
    cmd = [sys.executable, str(ROOT / 'build-single-file.py'),
           '--out', str(folder / 'index.html')]
    if flow_config:
        cmd += ['--flow-config', str(flow_config)]
    if settings_password:
        cmd += ['--settings-password', str(settings_password)]
    done = subprocess.run(cmd, cwd=str(ROOT), stdout=subprocess.DEVNULL)
    if done.returncode:
        # The bundler has already said what is missing; repeating a traceback
        # on top of it would only bury the message.
        sys.exit('build-single-file.py could not build the bundle — see above.')
    add_functions(folder)
    add_sign_in(folder)
    check_references(folder)
    return folder, shutil.make_archive(str(out_dir / 'single-file-site'), 'zip',
                                       root_dir=str(out_dir), base_dir='single-file')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=str(ROOT / 'build'),
                    help='where to put the folders and zips (default: ./build)')
    ap.add_argument('--flow-config', metavar='PATH',
                    help='build with the trigger URLs from this flow-config.js. '
                         'Keep it OUTSIDE the repository — this repository is public, '
                         'and a committed copy publishes all five URLs.')
    ap.add_argument('--settings-password', metavar='PATH',
                    help='build with the administrator password from this '
                         'settings-password.js, kept outside the repository likewise.')
    args = ap.parse_args()
    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)

    # Checked before anything is built, because building clears the output
    # folder first: a wrong path would otherwise destroy the last good build on
    # its way to failing.
    for given, needle, what in [(args.flow_config, 'const FLOW_URLS', 'FLOW_URLS'),
                                (args.settings_password, 'const SETTINGS_LOCK', 'SETTINGS_LOCK')]:
        if not given:
            continue
        src = Path(given)
        if not src.exists():
            sys.exit('missing: %s' % given)
        if needle not in src.read_text(encoding='utf-8'):
            sys.exit('%s does not declare %s — wrong file?' % (given, what))

    print('ONE FILE (plus the function) — this is what is deployed today')
    report(*build_single(out, args.flow_config, args.settings_password))
    print('')
    print('SEPARATE FILES (plus the function)')
    report(*build_multi(out, args.flow_config, args.settings_password))
    print('')
    print('Drag one of those folders — not its contents — onto Netlify under Deploys.')
    print('The netlify/functions folder has to go up with it, which is why it is a')
    print('folder and not a bare index.html.')


if __name__ == '__main__':
    main()
