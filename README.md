<div align="center">

# ⚡ EventHub

### Campus Event Platform — Registrations, QR Tickets & Check-In

[![HTML](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg?style=for-the-badge)](LICENSE)

**EventHub** is a premium, fully responsive event management landing page built for college fests, hackathons, and campus events. Features a stunning dark UI with glassmorphism, animated QR check-in spotlight, real-time analytics section, and a two-panel login page.

[🚀 Live Demo / Website](https://eventhub-qzxx05x7q-g-xrave.vercel.app/) · [🐛 Report Bug](https://github.com/gauravkumar-ops/eventhub/issues) · [✨ Request Feature](https://github.com/gauravkumar-ops/eventhub/issues)

</div>

---

## ✨ Features

- 🎨 **Premium Dark UI** — Deep purple/indigo theme with glassmorphism cards and neon accents
- ⚡ **Animated Hero** — Floating particle system, animated orbs, and scroll-triggered stat counters
- 🏛️ **Infinite Marquee** — Auto-scrolling college name strip
- 🧩 **Bento Feature Grid** — 8-card responsive layout showcasing platform capabilities
- 📧 **SendGrid & Twilio Automated Reminders** — Instant event summary dispatches to registered organizer email & automated SMS broadcast alerts for attendees
- 📱 **QR Check-In Spotlight** — Split-layout section with feature checklist
- 📊 **Analytics Dashboard** — Real dashboard preview with animated stats
- 🪗 **FAQ Accordion** — Smooth animated expand/collapse
- 🔐 **Login Page** — Two-panel layout with Google/GitHub social buttons, form validation, password toggle, and loading states
- 📱 **Fully Responsive** — Works beautifully from 480px to 4K
- ♿ **Accessible** — Unique IDs on all interactive elements, ARIA labels, semantic HTML

---

## 🗂️ Project Structure

```
eventhub/
├── assets/
│   └── images/                   # High-res UI showcases & feature assets
├── index.html                    # Main landing page
├── login.html                    # Auth / sign-in portal
├── signup.html                   # Onboarding & registration
├── dashboard.html                # Organizer management dashboard
├── create-event.html             # Event creation & ticket designer
├── ticket.html                   # Dynamic QR pass viewer
├── scanner.html                  # Gate check-in camera scanner
├── style.css                     # Design system & stylesheet
├── app.js                        # Client-side routing & core logic
├── .gitignore                    # Git exclusions
└── README.md                     # Documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Any modern web browser (Chrome, Firefox, Edge, Safari)
- No build tools or Node.js required — it's pure HTML/CSS/JS!

### Run Locally

**Option 1 — Open directly in browser / Local server:**
```bash
# 1. Copy the environment template
cp .env.example .env

# 2. Serve with Python:
python -m http.server 3000
```
Then open **[http://localhost:3000](http://localhost:3000)**

**Option 2 — Serve with Node.js:**
```bash
npx serve .
```

---

## ⚙️ Environment Variables & Vercel Configuration

EventHub uses [`firebase-config.js`](file:///c:/Users/gaura/OneDrive/Desktop/eventhub/firebase-config.js) to dynamically resolve environment keys at runtime.

### Local Development
Create a `.env` file from the provided [`.env.example`](file:///c:/Users/gaura/OneDrive/Desktop/eventhub/.env.example):
```env
FIREBASE_API_KEY="your-firebase-api-key"
VITE_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
```

### Vercel Deployment
1. Import your repository on **[Vercel](https://vercel.com/)**.
2. Navigate to **Project Settings > Environment Variables**.
3. Add the following key:
   - Key: `FIREBASE_API_KEY` (or `NEXT_PUBLIC_FIREBASE_API_KEY` / `VITE_FIREBASE_API_KEY`)
   - Value: `<Your Firebase API Key>`
4. Redeploy project. EventHub will automatically load the environment key without exposing credentials in code commits.

---

## 📄 Pages

### `index.html` — Landing Page

| Section | Description |
|---|---|
| **Navbar** | Sticky frosted-glass nav with mobile hamburger menu |
| **Hero** | Animated headline, floating stat cards, particle effects, CTA buttons |
| **Marquee** | Infinite scroll strip of trusted college names |
| **Features** | 8-card bento grid (QR tickets, forms, analytics, check-in, etc.) |
| **QR Spotlight** | Left/right split layout with feature checklist |
| **How It Works** | 3-step visual flow with icons |
| **Analytics Spotlight** | Dashboard image with animated stat cards |
| **FAQ** | Animated accordion with 6 questions |
| **CTA Banner** | Full-width conversion section |
| **Footer** | 5-column footer with social links |

### `login.html` — Login Page

| Feature | Detail |
|---|---|
| Left branding panel | Animated orbs, particles, feature pills |
| Social login | Google + GitHub sign-in buttons |
| Email/Password form | Full client-side validation |
| Password visibility toggle | Show/hide with eye icon |
| Loading state | Spinner animation on submit |
| Error handling | Inline error messages |
| Demo login | `demo@eventhub.in` / `demo123` |

---

## 🎨 Design System

| Token | Value |
|---|---|
| **Background** | `#0a0818` (deep) · `#0f0c29` (dark) |
| **Primary Gradient** | `135deg, #7c3aed → #a855f7 → #ec4899` |
| **Text Gradient** | `#a78bfa → #f472b6 → #60a5fa` |
| **Accent Purple** | `#a78bfa` |
| **Heading Font** | Outfit (800–900 weight) |
| **Body Font** | Inter (400–600 weight) |
| **Border Radius** | `8px / 14px / 20px / 28px / 999px` |

---

## 🛠️ Built With

| Technology | Purpose |
|---|---|
| **HTML5** | Semantic page structure |
| **Vanilla CSS3** | Styling, animations, glassmorphism, responsive layout |
| **Vanilla JavaScript** | Interactivity — scroll animations, counters, FAQ, navbar |
| **[Lucide Icons](https://lucide.dev/)** | Icon library (CDN) |
| **[Google Fonts](https://fonts.google.com/)** | Inter + Outfit typefaces |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. **Fork** the repo
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a **Pull Request**

---

## 📝 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

## 👤 Author

**Gaurav Kumar**
- GitHub: [@gauravkumar-ops](https://github.com/gauravkumar-ops)
- Email: gauravkumarmgm@gmail.com

---

<div align="center">

Made with ❤️ for student organisers across India

⭐ **Star this repo if you found it helpful!** ⭐

</div>
