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
  prophetPhoto: "",

  /* ---------- YouTube ----------
     Channel link used by the hero "Watch Messages" button and
     the "View all messages" link. */
  youtubeChannel: "https://www.youtube.com/results?search_query=prophet+aa+emmanuel+ministries",

  /* ---------- Recent Messages / Sermons ----------
     To update a message, just change its `youtube` link (and the
     title/date). The thumbnail is pulled automatically from the
     YouTube video — you don't need to add an image. Add or remove
     items freely; the page rebuilds the cards from this list. */
  sermons: [
    {
      title:   "The Power of Faith",
      date:    "May 18, 2026",
      youtube: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
      blurb:   "Discover how unwavering faith unlocks the supernatural and moves the hand of God in your life.",
    },
    {
      title:   "Walking in Purpose",
      date:    "May 4, 2026",
      youtube: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
      blurb:   "Understand God's unique design for your life and learn to walk boldly in your divine assignment.",
    },
    {
      title:   "Breaking Every Chain",
      date:    "April 20, 2026",
      youtube: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
      blurb:   "A prophetic word of deliverance — receive freedom from every limitation through the name of Jesus.",
    },
  ],

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
