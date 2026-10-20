/* Standard Roofing Company analytics.
   Set GA_ID to the GA4 measurement ID (starts with G-) and every page starts reporting.
   Tracks page views plus three key events: phone_click, text_click, generate_lead. */
(function () {
  "use strict";
  var GA_ID = "";
  if (!GA_ID) return;

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag("js", new Date());
  gtag("config", GA_ID);

  var s = document.createElement("script");
  s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
  document.head.appendChild(s);

  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href.indexOf("tel:") === 0) gtag("event", "phone_click", { link_url: href, page_path: location.pathname });
    else if (href.indexOf("sms:") === 0) gtag("event", "text_click", { link_url: href, page_path: location.pathname });
  }, true);

  window.addEventListener("srclead", function (e) {
    var d = (e && e.detail) || {};
    gtag("event", "generate_lead", { form_id: d.form || "", method: d.method || "", page_path: location.pathname });
  });
})();
