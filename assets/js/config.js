/* =========================================================
   MINISTRY CONFIG  —  EDIT THIS FILE ONLY
   ---------------------------------------------------------
   Everything you'll commonly change lives here. You don't need
   to touch any other code. Save the file and refresh the page.
   ========================================================= */
window.MINISTRY_CONFIG = {

  /* ---------- Payments (Paystack) ----------
     Paste your public key to accept real donations.
     Leave "" to stay in safe demo mode. */
  paystackPublicKey: "",            // e.g. "pk_live_xxxxxxxxxxxxxxxx"
  currency: "NGN",

  /* ---------- Where form submissions are emailed ----------
     Both the Contact form AND the Donation form send their
     details to this address.
       • formEndpoint = ""  → opens the visitor's email app
         pre-filled (works with zero setup).
       • formEndpoint = a free Formspree URL → emails are sent
         silently in the background (recommended for live use).
         Create one at https://formspree.io using the inbox below. */
  notifyEmail:  "koredebusuyi.career@gmail.com",
  formEndpoint: "",                 // e.g. "https://formspree.io/f/abcdwxyz"

  /* ---------- Prophet's photo ----------
     Two ways to set the Prophet's real picture:
       1. Save the image as  assets/img/prophet.jpg  (recommended), OR
       2. Paste a public image URL here (e.g. from your phone/cloud).
     If left "", option 1 (the local file) is used, with a placeholder
     shown until you add it. */
  prophetPhoto: "https://res.cloudinary.com/dfmigbgri/image/upload/v1781248935/prophet-portrait_elkbhj.jpg",

  /* ---------- Hero slider images ----------
     The big banner rotates through these (use 4+). Visitors can
     click the arrows/dots to move between them. Swap for your own
     crusade / service / conference photos any time. */
  heroSlides: [
    "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1511988617509-a57c8a288659?auto=format&fit=crop&w=1920&q=80",
  ],

  /* ---------- YouTube ----------
     The Prophet's channel. Used by the hero "Watch Messages"
     button, the "View all messages" link, and Watch Live. */
  youtubeChannel: "https://www.youtube.com/@DISTANCEISNOTABARRIERTV",

  /* ---------- Social links (top bar + footer) ---------- */
  socials: {
    facebook:  "https://web.facebook.com/",
    twitter:   "https://twitter.com/",
    youtube:   "https://www.youtube.com/@DISTANCEISNOTABARRIERTV",
    instagram: "https://www.instagram.com/",
  },

  /* ---------- Recent Messages / Sermons ----------
     To embed a real video, paste its link into `youtube`, e.g.
     "https://www.youtube.com/watch?v=VIDEO_ID" (copy it from the
     channel). The thumbnail is pulled from the video automatically.
     While `youtube` is blank, the card links to the channel.
     Add or remove items freely; the cards rebuild from this list. */
  sermons: [
    {
      title:   "Distance Is Not A Barrier",
      date:    "Latest Broadcast",
      youtube: "",   // ← paste a video link from the channel
      blurb:   "Receive your healing, deliverance and breakthrough — wherever you are, distance is not a barrier.",
    },
    {
      title:   "The Power of Faith",
      date:    "Sunday Service",
      youtube: "",
      blurb:   "Discover how unwavering faith unlocks the supernatural and moves the hand of God in your life.",
    },
    {
      title:   "Breaking Every Chain",
      date:    "Deliverance Service",
      youtube: "",
      blurb:   "A prophetic word of deliverance — receive freedom from every limitation through the name of Jesus.",
    },
  ],

  /* ---------- Watch Live / Video ----------
     Paste a specific YouTube video or live URL to EMBED it inline,
     e.g. "https://www.youtube.com/watch?v=VIDEO_ID".
     Leave liveEmbedUrl blank to show a click-to-watch poster that
     opens the channel (recommended until you pick a video). */
  liveEmbedUrl: "",
  livePoster:   "https://images.unsplash.com/photo-1510590337019-5ef8d3d32116?auto=format&fit=crop&w=1280&q=80",
  liveTitle:    "Watch Live & On-Demand",
  liveBlurb:    "Join our services, crusades and broadcasts live from anywhere in the world. Be blessed, healed, and lifted in the presence of God.",

  /* ---------- Opening donation popup ----------
     A gentle giving invitation that greets visitors on arrival.
       showPopup:   true/false to enable.
       popupOnce:   true  → show once per browsing session (recommended)
                    false → show on every page load.
       popupDelay:  milliseconds to wait before showing. */
  showPopup:  true,
  popupOnce:  true,
  popupDelay: 1200,

  /* ---------- Partnership tiers (monthly giving) ----------
     Shown as cards in the Partnership section. Edit freely. */
  partnership: [
    { name: "Friend Partner",   amount: 5000,  perks: "Monthly newsletter & prayer covering" },
    { name: "Kingdom Partner",  amount: 10000, perks: "Everything in Friend + partner-only messages", featured: true },
    { name: "Covenant Partner", amount: 25000, perks: "Everything in Kingdom + quarterly impact report" },
  ],

  /* ---------- Supabase backend (optional) ----------
     Enables member login/sign-up and saves Contact + Donation
     submissions to your database. Leave blank to keep the site
     fully static (forms still email as before).
       1. Create a free project at https://supabase.com
       2. Settings → API → copy the Project URL and the anon public key
       3. Paste them below, then run the SQL from the README to create
          the `contacts` and `donations` tables.  */
  supabaseUrl:     "",   // e.g. "https://xxxxxxxx.supabase.co"
  supabaseAnonKey: "",   // the long anon/public key (safe for the browser)

  /* ---------- Contact details ----------
     These also feed the footer and WhatsApp button.
     Use full international format (no +, no spaces) for whatsapp. */
  contact: {
    address:  "12 Grace Avenue, Victoria Island, Lagos, Nigeria",
    email:    "hello@aaemmanuelministries.org",
    phone:    "+234 800 000 0000",
    whatsapp: "2348000000000",
  },
};
