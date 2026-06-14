/* =========================================================
   Ministry Admin — manage videos, hero images, and view
   contact + donation submissions. Powered by Supabase.
   Access is restricted by the `admins` table (see supabase-admin.sql).
   ========================================================= */
(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const CFG = window.MINISTRY_CONFIG || {};
  const lib = window.supabase;
  const ready = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && lib && lib.createClient);
  const db = ready ? lib.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey) : null;

  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m]));
  let toastT;
  const toast = (m) => { const t = $("#toast"); t.textContent = m; t.classList.remove("hidden"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.add("hidden"), 3200); };

  /* ---------- Auth ---------- */
  const loginView = $("#loginView"), dashView = $("#dashView");
  const showDash = (user) => {
    loginView.classList.add("hidden");
    dashView.classList.remove("hidden");
    $("#whoami").textContent = user.email;
    checkAdmin(user.email);
    loadAll();
  };
  const showLogin = () => { dashView.classList.add("hidden"); loginView.classList.remove("hidden"); };

  if (!ready) { $("#configWarn").classList.remove("hidden"); }

  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!db) return;
    const status = $("#loginStatus");
    const btn = $("#loginSubmit");
    btn.disabled = true; btn.textContent = "Signing in…";
    // Allow a simple username (e.g. "admin") → maps to admin@dinabtv.com.
    const raw = $("#email").value.trim();
    const ADMIN_DOMAIN = (CFG.adminEmailDomain || "dinabtv.com");
    const email = raw.includes("@") ? raw : `${raw}@${ADMIN_DOMAIN}`;
    const { data, error } = await db.auth.signInWithPassword({ email, password: $("#password").value });
    btn.disabled = false; btn.textContent = "Sign In";
    if (error) { status.textContent = error.message; status.className = "text-sm text-center text-red-500"; status.classList.remove("hidden"); return; }
    showDash(data.user);
  });

  $("#signOut").addEventListener("click", async () => { await db.auth.signOut(); showLogin(); });

  async function checkAdmin(email) {
    const { data } = await db.from("admins").select("email").eq("email", email).maybeSingle();
    $("#notAdmin").classList.toggle("hidden", !!data);
  }

  // Resume an existing session
  if (db) db.auth.getUser().then(({ data }) => { if (data && data.user) showDash(data.user); });

  /* ---------- Tabs ---------- */
  $$(".admin-tab").forEach((tab) => tab.addEventListener("click", () => {
    $$(".admin-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    $$(".admin-panel").forEach((p) => p.classList.add("hidden"));
    $("#tab-" + tab.dataset.tab).classList.remove("hidden");
  }));

  const loadAll = () => { loadVideos(); loadHero(); loadPartners(); loadMessages(); loadDonations(); };

  /* ---------- Edit modal ---------- */
  const editModal = $("#editModal"), editForm = $("#editForm"), editTitle = $("#editTitle");
  const openEdit = () => { editModal.classList.remove("hidden"); document.body.style.overflow = "hidden"; };
  const closeEdit = () => { editModal.classList.add("hidden"); document.body.style.overflow = ""; editForm.innerHTML = ""; };
  $$("[data-close-edit]").forEach((el) => el.addEventListener("click", closeEdit));

  const field = (label, name, value, type = "text") => `
    <div><label class="form-label">${label}</label>
    <input class="form-input" name="${name}" type="${type}" value="${esc(value)}" /></div>`;
  const textarea = (label, name, value) => `
    <div><label class="form-label">${label}</label>
    <textarea class="form-input" name="${name}" rows="3">${esc(value)}</textarea></div>`;
  const select = (label, name, value, opts) => `
    <div><label class="form-label">${label}</label>
    <select class="form-input" name="${name}">${opts.map((o) => `<option value="${o}" ${o === value ? "selected" : ""}>${o}</option>`).join("")}</select></div>`;
  const fieldList = (label, name, value, opts) => `
    <div><label class="form-label">${label}</label>
    <input class="form-input" name="${name}" type="text" value="${esc(value)}" list="dl_${name}" autocomplete="off" />
    <datalist id="dl_${name}">${opts.map((o) => `<option value="${esc(o)}">`).join("")}</datalist></div>`;
  const checkbox = (label, name, checked) => `
    <label class="flex items-center gap-2 text-sm font-600 text-slate-600"><input type="checkbox" name="${name}" ${checked ? "checked" : ""} class="h-4 w-4" /> ${label}</label>`;
  const formData = (form) => {
    const o = {};
    $$("[name]", form).forEach((el) => { o[el.name] = el.type === "checkbox" ? el.checked : el.value; });
    return o;
  };

  /* ---------- VIDEOS ---------- */
  const SECTION_NOTE = {
    "Watch Live": "drives the live player",
    "Featured": "drives the big featured video",
  };
  let knownSections = ["Recent Messages", "Praise & Worship", "Crusades & Conferences", "Watch Live", "Featured"];

  const videoRow = (v) => `
    <div class="bg-white rounded-xl shadow-sm border p-4 flex items-center gap-4">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-[11px] px-2 py-0.5 rounded-full ${v.play_mode === "link" ? "bg-slate-100 text-slate-600" : "bg-green-100 text-green-700"}">${v.play_mode === "link" ? "opens YouTube" : "plays on-site"}</span>
          ${v.published ? "" : '<span class="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">hidden</span>'}
          ${v.category ? `<span class="text-[11px] text-slate-400">${esc(v.category)}</span>` : ""}
        </div>
        <p class="font-600 text-navy truncate mt-0.5">${esc(v.title)}</p>
        <p class="text-xs text-slate-400 truncate">${esc(v.youtube_url)}</p>
      </div>
      <div class="flex-none flex gap-2">
        <button class="text-sm font-600 text-navy hover:text-gold-dark" data-edit-video='${esc(JSON.stringify(v))}'>Edit</button>
        <button class="text-sm font-600 text-red-500 hover:text-red-700" data-del-video="${v.id}">Delete</button>
      </div>
    </div>`;

  async function loadVideos() {
    const { data, error } = await db.from("videos").select("*").order("sort_order", { ascending: true });
    const wrap = $("#videosList");
    if (error) { wrap.innerHTML = `<p class="text-red-500 text-sm">${esc(error.message)}</p>`; return; }
    if (!data.length) { wrap.innerHTML = `<p class="text-slate-500 text-sm">No videos yet — click “Add video”.</p>`; return; }
    // group by section
    const order = []; const groups = {};
    data.forEach((v) => { const s = v.section || "Recent Messages"; if (!groups[s]) { groups[s] = []; order.push(s); } groups[s].push(v); });
    knownSections = Array.from(new Set([...order, ...knownSections]));
    wrap.innerHTML = order.map((sec) => `
      <div class="mb-7">
        <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
          <h3 class="font-700 text-navy flex items-center gap-2">
            <span class="h-4 w-1.5 rounded bg-gold"></span>${esc(sec)}
            <span class="text-xs font-400 text-slate-400">${groups[sec].length} video${groups[sec].length > 1 ? "s" : ""}${SECTION_NOTE[sec] ? " · " + SECTION_NOTE[sec] : ""}</span>
          </h3>
          <button class="text-sm font-600 text-gold-dark hover:underline" data-add-section="${esc(sec)}">+ Add to this section</button>
        </div>
        <div class="space-y-2">${groups[sec].map(videoRow).join("")}</div>
      </div>`).join("");
    $$("[data-edit-video]", wrap).forEach((b) => b.addEventListener("click", () => editVideo(JSON.parse(b.dataset.editVideo))));
    $$("[data-del-video]", wrap).forEach((b) => b.addEventListener("click", () => delRow("videos", b.dataset.delVideo, loadVideos)));
    $$("[data-add-section]", wrap).forEach((b) => b.addEventListener("click", () => editVideo({ section: b.dataset.addSection, play_mode: "inline", published: true, sort_order: 0 })));
  }

  function editVideo(v) {
    v = v || { play_mode: "inline", published: true, sort_order: 0 };
    editTitle.textContent = v.id ? "Edit video" : "Add video";
    editForm.innerHTML =
      field("Title", "title", v.title || "") +
      fieldList('Section — pick or type a new one ("Watch Live" / "Featured" are special)', "section", v.section || "Recent Messages", knownSections) +
      field("Label (e.g. Prophetic Word)", "category", v.category || "") +
      field("YouTube link", "youtube_url", v.youtube_url || "") +
      textarea("Description", "description", v.description || "") +
      select("Play mode", "play_mode", v.play_mode || "inline", ["inline", "link"]) +
      field("Sort order", "sort_order", v.sort_order ?? 0, "number") +
      checkbox("Published (visible on site)", "published", v.published !== false) +
      `<button type="submit" class="btn-navy w-full justify-center py-3">Save</button>`;
    editForm.onsubmit = async (e) => {
      e.preventDefault();
      const d = formData(editForm);
      d.sort_order = parseInt(d.sort_order, 10) || 0;
      const q = v.id ? db.from("videos").update(d).eq("id", v.id) : db.from("videos").insert([d]);
      const { error } = await q;
      if (error) return toast("Error: " + error.message);
      closeEdit(); toast("Saved."); loadVideos();
    };
    openEdit();
  }
  $("#addVideo").addEventListener("click", () => editVideo(null));

  /* ---------- HERO ---------- */
  async function loadHero() {
    const { data, error } = await db.from("hero_slides").select("*").order("sort_order", { ascending: true });
    const wrap = $("#heroList");
    if (error) { wrap.innerHTML = `<p class="text-red-500 text-sm">${esc(error.message)}</p>`; return; }
    if (!data.length) { wrap.innerHTML = `<p class="text-slate-500 text-sm">No hero images yet.</p>`; return; }
    wrap.innerHTML = data.map((h) => `
      <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
        <img src="${esc(h.image_url)}" alt="" class="w-full h-32 object-cover" />
        <div class="p-3 flex items-center justify-between">
          <span class="text-xs text-slate-500">order ${h.sort_order}${h.published ? "" : " · hidden"}</span>
          <div class="flex gap-2">
            <button class="text-sm font-600 text-navy hover:text-gold-dark" data-edit-hero='${esc(JSON.stringify(h))}'>Edit</button>
            <button class="text-sm font-600 text-red-500" data-del-hero="${h.id}">Delete</button>
          </div>
        </div>
      </div>`).join("");
    $$("[data-edit-hero]", wrap).forEach((b) => b.addEventListener("click", () => editHero(JSON.parse(b.dataset.editHero))));
    $$("[data-del-hero]", wrap).forEach((b) => b.addEventListener("click", () => delRow("hero_slides", b.dataset.delHero, loadHero)));
  }

  function editHero(h) {
    h = h || { sort_order: 0, published: true };
    editTitle.textContent = h.id ? "Edit hero image" : "Add hero image";
    editForm.innerHTML =
      field("Image URL", "image_url", h.image_url || "") +
      field("Headline (optional)", "headline", h.headline || "") +
      field("Sort order", "sort_order", h.sort_order ?? 0, "number") +
      checkbox("Published", "published", h.published !== false) +
      `<button type="submit" class="btn-navy w-full justify-center py-3">Save</button>`;
    editForm.onsubmit = async (e) => {
      e.preventDefault();
      const d = formData(editForm);
      d.sort_order = parseInt(d.sort_order, 10) || 0;
      const q = h.id ? db.from("hero_slides").update(d).eq("id", h.id) : db.from("hero_slides").insert([d]);
      const { error } = await q;
      if (error) return toast("Error: " + error.message);
      closeEdit(); toast("Saved."); loadHero();
    };
    openEdit();
  }
  $("#addHero").addEventListener("click", () => editHero(null));

  /* ---------- Delete helper ---------- */
  async function delRow(table, id, reload) {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    const { error } = await db.from(table).delete().eq("id", id);
    if (error) return toast("Error: " + error.message);
    toast("Deleted."); reload();
  }

  /* ---------- PARTNERS (read-only) ---------- */
  async function loadPartners() {
    const { data, error } = await db.from("partners").select("*").order("created_at", { ascending: false });
    const wrap = $("#partnersList");
    if (error) { wrap.innerHTML = `<p class="text-red-500 text-sm">${esc(error.message)}</p>`; return; }
    if (!data.length) { wrap.innerHTML = `<p class="text-slate-500 text-sm">No partners yet.</p>`; return; }
    wrap.innerHTML = `
      <p class="mb-3 text-sm text-slate-600">${data.length} partners</p>
      <table class="w-full text-sm bg-white rounded-xl overflow-hidden shadow-sm">
        <thead class="bg-slate-50 text-slate-500 text-left"><tr>
          <th class="p-3">Date</th><th class="p-3">Name</th><th class="p-3">Email</th><th class="p-3">Phone</th><th class="p-3">Country</th><th class="p-3">Monthly</th><th class="p-3">Status</th>
        </tr></thead>
        <tbody>${data.map((d) => `<tr class="border-t">
          <td class="p-3 text-slate-400 whitespace-nowrap">${new Date(d.created_at).toLocaleDateString()}</td>
          <td class="p-3 font-600 text-navy">${esc(d.name)}</td>
          <td class="p-3">${esc(d.email)}</td>
          <td class="p-3">${esc(d.phone)}</td>
          <td class="p-3">${esc(d.country)}</td>
          <td class="p-3 font-700">₦${Number(d.amount || 0).toLocaleString("en-US")}</td>
          <td class="p-3 text-slate-500">${esc(d.status)}</td>
        </tr>`).join("")}</tbody>
      </table>`;
  }

  /* ---------- MESSAGES (read-only) ---------- */
  async function loadMessages() {
    const { data, error } = await db.from("contacts").select("*").order("created_at", { ascending: false });
    const wrap = $("#messagesList");
    if (error) { wrap.innerHTML = `<p class="text-red-500 text-sm">${esc(error.message)}</p>`; return; }
    if (!data.length) { wrap.innerHTML = `<p class="text-slate-500 text-sm">No messages yet.</p>`; return; }
    wrap.innerHTML = data.map((m) => `
      <div class="bg-white rounded-xl shadow-sm border p-4">
        <div class="flex items-center justify-between gap-2">
          <p class="font-600 text-navy">${esc(m.name)} <span class="text-slate-400 font-400">· ${esc(m.email)}</span></p>
          <span class="text-xs text-slate-400">${new Date(m.created_at).toLocaleString()}</span>
        </div>
        ${m.subject ? `<p class="text-sm font-600 text-slate-600 mt-1">${esc(m.subject)}</p>` : ""}
        <p class="text-sm text-slate-600 mt-1 whitespace-pre-line">${esc(m.message)}</p>
      </div>`).join("");
  }

  /* ---------- DONATIONS (read-only) ---------- */
  async function loadDonations() {
    const { data, error } = await db.from("donations").select("*").order("created_at", { ascending: false });
    const wrap = $("#donationsList");
    if (error) { wrap.innerHTML = `<p class="text-red-500 text-sm">${esc(error.message)}</p>`; return; }
    if (!data.length) { wrap.innerHTML = `<p class="text-slate-500 text-sm">No donations yet.</p>`; return; }
    const total = data.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    wrap.innerHTML = `
      <p class="mb-3 text-sm text-slate-600">${data.length} entries · captured total <span class="font-700 text-navy">₦${total.toLocaleString("en-US")}</span></p>
      <table class="w-full text-sm bg-white rounded-xl overflow-hidden shadow-sm">
        <thead class="bg-slate-50 text-slate-500 text-left"><tr>
          <th class="p-3">Date</th><th class="p-3">Name</th><th class="p-3">Email</th><th class="p-3">Phone</th><th class="p-3">Amount</th><th class="p-3">Status</th>
        </tr></thead>
        <tbody>${data.map((d) => `<tr class="border-t">
          <td class="p-3 text-slate-400 whitespace-nowrap">${new Date(d.created_at).toLocaleDateString()}</td>
          <td class="p-3 font-600 text-navy">${esc(d.name)}</td>
          <td class="p-3">${esc(d.email)}</td>
          <td class="p-3">${esc(d.phone)}</td>
          <td class="p-3 font-700">₦${Number(d.amount || 0).toLocaleString("en-US")}</td>
          <td class="p-3 text-slate-500">${esc(d.status)}</td>
        </tr>`).join("")}</tbody>
      </table>`;
  }
})();
