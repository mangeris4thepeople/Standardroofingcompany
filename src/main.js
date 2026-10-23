/* Standard Roofing Company site script: menu, reveal, sticky CTA, lead forms */
(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");

  var CONFIG = {
    LEAD_ENDPOINT: "/api/lead",
    SMS_NUMBER: "__SMS_NUMBER__",
    PHONE_DISPLAY: "__PHONE_DISPLAY__",
    MAX_PHOTOS: 4,
    MAX_EDGE: 1400,
    JPEG_QUALITY: 0.78
  };

  // Mobile menu
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); toggle.focus(); }
    });
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  // Scroll reveal
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // Sticky desktop CTA appears after the first screen
  var sticky = document.querySelector(".sticky-cta");
  if (sticky) {
    var onScroll = function () { sticky.classList.toggle("show", window.scrollY > 420); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // Analytics hook for CTA clicks
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a[data-cta]") : null;
    if (a) try { window.dispatchEvent(new CustomEvent("srccta", { detail: { cta: a.getAttribute("data-cta"), href: a.getAttribute("href") } })); } catch (err) {}
  }, true);

  // ---- Lead forms ----
  function readImage(file) {
    return new Promise(function (resolve) {
      if (!file || file.size === 0) return resolve(null);
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var scale = Math.min(1, CONFIG.MAX_EDGE / Math.max(img.width, img.height));
        var w = Math.round(img.width * scale), h = Math.round(img.height * scale);
        var c = document.createElement("canvas"); c.width = w; c.height = h;
        c.getContext("2d").drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve({ name: file.name, type: "image/jpeg", data: c.toDataURL("image/jpeg", CONFIG.JPEG_QUALITY).split(",")[1] });
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  document.querySelectorAll("form[data-kind]").forEach(function (form) {
    var status = form.querySelector(".form-status");
    var started = form.querySelector('[name="started"]');
    if (started) started.value = String(Date.now());
    var btn = form.querySelector('[type="submit"]');

    function show(msg, err) { status.textContent = msg; status.classList.add("show"); status.classList.toggle("err", !!err); }
    function lead(method) { try { window.dispatchEvent(new CustomEvent("srclead", { detail: { form: form.id, kind: form.getAttribute("data-kind"), method: method } })); } catch (err) {} }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.company_website && form.company_website.value) return;
      var missing = [];
      form.querySelectorAll("[required]").forEach(function (f) { if (!f.value.trim()) missing.push(f); });
      if (missing.length) { missing[0].focus(); show("Please fill in your name and phone number.", true); return; }
      var phone = form.phone ? form.phone.value.replace(/\D/g, "") : "";
      if (form.phone && phone.length < 10) { form.phone.focus(); show("Please enter a 10 digit phone number.", true); return; }

      var data = {};
      new FormData(form).forEach(function (v, k) { if (k === "photos" || k === "company_website") return; data[k] = typeof v === "string" ? v : ""; });
      data.page = location.pathname;
      data.referrer = document.referrer || "";

      if (btn) btn.disabled = true;
      show("Sending...");
      var files = form.photos && form.photos.files ? Array.prototype.slice.call(form.photos.files, 0, CONFIG.MAX_PHOTOS) : [];
      Promise.all(files.map(readImage)).then(function (photos) {
        data.photos = photos.filter(Boolean);
        return fetch(CONFIG.LEAD_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) });
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || !j.ok) throw new Error(j.error || "not delivered");
          if (!j.emailed && j.relay) {
            var payload = Object.assign({ _subject: j.subject || "Roof Inspection Request", _template: "table", _captcha: "false" }, j.fields || {});
            if (j.photos && j.photos.length) payload.Photos = j.photos.join("  ");
            if (j.id) payload["Lead ID"] = String(j.id);
            if (data.email) payload._replyto = data.email;
            return fetch(j.relay, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(payload) }).catch(function () {}).then(function () { return j; });
          }
          return j;
        }).then(function () {
          form.reset();
          if (started) started.value = String(Date.now());
          lead("endpoint");
          show("Thank you. We received your request and will reach out within one business day.");
        });
      }).catch(function (err) {
        var body = Object.keys(data).filter(function (k) { return data[k] && k !== "photos" && k !== "started" && k !== "referrer"; }).map(function (k) { return k.replace(/_/g, " ") + ": " + data[k]; }).join("\n");
        lead("sms");
        show((err && err.message && err.message !== "not delivered" ? err.message + " " : "") + "We could not send that just now. Your messages app should open with the request filled in; if not, call or text " + CONFIG.PHONE_DISPLAY + ".", true);
        window.location.href = "sms:" + CONFIG.SMS_NUMBER + "?&body=" + encodeURIComponent("Roof inspection request\n" + body);
      }).then(function () { if (btn) btn.disabled = false; });
    });
  });
})();
