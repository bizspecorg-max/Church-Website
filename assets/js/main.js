/* =========================================================
   Prophet AA Emmanuel Ministries — main.js
   Handles: navigation, scroll reveal, stat counters,
   donation amount selection, validation, modal & Paystack.
   ========================================================= */
(function () {
  "use strict";

  /* ----------------------------------------------------------
     All editable settings live in assets/js/config.js.
     We read them here with safe fallbacks so the site still
     works even if that file is missing.
  ---------------------------------------------------------- */
  const CFG = window.MINISTRY_CONFIG || {};
  const PAYSTACK_PUBLIC_KEY = CFG.paystackPublicKey || "";
  const CURRENCY            = CFG.currency || "NGN";
  const NOTIFY_EMAIL        = CFG.notifyEmail || "koredebusuyi.career@gmail.com";
  const FORM_ENDPOINT       = CFG.formEndpoint || "";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Lead / email delivery ----------
     Sends a submission to NOTIFY_EMAIL. Uses Formspree (silent,
     background) when FORM_ENDPOINT is set; otherwise falls back to
     a pre-filled mailto so it still works with zero setup.
     Returns true if sent silently, false if it used the mailto. */
  async function sendLead(subject, data) {
    if (FORM_ENDPOINT) {
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ _subject: subject, _replyto: data.Email || NOTIFY_EMAIL, ...data }),
        });
        if (res.ok) return true;
      } catch (_) { /* fall through */ }
    }
    // When Supabase is the system of record, DON'T pop the email client —
    // it can interrupt the database insert. The DB keeps the submission.
    if (window.MinistryDB && MinistryDB.enabled) return false;
    // Last resort (no DB, no Formspree): open a pre-filled email.
    const body = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join("\n");
    window.location.href =
      `mailto:${NOTIFY_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    return false;
  }

  /* ---------- Footer year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- YouTube helpers ---------- */
  // Pulls the 11-char video id from any common YouTube URL shape.
  const youtubeId = (url = "") => {
    const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : "";
  };
  const youtubeThumb = (url) => {
    const id = youtubeId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
  };

  /* ---------- Inline video player (play on-site, not on YouTube) ---------- */
  const videoModal = $("#videoModal");
  const videoFrame = $("#videoFrame");
  const videoTitle = $("#videoModalTitle");
  const openVideo = (id, title) => {
    if (!videoModal || !id) return;
    videoFrame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
    if (videoTitle) videoTitle.textContent = title || "";
    videoModal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  };
  const closeVideo = () => {
    if (!videoModal) return;
    videoModal.classList.add("hidden");
    videoFrame.src = ""; // stop playback
    document.body.style.overflow = "";
  };
  if (videoModal) {
    $$("[data-close-video]").forEach((el) => el.addEventListener("click", closeVideo));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !videoModal.classList.contains("hidden")) closeVideo(); });
  }

  /* ---------- Render video sections ----------
     Source: Supabase `videos` table (grouped by `section`), else config.
     mode "inline" → plays on-site in the popup; "link" → opens YouTube. */
  const videoWrap = $("#videoSections");
  const FB_THUMBS = ["assets/img/sermon-1.svg", "assets/img/sermon-2.svg", "assets/img/sermon-3.svg"];
  const videoCard = (s, i) => {
    const id = youtubeId(s.youtube || "");
    const fb = FB_THUMBS[i % 3];
    const thumb = s.thumbnail || (id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : fb);
    const safeTitle = (s.title || "Message").replace(/"/g, "&quot;");
    const linkOut = s.mode === "link" || !id;
    const href = s.youtube || CFG.youtubeChannel || "#";
    const media = linkOut
      ? `<a href="${href}" target="_blank" rel="noopener" class="block relative">
           <img src="${thumb}" onerror="this.onerror=null;this.src='${fb}'" alt="${safeTitle}" loading="lazy" class="w-full" />
           <span class="play-overlay"><svg class="h-7 w-7" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
         </a>`
      : `<button type="button" class="block relative w-full cursor-pointer" data-vid="${id}" data-title="${safeTitle}" aria-label="Play: ${safeTitle}">
           <img src="${thumb}" onerror="this.onerror=null;this.src='${fb}'" alt="${safeTitle}" loading="lazy" class="w-full" />
           <span class="play-overlay"><svg class="h-7 w-7" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
         </button>`;
    const cta = linkOut
      ? `<a href="${href}" target="_blank" rel="noopener" class="btn-watch mt-4">▶ Watch on YouTube</a>`
      : `<button type="button" class="btn-watch mt-4" data-vid="${id}" data-title="${safeTitle}">▶ Watch Message</button>`;
    return `<article class="sermon-card reveal visible">
        ${media}
        <div class="p-5">
          <time class="text-xs text-gold-dark font-600 uppercase tracking-wide">${s.date || ""}</time>
          <h3 class="font-serif text-xl font-700 text-navy mt-1">${safeTitle}</h3>
          <p class="text-sm text-gray-600 mt-2">${s.blurb || ""}</p>
          ${cta}
        </div>
      </article>`;
  };
  // Reserved section names that get their own dedicated spots on the page.
  const RESERVED = ["Watch Live", "Featured"];

  // Grouped message sections (excludes the reserved sections).
  const renderSections = (list) => {
    if (!videoWrap) return;
    const items = Array.isArray(list) ? list : [];
    const order = [];
    const groups = {};
    items.forEach((it) => {
      const sec = it.section || "Recent Messages";
      if (!groups[sec]) { groups[sec] = []; order.push(sec); }
      groups[sec].push(it);
    });
    videoWrap.innerHTML = order.map((sec) => `
      <div class="reveal visible">
        <h3 class="font-serif text-2xl font-700 text-navy mb-5 flex items-center gap-3">
          <span class="h-6 w-1.5 rounded bg-gold"></span>${sec}
        </h3>
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-7">
          ${groups[sec].map((s, i) => videoCard(s, i)).join("")}
        </div>
      </div>`).join("");
  };

  // Filled video wall (On-Demand) — shows all playable videos.
  const renderGallery = (list) => {
    const gal = $("#videoGallery");
    if (!gal) return;
    const playable = (Array.isArray(list) ? list : []).filter((s) => youtubeId(s.youtube)).slice(0, 8);
    gal.innerHTML = playable.map((s, i) => {
      const id = youtubeId(s.youtube);
      const fb = FB_THUMBS[i % 3];
      const thumb = s.thumbnail || `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      const st = (s.title || "Video").replace(/"/g, "&quot;");
      const inner = `<img src="${thumb}" onerror="this.onerror=null;this.src='${fb}'" alt="${st}" loading="lazy" /><span class="play-overlay" style="opacity:1;background:rgba(8,22,52,.22)"><svg class="h-7 w-7" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span><figcaption>${st}</figcaption>`;
      return s.mode === "link"
        ? `<a class="gallery-item aspect-video block" href="${s.youtube}" target="_blank" rel="noopener">${inner}</a>`
        : `<button type="button" class="gallery-item aspect-video w-full" data-vid="${id}" data-title="${st}">${inner}</button>`;
    }).join("");
  };

  // Big single featured video (the dedicated section after Watch Live).
  const applyBigVideo = (item) => {
    const wrap = $("#bigVideo");
    const sec = $("#bigVideoSection");
    if (!wrap) return;
    const id = item ? youtubeId(item.youtube || "") : "";
    if (!id) { wrap.innerHTML = ""; if (sec) sec.classList.add("hidden"); return; }
    if (sec) sec.classList.remove("hidden");
    wrap.innerHTML = `<div class="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-slate-200 bg-black">
      <div class="relative aspect-video"><iframe class="absolute inset-0 w-full h-full" src="https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1" title="Featured broadcast" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>
    </div>`;
    const t = $("#bigVideoTitle"); if (t && item.title) t.textContent = item.title;
    const b = $("#bigVideoBlurb"); if (b) b.textContent = item.blurb || "";
  };

  // Clicks on any play control open the inline player.
  const playClick = (e) => {
    const t = e.target.closest("[data-vid]");
    if (t) { e.preventDefault(); openVideo(t.dataset.vid, t.dataset.title); }
  };
  videoWrap?.addEventListener("click", playClick);
  $("#videoGallery")?.addEventListener("click", playClick);

  // "View all messages" + hero button point to the channel.
  const allLink = $("#allMessagesLink");
  if (allLink && CFG.youtubeChannel) allLink.href = CFG.youtubeChannel;

  /* ---------- Prophet photo from a URL (optional) ---------- */
  if (CFG.prophetPhoto) {
    ["#prophetHeroImg", "#prophetImg"].forEach((sel) => {
      const el = $(sel);
      if (el) el.src = CFG.prophetPhoto;
    });
  }

  /* ---------- Contact details from config ---------- */
  const c = CFG.contact || {};
  const setText = (sel, val) => { const el = $(sel); if (el && val) el.textContent = val; };
  const setHref = (sel, val) => { const el = $(sel); if (el && val) el.href = val; };
  setText("#cAddress", c.address);
  if (c.email) { setText("#cEmailLink", c.email); setHref("#cEmailLink", "mailto:" + c.email); }
  if (c.phone) { setText("#cPhoneLink", c.phone); setHref("#cPhoneLink", "tel:" + c.phone.replace(/\s+/g, "")); }
  if (c.whatsapp) {
    const wa = "https://wa.me/" + c.whatsapp;
    setHref("#waBtn", wa);
    setHref("#waFooterLink", wa);
    const prayer = wa + "?text=" + encodeURIComponent("Hello, I would like to request prayer.");
    setHref("#navPrayer", prayer);
    setHref("#prayerBtn", prayer);
  }
  // Top utility bar
  setText("#topAddress", c.address);
  if (c.email) { setText("#topEmailText", c.email); setHref("#topEmail", "mailto:" + c.email); }
  if (c.phone) setHref("#topPhone", "tel:" + c.phone.replace(/\s+/g, ""));

  /* ---------- Social links (top bar + footer) ---------- */
  const soc = CFG.socials || {};
  [["#topFb", soc.facebook], ["#topTw", soc.twitter], ["#topYt", soc.youtube], ["#topIg", soc.instagram]]
    .forEach(([sel, url]) => setHref(sel, url));
  const footerSocials = $$("footer .social-icon"); // order: Facebook, Instagram, YouTube, X
  const footerOrder = [soc.facebook, soc.instagram, soc.youtube, soc.twitter];
  footerSocials.forEach((a, i) => { if (footerOrder[i]) a.href = footerOrder[i]; });

  /* ---------- Sticky header on scroll ---------- */
  const header = $("#header");
  const onScrollHeader = () => header.classList.toggle("scrolled", window.scrollY > 40);
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------- Mobile menu ---------- */
  const menuBtn = $("#menuBtn");
  const mobileMenu = $("#mobileMenu");
  const toggleMenu = (open) => {
    const isOpen = open ?? mobileMenu.classList.contains("hidden");
    mobileMenu.classList.toggle("hidden", !isOpen);
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  };
  menuBtn.addEventListener("click", () => toggleMenu());
  $$("#mobileMenu a").forEach((a) => a.addEventListener("click", () => toggleMenu(false)));

  /* ---------- Scroll reveal (IntersectionObserver) ---------- */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("visible"); io.unobserve(e.target); }
      }),
      { threshold: 0.15 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("visible"));
  }

  /* ---------- Animated stat counters ---------- */
  const animateCount = (el) => {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || "";
    const duration = 1800;
    const start = performance.now();
    const fmt = (n) => n.toLocaleString("en-US");
    const step = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = fmt(Math.floor(eased * target)) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(target) + suffix;
    };
    requestAnimationFrame(step);
  };
  const stats = $$(".stat-number");
  if (stats.length && "IntersectionObserver" in window) {
    const so = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { animateCount(e.target); so.unobserve(e.target); }
      }),
      { threshold: 0.5 }
    );
    stats.forEach((el) => so.observe(el));
  } else {
    stats.forEach(animateCount);
  }

  /* ---------- Back to top ---------- */
  const toTop = $("#toTop");
  const onScrollTop = () => {
    const show = window.scrollY > 600;
    toTop.classList.toggle("hidden", !show);
    toTop.classList.toggle("flex", show);
  };
  onScrollTop();
  window.addEventListener("scroll", onScrollTop, { passive: true });
  toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  /* ---------- Toast helper ---------- */
  const toast = $("#toast");
  let toastTimer;
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.add("hidden"), 3500);
  };

  /* ---------- Validation helper ---------- */
  const validateField = (input) => {
    const ok = input.checkValidity() && input.value.trim() !== "";
    input.classList.toggle("invalid", !ok);
    return ok;
  };

  /* =========================================================
     GIVING — one flow for every donate CTA.
     Any [data-give] element opens the give modal (optionally with
     a preset amount). The modal AND the in-page form both collect
     details and trigger Paystack immediately (no extra screens).
     ========================================================= */
  const fmt = (n) => "₦" + Number(n).toLocaleString("en-US");
  const giveModal = $("#giveModal");
  const giveForm  = $("#giveForm");
  const giveAmt   = $("#giveAmount");

  // Email the donor's details + save to Supabase (captured before payment).
  const captureLead = (d) => {
    const payload = {
      Name: d.name, Email: d.email, Phone: d.phone,
      Amount: fmt(d.amount), amountValue: d.amount,
      Status: "Details submitted (pre-payment)",
    };
    sendLead("New Donation — " + fmt(d.amount), payload);
    if (window.MinistryDB && MinistryDB.enabled) MinistryDB.saveDonation(payload);
  };

  const closeGive = () => { if (giveModal) giveModal.classList.remove("open"); document.body.style.overflow = ""; };
  const openGive = (amount) => {
    if (!giveModal) return;
    giveModal.classList.add("open");
    document.body.style.overflow = "hidden";
    if (amount) {
      giveAmt.value = amount;
      $$("#giveAmounts .amount-card").forEach((c) => c.classList.toggle("active", c.dataset.amount === String(amount)));
    }
    setTimeout(() => $("#giveName")?.focus(), 60);
  };
  window.__openGive = openGive; // used by tiers / welcome popup

  // Run the payment (lead capture → Paystack, or demo toast).
  const processPayment = (d, formEl) => {
    captureLead(d);
    if (!PAYSTACK_PUBLIC_KEY) {
      closeGive();
      showToast("✅ Demo: " + fmt(d.amount) + " captured. Add a Paystack key in config.js to go live.");
      formEl && formEl.reset();
      return;
    }
    if (typeof PaystackPop === "undefined") { showToast("Payment library failed to load. Check your connection."); return; }
    PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY, email: d.email, amount: d.amount * 100, currency: CURRENCY,
      metadata: { custom_fields: [
        { display_name: "Full Name", variable_name: "full_name", value: d.name },
        { display_name: "Phone", variable_name: "phone", value: d.phone },
      ] },
      callback: (r) => { closeGive(); showToast("🎉 Thank you! Payment reference: " + r.reference); formEl && formEl.reset(); },
      onClose: () => showToast("Payment window closed. You can try again anytime."),
    }).openIframe();
  };

  // Validate a set of inputs, then pay.
  const collectAndPay = (nameEl, emailEl, phoneEl, amtEl, formEl) => {
    const ok = [nameEl, emailEl, phoneEl, amtEl].map(validateField).every(Boolean);
    const amount = parseInt(amtEl.value, 10) || 0;
    if (!ok || amount < 100) {
      if (amount < 100) amtEl.classList.add("invalid");
      showToast("Please complete all fields with a valid amount (min ₦100).");
      return;
    }
    processPayment({ name: nameEl.value.trim(), email: emailEl.value.trim(), phone: phoneEl.value.trim(), amount }, formEl);
  };

  // Amount chips behaviour, scoped to one container + its amount input.
  const wireAmountChips = (container, amtEl) => {
    if (!container || !amtEl) return;
    $$(".amount-card", container).forEach((card) => {
      card.addEventListener("click", () => {
        $$(".amount-card", container).forEach((c) => c.classList.remove("active"));
        card.classList.add("active");
        const v = card.dataset.amount;
        if (v === "custom") { amtEl.value = ""; amtEl.focus(); } else { amtEl.value = v; }
        amtEl.classList.remove("invalid");
      });
    });
    amtEl.addEventListener("input", () =>
      $$(".amount-card", container).forEach((c) => c.classList.toggle("active", c.dataset.amount === amtEl.value))
    );
  };

  // Give modal wiring
  if (giveModal) {
    wireAmountChips($("#giveAmounts"), giveAmt);
    $$("[data-close-give]").forEach((el) => el.addEventListener("click", closeGive));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && giveModal.classList.contains("open")) closeGive(); });
    giveForm.addEventListener("submit", (e) => {
      e.preventDefault();
      collectAndPay($("#giveName"), $("#giveEmail"), $("#givePhone"), giveAmt, giveForm);
    });
  }

  // Every [data-give] CTA opens the modal (closing the welcome popup first).
  $$("[data-give]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const wm = $("#welcomeModal");
      if (wm && !wm.classList.contains("hidden")) { wm.classList.add("hidden"); }
      const a = el.dataset.amount && el.dataset.amount !== "custom" ? el.dataset.amount : 0;
      openGive(a);
    });
  });

  // In-page donation form pays immediately too.
  const donationForm = $("#donationForm");
  if (donationForm) {
    wireAmountChips($("#amountGrid"), $("#donorAmount"));
    donationForm.addEventListener("submit", (e) => {
      e.preventDefault();
      collectAndPay($("#donorName"), $("#donorEmail"), $("#donorPhone"), $("#donorAmount"), donationForm);
    });
  }

  /* =========================================================
     PARTNER — sign up + details → direct contact + payment
     ========================================================= */
  (function partnerFlow() {
    const modal = $("#partnerModal");
    if (!modal) return;
    const form = $("#partnerForm");
    const success = $("#partnerSuccess");
    const amtEl = $("#pAmount");
    let current = null;

    const open = (amount) => {
      modal.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      form.classList.remove("hidden");
      success.classList.add("hidden");
      if (amount) {
        amtEl.value = amount;
        $$("#partnerAmounts .amount-card").forEach((c) => c.classList.toggle("active", c.dataset.amount === String(amount)));
      }
      setTimeout(() => $("#pName")?.focus(), 60);
    };
    const close = () => { modal.classList.add("hidden"); document.body.style.overflow = ""; };
    window.__openPartner = open;

    wireAmountChips($("#partnerAmounts"), amtEl);
    $$("[data-close-partner]").forEach((el) => el.addEventListener("click", close));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.classList.contains("hidden")) close(); });

    $$("[data-partner]").forEach((el) => el.addEventListener("click", (e) => {
      e.preventDefault();
      const wm = $("#welcomeModal");
      if (wm && !wm.classList.contains("hidden")) wm.classList.add("hidden");
      const a = el.dataset.amount && el.dataset.amount !== "custom" ? el.dataset.amount : 0;
      open(a);
    }));

    const charge = (d, onSuccess) => {
      if (!PAYSTACK_PUBLIC_KEY) {
        showToast("✅ Demo: " + fmt(d.amount) + " partnership captured. Add a Paystack key to go live.");
        onSuccess && onSuccess({ reference: "DEMO" });
        return;
      }
      if (typeof PaystackPop === "undefined") { showToast("Payment library failed to load."); return; }
      PaystackPop.setup({
        key: PAYSTACK_PUBLIC_KEY, email: d.email, amount: d.amount * 100, currency: CURRENCY,
        metadata: { custom_fields: [
          { display_name: "Full Name", variable_name: "full_name", value: d.name },
          { display_name: "Phone", variable_name: "phone", value: d.phone },
          { display_name: "Type", variable_name: "type", value: "Partnership" },
        ] },
        callback: (r) => onSuccess && onSuccess(r),
        onClose: () => showToast("Payment window closed. You can try again anytime."),
      }).openIframe();
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fields = [$("#pName"), $("#pEmail"), $("#pPhone"), $("#pAmount"), $("#pPassword")];
      const ok = fields.map(validateField).every(Boolean);
      const amount = parseInt(amtEl.value, 10) || 0;
      if (!ok || amount < 100) {
        if (amount < 100) amtEl.classList.add("invalid");
        showToast("Please complete all fields (partnership min ₦100).");
        return;
      }
      const d = {
        name: $("#pName").value.trim(), email: $("#pEmail").value.trim(),
        phone: $("#pPhone").value.trim(), country: $("#pCountry").value.trim(), amount,
      };
      const btn = $("#partnerSubmit");
      btn.disabled = true; btn.textContent = "Registering…";
      if (window.MinistryDB && MinistryDB.enabled) {
        try { await MinistryDB.signUp(d.email, $("#pPassword").value); } catch (_) {}
        try { await MinistryDB.savePartner({ Name: d.name, Email: d.email, Phone: d.phone, Country: d.country, amountValue: d.amount, Status: "registered" }); } catch (_) {}
      }
      btn.disabled = false; btn.textContent = "Register as Partner";
      current = d;
      $("#partnerName").textContent = d.name.split(" ")[0] || "Partner";
      $("#partnerAmtText").textContent = d.amount.toLocaleString("en-US");
      const wa = CFG.contact && CFG.contact.whatsapp ? CFG.contact.whatsapp : "";
      const msg = `Hello, I am ${d.name}. I just registered as a partner (₦${d.amount.toLocaleString()}/month). I would love direct contact with the ministry.`;
      $("#partnerWhatsapp").href = wa ? `https://wa.me/${wa}?text=${encodeURIComponent(msg)}` : (CFG.youtubeChannel || "#");
      form.classList.add("hidden");
      success.classList.remove("hidden");
      showToast("Welcome to the partner family!");
    });

    $("#partnerPay").addEventListener("click", () => {
      if (!current) return;
      charge(current, (r) => {
        if (window.MinistryDB && MinistryDB.enabled) {
          try { MinistryDB.savePartner({ Name: current.name, Email: current.email, Phone: current.phone, Country: current.country, amountValue: current.amount, Status: "paid:" + ((r && r.reference) || "") }); } catch (_) {}
        }
        showToast("🎉 Thank you, partner! Ref: " + ((r && r.reference) || "DEMO"));
        close();
      });
    });
  })();

  /* ---------- Contact form ---------- */
  const contactForm = $("#contactForm");
  contactForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fields = ["#cName", "#cEmail", "#cMessage"].map((s) => $(s));
    const valid = fields.map(validateField).every(Boolean);
    if (!valid) {
      showToast("Please fill in your name, email, and message.");
      return;
    }
    // Email the message to the ministry inbox (see NOTIFY_EMAIL / FORM_ENDPOINT)
    // and save to Supabase if configured.
    const contactData = {
      Name: $("#cName").value.trim(),
      Email: $("#cEmail").value.trim(),
      Subject: $("#cSubject").value.trim() || "(none)",
      Message: $("#cMessage").value.trim(),
    };
    sendLead("New Contact Message — Ministry Website", contactData);
    if (window.MinistryDB && MinistryDB.enabled) MinistryDB.saveContact(contactData);
    const status = $("#contactStatus");
    status.classList.remove("hidden");
    contactForm.reset();
    showToast("Message sent — we'll be in touch soon. God bless you!");
    setTimeout(() => status.classList.add("hidden"), 6000);
  });

  /* ---------- Live-clear invalid state on input ---------- */
  $$(".form-input").forEach((input) =>
    input.addEventListener("input", () => input.classList.remove("invalid"))
  );

  /* =========================================================
     PARTNERSHIP TIERS (monthly giving)
     ========================================================= */
  (function partnership() {
    const wrap = $("#partnershipTiers");
    if (!wrap) return;
    const tiers = Array.isArray(CFG.partnership) ? CFG.partnership : [];
    if (!tiers.length) { wrap.remove(); return; }
    wrap.innerHTML = tiers.map((t) => `
      <div class="tier-card ${t.featured ? "tier-featured" : ""}">
        ${t.featured ? '<span class="tier-badge">Most Popular</span>' : ""}
        <h3 class="font-serif text-xl font-700 ${t.featured ? "text-white" : "text-navy"}">${t.name}</h3>
        <p class="mt-2 font-serif text-3xl font-700 ${t.featured ? "text-gold-light" : "text-navy"}">₦${Number(t.amount).toLocaleString("en-US")}<span class="text-sm font-sans font-400 ${t.featured ? "text-blue-100/70" : "text-gray-400"}">/mo</span></p>
        <p class="mt-3 text-sm ${t.featured ? "text-blue-100/80" : "text-gray-600"}">${t.perks || ""}</p>
        <button type="button" class="tier-choose ${t.featured ? "tier-choose-light" : ""}" data-amount="${t.amount}">Become a Partner</button>
      </div>`).join("");

    $$(".tier-choose", wrap).forEach((btn) => {
      btn.addEventListener("click", () => {
        if (window.__openPartner) window.__openPartner(btn.dataset.amount);
        else if (window.__openGive) window.__openGive(btn.dataset.amount);
      });
    });
  })();

  /* =========================================================
     WATCH LIVE
     ========================================================= */
  const applyWatchLive = (url) => {
    const wrap = $("#liveWrap");
    if (!wrap) return;
    const id = youtubeId(url || "");
    if (id) {
      wrap.innerHTML = `<iframe class="absolute inset-0 w-full h-full" src="https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1" title="Live broadcast" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
    } else {
      wrap.innerHTML = `<a href="${CFG.youtubeChannel || "#"}" target="_blank" rel="noopener" class="live-poster"${CFG.livePoster ? ` style="background-image:url('${CFG.livePoster}')"` : ""}><span class="live-play"><svg class="h-8 w-8" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span><span class="text-white font-600 text-lg">Tap to watch on YouTube</span></a>`;
    }
    if (CFG.liveTitle) { const t = $("#liveTitle"); if (t) t.textContent = CFG.liveTitle; }
    if (CFG.liveBlurb) { const b = $("#liveBlurb"); if (b) b.textContent = CFG.liveBlurb; }
    const yt = $("#watchYoutube");
    if (yt) yt.href = CFG.youtubeChannel || "#";
  };

  /* ---------- Load & distribute all videos (Supabase-managed) ----------
     One Supabase `videos` table drives every video on the page:
       • a row with section "Watch Live" → the live player
       • a row with section "Featured"   → the big featured video
       • every other row → grouped Message sections + the On-Demand wall */
  const distributeVideos = (items) => {
    items = Array.isArray(items) ? items : [];
    const live = items.find((v) => (v.section || "") === "Watch Live");
    applyWatchLive(live ? live.youtube : CFG.liveEmbedUrl);
    const big = items.find((v) => (v.section || "") === "Featured")
      || items.find((s) => s.mode !== "link" && youtubeId(s.youtube));
    applyBigVideo(big);
    renderSections(items.filter((v) => !RESERVED.includes(v.section || "")));
    renderGallery(items);
  };
  distributeVideos(CFG.sermons || []);     // instant paint from config
  (async () => {                            // then let Supabase take over
    if (window.MinistryDB && MinistryDB.enabled && MinistryDB.getVideos) {
      try { const rows = await MinistryDB.getVideos(); if (rows && rows.length) distributeVideos(rows); } catch (_) {}
    }
  })();

  /* =========================================================
     HERO SLIDER  (multiple banner images, click prev/next/dots)
     ========================================================= */
  const buildHero = (imgs) => {
    const wrap = $("#heroSlides");
    if (!wrap || !imgs.length) return;
    wrap.innerHTML = imgs.map((src, i) =>
      `<div class="hero-slide ${i === 0 ? "active" : ""}" style="background-image:url('${src}')"></div>`).join("");
    const dotsWrap = $("#heroDots");
    if (dotsWrap) dotsWrap.innerHTML = imgs.map((_, i) =>
      `<button class="hero-dot ${i === 0 ? "active" : ""}" data-i="${i}" aria-label="Go to slide ${i + 1}"></button>`).join("");
    const slides = $$(".hero-slide", wrap);
    const dots = dotsWrap ? $$(".hero-dot", dotsWrap) : [];
    let idx = 0, timer = null;
    const go = (n) => {
      idx = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle("active", i === idx));
      dots.forEach((d, i) => d.classList.toggle("active", i === idx));
    };
    const start = () => { stop(); if (slides.length > 1) timer = setInterval(() => go(idx + 1), 6000); };
    const stop = () => { if (timer) clearInterval(timer); };
    $("#heroNext")?.addEventListener("click", () => { go(idx + 1); start(); });
    $("#heroPrev")?.addEventListener("click", () => { go(idx - 1); start(); });
    dots.forEach((d) => d.addEventListener("click", () => { go(+d.dataset.i); start(); }));
    start();
  };
  // Hero images: from Supabase `hero_slides` when available, else config.
  (async function heroSlider() {
    let imgs = (Array.isArray(CFG.heroSlides) && CFG.heroSlides.length)
      ? CFG.heroSlides.slice() : ["assets/img/hero-banner.svg"];
    if (window.MinistryDB && MinistryDB.enabled && MinistryDB.getHeroSlides) {
      try { const rows = await MinistryDB.getHeroSlides(); if (rows && rows.length) imgs = rows; } catch (_) {}
    }
    buildHero(imgs);
  })();

  /* ---------- Mobile dropdown accordions ---------- */
  $$("[data-msub]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const el = document.getElementById(btn.dataset.msub);
      if (!el) return;
      el.classList.toggle("open");
      const sign = btn.querySelector("span");
      if (sign) sign.textContent = el.classList.contains("open") ? "－" : "＋";
    });
  });

  /* =========================================================
     WELCOME DONATION POPUP  (on load, closable)
     ========================================================= */
  (function welcomePopup() {
    const wm = $("#welcomeModal");
    if (!wm || CFG.showPopup === false) return;

    if (CFG.popupImage) { const im = $("#welcomeImage"); if (im) im.src = CFG.popupImage; }
    const KEY = "aae_seen_welcome";
    const seen = CFG.popupOnce !== false && sessionStorage.getItem(KEY) === "1";
    const open = () => {
      wm.classList.remove("hidden");
      document.body.style.overflow = "hidden";
      try { sessionStorage.setItem(KEY, "1"); } catch (_) {}
    };
    const close = () => {
      wm.classList.add("hidden");
      document.body.style.overflow = "";
    };
    $$("[data-close-welcome]").forEach((el) => el.addEventListener("click", close));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !wm.classList.contains("hidden")) close();
    });
    // The amount chips + "Give Now" are [data-give] → they open the give modal.
    if (!seen) setTimeout(open, Number(CFG.popupDelay) || 1200);
  })();

  /* =========================================================
     LOGIN / ACCOUNT  (Supabase)
     ========================================================= */
  (function auth() {
    const am = $("#authModal");
    if (!am) return;
    const form = $("#authForm");
    const emailEl = $("#authEmail");
    const passEl = $("#authPassword");
    const submit = $("#authSubmit");
    const titleEl = $("#authTitle");
    const subEl = $("#authSubtitle");
    const toggle = $("#authToggle");
    const toggleText = $("#authToggleText");
    const statusEl = $("#authStatus");
    const btnText = $("#loginBtnText");
    const db = window.MinistryDB;
    let mode = "in"; // "in" | "up"
    let currentUser = null;

    const open = () => { am.classList.remove("hidden"); document.body.style.overflow = "hidden"; emailEl.focus(); };
    const close = () => { am.classList.add("hidden"); document.body.style.overflow = ""; };
    const setStatus = (msg, ok) => {
      statusEl.textContent = msg;
      statusEl.classList.remove("hidden");
      statusEl.classList.toggle("text-green-600", !!ok);
      statusEl.classList.toggle("text-red-500", !ok);
    };

    const render = () => {
      if (mode === "in") {
        titleEl.textContent = "Welcome back";
        subEl.textContent = "Sign in to your member account.";
        submit.textContent = "Sign In";
        toggleText.textContent = "New here?";
        toggle.textContent = "Create an account";
      } else {
        titleEl.textContent = "Create account";
        subEl.textContent = "Join the ministry's online community.";
        submit.textContent = "Sign Up";
        toggleText.textContent = "Already a member?";
        toggle.textContent = "Sign in";
      }
      statusEl.classList.add("hidden");
    };

    const updateNav = (user) => {
      currentUser = user;
      if (!btnText) return;
      btnText.textContent = user ? (user.email.split("@")[0]) : "Login";
    };

    // Open triggers
    const openOrInfo = () => {
      if (!db || !db.enabled) {
        open();
        setStatus("Login isn't active yet — add your Supabase keys in config.js.", false);
        return;
      }
      if (currentUser) {
        // Logged in → offer sign out
        db.signOut().then(() => { updateNav(null); showToast("Signed out."); });
        return;
      }
      render();
      open();
    };
    $("#loginBtn")?.addEventListener("click", openOrInfo);
    $("#loginBtnMobile")?.addEventListener("click", openOrInfo);
    $$("[data-close-auth]").forEach((el) => el.addEventListener("click", close));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !am.classList.contains("hidden")) close();
    });
    toggle?.addEventListener("click", () => { mode = mode === "in" ? "up" : "in"; render(); });

    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!db || !db.enabled) { setStatus("Supabase isn't configured yet.", false); return; }
      const email = emailEl.value.trim();
      const pass = passEl.value;
      if (!email || pass.length < 6) { setStatus("Enter a valid email and a 6+ char password.", false); return; }
      submit.disabled = true;
      submit.textContent = "Please wait…";
      const res = mode === "in" ? await db.signIn(email, pass) : await db.signUp(email, pass);
      submit.disabled = false;
      render();
      if (res.ok) {
        if (mode === "up") {
          setStatus("Account created! Check your email to confirm, then sign in.", true);
          mode = "in"; render();
        } else {
          showToast("Welcome back! You're signed in.");
          close();
        }
      } else {
        setStatus((res.error && res.error.message) || "Something went wrong. Try again.", false);
      }
    });

    // Reflect existing session + live changes
    if (db && db.enabled) {
      db.getUser().then(updateNav);
      db.onAuthChange(updateNav);
    }
  })();
})();
