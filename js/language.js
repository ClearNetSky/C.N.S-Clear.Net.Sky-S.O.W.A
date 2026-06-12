// ============================================================
// language.js — bilingual engine (EN / RU) for Clear Net Sky
//
// Two contexts are supported:
//   1. The root dashboard (index.html) translates in place via the
//      data-i18n attributes and rewrites its navigation links to the
//      matching language directory.
//   2. The content pages live in /pages/en/ and /pages/ru/. There the
//      active language is decided by the URL, and switching language
//      navigates to the mirror page in the other directory.
// ============================================================
class LanguageManager {
    constructor() {
        this.currentLang = 'en';
        this._initialized = false;
        this.translations = {
            'en': {
                'home': 'Home',
                'about': 'About',
                'services': 'Services',
                'news': 'News',
                'threats': 'Threat Database',
                'contact': 'Contact',
                'choose-language': 'Select Language / Выберите язык',
                'intro-text': 'Advanced Cyber Security Solutions',
                'explore-services': 'Explore Services',
                'get-started': 'Get Started',
                'threats-blocked': 'Threats Blocked Today',
                'countries': 'Countries Protected',
                'enterprises': 'Civilian Clients',
                'uptime': '% Uptime',
                'system-status': 'System Status',
                'cpu-usage': 'CPU Usage',
                'memory-usage': 'Memory Usage',
                'network-traffic': 'Network Traffic',
                'security-recommendations': 'Security Recommendations',
                'recommendation-1': 'Update firewall rules: scheduled',
                'recommendation-2': 'Review privileged access: pending',
                'recommendation-3': 'Schedule penetration test: planned',
                'global-threats': 'Global Threat Map',
                'last-hour': 'Last Hour',
                'last-day': 'Last 24 Hours',
                'last-week': 'Last Week',
                'threat-statistics': 'Threat Statistics',
                'total-attacks': 'Total Attacks',
                'top-threat': 'Top Threat',
                'top-source': 'Top Source',
                'threat-legend': 'Threat Legend',
                'high-risk': 'High Risk',
                'medium-risk': 'Medium Risk',
                'low-risk': 'Low Risk',
                'recent-alerts': 'Recent Alerts',
                'alert-critical': 'Critical: live feed initialising',
                'alert-malware': 'Malware signature sync in progress',
                'alert-intrusion': 'Suspicious login monitoring active',
                'alert-update': 'Security definitions up to date',
                'view-all-alerts': 'View All Alerts',
                'acknowledge-all': 'Acknowledge All',
                'security-tips': 'Security Tips',
                'tip-1-title': 'Enable Multi-Factor Authentication',
                'tip-1-desc': 'Always enable MFA for important accounts to add an extra layer of security beyond passwords.',
                'tip-2-title': 'Regular Software Updates',
                'tip-2-desc': 'Keep all software updated to protect against known vulnerabilities that attackers exploit.',
                'tip-3-title': 'Phishing Awareness',
                'tip-3-desc': 'Be cautious of unsolicited emails and never click suspicious links or download attachments from unknown sources.',
                'threat-prevention': 'Threat Prevention',
                'malware-blocked': 'Malware Blocked',
                'phishing-blocked': 'Phishing Blocked',
                'prevention-tip': 'Our DNS-powered systems are actively blocking threats in real time. Ensure your endpoints are protected with our latest security patches.',
                'latest-news': 'Latest News',
                'view-all': 'View All',
                'news-category-1': 'DNS Security',
                'news-title-1': 'New DNS-powered Threat Detection System',
                'news-desc-1': 'Our latest DNS algorithms can now detect zero-day threats with 99.7% accuracy, revolutionising civilian security.',
                'news-category-2': 'Ransomware',
                'news-title-2': 'Global Ransomware Attack Neutralised',
                'news-desc-2': 'Our threat-intelligence team successfully neutralised a coordinated ransomware campaign — full report coming soon.',
                'read-more': 'Read More',
                'footer-desc': 'Advanced cyber security solutions for the modern digital world.',
                'quick-links': 'Quick Links',
                'resources': 'Resources',
                'threat-database': 'Threat Database',
                'emergency-response': 'Emergency Response',
                'report-threat': 'Report a Threat',
                'white-papers': 'White Papers',
                'webinars': 'Webinars',
                'contact-us': 'Contact Us',
                'footer-address': 'Global Security Operations Center',
                'emergency': 'Emergency',
                'emergency-desc': '24/7 incident response support',
                'rights-reserved': 'All rights reserved.',
                'login': 'Login',
                'logout': 'Logout',
                'login-to-system': 'Login to System',
                'username': 'Username',
                'password': 'Password',
                'remember-me': 'Remember me',
                'forgot-password': 'Forgot password?',
                'or': 'OR',
                'signin-with-google': 'Sign in with Google',
                'signin-with-microsoft': 'Sign in with Microsoft',
                // runtime / toast messages
                'msg-login-success': 'Access granted. Welcome to the S.O.W.A console.',
                'msg-login-required': 'Please enter both username and password.',
                'msg-logged-out': 'You have been signed out.',
                'msg-message-sent': 'Message transmitted. Our team will respond shortly.',
                'msg-message-error': 'Please complete the required fields correctly.',
                'msg-subscribed': 'Subscribed — threat intel will arrive in your inbox.',
                'msg-invalid-email': 'Please enter a valid email address.',
                'msg-theme': 'Theme switched to',
                'msg-alerts-ack': 'All alerts acknowledged.',
                'msg-coming-soon': 'This section is coming soon.',
                'msg-required': 'This field is required',
                'msg-bad-email': 'Enter a valid email'
            },
            'ru': {
                'home': 'Главная',
                'about': 'О нас',
                'services': 'Услуги',
                'news': 'Новости',
                'threats': 'База угроз',
                'contact': 'Контакты',
                'choose-language': 'Выберите язык / Select Language',
                'intro-text': 'Передовые решения в области кибербезопасности',
                'explore-services': 'Наши услуги',
                'get-started': 'Начать',
                'threats-blocked': 'Угроз заблокировано сегодня',
                'countries': 'Стран под защитой',
                'enterprises': 'Гражданских клиентов',
                'uptime': '% Аптайм',
                'system-status': 'Статус системы',
                'cpu-usage': 'Загрузка CPU',
                'memory-usage': 'Использование памяти',
                'network-traffic': 'Сетевой трафик',
                'security-recommendations': 'Рекомендации по безопасности',
                'recommendation-1': 'Обновить правила firewall: запланировано',
                'recommendation-2': 'Пересмотреть привилегированный доступ: ожидает',
                'recommendation-3': 'Тест на проникновение: планируется',
                'global-threats': 'Карта глобальных угроз',
                'last-hour': 'Последний час',
                'last-day': 'Последние 24 часа',
                'last-week': 'Последняя неделя',
                'threat-statistics': 'Статистика угроз',
                'total-attacks': 'Всего атак',
                'top-threat': 'Главная угроза',
                'top-source': 'Основной источник',
                'threat-legend': 'Легенда угроз',
                'high-risk': 'Высокий риск',
                'medium-risk': 'Средний риск',
                'low-risk': 'Низкий риск',
                'recent-alerts': 'Последние оповещения',
                'alert-critical': 'Критично: инициализация ленты',
                'alert-malware': 'Синхронизация сигнатур ПО',
                'alert-intrusion': 'Мониторинг подозрительных входов активен',
                'alert-update': 'Определения безопасности актуальны',
                'view-all-alerts': 'Все оповещения',
                'acknowledge-all': 'Подтвердить все',
                'security-tips': 'Советы по безопасности',
                'tip-1-title': 'Включите многофакторную аутентификацию',
                'tip-1-desc': 'Всегда включайте MFA для важных учётных записей, чтобы добавить уровень защиты помимо паролей.',
                'tip-2-title': 'Регулярные обновления ПО',
                'tip-2-desc': 'Обновляйте всё программное обеспечение для защиты от известных уязвимостей, которые используют злоумышленники.',
                'tip-3-title': 'Осведомлённость о фишинге',
                'tip-3-desc': 'Будьте осторожны с нежелательными письмами и никогда не переходите по подозрительным ссылкам и не скачивайте вложения из неизвестных источников.',
                'threat-prevention': 'Предотвращение угроз',
                'malware-blocked': 'Вредоносное ПО заблокировано',
                'phishing-blocked': 'Фишинг заблокирован',
                'prevention-tip': 'Наши системы на основе DNS активно блокируют угрозы в реальном времени. Убедитесь, что ваши устройства защищены последними патчами безопасности.',
                'latest-news': 'Последние новости',
                'view-all': 'Все новости',
                'news-category-1': 'DNS-Безопасность',
                'news-title-1': 'Новая система обнаружения угроз на основе DNS',
                'news-desc-1': 'Наши новейшие DNS-алгоритмы обнаруживают угрозы нулевого дня с точностью 99,7%, выводя защиту граждан на новый уровень.',
                'news-category-2': 'Ransomware',
                'news-title-2': 'Глобальная ransomware-атака нейтрализована',
                'news-desc-2': 'Наша команда разведки угроз успешно нейтрализовала скоординированную ransomware-кампанию — полный отчёт скоро.',
                'read-more': 'Читать далее',
                'footer-desc': 'Передовые решения в области кибербезопасности для современного цифрового мира.',
                'quick-links': 'Быстрые ссылки',
                'resources': 'Ресурсы',
                'threat-database': 'База угроз',
                'emergency-response': 'Экстренное реагирование',
                'report-threat': 'Сообщить об угрозе',
                'white-papers': 'Документация',
                'webinars': 'Вебинары',
                'contact-us': 'Свяжитесь с нами',
                'footer-address': 'Глобальный центр операций безопасности',
                'emergency': 'Экстренная связь',
                'emergency-desc': 'Круглосуточная поддержка реагирования',
                'rights-reserved': 'Все права защищены.',
                'login': 'Вход',
                'logout': 'Выход',
                'login-to-system': 'Вход в систему',
                'username': 'Имя пользователя',
                'password': 'Пароль',
                'remember-me': 'Запомнить меня',
                'forgot-password': 'Забыли пароль?',
                'or': 'ИЛИ',
                'signin-with-google': 'Войти через Google',
                'signin-with-microsoft': 'Войти через Microsoft',
                // runtime / toast messages
                'msg-login-success': 'Доступ разрешён. Добро пожаловать в консоль S.O.W.A.',
                'msg-login-required': 'Введите имя пользователя и пароль.',
                'msg-logged-out': 'Вы вышли из системы.',
                'msg-message-sent': 'Сообщение отправлено. Мы скоро свяжемся с вами.',
                'msg-message-error': 'Пожалуйста, корректно заполните обязательные поля.',
                'msg-subscribed': 'Подписка оформлена — данные об угрозах придут на почту.',
                'msg-invalid-email': 'Введите корректный email-адрес.',
                'msg-theme': 'Тема изменена на',
                'msg-alerts-ack': 'Все оповещения подтверждены.',
                'msg-coming-soon': 'Этот раздел скоро появится.',
                'msg-required': 'Обязательное поле',
                'msg-bad-email': 'Введите корректный email'
            }
        };

        // Friendly theme names for toast feedback
        this.themeNames = {
            'en': { 'cyber-theme': 'Cyber Blue', 'matrix-theme': 'Matrix Green', 'crimson-theme': 'Crimson Alert', 'light-theme': 'Day Ops' },
            'ru': { 'cyber-theme': 'Кибер-синяя', 'matrix-theme': 'Матрица', 'crimson-theme': 'Багровая тревога', 'light-theme': 'Дневная' }
        };
    }

    /** Translate a key for the current language (used by toasts etc.). */
    t(key) {
        const dict = this.translations[this.currentLang] || this.translations.en;
        return dict[key] || this.translations.en[key] || key;
    }

    /** True when we are inside /pages/en/ or /pages/ru/. */
    isContentPage() {
        return /\/pages\/(en|ru)\//.test(window.location.pathname);
    }

    /** Language implied by the current URL, or null on the root site. */
    langFromPath() {
        if (window.location.pathname.includes('/pages/en/')) return 'en';
        if (window.location.pathname.includes('/pages/ru/')) return 'ru';
        return null;
    }

    init() {
        if (this._initialized) return;
        this._initialized = true;

        const pathLang = this.langFromPath();
        if (pathLang) {
            // Content pages: language is fixed by the directory.
            this.currentLang = pathLang;
            localStorage.setItem('cns-language', pathLang);
        } else {
            const saved = localStorage.getItem('cns-language');
            if (saved && this.translations[saved]) {
                this.currentLang = saved;
            } else {
                const browser = (navigator.language || 'en').split('-')[0];
                this.currentLang = browser === 'ru' ? 'ru' : 'en';
            }
        }

        document.documentElement.setAttribute('lang', this.currentLang);
        this.applyLanguage();
        this.updateFlag();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.querySelectorAll('.language-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const lang = e.currentTarget.dataset.lang;
                this.chooseLanguage(lang);
            });
        });

        const langSwitcher = document.getElementById('current-language');
        if (langSwitcher) {
            langSwitcher.addEventListener('click', () => this.toggleLanguage());
        }
    }

    /** Picked from the first-visit modal. */
    chooseLanguage(lang) {
        if (!this.translations[lang]) return;
        localStorage.setItem('cns-language', lang);
        localStorage.setItem('cns-language-set', 'true');
        this.hideLanguageModal();

        if (this.isContentPage()) {
            const url = this.alternateUrl(lang);
            if (url) { window.location.href = url; return; }
        }
        this.setLanguage(lang);
    }

    /** Build the mirror URL for the same page in another language. */
    alternateUrl(lang) {
        const path = window.location.pathname;
        if (path.includes('/pages/en/') || path.includes('/pages/ru/')) {
            return path.replace(/\/pages\/(en|ru)\//, `/pages/${lang}/`) + window.location.search + window.location.hash;
        }
        return null;
    }

    setLanguage(lang) {
        if (!this.translations[lang]) return;
        this.currentLang = lang;
        localStorage.setItem('cns-language', lang);
        document.documentElement.setAttribute('lang', lang);
        this.applyLanguage();
        this.updateFlag();
    }

    toggleLanguage() {
        const newLang = this.currentLang === 'en' ? 'ru' : 'en';

        // On content pages we navigate to the mirror document.
        if (this.isContentPage()) {
            const url = this.alternateUrl(newLang);
            localStorage.setItem('cns-language', newLang);
            if (url) { window.location.href = url; return; }
        }
        this.setLanguage(newLang);
    }

    applyLanguage() {
        const dict = this.translations[this.currentLang];

        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key] !== undefined) el.textContent = dict[key];
        });

        // Placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (dict[key] !== undefined) el.setAttribute('placeholder', dict[key]);
        });

        // Point the root dashboard's navigation/footer at the right
        // language directory so links never cross languages.
        if (!this.isContentPage()) {
            document.querySelectorAll('a[href*="/pages/"], a[href^="pages/"]').forEach(a => {
                const href = a.getAttribute('href');
                a.setAttribute('href', href.replace(/pages\/(en|ru)\//, `pages/${this.currentLang}/`));
            });
        }

        const meta = document.querySelector('meta[name="description"]');
        if (meta) meta.setAttribute('content', dict['footer-desc']);

        document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: this.currentLang } }));
    }

    updateFlag() {
        const flag = document.querySelector('#current-language .flag');
        if (flag) {
            flag.className = 'flag small ' + (this.currentLang === 'en' ? 'us-flag' : 'ru-flag');
        }
        const switcher = document.getElementById('current-language');
        if (switcher) {
            switcher.setAttribute('title', this.currentLang === 'en' ? 'Switch to Russian' : 'Переключить на английский');
        }
    }

    showLanguageModal() {
        const m = document.getElementById('language-modal');
        if (m) m.style.display = 'flex';
    }

    hideLanguageModal() {
        const m = document.getElementById('language-modal');
        if (m) m.style.display = 'none';
    }
}

// Bootstrap
document.addEventListener('DOMContentLoaded', () => {
    window.languageManager = new LanguageManager();
    window.languageManager.init();

    // First-visit language picker (root dashboard only)
    if (!window.languageManager.isContentPage() && !localStorage.getItem('cns-language-set')) {
        window.languageManager.showLanguageModal();
    }
});
