/* FPH Ice Plant — site interactions */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.remove("no-js");

  /* Live site: show clean URLs (fphiceplant.com/about instead of /about.html or /index.html) */
  if (/(^|\.)fphiceplant\.com$/.test(location.hostname) && /(\/index)?\.html$/.test(location.pathname)) {
    var cleanPath = location.pathname.replace(/\/index\.html$/, "/").replace(/\.html$/, "");
    history.replaceState(null, "", cleanPath + location.search + location.hash);
  }
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header state on scroll + back-to-top */
  var header = document.querySelector(".site-header");
  var toTop = document.querySelector(".to-top");
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 40);
    if (toTop) toTop.classList.toggle("show", y > 700);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }); });

  /* Mobile nav */
  var toggle = document.querySelector(".menu-toggle");
  var backdrop = document.querySelector(".nav-backdrop");
  function closeNav() { document.body.classList.remove("nav-open"); if (toggle) toggle.setAttribute("aria-expanded", "false"); }
  if (toggle) toggle.addEventListener("click", function () {
    var open = document.body.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  if (backdrop) backdrop.addEventListener("click", closeNav);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeNav(); closeLightbox(); } });

  /* Dropdowns (click for touch / keyboard) */
  document.querySelectorAll(".has-drop > .nav-drop").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.preventDefault();
      var li = btn.parentElement;
      var open = !li.classList.contains("open");
      document.querySelectorAll(".has-drop.open").forEach(function (o) { o.classList.remove("open"); o.firstElementChild.setAttribute("aria-expanded", "false"); });
      li.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".has-drop")) document.querySelectorAll(".has-drop.open").forEach(function (o) { o.classList.remove("open"); });
  });

  /* Reveal on scroll + counters + metric bars */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var decimals = (el.getAttribute("data-count").split(".")[1] || "").length;
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var fmt = function (v) { return prefix + v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix; };
    if (reduceMotion) { el.textContent = fmt(target); return; }
    var start = null, dur = 1800;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var revealEls = document.querySelectorAll(".reveal, [data-count], .metric");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.classList.add("in");
        if (el.hasAttribute("data-count")) animateCount(el);
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* Frost particle canvas (hero) */
  var canvas = document.getElementById("frost-canvas");
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var W, H, flakes = [], dpr = Math.min(window.devicePixelRatio || 1, 2);
    function resize() {
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(Math.min(W, 1600) / 14);
      flakes = [];
      for (var i = 0; i < n; i++) flakes.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.8 + 0.4, s: Math.random() * 0.4 + 0.1, d: Math.random() * Math.PI * 2, o: Math.random() * 0.6 + 0.2 });
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.y += f.s; f.d += 0.01; f.x += Math.sin(f.d) * 0.25;
        if (f.y > H + 5) { f.y = -5; f.x = Math.random() * W; }
        ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(239,219,170," + f.o + ")"; ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }
    var raf;
    resize(); draw();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () { if (document.hidden) cancelAnimationFrame(raf); else draw(); });
  }

  /* Tabs */
  document.querySelectorAll("[data-tabs]").forEach(function (wrap) {
    var tabs = wrap.querySelectorAll(".tab");
    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.setAttribute("aria-selected", "false"); });
        tab.setAttribute("aria-selected", "true");
        wrap.querySelectorAll(".tab-panel").forEach(function (p) { p.classList.toggle("active", p.id === tab.getAttribute("aria-controls")); });
      });
    });
  });

  /* FAQ accordion */
  document.querySelectorAll(".faq-q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.parentElement;
      var open = item.classList.toggle("open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* Product size selector */
  document.querySelectorAll("[data-sizes]").forEach(function (wrap) {
    var pills = wrap.querySelectorAll(".size-pill");
    var out = wrap.querySelector("[data-size-out]");
    pills.forEach(function (p) {
      p.addEventListener("click", function () {
        pills.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        p.setAttribute("aria-pressed", "true");
        if (out) {
          out.querySelector("[data-f=name]").textContent = p.getAttribute("data-name");
          out.querySelector("[data-f=use]").textContent = p.getAttribute("data-use");
          out.querySelector("[data-f=pack]").textContent = p.getAttribute("data-pack");
        }
        var sig = document.querySelector(".prod-img.signature img");
        var src = p.getAttribute("data-img");
        if (sig) {
          sig.parentElement.classList.toggle("no-photo", !src);
          if (src) { sig.src = src; sig.alt = "FPH Ice Plant purified tube ice, " + p.getAttribute("data-name") + " bag"; }
        }
      });
    });
  });

  /* Gallery filter + lightbox */
  var gallery = document.querySelector(".gallery");
  var lb = document.querySelector(".lightbox");
  var lbIndex = 0, visibleItems = [];
  function refreshVisible() { visibleItems = gallery ? Array.prototype.filter.call(gallery.querySelectorAll(".g-item"), function (i) { return !i.classList.contains("hide"); }) : []; }
  document.querySelectorAll(".filter-btn").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.querySelectorAll(".filter-btn").forEach(function (b) { b.classList.remove("active"); b.setAttribute("aria-pressed", "false"); });
      btn.classList.add("active"); btn.setAttribute("aria-pressed", "true");
      var f = btn.getAttribute("data-filter");
      gallery.querySelectorAll(".g-item").forEach(function (it) { it.classList.toggle("hide", f !== "all" && it.getAttribute("data-cat") !== f); });
      var count = document.querySelector("[data-gallery-count]");
      refreshVisible();
      if (count) count.textContent = visibleItems.length;
    });
  });
  function showLb(i) {
    if (!lb || !visibleItems.length) return;
    lbIndex = (i + visibleItems.length) % visibleItems.length;
    var it = visibleItems[lbIndex];
    lb.querySelector(".ph-label").textContent = it.getAttribute("data-title");
    lb.querySelector(".lb-cap").textContent = it.getAttribute("data-cat").toUpperCase() + " · " + (lbIndex + 1) + " / " + visibleItems.length;
    lb.classList.add("open");
    lb.querySelector(".lb-close").focus();
  }
  function closeLightbox() { if (lb) lb.classList.remove("open"); }
  if (gallery) {
    refreshVisible();
    gallery.querySelectorAll(".g-item").forEach(function (it) {
      it.addEventListener("click", function () { refreshVisible(); showLb(visibleItems.indexOf(it)); });
    });
  }
  if (lb) {
    lb.querySelector(".lb-close").addEventListener("click", closeLightbox);
    lb.querySelector(".lb-prev").addEventListener("click", function () { showLb(lbIndex - 1); });
    lb.querySelector(".lb-next").addEventListener("click", function () { showLb(lbIndex + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "ArrowRight") showLb(lbIndex + 1);
      if (e.key === "ArrowLeft") showLb(lbIndex - 1);
    });
  }

  /* Pre-select form fields from URL (?interest=gold) */
  var params = new URLSearchParams(window.location.search);
  ["interest", "tier", "size"].forEach(function (k) {
    var v = params.get(k);
    if (!v) return;
    document.querySelectorAll("[name='" + k + "']").forEach(function (el) {
      if (el.type === "radio") { if (el.value === v) el.checked = true; }
      else if (el.tagName === "SELECT") { el.value = v; }
    });
  });

  /* Email delivery: every website form is sent to the FPH inbox via FormSubmit */
  var LEAD_EMAIL = "aronlopezilao@fourthpacificholdings.com";
  function sendEmail(subject, data) {
    var payload = { _subject: subject + " — fphiceplant.com", _template: "table", _captcha: "false", Page: location.href };
    Object.keys(data).forEach(function (k) { if (data[k]) payload[k] = data[k]; });
    if (data.Email) payload._replyto = data.Email;
    return fetch("https://formsubmit.co/ajax/" + LEAD_EMAIL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || String(j.success) === "false") throw new Error(j.message || "send failed"); return j; }); });
  }
  function formData(form) {
    var out = {};
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      if (!el.name || el.type === "checkbox" || el.type === "submit") return;
      if (el.type === "radio" && !el.checked) return;
      if (el.tagName === "SELECT" && el.value === "") return;
      var label = el.getAttribute("data-label");
      if (!label) {
        var lab = el.id && form.querySelector("label[for='" + el.id + "']");
        label = lab ? lab.textContent.replace(/\*/g, "").trim() : el.name.charAt(0).toUpperCase() + el.name.slice(1);
      }
      var v = el.tagName === "SELECT" ? (el.options[el.selectedIndex] || {}).text || el.value : el.value;
      if (el.type === "radio") { var s = el.closest("label"); v = s ? s.querySelector("span").firstChild.textContent.trim() : el.value; }
      if (el.type === "email") label = "Email";
      out[label] = (v || "").trim();
    });
    return out;
  }
  function setBusy(btn, busy, text) {
    if (!btn) return;
    if (busy) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); btn._html = btn.innerHTML; btn.textContent = text || "Sending…"; }
    else { btn.disabled = false; btn.removeAttribute("aria-busy"); if (btn._html) btn.innerHTML = btn._html; }
  }
  function sendFailed(form) {
    var box = form.querySelector(".send-error");
    if (!box) { box = document.createElement("p"); box.className = "send-error"; box.setAttribute("role", "alert"); form.appendChild(box); }
    box.innerHTML = 'Sorry — your message could not be sent. Please email us at <a href="mailto:' + LEAD_EMAIL + '">' + LEAD_EMAIL + '</a>.';
  }

  /* Forms: client-side validation, then email */
  document.querySelectorAll("form[data-validate]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll("[required]").forEach(function (input) {
        var field = input.closest(".field");
        var valid = input.type === "email" ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()) : input.value.trim() !== "";
        if (input.type === "checkbox") valid = input.checked;
        if (field) field.classList.toggle("invalid", !valid);
        if (!valid && ok) { input.focus(); ok = false; }
      });
      if (!ok) return;
      var btn = form.querySelector("[type=submit]");
      setBusy(btn, true);
      sendEmail(form.getAttribute("data-subject") || "Website Inquiry", formData(form)).then(function () {
        var success = form.parentElement.querySelector(".form-success");
        if (success) { form.style.display = "none"; success.classList.add("show"); success.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); }
      }).catch(function () { setBusy(btn, false); sendFailed(form); });
    });
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      el.addEventListener("input", function () { var f = el.closest(".field"); if (f) f.classList.remove("invalid"); });
    });
  });

  /* Newsletter */
  document.querySelectorAll(".newsletter").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = f.querySelector("input");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) { input.focus(); return; }
      var btn = f.querySelector("button");
      if (btn) btn.disabled = true;
      sendEmail("Newsletter Signup", { Email: input.value.trim() }).then(function () {
        f.innerHTML = '<span style="padding:10px 14px;color:var(--ice);font-size:14px">Thank you — you are subscribed.</span>';
      }).catch(function () {
        if (btn) btn.disabled = false;
        f.insertAdjacentHTML("afterend", '<p class="send-error">Could not subscribe — please email <a href="mailto:' + LEAD_EMAIL + '">' + LEAD_EMAIL + '</a>.</p>');
      });
    });
  });

  /* Video players (.tour-phone): play when scrolled into view, with sound.
     Browsers only allow sound after the visitor has clicked/tapped/typed on the page
     at least once. Before that, the video starts muted and "Tap for sound" turns it on;
     after that, every video that scrolls into view plays with sound. */
  var tours = Array.prototype.slice.call(document.querySelectorAll(".tour-phone"));
  var soundAllowed = false;
  function fmt(t) { t = Math.floor(t || 0); return Math.floor(t / 60) + ":" + ("0" + (t % 60)).slice(-2); }
  var players = tours.map(function (tour) {
    var v = tour.querySelector("video");
    var soundBtn = tour.querySelector(".tour-sound");
    var playBtn = tour.querySelector(".tour-play");
    var bar = tour.querySelector(".tour-progress");
    var fill = bar.querySelector("i");
    var time = tour.querySelector(".tour-time");
    var section = tour.closest("section") || document;
    var chapterBtns = section.querySelectorAll(".chapters button");
    var P = { tour: tour, v: v, userPaused: false, userMuted: false, inView: false };
    function setPaused(p) { tour.classList.toggle("paused", p); playBtn.setAttribute("aria-label", p ? "Play video" : "Pause video"); }
    function syncSound() { soundBtn.setAttribute("aria-pressed", v.muted ? "false" : "true"); }
    P.play = function (withSound) {
      players.forEach(function (o) { if (o !== P && !o.v.paused) o.v.pause(); });
      if (withSound && !P.userMuted) v.muted = false;
      var pr = v.play();
      if (pr && pr.catch) pr.catch(function () {
        if (!v.muted) { v.muted = true; syncSound(); var p2 = v.play(); if (p2 && p2.catch) p2.catch(function () { setPaused(true); }); }
        else setPaused(true);
      });
      syncSound();
    };
    v.addEventListener("play", function () { setPaused(false); });
    v.addEventListener("pause", function () { setPaused(true); });
    v.addEventListener("volumechange", syncSound);
    v.addEventListener("timeupdate", function () {
      var pct = v.duration ? (v.currentTime / v.duration) * 100 : 0;
      fill.style.width = pct + "%"; bar.setAttribute("aria-valuenow", Math.round(pct)); time.textContent = fmt(v.currentTime);
      var active = null;
      chapterBtns.forEach(function (b) { if (v.currentTime >= parseFloat(b.getAttribute("data-t"))) active = b; });
      chapterBtns.forEach(function (b) { b.classList.toggle("active", b === active); });
    });
    function togglePlay() { if (v.paused) { P.userPaused = false; P.play(soundAllowed); } else { P.userPaused = true; v.pause(); } }
    playBtn.addEventListener("click", togglePlay);
    v.addEventListener("click", togglePlay);
    soundBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      var turnOn = v.muted;
      P.userMuted = !turnOn;
      v.muted = !turnOn;
      if (turnOn && v.currentTime > 1 && soundBtn.getAttribute("data-started") !== "1") v.currentTime = 0;
      soundBtn.setAttribute("data-started", "1");
      P.userPaused = false; P.play(turnOn);
    });
    bar.addEventListener("click", function (e) {
      var r = bar.getBoundingClientRect();
      if (v.duration) v.currentTime = ((e.clientX - r.left) / r.width) * v.duration;
    });
    chapterBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        v.currentTime = parseFloat(b.getAttribute("data-t"));
        P.userPaused = false; P.play(true);
        if (window.innerWidth < 1000) tour.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      });
    });
    if (reduceMotion) setPaused(true);
    return P;
  });
  if (players.length) {
    /* First click/tap/key anywhere unlocks sound; unmute a video already playing in view. */
    var unlock = function (e) {
      if (soundAllowed) return;
      soundAllowed = true;
      if (e && e.target && e.target.closest && e.target.closest(".tour-sound")) return;
      players.forEach(function (P) { if (P.inView && !P.v.paused && !P.userMuted) P.v.muted = false; });
      ["pointerdown", "keydown", "touchend"].forEach(function (t) { document.removeEventListener(t, unlock, true); });
    };
    ["pointerdown", "keydown", "touchend"].forEach(function (t) { document.addEventListener(t, unlock, true); });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          var P = players.filter(function (o) { return o.tour === e.target; })[0];
          if (!P) return;
          P.inView = e.isIntersecting;
          if (e.isIntersecting) { if (!P.userPaused && !reduceMotion) P.play(true); }
          else if (!P.v.paused) P.v.pause();
        });
      }, { threshold: 0.5 });
      players.forEach(function (P) { io.observe(P.tour); });
    }
  }

  /* WhatsApp widget */
  var wa = document.querySelector(".wa-widget");
  if (wa) {
    var waBtn = wa.querySelector(".wa-launch");
    var waPanel = wa.querySelector(".wa-panel");
    var waText = wa.querySelector("#wa-msg");
    var waNum = wa.getAttribute("data-wa");
    function waSet(open) {
      wa.classList.toggle("wa-open", open);
      document.body.classList.toggle("wa-is-open", open);
      waBtn.setAttribute("aria-expanded", open ? "true" : "false");
      waBtn.setAttribute("aria-label", open ? "Close chat" : "Chat with us on WhatsApp");
      if (open) { waPanel.hidden = false; setTimeout(function () { waText.focus({ preventScroll: true }); }, reduceMotion ? 0 : 700); }
      else if (wa.contains(document.activeElement)) { waBtn.focus(); }
    }
    waBtn.addEventListener("click", function () { waSet(!wa.classList.contains("wa-open")); });
    wa.querySelector(".wa-x").addEventListener("click", function () { waSet(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && wa.classList.contains("wa-open")) waSet(false); });
    document.addEventListener("click", function (e) { if (wa.classList.contains("wa-open") && !wa.contains(e.target)) waSet(false); });
    wa.querySelectorAll(".wa-chips button").forEach(function (chip) {
      chip.addEventListener("click", function () {
        wa.querySelectorAll(".wa-chips button").forEach(function (c) { c.classList.remove("on"); });
        chip.classList.add("on");
        waText.value = chip.getAttribute("data-msg");
        waText.focus();
      });
    });
    waText.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); wa.querySelector(".wa-form").requestSubmit(); } });
    wa.querySelector(".wa-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var msg = waText.value.trim() || "Hi FPH Ice Plant! I'd like to know more about your ice products.";
      window.open("https://wa.me/" + waNum + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
    });
  }

  /* Lead forms (facility tour card + secure quote modal): validate, then email the lead */
  var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function validateLead(form) {
    var first = null;
    form.querySelectorAll("[required]").forEach(function (input) {
      var v = input.value.trim();
      var ok = input.type === "email" ? emailRe.test(v) : v !== "";
      var f = input.closest(".field");
      if (f) f.classList.toggle("invalid", !ok);
      if (!ok && !first) first = input;
    });
    if (first) first.focus();
    return !first;
  }
  function sendLead(form) { return sendEmail(form.getAttribute("data-lead"), formData(form)); }
  document.querySelectorAll("form.lead-form").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateLead(form)) return;
      var btn = form.querySelector("[type=submit]");
      setBusy(btn, true);
      sendLead(form).then(function () {
        var done = form.parentElement.querySelector(".lead-done");
        form.hidden = true;
        if (done) done.hidden = false;
      }).catch(function () { setBusy(btn, false); sendFailed(form); });
    });
    form.addEventListener("input", function (e) { var f = e.target.closest(".field"); if (f) f.classList.remove("invalid"); });
  });

  /* Secure quote modal (built on demand for any [data-lead-open] button) */
  var openers = document.querySelectorAll("[data-lead-open]");
  if (openers.length) {
    var arrow = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
    var cm = document.createElement("div");
    cm.className = "cyber-modal";
    cm.hidden = true;
    cm.innerHTML =
      '<div class="cm-backdrop" data-cm-close></div>' +
      '<div class="cm-panel" role="dialog" aria-modal="true" aria-labelledby="cm-title">' +
        '<i class="cm-corner tl"></i><i class="cm-corner tr"></i><i class="cm-corner bl"></i><i class="cm-corner br"></i>' +
        '<div class="cm-bar"><span class="cm-lights"><i></i><i></i><i></i></span><span class="cm-path">FPH://SECURE-QUOTE</span><span class="cm-status"><i class="dot"></i>HTTPS · SECURE</span><button class="cm-x" type="button" data-cm-close aria-label="Close">&times;</button></div>' +
        '<div class="cm-body">' +
          '<div class="cm-boot" aria-hidden="true"><div>&gt; establishing secure channel<span class="ok">OK</span></div><div>&gt; loading quote module<span class="ok">OK</span></div><div class="cm-type">&gt; awaiting your request_<span class="cm-caret"></span></div></div>' +
          '<h2 class="cm-title" id="cm-title">Request a <span class="grad-text">priority quote</span></h2>' +
          '<p class="cm-sub">Tell us what you need — our team replies within 24 hours with pricing and delivery options.</p>' +
          '<form class="cm-form" data-lead="Secure Quote Request" novalidate>' +
            '<div class="cm-grid">' +
              '<div class="field"><label for="cm-name">01 // Full name</label><input id="cm-name" name="name" data-label="Name" autocomplete="name" required placeholder="Juan Dela Cruz"><div class="err">Name required</div></div>' +
              '<div class="field"><label for="cm-phone">02 // Mobile / WhatsApp</label><input id="cm-phone" name="phone" data-label="Phone" type="tel" autocomplete="tel" required placeholder="+63 9XX XXX XXXX"><div class="err">Number required</div></div>' +
              '<div class="field"><label for="cm-email">03 // Email</label><input id="cm-email" name="email" data-label="Email" type="email" autocomplete="email" required placeholder="you@company.com"><div class="err">Valid email required</div></div>' +
              '<div class="field"><label for="cm-company">04 // Business name</label><input id="cm-company" name="company" data-label="Business" autocomplete="organization" placeholder="Optional"></div>' +
              '<div class="field"><label for="cm-type">05 // Inquiry</label><select id="cm-type" name="type" data-label="Inquiry"><option>Ice order</option><option>Become a distributor</option><option>Investment</option><option>Plant tour</option></select></div>' +
              '<div class="field"><label for="cm-vol">06 // Volume</label><select id="cm-vol" name="volume" data-label="Volume"><option>Retail bags (1–5 KG)</option><option>Commercial (10–20 KG)</option><option>500 kg / day</option><option>2,000 kg / day</option><option>5,000+ kg / day</option><option>Bulk / metric ton</option></select></div>' +
              '<div class="field full"><label for="cm-msg">07 // Notes</label><textarea id="cm-msg" name="message" data-label="Notes" rows="3" placeholder="Delivery location, schedule, anything else (optional)"></textarea></div>' +
            '</div>' +
            '<button class="cm-submit" type="submit"><span>Transmit Request</span>' + arrow + '</button>' +
            '<p class="cm-note">Sent straight to our sales team’s inbox.</p>' +
          '</form>' +
          '<div class="cm-done" hidden>' +
            '<div class="cm-progress"><i></i></div>' +
            '<div class="cm-done-code">REF <b data-cm-ref></b></div>' +
            '<h3 class="cm-title">Request <span class="grad-text">received</span></h3>' +
            '<p class="cm-sub">Thank you — our sales team has your request and will reply within 24 hours. Keep your reference number for follow-ups.</p>' +
            '<button class="cm-submit ghost" type="button" data-cm-close><span>Close</span></button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(cm);
    var cmForm = cm.querySelector(".cm-form");
    var cmDone = cm.querySelector(".cm-done");
    var lastFocus = null;
    function cmOpen(opener) {
      lastFocus = opener || document.activeElement;
      cmForm.hidden = false; cmDone.hidden = true; cm.classList.remove("is-done");
      cm.hidden = false;
      requestAnimationFrame(function () { cm.classList.add("open"); });
      document.body.classList.add("cm-lock");
      setTimeout(function () { cm.querySelector("#cm-name").focus({ preventScroll: true }); }, reduceMotion ? 0 : 450);
    }
    function cmClose() {
      cm.classList.remove("open");
      document.body.classList.remove("cm-lock");
      setTimeout(function () { cm.hidden = true; }, reduceMotion ? 0 : 300);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
    openers.forEach(function (b) { b.addEventListener("click", function () { cmOpen(b); }); });
    cm.addEventListener("click", function (e) { if (e.target.closest("[data-cm-close]")) cmClose(); });
    document.addEventListener("keydown", function (e) {
      if (cm.hidden) return;
      if (e.key === "Escape") cmClose();
      if (e.key === "Tab") {
        var f = Array.prototype.filter.call(cm.querySelectorAll("button, input, select, textarea"), function (el) { return el.offsetParent !== null; });
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    });
    cmForm.addEventListener("input", function (e) { var f = e.target.closest(".field"); if (f) f.classList.remove("invalid"); });
    cmForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateLead(cmForm)) return;
      var btn = cmForm.querySelector("[type=submit]");
      var ref = "FPH-" + Date.now().toString(36).toUpperCase().slice(-6);
      var data = formData(cmForm); data.Reference = ref;
      setBusy(btn, true, "Transmitting…");
      sendEmail(cmForm.getAttribute("data-lead"), data).then(function () {
        setBusy(btn, false);
        cm.querySelector("[data-cm-ref]").textContent = ref;
        cmForm.hidden = true; cmDone.hidden = false; cm.classList.add("is-done");
        cmDone.querySelector(".cm-submit").focus({ preventScroll: true });
      }).catch(function () { setBusy(btn, false); sendFailed(cmForm); });
    });
    if (/[?&]quote=1\b/.test(location.search)) cmOpen();
  }

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
