# Locking Settings with a password

Settings holds the Power Automate trigger URLs and the office letterhead
register. Anyone who changes either one changes the app for everybody using it,
so Settings can be put behind a password while the cover sheet generator itself
stays open to the whole team.

As shipped, no password is set and Settings behaves as it always has. Setting
one takes a minute and does not need any software installed.

---

## Read this first

**This app is static files running in a browser, so the password check runs on
the visitor's own machine.** Someone who knows to open developer tools can step
around it. Everything the page can do, the person holding the page can do.

What it genuinely gives you:

- a colleague cannot wander into Settings and change a flow URL or a phone
  number by accident, which is what actually goes wrong
- the Settings screen is not something a stranger finds by typing `#/settings`
- the password itself is never stored — only a salted, iterated hash of it, so
  nobody reads the password out of the source

What it is not: protection from someone determined to get in. If you need that,
it has to sit above the app, and both options are in
[Stronger than this](#stronger-than-this) at the end.

Two things follow from that, and both are worth saying plainly:

1. **The flow URLs are still the thing to protect.** They are credentials, they
   live in each person's browser, and they are not in the repository. The
   password keeps people out of the screen that shows them; it does not encrypt
   them. Anyone who already pasted a URL into their own browser still has it.
2. **Do not reuse a password you use anywhere else.** The hash ships inside the
   page, which means someone who downloads the page can guess against it offline
   at their leisure. Use something made up for this and nothing else — three or
   four ordinary words you will remember beats a mangled single word.

---

## How it works, in one line

The password lives as a hash inside what you deploy, so changing it means
deploying again. What exactly you replace depends on which shape the site is
deployed in — and the app works that out for you, so in practice you click a
button and drag what it gives you.

| Deployed as | What you replace |
|---|---|
| one `index.html` (what is live today) | that whole `index.html`, which the app hands you with the new password already in it |
| a folder | `assets/settings-password.js` inside it — 15 lines |

The checking code lives in `assets/settings-lock.js` and never changes.

---

## Set the password from inside the app

No Node, no terminal, nothing installed. This is the way to do it on a
drag-and-drop Netlify site.

1. Open the site and go to **Settings** (the gear in the banner).
2. Scroll to **D · Password on this screen**. It tells you which shape this site
   is deployed in, so you do not have to remember.
3. Type the password twice and click **Create the file**.

**On a single-file site**, which is what is live today, it downloads a complete
`index.html` — this site with the new password already in it. Netlify → your
site → **Deploys** → drag that `index.html` onto the drop zone. Done.

The copy it gives you is the page as the server sent it, with only the password
block changed. Nothing you have typed into Settings goes into it, so a flow URL
sitting in the box above cannot be published by accident.

**On a folder site**, it downloads `settings-password.js` instead. Put it in the
folder's `assets` folder, replacing the one there, and drag the folder.

Either way the password itself is not in what you downloaded — only a hash of
it. The next person to open the site gets the lock.

**Until that deploy finishes, the live site still has the old password — or
none.** Making the file changes nothing on its own.

### Taking it off again

Same screen, the **Make a file with no password** button. Replace and deploy
the same way. Settings goes back to being open to anyone.

### Changing it

Same as setting it. Changing the password also shuts out anyone already inside:
the app remembers an unlock against the hash, so a new hash means everyone is
asked again.

---

## Keeping it out of the repository

This repository is public, so the committed `assets/settings-password.js` is
blank. A password hash is designed to ship inside the page — it is not the
password, and it cannot be turned back into one. But publishing yours in a
public repository hands anyone a fixed target to guess against offline at their
leisure, and git keeps it even after the file is changed back.

So keep the filled-in file beside the filled-in `flow-config.js`, somewhere that
is not the checkout, and point the builder at both:

```
python3 tools/make-deploy-folder.py \
    --flow-config       ~/axis-private/flow-config.js \
    --settings-password ~/axis-private/settings-password.js
```

Both paths are checked before anything is built, so pointing at the wrong file
fails immediately rather than destroying the last good build on the way.

The in-app route needs none of this: the file it downloads goes from your
downloads folder straight to Netlify and never touches the repository.

## Or, if you have Node installed

Same job, from the root of this repository:

```
node tools/set-settings-password.js "the password you want"
node tools/set-settings-password.js --clear
```

It writes `assets/settings-password.js` in place, so there is nothing to move —
just deploy the folder. It uses the app's own hashing code rather than a copy,
so the two cannot drift apart.

If the site is ever linked to Git, that same file is what you commit and push,
and the push is the deploy.

---

## If you hand out the standalone file

`Variation Cover Sheet.html` is a single self-contained copy for emailing to
someone who needs it offline. It is the same build as the live site, under a
different name, and it bakes in whatever password was set when it was built.

Opened straight off the disk it cannot rewrite itself — the button needs to read
the page back over the network, and a file on disk is not served. So change the
password on the website and send a fresh copy, or rebuild it:

```
python3 build-single-file.py
```

---

## Forgotten it

There is nothing to recover — the password was never stored. Make a new file and
deploy it, by either method above. Nothing is lost by doing so: the flow URLs
are in each person's browser, not behind the password.

If you have locked yourself out of Settings and so cannot use the in-app button,
you can blank the password by hand. Open the deployed file in Notepad —
`assets/settings-password.js` on a folder site, or `index.html` on a single-file
one — and find:

```
const SETTINGS_LOCK = {
  salt: '…',
  hash: '…',
```

Empty the two quoted values so they read `salt: ''` and `hash: ''`, save, and
deploy. Settings is open again and you can set a new password from inside it.
(`index.html` is one very long line in places; use Notepad's Find for
`SETTINGS_LOCK` rather than scrolling.)

---

## What people see

Opening Settings — from the gear in the banner or by typing `#/settings` —
shows a password card instead of the settings. The rest of the app is untouched:
the state tiles, the form, the preview, the PDF, the log all work for everyone
exactly as before.

Once unlocked, Settings stays open **for that tab until it is closed**. A new
tab asks again. That is deliberate: a shared site office machine should not stay
unlocked because somebody opened Settings on Tuesday.

A wrong password takes about half a second to be refused. That is the hashing
doing its 60,000 rounds, and it is the point — it makes guessing slow.

---

## Stronger than this

Both of these put a real check in front of the site, before the page is ever
sent to the browser, so neither can be stepped around in developer tools. Both
work on a drag-and-drop site — neither needs the repository linked.

**Netlify password protection** — one password for the whole site, set in
Netlify under *Site configuration → Access & security → Visitor access*. Simple,
and nothing to deploy. But it locks the whole app rather than just Settings, so
every estimator needs the password to issue a variation. Needs a paid Netlify
plan.

**Netlify Identity, or Entra ID in front of the site** — people sign in with
their own Axis account and you decide who is an administrator. This is the one
that actually matches "just me", since it ties access to you rather than to a
shared secret, and it is the right answer if Settings ever holds something that
would really hurt to lose.

The password in the app is worth having either way. It is the lock on the
cupboard: it stops the accidents, and it costs a minute.
