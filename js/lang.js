/* =====================================================
   lang.js — GEORGIAN / ENGLISH TRANSLATION + ALL UI
   =====================================================
   HOW IT WORKS:
   Every translatable element in the HTML has two
   data-attributes:
     data-ka="Georgian text"
     data-en="English text"

   When the user clicks the language button, this
   script reads the current language, flips it, and
   updates every element's text to the new language.

   TO ADD A NEW LANGUAGE:
   1. Add a data-xx="..." attribute to every element
      in index.html (where xx = your language code).
   2. Add a case to the switch in applyLanguage().

   This file also handles:
   - Dropdown navigation menus (main + nested)
   - Image slider with arrows, dots, and autoplay
   ===================================================== */


/* ─────────────────────────────────────────
   LANGUAGE
───────────────────────────────────────── */

// Current active language — starts in Georgian
let currentLang = 'ka';

/**
 * Called by the button in the header.
 * Toggles between 'ka' (Georgian) and 'en' (English).
 */
function toggleLanguage() {
  currentLang = (currentLang === 'ka') ? 'en' : 'ka';
  applyLanguage(currentLang);
  updateLangButton(currentLang);

  // Save preference so it persists on page reload
  localStorage.setItem('paits_lang', currentLang);
}

/**
 * Walks every element that has data-ka / data-en
 * and sets its innerHTML to the chosen language.
 */
function applyLanguage(lang) {
  const elements = document.querySelectorAll('[data-ka]');
  elements.forEach(el => {
    const text = el.getAttribute(`data-${lang}`);
    if (text !== null) {
      el.innerHTML = text; // innerHTML allows <br> tags in headings
    }
  });

  // Also update the <html lang="..."> attribute for accessibility
  document.documentElement.lang = lang;
}

/**
 * Updates the language toggle button label.
 * When showing Georgian → button shows EN (to switch to English).
 * When showing English  → button shows KA (to switch to Georgian).
 */
function updateLangButton(lang) {
  const label = document.getElementById('langLabel');
  const flag  = document.querySelector('.flag-icon');

  if (lang === 'en') {
    if (label) label.textContent = 'KA';
    if (flag)  flag.style.opacity = '0.5';
  } else {
    if (label) label.textContent = 'EN';
    if (flag)  flag.style.opacity = '1';
  }
}

/**
 * Runs when the page first loads.
 * Checks if user had a saved language preference.
 */
function initLanguage() {
  const saved = localStorage.getItem('paits_lang');
  if (saved && saved !== currentLang) {
    currentLang = saved;
    applyLanguage(currentLang);
    updateLangButton(currentLang);
  } else {
    applyLanguage('ka');
  }
}


/* ─────────────────────────────────────────
   DROPDOWN NAVIGATION
───────────────────────────────────────── */

function initDropdowns() {
  // ── Main dropdown (top-level "About Us") ──
  const navDropdowns = document.querySelectorAll('.nav-dropdown');

  navDropdowns.forEach(dropdown => {
    const trigger = dropdown.querySelector('.nav-top-link');

    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = dropdown.classList.contains('open');
      // Close all dropdowns first
      closeAllDropdowns();
      if (!isOpen) dropdown.classList.add('open');
    });
  });

  // ── Nested dropdown ("Team Members" → sub-items) ──
  const nestedDropdowns = document.querySelectorAll('.dropdown-nested');

  nestedDropdowns.forEach(nested => {
    const trigger = nested.querySelector('.has-children');

    trigger.addEventListener('click', e => {
      e.stopPropagation();
      const isOpen = nested.classList.contains('open');
      // Close all nested menus first
      nestedDropdowns.forEach(n => n.classList.remove('open'));
      if (!isOpen) nested.classList.add('open');
    });
  });

  // ── Click outside closes everything ──
  document.addEventListener('click', () => {
    closeAllDropdowns();
  });

  // ── Escape key closes everything ──
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllDropdowns();
  });
}

function closeAllDropdowns() {
  document.querySelectorAll('.nav-dropdown').forEach(d => d.classList.remove('open'));
  document.querySelectorAll('.dropdown-nested').forEach(n => n.classList.remove('open'));
}


/* ─────────────────────────────────────────
   IMAGE SLIDER
───────────────────────────────────────── */

function initSlider() {
  const track  = document.getElementById('sliderTrack');
  const prev   = document.getElementById('sliderPrev');
  const next   = document.getElementById('sliderNext');
  const dotsEl = document.getElementById('sliderDots');

  // If this page has no slider, exit silently
  if (!track) return;

  const slides     = track.querySelectorAll('.slide');
  const totalSlides = slides.length;
  let   current    = 0;
  let   autoTimer  = null;

  // ── Build dots ──
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(dot);
  });

  function goTo(index) {
    current = (index + totalSlides) % totalSlides;
    track.style.transform = `translateX(-${current * 100}%)`;
    dotsEl.querySelectorAll('.slider-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
    });
  }

  function goNext() { goTo(current + 1); }
  function goPrev() { goTo(current - 1); }

  // ── Arrow buttons ──
  if (next) next.addEventListener('click', () => { goNext(); resetAuto(); });
  if (prev) prev.addEventListener('click', () => { goPrev(); resetAuto(); });

  // ── Autoplay every 5 s ──
  function startAuto() {
    autoTimer = setInterval(goNext, 5000);
  }
  function resetAuto() {
    clearInterval(autoTimer);
    startAuto();
  }

  // ── Touch / swipe support ──
  let touchStartX = 0;
  track.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? goNext() : goPrev();
      resetAuto();
    }
  }, { passive: true });

  // ── Pause autoplay when tab is hidden ──
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(autoTimer);
    else startAuto();
  });

  startAuto();
}


/* ─────────────────────────────────────────
   INIT ON DOM READY
───────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  initDropdowns();
  initSlider();
});
