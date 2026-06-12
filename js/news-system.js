// ============================================================
// news-system.js — live dashboard simulation for the home page.
// Builds the dot-matrix world threat map, animates the security
// metrics, ticks the live counters and drives the alert feed.
// Runs only where the dashboard markup is present.
// ============================================================
(function () {
    'use strict';

    /* ---------- Simplified continent outlines (1000 x 500 space) ---------- */
    const CONTINENTS = [
        // North America
        [[140,90],[200,70],[262,82],[300,120],[290,152],[250,172],[256,205],[232,250],[202,236],[190,190],[160,172],[130,150],[120,110]],
        // South America
        [[300,290],[346,296],[362,332],[350,382],[330,432],[310,466],[296,440],[300,382],[285,340]],
        // Europe
        [[470,100],[520,88],[562,102],[566,132],[540,150],[562,170],[520,176],[494,160],[474,140]],
        // Africa
        [[490,196],[560,190],[602,212],[596,262],[576,312],[545,356],[520,346],[515,300],[495,260],[485,226]],
        // Asia
        [[566,96],[650,70],[762,82],[852,112],[872,152],[820,182],[770,202],[722,212],[700,252],[660,232],[620,202],[590,172],[574,136]],
        // Australia
        [[800,340],[852,330],[882,356],[870,396],[820,412],[795,386]]
    ];

    function pointInPolygon(x, y, poly) {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            const xi = poly[i][0], yi = poly[i][1];
            const xj = poly[j][0], yj = poly[j][1];
            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    /* ---------- Live attack origins (real cities, EQ-projected) ---------- */
    const NODES = [
        { name: 'New York',  x: 294, y: 137 },
        { name: 'London',    x: 499, y: 107 },
        { name: 'Moscow',    x: 604, y: 95  },
        { name: 'Beijing',   x: 823, y: 139 },
        { name: 'Tokyo',     x: 888, y: 151 },
        { name: 'Sydney',    x: 919, y: 344 },
        { name: 'São Paulo', x: 370, y: 315 },
        { name: 'Lagos',     x: 509, y: 232 },
        { name: 'Dubai',     x: 654, y: 180 },
        { name: 'Mumbai',    x: 702, y: 197 },
        { name: 'Singapore', x: 788, y: 246 }
    ];

    const SEVERITIES = ['high', 'medium', 'low'];
    const THREAT_TYPES = ['Phishing', 'Ransomware', 'DDoS', 'Trojan', 'Botnet', 'Zero-day'];
    const SVG_NS = 'http://www.w3.org/2000/svg';

    function buildMap() {
        const host = document.getElementById('world-map');
        if (!host) return;
        const container = host.querySelector('.map-container');
        if (!container) return;

        // Remove the placeholder black image + static points
        const placeholder = container.querySelector('.map-image');
        if (placeholder) placeholder.remove();
        const oldAnim = container.querySelector('.threat-animation');
        if (oldAnim) oldAnim.remove();

        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', 'map-svg');
        svg.setAttribute('viewBox', '0 0 1000 500');
        // Stretch to fill the card so the HTML threat points (positioned
        // as percentages of the container) line up with the dot map.
        svg.setAttribute('preserveAspectRatio', 'none');

        // Dot-matrix landmass
        const dots = document.createElementNS(SVG_NS, 'g');
        for (let y = 30; y < 480; y += 13) {
            for (let x = 60; x < 960; x += 13) {
                if (CONTINENTS.some(p => pointInPolygon(x, y, p))) {
                    const c = document.createElementNS(SVG_NS, 'circle');
                    c.setAttribute('cx', x);
                    c.setAttribute('cy', y);
                    c.setAttribute('r', 1.7);
                    c.setAttribute('fill', 'currentColor');
                    c.setAttribute('opacity', '0.35');
                    dots.appendChild(c);
                }
            }
        }
        dots.setAttribute('style', 'color: var(--primary-color)');
        svg.appendChild(dots);

        const arcLayer = document.createElementNS(SVG_NS, 'g');
        svg.appendChild(arcLayer);
        container.appendChild(svg);

        // Tooltip element
        const tooltip = document.createElement('div');
        tooltip.className = 'map-tooltip';
        container.appendChild(tooltip);

        // Glowing threat points (HTML overlay so existing CSS applies)
        const overlay = document.createElement('div');
        overlay.className = 'threat-animation';
        container.appendChild(overlay);

        NODES.forEach(node => {
            const p = document.createElement('div');
            const sev = SEVERITIES[Math.floor(Math.random() * SEVERITIES.length)];
            p.className = 'threat-point';
            p.dataset.severity = sev;
            p.style.left = `${node.x / 10}%`;
            p.style.top = `${node.y / 5}%`;
            p.addEventListener('mouseenter', () => {
                tooltip.textContent = `${node.name} · ${THREAT_TYPES[Math.floor(Math.random() * THREAT_TYPES.length)]}`;
                tooltip.style.left = `${node.x / 10}%`;
                tooltip.style.top = `${node.y / 5}%`;
                tooltip.classList.add('show');
            });
            p.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
            overlay.appendChild(p);
        });

        // Periodic attack arcs
        function spawnArc() {
            const a = NODES[Math.floor(Math.random() * NODES.length)];
            let b = NODES[Math.floor(Math.random() * NODES.length)];
            if (a === b) { spawnArc(); return; }
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2 - Math.abs(a.x - b.x) * 0.35 - 30;
            const path = document.createElementNS(SVG_NS, 'path');
            path.setAttribute('d', `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`);
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', 'var(--accent-color)');
            path.setAttribute('stroke-width', '1.6');
            path.setAttribute('class', 'attack-arc');
            path.setAttribute('opacity', '0.9');
            arcLayer.appendChild(path);
            setTimeout(() => path.remove(), 2400);
        }
        spawnArc();
        setInterval(spawnArc, 1600);
    }

    /* ---------- Live metrics (CPU / Memory / Network) ---------- */
    function animateMetrics() {
        const metrics = document.querySelectorAll('.system-metrics .metric');
        if (!metrics.length) return;
        const base = [34, 58, 47]; // resting values per bar

        function update() {
            metrics.forEach((m, i) => {
                const fill = m.querySelector('.metric-fill');
                const value = m.querySelector('.metric-value');
                if (!fill || !value) return;
                const target = Math.max(8, Math.min(96,
                    (base[i] || 40) + Math.round((Math.random() - 0.5) * 18)));
                fill.style.width = `${target}%`;
                value.textContent = `${target}%`;
            });
        }
        update();
        setInterval(update, 3200);
    }

    /* ---------- Live counters ---------- */
    function liveCounters() {
        // "Threats blocked today" — first stat card
        const blocked = document.querySelector('.stats-overview .stat-card .stat-number[data-count]');
        const total = document.querySelector('.map-stats .stat-row .stat-value');

        // Seed believable starting values once the count-up has settled
        setTimeout(() => {
            if (blocked) blocked.textContent = (12000 + Math.floor(Math.random() * 4000)).toLocaleString();
            if (total) total.textContent = (840 + Math.floor(Math.random() * 300)).toLocaleString();
        }, 2300);

        setInterval(() => {
            if (blocked) {
                const n = parseInt(blocked.textContent.replace(/\D/g, ''), 10) || 12000;
                blocked.textContent = (n + Math.floor(Math.random() * 7) + 1).toLocaleString();
                blocked.classList.add('value-flash');
                setTimeout(() => blocked.classList.remove('value-flash'), 600);
            }
            if (total) {
                const n = parseInt(total.textContent.replace(/\D/g, ''), 10) || 840;
                total.textContent = (n + Math.floor(Math.random() * 3)).toLocaleString();
            }
        }, 4000);
    }

    /* ---------- Recent alerts feed ---------- */
    const ALERT_FEED = {
        en: [
            { lvl: 'critical', icon: 'fa-radiation', text: 'Critical: ransomware C2 beacon blocked' },
            { lvl: 'high', icon: 'fa-skull-crossbones', text: 'Malware detected on inbound mail gateway' },
            { lvl: 'medium', icon: 'fa-user-secret', text: 'Suspicious login attempt from new region' },
            { lvl: 'low', icon: 'fa-shield-halved', text: 'Security definitions updated successfully' },
            { lvl: 'high', icon: 'fa-bug', text: 'Exploit signature matched and quarantined' },
            { lvl: 'medium', icon: 'fa-globe', text: 'Anomalous DNS traffic flagged for review' }
        ],
        ru: [
            { lvl: 'critical', icon: 'fa-radiation', text: 'Критично: заблокирован C2-маяк ransomware' },
            { lvl: 'high', icon: 'fa-skull-crossbones', text: 'Обнаружено вредоносное ПО на почтовом шлюзе' },
            { lvl: 'medium', icon: 'fa-user-secret', text: 'Подозрительная попытка входа из нового региона' },
            { lvl: 'low', icon: 'fa-shield-halved', text: 'Определения безопасности успешно обновлены' },
            { lvl: 'high', icon: 'fa-bug', text: 'Сигнатура эксплойта совпала и помещена в карантин' },
            { lvl: 'medium', icon: 'fa-globe', text: 'Аномальный DNS-трафик отмечен для проверки' }
        ]
    };

    function timeAgo(seconds) {
        const lang = (window.languageManager && window.languageManager.currentLang) || 'en';
        if (seconds < 60) return lang === 'ru' ? `${seconds} с назад` : `${seconds}s ago`;
        const m = Math.floor(seconds / 60);
        return lang === 'ru' ? `${m} мин назад` : `${m}m ago`;
    }

    function renderAlerts() {
        const list = document.querySelector('.alerts-list');
        if (!list) return;
        const lang = (window.languageManager && window.languageManager.currentLang) || 'en';
        const feed = ALERT_FEED[lang] || ALERT_FEED.en;
        const pick = [...feed].sort(() => Math.random() - 0.5).slice(0, 4);

        list.innerHTML = pick.map((a, i) => `
            <div class="alert-item ${a.lvl}">
                <i class="fas ${a.icon}"></i>
                <div class="alert-content">
                    <p>${a.text}</p>
                    <span class="alert-time">${timeAgo((i + 1) * 37)}</span>
                </div>
                <button class="alert-action"><i class="fas fa-ellipsis-vertical"></i></button>
            </div>`).join('');
    }

    function setupAlertControls() {
        const refresh = document.getElementById('refresh-alerts');
        if (refresh) {
            refresh.addEventListener('click', () => {
                const icon = refresh.querySelector('i');
                if (icon) icon.classList.add('spinning');
                setTimeout(() => {
                    renderAlerts();
                    if (icon) icon.classList.remove('spinning');
                }, 800);
            });
        }
        document.querySelectorAll('[data-i18n="view-all-alerts"]').forEach(b =>
            b.addEventListener('click', () => window.Toast &&
                window.Toast.show(window.languageManager.t('msg-coming-soon'), 'info')));
        document.querySelectorAll('[data-i18n="acknowledge-all"]').forEach(b =>
            b.addEventListener('click', () => {
                document.querySelectorAll('.alert-item').forEach(a => a.style.opacity = '0.45');
                if (window.Toast) window.Toast.show(window.languageManager.t('msg-alerts-ack'), 'success');
            }));
    }

    /* ---------- Threat-map time filter ---------- */
    function setupTimeFilter() {
        const select = document.getElementById('threat-time-filter');
        const total = document.querySelector('.map-stats .stat-row .stat-value');
        if (!select || !total) return;
        const factor = { '1h': 0.08, '24h': 1, '7d': 6.4 };
        select.addEventListener('change', () => {
            const f = factor[select.value] || 1;
            total.textContent = Math.round((900 + Math.random() * 200) * f).toLocaleString();
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (!document.querySelector('.dashboard-grid')) return; // dashboard only
        buildMap();
        animateMetrics();
        liveCounters();
        renderAlerts();
        setupAlertControls();
        setupTimeFilter();
        // Re-render the alert feed in the new language
        document.addEventListener('languagechange', renderAlerts);
    });
})();
