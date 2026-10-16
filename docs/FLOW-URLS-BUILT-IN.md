# Building the flow URLs into the app

The simplest way to make the app work for everyone: put the five Power Automate
trigger URLs inside what gets deployed. Nobody pastes anything, every laptop
that opens the site works, and there is nothing to set up per person.

It is also the only one of the three ways that publishes the URLs, so read the
next section before using it.

---

## The condition

**A trigger URL's `sig=` value is the whole authentication.** Anyone holding the
URL can run that flow — read your project register, write files into SharePoint,
add rows to the variation log. Building the URLs into the app means everyone who
is served the page is handed all five.

That is sound **only when the site is behind a sign-in**, so that being served
the page already means being in your organisation. Microsoft sign-in in front of
the site — Netlify Identity with Entra ID, or an equivalent — is what makes this
safe, and it has to be in place before a filled-in copy goes live.

Two consequences worth stating plainly:

1. **Never commit a filled-in `assets/flow-config.js`.** This repository is
   **public**, so a filled-in copy pushed to it puts all five URLs on the open
   internet — and in the git history, where deleting the file later does not
   remove them. The copy in the repository is blank and must stay that way.

   The in-app route avoids this entirely: the file it downloads goes straight
   from your downloads folder to Netlify and never touches the repository. That
   is the route to use.
2. **If the sign-in ever comes off, the URLs are public.** Rotate them in Power
   Automate (regenerate the trigger URL) and build the new ones in. An old URL
   cannot be un-published, only revoked.

If you would rather not publish them at all, the alternative is
[FLOW-URLS-ON-THE-SERVER.md](FLOW-URLS-ON-THE-SERVER.md), which keeps them in
Netlify's environment variables behind a function and never sends them to a
browser. It needs the function to deploy, which the drop zone may not do.

---

## Doing it

In the app, once, from a browser where the flows already work:

1. **Settings → A** — paste the five URLs into the boxes, as you would for
   yourself. Press **Connect to the flows** to check they work before baking
   them in.
2. **Settings → C → Build the URLs in.** It downloads a copy of the app with
   them inside it.
3. Deploy that copy. On this site that means dragging the `index.html` it gives
   you onto Netlify → your site → **Deploys**. If you deploy a folder, put the
   downloaded `flow-config.js` into the folder's `assets` folder instead and drag
   the folder.
4. On **a colleague's laptop**, not your own, open the site and press
   **Connect to the flows**. Your own browser has the URLs saved locally and will
   work either way, which is exactly how this looks fixed when it is not.

### Taking them back out

**Settings → C → Build a copy with none in.** Deploy that, and the app is back
to the server function or per-person pasting.

### From a terminal instead

```
node tools/set-flow-urls.js --projects "https://…" --file "https://…" \
                            --log-read "https://…" --log-write "https://…" \
                            --describe "https://…"
node tools/set-flow-urls.js --show
node tools/set-flow-urls.js --clear
```

Flags you leave out keep what is already there. It writes
`assets/flow-config.js` **inside your checkout**, so after deploying, put it
back with `node tools/set-flow-urls.js --clear` — or use the in-app route, which
never writes into the repository at all.

### Keeping a filled-in copy outside the repository

The safest arrangement if you build from source: keep one filled-in
`flow-config.js` somewhere that is not the checkout, and point the builders at
it. Nothing in the repository ever holds a URL, so nothing can be committed by
accident.

```
python3 tools/make-deploy-folder.py --flow-config ~/axis-private/flow-config.js
python3 build-single-file.py --flow-config ~/axis-private/flow-config.js --out build/index.html
```

Both refuse a file that does not declare `FLOW_URLS`, so pointing at the wrong
one fails loudly rather than building a site with no flows.

---

## Seeing them afterwards

Built-in URLs are **masked** in Settings. Each box shows enough to tell which
flow it is and that something is set, with the signature replaced by dots:

```
https://defaulte52a9a8778f14048b91…al%2Frun&sv=1.0&sig=••••••••••  (hidden)
```

**Show URLs (admin)** asks for the Settings password and then shows them in
full. **Hide URLs** puts them back, and leaving Settings hides them anyway, so
they are never left on screen. With no password set the button declines to do
anything and says to set one in section D first — a reveal guarded by nothing
would be a reveal in a costume.

Only once they are shown does **Unlock to change** appear. Editing a row of dots
could only ever save a row of dots.

Masks are never mistaken for URLs: saving with them on screen stores nothing,
and rebuilding with **Build the URLs in** keeps the real ones rather than baking
the dots in.

### What the masking is for, and what it is not

It is for shoulders, screenshots and shared screens: a flow URL should not be
sitting in plain sight while you demonstrate something.

It is **not** a secret kept from the people using the app. The URLs are in the
deployed page, and anyone who can open the site can read them in view-source or
with `curl`. No amount of hiding in the interface changes that — see
[SIGN-IN.md](SIGN-IN.md) for what does.

## Where a URL comes from

Three places, most specific first. The app uses the first that has one:

| Order | Source | Scope |
|---|---|---|
| 1 | The site's own function | Everyone; the URL never reaches a browser |
| 2 | Pasted into Settings | That one browser only |
| 3 | Built into the app | Everyone who opens the site |

Built-in comes last so a deliberate override in front of you always wins. That
also means **pasting a URL into Settings on your own machine hides whether the
built-in one works** — hence testing on a colleague's laptop.

Settings shows which of the three each flow is using: **served by the site**,
**built into the app**, or neither. A built-in URL is shown in its box rather
than hidden, because it is already in the page source of the copy you are
looking at and seeing it is how you check the right one went in. Saving does not
copy it into your browser; editing it does, deliberately, for your browser only.

---

## If it still does not work

Press **Connect to the flows** and read the row for the failing flow.

- **"could not reach the flow"** — this is not a missing URL. It is almost
  always the flow's Response action not returning the
  `Access-Control-Allow-Origin` header for the site's address, which the browser
  treats as a refusal. See step 6 of
  [POWER-AUTOMATE-SETUP.md](POWER-AUTOMATE-SETUP.md). It can also mean the flow
  is turned off.
- **A 4xx or 5xx with a message** — the flow ran and failed. The message names
  the failing action.
- **"not built in, and nothing pasted here"** — the build you deployed does not
  carry that URL. Check you deployed the downloaded copy and not the old one.
- **Everything fine on your laptop, nothing on anyone else's** — your browser
  has URLs saved in it from before. Settings → A, clear the boxes, Save, then
  Connect. That shows you what everyone else sees.
