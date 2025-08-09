// Referral Promote Page Logic
class ReferralPromotePage {
  constructor() {
    this.data = null;
    this.params = ReferralUtils.getUrlParams();
    this.currentCardIndex = 0;
    this.init();
  }

  async init() {
    try {
      await this.loadPageData();
      if (this.data) {
        this.renderPage();
        this.initCardStack();
        this.bindEvents();
      } else {
        throw new Error('No data loaded');
      }
    } catch (error) {
      console.error('Failed to load page:', error);
      this.showError('Failed to load page data. Please try again.');
    }
  }

  async loadPageData() {
    // Show loading state
    const mainContent = document.getElementById('main-content');
    ReferralUtils.showLoading(mainContent);

    try {
      // Get data from the correct language section
      const language = this.params.language || 'en';
      const dataKey = `page1_referralPromote`;
      
      console.log('Loading data for language:', language);
      console.log('Looking for key:', dataKey);
      
      // Simulate API call - look for data in the language section
      if (window.REFERRAL_DATA && window.REFERRAL_DATA[language] && window.REFERRAL_DATA[language][dataKey]) {
        const rawData = window.REFERRAL_DATA[language][dataKey];
        this.data = ReferralUtils.interpolateObject(rawData, this.params);
        console.log('Loaded and interpolated data:', this.data);
      } else {
        throw new Error(`No data found for ${language}.${dataKey}`);
      }
    } catch (error) {
      console.error('API call error:', error);
      this.data = null;
      throw new Error('API call failed');
    }
  }

  renderPage() {
    this.renderMainContent();
    this.renderFooter();
  }

  renderMainContent() {
    if (!this.data) {
      console.error('No data available for rendering');
      return;
    }
    
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
      <!-- Hero Section -->
      <section class="hero-section">
        <div class="hero-image-placeholder"></div>
        <h1 class="hero-title">${this.data.hero?.hero_title || 'Invite & Unlock'}</h1>
        <p class="hero-subtitle">${this.data.hero?.subtitle || 'Loading...'}</p>
        <div class="referral-code-display">${this.data.hero?.referral_code || 'CODE123'}</div>
        <button class="view-referrals-btn" id="view-referrals">
          ${this.data.hero?.quickButtonText || 'View my referrals'}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </section>

      <!-- How It Works Section -->
      <section class="how-it-works">
        <h2 class="section-title">How it works</h2>
        <div class="steps-list">
          ${this.data.how_it_works ? this.data.how_it_works.map((step, index) => `
            <div class="step-item ${step.step === 5 ? 'highlight-step' : ''}">
              <div class="step-number ${step.step === 5 ? 'highlight-number' : ''}">${step.step}</div>
              <p class="step-description">${step.desc}</p>
            </div>
          `).join('') : ''}
        </div>
      </section>

      <!-- Progress Section -->
      <section class="progress-section">
        <h3 class="progress-title">${this.data.progress_teaser?.title || 'Almost there!'}</h3>
        <p class="progress-subtitle">${this.data.progress_teaser?.subtitle || 'Keep sharing!'}</p>
      </section>

      <!-- Rotating Card Stack -->
      <div class="card-stack-container" id="card-stack">
        ${this.data.benefits ? this.data.benefits.map((benefit, index) => `
          <div class="benefit-card ${this.getCardClass(benefit.title)}" data-index="${index}">
            <h4 class="benefit-card-title">${benefit.title}</h4>
            <p class="benefit-card-desc">${benefit.desc}</p>
          </div>
        `).join('') : ''}
      </div>

      <!-- Tips Section -->
      <section class="tips-section">
        ${this.data.nudges && this.data.nudges.length > 0 ? this.data.nudges.map(nudge => `
          <div class="tip-item">
            <div class="tip-icon"></div>
            <span>${nudge}</span>
          </div>
        `).join('') : ''}
      </section>
    `;
  }

  getCardClass(title) {
    if (title.toLowerCase().includes('premium')) return 'premium-access';
    if (title.toLowerCase().includes('together')) return 'win-together';
    return 'fast-simple';
  }

  initCardStack() {
    if (!this.data.benefits || this.data.benefits.length === 0) return;

    const cards = document.querySelectorAll('.benefit-card');
    if (cards.length === 0) return;

    // Position cards in stack
    this.positionCards(cards);

    // Add touch/swipe support
    this.addTouchSupport();
  }

  positionCards(cards) {
    cards.forEach((card, index) => {
      const offset = index - this.currentCardIndex;
      let x = 0, y = 0, rotation = 0, scale = 1, zIndex = cards.length;
      
      if (offset === 0) {
        // Center card - front and center
        x = 0;
        y = 0;
        rotation = 0;
        scale = 1;
        zIndex = cards.length + 2;
      } else if (offset === -1 || (offset === 2 && cards.length === 3)) {
        // Left card - behind and angled
        x = -60;
        y = 20;
        rotation = -15;
        scale = 0.85;
        zIndex = cards.length;
      } else if (offset === 1 || (offset === -2 && cards.length === 3)) {
        // Right card - behind and angled
        x = 60;
        y = 20;
        rotation = 15;
        scale = 0.85;
        zIndex = cards.length;
      } else {
        // Hidden cards
        x = offset > 0 ? 120 : -120;
        y = 40;
        rotation = offset > 0 ? 30 : -30;
        scale = 0.7;
        zIndex = 1;
      }
      
      gsap.to(card, {
        x,
        y,
        rotation,
        scale,
        zIndex,
        duration: 0.4,
        ease: "power2.out"
      });
    });
  }

  rotateCards(direction) {
    const cards = document.querySelectorAll('.benefit-card');
    if (cards.length === 0) return;

    if (direction === 'next') {
      this.currentCardIndex = (this.currentCardIndex + 1) % cards.length;
    } else {
      this.currentCardIndex = (this.currentCardIndex - 1 + cards.length) % cards.length;
    }

    this.positionCards(cards);
  }

  addTouchSupport() {
    const container = document.getElementById('card-stack');
    if (!container) return;

    let startX = 0;
    let startY = 0;
    let isDragging = false;

    // Touch events
    container.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isDragging = true;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      e.preventDefault();
    }, { passive: false });

    container.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // Check if it's a horizontal swipe (not vertical scroll)
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          this.rotateCards('prev');
        } else {
          this.rotateCards('next');
        }
      }
      
      isDragging = false;
    }, { passive: true });

    // Click events for cards
    container.addEventListener('click', (e) => {
      const card = e.target.closest('.benefit-card');
      if (card) {
        const index = parseInt(card.dataset.index);
        if (index !== this.currentCardIndex) {
          this.currentCardIndex = index;
          this.positionCards(document.querySelectorAll('.benefit-card'));
        }
      }
    });
  }

  renderFooter() {
    const primaryCta = document.getElementById('primary-cta');
    if (primaryCta && this.data.share) {
      primaryCta.textContent = this.data.share.primary_cta || 'Invite Friends & Family';
      primaryCta.disabled = false;
    }
  }

  bindEvents() {
    // Back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.history.back();
      });
    }

    // View referrals button
    const viewReferralsBtn = document.getElementById('view-referrals');
    if (viewReferralsBtn) {
      viewReferralsBtn.addEventListener('click', () => {
        window.location.href = `referralStatus.html?${new URLSearchParams(this.params).toString()}`;
      });
    }

    // Primary CTA button
    const primaryCta = document.getElementById('primary-cta');
    if (primaryCta) {
      primaryCta.addEventListener('click', () => {
        this.shareInvite();
      });
    }
  }

  shareInvite() {
    const shareData = {
      title: 'Join me on this app!',
      text: this.data.share?.messages?.default || `${this.params.firstName} invited you to try this app. Get 1 week of Premium features for free!`,
      url: this.params.referral_link || window.location.origin
    };

    if (navigator.share) {
      navigator.share(shareData).catch(console.error);
    } else {
      // Fallback to copying link
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareData.text + ' ' + shareData.url);
        ReferralUtils.showToast('Link copied to clipboard!');
      }
    }
  }

  showError(message) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
      <div class="error-state">
        <p class="error-message">${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
      </div>
    `;
  }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ReferralPromotePage();
});