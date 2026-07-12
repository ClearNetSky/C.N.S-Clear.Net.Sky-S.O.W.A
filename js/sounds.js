// ============================================================
// sounds.js — ambient audio for Clear Net Sky / S.O.W.A
// Works on every page: the audio elements are injected when a
// page does not ship them, the mute toggle always responds, and
// the background track resumes where it left off across pages.
// ============================================================
class SoundManager {
    constructor() {
        this._initialized = false;
        this._lastSave = 0;

        // Make sure the four audio elements exist before we grab them.
        this.ensureAudioElements();

        this.sounds = {
            hover: document.getElementById('hover-sound'),
            click: document.getElementById('click-sound'),
            tableHover: document.getElementById('table-hover-sound'),
            background: document.getElementById('background-music')
        };

        // Two independent channels:
        //  - music (background track) — opt-in, toggled by the header button;
        //  - sfx (hover/click/table)  — on by default, subtle UI feedback.
        // Muting the music never kills the interface sounds.
        this.musicEnabled = false;
        this.sfxEnabled = true;
        this.volume = 0.3;

        this.init();
    }

    /** Inject <audio> tags on pages that don't already have them. */
    ensureAudioElements() {
        if (document.getElementById('background-music')) return; // present (e.g. index.html)
        // Pages under /pages/<lang>/ are two levels below the site root.
        const prefix = window.location.pathname.includes('/pages/') ? '../../sounds/' : 'sounds/';
        const defs = [
            ['background-music', 'background.mp3', true],
            ['hover-sound', 'hover.mp3', false],
            ['click-sound', 'click.mp3', false],
            ['table-hover-sound', 'table-hover.mp3', false]
        ];
        defs.forEach(([id, file, loop]) => {
            const audio = document.createElement('audio');
            audio.id = id;
            // Background track loads its metadata so we can resume the
            // saved position; the short SFX stay lazy.
            audio.preload = loop ? 'metadata' : 'none';
            if (loop) audio.loop = true;
            const source = document.createElement('source');
            source.src = prefix + file;
            source.type = 'audio/mpeg';
            audio.appendChild(source);
            document.body.appendChild(audio);
        });
    }

    init() {
        if (this._initialized) return;
        this._initialized = true;

        const music = localStorage.getItem('cns-music-enabled');
        const legacy = localStorage.getItem('cns-sound-enabled'); // pre-split pref
        if (music !== null) this.musicEnabled = music === 'true';
        else if (legacy !== null) this.musicEnabled = legacy === 'true';

        const sfx = localStorage.getItem('cns-sfx-enabled');
        if (sfx !== null) this.sfxEnabled = sfx === 'true';

        this.setVolume(this.volume);
        this.updateSoundToggle();
        this.setupEventListeners();
        this.trackBackgroundProgress();

        if (this.musicEnabled) this.playBackgroundMusic();
    }

    setupEventListeners() {
        const toggle = document.getElementById('sound-toggle');
        if (toggle) toggle.addEventListener('click', () => this.toggleSound());

        // Hover sounds only on devices that actually hover (skip touch).
        const canHover = window.matchMedia('(hover: hover)').matches;
        if (canHover) {
            document.querySelectorAll('a, button, .dashboard-card, .nav-link, .language-option')
                .forEach(el => el.addEventListener('mouseenter', () => this.playHoverSound()));
        }

        document.querySelectorAll('a, button, .language-option')
            .forEach(el => el.addEventListener('click', () => this.playClickSound()));

        document.querySelectorAll('table tr')
            .forEach(row => row.addEventListener('mouseenter', () => this.playTableHoverSound()));

        // Unlock audio on the first user gesture (autoplay policy).
        const unlock = () => {
            if (this.musicEnabled) this.playBackgroundMusic();
            document.removeEventListener('pointerdown', unlock);
            document.removeEventListener('keydown', unlock);
        };
        document.addEventListener('pointerdown', unlock, { once: true });
        document.addEventListener('keydown', unlock, { once: true });
    }

    _playSfx(audio) {
        if (!this.sfxEnabled || !audio) return;
        try {
            audio.currentTime = 0;
            const p = audio.play();
            if (p && p.catch) p.catch(() => {});
        } catch (e) { /* ignore */ }
    }

    playHoverSound() { this._playSfx(this.sounds.hover); }
    playClickSound() { this._playSfx(this.sounds.click); }
    playTableHoverSound() { this._playSfx(this.sounds.tableHover); }

    playBackgroundMusic() {
        const bg = this.sounds.background;
        if (!this.musicEnabled || !bg) return;

        // Resume the saved position once metadata is available.
        const restore = () => {
            const saved = parseFloat(localStorage.getItem('cns-bg-time'));
            if (!isNaN(saved) && saved > 0 && (!bg.duration || saved < bg.duration)) {
                try { bg.currentTime = saved; } catch (e) { /* ignore */ }
            }
        };
        if (bg.readyState >= 1) restore();
        else bg.addEventListener('loadedmetadata', restore, { once: true });

        // Always call play(): it also kicks off loading when preload="none"
        // and rejects (caught) if autoplay is blocked until a user gesture.
        const p = bg.play();
        if (p && p.catch) p.catch(() => { /* blocked until a gesture */ });
    }

    stopBackgroundMusic() {
        const bg = this.sounds.background;
        if (!bg) return;
        // Remember position so the next page picks up where we left off.
        if (!isNaN(bg.currentTime)) localStorage.setItem('cns-bg-time', bg.currentTime);
        bg.pause();
    }

    /** Persist playback position so the track feels continuous between pages. */
    trackBackgroundProgress() {
        const bg = this.sounds.background;
        if (!bg) return;
        bg.addEventListener('timeupdate', () => {
            const now = Date.now();
            if (now - this._lastSave > 2000) {
                this._lastSave = now;
                localStorage.setItem('cns-bg-time', bg.currentTime);
            }
        });
        window.addEventListener('pagehide', () => {
            if (bg && !bg.paused && !isNaN(bg.currentTime)) {
                localStorage.setItem('cns-bg-time', bg.currentTime);
            }
        });
    }

    /** Header button: toggles the background music only (SFX stay on). */
    toggleSound() {
        this.musicEnabled = !this.musicEnabled;
        localStorage.setItem('cns-music-enabled', this.musicEnabled);

        if (this.musicEnabled) this.playBackgroundMusic();
        else this.stopBackgroundMusic();

        this.updateSoundToggle();

        if (window.Toast && window.languageManager) {
            const on = this.musicEnabled;
            const lang = window.languageManager.currentLang;
            const msg = on
                ? (lang === 'ru' ? 'Музыка включена' : 'Music on')
                : (lang === 'ru' ? 'Музыка выключена' : 'Music off');
            window.Toast.show(msg, 'info', '', 2000);
        }
    }

    /** Separate switch for interface sounds (not exposed in the header). */
    toggleSfx() {
        this.sfxEnabled = !this.sfxEnabled;
        localStorage.setItem('cns-sfx-enabled', this.sfxEnabled);
        return this.sfxEnabled;
    }

    updateSoundToggle() {
        const toggle = document.getElementById('sound-toggle');
        if (!toggle) return;
        const icon = toggle.querySelector('i');
        if (icon) icon.className = this.musicEnabled ? 'fas fa-volume-up' : 'fas fa-volume-xmark';
        toggle.setAttribute('aria-pressed', String(this.musicEnabled));
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            if (sound) sound.volume = this.volume;
        });
    }
}

// Initialize when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.soundManager = new SoundManager();
});
