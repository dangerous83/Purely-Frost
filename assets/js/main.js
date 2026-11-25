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
        ctx.fillStyle = "rgba(200,238,255," + f.o + ")"; ctx.fill();
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

  /* Forms: client-side validation + success state (connect to a backend later) */
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
      var success = form.parentElement.querySelector(".form-success");
      if (success) { form.style.display = "none"; success.classList.add("show"); success.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" }); }
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
      f.innerHTML = '<span style="padding:10px 14px;color:var(--ice);font-size:14px">Thank you — you are subscribed.</span>';
    });
  });

  /* Plant tour video: autoplay muted when visible, sound toggle, chapters */
  var tour = document.querySelector(".tour-phone");
  if (tour) {
    var v = tour.querySelector("video");
    var soundBtn = tour.querySelector(".tour-sound");
    var playBtn = tour.querySelector(".tour-play");
    var bar = tour.querySelector(".tour-progress");
    var fill = bar.querySelector("i");
    var time = tour.querySelector(".tour-time");
    var chapterBtns = document.querySelectorAll(".chapters button");
    var userPaused = false;
    function fmt(t) { t = Math.floor(t || 0); return Math.floor(t / 60) + ":" + ("0" + (t % 60)).slice(-2); }
    function setPaused(p) { tour.classList.toggle("paused", p); playBtn.setAttribute("aria-label", p ? "Play video" : "Pause video"); }
    function play() { var pr = v.play(); if (pr && pr.catch) pr.catch(function () { setPaused(true); }); }
    v.addEventListener("play", function () { setPaused(false); });
    v.addEventListener("pause", function () { setPaused(true); });
    v.addEventListener("timeupdate", function () {
      var pct = v.duration ? (v.currentTime / v.duration) * 100 : 0;
      fill.style.width = pct + "%"; bar.setAttribute("aria-valuenow", Math.round(pct)); time.textContent = fmt(v.currentTime);
      var active = null;
      chapterBtns.forEach(function (b) { if (v.currentTime >= parseFloat(b.getAttribute("data-t"))) active = b; });
      chapterBtns.forEach(function (b) { b.classList.toggle("active", b === active); });
    });
    function togglePlay() { if (v.paused) { userPaused = false; play(); } else { userPaused = true; v.pause(); } }
    playBtn.addEventListener("click", togglePlay);
    v.addEventListener("click", togglePlay);
    soundBtn.addEventListener("click", function () {
      var on = v.muted;
      v.muted = !on;
      if (on && v.currentTime > 1 && soundBtn.getAttribute("data-started") !== "1") { v.currentTime = 0; }
      soundBtn.setAttribute("data-started", "1");
      soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
      userPaused = false; play();
    });
    bar.addEventListener("click", function (e) {
      var r = bar.getBoundingClientRect();
      if (v.duration) v.currentTime = ((e.clientX - r.left) / r.width) * v.duration;
    });
    chapterBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        v.currentTime = parseFloat(b.getAttribute("data-t"));
        userPaused = false; play();
        if (window.innerWidth < 1000) tour.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      });
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (e.isIntersecting) { if (!userPaused && !reduceMotion) play(); }
          else if (!v.paused) v.pause();
        });
      }, { threshold: 0.35 }).observe(tour);
    }
    if (reduceMotion) setPaused(true);
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

  /* Footer year */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
