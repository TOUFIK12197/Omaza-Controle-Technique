/* =============================================
   OMAZA - Contrôle Technique Auto
   JavaScript Principal
============================================= */

// ── HEADER SCROLL ──
const header = document.getElementById('header');
if (header) {
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 60);
        // Back to top button
        const btn = document.getElementById('backToTop');
        if (btn) btn.classList.toggle('visible', window.scrollY > 300);
    });
}

// ── HAMBURGER ──
const hamburger = document.getElementById('hamburger');
const navMenu   = document.getElementById('navMenu');

if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('open');
        document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('click', (e) => {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) closeMenu();
    });
}

function closeMenu() {
    hamburger?.classList.remove('active');
    navMenu?.classList.remove('open');
    document.body.style.overflow = '';
}

// ── NOTIFICATIONS ──
function showNotif(msg, type = 'success') {
    const notif = document.getElementById('notification');
    const text  = document.getElementById('notifText');
    const icon  = document.getElementById('notifIcon');
    if (!notif || !text) return;

    text.textContent = msg;
    notif.style.borderLeftColor = type === 'error' ? '#e74c3c' : '#27ae60';
    if (icon) {
        icon.className = type === 'error'
            ? 'fas fa-exclamation-circle'
            : 'fas fa-check-circle';
        icon.style.color = type === 'error' ? '#e74c3c' : '#27ae60';
    }

    notif.classList.add('show');
    clearTimeout(notif._timer);
    notif._timer = setTimeout(() => notif.classList.remove('show'), 4500);
}

function closeNotif() {
    document.getElementById('notification')?.classList.remove('show');
}

// ── KEYBOARD ──
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMenu();
        document.querySelectorAll('.modal-overlay.show')
            .forEach(m => m.classList.remove('show'));
    }
});

// ── SCROLL ANIMATION ──
document.addEventListener('DOMContentLoaded', () => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    const selectors = '.vehicle-card, .why-feature, .process-card, .review-card, .info-card, .location-card';
    document.querySelectorAll(selectors).forEach((el, i) => {
        el.style.cssText += `opacity:0; transform:translateY(24px);
            transition: opacity 0.5s ease ${i * 0.08}s, transform 0.5s ease ${i * 0.08}s`;
        observer.observe(el);
    });
});

// ── FORMAT IMMATRICULATION ──
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[id*="immat"], [id*="Immat"]').forEach(input => {
        input.addEventListener('input', function() {
            let v = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
            if (v.length > 2 && v.length <= 5)      v = v.slice(0,2) + '-' + v.slice(2);
            else if (v.length > 5)                    v = v.slice(0,2) + '-' + v.slice(2,5) + '-' + v.slice(5,7);
            this.value = v;
        });
    });

    // FORMAT TELEPHONE
    document.querySelectorAll('input[type="tel"]').forEach(phone => {
        phone.addEventListener('input', function() {
            let v = this.value.replace(/\D/g,'').slice(0, 12);
            this.value = v;
        });
    });
});

// ── SMOOTH SCROLL ──
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        // Un lien « # » sert parfois de bouton JavaScript : ce n'est pas un sélecteur valide.
        if (href === '#') {
            e.preventDefault();
            return;
        }
        const target = document.querySelector(href);
        if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
});

// ── SWITCH TAB (inscription) ──
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    ['inscription','connexion'].forEach(id => {
        const el = document.getElementById('tab-' + id);
        if (el) el.style.display = id === tab ? 'block' : 'none';
    });
    document.querySelectorAll('.tab').forEach(t => {
        if (t.textContent.toLowerCase().includes(tab)) t.classList.add('active');
    });
}

console.log('%c🛡️ Centre Contrôle Technique OMAZA', 'color:#c0392b; font-size:16px; font-weight:900;');
console.log('%c📍 Akbou, Béjaia, Algérie', 'color:#6c757d; font-size:13px;');
