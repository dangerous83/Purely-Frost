# FPH Ice Plant — Website

Static, 12-page marketing site for FPH Ice Plant (formerly Purely Freeze), a Fourth Pacific Holdings company. No build step is needed: open `index.html` in a browser or upload the folder to any static host (Netlify, Vercel, GitHub Pages, cPanel).

## Pages
| File | Page |
|---|---|
| `index.html` | Home |
| `about.html` | About Us |
| `solutions.html` | Ice Solutions |
| `products.html` | Products |
| `purity.html` | Purity & Process |
| `facility.html` | Production Facility |
| `distribution.html` | Distribution Network |
| `distributors.html` | Distributor Program (Silver / Gold / Platinum) |
| `invest.html` | Invest |
| `faq.html` | FAQ |
| `contact.html` | Contact & Get a Quote |
| `privacy.html` | Privacy Policy |
| `terms.html` | Terms & Conditions |

## Replacing image placeholders
Every image spot is a `<div class="ph ...">` block labelled with what belongs there and a suggested size. To swap in a photo, replace the whole `<div class="ph ...">…</div>` with:

```html
<img src="assets/img/your-photo.jpg" alt="Describe the photo" style="width:100%;border-radius:18px;aspect-ratio:4/3;object-fit:cover">
```

## Before going live
- Confirm emails (` (now aronlopezilao@fourthpacificholdings.com, shown as an email icon)`), phone, address and social links.
- All forms (contact, investor, plant tour, secure quote popup, newsletter) email aronlopezilao@fourthpacificholdings.com through FormSubmit (formsubmit.co). The address is set once as `LEAD_EMAIL` in `assets/js/main.js`. FormSubmit needs a one-time "Activate" click in the first email it sends to that inbox.
- Replace placeholder leadership names, timeline phases, testimonial and certification badges.

## Clean URLs
Pages are linked without `.html` (e.g. `https://fphiceplant.com/about`). GitHub Pages serves `about.html` for `/about` automatically. Asset paths start with `/`, so the site must be served from the domain root.
