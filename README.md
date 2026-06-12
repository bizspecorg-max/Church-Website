# Prophet AA Emmanuel Ministries — Website

A modern, responsive, mobile-first single-page ministry website built with
**HTML + Tailwind CSS + vanilla JavaScript**. No build step required — just
open `index.html` in a browser or deploy the folder to any static host.

## ✨ Features

- Mobile-first, fully responsive (mobile / tablet / desktop)
- Sticky header that turns solid on scroll + mobile menu
- Smooth scroll reveal animations & animated impact counters
- 10 sections: Hero, About, Prophet, Impact, Gallery, Sermons,
  Partnership/Donations, Testimonies, Contact, Footer
- Donation flow with amount cards, validation, summary modal, and a
  **Paystack integration placeholder** ready to go live
- SEO meta tags, Open Graph, accessible markup, reduced-motion support
- Deep blue (`#0b1f4d`) + gold (`#c9a227`) brand palette

## 📁 Structure

```
Church-Website/
├── index.html              # All sections & markup
├── assets/
│   ├── css/custom.css      # Component classes, animations, brand styles
│   ├── js/main.js          # Nav, reveal, counters, donation, Paystack
│   └── img/                # SVG placeholder images (swap with real photos)
└── README.md
```

## 🚀 Run locally

Just open the file:

```bash
open index.html          # macOS
# or serve it:
python3 -m http.server 8000   # then visit http://localhost:8000
```

## 🖼️ Replace placeholder images

Each `<img>` loads a professional **Unsplash stock photo** as its `src`, with a
local branded **SVG in `assets/img/` as an automatic `onerror` fallback** — so
if a photo ever fails to load (offline, blocked, etc.) the site degrades to a
clean placeholder instead of a broken image.

To use your **own** photos, just replace the Unsplash URL in each `<img src="...">`
(or drop files into `assets/img/` and point `src` there). The fallback SVGs are:

| File | Used for |
|------|----------|
| `logo.svg` | Header & footer logo / favicon |
| `hero-banner.svg` | Hero background banner |
| `prophet-hero.svg`, `prophet.svg` | Prophet portraits |
| `about.svg` | About section image |
| `gallery-1..8.svg` | Gallery grid |
| `sermon-1..3.svg` | Sermon thumbnails |
| `testimony-1..3.svg` | Testimony photos |

Tip: optimize photos to WebP and keep them under ~200 KB for fast loading.

## 💳 Enable Paystack (go live)

The donation flow is wired and runs in **demo mode** until you add a key.

1. Create a Paystack account → Dashboard → **Settings → API Keys & Webhooks**.
2. Copy your **Public Key** (`pk_live_...` or `pk_test_...`).
3. Open `assets/js/main.js` and set:

   ```js
   const PAYSTACK_PUBLIC_KEY = "pk_live_xxxxxxxxxxxxxxxxxxxx";
   ```

That's it — clicking **Pay with Paystack** now opens the real checkout.
Amounts are automatically converted to kobo (`amount * 100`).

> For production you should also verify each transaction server-side using your
> **secret key** and Paystack's `/transaction/verify/:reference` endpoint.

## ⚙️ One file for everything: `assets/js/config.js`

The settings you'll change most often are all in **`assets/js/config.js`** — no
need to dig through the HTML. Edit, save, refresh:

| Setting | What it controls |
|---------|------------------|
| `paystackPublicKey` | Switch donations from demo → live |
| `notifyEmail` | Where Contact + Donation submissions are emailed |
| `formEndpoint` | Formspree URL for silent background email |
| `youtubeChannel` | "Watch Messages" / "View all messages" link |
| `sermons[]` | **Each message's title, date & YouTube link** |
| `contact` | Address, email, phone, WhatsApp (feeds page + footer) |

### Updating a sermon / message (YouTube)
Open `config.js` and edit the `sermons` list. To change a message you only need
to update its **`youtube`** link — the thumbnail is pulled from YouTube
automatically. Add or remove items freely; the cards rebuild themselves.

```js
sermons: [
  { title: "The Power of Faith", date: "May 18, 2026",
    youtube: "https://www.youtube.com/watch?v=YOUR_VIDEO_ID",
    blurb: "Short description shown on the card." },
  // add as many as you like…
],
```

### Adding the Prophet's real photo
Save the photo as **`assets/img/prophet.jpg`** (that exact name) and it shows up
in both the hero and the profile section automatically. Until that file exists,
a placeholder is shown. To use a different name, update the two
`<img src="assets/img/prophet.jpg">` tags in `index.html`.

## ✏️ Other content

- **Text & figures:** edit directly in `index.html` (sections are clearly
  labeled with HTML comments like `<!-- 4. MINISTRY IMPACT -->`).
- **Impact numbers:** change the `data-count` attributes in the Impact section.
- **Brand colors:** edit the `tailwind.config` block in `index.html` and the
  `:root` variables in `assets/css/custom.css`.

## 📧 Email notifications (Contact + Donations)

Both the **Contact form** and the **Donation form** email their details to the
ministry inbox. The address and delivery method live in `assets/js/config.js`:

```js
notifyEmail:  "koredebusuyi.career@gmail.com", // change any time
formEndpoint: "",                              // see below
```

- **Out of the box (no setup):** when `FORM_ENDPOINT` is blank, submitting a
  form opens the visitor's email app pre-filled to `NOTIFY_EMAIL` (they tap
  send). The donor's details are captured the moment they submit — before they
  even pay — so no lead is lost.
- **Recommended (silent, automatic emails):** create a free form at
  **[formspree.io](https://formspree.io)** using the
  `koredebusuyi.career@gmail.com` inbox, copy the endpoint
  (e.g. `https://formspree.io/f/abcdwxyz`) into `FORM_ENDPOINT`, and both forms
  will email in the background with no popups.

Donation emails include the donor's name, email, phone, and amount.

## ♿ Accessibility & SEO

- Semantic landmarks, skip link, ARIA labels on icons/buttons
- Keyboard-dismissible modal (Esc) and focus management
- `prefers-reduced-motion` respected
- Meta description, keywords, canonical, Open Graph & Twitter cards

## 🌐 Deploy

Drop the folder on any static host — **GitHub Pages, Netlify, Vercel,
Cloudflare Pages**, or traditional shared hosting. No server needed.

---

© Prophet AA Emmanuel Ministries. Placeholder content — customize before launch.
