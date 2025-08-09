// Referral Promote Page JavaScript
class ReferralPromotePage {
    constructor() {
        this.data = null;
        this.params = new URLSearchParams(window.location.search);
        this.init();
    }

    init() {
        this.loadData();
        this.bindEvents();
    }

    loadData() {
        console.log('Loading data for language:', 'en');
        console.log('Looking for key:', 'page1_referralPromote');

        const rawData = window.REFERRAL_DATA?.en?.page1_referralPromote;
        if (!rawData) {
            this.showError('Failed to load referral data');
            return;
        }

        // Interpolate template variables
        this.data = this.interpolateData(rawData);
        console.log('Loaded and interpolated data:', this.data);

        this.render();
    }

    interpolateData(data) {
        const paramMap = {
            referrer_name: this.params.get('referrer_name') || 'Friend',
            referral_code: this.params.get('referral_code') || 'INVITE123',
            referral_link: this.params.get('referral_link') || 'https://example.com/invite',
            current_redemptions: this.params.get('current_redemptions') || '0',
            target_redemptions: parseInt(this.params.get('target_redemptions')) || 5
        };

        // Calculate pending redemptions
        paramMap.pending_redemptions = (paramMap.target_redemptions - parseInt(paramMap.current_redemptions)).toString();

        const jsonString = JSON.stringify(data);
        const interpolated = jsonString.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return paramMap[key] !== undefined ? paramMap[key] : match;
        });

        return JSON.parse(interpolated);
    }

    render() {
        // Update header title
        document.getElementById('header-title').textContent = this.data.hero.page_title;

        // Render main content
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <!-- Hero Section -->
            <section class="hero-section">
                <div class="hero-image-placeholder"></div>
                <h2 class="hero-title">${this.data.hero.hero_title}</h2>
                <p class="hero-subtitle">${this.data.hero.subtitle}</p>
                <div class="referral-code-display">${this.data.hero.referral_code}</div>
                <button class="view-referrals-btn" onclick="window.location.href='referralStatus.html${window.location.search}'">
                    ${this.data.hero.quickButtonText} →
                </button>
            </section>

            <!-- How It Works -->
            <section class="how-it-works">
                <h3 class="section-title">How it works</h3>
                <div class="steps-list">
                    ${this.data.how_it_works.map(step => `
                        <div class="step-item">
                            <div class="step-number">${step.step}</div>
                            <div class="step-description">${step.desc}</div>
                        </div>
                    `).join('')}
                </div>
            </section>

            <!-- Progress Teaser -->
            <section class="progress-section">
                <h3 class="progress-title">${this.data.progress_teaser.title}</h3>
                <p class="progress-subtitle">${this.data.progress_teaser.subtitle}</p>
            </section>

            <!-- Benefits Cards -->
            <section class="benefits">
                <div class="card-stack-container">
                    ${this.data.benefits.map((benefit, index) => `
                        <div class="benefit-card ${this.getBenefitClass(index)}" style="transform: translateX(${index * 20}px) translateY(${index * 10}px) rotate(${index * 2}deg); z-index: ${3 - index};">
                            <h4 class="benefit-card-title">${benefit.title}</h4>
                            <p class="benefit-card-desc">${benefit.desc}</p>
                        </div>
                    `).join('')}
                </div>
            </section>

            <!-- Tips Section -->
            <section class="tips-section">
                <h3 class="section-title">💡 Pro Tips</h3>
                ${this.data.nudges.map(tip => `
                    <div class="tip-item">
                        <div class="tip-icon"></div>
                        <span>${tip}</span>
                    </div>
                `).join('')}
            </section>
        `;

        // Update primary CTA
        const primaryCTA = document.getElementById('primary-cta');
        primaryCTA.textContent = this.data.share.primary_cta;
        primaryCTA.disabled = false;
        primaryCTA.onclick = () => this.shareReferral();
    }

    getBenefitClass(index) {
        const classes = ['premium-access', 'win-together', 'fast-simple'];
        return classes[index] || 'premium-access';
    }

    shareReferral() {
        const shareData = {
            title: this.data.hero.hero_title,
            text: this.data.share.messages.default,
            url: this.params.get('referral_link')
        };

        if (navigator.share) {
            navigator.share(shareData).catch(err => {
                console.log('Error sharing:', err);
                this.fallbackShare();
            });
        } else {
            this.fallbackShare();
        }
    }

    fallbackShare() {
        const message = this.data.share.messages.default;

        // Copy to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(message).then(() => {
                this.showToast('Referral message copied to clipboard!', 'success');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = message;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Referral message copied to clipboard!', 'success');
        }
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} toast-show`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showError(message) {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div class="error-state">
                <h3>Oops! Something went wrong</h3>
                <p class="error-message">${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
            </div>
        `;
    }

    bindEvents() {
        // Back button
        document.getElementById('back-btn').addEventListener('click', () => {
            window.history.back();
        });

        // Add card rotation effect
        setTimeout(() => {
            this.animateCards();
        }, 1000);
    }

    animateCards() {
        const cards = document.querySelectorAll('.benefit-card');
        cards.forEach((card, index) => {
            card.addEventListener('click', () => {
                // Rotate cards when clicked
                cards.forEach((c, i) => {
                    const newIndex = (i + 1) % cards.length;
                    c.style.transform = `translateX(${newIndex * 20}px) translateY(${newIndex * 10}px) rotate(${newIndex * 2}deg)`;
                    c.style.zIndex = cards.length - newIndex;
                });
            });
        });
    }
}

// Initialize the page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ReferralPromotePage();
});