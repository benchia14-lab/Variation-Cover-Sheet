(async function () {
  const btn = document.getElementById("signInBtn");
  const msg = document.getElementById("msg");

  document.getElementById("appTitle").textContent = APP_CONFIG.appName;
  document.title = "Sign in — " + APP_CONFIG.appName;

  // A sign-in that failed on redirect.html comes back here with the reason.
  const failed = sessionStorage.getItem("signInError");
  if (failed) {
    sessionStorage.removeItem("signInError");
    msg.textContent = failed;
  }

  // Already signed in with a live session: go straight to the app.
  if (await AxisAuth.validSession()) {
    location.replace("index.html");
    return;
  }
  btn.disabled = false;

  btn.addEventListener("click", async () => {
    msg.textContent = "";
    btn.disabled = true;
    btn.textContent = "Opening Microsoft sign-in…";
    try {
      await AxisAuth.signIn(); // leaves the page
    } catch (e) {
      msg.textContent = AxisAuth.explain(e);
      btn.disabled = false;
      btn.textContent = "Sign in with Microsoft";
    }
  });
})();
