// ============================================================
// main.js — site-wide orchestration for Clear Net Sky / S.O.W.A
// Loaded on every page. Provides the toast system, theme engine,
// authentication UX, form handling, navigation and scroll chrome.
// ============================================================

/* ---------------------------------------------------------------
   Toast notifications (global, used by every module)
   --------------------------------------------------------------- */
const Toast = (() => {
    let container;
    const icons = {
        success: 'fa-circle-check',
        error: 'fa-circle-exclamation',
        warning: 'fa-triangle-exclamation',
        info: 'fa-circle-info'
    };

    function ensureContainer() {
        if (!container) {
            container = document.getElementById('toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toast-container';
                document.body.appendChild(container);
            }
        }
        return container;
    }

    function show(message, type = 'info', title = '', timeout = 4500) {
        ensureContainer();
        const el = document.createElement('div');
        el.className = `toast ${type}`;
        el.setAttribute('role', 'status');
        el.innerHTML = `
            <i class="fas ${icons[type] || icons.info}"></i>
            <div class="toast-body">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-text"></div>
            </div>
            <button class="toast-close" aria-label="Close">&times;</button>`;
        el.querySelector('.toast-text').textContent = message;
        container.appendChild(el);

        requestAnimationFrame(() => el.classList.add('show'));

        const dismiss = () => {
            el.classList.add('hide');
            el.classList.remove('show');
            setTimeout(() => el.remove(), 400);
        };
        el.querySelector('.toast-close').addEventListener('click', dismiss);
        if (timeout) setTimeout(dismiss, timeout);
        return el;
    }

    return { show };
})();
window.Toast = Toast;

/* Small helper: translate via the language manager when available. */
function tr(key, fallback) {
    if (window.languageManager && typeof window.languageManager.t === 'function') {
        return window.languageManager.t(key);
    }
    return fallback || key;
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/* ---------------------------------------------------------------
   Theme engine — four selectable schemes with a pop-over picker
   --------------------------------------------------------------- */
const ThemeManager = {
    themes: ['cyber-theme', 'matrix-theme', 'crimson-theme', 'light-theme'],
    labels: {
        'cyber-theme': 'Midnight',
        'matrix-theme': 'Emerald',
        'crimson-theme': 'Crimson',
        'light-theme': 'Daylight'
    },
    swatch: { 'cyber-theme': 'cyber', 'matrix-theme': 'matrix', 'crimson-theme': 'crimson', 'light-theme': 'light' },

    current() {
        const saved = localStorage.getItem('cns-theme');
        return this.themes.includes(saved) ? saved : 'cyber-theme';
    },

    apply(theme, announce = false) {
        if (!this.themes.includes(theme)) theme = 'cyber-theme';
        document.body.classList.remove(...this.themes);
        document.body.classList.add(theme);
        localStorage.setItem('cns-theme', theme);
        this.syncMenu(theme);
        if (announce) {
            const name = (window.languageManager &&
                window.languageManager.themeNames[window.languageManager.currentLang][theme]) || this.labels[theme];
            Toast.show(`${tr('msg-theme', 'Theme switched to')} ${name}`, 'info');
        }
    },

    cycle() {
        const idx = this.themes.indexOf(this.current());
        this.apply(this.themes[(idx + 1) % this.themes.length], true);
    },

    syncMenu(theme) {
        document.querySelectorAll('.theme-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.theme === theme);
        });
    },

    init() {
        this.apply(this.current());

        const toggle = document.getElementById('theme-toggle');
        if (!toggle) return;

        // Build the pop-over picker once
        const wrapper = document.createElement('div');
        wrapper.className = 'theme-switcher';
        toggle.parentNode.insertBefore(wrapper, toggle);
        wrapper.appendChild(toggle);

        const menu = document.createElement('div');
        menu.className = 'theme-menu';
        menu.innerHTML = this.themes.map(t =>
            `<button class="theme-option" data-theme="${t}">
                <span class="theme-swatch ${this.swatch[t]}"></span>${this.labels[t]}
             </button>`).join('');
        wrapper.appendChild(menu);
        this.syncMenu(this.current());

        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('open');
        });

        menu.querySelectorAll('.theme-option').forEach(opt => {
            opt.addEventListener('click', () => {
                this.apply(opt.dataset.theme, true);
                menu.classList.remove('open');
            });
        });

        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) menu.classList.remove('open');
        });
    }
};

/* ---------------------------------------------------------------
   Lightweight session / auth UX (demo, front-end only)
   --------------------------------------------------------------- */
const Auth = {
    user() {
        try { return JSON.parse(localStorage.getItem('cns-session')); }
        catch { return null; }
    },

    render() {
        const loginBtn = document.getElementById('login-btn');
        if (!loginBtn) return;
        const user = this.user();
        const controls = loginBtn.parentNode;

        let chip = document.getElementById('user-chip');
        if (user) {
            loginBtn.style.display = 'none';
            if (!chip) {
                chip = document.createElement('div');
                chip.id = 'user-chip';
                chip.className = 'user-chip';
                controls.appendChild(chip);
            }
            chip.innerHTML = `<i class="fas fa-user-shield"></i><span>${user.name}</span>
                <button class="icon-button small" id="logout-btn" title="${tr('logout', 'Logout')}">
                    <i class="fas fa-right-from-bracket"></i></button>`;
            chip.style.display = 'inline-flex';
            const logout = document.getElementById('logout-btn');
            if (logout) logout.addEventListener('click', () => this.logout());
        } else {
            loginBtn.style.display = '';
            if (chip) chip.style.display = 'none';
        }
    },

    login(name) {
        localStorage.setItem('cns-session', JSON.stringify({ name, ts: Date.now() }));
        this.render();
    },

    logout() {
        localStorage.removeItem('cns-session');
        this.render();
        Toast.show(tr('msg-logged-out', 'You have been signed out.'), 'info');
    }
};

/* ---------------------------------------------------------------
   Form validation helpers
   --------------------------------------------------------------- */
function markInvalid(field, message) {
    field.classList.add('invalid');
    let err = field.parentNode.querySelector('.field-error');
    if (!err) {
        err = document.createElement('span');
        err.className = 'field-error';
        field.parentNode.appendChild(err);
    }
    err.textContent = message;
}

function clearInvalid(field) {
    field.classList.remove('invalid');
    const err = field.parentNode.querySelector('.field-error');
    if (err) err.remove();
}

function validateForm(fields) {
    let ok = true;
    fields.forEach(({ el, type }) => {
        if (!el) return;
        clearInvalid(el);
        const val = el.value.trim();
        if (!val) { markInvalid(el, tr('msg-required', 'Required')); ok = false; }
        else if (type === 'email' && !isValidEmail(val)) { markInvalid(el, tr('msg-bad-email', 'Enter a valid email')); ok = false; }
    });
    return ok;
}

/* ---------------------------------------------------------------
   Button ripple effect
   --------------------------------------------------------------- */
function attachRipples() {
    document.querySelectorAll('.primary-button, .secondary-button, .button').forEach(btn => {
        if (btn.dataset.ripple) return;
        btn.dataset.ripple = '1';
        btn.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

/* ---------------------------------------------------------------
   Inject site chrome (scroll bar, back-to-top, mobile nav toggle)
   so every page benefits without editing each HTML file.
   --------------------------------------------------------------- */
function injectChrome() {
    if (!document.getElementById('scroll-progress')) {
        const bar = document.createElement('div');
        bar.id = 'scroll-progress';
        document.body.appendChild(bar);
    }

    if (!document.getElementById('back-to-top')) {
        const btt = document.createElement('button');
        btt.id = 'back-to-top';
        btt.setAttribute('aria-label', 'Back to top');
        btt.innerHTML = '<i class="fas fa-chevron-up"></i>';
        btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
        document.body.appendChild(btt);
    }

    // Mobile hamburger
    const nav = document.querySelector('.main-nav');
    const controls = document.querySelector('.user-controls') || document.querySelector('.header-container');
    if (nav && controls && !document.querySelector('.nav-toggle')) {
        const toggle = document.createElement('button');
        toggle.className = 'nav-toggle';
        toggle.setAttribute('aria-label', 'Toggle navigation');
        toggle.innerHTML = '<i class="fas fa-bars"></i>';
        toggle.addEventListener('click', () => {
            const open = nav.classList.toggle('open');
            toggle.innerHTML = open ? '<i class="fas fa-xmark"></i>' : '<i class="fas fa-bars"></i>';
        });
        controls.appendChild(toggle);
        nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
            nav.classList.remove('open');
            toggle.innerHTML = '<i class="fas fa-bars"></i>';
        }));
    }
}

function setupScrollChrome() {
    const bar = document.getElementById('scroll-progress');
    const btt = document.getElementById('back-to-top');
    const header = document.querySelector('.main-header');

    const onScroll = () => {
        const h = document.documentElement;
        const scrolled = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
        if (bar) bar.style.width = `${Math.min(scrolled * 100, 100)}%`;
        if (btt) btt.classList.toggle('visible', h.scrollTop > 400);
        if (header) header.classList.toggle('scrolled', h.scrollTop > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

/* ---------------------------------------------------------------
   Live UTC clock for the footer
   --------------------------------------------------------------- */
function startClock() {
    const el = document.getElementById('update-time');
    if (!el) return;
    const tick = () => {
        const now = new Date();
        el.textContent = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    };
    tick();
    setInterval(tick, 1000);
}

/* ---------------------------------------------------------------
   Forms: login (dashboard) and contact (contact page)
   --------------------------------------------------------------- */
function setupLogin() {
    const loginBtn = document.getElementById('login-btn');
    const modal = document.getElementById('login-modal');
    if (!modal) return;
    const close = modal.querySelector('.modal-close');

    if (loginBtn) loginBtn.addEventListener('click', () => { modal.style.display = 'block'; });
    if (close) close.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.style.display = 'none'; });

    const form = modal.querySelector('.auth-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = form.querySelector('#username');
            const password = form.querySelector('#password');
            if (!validateForm([{ el: username }, { el: password }])) {
                Toast.show(tr('msg-login-required', 'Enter username and password.'), 'warning');
                return;
            }
            const submit = form.querySelector('button[type="submit"]');
            const original = submit.textContent;
            submit.textContent = '...';
            submit.disabled = true;
            setTimeout(() => {
                submit.textContent = original;
                submit.disabled = false;
                modal.style.display = 'none';
                Auth.login(username.value.trim());
                Toast.show(tr('msg-login-success', 'Access granted.'), 'success', 'S.O.W.A');
                form.reset();
            }, 900);
        });
    }

    // Social sign-in buttons are demo placeholders
    // (forgot-password is an <a href="#"> handled by setupPlaceholderLinks)
    modal.querySelectorAll('.auth-alt button').forEach(b => {
        b.addEventListener('click', (e) => {
            e.preventDefault();
            Toast.show(tr('msg-coming-soon', 'Coming soon.'), 'info');
        });
    });
}

function setupContactForm() {
    const form = document.querySelector('.contact-form form');
    if (!form) return;

    // A real endpoint (Formspree / Web3Forms) can be configured via the
    // form's data-endpoint attribute; without one the send is simulated.
    const endpoint = (form.dataset.endpoint || '').trim();

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = form.querySelector('#name');
        const email = form.querySelector('#email');
        const message = form.querySelector('#message');
        if (!validateForm([{ el: name }, { el: email, type: 'email' }, { el: message }])) {
            Toast.show(tr('msg-message-error', 'Please complete the required fields.'), 'error');
            return;
        }
        const submit = form.querySelector('button[type="submit"]');
        const original = submit.textContent;
        submit.disabled = true;
        submit.textContent = '...';

        const finish = (ok) => {
            submit.disabled = false;
            submit.textContent = original;
            if (ok) {
                form.reset();
                Toast.show(tr('msg-message-sent', 'Message transmitted.'), 'success');
            } else {
                Toast.show(tr('msg-message-error', 'Could not send — please email us directly.'), 'error');
            }
        };

        if (endpoint) {
            fetch(endpoint, {
                method: 'POST',
                headers: { 'Accept': 'application/json' },
                body: new FormData(form)
            })
                .then(r => finish(r.ok))
                .catch(() => finish(false));
        } else {
            setTimeout(() => finish(true), 900); // demo mode
        }
    });

    // Clear errors as the user types
    form.querySelectorAll('input, textarea').forEach(f =>
        f.addEventListener('input', () => clearInvalid(f)));
}

/* ---------------------------------------------------------------
   Hover prefetch — starts loading an internal page the moment the
   cursor touches its link, so the actual navigation feels instant.
   --------------------------------------------------------------- */
function setupPrefetch() {
    const seen = new Set();
    const prefetch = (a) => {
        const href = a.getAttribute('href');
        if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:)/i.test(href)) return;
        const url = new URL(href, window.location.href).href;
        if (seen.has(url) || url === window.location.href) return;
        seen.add(url);
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    };
    document.addEventListener('mouseover', (e) => {
        const a = e.target.closest && e.target.closest('a[href]');
        if (a) prefetch(a);
    }, { passive: true });
    document.addEventListener('touchstart', (e) => {
        const a = e.target.closest && e.target.closest('a[href]');
        if (a) prefetch(a);
    }, { passive: true });
}

/* ---------------------------------------------------------------
   "Coming soon" placeholder links (#)
   --------------------------------------------------------------- */
function setupPlaceholderLinks() {
    document.querySelectorAll('a[href="#"]').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            Toast.show(tr('msg-coming-soon', 'Coming soon.'), 'info');
        });
    });
}

/* ---------------------------------------------------------------
   Scroll-reveal observer (adds .animate-in)
   --------------------------------------------------------------- */
function setupReveal() {
    const targets = document.querySelectorAll(
        '.dashboard-card, .stat-card, .news-item, .service-card, .team-member, .value-item, .timeline-item, .news-article'
    );
    if (!('IntersectionObserver' in window) || !targets.length) {
        targets.forEach(t => t.classList.add('animate-in'));
        return;
    }
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    targets.forEach(t => obs.observe(t));
}

/* ---------------------------------------------------------------
   Keyboard shortcuts
   --------------------------------------------------------------- */
function setupShortcuts() {
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key.toLowerCase() === 'l') {
            e.preventDefault();
            if (window.languageManager) window.languageManager.toggleLanguage();
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'm') {
            e.preventDefault();
            if (window.soundManager) window.soundManager.toggleSound();
        }
        if (e.ctrlKey && e.key.toLowerCase() === 'k') {
            e.preventDefault();
            ThemeManager.cycle();
        }
    });
}

/* ---------------------------------------------------------------
   Boot
   --------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
    if (window.languageManager) window.languageManager.init();
    if (window.soundManager) window.soundManager.init();
    if (window.animationManager && typeof window.animationManager.init === 'function') {
        // AnimationManager self-inits; guard against double init.
    }

    ThemeManager.init();
    injectChrome();
    setupScrollChrome();
    Auth.render();
    startClock();
    setupLogin();
    setupContactForm();
    setupPrefetch();
    setupPlaceholderLinks();
    setupReveal();
    attachRipples();
    setupShortcuts();

    // Re-render auth labels when language changes
    document.addEventListener('languagechange', () => Auth.render());

    console.log('%cC.N.S — Clear Net Sky / S.O.W.A', 'color:#4c8dff;font-weight:bold;font-size:14px;');
    console.log('%cThe Owl Never Sleeps · System Online', 'color:#34d399;');
});
