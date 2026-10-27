// Runs on index.html: nothing of the app loads until a valid Axis sign-in is confirmed.
// (Axis Internal Tool Sign-In Standard - same pattern as the Invoice & Delivery Docket Matcher.)
//
// index.html holds only the page layout. The app's code and data (registers, rates, flow
// settings, PDF tools) are loaded by this file, in this order, only after Microsoft confirms the
// session.
//
// Keep this list in the same order the scripts used to be listed at the bottom of index.html.
// Any new script goes here, not in index.html. build-single-file.py and
// tools/make-deploy-folder.py read this list too, so the offline single-file copy still gets
// every script.
const APP_SCRIPTS = [
  'vendor/html2pdf.bundle.min.js',
  'vendor/pdf-lib.min.js',
  // pdf.js draws the review preview and the drawing thumbnails. The worker is loaded as a plain
  // script so it runs on the page itself: the single-file copy has no separate worker file to
  // start, and a preview is small work.
  'vendor/pdf.min.js',
  'vendor/pdf.worker.min.js',
  'assets/settings-password.js',
  'assets/settings-lock.js',
  'assets/logo.js',
  'assets/state-register.js',
  'assets/flow-config.js',
  'assets/flow-urls.js',
  'assets/build-info.js',
  'assets/flows.js',
  'assets/scope-library.js',
  'assets/schedule-of-rates.js',
  'vendor/xlsx.mini.min.js',
  'assets/agreed-rates.js',
  'assets/app.js',
  'assets/stages.js',
  'assets/variation-file.js',
  'assets/dashboard.js',
];

// app.js starts the app once the page has loaded. Loaded from here, the page loaded long ago,
// so it would start as soon as app.js ran -- before stages.js and the rest exist. This tells it
// to wait for the 'axis:app-loaded' event fired below instead.
window.AXIS_BOOT_PENDING = true;

(async function () {
  const gate = document.getElementById('authGate');

  function fail(title, detail) {
    if (gate) gate.innerHTML = '<h1>' + title + '</h1><p>' + detail + '</p>';
  }

  // Loads one classic script and waits for it, so each runs in order like plain <script> tags.
  function load(src) {
    return new Promise(function (ok, bad) {
      const s = document.createElement('script');
      s.src = src;
      s.async = false;
      s.onload = ok;
      s.onerror = function () { bad(new Error('Could not load ' + src)); };
      document.body.appendChild(s);
    });
  }

  // The one deviation from the standard (as before): a copy opened from the disk or served from
  // this machine skips sign-in so the app can be run and tested locally. The deployed site is
  // never on localhost, so nothing reachable from outside is exempted.
  const local = location.protocol === 'file:' ||
    ['localhost', '127.0.0.1', '[::1]', '0.0.0.0'].indexOf(location.hostname) !== -1;

  if (!local) {
    if (typeof AxisAuth === 'undefined') {
      fail('Sign-in cannot start',
        'msal-browser.min.js, app-config.js or auth.js did not load, so this page cannot check who you are. ' +
        'Tell whoever deployed the app - this is a missing file, not a problem with your account.');
      return;
    }
    const acc = await AxisAuth.validSession();
    if (!acc) {
      location.replace('login.html');
      return;
    }
    // The app fills "Entered by" on builder commentary from this.
    window.AXIS_USER = { name: acc.name || '', username: acc.username || '' };
    // Every banner (office picker, projects page, dashboard) has a name and a Sign out button.
    document.querySelectorAll('.auth-who').forEach(function (who) {
      who.textContent = acc.name || acc.username;
      who.hidden = false;
    });
    document.querySelectorAll('.auth-out').forEach(function (out) {
      out.hidden = false;
      out.addEventListener('click', function () { AxisAuth.signOut(); });
    });
  }

  try {
    for (const src of APP_SCRIPTS) await load(src);
    document.body.classList.remove('auth-pending');
    window.AXIS_BOOT_PENDING = false;
    window.dispatchEvent(new Event('axis:app-loaded'));
  } catch (e) {
    console.error(e);
    fail('The app did not start', String((e && e.message) || e).replace(/</g, '&lt;') +
      '. Check that the whole site was deployed, including the vendor and assets folders.');
  }
})();
