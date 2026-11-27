/* FPH Assistant — answers visitor questions from the website's own pages.
   On first open it reads every public page of the site, indexes the text, and answers
   by matching the question against that content (plus a few curated answers for the
   most common questions). No visitor data leaves the browser. */
(function () {
  "use strict";
  if (!document.querySelector(".wa-widget")) return;

  var PAGES = ["/", "/about", "/solutions", "/products", "/purity", "/facility", "/distribution", "/distributors", "/invest", "/faq", "/contact"];
  var EMAIL = "aronlopezilao@fourthpacificholdings.com";
  var WA = (document.querySelector(".wa-widget").getAttribute("data-wa")) || "971561643886";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- curated answers for the most common questions ---------- */
  var QUOTE = { label: "Get a quote", act: "quote" };
  var WAACT = { label: "Chat on WhatsApp", act: "wa" };
  var CURATED = [
    { re: /^(hi|hello|hey|good (morning|afternoon|evening)|kumusta|musta|hola)\b/i,
      a: "Hi! I'm the FPH Assistant. Ask me anything about our purified ice, delivery, sizes, distributor program, investing or our plant in Batangas.",
      chips: ["What sizes do you sell?", "Do you deliver to my area?", "How do I become a distributor?"] },
    { re: /(price|pricing|cost|how much|magkano|rate|quotation|quote)/i,
      a: "Pricing depends on bag size, volume and delivery location, so our sales team sends a tailored quote — usually within 24 hours. Tap below to request one.",
      acts: [QUOTE, WAACT] },
    { re: /(phone|call you|contact number|mobile number|contact|email|e-mail|reach you|whatsapp|viber)/i,
      a: "You can reach FPH Ice Plant at:<br>• PH: <a href=\"tel:+639762412228\">+63 976 241 2228</a><br>• UAE / WhatsApp: <a href=\"tel:+971561643886\">+971 56 164 3886</a><br>• Email: <a href=\"mailto:" + EMAIL + "\">" + EMAIL + "</a><br>Office hours: Monday–Friday, 8:00 AM–5:00 PM.",
      acts: [WAACT], link: "/contact" },
    { re: /(address|located|where is (your|the) (plant|office|company)|where are you|map|direction)/i,
      a: "Our plant is at 35X8+C9V WH-03, Brgy. San Miguel, Sto. Tomas, Batangas, Philippines. Office hours are Monday–Friday, 8:00 AM–5:00 PM. Plant tours can be booked on our Facility page.",
      link: "/facility" },
    { re: /(opening hours|office hours|business hours|operating hours|what time|are you open|anong oras)/i,
      a: "Our office is open Monday–Friday, 8:00 AM–5:00 PM. The plant itself runs 24/7.", link: "/contact" },
    { re: /(sizes?\b|\bkg\b|kilo|\bbags?\b|bulk|\bton\b|products?|what do you sell)/i,
      a: "We sell purified hollow tube ice in <b>1KG, 2KG and 5KG</b> retail bags, <b>10KG and 20KG</b> commercial bags, and <b>bulk ice by the metric ton</b> for industry.",
      link: "/products", acts: [QUOTE] },
    { re: /(distributor|distribution business|reseller|dealer|franchise|silver|gold|platinum|tier)/i,
      a: "Our Distributor Program has three tiers: <b>Silver</b> (500 kg/day), <b>Gold</b> (2,000 kg/day) and <b>Platinum</b> (5,000+ kg/day), with territories, brand support and reliable supply.",
      link: "/distributors", acts: [{ label: "Apply as distributor", act: "quote" }] },
    { re: /(invest|investor|investment|shares|funding|roi)/i,
      a: "FPH Ice Plant welcomes investors: a first-mover national ice brand with 1,000,000 kg/day capacity, diversified revenue streams and a Philippines-to-GCC expansion plan.",
      link: "/invest", acts: [{ label: "Talk to our team", act: "quote" }] },
    { re: /(pure|purity|safe|clean|food.?grade|reverse osmosis|\bro\b|uv|steril|hygien|drink)/i,
      a: "Our ice is made from water treated by multi-stage reverse osmosis, activated carbon and UV sterilization, with batch microbial testing and full cold-chain handling — food-grade and safe for direct consumption.",
      link: "/purity" },
    { re: /(sample|trial|try (your|the) ice|test order)/i,
      a: "Yes — businesses can request a sample or trial order. Send a quick request with your location and expected volume, and our sales team will arrange it.",
      link: "/purity", acts: [{ label: "Request a sample", act: "quote" }] },
    { re: /(tour|visit|see the plant|site visit)/i,
      a: "Yes! You can book a guided plant tour in Sto. Tomas, Batangas for distributors, partners and investors.",
      link: "/facility#tour" },
    { re: /(uae|dubai|abu dhabi|gcc|middle east|saudi|qatar|oman|bahrain|kuwait)/i,
      a: "FPH Ice Plant operates in the UAE and is expanding across the GCC — Saudi Arabia, Qatar, Oman, Bahrain and Kuwait. For the UAE, WhatsApp us at +971 56 164 3886.",
      link: "/distribution", acts: [WAACT] }
  ];

  /* ---------- knowledge index built from the site's pages ---------- */
  var STOP = "a an the and or of to in on for with is are was be by at as it this that from your you we our us can do does how what when where which who why i me my about into than then there their they will would should could have has had not no yes".split(" ");
  var SYN = { deliver: ["delivery", "deliveries", "ship", "shipping"], delivery: ["deliver"], order: ["buy", "purchase", "orders"], buy: ["order"], minimum: ["moq", "least"],
    area: ["areas", "location", "coverage", "province", "city"], price: ["pricing", "cost", "quote"], ice: ["tube"], machine: ["equipment"], capacity: ["production", "kg"] };
  var index = null, df = {}, loading = null;

  function tokens(s) {
    return (s.toLowerCase().match(/[a-z0-9]+/g) || []).filter(function (w) { return w.length > 1 && STOP.indexOf(w) < 0; })
      .map(function (w) { return w.length > 4 ? w.replace(/(ies)$/, "y").replace(/(es|s)$/, "") : w; });
  }
  function clean(s) { return (s || "").replace(/\s+/g, " ").trim(); }
  function textOf(n) {
    if (n.nodeType === 3) return n.textContent;
    if (n.nodeType !== 1 || /^(SCRIPT|STYLE|SVG)$/i.test(n.tagName)) return "";
    var parts = []; n.childNodes.forEach(function (c) { parts.push(textOf(c)); });
    return parts.join(" ");
  }

  function parsePage(html, url) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var title = clean((doc.querySelector("h1") || {}).textContent || doc.title).replace(/\s*\|.*$/, "");
    var main = doc.querySelector("main") || doc.body;
    main.querySelectorAll("script, style, svg, form, .cyber-cta, .lead-cta-card, .crumbs").forEach(function (n) { n.remove(); });
    var out = [];
    // headline stats (e.g. "500+ Partners Nationwide")
    main.querySelectorAll(".stat-num").forEach(function (n) {
      var box = n.parentElement, label = clean(textOf(box).replace(clean(textOf(n)), ""));
      var val = clean(textOf(n));
      if (label && val) out.push({ h: label, t: "FPH Ice Plant: " + val + " " + label + ".", url: url, page: title });
    });
    // FAQ pairs
    main.querySelectorAll(".faq-item, .faq-q").forEach(function (q) {
      var btn = q.classList.contains("faq-q") ? q : q.querySelector(".faq-q");
      if (!btn || btn._seen) return; btn._seen = true;
      var ans = btn.parentElement.querySelector(".faq-a");
      if (ans) out.push({ h: clean(btn.textContent), t: clean(ans.textContent), url: url, page: title, faq: true });
    });
    // heading-based chunks
    var cur = { h: title, t: "", url: url, page: title };
    var walker = doc.createTreeWalker(main, NodeFilter.SHOW_ELEMENT);
    var node;
    while ((node = walker.nextNode())) {
      if (node.closest(".faq-a, .faq-q")) continue;
      if (/^H[1-4]$/.test(node.tagName)) {
        if (cur.t.length > 30) out.push(cur);
        cur = { h: clean(node.textContent), t: "", url: url, page: title };
      } else if (/^(P|LI|TD|DT|DD)$/.test(node.tagName) && !node.querySelector("p, li")) {
        var txt = clean(textOf(node)).replace(/\bSto\. /g, "Sto. ");
        if (txt.length > 2 && cur.t.length < 900) cur.t += (cur.t ? " " : "") + txt + (/[.!?]$/.test(txt) ? "" : ".");
      }
    }
    if (cur.t.length > 30) out.push(cur);
    return out;
  }

  function build() {
    if (loading) return loading;
    loading = Promise.all(PAGES.map(function (p) {
      return fetch(p, { credentials: "same-origin" }).then(function (r) { return r.ok ? r.text() : ""; }).then(function (h) { return h ? parsePage(h, p) : []; }).catch(function () { return []; });
    })).then(function (lists) {
      index = [].concat.apply([], lists).map(function (c) {
        c.tk = tokens(c.h + " " + c.h + " " + c.t); c.hk = tokens(c.h);
        var seen = {}; c.tk.forEach(function (w) { if (!seen[w]) { seen[w] = 1; df[w] = (df[w] || 0) + 1; } });
        return c;
      });
      return index;
    });
    return loading;
  }

  function search(q) {
    var qt = tokens(q), expanded = qt.slice();
    qt.forEach(function (w) { (SYN[w] || []).forEach(function (s) { expanded.push(s); }); });
    var N = index.length || 1, best = null, bestScore = 0;
    index.forEach(function (c) {
      var s = 0;
      expanded.forEach(function (w, i) {
        var tf = 0; for (var k = 0; k < c.tk.length; k++) if (c.tk[k] === w) tf++;
        if (!tf) return;
        var idf = Math.log(1 + N / (df[w] || 1));
        var weight = i < qt.length ? 1 : 0.6;
        s += weight * idf * (1 + Math.log(tf)) * (c.hk.indexOf(w) >= 0 ? 1.8 : 1);
      });
      if (c.faq) s *= 1.35;
      s = s / Math.sqrt(1 + c.tk.length / 60);
      if (s > bestScore) { bestScore = s; best = c; }
    });
    return bestScore > 1.2 ? best : null;
  }

  function summarize(c, q) {
    var sentences = c.t.match(/[^.!?]+[.!?]+/g) || [c.t];
    if (c.faq || c.t.length < 320) return c.t;
    var qt = tokens(q);
    var scored = sentences.map(function (s, i) { var st = tokens(s); var hit = qt.filter(function (w) { return st.indexOf(w) >= 0; }).length; return { s: s.trim(), i: i, hit: hit }; });
    scored.sort(function (a, b) { return b.hit - a.hit || a.i - b.i; });
    var pick = scored.slice(0, 2).sort(function (a, b) { return a.i - b.i; }).map(function (x) { return x.s; });
    return pick.join(" ");
  }

  /* ---------- UI ---------- */
  var root = document.createElement("div");
  root.className = "ai-agent";
  root.innerHTML =
    '<button class="ai-launch" type="button" aria-expanded="false" aria-controls="ai-panel" aria-label="Ask the FPH Assistant">' +
      '<svg class="ai-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.6L12 15l-1.8-4.4L5.5 9l4.7-1.4z"/><path d="M19 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/></svg>' +
      '<svg class="ai-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
      '<span class="ai-tip">Ask FPH</span>' +
    '</button>' +
    '<section class="ai-panel" id="ai-panel" role="dialog" aria-label="FPH Assistant" hidden>' +
      '<i class="cm-corner tl"></i><i class="cm-corner tr"></i><i class="cm-corner bl"></i><i class="cm-corner br"></i>' +
      '<header class="ai-head"><span class="ai-avatar" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 4.6L18.5 9l-4.7 1.6L12 15l-1.8-4.4L5.5 9l4.7-1.4z"/></svg></span>' +
        '<div><b>FPH Assistant</b><small><i class="dot"></i>Online · answers from fphiceplant.com</small></div>' +
        '<button class="ai-close" type="button" aria-label="Close assistant">&times;</button></header>' +
      '<div class="ai-log" aria-live="polite"></div>' +
      '<div class="ai-chips"></div>' +
      '<form class="ai-form"><label class="sr-only" for="ai-input">Ask a question</label><input id="ai-input" autocomplete="off" placeholder="Ask about sizes, delivery, pricing…" maxlength="300"><button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button></form>' +
    '</section>';
  document.body.appendChild(root);

  var launch = root.querySelector(".ai-launch"), panel = root.querySelector(".ai-panel"), log = root.querySelector(".ai-log"),
      chips = root.querySelector(".ai-chips"), form = root.querySelector(".ai-form"), input = root.querySelector("#ai-input");
  var started = false;

  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function scroll() { log.scrollTop = log.scrollHeight; }
  function add(who, html) {
    var m = document.createElement("div"); m.className = "ai-msg " + who; m.innerHTML = html; log.appendChild(m); scroll(); return m;
  }
  function setChips(list) {
    chips.innerHTML = "";
    (list || []).forEach(function (c) { var b = document.createElement("button"); b.type = "button"; b.textContent = c; b.addEventListener("click", function () { ask(c); }); chips.appendChild(b); });
  }
  function actions(m, acts, link) {
    if (!acts && !link) return;
    var row = document.createElement("div"); row.className = "ai-acts";
    if (link) { var a = document.createElement("a"); a.href = link; a.textContent = "Open page →"; row.appendChild(a); }
    (acts || []).forEach(function (x) {
      var b = document.createElement("button"); b.type = "button"; b.textContent = x.label;
      b.addEventListener("click", function () {
        if (x.act === "quote") {
          var opener = document.querySelector("[data-lead-open]");
          if (opener) { setOpen(false); opener.click(); } else { location.href = "/contact#quote"; }
        } else if (x.act === "wa") { window.open("https://wa.me/" + WA, "_blank", "noopener"); }
      });
      row.appendChild(b);
    });
    m.appendChild(row); scroll();
  }
  function typing() { return add("bot typing", "<span></span><span></span><span></span>"); }

  function answer(q) {
    for (var i = 0; i < CURATED.length; i++) {
      if (CURATED[i].re.test(q)) return Promise.resolve(CURATED[i]);
    }
    return build().then(function () {
      var hit = search(q);
      if (!hit) return null;
      var pageName = hit.page && hit.page !== hit.h ? hit.page : "";
      return { a: "<b>" + esc(hit.h) + "</b><br>" + esc(summarize(hit, q)), link: hit.url, src: pageName };
    });
  }

  function ask(q) {
    q = clean(q); if (!q) return;
    add("user", esc(q)); setChips([]);
    var t = typing();
    var started = Date.now();
    answer(q).then(function (res) {
      setTimeout(function () {
        t.remove();
        if (!res) {
          var m = add("bot", "I couldn't find that on our website yet. Our team can answer directly — send a quick request or message us on WhatsApp.");
          actions(m, [QUOTE, WAACT]);
          setChips(["What sizes do you sell?", "Where is your plant?", "Contact details"]);
          return;
        }
        var m2 = add("bot", res.a + (res.src ? '<span class="ai-src">Source: ' + esc(res.src) + "</span>" : ""));
        actions(m2, res.acts, res.link);
        setChips(res.chips || ["Pricing", "Delivery areas", "Distributor tiers", "Contact details"]);
      }, Math.max(0, (reduceMotion ? 150 : 650) - (Date.now() - started)));
    });
  }

  function setOpen(open) {
    root.classList.toggle("ai-open", open);
    launch.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      panel.hidden = false;
      var w = document.querySelector(".wa-widget.wa-open .wa-x"); if (w) w.click();
      if (!started) {
        started = true;
        add("bot", "Hi! I'm the <b>FPH Assistant</b>. I know everything on our website — products, delivery, purity, distributor tiers, investing and our plant. What would you like to know?");
        setChips(["What sizes do you sell?", "Do you deliver to my area?", "How do I become a distributor?", "Is your ice safe to drink?"]);
        build();
      }
      setTimeout(function () { input.focus({ preventScroll: true }); }, reduceMotion ? 0 : 250);
    } else {
      setTimeout(function () { if (!root.classList.contains("ai-open")) panel.hidden = true; }, reduceMotion ? 0 : 300);
    }
  }
  launch.addEventListener("click", function () { setOpen(!root.classList.contains("ai-open")); });
  root.querySelector(".ai-close").addEventListener("click", function () { setOpen(false); launch.focus(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && root.classList.contains("ai-open")) setOpen(false); });
  form.addEventListener("submit", function (e) { e.preventDefault(); var v = input.value; input.value = ""; ask(v); });
  // close the assistant when the WhatsApp panel opens
  var waBtn = document.querySelector(".wa-launch");
  if (waBtn) waBtn.addEventListener("click", function () { if (root.classList.contains("ai-open")) setOpen(false); });
})();
