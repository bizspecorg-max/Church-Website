/* =========================================================
   Supabase integration (optional)
   ---------------------------------------------------------
   Provides: member auth (sign up / sign in / sign out) and
   saving Contact + Donation submissions to your database.

   Stays completely inert until you add supabaseUrl + supabaseAnonKey
   in assets/js/config.js — so the site works with or without it.

   Exposes a small, safe API on window.MinistryDB.
   ========================================================= */
(function () {
  "use strict";

  const CFG = window.MINISTRY_CONFIG || {};
  const url = CFG.supabaseUrl;
  const key = CFG.supabaseAnonKey;

  // The UMD build (loaded via CDN) exposes window.supabase.createClient
  const lib = window.supabase;
  const configured = !!(url && key && lib && typeof lib.createClient === "function");

  const client = configured ? lib.createClient(url, key) : null;

  const noop = async () => ({ ok: false, reason: "supabase-not-configured" });

  const API = {
    enabled: configured,

    /* ---- Data capture ---- */
    async saveContact(data) {
      if (!client) return noop();
      const { error } = await client.from("contacts").insert([{
        name: data.Name, email: data.Email, subject: data.Subject, message: data.Message,
      }]);
      return { ok: !error, error };
    },

    async saveDonation(data) {
      if (!client) return noop();
      const { error } = await client.from("donations").insert([{
        name: data.Name, email: data.Email, phone: data.Phone,
        amount: data.amountValue || null, status: data.Status || "submitted",
      }]);
      return { ok: !error, error };
    },

    /* ---- Videos / Messages (grouped into sections) ---- */
    async getVideos() {
      if (!client) return [];
      const { data, error } = await client
        .from("videos")
        .select("title, section, category, youtube_url, description, play_mode, sort_order, published")
        .eq("published", true)
        .order("sort_order", { ascending: true });
      if (error || !data) return [];
      return data.map((r) => ({
        title: r.title,
        section: r.section || "Recent Messages",
        date: r.category || "",
        youtube: r.youtube_url || "",
        blurb: r.description || "",
        mode: r.play_mode || "inline", // "inline" = play on-site, "link" = open YouTube
      }));
    },

    /* ---- Hero slider images ---- */
    async getHeroSlides() {
      if (!client) return [];
      const { data, error } = await client
        .from("hero_slides")
        .select("image_url, sort_order, published")
        .eq("published", true)
        .order("sort_order", { ascending: true });
      if (error || !data) return [];
      return data.map((r) => r.image_url).filter(Boolean);
    },

    /* ---- Auth ---- */
    async signUp(email, password) {
      if (!client) return noop();
      const { data, error } = await client.auth.signUp({ email, password });
      return { ok: !error, data, error };
    },
    async signIn(email, password) {
      if (!client) return noop();
      const { data, error } = await client.auth.signInWithPassword({ email, password });
      return { ok: !error, data, error };
    },
    async signOut() {
      if (!client) return noop();
      const { error } = await client.auth.signOut();
      return { ok: !error, error };
    },
    async getUser() {
      if (!client) return null;
      const { data } = await client.auth.getUser();
      return data ? data.user : null;
    },
    onAuthChange(cb) {
      if (!client) return;
      client.auth.onAuthStateChange((_event, session) => cb(session ? session.user : null));
    },
  };

  window.MinistryDB = API;
})();
