/* Standard Roofing Company site script */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  // ---- Settings ----
  // Where form requests go. Forms post as JSON to FORM_ENDPOINT (FormSubmit, which
  // emails each request to LEAD_EMAIL). If the endpoint is unreachable, the visitor's
  // email app opens with the request filled in, addressed to LEAD_EMAIL.
  var CONFIG = {
    FORM_ENDPOINT: "https://formsubmit.co/ajax/info@standardroofingcompany.net",
    LEAD_EMAIL: "info@standardroofingcompany.net",
    SMS_NUMBER: "+19704305884",
    PHONE_DISPLAY: "(970) 430-5884"
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
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  // Footer year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // Scroll reveal
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  // Forms
  function labelFor(form, name) {
    var input = form.querySelector('[name="' + name + '"]');
    if (input && input.id) {
      var l = form.querySelector('label[for="' + input.id + '"]');
      if (l) return l.textContent.trim();
    }
    return name.replace(/_/g, " ");
  }

  document.querySelectorAll("form[id$='-form']").forEach(function (form) {
    var status = form.querySelector(".form-status");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (form.company_website && form.company_website.value) return; // bot trap

      var missing = [];
      form.querySelectorAll("[required]").forEach(function (f) {
        if (!f.value.trim()) missing.push(f);
      });
      if (missing.length) {
        missing[0].focus();
        status.textContent = "Please fill in: " + missing.map(function (f) { return labelFor(form, f.name); }).join(", ") + ".";
        status.style.color = "#a4452c";
        status.classList.add("show");
        return;
      }

      var data = {};
      new FormData(form).forEach(function (v, k) {
        if (k === "company_website") return;
        data[k] = data[k] ? data[k] + ", " + v : v;
      });
      data.page = location.pathname;
      var subject = (form.getAttribute("data-subject") || "Roof Inspection Request") + " | " + (data.name || "");

      function lead(method) {
        try { window.dispatchEvent(new CustomEvent("srclead", { detail: { form: form.id, method: method } })); } catch (err) {}
      }

      function done(msg) {
        status.textContent = msg;
        status.style.color = "";
        status.classList.add("show");
      }

      var body = Object.keys(data).map(function (k) {
        return labelFor(form, k) + ": " + data[k];
      }).join("\n");

      function fallback() {
        if (CONFIG.LEAD_EMAIL) {
          lead("email");
          window.location.href = "mailto:" + CONFIG.LEAD_EMAIL +
            "?subject=" + encodeURIComponent(subject) +
            "&body=" + encodeURIComponent(body);
          done("Your email app should open with your request filled in. Just hit send. Or call or text " + CONFIG.PHONE_DISPLAY + ".");
        } else {
          lead("sms");
          window.location.href = "sms:" + CONFIG.SMS_NUMBER + "?&body=" + encodeURIComponent(subject + "\n" + body);
          done("Your messages app should open with your request filled in. Just hit send. If nothing opened, call or text " + CONFIG.PHONE_DISPLAY + ".");
        }
      }

      if (CONFIG.FORM_ENDPOINT) {
        var btn = form.querySelector('[type="submit"]');
        if (btn) btn.disabled = true;
        done("Sending...");
        var payload = Object.assign({ _subject: subject, _template: "table", _captcha: "false" }, data);
        if (data.email) payload._replyto = data.email;
        fetch(CONFIG.FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(payload)
        }).then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) {
            if (!r.ok || String(j.success) === "false") throw new Error("not delivered");
          });
        }).then(function () {
          form.reset();
          lead("endpoint");
          done("Thank you. We received your request and will reach out within one business day.");
        }).catch(function () {
          fallback();
        }).then(function () {
          if (btn) btn.disabled = false;
        });
        return;
      }

      fallback();
    });
  });
})();
