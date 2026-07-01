/* =====================================================
   main.js — SITE INTERACTIONS (Clean & Fixed)
   ===================================================== */

// 1. АНИМАЦИИ ПОЯВЛЕНИЯ (Scroll Reveal)
function initScrollReveal() {
    const targets = document.querySelectorAll('.stat-card, .mission-card, .team-card, .event-item, .section-title');
    if (targets.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    targets.forEach(el => {
        el.style.opacity = "0";
        el.style.transform = "translateY(24px)";
        el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
        observer.observe(el);
    });
}

// 2. ЛЕТАЮЩИЙ ХЕДЕР
function initHeaderFlying() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    }, { passive: true });
}

// 3. ВЫПАДАЮЩЕЕ МЕНЮ (С ФИКСИРОВАННЫМ ТАЙМЕРОМ)
function initDropdowns() {
    const navDropdown = document.querySelector('.nav-dropdown');
    const dropdownNested = document.querySelector('.dropdown-nested');
    if (!navDropdown) return;

    let mainTimer;

    // Главное меню
    navDropdown.addEventListener('mouseenter', () => {
        clearTimeout(mainTimer);
        navDropdown.classList.add('open');
    });

    navDropdown.addEventListener('mouseleave', () => {
        mainTimer = setTimeout(() => {
            navDropdown.classList.remove('open');
            if (dropdownNested) dropdownNested.classList.remove('open');
        }, 500); // Держим 0.5 секунды
    });

    // Вложенное меню (Team Members)
    if (dropdownNested) {
        dropdownNested.addEventListener('mouseenter', () => {
            dropdownNested.classList.add('open');
        });
        dropdownNested.addEventListener('mouseleave', (e) => {
            // Останавливаем всплытие, чтобы не закрыть всё сразу
            e.stopPropagation();
            dropdownNested.classList.remove('open');
        });
    }
}

// 4. СЛАЙДЕР (Универсальная версия)
function initSlider() {
    const track = document.getElementById('sliderTrack');
    const dotsEl = document.getElementById('sliderDots');
    const prev = document.getElementById('sliderPrev');
    const next = document.getElementById('sliderNext');

    if (!track) return;

    const slides = Array.from(track.children);
    const totalSlides = slides.length;
    let current = 0;
    let autoTimer = null;

    // Создание точек
    if (dotsEl) {
        dotsEl.innerHTML = ''; 
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `Slide ${i + 1}`);
            dot.addEventListener('click', () => {
                goTo(i);
                resetAuto();
            });
            dotsEl.appendChild(dot);
        });
    }

    function goTo(index) {
        current = (index + totalSlides) % totalSlides;
        track.style.transform = `translateX(-${current * 100}%)`;
        if (dotsEl) {
            const dots = dotsEl.querySelectorAll('.slider-dot');
            dots.forEach((dot, i) => dot.classList.toggle('active', i === current));
        }
    }

    if (next) next.addEventListener('click', () => { goTo(current + 1); resetAuto(); });
    if (prev) prev.addEventListener('click', () => { goTo(current - 1); resetAuto(); });

    function startAuto() {
        autoTimer = setInterval(() => goTo(current + 1), 5000);
    }

    function resetAuto() {
        clearInterval(autoTimer);
        startAuto();
    }

    // Свайпы
    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? goTo(current + 1) : goTo(current - 1);
            resetAuto();
        }
    }, { passive: true });

    startAuto();
}

// ЗАПУСК
document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initHeaderFlying();
    initSlider();
    initDropdowns();
});