/* ============================================================================
   FLOW URLS BUILT INTO THE APP
   ============================================================================

   Reads the five Power Automate trigger URLs that assets/flow-config.js carries,
   so everyone who opens the deployed app can use it without pasting anything.

   READ THIS BEFORE SETTING THEM. A trigger URL ends in a sig= value and that
   value IS the authentication: anyone holding the whole URL can run the flow —
   read the project register, write a file into SharePoint, add a row to the
   variation log. Building them in publishes them to everyone who can open the
   site, because the page source is readable by whoever is served it.

   That is only sound when the site itself is not public. Put it behind Microsoft
   sign-in (Netlify Identity with Entra ID, or equivalent) so that being served
   the page already means being in the organisation. Without that in front, a
   file with real URLs in it should not be deployed.

   Left blank nothing is published: the app falls back to the server-side
   function if the site has one, and to the URL boxes in Settings otherwise.
   That is how it ships, and the copy in the repository must stay that way --
   the repository is public, and git keeps what is pushed to it even after the
   file is changed back.

   THE URLS ARE NOT IN THIS FILE. They sit on their own in
   assets/flow-config.js, which is the single file that gets replaced to change
   them. This file never changes, so there is nothing here to keep in step.

   TO SET THEM:  in the app, Settings -> C -> Build the URLs in
                 or with Node, node tools/set-flow-urls.js

   Full detail: docs/FLOW-URLS-BUILT-IN.md
============================================================================ */

const FlowUrls = (() => {
  const KEYS = ['projectsUrl', 'fileUrl', 'logReadUrl', 'logWriteUrl', 'describeUrl', 'openFileUrl'];

  // flow-config.js declares FLOW_URLS. If it is missing — a half-copied folder
  // — the app must still run, unconfigured, rather than dying on load.
  const BUILT = (typeof FLOW_URLS !== 'undefined' && FLOW_URLS) ? FLOW_URLS : {};

  // Anything here ends up inside a single-quoted JavaScript string in a file
  // that gets deployed. A quote or a newline in one would end the string early
  // and break the whole app, so a URL that cannot be written safely is refused
  // rather than written.
  function clean(value){
    const text = String(value == null ? '' : value).trim();
    if(!text) return '';
    if(/['"\\\r\n<>]/.test(text)){
      throw new Error('That does not look like a URL — it has quotes, a line break or a tag in it.');
    }
    if(!/^https:\/\//i.test(text)){
      throw new Error('A flow URL has to start with https:// — got "' + text.slice(0, 24) + '…"');
    }
    return text;
  }

  function get(key){
    try { return clean(BUILT[key]); } catch(e){ return ''; }
  }

  function any(){
    return KEYS.some(k => !!get(k));
  }

  // The replacement file, and the only definition of what it looks like, so the
  // in-app button and the Node tool cannot drift apart.
  function fileSource(urls){
    const lines = KEYS.map((k, i) =>
      "  " + k + ": '" + clean(urls[k]) + "'" + (i < KEYS.length - 1 ? ',' : ''));
    return [
      '/* Generated. The Power Automate trigger URLs for this deployment.',
      ' *',
      ' * These are credentials: anyone holding one can run that flow. They are in',
      ' * here so nobody has to paste them, which is only sound while the site is',
      ' * behind a sign-in. Do not commit a filled-in copy to a public repository.',
      ' *',
      ' * Blank means not built in — the app falls back to the server-side function,',
      ' * then to the URL boxes in Settings. See docs/FLOW-URLS-BUILT-IN.md.',
      ' */',
      'const FLOW_URLS = {'
    ].concat(lines).concat(['};', '']).join('\n');
  }

  return { KEYS, get, any, clean, fileSource };
})();
