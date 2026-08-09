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
  const CURRENCY = CFG.currency || "NGN";
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  const fmt = (n) => "₦" + Number(n || 0).toLocaleString("en-US");
  let toastT;
  const toast = (m) => { const t = $("#toast"); t.textContent = m; t.classList.remove("hidden"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.add("hidden"), 3500); };
  let currentUser = null;

  if (!ready) { $("#configWarn").classList.remove("hidden"); }

  const SETTINGS = {};   // admin-set values, filled in below

  /* ---------- Branding (logo + favicon follow the admin settings) ---------- */
  (async () => {
    if (!db) return;                       // config missing — keep the built-in mark
    try {
      const { data, error } = await db.from("site_content")
        .select("key, value").in("key", ["logo_image", "favicon_image", "contact_whatsapp"]);
      if (error || !data) return;
      const map = {};
      data.forEach((r) => { if (r.value) map[r.key] = r.value; });
      if (map.contact_whatsapp) SETTINGS.contact_whatsapp = map.contact_whatsapp;
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
  $("#renewForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const amount = parseInt($("#renewAmount").value, 10) || 0;
    if (amount < 100) { toast("Enter an amount (min ₦100)."); return; }
    const name = $("#memberName").textContent;
    const record = (st) => db.from("partners").insert([{ name, email: currentUser.email, amount, status: st }]).then(() => loadDashboard(currentUser));
    if (!PAYSTACK) {
      record("renewal (demo)");
      toast("✅ Demo: " + fmt(amount) + " renewal recorded. Add a Paystack key to charge for real.");
      return;
    }
    if (typeof PaystackPop === "undefined") { toast("Payment library failed to load."); return; }
    PaystackPop.setup({
      key: PAYSTACK, email: currentUser.email, amount: amount * 100, currency: CURRENCY,
      metadata: { custom_fields: [{ display_name: "Type", variable_name: "type", value: "Partnership renewal" }] },
      callback: (r) => { record("renewal:" + r.reference); toast("🎉 Thank you, partner! Ref: " + r.reference); },
      onClose: () => toast("Payment window closed."),
    }).openIframe();
  });

  // resume existing session
  if (db) db.auth.getUser().then(({ data }) => { if (data && data.user) showDash(data.user); });
})();
