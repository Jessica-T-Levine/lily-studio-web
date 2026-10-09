/* The Lily Studio - small Tuesday Tips signup that sits at the top of the site footer.
   One file for every page: add <script src="/footer-signup.js" defer></script> and it appears.
   Skips pages that already have the big signup (#tuesday-tips). Sends to Kit, same form as the homepage. */
(function () {
  "use strict";
  var FORM_URL = "https://app.kit.com/forms/9972716/subscriptions";
  var TAG_ID = "24064865";

  function init() {
    var footer = document.querySelector("footer.site-footer");
    if (!footer || document.getElementById("tuesday-tips") || footer.querySelector(".fs-signup")) return;

    var css = document.createElement("style");
    css.textContent =
      ".fs-signup{max-width:520px;margin:0 auto 28px;padding:0 4px;text-align:center}" +
      ".fs-signup .fs-title{margin:0 0 6px;font:400 1.35rem/1.25 var(--font-serif,Georgia,serif);color:var(--cream,#FDFBF7)}" +
      ".fs-signup .fs-title em{color:#C277F5;font-style:italic}" +
      ".fs-signup .fs-sub{margin:0 0 14px;font:400 .85rem/1.5 var(--font-display,system-ui,sans-serif);color:var(--gray-light,#A8B2D1)}" +
      ".fs-signup form{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}" +
      ".fs-signup input[type=email]{flex:1 1 200px;max-width:280px;box-sizing:border-box;background:var(--navy-deep,#06122A);border:1px solid var(--gray-mid,#233554);border-radius:999px;padding:11px 16px;font:400 .9rem var(--font-display,system-ui,sans-serif);color:var(--cream,#FDFBF7);outline:none}" +
      ".fs-signup input[type=email]:focus{border-color:#7DD3FC;box-shadow:0 0 12px rgba(125,211,252,.35)}" +
      ".fs-signup button{background:#2563EB;color:#fff;border:0;border-radius:999px;padding:11px 20px;font:600 .88rem var(--font-display,system-ui,sans-serif);cursor:pointer;transition:background .2s}" +
      ".fs-signup button:hover{background:#1950CA}" +
      ".fs-signup button:focus-visible,.fs-signup input:focus-visible{outline:2px solid #F966BC;outline-offset:2px}" +
      ".fs-signup button:disabled{opacity:.6;cursor:wait}" +
      ".fs-signup .fs-hp{position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden}" +
      ".fs-signup .fs-status{min-height:1.3em;margin:10px 0 0;font:400 .82rem var(--font-display,system-ui,sans-serif);color:#A3D977}" +
      ".fs-signup .fs-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}" +
      "@media(max-width:600px){.fs-signup input[type=email]{font-size:16px;max-width:none}.fs-signup button{width:100%}}";
    document.head.appendChild(css);

    var box = document.createElement("div");
    box.className = "fs-signup";
    box.innerHTML =
      '<p class="fs-title">One tiny Claude tip, <em>every Tuesday.</em></p>' +
      '<p class="fs-sub">A 60-second tip and one great skill in your inbox. Unsubscribe anytime.</p>' +
      '<form action="' + FORM_URL + '" method="post">' +
      '<label class="fs-sr" for="fs-email">Email address</label>' +
      '<input id="fs-email" type="email" name="email_address" placeholder="you@example.com" autocomplete="email" required>' +
      '<input type="hidden" name="tags[]" value="' + TAG_ID + '">' +
      '<input class="fs-hp" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<button type="submit">Send me the tips</button>' +
      '</form>' +
      '<p class="fs-status" role="status" aria-live="polite"></p>';
    footer.insertBefore(box, footer.firstChild);

    var form = box.querySelector("form"), status = box.querySelector(".fs-status"), btn = box.querySelector("button");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.website.value) return;                       // bot trap
      var data = new FormData(form);
      data.delete("website");
      btn.disabled = true;
      status.textContent = "Adding you to the list…";
      fetch(FORM_URL, { method: "POST", headers: { Accept: "application/json" }, body: data })
        .then(function (res) { return res.json().then(function (j) { return { ok: res.ok, j: j }; }, function () { return { ok: res.ok, j: {} }; }); })
        .then(function (r) {
          if (r.ok && r.j.status === "success") {
            form.reset();
            status.textContent = "Almost done! Check your inbox and tap the button in our email to confirm. 💌";
          } else if (r.j.status === "quarantined" && r.j.url) {
            window.location.href = r.j.url;                 // Kit's quick "are you human?" check
          } else { throw new Error("no"); }
        })
        .catch(function () { form.website.disabled = true; form.submit(); })
        .then(function () { btn.disabled = false; });
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
