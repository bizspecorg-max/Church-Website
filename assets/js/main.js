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
      } catch (_) { /* fall through to mailto */ }
    }
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

  /* ---------- Render sermons from config ----------
     Edit the list in assets/js/config.js — cards rebuild here.
     Thumbnails are derived from each YouTube link automatically. */
  const renderSermons = () => {
    const grid = $("#sermonGrid");
    if (!grid) return;
    const sermons = Array.isArray(CFG.sermons) ? CFG.sermons : [];
    const fallbacks = ["assets/img/sermon-1.svg", "assets/img/sermon-2.svg", "assets/img/sermon-3.svg"];
    grid.innerHTML = sermons.map((s, i) => {
      const href = s.youtube || CFG.youtubeChannel || "#";
      const thumb = s.thumbnail || youtubeThumb(s.youtube) || fallbacks[i % 3];
      const fb = fallbacks[i % 3];
      const safeTitle = (s.title || "Message").replace(/"/g, "&quot;");
      return `
        <article class="sermon-card reveal">
          <a href="${href}" target="_blank" rel="noopener" class="block relative" aria-label="Watch: ${safeTitle}">
            <img src="${thumb}" onerror="this.onerror=null;this.src='${fb}'" alt="${safeTitle} thumbnail" loading="lazy" class="w-full" />
            <span class="play-overlay"><svg class="h-7 w-7" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
          </a>
          <div class="p-5">
            <time class="text-xs text-gold-dark font-600 uppercase tracking-wide">${s.date || ""}</time>
            <h3 class="font-serif text-xl font-700 text-navy mt-1">${safeTitle}</h3>
            <p class="text-sm text-gray-600 mt-2">${s.blurb || ""}</p>
            <a href="${href}" target="_blank" rel="noopener" class="btn-watch mt-4">▶ Watch Message</a>
          </div>
        </article>`;
    }).join("");
  };
  renderSermons();

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
  }

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

  /* ---------- Donation amount cards ---------- */
  const amountInput = $("#donorAmount");
  $$(".amount-card").forEach((card) => {
    card.addEventListener("click", () => {
      $$(".amount-card").forEach((c) => c.classList.remove("active"));
      card.classList.add("active");
      const val = card.dataset.amount;
      if (val === "custom") {
        amountInput.value = "";
        amountInput.focus();
      } else {
        amountInput.value = val;
      }
      amountInput.classList.remove("invalid");
    });
  });
  // Typing a custom value clears the preset highlight unless it matches
  amountInput?.addEventListener("input", () => {
    $$(".amount-card").forEach((c) =>
      c.classList.toggle("active", c.dataset.amount === amountInput.value)
    );
  });

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

  /* ---------- Donation form → modal ---------- */
  const donationForm = $("#donationForm");
  const modal = $("#donationModal");
  let donation = { name: "", email: "", phone: "", amount: 0 };
  let donationLeadSent = false;

  // Email the donor's details (captured the moment they submit, before paying)
  // and save to Supabase if it's configured.
  const captureDonationLead = () => {
    const payload = {
      Name: donation.name,
      Email: donation.email,
      Phone: donation.phone,
      Amount: "₦" + donation.amount.toLocaleString("en-US"),
      amountValue: donation.amount,
      Status: "Details submitted (pre-payment)",
    };
    sendLead("New Donation — ₦" + donation.amount.toLocaleString("en-US"), payload);
    if (window.MinistryDB && MinistryDB.enabled) MinistryDB.saveDonation(payload);
    donationLeadSent = true;
  };

  const openModal = () => {
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    $("#payNowBtn").focus();
  };
  const closeModal = () => {
    modal.classList.remove("open");
    document.body.style.overflow = "";
  };
  $$("[data-close-modal]").forEach((el) => el.addEventListener("click", closeModal));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  donationForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fields = ["#donorName", "#donorEmail", "#donorPhone", "#donorAmount"].map((s) => $(s));
    const allValid = fields.map(validateField).every(Boolean);
    const amount = parseInt(amountInput.value, 10) || 0;
    if (!allValid || amount < 100) {
      if (amount < 100) amountInput.classList.add("invalid");
      showToast("Please complete all fields with a valid amount (min ₦100).");
      return;
    }
    donation = {
      name: $("#donorName").value.trim(),
      email: $("#donorEmail").value.trim(),
      phone: $("#donorPhone").value.trim(),
      amount,
    };
    donationLeadSent = false;
    $("#sumName").textContent = donation.name;
    $("#sumEmail").textContent = donation.email;
    $("#sumPhone").textContent = donation.phone;
    $("#sumAmount").textContent = "₦" + donation.amount.toLocaleString("en-US");
    // If a Formspree endpoint is configured, email the lead silently right away.
    if (FORM_ENDPOINT) captureDonationLead();
    openModal();
  });

  /* ---------- Paystack payment ---------- */
  $("#payNowBtn")?.addEventListener("click", () => {
    // Make sure the donor's details reach the inbox even if they don't finish paying.
    if (!donationLeadSent) captureDonationLead();
    if (!PAYSTACK_PUBLIC_KEY) {
      // Demo / placeholder mode — no key configured yet.
      closeModal();
      showToast("✅ Demo: ₦" + donation.amount.toLocaleString() + " donation captured. Add a Paystack key to go live.");
      donationForm.reset();
      $$(".amount-card").forEach((c) => c.classList.remove("active"));
      return;
    }
    if (typeof PaystackPop === "undefined") {
      showToast("Payment library failed to load. Please check your connection.");
      return;
    }
    const handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: donation.email,
      amount: donation.amount * 100, // Paystack expects the smallest unit (kobo)
      currency: CURRENCY,
      metadata: {
        custom_fields: [
          { display_name: "Full Name", variable_name: "full_name", value: donation.name },
          { display_name: "Phone", variable_name: "phone", value: donation.phone },
        ],
      },
      callback: function (response) {
        closeModal();
        showToast("🎉 Thank you! Payment reference: " + response.reference);
        donationForm.reset();
        $$(".amount-card").forEach((c) => c.classList.remove("active"));
      },
      onClose: function () {
        showToast("Payment window closed. You can try again anytime.");
      },
    });
    handler.openIframe();
  });

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
        if (amountInput) amountInput.value = btn.dataset.amount;
        $$(".amount-card", $("#amountGrid")).forEach((c) =>
          c.classList.toggle("active", c.dataset.amount === btn.dataset.amount)
        );
        document.getElementById("donate").scrollIntoView({ behavior: "smooth" });
        setTimeout(() => $("#donorName")?.focus(), 500);
      });
    });
  })();

  /* =========================================================
     WATCH LIVE
     ========================================================= */
  (function watchLive() {
    const frame = $("#liveFrame");
    if (!frame) return;
    const toEmbed = (u = "") => {
      if (!u) return "";
      if (u.includes("/embed")) return u;
      const id = youtubeId(u);
      if (id) return `https://www.youtube.com/embed/${id}`;
      // channel /live or search-style URLs: hand off as-is
      return u.replace("watch?v=", "embed/");
    };
    frame.src = toEmbed(CFG.liveEmbedUrl);
    if (CFG.liveTitle) { const t = $("#liveTitle"); if (t) t.textContent = CFG.liveTitle; }
    if (CFG.liveBlurb) { const b = $("#liveBlurb"); if (b) b.textContent = CFG.liveBlurb; }
    const yt = $("#watchYoutube");
    if (yt) yt.href = CFG.youtubeChannel || "#";
  })();

  /* =========================================================
     WELCOME DONATION POPUP  (on load, closable)
     ========================================================= */
  (function welcomePopup() {
    const wm = $("#welcomeModal");
    if (!wm || CFG.showPopup === false) return;

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
    // Pre-select an amount on the main donation form, then let "Give Now" scroll.
    $$("#welcomeAmounts .amount-card").forEach((card) => {
      card.addEventListener("click", () => {
        $$("#welcomeAmounts .amount-card").forEach((c) => c.classList.remove("active"));
        card.classList.add("active");
        if (amountInput) amountInput.value = card.dataset.amount;
        $$(".amount-card", $("#amountGrid")).forEach((c) =>
          c.classList.toggle("active", c.dataset.amount === card.dataset.amount)
        );
      });
    });

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
