// Referral Promote Page Logic
class ReferralPromotePage {
  constructor() {
    this.data = null;
    this.params = ReferralUtils.getUrlParams();
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
      // Debug logs
      console.log('REFERRAL_DATA exists:', !!window.REFERRAL_DATA);
      console.log('Available keys:', window.REFERRAL_DATA ? Object.keys(window.REFERRAL_DATA) : 'none');
      console.log('Looking for key: page1_referralPromote');
      
      // Simulate API call
      this.data = await ReferralUtils.simulateApiCall('page1_referralPromote');
      console.log('Loaded data:', this.data);
    } catch (error) {
      console.error('API call error:', error);
      this.data = null;
      throw new Error('API call failed');
    }
  }

  renderPage() {
    this.renderHero();
    this.renderMainContent();
    this.renderFooter();
  }

  renderHero() {
    if (!this.data || !this.data.hero) {
      console.error('No hero data available');
      return;
    }
    document.getElementById('hero-title').textContent = this.data.hero.title || 'Loading...';
    document.getElementById('hero-subtitle').textContent = this.data.hero.subtitle || 'Loading...';
    document.getElementById('hero-badge').textContent = this.data.hero.badge || 'Loading...';
  }

  renderMainContent() {
    if (!this.data) {
      console.error('No data available for rendering');
      return;
    }
    
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
      <!-- Benefits Section -->
      <section class="benefits" role="region" aria-labelledby="benefits-title">
        <h2 id="benefits-title">Why Share Your Code?</h2>
        ${this.data.benefits ? this.data.benefits.map(benefit => `
          <div class="card">
            <h3 class="card-title">${benefit.title}</h3>
            <p class="card-desc">${benefit.desc}</p>
          </div>
        `).join('') : '<p>Loading benefits...</p>'}
      </section>

      <!-- Progress Teaser -->
      <section class="progress-section" role="region" aria-labelledby="progress-title">
        <div class="card">
          <h3 id="progress-title">${this.data.progress_teaser.label}</h3>
          <div class="progress-bar-container" role="progressbar" aria-valuenow="${this.params.current_redemptions}" aria-valuemin="0" aria-valuemax="${this.params.target_redemptions}">
            <div class="progress-bar" style="width: ${ReferralUtils.getProgressPercentage(this.params.current_redemptions, this.params.target_redemptions)}%"></div>
          </div>
          <p class="progress-text">${this.data.progress_teaser.value}</p>
          <p class="card-desc">${this.data.progress_teaser.hint}</p>
        </div>
      </section>

      <!-- Share Section -->
      <section class="share-section" role="region" aria-labelledby="share-title">
        <div class="card">
          <h3 id="share-title">${this.data.share.section_title}</h3>
          
          <div class="share-buttons">
            <button class="btn btn-primary" id="share-invite" aria-describedby="share-help">
              <span>📤</span> ${this.data.share.primary_cta}
            </button>
            
            <button class="btn btn-secondary" id="copy-code">
              <span>📋</span> ${this.data.share.copy_code_cta}
            </button>
            
            <button class="btn btn-secondary" id="copy-link">
              <span>🔗</span> ${this.data.share.copy_link_cta}
            </button>
          </div>

          <div class="share-quick">
            <button class="btn share-btn whatsapp" id="share-whatsapp">
              <span>💬</span> WhatsApp
            </button>
            <button class="btn share-btn sms" id="share-sms">
              <span>💬</span> SMS
            </button>
          </div>

          <div id="share-help" class="sr-only">Share your invite through various channels to help friends join</div>
        </div>
      </section>

      <!-- Social Proof -->
      <section class="social-proof" role="region" aria-labelledby="social-proof-title">
        <div class="card">
          <h3 id="social-proof-title">${this.data.social_proof ? this.data.social_proof.title : 'Why people join'}</h3>
          <ul class="bullet-list">
            ${this.data.social_proof && this.data.social_proof.bullets ? this.data.social_proof.bullets.map(bullet => `
              <li>${bullet}</li>
            `).join('') : '<li>Loading...</li>'}
          </ul>
        </div>
      </section>

      <!-- Nudges -->
      <section class="nudges" role="region" aria-labelledby="nudges-title">
        <div class="card">
          <h3 id="nudges-title">Pro Tips</h3>
          <ul class="bullet-list">
            ${this.data.nudges ? this.data.nudges.map(nudge => `
              <li>${nudge}</li>
            `).join('') : '<li>Loading tips...</li>'}
          </ul>
        </div>
      </section>

      <!-- Privacy Note -->
      <div class="privacy-note" role="note">
        ${this.data.privacy_note || 'Loading privacy information...'}
      </div>
    `;
  }

  renderFooter() {
    if (!this.data || !this.data.footer_cta) {
      console.error('No footer data available');
      return;
    }
    const footerCta = document.getElementById('footer-cta');
    footerCta.textContent = this.data.footer_cta.label || 'Continue';
    footerCta.disabled = false;
    footerCta.className = 'btn btn-primary';
  }

  bindEvents() {
    // Share invite button
    document.getElementById('share-invite').addEventListener('click', () => {
      this.handleShareInvite();
    });

    // Copy code button
    document.getElementById('copy-code').addEventListener('click', () => {
      this.handleCopyCode();
    });

    // Copy link button
    document.getElementById('copy-link').addEventListener('click', () => {
      this.handleCopyLink();
    });

    // WhatsApp share
    document.getElementById('share-whatsapp').addEventListener('click', () => {
      this.handleSharePlatform('whatsapp');
    });

    // SMS share
    document.getElementById('share-sms').addEventListener('click', () => {
      this.handleSharePlatform('sms');
    });

    // Footer CTA
    document.getElementById('footer-cta').addEventListener('click', () => {
      this.handleFooterAction();
    });

    // Keyboard navigation
    this.setupKeyboardNavigation();
  }

  handleShareInvite() {
    // Show share guidance toast
    ReferralUtils.showToast('Choose a sharing method below or copy your code/link');
  }

  async handleCopyCode() {
    const success = await ReferralUtils.copyToClipboard(
      this.params.referral_code,
      this.data.share.success_toast
    );
    
    if (success) {
      // Add visual feedback
      const button = document.getElementById('copy-code');
      button.style.background = '#38a169';
      button.style.color = 'white';
      setTimeout(() => {
        button.style.background = '';
        button.style.color = '';
      }, 1000);
    }
  }

  async handleCopyLink() {
    const success = await ReferralUtils.copyToClipboard(
      this.params.referral_link,
      this.data.share.success_toast
    );
    
    if (success) {
      // Add visual feedback
      const button = document.getElementById('copy-link');
      button.style.background = '#38a169';
      button.style.color = 'white';
      setTimeout(() => {
        button.style.background = '';
        button.style.color = '';
      }, 1000);
    }
  }

  handleSharePlatform(platform) {
    const message = this.data.share.messages[platform];
    const shareUrl = ReferralUtils.generateShareUrl(platform, message, this.params.referral_link);
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback: copy message to clipboard
      ReferralUtils.copyToClipboard(message, 'Share message copied!');
    }
  }

  handleFooterAction() {
    ReferralUtils.navigateWithParams('referralStatus.html');
  }

  setupKeyboardNavigation() {
    // Add keyboard support for custom buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        }
      });
    });
  }

  showError(message) {
    const mainContent = document.getElementById('main-content');
    ReferralUtils.showError(mainContent, message);
  }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ReferralPromotePage();
});

// Handle page visibility for potential refresh
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Page became visible - could refresh data here
    console.log('Page visible again');
  }
});
