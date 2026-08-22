/* =========================================================
   MINISTRY CONFIG  —  EDIT THIS FILE ONLY
   ---------------------------------------------------------
   Everything you'll commonly change lives here. You don't need
   to touch any other code. Save the file and refresh the page.
   ========================================================= */
window.MINISTRY_CONFIG = {

  /* ---------- Payments (Paystack) ----------
     Paste your public key to accept real donations.
     Leave "" to stay in safe demo mode.
     paystackReady: set to true ONLY once you've pasted a real key
     above. While false, the Card/Online option is hidden site-wide
     and givers are pointed to Bank Transfer instead — see the
     PAYSTACK block inside processPayment() in main.js, which is
     commented out until this flips to true. */
  paystackPublicKey: "",            // e.g. "pk_live_xxxxxxxxxxxxxxxx"
  paystackReady: false,             // ⚠️ flip to true once the key above is live
  currency: "NGN",

  /* ---------- Bank transfer (current giving option while Paystack
     is not yet live) ----------
     Set showBank:false to hide the option. */
  showBank: true,
  bankAccount: {
    name:   "CORINTHIANS INTERNATIONAL CHURCH",
    number: "1028872901",
    bank:   "United Bank for Africa (UBA)",
    momo:   "7061220312",                    // MTN MoMo — leave "" to hide
    opay:      "7061220312",                 // Opay — leave "" to hide
    opayName:  "Musa Adamu, Omoaka",         // Opay is registered under this personal name, not the church
    paypal: "Prophetaaemmanuel@gmail.com",   // leave "" to hide the PayPal line
    note:   "Online card payment isn't available yet — please use one of the accounts above. After your transfer, fill the form below so we can confirm it and send your receipt.",
  },

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
  prophetPhoto: "https://res.cloudinary.com/dbewrzeuj/image/upload/v1781420798/19rWO_rrxjch.jpg",

  /* ---------- Hero slider images ----------
     The big banner rotates through these (use 4+). Visitors can
     click the arrows/dots to move between them. Swap for your own
     crusade / service / conference photos any time. */
  heroSlides: [
    "https://res.cloudinary.com/dbewrzeuj/image/upload/v1781423907/iCBGa_1_pyy7xi.jpg",
    "https://res.cloudinary.com/dbewrzeuj/image/upload/v1781423907/EUNaM_1_qfw4ho.jpg",
    "https://res.cloudinary.com/dbewrzeuj/image/upload/v1781423907/tp8NG_v3chsi.jpg",
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

  /* ---------- Recent Messages / Videos ----------
     These play INSIDE the website (no leaving for YouTube).
     Source of truth is the Supabase `videos` table when configured;
     this list is the fallback / seed. To change a video, paste its
     YouTube link into `youtube` — the thumbnail is auto-generated.
     NOTE: the samples below are public worship/prophetic videos so
     the site plays out of the box; replace with the Prophet's own. */
  sermons: [
    { section: "Watch Live", title: "Live Service & Broadcasts", date: "Live", mode: "inline", youtube: "https://www.youtube.com/watch?v=QM8jQHE5AAk", blurb: "Join our services live from anywhere in the world." },
    { section: "Featured", title: "Distance Is Not A Barrier — Just Have Faith", date: "Prophetic Word", mode: "inline", youtube: "https://www.youtube.com/watch?v=rYJWRyg89wA", blurb: "This week's featured message — watch and be blessed." },
    { section: "Recent Messages", title: "I Know Who I Am", date: "Identity in Christ", mode: "inline", youtube: "https://www.youtube.com/watch?v=frtZ4XfoXxM", blurb: "Discover your true identity as a child of God." },
    { section: "Recent Messages", title: "Who Is On The Lord's Side", date: "Consecration", mode: "inline", youtube: "https://www.youtube.com/watch?v=aULdIMQn1AQ", blurb: "A call to full surrender to the Lordship of Jesus." },
    { section: "Recent Messages", title: "TobeChukwu — Praise God", date: "Thanksgiving", mode: "inline", youtube: "https://www.youtube.com/watch?v=0N8jWaBQUuA", blurb: "Lift your voice in thanksgiving to the Almighty." },
    { section: "Recent Messages", title: "The Power of Faith", date: "Faith", mode: "inline", youtube: "https://www.youtube.com/watch?v=k28qCBwww0E", blurb: "Unwavering faith unlocks the supernatural in your life." },
    { section: "Recent Messages", title: "Worship Encounter", date: "Worship", mode: "inline", youtube: "https://www.youtube.com/watch?v=eNKjlNyOFjY", blurb: "Soak in His presence and be refreshed in spirit." },
    { section: "Recent Messages", title: "A Night of Praise", date: "Praise", mode: "inline", youtube: "https://www.youtube.com/watch?v=J4vTs2py2ro", blurb: "Celebrate the goodness of God with thanksgiving." },
    { section: "Praise & Worship", title: "Way Maker — Worship", date: "Worship", mode: "inline", youtube: "https://www.youtube.com/watch?v=hWgJij1MSI4", blurb: "Enter His presence with this powerful worship." },
    { section: "Praise & Worship", title: "Way Maker (Live)", date: "Live Worship", mode: "inline", youtube: "https://www.youtube.com/watch?v=QM8jQHE5AAk", blurb: "A live worship experience — miracle worker." },
    { section: "Crusades & Conferences", title: "Crusade Highlights", date: "Crusade", mode: "link", youtube: "https://www.youtube.com/watch?v=eNKjlNyOFjY", blurb: "Highlights from our recent crusade gathering." },
  ],

  /* ---------- Watch Live / Video ----------
     Paste a specific YouTube video or live URL to EMBED it inline,
     e.g. "https://www.youtube.com/watch?v=VIDEO_ID".
     Leave liveEmbedUrl blank to show a click-to-watch poster that
     opens the channel (recommended until you pick a video). */
  liveEmbedUrl: "https://www.youtube.com/watch?v=QM8jQHE5AAk",
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
  popupImage: "https://res.cloudinary.com/dbewrzeuj/image/upload/v1781420798/19rWO_rrxjch.jpg", // shown in the welcome popup

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
  supabaseUrl:     "https://pozpdwaoeauntfpyjhtk.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBvenBkd2FvZWF1bnRmcHlqaHRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyNzkxODMsImV4cCI6MjA5Njg1NTE4M30.1oFrYU0i92V_yQm3pQWkeh2L-IEMpztip97fr08Jod4",

  /* ---------- Testimonies (fallback; managed in the admin) ---------- */
  testimonials: [
    { quote: "After years of waiting, God blessed my family with a child following the prophetic prayer. I am forever grateful to this ministry.", name: "Grace A.", location: "Lagos, Nigeria", photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=150&q=80" },
    { quote: "I was at the lowest point of my life when I joined a service online. The Word restored my hope and I found a new job within weeks.", name: "Daniel O.", location: "Abuja, Nigeria", photo: "https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=150&q=80" },
    { quote: "The medical outreach saved my mother's life. This ministry truly cares for people beyond the pulpit. God bless Prophet Emmanuel.", name: "Mary E.", location: "Accra, Ghana", photo: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&w=150&q=80" },
  ],

  /* ---------- Contact details ----------
     These also feed the footer and WhatsApp button.
     Use full international format (no +, no spaces) for whatsapp. */
  contact: {
    address:  "12 Grace Avenue, Victoria Island, Lagos, Nigeria",
    email:    "hello@aaemmanuelministries.org",
    phone:    "+234 800 000 0000",
    whatsapp: "2347061220312",
  },
};
