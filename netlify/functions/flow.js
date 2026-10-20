/* Forwards a call to one of the Power Automate flows, holding the trigger URLs
   here on the server so they never reach the browser.
   ==========================================================================

   A Power Automate trigger URL ends in a sig= value and that value IS the
   authentication: anyone holding the whole URL can run the flow. Until now each
   person pasted the URLs into their own browser, which kept them off the public
   page at the cost of setting every device up by hand. This function is the
   other way round — the URLs live in Netlify's environment variables, the
   browser only ever names which flow it wants, and the page publishes nothing.

   WHAT THIS DOES AND DOES NOT PROTECT. It protects the credentials: the URLs
   are never sent to a browser, so nobody can read one out of the page and use
   it elsewhere. It does NOT authenticate callers: this endpoint is as public as
   the site is, so anyone who finds the site can still cause a flow to run. That
   is a smaller exposure than publishing the URLs, not no exposure. Putting the
   site behind Netlify's visitor password or an identity provider is what closes
   it, and this function sits behind that too once it is there.

   The flow to call is named, never passed. A proxy that forwards to whatever
   URL the caller supplies is an open relay, which is worth more to an attacker
   than the flows are.

   Environment variables, set under Site configuration -> Environment variables:

       GET_PROJECT_URL            the project register for a state
       FILE_PDF_URL               files the finished PDF into SharePoint
       VARIATION_LOG_READ_URL     reads the variation log
       VARIATION_LOG_WRITE_URL    creates or updates a log row
       WRITE_PROFESSIONALLY_URL   optional; tidies the description
       OPEN_VARIATION_FILE_URL    optional; reads a saved variation file back

   Any that are missing simply report themselves as unconfigured, and the app
   falls back to the URL box in Settings for that one flow.
*/

const TARGETS = {
  projects: 'GET_PROJECT_URL',
  file: 'FILE_PDF_URL',
  logRead: 'VARIATION_LOG_READ_URL',
  logWrite: 'VARIATION_LOG_WRITE_URL',
  describe: 'WRITE_PROFESSIONALLY_URL',
  openFile: 'OPEN_VARIATION_FILE_URL'
};

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store'
};

function reply(statusCode, body) {
  return { statusCode: statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

// Belt and braces: no response this function sends may carry a trigger URL,
// whatever an upstream error decided to quote back at us.
function scrub(text) {
  let out = String(text == null ? '' : text);
  for (const name of Object.values(TARGETS)) {
    const url = process.env[name];
    if (url) out = out.split(url).join('[flow url removed]');
  }
  // and any stray signature, in case only part of a URL came back
  return out.replace(/([?&]sig=)[^&\s"']+/gi, '$1[removed]');
}

exports.handler = async function (event) {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: { Allow: 'GET, POST, OPTIONS' }, body: '' };
  }

  // A GET says which flows this deployment can actually serve, so the app can
  // decide what to ask for and Settings can say what is already handled.
  if (event.httpMethod === 'GET') {
    const configured = {};
    for (const [target, name] of Object.entries(TARGETS)) {
      configured[target] = !!(process.env[name] || '').trim();
    }
    return reply(200, { ok: true, configured: configured });
  }

  if (event.httpMethod !== 'POST') {
    return reply(405, { error: 'Use POST to call a flow, or GET to ask which are configured.' });
  }

  const target = ((event.queryStringParameters || {}).target || '').trim();
  if (!Object.prototype.hasOwnProperty.call(TARGETS, target)) {
    return reply(400, {
      error: 'Unknown flow "' + target + '".',
      known: Object.keys(TARGETS)
    });
  }

  const url = (process.env[TARGETS[target]] || '').trim();
  if (!url) {
    return reply(503, {
      error: 'The ' + TARGETS[target] + ' environment variable is not set on this site.',
      unconfigured: true
    });
  }

  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      // text/plain deliberately, matching what the browser used to send: the
      // flows parse their input with json(triggerBody()), which expects a
      // string. Sending application/json would hand them an object instead and
      // every flow would start failing.
      headers: { 'Content-Type': 'text/plain' },
      body: event.body || '{}'
    });
  } catch (e) {
    return reply(502, { error: 'Could not reach Power Automate: ' + scrub(e && e.message) });
  }

  const text = await response.text();
  return {
    statusCode: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
      'Cache-Control': 'no-store'
    },
    body: scrub(text)
  };
};
