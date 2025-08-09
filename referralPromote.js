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
          ${this.data.how_it_works ? this.data.how_it_works.map(step => `
            <div class="step-item">
              <div class="step-number">${step.step}</div>
              <p class="step-description">${step.desc}</p>
            </div>
          `).join('') : ''}
        </div>
      </section>

      <!-- Progress Section -->
      <section class="progress-section">
        <h3 class="progress-title">${this.data.progress_teaser?.title || 'Almost there!'}</h3>
      </section>
    `;
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