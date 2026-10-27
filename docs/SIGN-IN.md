# Microsoft sign-in

The app follows the **Axis Internal Tool Sign-In Standard**, the same pattern
as the Invoice & Delivery Docket Matcher. **None of the app's code or data
loads until Microsoft confirms a valid Axis session.** Anyone else sees
"Checking sign-in…" and is sent to the sign-in page. Microsoft rejects
personal accounts and other companies' accounts before they reach the app.

---

## How it works

1. `index.html` holds only the page layout. At the end of `<body>` it loads
   four files: `msal-browser.min.js`, `app-config.js`, `auth.js` and
   `boot.js`. While `<body>` has the `auth-pending` class, `auth-gate.css`
   hides everything except the "Checking sign-in…" panel.
2. `boot.js` asks `AxisAuth.validSession()` whether Microsoft will still issue
   a token for an account in the Axis tenant. A cached account on its own is
   not enough: it has to be a live session.
3. **No session:** `boot.js` sends the browser to `login.html` and loads
   nothing else. **Session confirmed:** it loads the app's scripts (the list
   `APP_SCRIPTS` in `boot.js`, in order), fills in the signed-in name and
   shows **Sign out** in the banner, then shows the app.
4. `login.html` signs in with a full-page redirect to Microsoft. Microsoft
   sends the result to `redirect.html`, which checks the account is in the
   Axis tenant and opens the app (or returns to `login.html` saying why not).

The session is kept in **session storage**, so it ends when the browser closes
and people sign in once per browser session. That is intentional and the same
as the matcher.

**Any new script goes in `APP_SCRIPTS` in `boot.js`, not in `index.html`.**
`build-single-file.py` and `tools/make-deploy-folder.py` read the same list.

## The files

All of them sit in the site root, beside `index.html`, because the redirect
URI is `<origin>/redirect.html`.

| File | |
|---|---|
| `msal-browser.min.js` | Microsoft's library (@azure/msal-browser 2.38.3) |
| `app-config.js` | `appName: "Axis Variations"`, and the company-wide `clientId` and `tenantId` (public identifiers, not secrets) |
| `auth.js` | The standard's sign-in logic, unchanged: `AxisAuth.validSession()`, `signIn()`, `finishRedirect()`, `signOut()`, `explain()` |
| `login.html`, `login.js` | The sign-in page, with the Axis logo (`axis services group.jpg`) |
| `redirect.html`, `redirect.js` | Where Microsoft sends people back |
| `boot.js` | This app's gate, and the list of its scripts |
| `auth-gate.css` | Hides the app until `boot.js` has finished |
| `_headers` | The security headers, including the Content-Security-Policy |
| `_redirects` | 404s `netlify/functions/*`, which travels in the published folder |
| `robots.txt` | Keeps crawlers out (with `noindex` on every page as well) |

### One deviation, which the admin should know about

`boot.js` skips sign-in for a copy opened from the disk (`file:`) and for one
served from `localhost`, `127.0.0.1`, `[::1]` or `0.0.0.0`. The app had the
same exemption before. None of those is reachable from outside the machine it
runs on, and the deployed site is never on one, so nothing on the internet is
exempted. Without it, the app could not be run or tested locally, and the
offline single-file copy could not open at all.

### The offline copy has no sign-in

`build-single-file.py` (and `build/single-file/` from
`tools/make-deploy-folder.py`) makes one `index.html` with every script inlined
and the gate taken out, to open from the disk. **Never deploy it**: on a web
address it would open for anyone. The site is `build/variation-coversheet/`,
which is what Netlify publishes.

---

## The one admin step

In Entra, on the company app registration (client ID `7485bf02-…`), under
**Authentication → Single-page application**, add

```
https://<the site's address>/redirect.html
```

as a redirect URI, for **each** address the app runs on (the Netlify address,
and a custom domain if there is one). Until it is there, sign-in fails with
*"This site's address isn't registered for sign-in yet."*

The old sign-in sent people back to the site's root address. That entry can
stay, but `redirect.html` is now the one that matters.

## Testing it after a deploy

1. In a private window, open the site. You should see only "Checking
   sign-in…", then the sign-in page. Nothing of the app should show.
2. Sign in. The app opens, with your name and **Sign out** in the banner.
3. Use **Download PDF**, an Excel upload on the schedule of rates, and **Save
   to log**. If anything fails, press F12 and look at the Console: a request
   blocked by the security headers is named there. Add only that address to
   the matching line of `_headers`.
4. Open `/netlify/functions/flow.js` on the live site. It should be a 404.

## If sign-in does not work

- **"This site's address isn't registered for sign-in yet."** The admin step
  above has not been done for this address.
- **"That isn't an Axis account."** The person signed in with a personal or
  another company's account. They are signed out of this app and asked again.
- **"Sign-in cannot start"** in place of the app means `msal-browser.min.js`,
  `app-config.js` or `auth.js` did not load: a missing file in what was
  deployed, not an account problem. The page says so rather than bouncing
  between pages.
- **The sign-in page appears every time a new browser window is opened.** That
  is session storage doing its job.

---

## What it does and does not stop

**It stops people using the app.** Without a live Axis session, the app's
scripts and data are never even requested.

**It does not stop people downloading the files.** Netlify serves any file to
anyone who asks for its exact path; the gate runs in the browser. So the rule
is that **nothing sensitive goes in deployed files**. In this app that matters
for two things:

- **The flow URLs built into `assets/flow-config.js`.** A Power Automate
  trigger set to *Anyone* is authenticated by the `sig=` in its URL alone, so a
  built-in URL is a flow anyone holding the file can run. They were built in
  deliberately so nobody has to paste them. To close it, keep them on the server
  ([FLOW-URLS-ON-THE-SERVER.md](FLOW-URLS-ON-THE-SERVER.md)) **and** make the
  function check the caller (below), or move the flows to Microsoft Graph called
  as the signed-in user.
- **The master schedule of rates** (`assets/schedule-of-rates.js`) and the
  offices' letterhead details, which anyone with the path can read.

**The Netlify function does not check who is calling.** `/.netlify/functions/flow`
forwards to the flows without verifying the caller's Entra token, so the
browser sign-in does not protect it. Before relying on it, it needs to verify
an Entra access token: signature against the tenant's keys, issuer (tenant
`e52a9a87-…`), audience and expiry. That needs an API scope on the app
registration for the app to request a token for.

For a true server-side gate, host on Azure Static Web Apps with Entra
authentication (`"allowedRoles": ["authenticated"]` on `/*`), or put a Netlify
Edge Function in front that validates the token before serving anything.

## The icon

`favicon.ico` (16/32/48/64), `favicon-32.png` and `apple-touch-icon.png` are the
Axis mark, taken from the banner logo. The app also carries a small copy inline,
so the offline copy and a page opened off the disk keep the icon.
