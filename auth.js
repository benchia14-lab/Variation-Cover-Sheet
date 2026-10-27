// Microsoft Entra ID sign-in, shared by login.html, redirect.html and index.html.
// Needs msal-browser.min.js and app-config.js loaded first.
//
// Sign-in uses a full-page redirect (not a popup). The site is "cross-origin isolated" (see _headers) so the docket
// reader can use several processor cores, and that isolation cuts a popup off from the page that opened it.
(function () {
  const cfg = window.APP_CONFIG;
  const SCOPES = ["User.Read"];

  const msalApp = new msal.PublicClientApplication({
    auth: {
      clientId: cfg.clientId,
      // Tenant-specific authority: only accounts in the Axis directory can sign in.
      authority: "https://login.microsoftonline.com/" + cfg.tenantId,
      // Microsoft sends the sign-in result here. This exact URL must be listed under the app registration's
      // "Single-page application" redirect URIs.
      redirectUri: location.origin + "/redirect.html",
      postLogoutRedirectUri: location.origin + "/login.html",
      navigateToLoginRequestUrl: false,
    },
    // sessionStorage: tokens are cleared when the browser closes and aren't shared across tabs.
    cache: { cacheLocation: "sessionStorage", storeAuthStateInCookie: false },
  });

  const ready = (async () => {
    if (typeof msalApp.initialize === "function") await msalApp.initialize();
    // Finishes a sign-in coming back from Microsoft, and clears a sign-in that was abandoned (e.g. the Back button),
    // which would otherwise block the next attempt. Harmless on pages with nothing to finish.
    return msalApp.handleRedirectPromise().catch((e) => { console.warn("Sign-in did not complete:", e); return { error: e }; });
  })();

  /** The signed-in account from the Axis tenant, if any. */
  function account() {
    return msalApp.getAllAccounts().find((a) => a.tenantId === cfg.tenantId) || null;
  }

  /**
   * Resolves to the account only if the Microsoft session is still valid (a token can be obtained),
   * not merely because an old account is sitting in the cache. Otherwise resolves to null.
   */
  async function validSession() {
    await ready;
    const acc = account();
    if (!acc) return null;
    try {
      await msalApp.acquireTokenSilent({ scopes: SCOPES, account: acc });
      return acc;
    } catch (e) {
      return null;
    }
  }

  /** Leaves the page for Microsoft's sign-in; the result comes back to redirect.html. */
  async function signIn() {
    await ready;
    await msalApp.loginRedirect({ scopes: SCOPES, prompt: "select_account" });
  }

  /** On redirect.html: finish the sign-in and say where to go next. */
  async function finishRedirect() {
    const res = await ready;
    if (res && res.error) return { ok: false, error: res.error };
    const acc = (res && res.account) || account();
    if (!acc) return { ok: false, error: { errorCode: "no_account" } };
    if (acc.tenantId !== cfg.tenantId) {
      await clearLocal();
      return { ok: false, error: { errorCode: "wrong_tenant" } };
    }
    msalApp.setActiveAccount(acc);
    return { ok: true };
  }

  /** Forgets the account in this browser only; the user stays signed in to Outlook, Teams, etc. */
  async function clearLocal() {
    await ready;
    await msalApp.logoutRedirect({ account: account() || undefined, onRedirectNavigate: () => false });
  }

  async function signOut() {
    await clearLocal();
    location.replace("login.html");
  }

  /** Plain-English message for a failed sign-in. */
  function explain(e) {
    const code = (e && (e.errorCode || e.message)) || String(e || "");
    if (code === "wrong_tenant") return "That isn't an Axis account. Sign in with your Axis Microsoft account.";
    if (/user_cancelled|access_denied/.test(code)) return "Sign-in was cancelled.";
    if (/AADSTS50105|not assigned/i.test(code)) return "Your account hasn't been given access to this app. Ask your administrator.";
    if (/AADSTS50011/.test(code)) return "This site's address isn't registered for sign-in yet. Ask your administrator.";
    if (code === "no_account") return "Sign-in didn't complete. Please try again.";
    return "Sign-in failed: " + ((e && e.message) || code);
  }

  window.AxisAuth = { validSession, signIn, finishRedirect, signOut, explain };
})();
