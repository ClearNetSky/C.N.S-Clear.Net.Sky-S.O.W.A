// ============================================================
// news.js — interactivity for the News pages (EN + RU)
// Category filtering, pagination chrome and the newsletter form.
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const tr = (k, f) => (window.languageManager ? window.languageManager.t(k) : (f || k));

    /* ---------- Category filtering ---------- */
    const filterButtons = document.querySelectorAll('.filter-button');
    const articles = document.querySelectorAll('.news-article');

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;
            let shown = 0;

            articles.forEach(article => {
                const match = filter === 'all' || article.dataset.category === filter;
                article.style.display = match ? '' : 'none';
                if (match) {
                    shown++;
                    // Replay the reveal animation
                    article.classList.remove('animate-in');
                    requestAnimationFrame(() => article.classList.add('animate-in'));
                }
            });

            // Empty-state handling
            const grid = document.querySelector('.news-grid');
            let empty = document.getElementById('news-empty');
            if (shown === 0) {
                if (!empty && grid) {
                    empty = document.createElement('p');
                    empty.id = 'news-empty';
                    empty.style.cssText = 'grid-column:1/-1;text-align:center;color:var(--text-muted);padding:2rem;';
                    empty.textContent = (window.languageManager && window.languageManager.currentLang === 'ru')
                        ? 'Нет новостей в этой категории.'
                        : 'No articles in this category.';
                    grid.appendChild(empty);
                }
            } else if (empty) {
                empty.remove();
            }
        });
    });

    /* ---------- Pagination (front-end chrome) ---------- */
    const pageButtons = document.querySelectorAll('.pagination-button');
    pageButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.querySelector('i')) return; // arrows are decorative for now
            pageButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelector('.news-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    /* ---------- Newsletter subscription ---------- */
    const form = document.querySelector('.newsletter-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const input = form.querySelector('input[type="email"]');
            const value = input.value.trim();
            const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            if (!valid) {
                input.classList.add('invalid');
                if (window.Toast) window.Toast.show(tr('msg-invalid-email', 'Enter a valid email.'), 'error');
                return;
            }
            input.classList.remove('invalid');
            const btn = form.querySelector('button');
            const original = btn.textContent;
            btn.disabled = true;
            btn.textContent = '...';
            setTimeout(() => {
                btn.disabled = false;
                btn.textContent = original;
                form.reset();
                if (window.Toast) window.Toast.show(tr('msg-subscribed', 'Subscribed!'), 'success');
            }, 800);
        });
        form.querySelector('input')?.addEventListener('input', (e) => e.target.classList.remove('invalid'));
    }
});
