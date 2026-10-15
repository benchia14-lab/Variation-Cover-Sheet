#!/usr/bin/env python3
"""Build the folder that gets dragged onto Netlify, and zip it.

    python3 tools/make-deploy-folder.py
    python3 tools/make-deploy-folder.py --out /somewhere

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
FILES = ['index.html']
DIRS = ['assets', 'vendor']
README = 'READ ME FIRST.txt'


def build(out_dir):
    folder = out_dir / NAME
    if folder.exists():
        shutil.rmtree(folder)
    folder.mkdir(parents=True)

    for rel in FILES:
        src = ROOT / rel
        if not src.exists():
            sys.exit('missing: %s' % rel)
        shutil.copy2(src, folder / rel)

    for rel in DIRS:
        src = ROOT / rel
        if not src.is_dir():
            sys.exit('missing: %s/' % rel)
        shutil.copytree(src, folder / rel)

    note = ROOT / 'tools' / 'deploy-readme.txt'
    if note.exists():
        shutil.copy2(note, folder / README)

    # Everything index.html asks for has to be in here, or the site is broken in
    # a way nobody sees until it is live.
    html = (folder / 'index.html').read_text(encoding='utf-8')
    import re
    for ref in re.findall(r'(?:src|href)="(?!https?:|#|data:)([^"]+)"', html):
        if not (folder / ref).exists():
            sys.exit('index.html loads %s, which is not in the folder' % ref)

    archive = shutil.make_archive(str(out_dir / (NAME + '-site')), 'zip',
                                  root_dir=str(out_dir), base_dir=NAME)

    total = sum(f.stat().st_size for f in folder.rglob('*') if f.is_file())
    print('%s/  (%d files, %.1f MB)' % (folder, sum(1 for f in folder.rglob('*') if f.is_file()), total / 1e6))
    print('%s  (%.1f MB)' % (archive, Path(archive).stat().st_size / 1e6))
    print('')
    print('Drag the folder — not its contents — onto Netlify under Deploys.')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=str(ROOT / 'build'),
                    help='where to put the folder and the zip (default: ./build)')
    args = ap.parse_args()
    out = Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    build(out)


if __name__ == '__main__':
    main()
