# Putting it live on Netlify, then wiring up Power Automate

Do these in order. The flows need the site's address before they can be built,
so deploying first is not just convenient — the CORS header in step 6 of the
flow guide is *the* thing that makes the projects dropdown work, and you cannot
write it until you know the URL.

```
1. Deploy the site          -> gives you https://something.netlify.app
2. Build the SharePoint list
3. Build flow 1 (projects), using that URL in the CORS header
4. Paste flow 1's URL into the app, and test it
5. Build flow 2 (filing), same CORS header
6. Issue a real variation and check it lands in SharePoint
```

---

## Before you start: what happens to the old site

The previous version of this app kept its register on the server, behind five
Netlify Functions — `/api/session`, `/api/variations`, `/api/history`,
`/api/logo` and `/api/describe` — with a shared team password in a
`TEAM_PASSWORD` environment variable.

**This version has none of that.** It is static files only. So if you deploy
over the same Netlify site:

- **Any variations saved in the old shared register become unreachable** from
  the app. They are not deleted — they are still in whatever store those
  functions wrote to — but nothing will read them any more. If there is history
  worth keeping, get it out *before* you deploy over the site.
- The `TEAM_PASSWORD` variable and the functions themselves stop being used.
  Leave them or remove them; they do no harm either way.
- Anyone with the old URL open will get the new app on their next reload, and
  will be asked to pick an office rather than sign in.

If that history matters, deploy to a **new** Netlify site instead and retire the
old one once you are happy. It costs nothing and keeps the old register readable.

---

## 1 · Deploy

**The repository is linked to Netlify.** Every push to `main` rebuilds and
redeploys the site. That has one consequence worth understanding before
anything else:

> **A folder dragged onto the drop zone lasts until the next push.** The push
> rebuilds from the repository and replaces it. If the site keeps "reverting",
> this is why.

### The URLs and the password come from the environment

They are not in the repository — a repository is the wrong place for a
credential, and this one was public until recently. The build reads them from
the site's own settings instead.

**Site configuration → Environment variables**, and set these seven:

| Variable | What goes in it |
|---|---|
| `GET_PROJECT_URL` | the Get projects trigger URL |
| `FILE_PDF_URL` | the File the PDF trigger URL |
| `VARIATION_LOG_READ_URL` | the Variation log read trigger URL |
| `VARIATION_LOG_WRITE_URL` | the Variation log write trigger URL |
| `WRITE_PROFESSIONALLY_URL` | the Write professionally trigger URL |
| `OPEN_VARIATION_FILE_URL` | the Open a variation file trigger URL (optional — see VARIATION-FILES.md) |
| `GET_AGREED_RATES_URL` | the Get agreed rates trigger URL (optional — see AGREED-RATES.md) |
| `SETTINGS_PASSWORD_SALT` | the `salt` from your `settings-password.js` |
| `SETTINGS_PASSWORD_HASH` | the `hash` from the same file |

Tick **Contains secret values** on all seven. Then **Deploys → Trigger deploy →
Clear cache and deploy site**.

The build refuses to ship a URL that is not `https://` or that contains a quote
or a line break, rather than writing something broken into the page. A missing
variable is not an error — that flow is simply absent, and the build stamp on
the Settings screen says how many of the five made it in.

### Checking it worked

Open the site in a private window and go to **Settings**. The line at the top
reads either *"All 5 Power Automate flows are built into this copy"* with the
build time, or how many are missing. If it says 0, the variables are not set on
the site or the deploy ran before they were.

### Deploying by hand instead

Still possible, and still what `tools/make-deploy-folder.py` builds — but
remember the next push overwrites it. Use it for testing a build locally, not
for putting one live.

### The folder to drag

`build/variation-coversheet/` holds the site and nothing else: the guides, the
fill-in workbooks and the tools stay out of it, because everything you drag
ends up at a public web address. It carries the Microsoft sign-in files, the
security headers (`_headers`), `_redirects`, `robots.txt` and
`netlify/functions/flow.js`. Drag that **folder** onto the drop zone. For a new
site: **Sites → Add new site → Deploy manually**.

`build/single-file/` is an **offline copy**: the whole app in one `index.html`
with no sign-in, to open from the disk. **Never deploy it** — on a web address
it would open for anyone. See [SIGN-IN.md](SIGN-IN.md).

Two things to watch:

- Drag the folder, not its contents, and not the repository root — Netlify
  publishes what you drop, and `netlify.toml` is not consulted for a manual
  deploy at all.
- There is no Git history behind a manual deploy, so **every change means
  dragging again**. Nothing you change in the repository reaches the site on
  its own.
- Keep one folder on your machine as the real one, and make changes there. Two
  half-updated copies is the way this goes wrong.

The builder also writes a zip of the folder, for sending to someone else to
deploy. It refuses to build if anything `index.html` loads is missing, so a
broken folder is caught before it is live rather than after.

Changes that need a re-drag: the office register, the Settings password, and any
change to the app itself. The flow URLs are not among them — those are typed
into each person's browser and are not in the deployed files at all.

The Settings password is the one change you can make without rebuilding
anything: the app itself hands you the replacement to drag, in the shape your
deployment needs. See [SETTINGS-PASSWORD.md](SETTINGS-PASSWORD.md).

### From Git

Not used here, and noted only so the option is on record: Netlify → your site →
**Site configuration → Build & deploy → Continuous deployment → Link to a
repository**, branch `main`. Leave the build command and publish directory
empty — `netlify.toml` already sets them, and it is written so that linking the
repository publishes the same built folder rather than the repository root.
Every push would then redeploy and there would be no dragging. Worth revisiting
only if more than one person ever changes the office register.

### Check it worked

Open the site. You should get the eight office tiles. Then:

- Click an office — the letterhead fills in with that entity's details and logo
- The project dropdown says **"No projects flow configured"** — correct, you
  have not built it yet
- Fill the recipient fields by hand and click **Download PDF** — a PDF should
  download

If all three work, the site is fine and everything left is Power Automate.

---

## 2 · The SharePoint list

[SHAREPOINT-REGISTERS.md](SHAREPOINT-REGISTERS.md) — upload
`registers/Variation Project Register.xlsx` via **New → List → From Excel**,
then fix the three column types.

Get this done before the flows. A flow is much easier to build against a list
that already has rows in it, because every action shows you real data as you go.

---

## 3-5 · The flows

[POWER-AUTOMATE-SETUP.md](POWER-AUTOMATE-SETUP.md), start to finish.

The one thing to carry over from this page: wherever that guide says
`https://your-app-url`, use the origin Netlify just gave you —

```
https://your-site-name.netlify.app
```

Scheme and host, **no trailing slash**, no path. If you later put a custom
domain on the site, that origin changes and the header has to change with it,
or the projects dropdown stops loading with what looks like a network error.

---

## 6 · Connect the app

In the deployed site: **Settings** (bottom right of the office picker) → paste
the two flow URLs → **Save endpoints** → **Test projects flow**.

It should report how many projects came back and name the first one.

Then issue one real variation end to end and confirm the PDF appears in the
right SharePoint folder. The line under the **Download PDF** button tells you
what happened — it distinguishes "filed, here is the path" from "sent, but I
could not read the reply", and those mean different things.

**Each person pastes those URLs once, on each device they use.** They are stored
in that browser, against that site's address. This is deliberate: a Power
Automate trigger URL is a credential, and baking it into a page anyone can view
the source of would hand it to anyone who opens the site.

---

## If you put a custom domain on it later

Three things move:

1. **`Access-Control-Allow-Origin`** in both flows' Response actions → the new
   origin. Miss this and the projects dropdown stops loading.
2. **Everyone re-pastes their flow URLs.** Browser storage is per origin, so the
   settings saved against `*.netlify.app` do not follow the site to its new
   address. Nothing is lost; it just has to be entered again.
3. Netlify keeps serving the old `.netlify.app` address too. Point people at the
   new one, or they will keep hitting the origin the flows no longer allow.

---

## Optional: lock down what the page may talk to

Once the flows work, you can add a Content Security Policy that limits the page
to exactly the hosts it needs. On a manual deploy this goes in a file called
`_headers` in the folder you drag; if the repository is ever linked, it goes in
`netlify.toml` as another `[[headers]]` block:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src https://*.logic.azure.com; frame-ancestors 'none'"
```

That says: run only our own code, load fonts only from Google, images only from
this site or inline data, and **talk to nothing on the network except Power
Automate**.

Add it *after* everything works, not before, and check the projects dropdown
immediately afterwards. If your flows are on a host that is not
`*.logic.azure.com`, `connect-src` has to name it or every call fails — and a
CSP failure looks exactly like the missing-CORS-header failure, which will send
you hunting in the wrong place.
