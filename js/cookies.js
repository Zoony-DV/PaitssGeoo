/* =============================================================
   cookies.js — GDPR Cookie Consent для PAITS Georgia
   
   Как работает:
   - При первом визите показывается баннер внизу страницы
   - Если пользователь нажал "Согласен" → EmailJS загружается
   - Если нажал "Только необходимые" → EmailJS НЕ загружается,
     форма показывает сообщение с прямым email
   - Выбор сохраняется на 365 дней
   - Баннер больше не показывается после выбора
   ============================================================= */

// ── КОНФИГ ──────────────────────────────────────────────────
const COOKIE_NAME    = 'paits_cookie_consent';
const COOKIE_DAYS    = 365;
const EMAILJS_KEY    = 'YOUR_PUBLIC_KEY';    // ← замени
const EMAILJS_SVC    = 'YOUR_SERVICE_ID';    // ← замени
const EMAILJS_TPL    = 'YOUR_TEMPLATE_ID';   // ← замени
const CONTACT_EMAIL  = 'info@paitsgeorgia.ge';
// ────────────────────────────────────────────────────────────


// ── COOKIE HELPERS ───────────────────────────────────────────
function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  // Secure + SameSite=Lax — стандартная защита
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name) {
  return document.cookie.split('; ').reduce((acc, part) => {
    const [k, v] = part.split('=');
    return k === name ? decodeURIComponent(v) : acc;
  }, null);
}
// ────────────────────────────────────────────────────────────


// ── EMAILJS LOADER ───────────────────────────────────────────
// Загружается ТОЛЬКО если пользователь дал согласие
let emailjsReady = false;

function loadEmailJS() {
  if (emailjsReady) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    s.onload = () => {
      emailjs.init({ publicKey: EMAILJS_KEY });
      emailjsReady = true;
      resolve();
    };
    s.onerror = () => reject(new Error('EmailJS failed to load'));
    document.head.appendChild(s);
  });
}
// ────────────────────────────────────────────────────────────


// ── COOKIE BANNER ────────────────────────────────────────────
function showCookieBanner() {
  // Не показываем если уже выбрано
  if (getCookie(COOKIE_NAME)) return;

  const isKa = (typeof currentLang !== 'undefined' ? currentLang : 'ka') === 'ka';

  const banner = document.createElement('div');
  banner.id = 'cookieBanner';
  banner.innerHTML = `
    <div class="cb-text">
      <strong>${isKa ? '🍪 ვიყენებთ Cookies-ს' : '🍪 We use Cookies'}</strong>
      <p>${isKa
        ? 'ჩვენ ვიყენებთ EmailJS სერვისს საკონტაქტო ფორმის გასამართად. ამისთვის საჭიროა თქვენი თანხმობა.'
        : 'We use the EmailJS service to power our contact form. Your consent is required for this.'
      }</p>
    </div>
    <div class="cb-actions">
      <button id="cbAccept">${isKa ? '✅ ვეთანხმები' : '✅ Accept'}</button>
      <button id="cbDecline">${isKa ? 'მხოლოდ საჭირო' : 'Essential only'}</button>
    </div>
  `;

  // Стили баннера — встроены сюда чтобы работало без доп. CSS файла
  const style = document.createElement('style');
  style.textContent = `
    #cookieBanner {
      position: fixed;
      bottom: 0; left: 0; right: 0;
      z-index: 9999;
      background: #1a1a2e;
      color: rgba(255,255,255,0.85);
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      box-shadow: 0 -4px 24px rgba(0,0,0,0.4);
      font-family: 'Source Sans 3', sans-serif;
      font-size: 0.88rem;
      flex-wrap: wrap;
      animation: slideUp 0.35s ease;
    }
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    #cookieBanner .cb-text strong {
      display: block;
      color: #fff;
      margin-bottom: 0.2rem;
      font-size: 0.95rem;
    }
    #cookieBanner .cb-text p {
      margin: 0;
      color: rgba(255,255,255,0.65);
      max-width: 600px;
      line-height: 1.5;
    }
    #cookieBanner .cb-actions {
      display: flex;
      gap: 0.75rem;
      flex-shrink: 0;
      flex-wrap: wrap;
    }
    #cbAccept {
      background: #c8102e;
      color: #fff;
      border: none;
      padding: 0.6rem 1.4rem;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 0.88rem;
      transition: background 0.2s;
    }
    #cbAccept:hover { background: #a30d24; }
    #cbDecline {
      background: transparent;
      color: rgba(255,255,255,0.6);
      border: 1px solid rgba(255,255,255,0.25);
      padding: 0.6rem 1.4rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.88rem;
      transition: border-color 0.2s, color 0.2s;
    }
    #cbDecline:hover {
      border-color: rgba(255,255,255,0.5);
      color: rgba(255,255,255,0.85);
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(banner);

  // Принял
  document.getElementById('cbAccept').addEventListener('click', () => {
    setCookie(COOKIE_NAME, 'accepted', COOKIE_DAYS);
    banner.remove();
    loadEmailJS();
  });

  // Отказался
  document.getElementById('cbDecline').addEventListener('click', () => {
    setCookie(COOKIE_NAME, 'declined', COOKIE_DAYS);
    banner.remove();
  });
}
// ────────────────────────────────────────────────────────────


// ── CONTACT FORM ─────────────────────────────────────────────
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  // Rate limiting — не более 3 отправок за сессию
  let sendCount = 0;
  const MAX_SENDS = 3;

  // Валидация email
  const isValidEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

  // Очистка от HTML/JS (защита от XSS)
  const sanitize = (str) =>
    String(str).replace(/<[^>]*>/g, '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c])).trim().slice(0, 2000);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1. Honeypot — если бот заполнил скрытое поле, тихо игнорируем
    const honey = form.querySelector('.form-honeypot input');
    if (honey && honey.value.length > 0) {
      showFormStatus('success'); // притворяемся что отправили
      form.reset();
      return;
    }

    // 2. Rate limit
    if (sendCount >= MAX_SENDS) {
      showFormStatus('error',
        (typeof currentLang !== 'undefined' && currentLang === 'ka')
          ? 'მაქსიმალური გაგზავნების ლიმიტი ამოიწურა. სცადეთ მოგვიანებით.'
          : 'Too many submissions. Please try again later.'
      );
      return;
    }

    // 3. Базовая валидация
    const emailVal = form.querySelector('[name="from_email"]')?.value || '';
    if (!isValidEmail(emailVal)) {
      showFormStatus('error',
        (typeof currentLang !== 'undefined' && currentLang === 'ka')
          ? 'გთხოვთ შეიყვანოთ სწორი ელ-ფოსტა.'
          : 'Please enter a valid email address.'
      );
      return;
    }

    const nameVal = form.querySelector('[name="from_name"]')?.value || '';
    if (nameVal.trim().length < 2) {
      showFormStatus('error',
        (typeof currentLang !== 'undefined' && currentLang === 'ka')
          ? 'გთხოვთ შეიყვანოთ სახელი.'
          : 'Please enter your name.'
      );
      return;
    }

    const btn = form.querySelector('.btn-submit');
    btn.disabled = true;
    btn.textContent = (typeof currentLang !== 'undefined' && currentLang === 'ka')
      ? 'იგზავნება...' : 'Sending...';

    // 4. Проверяем согласие на cookies
    const consent = getCookie(COOKIE_NAME);

    if (consent !== 'accepted') {
      // Пользователь отказался от cookies — форма не работает,
      // показываем прямой email
      showFormStatus('declined');
      btn.disabled = false;
      btn.textContent = (typeof currentLang !== 'undefined' && currentLang === 'ka')
        ? '📨 გაგზავნა' : '📨 Send Message';
      return;
    }

    // 5. Загружаем EmailJS если ещё не загружен
    try {
      await loadEmailJS();
    } catch {
      showFormStatus('error');
      btn.disabled = false;
      btn.textContent = (typeof currentLang !== 'undefined' && currentLang === 'ka')
        ? '📨 გაგზავნა' : '📨 Send Message';
      return;
    }

    // 6. Собираем и отправляем
    const params = {
      from_name:  sanitize(nameVal),
      from_email: sanitize(emailVal),
      subject:    sanitize(form.querySelector('[name="subject"]')?.value || 'Contact Form'),
      message:    sanitize(form.querySelector('[name="message"]')?.value || ''),
      phone:      sanitize(form.querySelector('[name="phone"]')?.value || '—'),
    };

    try {
      await emailjs.send(EMAILJS_SVC, EMAILJS_TPL, params);
      sendCount++;
      showFormStatus('success');
      form.reset();
    } catch (err) {
      console.error('EmailJS error:', err);
      showFormStatus('error');
    } finally {
      btn.disabled = false;
      btn.textContent = (typeof currentLang !== 'undefined' && currentLang === 'ka')
        ? '📨 გაგზავნა' : '📨 Send Message';
    }
  });
}

function showFormStatus(type, customMsg) {
  const el = document.getElementById('formStatus');
  if (!el) return;

  const isKa = (typeof currentLang !== 'undefined' ? currentLang : 'ka') === 'ka';

  const msgs = {
    success:  { ka: '✅ შეტყობინება გაიგზავნა! მალე დაგიკავშირდებით.', en: '✅ Message sent! We will get back to you soon.' },
    error:    { ka: '❌ გაგზავნა ვერ მოხერხდა. სცადეთ კიდევ ერთხელ.', en: '❌ Failed to send. Please try again.' },
    declined: {
      ka: `⚠️ ფორმა მოითხოვს Cookies-ს. პირდაპირ დაგვიკავშირდით: <a href="mailto:${CONTACT_EMAIL}" style="color:#4a7abf">${CONTACT_EMAIL}</a>`,
      en: `⚠️ Form requires cookies. Contact us directly: <a href="mailto:${CONTACT_EMAIL}" style="color:#4a7abf">${CONTACT_EMAIL}</a>`
    }
  };

  el.className = `form-status ${type === 'declined' ? 'error' : type}`;
  el.innerHTML = customMsg || msgs[type]?.[isKa ? 'ka' : 'en'] || msgs[type].en;
  el.style.display = 'block';

  if (type !== 'declined') {
    setTimeout(() => { el.style.display = 'none'; }, 7000);
  }
}
// ────────────────────────────────────────────────────────────


// ── HEADER SHRINK ────────────────────────────────────────────
function initHeaderShrink() {
  const header = document.querySelector('.site-header');
  if (!header) return;
  window.addEventListener('scroll', () => {
    header.style.boxShadow = window.scrollY > 60
      ? '0 3px 24px rgba(0,0,0,0.35)' : '';
  }, { passive: true });
}
// ────────────────────────────────────────────────────────────


// ── DROPDOWNS ────────────────────────────────────────────────
function initDropdowns() {
  const navDropdown = document.querySelector('.nav-dropdown');
  if (!navDropdown) return;

  let closeTimer = null;
  const openDropdown  = () => { clearTimeout(closeTimer); navDropdown.classList.add('open'); };
  const scheduleClose = () => {
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      navDropdown.classList.remove('open');
      navDropdown.querySelectorAll('.dropdown-nested.open')
        .forEach(el => el.classList.remove('open'));
    }, 700);
  };

  navDropdown.addEventListener('mouseenter', openDropdown);
  navDropdown.addEventListener('mouseleave', scheduleClose);

  navDropdown.querySelectorAll('.dropdown-nested').forEach(nested => {
    let t = null;
    nested.addEventListener('mouseenter', () => {
      clearTimeout(t);
      navDropdown.querySelectorAll('.dropdown-nested')
        .forEach(o => { if (o !== nested) o.classList.remove('open'); });
      nested.classList.add('open');
    });
    nested.addEventListener('mouseleave', () => {
      t = setTimeout(() => nested.classList.remove('open'), 300);
    });
    const sub = nested.querySelector('.nested-menu');
    if (sub) {
      sub.addEventListener('mouseenter', () => clearTimeout(t));
      sub.addEventListener('mouseleave', () => {
        t = setTimeout(() => nested.classList.remove('open'), 300);
      });
    }
  });
}
// ────────────────────────────────────────────────────────────


// ── SCROLL REVEAL ────────────────────────────────────────────
function initScrollReveal() {
  const targets = document.querySelectorAll(
    '.card, .team-card, .timeline-item, .value-item, .training-card, .stat-box, .founder-card'
  );
  targets.forEach(el => el.classList.add('reveal'));

  const obs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  targets.forEach(el => obs.observe(el));
}
// ────────────────────────────────────────────────────────────


// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Если уже дал согласие раньше — сразу грузим EmailJS
  if (getCookie(COOKIE_NAME) === 'accepted') {
    loadEmailJS();
  }

  showCookieBanner();
  initHeaderShrink();
  initDropdowns();
  initScrollReveal();
  initContactForm();
});