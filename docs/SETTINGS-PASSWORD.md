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

The password lives as a hash in one small file, `assets/settings-password.js`.
Changing the password means replacing that one file and deploying again. Nothing
else in the folder changes.

```
assets/settings-password.js    <- the only file that changes. 15 lines.
assets/settings-lock.js        <- the checking code. never changes.
```

---

## Set the password from inside the app

No Node, no terminal, nothing installed. This is the way to do it on a
drag-and-drop Netlify site.

1. Open the site and go to **Settings** (the gear in the banner).
2. Scroll to **C · Password on this screen**.
3. Type the password twice and click **Create the file**. After a moment it
   downloads `settings-password.js`. The password is not in that file — only a
   hash of it.
4. Find the folder you drag onto Netlify and open its **`assets`** folder.
5. Move the downloaded `settings-password.js` in there, **replacing** the one
   already in it.
6. Netlify → your site → **Deploys** → drag the whole folder onto the drop zone.

That is it. The next person to open the site gets the lock.

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
someone who needs it offline. It bakes in whatever password was set when it was
built, and dropping a new `settings-password.js` next to it does nothing —
there is no `assets` folder involved. To refresh it after a password change,
someone with Python runs:

```
python3 build-single-file.py
```

If that is a nuisance, the simpler answer is to point people at the website.

---

## Forgotten it

There is nothing to recover — the password was never stored. Make a new file and
deploy it, by either method above. Nothing is lost by doing so: the flow URLs
are in each person's browser, not behind the password.

If you have locked yourself out of Settings and so cannot use the in-app button,
open `assets/settings-password.js` in Notepad, blank out the two quoted values
so they read `salt: ''` and `hash: ''`, save, and deploy. That unlocks Settings,
and you can set a new password from inside it.

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
