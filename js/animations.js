// animations.js
class AnimationManager {
    constructor() {
        this.animations = new Map();
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.startCountAnimations();
        this.setupCarousels();
        this.setupProgressBars();
    }
    
    setupEventListeners() {
        // Card hover lift/shadow is handled purely in CSS (main.css) so it
        // always matches the active theme — no inline styles here.

        // Add click animations to buttons
        document.querySelectorAll('.button, .icon-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.addClickAnimation(e.currentTarget);
            });
        });
        
        // Setup carousel controls
        const prevTipBtn = document.getElementById('prev-tip');
        const nextTipBtn = document.getElementById('next-tip');
        
        if (prevTipBtn && nextTipBtn) {
            prevTipBtn.addEventListener('click', () => {
                this.navigateCarousel('tips-carousel', -1);
            });
            
            nextTipBtn.addEventListener('click', () => {
                this.navigateCarousel('tips-carousel', 1);
            });
        }
        
        // Refresh alerts button
        const refreshAlertsBtn = document.getElementById('refresh-alerts');
        if (refreshAlertsBtn) {
            refreshAlertsBtn.addEventListener('click', () => {
                this.addSpinAnimation(refreshAlertsBtn.querySelector('i'));
                // Simulate refresh delay
                setTimeout(() => {
                    this.removeSpinAnimation(refreshAlertsBtn.querySelector('i'));
                }, 1000);
            });
        }
    }
    
    addClickAnimation(element) {
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            element.style.transform = '';
        }, 150);
    }
    
    addSpinAnimation(element) {
        element.style.animation = 'spin 1s linear infinite';
    }
    
    removeSpinAnimation(element) {
        element.style.animation = '';
    }
    
    startCountAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const numberElement = entry.target;
                    const target = parseInt(numberElement.getAttribute('data-count'));
                    const duration = 2000; // 2 seconds
                    const steps = 60;
                    const increment = target / steps;
                    let current = 0;
                    
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            clearInterval(timer);
                            current = target;
                        }
                        numberElement.textContent = Math.floor(current);
                    }, duration / steps);
                    
                    observer.unobserve(numberElement);
                }
            });
        }, { threshold: 0.5 });
        
        // Observe all elements with data-count attribute
        document.querySelectorAll('[data-count]').forEach(element => {
            observer.observe(element);
        });
    }
    
    setupCarousels() {
        this.carousels = {
            'tips-carousel': {
                currentIndex: 0,
                items: document.querySelectorAll('.tips-carousel .tip-item'),
                progress: document.querySelector('.progress-fill'),
                progressText: document.querySelector('.progress-text')
            }
        };
        
        this.updateCarousel('tips-carousel');
    }
    
    navigateCarousel(carouselId, direction) {
        const carousel = this.carousels[carouselId];
        if (!carousel) return;
        
        // Hide current item
        carousel.items[carousel.currentIndex].classList.remove('active');
        
        // Calculate new index
        carousel.currentIndex += direction;
        
        // Handle wrap-around
        if (carousel.currentIndex < 0) {
            carousel.currentIndex = carousel.items.length - 1;
        } else if (carousel.currentIndex >= carousel.items.length) {
            carousel.currentIndex = 0;
        }
        
        // Show new item
        carousel.items[carousel.currentIndex].classList.add('active');
        
        // Update progress
        this.updateCarouselProgress(carouselId);
    }
    
    updateCarousel(carouselId) {
        const carousel = this.carousels[carouselId];
        if (!carousel) return;
        
        // Show only the current item
        carousel.items.forEach((item, index) => {
            item.classList.toggle('active', index === carousel.currentIndex);
        });
        
        this.updateCarouselProgress(carouselId);
    }
    
    updateCarouselProgress(carouselId) {
        const carousel = this.carousels[carouselId];
        if (!carousel || !carousel.progress) return;
        
        const progress = ((carousel.currentIndex + 1) / carousel.items.length) * 100;
        carousel.progress.style.width = `${progress}%`;
        
        if (carousel.progressText) {
            carousel.progressText.textContent = `${carousel.currentIndex + 1}/${carousel.items.length}`;
        }
    }
    
    setupProgressBars() {
        // Animate circular progress bars
        const circles = document.querySelectorAll('.circle');
        circles.forEach(circle => {
            const percent = circle.getAttribute('stroke-dasharray').split(',')[0];
            circle.style.strokeDasharray = `0, 100`;
            
            setTimeout(() => {
                circle.style.transition = 'stroke-dasharray 1s ease-out';
                circle.style.strokeDasharray = `${percent}, 100`;
            }, 500);
        });
    }
    
    // Method to add custom animation
    addCustomAnimation(element, animationClass, duration = 1000) {
        element.classList.add(animationClass);
        setTimeout(() => {
            element.classList.remove(animationClass);
        }, duration);
    }
}

// Initialize animation manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.animationManager = new AnimationManager();
});