#!/usr/bin/env python3
"""Build the folders that get dragged onto Netlify, and zip them.

    python3 tools/make-deploy-folder.py
    python3 tools/make-deploy-folder.py --out /somewhere

It builds two things:

    build/variation-coversheet/   THE SITE: the app as separate files, behind
                                  the Microsoft sign-in. This is what Netlify
                                  publishes (netlify.toml) and what to drag.
    build/single-file/            an OFFLINE copy: the whole app in one
                                  index.html, to open from the disk. It has no
                                  sign-in, so it must never be deployed.

The site carries the Internal Tool Sign-In Standard's files (login, redirect,
auth.js, boot.js and the rest): index.html loads nothing of the app until
boot.js has confirmed a live Axis session, so a folder missing any of them is
not deployable. It also carries _headers (the security headers), _redirects
and robots.txt, and netlify/functions/flow.js, which can hold the Power
Automate trigger URLs so nobody pastes them.

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
FUNCTIONS = Path('netlify') / 'functions'

# The Internal Tool Sign-In Standard's files, which sit beside index.html in the
# site root (the redirect URI is <origin>/redirect.html). Without them the app
# never loads, so a folder missing any of these is not deployable.
SIGN_IN = ['login.html', 'login.js', 'redirect.html', 'redirect.js', 'auth.js', 'boot.js',
           'auth-gate.css', 'msal-browser.min.js', 'app-config.js', 'axis services group.jpg',
           '_headers', '_redirects', 'robots.txt']
ICONS = ['favicon.ico', 'favicon-32.png', 'apple-touch-icon.png']


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

    # boot.js loads the app's scripts after sign-in; index.html does not name
    # them, so check_references cannot see them. Every one has to be there.
    import re
    boot = (folder / 'boot.js').read_text(encoding='utf-8')
    listed = re.search(r'const APP_SCRIPTS = \[(.*?)\];', boot, re.S)
    if not listed:
        sys.exit('boot.js has no APP_SCRIPTS list')
    for rel in re.findall(r"'([^']+)'", re.sub(r'//[^\n]*', '', listed.group(1))):
        if not (folder / rel).exists():
            sys.exit('boot.js loads %s, which is not in %s' % (rel, folder))


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
    # An explicit file wins; otherwise the environment, which is how a Netlify
    # build gets the values without them being in the repository.
    import importlib.util
    spec = importlib.util.spec_from_file_location('bsf', ROOT / 'build-single-file.py')
    bsf = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bsf)

    for given, name, needle, from_env in [
            (flow_config, 'flow-config.js', 'const FLOW_URLS', bsf.flow_config_from_env),
            (settings_password, 'settings-password.js', 'const SETTINGS_LOCK', bsf.settings_password_from_env)]:
        if given:
            src = Path(given)
            if not src.exists():
                sys.exit('missing: %s' % given)
            if needle not in src.read_text(encoding='utf-8'):
                sys.exit('%s does not declare %s — wrong file?' % (given, needle.split()[1]))
            shutil.copy2(src, folder / 'assets' / name)
            continue
        generated = from_env()
        if generated:
            (folder / 'assets' / name).write_text(generated, encoding='utf-8')
    # The same stamp the bundled build carries, so either shape answers "is the
    # right build deployed?" the same way.
    (folder / 'assets' / 'build-info.js').write_text(bsf.build_info(flow_config), encoding='utf-8')

    # The deploy note is not copied in: everything in this folder is published,
    # and it is a note for whoever deploys, not for the web.
    add_functions(folder)
    add_sign_in(folder)
    check_references(folder)
    return folder, shutil.make_archive(str(out_dir / (NAME + '-site')), 'zip',
                                       root_dir=str(out_dir), base_dir=NAME)


def build_single(out_dir, flow_config=None, settings_password=None):
    """The whole app bundled into one index.html, to open from the disk.

    It carries no sign-in (the standard exempts a copy opened from the disk),
    so it is an offline copy and never a deploy."""
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
    for rel in ICONS:
        shutil.copy2(ROOT / rel, folder / rel)
    check_references(folder)
    return folder, shutil.make_archive(str(out_dir / 'single-file-offline'), 'zip',
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

    print('THE SITE (separate files, sign-in, the function) — this is what is deployed')
    report(*build_multi(out, args.flow_config, args.settings_password))
    print('')
    print('OFFLINE COPY (one file, no sign-in) — open it from the disk; never deploy it')
    report(*build_single(out, args.flow_config, args.settings_password))
    print('')
    print('Netlify builds the site from the repository. To deploy by hand, drag the')
    print('variation-coversheet folder — not its contents — onto Netlify under Deploys.')


if __name__ == '__main__':
    main()
