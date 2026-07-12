#!/usr/bin/env python3
# ============================================================
# tools/build.py — single source of truth for the shared page
# chrome (header, footer, SEO head block) and sitemap.xml.
#
# The site stays plain static HTML (GitHub Pages friendly).
# Edit the partial builders below, then run:
#
#     python tools/build.py
#
# Every page is rewritten in place between build markers:
#     <!-- build:header --> ... <!-- /build:header -->
#     <!-- build:footer --> ... <!-- /build:footer -->
#     <!-- build:seo -->    ... <!-- /build:seo -->
# On first run the markers are created by replacing the existing
# <header>/<footer> elements, so the script is idempotent.
# ============================================================

import io
import os
import re
import sys
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = "https://clearnetsky.github.io/C.N.S-Clear.Net.Sky-S.O.W.A"
VERSION = "v0.3.0"
YEAR = "2026"

# ---------- Localised strings for static (pre-JS) text ----------
# Keys mirror the data-i18n keys in js/language.js so the runtime
# language engine keeps working on top of the static defaults.
TR = {
    "en": {
        "home": "Home", "about": "About", "services": "Services", "news": "News",
        "threats": "Threat Database", "contact": "Contact", "login": "Login",
        "quick-links": "Quick Links", "resources": "Resources",
        "threat-database": "Threat Database", "security-tips": "Security Tips",
        "emergency-response": "Emergency Response", "report-threat": "Report a Threat",
        "white-papers": "White Papers", "webinars": "Webinars",
        "contact-us": "Contact Us", "footer-address": "Global Security Operations Center",
        "emergency": "Emergency", "emergency-desc": "24/7 incident response support",
        "rights-reserved": "All rights reserved.",
        "footer-desc": "Advanced cyber security solutions for the modern digital world.",
    },
    "ru": {
        "home": "Главная", "about": "О нас", "services": "Услуги", "news": "Новости",
        "threats": "База угроз", "contact": "Контакты", "login": "Вход",
        "quick-links": "Быстрые ссылки", "resources": "Ресурсы",
        "threat-database": "База угроз", "security-tips": "Советы по безопасности",
        "emergency-response": "Экстренное реагирование", "report-threat": "Сообщить об угрозе",
        "white-papers": "Документация", "webinars": "Вебинары",
        "contact-us": "Свяжитесь с нами", "footer-address": "Глобальный центр операций безопасности",
        "emergency": "Экстренная связь", "emergency-desc": "Круглосуточная поддержка реагирования",
        "rights-reserved": "Все права защищены.",
        "footer-desc": "Передовые решения в области кибербезопасности для современного цифрового мира.",
    },
}

NAV_ITEMS = ["home", "about", "services", "news", "threats", "contact"]

# ---------- Per-page configuration ----------
PAGES = {
    "index.html": {
        "lang": "en", "prefix": "", "active": "home", "root": True,
        "title": "C.N.S — Clear Net Sky | S.O.W.A · The Owl Never Sleeps",
        "desc": "Clear Net Sky (S.O.W.A) — advanced cyber security for the civilian population. Real-time threat monitoring, DNS-powered protection and 24/7 incident response.",
    },
    "pages/en/about.html": {
        "lang": "en", "prefix": "../../", "active": "about",
        "title": "About — Clear Net Sky | S.O.W.A",
        "desc": "Learn about Clear Net Sky (S.O.W.A): our mission, journey, team and values in protecting the civilian population online.",
    },
    "pages/en/services.html": {
        "lang": "en", "prefix": "../../", "active": "services",
        "title": "Services — Clear Net Sky | S.O.W.A",
        "desc": "Network protection, endpoint security, cloud security, IAM, threat intelligence and compliance — security services by Clear Net Sky.",
    },
    "pages/en/news.html": {
        "lang": "en", "prefix": "../../", "active": "news",
        "title": "Security News — Clear Net Sky | S.O.W.A",
        "desc": "Security news, threat alerts, research and updates from the Clear Net Sky (S.O.W.A) team.",
    },
    "pages/en/threats.html": {
        "lang": "en", "prefix": "../../", "active": "threats",
        "title": "Threat Database — Clear Net Sky | S.O.W.A",
        "desc": "Interactive database of well-known cyber threat families with severity, status and remediation guidance.",
    },
    "pages/en/contact.html": {
        "lang": "en", "prefix": "../../", "active": "contact",
        "title": "Contact — Clear Net Sky | S.O.W.A",
        "desc": "Contact the Clear Net Sky security team: general inquiries, service requests and 24/7 incident response.",
    },
    "pages/ru/about.html": {
        "lang": "ru", "prefix": "../../", "active": "about",
        "title": "О нас — Clear Net Sky | S.O.W.A",
        "desc": "О Clear Net Sky (S.O.W.A): наша миссия, история, команда и ценности в защите гражданского населения в сети.",
    },
    "pages/ru/services.html": {
        "lang": "ru", "prefix": "../../", "active": "services",
        "title": "Услуги — Clear Net Sky | S.O.W.A",
        "desc": "Защита сети, устройств и облака, управление доступом, разведка угроз и соответствие требованиям — услуги Clear Net Sky.",
    },
    "pages/ru/news.html": {
        "lang": "ru", "prefix": "../../", "active": "news",
        "title": "Новости — Clear Net Sky | S.O.W.A",
        "desc": "Новости безопасности, оповещения об угрозах, исследования и обновления от команды Clear Net Sky (S.O.W.A).",
    },
    "pages/ru/threats.html": {
        "lang": "ru", "prefix": "../../", "active": "threats",
        "title": "База угроз — Clear Net Sky | S.O.W.A",
        "desc": "Интерактивная база известных семейств киберугроз: уровень риска, статус и рекомендации по защите.",
    },
    "pages/ru/contact.html": {
        "lang": "ru", "prefix": "../../", "active": "contact",
        "title": "Контакты — Clear Net Sky | S.O.W.A",
        "desc": "Свяжитесь с командой Clear Net Sky: общие вопросы, запросы услуг и круглосуточное реагирование на инциденты.",
    },
}

# ---------- News articles (for the RSS feed) ----------
# Keep in sync with pages/en/news.html when adding articles.
ARTICLES = [
    {
        "slug": "phishing-in-10-seconds", "date": "2026-07-02",
        "title": "How to Recognise a Phishing Email in 10 Seconds",
        "desc": "Check the sender's real address, hover over every link before clicking, and treat urgency as a red flag. Our analysts break down the anatomy of a modern phishing message.",
    },
    {
        "slug": "sowa-v03-interface-overhaul", "date": "2026-07-12",
        "title": "S.O.W.A Platform v0.3: Interface Overhaul",
        "desc": "A cleaner interface, faster page loads and a refreshed theme system. This release focuses on readability, mobile performance and a more professional look across the whole platform.",
    },
    {
        "slug": "passphrases-beat-passwords", "date": "2026-06-18",
        "title": "Why Passphrases Beat Complex Passwords",
        "desc": "Four random words are easier to remember and harder to crack than P@ssw0rd!-style strings. We look at the maths behind passphrase entropy and what it means for everyday users.",
    },
    {
        "slug": "ransomware-2026-backups", "date": "2026-06-05",
        "title": "Ransomware in 2026: Backups Are Still Your Best Defence",
        "desc": "Attackers keep evolving, but the recovery playbook stays the same: offline backups, tested restores and least-privilege access. A practical checklist for households and small teams.",
    },
    {
        "slug": "mobile-security-checklist", "date": "2026-05-21",
        "title": "Securing Your Phone: Our Mobile Checklist",
        "desc": "From app permissions to SIM-swap protection — ten settings worth reviewing today on Android and iOS. Five minutes of configuration can prevent months of trouble.",
    },
]

OWL_SVG = """<svg class="owl-emblem" viewBox="0 0 64 64" role="img" aria-label="S.O.W.A owl emblem">
                        <path class="owl-fill" d="M18 14 L24 24 L13 22 Z"/>
                        <path class="owl-fill" d="M46 14 L40 24 L51 22 Z"/>
                        <path class="owl-body" d="M32 9 C46 9 53 21 53 34 C53 48 44 57 32 57 C20 57 11 48 11 34 C11 21 18 9 32 9 Z"/>
                        <circle class="owl-fill owl-eye" cx="24" cy="30" r="8"/>
                        <circle class="owl-fill owl-eye right" cx="40" cy="30" r="8"/>
                        <circle class="owl-pupil" cx="24" cy="30" r="3.4"/>
                        <circle class="owl-pupil" cx="40" cy="30" r="3.4"/>
                        <path class="owl-fill" d="M32 36 L28 40.5 L36 40.5 Z"/>
                    </svg>"""


def nav_href(item, cfg):
    if item == "home":
        return f'{cfg["prefix"]}index.html'
    if cfg.get("root"):
        return f'pages/{cfg["lang"]}/{item}.html'
    return f'{cfg["prefix"]}pages/{cfg["lang"]}/{item}.html'


def t(cfg, key):
    return TR[cfg["lang"]][key]


def build_header(cfg):
    links = []
    for item in NAV_ITEMS:
        active = ' active' if item == cfg["active"] else ''
        aria = ' aria-current="page"' if item == cfg["active"] else ''
        links.append(
            f'                    <li><a href="{nav_href(item, cfg)}" class="nav-link{active}"'
            f' data-i18n="{item}"{aria}>{t(cfg, item)}</a></li>'
        )
    nav = "\n".join(links)
    flag = "us-flag" if cfg["lang"] == "en" else "ru-flag"
    login = (
        '\n                <button id="login-btn" class="secondary-button" data-i18n="login">Login</button>'
        if cfg.get("root") else ''
    )
    return f"""<!-- build:header -->
    <header class="main-header">
        <div class="header-container">
            <a href="{cfg['prefix']}index.html" class="logo-container">
                <div class="logo-icon">
                    {OWL_SVG}
                </div>
                <div class="logo-text">
                    <span class="logo-primary">CLEAR NET SKY</span>
                    <span class="logo-secondary">S.O.W.A Security</span>
                </div>
                <div class="system-status">
                    <div class="status-indicator active"></div>
                    <span>SYSTEM ONLINE</span>
                </div>
            </a>

            <nav class="main-nav">
                <ul>
{nav}
                </ul>
            </nav>

            <div class="user-controls">
                <div class="language-switcher">
                    <button id="current-language" class="icon-button" title="Switch language">
                        <div class="flag {flag} small"></div>
                    </button>
                </div>
                <button id="sound-toggle" class="icon-button" title="Toggle sound">
                    <i class="fas fa-volume-up"></i>
                </button>
                <button id="theme-toggle" class="icon-button" title="Change theme">
                    <i class="fas fa-palette"></i>
                </button>{login}
            </div>
        </div>
    </header>
    <!-- /build:header -->"""


def build_footer(cfg):
    p = cfg["prefix"]

    def link(item):
        return (f'                    <li><a href="{nav_href(item, cfg)}"'
                f' data-i18n="{item}">{t(cfg, item)}</a></li>')

    quick = "\n".join(link(i) for i in NAV_ITEMS)
    contact_href = nav_href("contact", cfg)
    threats_href = nav_href("threats", cfg)

    return f"""<!-- build:footer -->
    <footer class="main-footer">
        <div class="footer-container">
            <div class="footer-section">
                <h4>C.N.S</h4>
                <p data-i18n="footer-desc">{t(cfg, 'footer-desc')}</p>
                <div class="social-links">
                    <a href="https://www.youtube.com/@Aristarh.Ucolov" class="social-link" target="_blank" rel="noopener" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
                    <a href="https://www.linkedin.com/in/aristarhucolov" class="social-link" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fab fa-linkedin"></i></a>
                    <a href="https://github.com/AristarhUcolov" class="social-link" target="_blank" rel="noopener" aria-label="GitHub"><i class="fab fa-github"></i></a>
                    <a href="https://www.twitter.com/AristarhUcolov" class="social-link" target="_blank" rel="noopener" aria-label="X"><i class="fab fa-x-twitter"></i></a>
                </div>
                <div class="system-info">
                    <span>System {VERSION}</span>
                    <span>Last updated: <time id="update-time">—</time></span>
                </div>
            </div>
            <div class="footer-section">
                <h4 data-i18n="quick-links">{t(cfg, 'quick-links')}</h4>
                <ul>
{quick}
                </ul>
            </div>
            <div class="footer-section">
                <h4 data-i18n="resources">{t(cfg, 'resources')}</h4>
                <ul>
                    <li><a href="{threats_href}" data-i18n="threat-database">{t(cfg, 'threat-database')}</a></li>
                    <li><a href="{nav_href('news', cfg)}" data-i18n="security-tips">{t(cfg, 'security-tips')}</a></li>
                    <li><a href="{contact_href}" data-i18n="report-threat">{t(cfg, 'report-threat')}</a></li>
                    <li><a href="#" data-i18n="white-papers">{t(cfg, 'white-papers')}</a></li>
                    <li><a href="#" data-i18n="webinars">{t(cfg, 'webinars')}</a></li>
                </ul>
            </div>
            <div class="footer-section">
                <h4 data-i18n="contact-us">{t(cfg, 'contact-us')}</h4>
                <ul>
                    <li><i class="fas fa-envelope"></i> <a href="mailto:aristarh.ucolov@gmail.com">aristarh.ucolov@gmail.com</a></li>
                    <li><i class="fas fa-map-marker-alt"></i> <span data-i18n="footer-address">{t(cfg, 'footer-address')}</span></li>
                    <li><i class="fab fa-github"></i> <a href="https://github.com/AristarhUcolov" target="_blank" rel="noopener">GitHub</a></li>
                </ul>
                <div class="emergency-contact">
                    <h5 data-i18n="emergency">{t(cfg, 'emergency')}</h5>
                    <a href="{contact_href}" class="emergency-link" data-i18n="emergency-response">{t(cfg, 'emergency-response')}</a>
                    <p data-i18n="emergency-desc">{t(cfg, 'emergency-desc')}</p>
                </div>
            </div>
        </div>
        <div class="copyright">
            <p>&copy; {YEAR} Clear Net Sky | S.O.W.A Security Division. <span data-i18n="rights-reserved">{t(cfg, 'rights-reserved')}</span></p>
        </div>
    </footer>
    <!-- /build:footer -->"""


def build_seo(path, cfg):
    url = f"{SITE}/" if cfg.get("root") else f"{SITE}/{path.replace(os.sep, '/')}"
    locale = "en_US" if cfg["lang"] == "en" else "ru_RU"
    lines = [
        f'<link rel="canonical" href="{url}">',
    ]
    if cfg.get("root"):
        lines += [
            f'<link rel="alternate" hreflang="x-default" href="{url}">',
            f'<link rel="alternate" hreflang="en" href="{url}">',
            f'<link rel="alternate" hreflang="ru" href="{url}">',
        ]
    else:
        en_url = url.replace("/pages/ru/", "/pages/en/")
        ru_url = url.replace("/pages/en/", "/pages/ru/")
        lines += [
            f'<link rel="alternate" hreflang="en" href="{en_url}">',
            f'<link rel="alternate" hreflang="ru" href="{ru_url}">',
        ]
    lines += [
        '<meta property="og:site_name" content="Clear Net Sky — S.O.W.A">',
        '<meta property="og:type" content="website">',
        f'<meta property="og:title" content="{cfg["title"]}">',
        f'<meta property="og:description" content="{cfg["desc"]}">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:locale" content="{locale}">',
        '<meta name="twitter:card" content="summary">',
        f'<meta name="twitter:title" content="{cfg["title"]}">',
        f'<meta name="twitter:description" content="{cfg["desc"]}">',
        f'<link rel="icon" type="image/svg+xml" href="{cfg["prefix"]}images/favicon.svg">',
        f'<link rel="manifest" href="{cfg["prefix"]}manifest.webmanifest">',
        f'<link rel="alternate" type="application/rss+xml" title="C.N.S Security News" href="{SITE}/feed.xml">',
        '<meta name="theme-color" content="#070a13">',
    ]
    body = "\n    ".join(lines)
    return f"<!-- build:seo -->\n    {body}\n    <!-- /build:seo -->"


def replace_block(source, marker, raw_pattern, replacement, path):
    """Replace an existing marked block, or convert the raw element on first run."""
    marked = re.compile(
        r"<!-- build:%s -->.*?<!-- /build:%s -->" % (marker, marker), re.S
    )
    if marked.search(source):
        return marked.sub(lambda _: replacement, source, count=1)
    raw = re.compile(raw_pattern, re.S)
    if not raw.search(source):
        sys.exit(f"ERROR: no {marker} anchor found in {path}")
    return raw.sub(lambda _: replacement, source, count=1)


def process(path, cfg):
    full = os.path.join(ROOT, path)
    s = io.open(full, encoding="utf-8").read()

    # <html lang> / <title> / description stay in sync with the config
    s = re.sub(r"<html lang=\"[a-z]{2}\">", f'<html lang="{cfg["lang"]}">', s, count=1)
    s = re.sub(r"<title>.*?</title>", f'<title>{cfg["title"]}</title>', s, count=1, flags=re.S)
    s = re.sub(
        r'<meta name="description" content="[^"]*">',
        f'<meta name="description" content="{cfg["desc"]}">', s, count=1,
    )

    # Drop legacy head lines that the SEO block now owns
    s = re.sub(r'\s*<link rel="icon" type="image/svg\+xml" href="data:[^"]*">', "", s)
    s = re.sub(r'\s*<meta name="theme-color" content="[^"]*">\n?', "\n", s, count=1) \
        if "build:seo" not in s else s

    # SEO block: replace marked block or insert before the first stylesheet
    seo = build_seo(path, cfg)
    if "<!-- build:seo -->" in s:
        s = re.sub(r"<!-- build:seo -->.*?<!-- /build:seo -->", lambda _: seo, s, count=1, flags=re.S)
    else:
        s = s.replace('    <link rel="stylesheet"', f"    {seo}\n\n    <link rel=\"stylesheet\"", 1)

    # Header & footer
    s = replace_block(
        s, "header",
        r'(<!-- Main Header -->\s*)?<header class="main-header">.*?</header>',
        build_header(cfg), path,
    )
    s = replace_block(
        s, "footer",
        r'(<!-- Footer -->\s*)?<footer class="main-footer">.*?</footer>',
        build_footer(cfg), path,
    )

    io.open(full, "w", encoding="utf-8", newline="").write(s)
    print(f"built {path}")


def build_sitemap():
    today = date.today().isoformat()
    urls = []
    for path, cfg in PAGES.items():
        loc = f"{SITE}/" if cfg.get("root") else f"{SITE}/{path.replace(os.sep, '/')}"
        priority = "1.0" if cfg.get("root") else "0.7"
        urls.append(
            f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{today}</lastmod>\n"
            f"    <priority>{priority}</priority>\n  </url>"
        )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls) + "\n</urlset>\n"
    )
    io.open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8", newline="").write(xml)
    print("built sitemap.xml")


def build_rss():
    from datetime import datetime
    items = []
    for a in sorted(ARTICLES, key=lambda x: x["date"], reverse=True):
        pub = datetime.strptime(a["date"], "%Y-%m-%d").strftime("%a, %d %b %Y 08:00:00 GMT")
        link = f"{SITE}/pages/en/news.html#{a['slug']}"
        items.append(
            "  <item>\n"
            f"    <title>{a['title']}</title>\n"
            f"    <link>{link}</link>\n"
            f"    <guid isPermaLink=\"false\">{a['slug']}</guid>\n"
            f"    <pubDate>{pub}</pubDate>\n"
            f"    <description>{a['desc']}</description>\n"
            "  </item>"
        )
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<rss version="2.0">\n'
        "<channel>\n"
        "  <title>C.N.S — Clear Net Sky | Security News</title>\n"
        f"  <link>{SITE}/pages/en/news.html</link>\n"
        "  <description>Security news, threat alerts and research from the Clear Net Sky (S.O.W.A) team.</description>\n"
        "  <language>en</language>\n"
        + "\n".join(items) + "\n</channel>\n</rss>\n"
    )
    io.open(os.path.join(ROOT, "feed.xml"), "w", encoding="utf-8", newline="\n").write(xml)
    print("built feed.xml")


if __name__ == "__main__":
    for path, cfg in PAGES.items():
        process(path, cfg)
    build_sitemap()
    build_rss()
    print("done.")
