/* ============================================================
   EventHub — app.js  (ES Module)
   Firebase imports MUST stay at the very top of the file.
   ============================================================ */

import { initializeApp }                      from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey:            "",
  authDomain:        "event-hub-36864.firebaseapp.com",
  projectId:         "event-hub-36864",
  storageBucket:     "event-hub-36864.firebasestorage.app",
  messagingSenderId: "260968384601",
  appId:             "1:260968384601:web:3d825f81f8f3d6351ec948"
};

const fbApp = initializeApp(firebaseConfig);
const auth  = getAuth(fbApp);

/* ── STEP 1 — Instant pre-render (synchronous sessionStorage) ─
   Prevents the "Log In" button flash for returning signed-in users.   */
(function preRenderNavbar() {
  try {
    const u = JSON.parse(localStorage.getItem('eventhub_user') || 'null');
    if (u) renderUserNav(u.displayName || u.email?.split('@')[0], u.photoURL, u.email);
  } catch (_) {}
})();

/* ── STEP 2 — Firebase Auth listener (authoritative) ────────── */
onAuthStateChanged(auth, (user) => {
  const navCta = document.querySelector('.nav-cta');
  if (!navCta) return;

  if (!user) {
    // Guard: if localStorage still has a user, Firebase may just be slow
    // to restore the session (IndexedDB async). Don't flash "Log In" yet.
    const cached = localStorage.getItem('eventhub_user');
    if (cached) return;  // wait — Firebase will fire again with the user

    // Truly signed out — show login buttons
    navCta.innerHTML = `
      <a href="login.html?action=login" class="btn btn-ghost" id="login-btn">Log In</a>
      <a href="login.html?action=login" class="btn btn-primary" id="get-started-btn">Get Started Free</a>`;
    return;
  }

  const stored = {
    uid:         user.uid,
    email:       user.email,
    displayName: user.displayName || user.email?.split('@')[0] || 'Organizer',
    photoURL:    user.photoURL || null
  };
  localStorage.setItem('eventhub_user', JSON.stringify(stored));
  renderUserNav(stored.displayName, stored.photoURL, stored.email);
});

/* ── Helpers ─────────────────────────────────────────────────── */

function renderUserNav(displayName, photoURL, email) {
  const navCta = document.querySelector('.nav-cta');
  if (!navCta) return;
  navCta.innerHTML = buildDropdownHTML(displayName, photoURL, email);
  if (window.lucide) window.lucide.createIcons();
  bindDropdownEvents();
}

function buildDropdownHTML(displayName, photoURL, email) {
  const initials = (displayName || '?')
    .split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('');

  const avatar = photoURL
    ? `<img src="${photoURL}" alt="${displayName}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #a78bfa;flex-shrink:0;">`
    : `<div style="width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:.82rem;flex-shrink:0;">${initials}</div>`;

  return `
    <div style="position:relative;" id="eh-user-wrap">
      <button id="eh-menu-btn" style="display:flex;align-items:center;gap:9px;background:rgba(255,255,255,.07);padding:4px 14px 4px 4px;border-radius:999px;border:1px solid rgba(255,255,255,.14);cursor:pointer;color:#f8fafc;transition:.2s;">
        ${avatar}
        <div style="text-align:left;line-height:1.2;pointer-events:none;">
          <div style="font-size:.84rem;font-weight:600;max-width:110px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${displayName}</div>
          <div style="font-size:.68rem;color:#64748b;">Account ▾</div>
        </div>
      </button>

      <div id="eh-dropdown" style="display:none;position:absolute;right:0;top:calc(100% + 10px);width:248px;background:#0d0b1e;border:1px solid rgba(255,255,255,.13);border-radius:16px;padding:8px;box-shadow:0 16px 48px rgba(0,0,0,.65);backdrop-filter:blur(24px);z-index:9999;">
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px 12px;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:6px;">
          ${avatar}
          <div style="min-width:0;">
            <div style="font-size:.84rem;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${displayName}</div>
            <div style="font-size:.72rem;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${email}</div>
          </div>
        </div>

        <a href="login.html?action=login" style="display:flex;align-items:center;gap:9px;padding:10px 12px;font-size:.83rem;color:#cbd5e1;border-radius:10px;text-decoration:none;transition:.15s;" onmouseover="this.style.background='rgba(167,139,250,.1)'" onmouseout="this.style.background='transparent'">
          <i data-lucide="refresh-cw" style="width:15px;height:15px;color:#a78bfa;"></i> Switch Account
        </a>

        <div style="height:1px;background:rgba(255,255,255,.07);margin:4px 0;"></div>

        <button id="eh-signout" style="width:100%;display:flex;align-items:center;gap:9px;padding:10px 12px;font-size:.83rem;color:#f87171;background:none;border:none;border-radius:10px;cursor:pointer;text-align:left;transition:.15s;" onmouseover="this.style.background='rgba(248,113,113,.1)'" onmouseout="this.style.background='transparent'">
          <i data-lucide="log-out" style="width:15px;height:15px;"></i> Sign Out
        </button>
      </div>
    </div>`;
}

function bindDropdownEvents() {
  const btn      = document.getElementById('eh-menu-btn');
  const dropdown = document.getElementById('eh-dropdown');
  if (!btn || !dropdown) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
  });

  // Close on outside click — use capture so it fires before btn click
  document.addEventListener('click', () => { if (dropdown) dropdown.style.display = 'none'; });

  document.getElementById('eh-signout')?.addEventListener('click', async () => {
    localStorage.removeItem('eventhub_user');
    sessionStorage.removeItem('eventhub_user');
    try { await signOut(auth); } catch (e) { console.warn('signOut error', e); }
    window.location.href = 'login.html?action=login';
  });
}

/* ── Page init ───────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) window.lucide.createIcons();
  if (document.getElementById('eh-menu-btn')) bindDropdownEvents();

  initParticles();
  initNavbar();
  initHamburger();
  initScrollAnimations();
  initCounters();
  initFAQ();
  initPricingToggle();
  initBackToTop();
  initSmoothScroll();
});

/* ── Particles ───────────────────────────────────────────────── */
function initParticles() {
  const c = document.getElementById('particles');
  if (!c) return;
  const colors = ['#7c3aed','#a855f7','#ec4899','#3b82f6','#22d3ee'];
  for (let i = 0; i < 25; i++) {
    const p   = document.createElement('div');
    p.className = 'particle';
    const sz  = Math.random() * 5 + 2;
    p.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation-duration:${Math.random()*15+10}s;animation-delay:${Math.random()*10}s;opacity:${Math.random()*.5+.1};`;
    c.appendChild(p);
  }
}

/* ── Navbar scroll ───────────────────────────────────────────── */
function initNavbar() {
  const n = document.getElementById('navbar');
  if (!n) return;
  window.addEventListener('scroll', () => n.classList.toggle('scrolled', window.scrollY > 20), { passive: true });
}

/* ── Hamburger ───────────────────────────────────────────────── */
function initHamburger() {
  const btn  = document.getElementById('hamburger');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;
  btn.addEventListener('click', () => menu.classList.toggle('open'));
  menu.querySelectorAll('a').forEach(l => l.addEventListener('click', () => menu.classList.remove('open')));
}

/* ── Scroll animations ───────────────────────────────────────── */
function initScrollAnimations() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) { setTimeout(() => e.target.classList.add('visible'), i * 80); obs.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el));
}

/* ── Counters ────────────────────────────────────────────────── */
function initCounters() {
  const els = document.querySelectorAll('.stat-num[data-target]');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); obs.unobserve(e.target); } });
  }, { threshold: 0.5 });
  els.forEach(el => obs.observe(el));
}
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const step   = target / (1800 / 16);
  let cur = 0;
  const t = setInterval(() => {
    cur = Math.min(cur + step, target);
    el.textContent = Math.floor(cur).toLocaleString();
    if (cur >= target) { el.textContent = target.toLocaleString(); clearInterval(t); }
  }, 16);
}

/* ── FAQ ─────────────────────────────────────────────────────── */
function initFAQ() {
  document.querySelectorAll('.faq-item').forEach(item => {
    item.querySelector('.faq-question')?.addEventListener('click', () => {
      const open = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!open) item.classList.add('open');
    });
  });
}

/* ── Pricing toggle ──────────────────────────────────────────── */
function initPricingToggle() {
  const toggle = document.getElementById('pricing-toggle');
  if (!toggle) return;
  toggle.addEventListener('change', () => {
    const annual = toggle.checked;
    document.querySelectorAll('.price-amount[data-monthly]').forEach(el => {
      el.textContent = parseInt(annual ? el.dataset.annual : el.dataset.monthly).toLocaleString();
    });
    const ml = document.getElementById('monthly-label');
    const al = document.getElementById('annual-label');
    if (ml) ml.style.color = annual ? 'var(--text-muted)' : 'var(--text-primary)';
    if (al) al.style.color = annual ? 'var(--text-primary)' : 'var(--text-muted)';
  });
}

/* ── Back to top ─────────────────────────────────────────────── */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 500), { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ── Smooth scroll ───────────────────────────────────────────── */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const t = document.querySelector(link.getAttribute('href'));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
}
