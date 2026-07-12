// ============================================================
// threats.js — interactive threat database (EN + RU)
// Renders a known-threat catalogue and wires up the filters,
// search, statistics and table actions. Defensive / educational.
// ============================================================
(function () {
    'use strict';

    // Catalogue of well-documented threat families (public knowledge).
    // type/category keys map to the filter <select> values.
    const THREATS = [
        { name: 'LockBit 3.0',      cat: 'ransomware', type: { en: 'Ransomware', ru: 'Ransomware' }, sev: 'critical', days: 2,  active: true },
        { name: 'Emotet',           cat: 'malware',    type: { en: 'Trojan / Botnet', ru: 'Троян / Ботнет' }, sev: 'high', days: 5, active: true },
        { name: 'Agent Tesla',      cat: 'malware',    type: { en: 'Infostealer', ru: 'Похититель данных' }, sev: 'high', days: 9, active: true },
        { name: 'Mirai',            cat: 'ddos',       type: { en: 'IoT Botnet', ru: 'IoT-ботнет' }, sev: 'high', days: 12, active: false },
        { name: 'Qakbot',           cat: 'malware',    type: { en: 'Banking Trojan', ru: 'Банковский троян' }, sev: 'high', days: 3, active: true },
        { name: 'BlackCat (ALPHV)', cat: 'ransomware', type: { en: 'Ransomware', ru: 'Ransomware' }, sev: 'critical', days: 7, active: true },
        { name: 'Browser-in-Browser', cat: 'phishing', type: { en: 'Phishing Kit', ru: 'Фишинг-набор' }, sev: 'medium', days: 1, active: true },
        { name: 'RedLine Stealer',  cat: 'malware',    type: { en: 'Infostealer', ru: 'Похититель данных' }, sev: 'high', days: 4, active: true },
        { name: 'Cl0p',             cat: 'ransomware', type: { en: 'Ransomware', ru: 'Ransomware' }, sev: 'critical', days: 15, active: false },
        { name: 'HTTP Flood Wave',  cat: 'ddos',       type: { en: 'DDoS', ru: 'DDoS' }, sev: 'medium', days: 1, active: true },
        { name: 'M365 Credential Phish', cat: 'phishing', type: { en: 'Phishing', ru: 'Фишинг' }, sev: 'medium', days: 6, active: false },
        { name: 'Raspberry Robin',  cat: 'malware',    type: { en: 'Worm', ru: 'Червь' }, sev: 'high', days: 20, active: true },
        { name: 'SmokeLoader',      cat: 'malware',    type: { en: 'Loader', ru: 'Загрузчик' }, sev: 'medium', days: 11, active: false },
        { name: 'Quasar RAT',       cat: 'malware',    type: { en: 'Remote Access Trojan', ru: 'Троян удалённого доступа' }, sev: 'high', days: 8, active: true }
    ];

    const lang = () => (window.languageManager && window.languageManager.currentLang) || 'ru';

    /* ---------- Live feed (CISA KEV via data/threats.json) ----------
       data/threats.json is refreshed by a GitHub Actions cron job
       (tools/fetch_threats.py), so the browser never calls external
       APIs. If the file is missing (offline, file://), the static
       catalogue above still works. */
    let FEED_META = null;

    function loadLiveFeed() {
        if (typeof fetch !== 'function') return;
        const prefix = window.location.pathname.includes('/pages/') ? '../../' : '';
        fetch(prefix + 'data/threats.json', { cache: 'no-cache' })
            .then(r => (r.ok ? r.json() : Promise.reject()))
            .then(data => {
                if (!data || !Array.isArray(data.items)) return;
                FEED_META = { source: data.source, url: data.sourceUrl, updated: data.updated };
                // Newest live entries go on top; avoid duplicates on re-runs.
                const known = new Set(THREATS.map(t => t.name));
                const fresh = data.items.filter(i => !known.has(i.name));
                THREATS.unshift(...fresh);
                renderFeedNote();
                apply();
            })
            .catch(() => { /* offline / file:// — keep static data */ });
    }

    function renderFeedNote() {
        const container = document.querySelector('.threats-table-container');
        if (!container || !FEED_META || document.getElementById('feed-note')) return;
        const note = document.createElement('p');
        note.id = 'feed-note';
        note.style.cssText = 'padding:0.7rem 1.25rem;margin:0;font-size:0.75rem;color:var(--text-muted);border-top:1px solid var(--border-color);font-family:var(--font-mono);';
        const label = lang() === 'ru' ? 'Живые данные' : 'Live data';
        const upd = lang() === 'ru' ? 'обновлено' : 'updated';
        note.innerHTML = `${label}: <a href="${FEED_META.url}" target="_blank" rel="noopener">${FEED_META.source}</a> · ${upd} ${FEED_META.updated}`;
        container.appendChild(note);
    }

    const STR = {
        ru: { active: 'Активна', contained: 'Локализована', critical: 'Критический', high: 'Высокий', medium: 'Средний', low: 'Низкий', empty: 'Угрозы не найдены', dayAgo: 'дн. назад', today: 'сегодня', exported: 'Данные экспортированы (CSV)' },
        en: { active: 'Active', contained: 'Contained', critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low', empty: 'No threats match the filters', dayAgo: 'd ago', today: 'today', exported: 'Threat data exported (CSV)' }
    };
    const s = (k) => (STR[lang()] || STR.en)[k];

    const sevClass = { critical: 'severity-critical', high: 'severity-high', medium: 'severity-medium', low: 'severity-low' };

    function detected(days) {
        return days === 0 ? s('today') : `${days} ${s('dayAgo')}`;
    }

    function currentFilters() {
        return {
            type: (document.getElementById('threat-type') || {}).value || 'all',
            severity: (document.getElementById('severity') || {}).value || 'all',
            range: parseInt((document.getElementById('date-range') || {}).value || '365', 10),
            query: ((document.getElementById('search') || {}).value || '').trim().toLowerCase()
        };
    }

    function apply() {
        const tbody = document.querySelector('.threats-table tbody');
        if (!tbody) return;
        const f = currentFilters();

        const rows = THREATS.filter(t =>
            (f.type === 'all' || t.cat === f.type) &&
            (f.severity === 'all' || t.sev === f.severity) &&
            (t.days <= f.range) &&
            (!f.query || t.name.toLowerCase().includes(f.query) || t.type[lang()].toLowerCase().includes(f.query))
        );

        tbody.innerHTML = rows.length ? rows.map(t => `
            <tr>
                <td>${t.name}</td>
                <td>${t.type[lang()]}</td>
                <td class="${sevClass[t.sev]}">${s(t.sev)}</td>
                <td>${detected(t.days)}</td>
                <td>${t.active ? `<span style="color:var(--danger-color)">${s('active')}</span>` : `<span style="color:var(--success-color)">${s('contained')}</span>`}</td>
            </tr>`).join('')
            : `<tr class="empty-row"><td colspan="5">${s('empty')}</td></tr>`;

        updateStats();
        // table-hover sound for freshly rendered rows
        if (window.soundManager) {
            tbody.querySelectorAll('tr').forEach(r =>
                r.addEventListener('mouseenter', () => window.soundManager.playTableHoverSound &&
                    window.soundManager.playTableHoverSound()));
        }
    }

    function updateStats() {
        const cards = document.querySelectorAll('.threat-stats .stat-card .stat-number');
        if (cards.length < 4) return;
        const active = THREATS.filter(t => t.active).length;
        const critical = THREATS.filter(t => t.sev === 'critical').length;
        const newToday = THREATS.filter(t => t.days <= 1).length;
        cards[0].textContent = active;
        cards[1].textContent = '99.2%';
        cards[2].textContent = newToday;
        cards[3].textContent = critical;
    }

    function setupActions() {
        const buttons = document.querySelectorAll('.table-actions button');
        buttons.forEach(btn => {
            const label = btn.textContent.toLowerCase();
            btn.addEventListener('click', () => {
                if (label.includes('экспорт') || label.includes('export')) {
                    exportCsv();
                } else {
                    const icon = btn.querySelector('i');
                    apply();
                    if (window.Toast) window.Toast.show(
                        lang() === 'ru' ? 'Список угроз обновлён' : 'Threat list refreshed', 'info');
                }
            });
        });
    }

    function exportCsv() {
        const header = 'Name,Type,Severity,DetectedDays,Active\n';
        const body = THREATS.map(t => `${t.name},${t.type.en},${t.sev},${t.days},${t.active}`).join('\n');
        const blob = new Blob([header + body], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cns-threats.csv';
        a.click();
        URL.revokeObjectURL(url);
        if (window.Toast) window.Toast.show(s('exported'), 'success');
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (!document.querySelector('.threats-table')) return;
        ['threat-type', 'severity', 'date-range'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('change', apply);
        });
        const search = document.getElementById('search');
        if (search) search.addEventListener('input', apply);
        setupActions();
        apply();
        loadLiveFeed();
        document.addEventListener('languagechange', () => {
            const note = document.getElementById('feed-note');
            if (note) { note.remove(); renderFeedNote(); }
            apply();
        });
    });
})();
