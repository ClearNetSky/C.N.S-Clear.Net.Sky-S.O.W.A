// particles.js — ambient background, tuned for performance.
// Particle colours follow the active theme (read from the CSS custom
// properties), counts scale down on phones, and the effect is disabled
// entirely for users who prefer reduced motion.
document.addEventListener('DOMContentLoaded', function () {
    if (typeof particlesJS === 'undefined') return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return; // respect the user's motion preference

    const w = window.innerWidth;
    const isMobile = w <= 768;
    const isSmall = w <= 480;

    // Far fewer nodes on small screens — the linked-line pass is the
    // expensive part, so this is where the weak-device wins come from.
    const count = isSmall ? 18 : (isMobile ? 28 : 55);
    const canHover = window.matchMedia('(hover: hover)').matches;

    function themeColors() {
        const cs = getComputedStyle(document.body);
        const primary = cs.getPropertyValue('--primary-color').trim() || '#4c8dff';
        const secondary = cs.getPropertyValue('--secondary-color').trim() || '#38bdf8';
        return { primary, secondary };
    }

    function init() {
        const { primary, secondary } = themeColors();

        // Drop a previous instance before re-initialising (theme switch).
        if (window.pJSDom && window.pJSDom.length) {
            window.pJSDom.forEach(p => p.pJS.fn.vendors.destroypJS());
            window.pJSDom = [];
        }

        particlesJS('particles-js', {
            "particles": {
                "number": {
                    "value": count,
                    "density": { "enable": true, "value_area": 1500 }
                },
                "color": { "value": [primary, secondary] },
                "shape": { "type": "circle" },
                "opacity": {
                    "value": 0.22,
                    "random": true,
                    "anim": { "enable": !isMobile, "speed": 0.4, "opacity_min": 0.06, "sync": false }
                },
                "size": {
                    "value": 2,
                    "random": true,
                    "anim": { "enable": false }
                },
                "line_linked": {
                    "enable": true,
                    "distance": isMobile ? 110 : 130,
                    "color": primary,
                    "opacity": 0.12,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": isMobile ? 0.6 : 0.9,
                    "direction": "none",
                    "random": true,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    // Grab-on-hover is pointless (and costly) on touch screens.
                    "onhover": { "enable": canHover, "mode": "grab" },
                    "onclick": { "enable": false },
                    "resize": true
                },
                "modes": {
                    "grab": { "distance": 150, "line_linked": { "opacity": 0.2 } }
                }
            },
            "retina_detect": !isMobile
        });
    }

    init();

    // Re-tint the canvas when the theme (body class) changes.
    let retintTimer;
    new MutationObserver(() => {
        clearTimeout(retintTimer);
        retintTimer = setTimeout(init, 450); // wait for the CSS cross-fade
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });

    // NOTE: we deliberately do NOT re-init particles on window 'resize'.
    // particles.js already resizes its own canvas (events.resize:true),
    // and mobile browsers fire 'resize' on every scroll (URL-bar show/
    // hide), so a manual destroy+init there caused constant stutter.
});
