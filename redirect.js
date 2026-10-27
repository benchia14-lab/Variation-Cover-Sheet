// redirect.html: finish the Microsoft sign-in, then open the app (or go back to the sign-in page with the reason).
(async function () {
  const r = await AxisAuth.finishRedirect();
  if (r.ok) {
    location.replace("index.html");
    return;
  }
  try { sessionStorage.setItem("signInError", AxisAuth.explain(r.error)); } catch (e) { /* private mode */ }
  location.replace("login.html");
})();
