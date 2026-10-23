/* Google Analytics 4. The measurement ID is injected at build time from the
   GA_MEASUREMENT_ID environment variable; this file is only included when it is set.
   Reports page views plus phone_click, text_click, cta_click, and generate_lead. */
(function () {
  "use strict";
  var GA_ID = "__GA_ID__";
  if (!GA_ID || GA_ID.indexOf("G-") !== 0) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID, { send_page_view: true });

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(s);

  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href.indexOf("tel:") === 0) gtag("event", "phone_click", { link_url: href, page_path: location.pathname, cta: a.getAttribute("data-cta") || "" });
    else if (href.indexOf("sms:") === 0) gtag("event", "text_click", { link_url: href, page_path: location.pathname });
  }, true);

  window.addEventListener("srccta", function (e) {
    var d = (e && e.detail) || {};
    gtag("event", "cta_click", { cta: d.cta || "", link_url: d.href || "", page_path: location.pathname });
  });
  window.addEventListener("srclead", function (e) {
    var d = (e && e.detail) || {};
    gtag("event", "generate_lead", { form_id: d.form || "", form_kind: d.kind || "", method: d.method || "", page_path: location.pathname });
  });
})();
