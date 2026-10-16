# Microsoft sign-in

The app follows the **Internal Tool Sign-In Standard**. Anyone opening the site
who is not signed in with an Axis Microsoft account is sent to a sign-in screen
first, and Microsoft rejects personal accounts and other companies' accounts
before they ever reach the app.

---

## What it does and does not stop

Read this before relying on it to protect anything embedded in the page.

**It stops people using the app.** Open the site without signing in and you get
the sign-in card, not the generator. That is real and it is what the standard is
for.

**It does not stop people downloading the page.** The check is JavaScript
running in the visitor's browser. The server still hands `index.html` to
anyone who asks for it — `curl https://your-site.netlify.app/index.html` returns
the whole file, sign-in or no sign-in. Whatever is inside that file is readable
by anyone who knows the address.

That matters for exactly one thing: **the flow URLs, if you build them into the
app** ([FLOW-URLS-BUILT-IN.md](FLOW-URLS-BUILT-IN.md)). A trigger URL's `sig=`
value is the whole authentication, so a built-in URL in a page anyone can fetch
is a flow anyone can run. The sign-in screen does not change that.

If that combination is not acceptable, pick one:

| Option | What it does |
|---|---|
| **Netlify visitor password** (*Site configuration → Access & security*) | Netlify refuses to serve the file at all without the password. Server-side, so `curl` gets nothing. Paid plan. |
| **Keep the URLs off the page** ([FLOW-URLS-ON-THE-SERVER.md](FLOW-URLS-ON-THE-SERVER.md)) | The function holds them; the page never contains one, so fetching it gains nothing. |
| **Accept it** | The site address is not published and the flows are low value. A deliberate choice, not an oversight — but write down that you made it. |

The first and second can both be used with the sign-in; they are not
alternatives to it.

---

## The files

Four come from the admin's package and are **never edited**:

```
login.html                the sign-in screen
msal-browser.min.js       Microsoft's library (@azure/msal-browser 2.38.3)
axis services group.jpg   the logo on the sign-in card
app-config.js             one line: the app's name
```

`app-config.js` here reads:

```js
const APP_NAME = "Variation Cover Sheet";
```

And `index.html` carries the standard's snippet at the very top of `<body>`,
with the company `clientId` and `authority` exactly as issued.

`tools/make-deploy-folder.py` copies all four into every build and refuses to
build a folder that is missing any of them — a site that redirects to a
`/login.html` which is not there is worse than one with no sign-in at all.

### One deviation, which the admin should know about

The snippet skips the check in two cases: a copy opened from the disk
(`file://`), and a copy served from `localhost` or `127.0.0.1`.

Neither is reachable from outside the machine it runs on, and the deployed site
is never on either, so nothing exposed to the internet is exempted. Without it,
the app cannot be run or tested locally at all, and the standalone offline copy
would redirect to a page that does not exist. Everything else in the snippet —
`clientId`, `authority`, `redirectUri`, the redirect target — is exactly as the
standard specifies.

---

## Deploying it

1. `python3 tools/make-deploy-folder.py`
2. Drag `build/single-file/` (or `build/variation-coversheet/`) onto Netlify →
   your site → **Deploys**
3. **Send the admin the live URL.** Until they add it to the approved list in
   Entra ID, sign-in will fail for everyone — this is the step that switches the
   protection on, and it is not something the app can do for itself.
4. Test in a private window: you should get the sign-in card, not the app.

## The icon

`favicon.ico` (16/32/48/64) and `apple-touch-icon.png` are the Axis mark, taken
from the banner logo. The app also carries a small copy inline, so the
standalone file and a page opened off the disk keep the icon with nothing beside
them.

## If sign-in does not work

Per the standard, the usual cause is the URL not yet being added in Entra. Two
things this app adds:

- **"Sign-in cannot start"** on a blank page means `msal-browser.min.js` did not
  load — a missing file in what was deployed, not an account problem. The app
  says so rather than bouncing between pages forever.
- The sign-in card appearing on **every** load, even after signing in, usually
  means the browser is blocking local storage for the site, which is where MSAL
  keeps the session.
