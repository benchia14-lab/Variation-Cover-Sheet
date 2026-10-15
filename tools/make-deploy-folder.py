#!/usr/bin/env python3
"""Build the folders that get dragged onto Netlify, and zip them.

    python3 tools/make-deploy-folder.py
    python3 tools/make-deploy-folder.py --out /somewhere

It builds the site in both shapes, so you drag whichever suits:

    build/single-file/            index.html -- the whole app in one file
    build/variation-coversheet/   the same app as separate files

Both also carry netlify/functions/flow.js, which is what lets the site hold the
Power Automate trigger URLs itself instead of every person pasting them in. The
function needs the environment variables named in it; without them, or without
the function, the app falls back to the URL boxes in Settings and nothing
breaks. Which is why a folder is dragged now even for the single-file shape:
one file cannot carry a function beside it.

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


def build_multi(out_dir):
    """The app as separate files."""
    folder = fresh(out_dir / NAME)
    shutil.copy2(ROOT / 'index.html', folder / 'index.html')
    for rel in DIRS:
        src = ROOT / rel
        if not src.is_dir():
            sys.exit('missing: %s/' % rel)
        shutil.copytree(src, folder / rel)
    note = ROOT / 'tools' / 'deploy-readme.txt'
    if note.exists():
        shutil.copy2(note, folder / README)
    check_references(folder)
    add_functions(folder)
    return folder, shutil.make_archive(str(out_dir / (NAME + '-site')), 'zip',
                                       root_dir=str(out_dir), base_dir=NAME)


def build_single(out_dir):
    """The whole app bundled into one index.html, plus the function."""
    folder = fresh(out_dir / 'single-file')
    # The bundler is the one definition of how the app inlines itself; running
    # it is better than a second copy of that logic living here.
    import subprocess
    done = subprocess.run([sys.executable, str(ROOT / 'build-single-file.py'),
                           '--out', str(folder / 'index.html')],
                          cwd=str(ROOT), stdout=subprocess.DEVNULL)
    if done.returncode:
        # The bundler has already said what is missing; repeating a traceback
        # on top of it would only bury the message.
        sys.exit('build-single-file.py could not build the bundle — see above.')
    check_references(folder)
    add_functions(folder)
    return folder, shutil.make_archive(str(out_dir / 'single-file-site'), 'zip',
                                       root_dir=str(out_dir), base_dir='single-file')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=str(ROOT / 'build'),
                    help='where to put the folders and zips (default: ./build)')
    args = ap.parse_args()
    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)

    print('ONE FILE (plus the function) — this is what is deployed today')
    report(*build_single(out))
    print('')
    print('SEPARATE FILES (plus the function)')
    report(*build_multi(out))
    print('')
    print('Drag one of those folders — not its contents — onto Netlify under Deploys.')
    print('The netlify/functions folder has to go up with it, which is why it is a')
    print('folder and not a bare index.html.')


if __name__ == '__main__':
    main()
