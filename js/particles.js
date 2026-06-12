// particles.js — ambient background, tuned for performance.
// Particle count and effects scale down on phones and are disabled
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
    const count = isSmall ? 22 : (isMobile ? 34 : 70);
    const canHover = window.matchMedia('(hover: hover)').matches;

    particlesJS('particles-js', {
        "particles": {
            "number": {
                "value": count,
                "density": { "enable": true, "value_area": 1500 }
            },
            "color": { "value": ["#0066ff", "#00b4ff", "#4d94ff", "#66d1ff"] },
            "shape": { "type": "circle" },
            "opacity": {
                "value": 0.3,
                "random": true,
                "anim": { "enable": !isMobile, "speed": 0.5, "opacity_min": 0.1, "sync": false }
            },
            "size": {
                "value": 2.5,
                "random": true,
                "anim": { "enable": false }
            },
            "line_linked": {
                "enable": true,
                "distance": isMobile ? 110 : 130,
                "color": "#0066ff",
                "opacity": 0.2,
                "width": 1
            },
            "move": {
                "enable": true,
                "speed": isMobile ? 0.8 : 1.2,
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
                "onclick": { "enable": true, "mode": "push" },
                "resize": true
            },
            "modes": {
                "grab": { "distance": 160, "line_linked": { "opacity": 0.3 } },
                "push": { "particles_nb": 3 }
            }
        },
        "retina_detect": !isMobile
    });

    // NOTE: we deliberately do NOT re-init particles on window 'resize'.
    // particles.js already resizes its own canvas (events.resize:true),
    // and mobile browsers fire 'resize' on every scroll (URL-bar show/
    // hide), so a manual destroy+init there caused constant stutter.
});
