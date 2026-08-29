/* =========================================================
   Member / Partner portal — sign in, see partnership status,
   renew (Paystack), and view giving history. Powered by Supabase.
   ========================================================= */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const CFG = window.MINISTRY_CONFIG || {};
  const lib = window.supabase;
  const ready = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && lib && lib.createClient);
  const db = ready ? lib.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey) : null;
  const PAYSTACK = CFG.paystackPublicKey || "";
  const PAYSTACK_READY = CFG.paystackReady === true && !!PAYSTACK;
  const CURRENCY = CFG.currency || "NGN";
  const bankPanelHTML = () => {
    const B = SETTINGS.bank || {};
    return `
    <div class="bank-card">
      <p class="bank-card__head">Transfer to:</p>
      <dl class="bank-card__rows">
        <div><dt>Account Name</dt><dd>${B.name || ""}</dd></div>
        <div>
          <dt>Account Number</dt>
          <dd class="bank-card__acct">
            <span data-acct>${B.number || ""}</span>
            <button type="button" class="bank-copy" data-copy="${B.number || ""}">Copy</button>
          </dd>
        </div>
        <div><dt>Bank</dt><dd>${B.bank || ""}</dd></div>
        ${B.momo ? `
        <div>
          <dt>MoMo Money (MTN)</dt>
          <dd class="bank-card__acct">
            <span data-acct>${B.momo}</span>
            <button type="button" class="bank-copy" data-copy="${B.momo}">Copy</button>
          </dd>
        </div>` : ""}
        ${B.opay ? `
        <div>
          <dt>Opay</dt>
          <dd class="bank-card__acct">
            <span data-acct>${B.opay}</span>
            <button type="button" class="bank-copy" data-copy="${B.opay}">Copy</button>
          </dd>
          ${B.opayName ? `<dd class="bank-card__subname">${B.opayName}</dd>` : ""}
        </div>` : ""}
        ${B.paypal ? `
        <div class="bank-card__paypal">
          <dt>Or pay with PayPal</dt>
          <dd class="bank-card__acct">
            <span class="bank-card__mail">${B.paypal}</span>
            <button type="button" class="bank-copy" data-copy="${B.paypal}">Copy</button>
          </dd>
        </div>` : ""}
      </dl>
      ${B.note ? `<p class="bank-card__note">${B.note}</p>` : ""}
    </div>`;
  };
  // Copy-to-clipboard for account numbers, delegated so it works on
  // panels rendered after this listener is attached.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const text = btn.dataset.copy;
    const done = () => { const o = btn.textContent; btn.textContent = "Copied ✓"; setTimeout(() => (btn.textContent = o), 1600); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(() => done());
  });
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const fmt = (n) => "₦" + Number(n || 0).toLocaleString("en-US");
  let toastT;
  const toast = (m) => { const t = $("#toast"); t.textContent = m; t.classList.remove("hidden"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.add("hidden"), 3500); };
  let currentUser = null;

  if (!ready) { $("#configWarn").classList.remove("hidden"); }

  const SETTINGS = { bank: { ...(CFG.bankAccount || {}) } };   // admin-set values, filled in below

  /* ---------- Branding (logo + favicon follow the admin settings) ---------- */
  (async () => {
    if (!db) return;                       // config missing — keep the built-in mark
    try {
      const { data, error } = await db.from("site_content")
        .select("key, value").in("key", [
          "logo_image", "favicon_image", "contact_whatsapp",
          "bank_name", "bank_number", "bank_bank", "bank_momo", "bank_opay", "bank_opay_name", "bank_paypal", "bank_note",
        ]);
      if (error || !data) return;
      const map = {};
      data.forEach((r) => { if (r.value != null && r.value !== "") map[r.key] = r.value; });
      if (map.contact_whatsapp) SETTINGS.contact_whatsapp = map.contact_whatsapp;
      if (map.bank_name)   SETTINGS.bank.name   = map.bank_name;
      if (map.bank_number) SETTINGS.bank.number = map.bank_number;
      if (map.bank_bank)   SETTINGS.bank.bank   = map.bank_bank;
      if (map.bank_momo)   SETTINGS.bank.momo   = map.bank_momo;
      if (map.bank_opay)   SETTINGS.bank.opay   = map.bank_opay;
      if (map.bank_opay_name) SETTINGS.bank.opayName = map.bank_opay_name;
      if (map.bank_paypal) SETTINGS.bank.paypal = map.bank_paypal;
      if (map.bank_note)   SETTINGS.bank.note   = map.bank_note;
      const setSrc = (sel, v) => { const el = $(sel); if (el && v) el.src = v; };
      setSrc("#brandLogoLogin", map.logo_image);
      setSrc("#brandLogoHeader", map.logo_image);
      const fav = map.favicon_image || map.logo_image;
      if (fav) {
        const f = $("#brandFavicon");
        if (f) { f.href = fav; f.removeAttribute("type"); }
        const a = $("#brandAppleIcon");
        if (a) a.href = fav;
      }
    } catch (_) {}                          // never block the page on branding
  })();


  const showLogin = () => { $("#loginView").classList.remove("hidden"); $("#dashView").classList.add("hidden"); };
  const showDash = (user) => { currentUser = user; $("#loginView").classList.add("hidden"); $("#dashView").classList.remove("hidden"); $("#whoami").textContent = user.email; loadDashboard(user); };

  const status = (msg, ok) => { const s = $("#authStatus"); s.textContent = msg; s.className = "text-sm text-center " + (ok ? "text-green-600" : "text-red-500"); s.classList.remove("hidden"); };

  /* ---- sign in / sign up toggle ---- */
  let mode = "in";
  const render = () => {
    $("#authTitle").textContent = mode === "in" ? "Member Sign In" : "Create Member Account";
    $("#authSubmit").textContent = mode === "in" ? "Sign In" : "Sign Up";
    $("#toggleText").textContent = mode === "in" ? "New here?" : "Already have an account?";
    $("#toggleBtn").textContent = mode === "in" ? "Create account" : "Sign in";
    $("#nameRow").classList.toggle("hidden", mode === "in");
    $("#authStatus").classList.add("hidden");
  };
  $("#toggleBtn").addEventListener("click", () => { mode = mode === "in" ? "up" : "in"; render(); });
  render();

  $("#forgotBtn").addEventListener("click", async () => {
    const email = $("#email").value.trim();
    if (!email) { status("Enter your email above first, then tap Forgot password.", false); return; }
    if (!db) { status("Login isn't configured yet.", false); return; }
    const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/member.html" });
    status(error ? error.message : "Reset link sent — check your email.", !error);
  });

  $("#authForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!db) { status("Login isn't configured yet.", false); return; }
    const email = $("#email").value.trim();
    const pass = $("#password").value;
    if (!email || pass.length < 6) { status("Enter a valid email and a 6+ character password.", false); return; }
    const btn = $("#authSubmit"); btn.disabled = true; btn.textContent = "Please wait…";
    let res;
    if (mode === "up") res = await db.auth.signUp({ email, password: pass });
    else res = await db.auth.signInWithPassword({ email, password: pass });
    btn.disabled = false; render();
    if (res.error) {
      let msg = res.error.message;
      if (/confirm/i.test(msg)) msg = "Please confirm your email first — check your inbox for the confirmation link, then sign in.";
      else if (/invalid login/i.test(msg)) msg = "Wrong email or password. (If you just registered, confirm your email first.)";
      status(msg, false);
      return;
    }
    if (mode === "up") {
      const name = $("#name").value.trim();
      try { await db.from("partners").insert([{ name, email, status: "member-signup" }]); } catch (_) {}
      if (res.data.session) { showDash(res.data.user); }
      else { status("Account created! Check your email to confirm, then sign in.", true); mode = "in"; render(); }
    } else {
      showDash(res.data.user);
    }
  });

  $("#signOut").addEventListener("click", async () => { await db.auth.signOut(); showLogin(); });

  /* ---- dashboard ---- */
  async function loadDashboard(user) {
    const { data: parts } = await db.from("partners").select("*").eq("email", user.email).order("created_at", { ascending: false });
    const { data: dons } = await db.from("donations").select("*").eq("email", user.email).order("created_at", { ascending: false });
    const list = parts || [];
    const latest = list[0] || null;
    const name = (latest && latest.name) ? latest.name : user.email.split("@")[0];
    $("#memberName").textContent = name;

    if (latest) {
      $("#pAmount").textContent = fmt(latest.amount);
      $("#pStatus").textContent = latest.status || "Active";
      $("#pSince").textContent = new Date(list[list.length - 1].created_at).toLocaleDateString();
      if (!$("#renewAmount").value) $("#renewAmount").value = latest.amount || "";
    } else {
      $("#pAmount").textContent = "—"; $("#pStatus").textContent = "Not a partner yet"; $("#pSince").textContent = "—";
    }

    const hist = [
      ...(parts || []).map((p) => ({ date: p.created_at, type: "Partnership", amount: p.amount, st: p.status })),
      ...(dons || []).map((d) => ({ date: d.created_at, type: "Donation", amount: d.amount, st: d.status })),
    ].sort((a, b) => new Date(b.date) - new Date(a.date));
    const total = hist.reduce((s, h) => s + (Number(h.amount) || 0), 0);
    $("#givingTotal").textContent = fmt(total);
    $("#historyBody").innerHTML = hist.length
      ? hist.map((h) => `<tr class="border-t"><td class="p-2 text-slate-400 whitespace-nowrap">${new Date(h.date).toLocaleDateString()}</td><td class="p-2">${h.type}</td><td class="p-2 font-600">${fmt(h.amount)}</td><td class="p-2 text-slate-500">${esc(h.st || "")}</td></tr>`).join("")
      : `<tr><td colspan="4" class="p-3 text-slate-500 text-sm">No giving recorded yet.</td></tr>`;

    const wa = String(SETTINGS.contact_whatsapp || (CFG.contact && CFG.contact.whatsapp) || "").replace(/\D/g, "");
    const waBtn = $("#waContact");
    if (wa) waBtn.href = "https://wa.me/" + wa + "?text=" + encodeURIComponent("Hello, I'm a partner (" + user.email + "). I'd like to connect with the ministry.");
    else waBtn.classList.add("hidden");
  }

  /* ---- renew / give ---- */
  const renewBlock = $("#renewBankBlock");
  const record = (st, amount) => db.from("partners").insert([{ name: $("#memberName").textContent, email: currentUser.email, amount, status: st }]).then(() => loadDashboard(currentUser));
  let pendingRenewAmount = 0;

  $("#renewForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = parseInt($("#renewAmount").value, 10) || 0;
    if (amount < 100) { toast("Enter an amount (min ₦100)."); return; }

    if (!PAYSTACK_READY) {
      // Card/Online isn't live yet — show where to send the transfer,
      // same as new-partner registration, instead of faking a payment.
      pendingRenewAmount = amount;
      $("#renewBankPanel").innerHTML = bankPanelHTML();
      $("#renewAmtText").textContent = fmt(amount);
      renewBlock.classList.remove("hidden");
      $("#renewForm").classList.add("hidden");
      renewBlock.scrollIntoView({ behavior: "smooth", block: "nearest" });
      return;
    }
    if (typeof PaystackPop === "undefined") { toast("Payment library failed to load."); return; }
    PaystackPop.setup({
      key: PAYSTACK, email: currentUser.email, amount: amount * 100, currency: CURRENCY,
      metadata: { custom_fields: [{ display_name: "Type", variable_name: "type", value: "Partnership renewal" }] },
      callback: (r) => { record("renewal:" + r.reference, amount); toast("🎉 Thank you, partner! Ref: " + r.reference); },
      onClose: () => toast("Payment window closed."),
    }).openIframe();
  });

  $("#renewConfirmBtn").addEventListener("click", async () => {
    const btn = $("#renewConfirmBtn");
    const originalHTML = btn.innerHTML;
    btn.disabled = true; btn.textContent = "Recording…";
    await record("Bank transfer — awaiting confirmation", pendingRenewAmount);
    btn.disabled = false; btn.innerHTML = originalHTML;
    renewBlock.classList.add("hidden");
    $("#renewForm").classList.remove("hidden");
    $("#renewAmount").value = "";
    toast("🙏 Thank you! We'll confirm your transfer and update your status shortly.");
  });

  $("#renewCancelBtn").addEventListener("click", () => {
    renewBlock.classList.add("hidden");
    $("#renewForm").classList.remove("hidden");
  });

  // resume existing session
  if (db) db.auth.getUser().then(({ data }) => { if (data && data.user) showDash(data.user); });

  /* ---------- Show/hide toggle for password fields ---------- */
  (function passwordToggles() {
    const EYE = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
    const EYE_OFF = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 7 11 7a17.7 17.7 0 0 1-3.06 4.06M6.1 6.1C3.2 7.9 1 12 1 12a17.7 17.7 0 0 0 4.06 4.06M1 1l22 22M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>';
    document.querySelectorAll('input[type="password"]').forEach((input) => {
      if (input.dataset.pwToggled) return;
      input.dataset.pwToggled = "1";
      const wrap = document.createElement("span");
      wrap.style.cssText = "position:relative;display:block;";
      input.parentNode.insertBefore(wrap, input);
      wrap.appendChild(input);
      input.style.paddingRight = "2.75rem";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "Show password");
      btn.style.cssText = "position:absolute;right:.6rem;top:50%;transform:translateY(-50%);background:none;border:0;padding:.25rem;color:#94a3b8;cursor:pointer;line-height:0;";
      btn.innerHTML = EYE;
      wrap.appendChild(btn);
      btn.addEventListener("click", () => {
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        btn.innerHTML = show ? EYE_OFF : EYE;
        btn.setAttribute("aria-label", show ? "Hide password" : "Show password");
      });
    });
  })();
})();
