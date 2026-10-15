# Keeping the flow URLs on the server

A Power Automate trigger URL ends in a `sig=` value, and that value **is** the
authentication. Anyone holding the whole URL can run the flow — read the project
register, write a file into SharePoint, add a row to the variation log.

Until now each person pasted the five URLs into their own browser. That kept
them off the public page, at the cost of setting up every person on every
device. This is the other way round: the URLs live in Netlify's environment
variables, a small function on the site calls the flows, and the browser only
ever names which flow it wants.

---

## What this does and does not protect

**It protects the URLs.** They are never sent to a browser. Nobody can read one
out of the page, out of developer tools, or out of someone's laptop, and nobody
can take one away and use it elsewhere.

**It does not authenticate callers.** The function is as public as the site is,
so anyone who finds the site can still cause a flow to run. That is a much
smaller exposure than publishing the URLs — they cannot be reused anywhere else,
and you can cut them off at Netlify in a second — but it is not nothing. What
closes it is putting the site itself behind Netlify's visitor password or an
identity provider; the function sits behind that too, once it is there.

**A flow is named, never passed.** The browser asks for `?target=projects`, not
for a URL. A proxy that forwards to whatever address the caller supplies is an
open relay, and worth more to an attacker than these flows are.

---

## The variables

Netlify → your site → **Site configuration → Environment variables**:

| Variable | Flow | What it does |
|---|---|---|
| `GET_PROJECT_URL` | Get projects | The project register for a state |
| `FILE_PDF_URL` | File the PDF | Files the finished PDF into SharePoint |
| `VARIATION_LOG_READ_URL` | Variation log — read | Reads the log |
| `VARIATION_LOG_WRITE_URL` | Variation log — write | Creates or updates a log row |
| `WRITE_PROFESSIONALLY_URL` | Write professionally | Optional; tidies the description |

Paste the whole trigger URL, `sig=` and all. Leave one blank and that flow falls
back to the URL box in Settings, which is useful while you move them across one
at a time.

Tick **Contains secret values** on each. It stops the value being shown back in
the dashboard and keeps it out of build logs.

---

## Deploying it

The function has to go up with the site, and a single bare `index.html` cannot
carry a folder beside it. So what you drag is now a folder, even for the
one-file build:

```
python3 tools/make-deploy-folder.py
```

That writes two folders — pick whichever shape you prefer:

```
build/single-file/
    index.html                     the whole app in one file
    netlify/functions/flow.js

build/variation-coversheet/
    index.html, assets/, vendor/   the app as separate files
    netlify/functions/flow.js
```

Netlify → your site → **Deploys** → drag the folder onto the drop zone.

### Checking it took

Open `https://your-site.netlify.app/.netlify/functions/flow` in a browser. You
should get something like:

```json
{"ok":true,"configured":{"projects":true,"file":true,"logRead":true,"logWrite":true,"describe":false}}
```

`true` means that variable is set and that flow will be called through the site.
A 404 instead means the function did not deploy — see below.

Then open the app and go to **Settings**. Flows the site is handling are marked
**served by the site** and say there is nothing to paste.

### If the function does not deploy

Nothing breaks. The app asks the site once on load, gets a 404, and falls back
to exactly how it worked before: each person pastes the URLs into Settings. You
have lost the feature, not the app.

If that happens, the function needs a deploy method that bundles it — linking
the repository to Netlify, or deploying with the Netlify CLI (`netlify deploy
--prod`) rather than the drop zone.

---

## What the app does with it

On load it asks the site which flows it can serve, once, and gives up after two
and a half seconds so a sick function cannot stop the app starting. Each flow
then goes one of two ways:

- the site serves it → the app calls `/.netlify/functions/flow?target=…`
- it does not → the app calls the URL pasted in Settings, as before

So the two can be mixed while you move across, and a half-finished migration is
a working app either way.

One side effect worth having: a call through the function is same-origin, so the
`Access-Control-Allow-Origin` header on that flow's Response action stops
mattering. Leave it in place — it is still needed for anyone on the pasted-URL
path, and it does no harm.

---

## Limits to know about

- **Payload.** Netlify functions take a request body of a few megabytes. The
  filed PDF goes through as base64 and a cover sheet is well under that, but a
  very long variation with many pages is worth testing once.
- **Time.** A function is cut off after about 10 seconds by default. If a flow
  is slow to answer, the app will report a timeout even though the flow may
  still complete. The log write already handles this: it falls back to sending
  blind and says so.
- **Changing a URL** no longer means telling everyone. Change the variable in
  Netlify and redeploy; every browser picks it up on the next load.
