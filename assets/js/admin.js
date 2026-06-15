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

  const loadAll = () => { loadVideos(); loadHero(); loadImages(); loadContent(); loadTestimonials(); loadPartners(); loadMessages(); loadDonations(); };

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
  // Image field: URL input + an Upload button (uploads to Supabase Storage).
  const imageField = (label, name, value) => `
    <div><label class="form-label">${label}</label>
    <div class="flex gap-2">
      <input class="form-input flex-1" name="${name}" type="text" value="${esc(value)}" placeholder="Paste an image URL, or upload →" />
      <label class="flex-none cursor-pointer bg-navy hover:bg-navy-dark text-white text-sm font-600 px-3 rounded-lg flex items-center transition">Upload<input type="file" accept="image/*" class="hidden" data-upload-for="${name}" /></label>
    </div></div>`;
  async function uploadImage(file) {
    if (!file) return null;
    try {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await db.storage.from("media").upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) { toast("Upload failed: " + error.message + " — run supabase-storage.sql, or paste a URL."); return null; }
      const { data } = db.storage.from("media").getPublicUrl(path);
      return data.publicUrl;
    } catch (e) {
      toast("Upload needs Storage enabled (run supabase-storage.sql). For now, paste an image URL.");
      return null;
    }
  }
  const wireUploads = (form) => {
    $$("[data-upload-for]", form).forEach((inp) => inp.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      toast("Uploading…");
      const url = await uploadImage(file);
      if (url) { const target = form.querySelector(`[name="${inp.dataset.uploadFor}"]`); if (target) target.value = url; toast("Uploaded ✓"); }
      e.target.value = "";
    }));
  };
  const formData = (form) => {
    const o = {};
    $$("[name]", form).forEach((el) => { o[el.name] = el.type === "checkbox" ? el.checked : el.value; });
    return o;
  };

  /* ---------- VIDEOS ---------- */
  const SECTION_NOTE = {
    "Watch Live": "single spot — only the first video here plays in the live player",
    "Featured": "single spot — only the first video here is the big featured video",
  };
  let knownSections = ["Recent Messages", "Praise & Worship", "Crusades & Conferences", "Watch Live", "Featured"];
  let videosCache = [];   // look up rows by id (avoids breaking on quotes in titles)
  let heroCache = [];

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
      <div class="flex-none flex items-center gap-2">
        <button class="h-7 w-7 rounded bg-slate-100 hover:bg-slate-200 text-navy" data-move-up="${v.id}" title="Move up">▲</button>
        <button class="h-7 w-7 rounded bg-slate-100 hover:bg-slate-200 text-navy" data-move-down="${v.id}" title="Move down">▼</button>
        <button class="text-sm font-600 text-navy hover:text-gold-dark" data-edit-id="${v.id}">Edit</button>
        <button class="text-sm font-600 text-red-500 hover:text-red-700" data-del-video="${v.id}">Delete</button>
      </div>
    </div>`;

  async function loadVideos() {
    const { data, error } = await db.from("videos").select("*").order("sort_order", { ascending: true });
    const wrap = $("#videosList");
    if (error) { wrap.innerHTML = `<p class="text-red-500 text-sm">${esc(error.message)}</p>`; return; }
    if (!data.length) { wrap.innerHTML = `<p class="text-slate-500 text-sm">No videos yet — click “Add video”.</p>`; return; }
    videosCache = data;
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
    $$("[data-edit-id]", wrap).forEach((b) => b.addEventListener("click", () => { const v = videosCache.find((x) => String(x.id) === b.dataset.editId); if (v) editVideo(v); }));
    $$("[data-del-video]", wrap).forEach((b) => b.addEventListener("click", () => delRow("videos", b.dataset.delVideo, loadVideos)));
    $$("[data-add-section]", wrap).forEach((b) => b.addEventListener("click", () => editVideo({ section: b.dataset.addSection, play_mode: "inline", published: true, sort_order: 0 })));
    $$("[data-move-up]", wrap).forEach((b) => b.addEventListener("click", () => moveVideo(b.dataset.moveUp, "up")));
    $$("[data-move-down]", wrap).forEach((b) => b.addEventListener("click", () => moveVideo(b.dataset.moveDown, "down")));
  }

  // Reorder: swap a video with its neighbour, then renumber everything 0..n.
  async function moveVideo(id, dir) {
    const { data, error } = await db.from("videos").select("id").order("sort_order", { ascending: true }).order("id", { ascending: true });
    if (error || !data) return toast("Error: " + (error ? error.message : "could not load order"));
    const ids = data.map((v) => String(v.id));
    const i = ids.indexOf(String(id));
    const j = dir === "up" ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    const { error: upErr } = await Promise.all(ids.map((vid, k) => db.from("videos").update({ sort_order: k }).eq("id", vid)))
      .then(() => ({})).catch((e) => ({ error: e }));
    if (upErr) return toast("Error reordering: " + upErr.message);
    loadVideos();
  }

  function editVideo(v) {
    v = v || { play_mode: "inline", published: true, sort_order: 0 };
    editTitle.textContent = v.id ? "Edit video" : "Add video";
    const cur = v.section || "Recent Messages";
    const opts = Array.from(new Set([cur, ...knownSections]));
    const sectionPicker = `
      <div>
        <label class="form-label">Section — where this video shows</label>
        <select class="form-input" name="section_select">
          ${opts.map((s) => `<option value="${esc(s)}" ${s === cur ? "selected" : ""}>${esc(s)}</option>`).join("")}
          <option value="__new__">➕ Add a new section…</option>
        </select>
        <input class="form-input mt-2 hidden" name="section_new" placeholder="Type a new section name" />
        <p class="text-xs text-slate-400 mt-1">"Watch Live" and "Featured" are special single-video spots.</p>
      </div>`;
    editForm.innerHTML =
      field("Title", "title", v.title || "") +
      sectionPicker +
      field("Label (e.g. Prophetic Word)", "category", v.category || "") +
      field("YouTube link", "youtube_url", v.youtube_url || "") +
      textarea("Description", "description", v.description || "") +
      select("Play mode", "play_mode", v.play_mode || "inline", ["inline", "link"]) +
      field("Sort order", "sort_order", v.sort_order ?? 0, "number") +
      checkbox("Published (visible on site)", "published", v.published !== false) +
      `<button type="submit" class="btn-navy w-full justify-center py-3">Save</button>`;
    // Reveal the "new section" box when "Add a new section…" is chosen.
    const selEl = editForm.querySelector('[name="section_select"]');
    const newEl = editForm.querySelector('[name="section_new"]');
    const syncNew = () => { newEl.classList.toggle("hidden", selEl.value !== "__new__"); if (selEl.value === "__new__") newEl.focus(); };
    selEl.addEventListener("change", syncNew); syncNew();
    editForm.onsubmit = async (e) => {
      e.preventDefault();
      const d = formData(editForm);
      d.section = d.section_select === "__new__" ? (d.section_new || "").trim() : d.section_select;
      if (!d.section) d.section = "Recent Messages";
      delete d.section_select; delete d.section_new;
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
    heroCache = data;
    wrap.innerHTML = data.map((h) => `
      <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
        <img src="${esc(h.image_url)}" alt="" class="w-full h-32 object-cover" />
        <div class="p-3 flex items-center justify-between">
          <span class="text-xs text-slate-500">order ${h.sort_order}${h.published ? "" : " · hidden"}</span>
          <div class="flex gap-2">
            <button class="text-sm font-600 text-navy hover:text-gold-dark" data-edit-hero-id="${h.id}">Edit</button>
            <button class="text-sm font-600 text-red-500" data-del-hero="${h.id}">Delete</button>
          </div>
        </div>
      </div>`).join("");
    $$("[data-edit-hero-id]", wrap).forEach((b) => b.addEventListener("click", () => { const h = heroCache.find((x) => String(x.id) === b.dataset.editHeroId); if (h) editHero(h); }));
    $$("[data-del-hero]", wrap).forEach((b) => b.addEventListener("click", () => delRow("hero_slides", b.dataset.delHero, loadHero)));
  }

  function editHero(h) {
    h = h || { sort_order: 0, published: true };
    editTitle.textContent = h.id ? "Edit hero image" : "Add hero image";
    editForm.innerHTML =
      imageField("Hero background image", "image_url", h.image_url || "") +
      field("Headline (optional)", "headline", h.headline || "") +
      field("Sort order", "sort_order", h.sort_order ?? 0, "number") +
      checkbox("Published", "published", h.published !== false) +
      `<button type="submit" class="btn-navy w-full justify-center py-3">Save</button>`;
    wireUploads(editForm);
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

  /* ---------- SITE CONTENT (headings / subtexts / poster) ---------- */
  /* ---------- IMAGES (every editable site image) ---------- */
  const IMAGE_SLOTS = [
    ["prophet_image", "Prophet / Pastor photo"],
    ["about_image", "About section image"],
    ["live_poster", "Watch Live poster"],
    ["popup_image", "Welcome popup image"],
  ];
  // The image currently shown on the site when site_content has no override
  // (so the admin previews the REAL current image, not a placeholder).
  const IMAGE_DEFAULTS = {
    prophet_image: CFG.prophetPhoto || "",
    about_image: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1000&q=80",
    live_poster: CFG.livePoster || "",
    popup_image: CFG.popupImage || "",
  };
  async function loadImages() {
    const wrap = $("#imagesList");
    if (!wrap) return;
    const { data } = await db.from("site_content").select("key, value");
    const map = {};
    if (data) data.forEach((r) => { map[r.key] = r.value; });
    const eff = (k) => map[k] || IMAGE_DEFAULTS[k] || "";   // effective current image
    wrap.innerHTML = IMAGE_SLOTS.map(([k, label]) => `
      <div class="bg-white rounded-xl shadow-sm border overflow-hidden">
        <img src="${esc(eff(k) || "assets/img/logo.svg")}" onerror="this.onerror=null;this.src='assets/img/logo.svg'" class="w-full h-40 object-cover bg-slate-100" alt="" />
        <div class="p-3 flex items-center justify-between gap-2">
          <span class="font-600 text-navy text-sm truncate">${label}</span>
          <button class="text-sm font-600 text-navy hover:text-gold-dark flex-none" data-edit-img="${k}">Edit</button>
        </div>
      </div>`).join("");
    $$("[data-edit-img]", wrap).forEach((b) => b.addEventListener("click", () => {
      const slot = IMAGE_SLOTS.find((s) => s[0] === b.dataset.editImg);
      editImageSlot(slot[0], slot[1], eff(slot[0]));
    }));
  }
  function editImageSlot(key, label, value) {
    editTitle.textContent = "Edit: " + label;
    editForm.innerHTML = imageField(label, "value", value) + `<button type="submit" class="btn-navy w-full justify-center py-3">Save</button>`;
    wireUploads(editForm);
    editForm.onsubmit = async (e) => {
      e.preventDefault();
      const val = editForm.querySelector('[name="value"]').value;
      const { error } = await db.from("site_content").upsert([{ key, value: val }], { onConflict: "key" });
      if (error) return toast("Error: " + error.message);
      closeEdit(); toast("Saved — refresh the site."); loadImages();
    };
    openEdit();
  }

  /* ---------- SITE CONTENT (headings / subtexts) ---------- */
  const CONTENT_FIELDS = [
    ["live_title", "Watch Live — heading", "text"],
    ["live_blurb", "Watch Live — subtext", "textarea"],
    ["featured_title", "Featured Broadcast — heading", "text"],
    ["featured_blurb", "Featured Broadcast — subtext", "textarea"],
    ["ondemand_title", "On-Demand — heading", "text"],
    ["ondemand_subtext", "On-Demand — subtext", "textarea"],
    ["messages_title", "Messages & Videos — heading", "text"],
    ["prophet_name", "Prophet — name", "text"],
    ["prophet_title", "Prophet — title line", "text"],
    ["prophet_bio", "Prophet — biography", "textarea"],
    ["calling_title", "Prophet — Calling heading", "text"],
    ["calling_text", "Prophet — Calling text", "textarea"],
    ["journey_title", "Prophet — Journey heading", "text"],
    ["journey_text", "Prophet — Journey text", "textarea"],
    ["impact_title", "Prophet — Impact heading", "text"],
    ["impact_text", "Prophet — Impact text", "textarea"],
  ];
  // What the site shows by default (so the admin displays the real current text).
  const CONTENT_DEFAULTS = {
    live_title: "Live Service & Broadcasts",
    live_blurb: "Join our services and broadcasts live from anywhere in the world.",
    featured_title: "Featured Broadcast",
    featured_blurb: "",
    ondemand_title: "Watch Anytime, Anywhere",
    ondemand_subtext: "Tap any broadcast to watch it right here — services, crusades, worship and the Word.",
    messages_title: "Messages & Videos",
    prophet_name: "Prophet AA Emmanuel",
    prophet_title: "Founder · Teacher · Servant of God",
    prophet_bio: "Prophet AA Emmanuel is a passionate minister of the gospel whose life is devoted to seeing men and women encounter the transforming power of Jesus Christ. Known for a prophetic and teaching grace, he ministers with clarity, compassion, and an unwavering commitment to truth.",
    calling_title: "The Calling",
    calling_text: "Answered the call to ministry in his early twenties after a profound encounter with God, devoting his life to prayer and the study of the Word.",
    journey_title: "The Journey",
    journey_text: "From a small fellowship to a thriving ministry, he has hosted crusades and conferences that have gathered thousands seeking restoration.",
    impact_title: "The Impact",
    impact_text: "Today his message reaches across 30+ nations through live gatherings, media, and humanitarian outreach to the vulnerable.",
  };
  async function loadContent() {
    const wrap = $("#contentList");
    if (!wrap) return;
    const { data, error } = await db.from("site_content").select("key, value");
    const map = {};
    if (!error && data) data.forEach((r) => { map[r.key] = r.value; });
    const eff = (k) => (map[k] != null && map[k] !== "") ? map[k] : (CONTENT_DEFAULTS[k] || "");
    wrap.innerHTML = CONTENT_FIELDS.map(([k, label]) => `
      <div class="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between gap-4">
        <div class="min-w-0">
          <p class="text-[11px] font-700 uppercase tracking-wide text-gold-dark">${label}</p>
          <p class="text-navy mt-0.5 truncate">${esc(eff(k) || "(empty)")}</p>
        </div>
        <button class="text-sm font-600 text-navy hover:text-gold-dark flex-none" data-edit-content="${k}">Edit</button>
      </div>`).join("");
    $$("[data-edit-content]", wrap).forEach((b) => b.addEventListener("click", () => {
      const f = CONTENT_FIELDS.find((s) => s[0] === b.dataset.editContent);
      editContentField(f[0], f[1], f[2], eff(f[0]));
    }));
  }
  function editContentField(key, label, type, value) {
    editTitle.textContent = "Edit: " + label;
    editForm.innerHTML = (type === "textarea" ? textarea(label, "value", value) : field(label, "value", value))
      + `<button type="submit" class="btn-navy w-full justify-center py-3">Save</button>`;
    editForm.onsubmit = async (e) => {
      e.preventDefault();
      const val = editForm.querySelector('[name="value"]').value;
      const { error } = await db.from("site_content").upsert([{ key, value: val }], { onConflict: "key" });
      if (error) return toast("Error: " + error.message);
      closeEdit(); toast("Saved — refresh the site."); loadContent();
    };
    openEdit();
  }

  /* ---------- TESTIMONIES ---------- */
  let testimonialsCache = [];
  async function loadTestimonials() {
    const wrap = $("#testimonialsList");
    if (!wrap) return;
    const { data, error } = await db.from("testimonials").select("*").order("sort_order", { ascending: true });
    if (error) { wrap.innerHTML = `<p class="text-red-500 text-sm">${esc(error.message)}</p>`; return; }
    if (!data.length) { wrap.innerHTML = `<p class="text-slate-500 text-sm">No testimonies yet — click “Add testimony”.</p>`; return; }
    testimonialsCache = data;
    wrap.innerHTML = data.map((t) => `
      <div class="bg-white rounded-xl shadow-sm border p-4">
        <p class="text-sm text-gray-600 line-clamp-3">“${esc(t.quote || "")}”</p>
        <div class="mt-3 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <img src="${esc(t.photo_url || "assets/img/logo.svg")}" onerror="this.onerror=null;this.src='assets/img/logo.svg'" class="h-9 w-9 rounded-full object-cover bg-slate-100" alt="" />
            <div class="min-w-0"><p class="font-600 text-navy text-sm truncate">${esc(t.name || "")}</p><p class="text-xs text-slate-400 truncate">${esc(t.location || "")}</p></div>
          </div>
          <div class="flex-none flex gap-2">
            <button class="text-sm font-600 text-navy hover:text-gold-dark" data-edit-tst="${t.id}">Edit</button>
            <button class="text-sm font-600 text-red-500" data-del-tst="${t.id}">Delete</button>
          </div>
        </div>
      </div>`).join("");
    $$("[data-edit-tst]", wrap).forEach((b) => b.addEventListener("click", () => { const t = testimonialsCache.find((x) => String(x.id) === b.dataset.editTst); if (t) editTestimonial(t); }));
    $$("[data-del-tst]", wrap).forEach((b) => b.addEventListener("click", () => delRow("testimonials", b.dataset.delTst, loadTestimonials)));
  }
  function editTestimonial(t) {
    t = t || { published: true, sort_order: 0 };
    editTitle.textContent = t.id ? "Edit testimony" : "Add testimony";
    editForm.innerHTML =
      textarea("Testimony (quote)", "quote", t.quote || "") +
      field("Name", "name", t.name || "") +
      field("Location", "location", t.location || "") +
      imageField("Photo", "photo_url", t.photo_url || "") +
      field("Sort order", "sort_order", t.sort_order ?? 0, "number") +
      checkbox("Published", "published", t.published !== false) +
      `<button type="submit" class="btn-navy w-full justify-center py-3">Save</button>`;
    wireUploads(editForm);
    editForm.onsubmit = async (e) => {
      e.preventDefault();
      const d = formData(editForm);
      d.sort_order = parseInt(d.sort_order, 10) || 0;
      const q = t.id ? db.from("testimonials").update(d).eq("id", t.id) : db.from("testimonials").insert([d]);
      const { error } = await q;
      if (error) return toast("Error: " + error.message);
      closeEdit(); toast("Saved."); loadTestimonials();
    };
    openEdit();
  }
  $("#addTestimonial")?.addEventListener("click", () => editTestimonial(null));

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
