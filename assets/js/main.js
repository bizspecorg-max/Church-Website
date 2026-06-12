/* =========================================================
   Prophet AA Emmanuel Ministries — main.js
   Handles: navigation, scroll reveal, stat counters,
   donation amount selection, validation, modal & Paystack.
   ========================================================= */
(function () {
  "use strict";

  /* ----------------------------------------------------------
     PAYSTACK CONFIG  ← Add your live/test public key here.
     Get it from: https://dashboard.paystack.com/#/settings/developer
     Leaving it blank keeps the site in safe "demo" mode.
  ---------------------------------------------------------- */
  const PAYSTACK_PUBLIC_KEY = ""; // e.g. "pk_live_xxxxxxxxxxxxxxxxxxxx"
  const CURRENCY = "NGN";

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Footer year ---------- */
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

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
    $("#sumName").textContent = donation.name;
    $("#sumEmail").textContent = donation.email;
    $("#sumPhone").textContent = donation.phone;
    $("#sumAmount").textContent = "₦" + donation.amount.toLocaleString("en-US");
    openModal();
  });

  /* ---------- Paystack payment ---------- */
  $("#payNowBtn")?.addEventListener("click", () => {
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
  contactForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const fields = ["#cName", "#cEmail", "#cMessage"].map((s) => $(s));
    const valid = fields.map(validateField).every(Boolean);
    if (!valid) {
      showToast("Please fill in your name, email, and message.");
      return;
    }
    // TODO: wire to a backend / email service (e.g. Formspree, EmailJS).
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
})();
