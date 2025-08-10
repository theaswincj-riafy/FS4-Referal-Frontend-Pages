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
        this.populateContent();
        this.hideLoader();
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
    try {
      const endpoint = `/api/referral-promote?lang=${this.params.language}`;
      const body = {
        app_package_name: this.params.app_package_name,
        username: this.params.firstname,
        user_id: this.params.userId
      };

      console.log('Making API call to:', endpoint);
      console.log('Request body:', body);
      
      this.data = await ReferralUtils.makeApiCall(endpoint, 'POST', body);
      console.log('Loaded API data:', this.data);
    } catch (error) {
      console.error('API call error:', error);
      this.data = null;
      throw new Error('API call failed');
    }
  }

  populateContent() {
    if (!this.data) {
      console.error('No data available for rendering');
      return;
    }

    // Extract data from API response structure according to data mapping
    const apiData = this.data.data || this.data;
    const promoteData = apiData.page1_referralPromote || {};
    const hero = promoteData.hero || {};
    const steps = promoteData.how_it_works || [];
    const progress = promoteData.progress_teaser || {};
    const benefits = promoteData.benefits || [];
    const nudges = promoteData.nudges || [];
    const share = promoteData.share || {};

    // Populate header using data mapping
    const headerElement = document.getElementById('header-title');
    if (headerElement && hero.page_title) {
      headerElement.textContent = hero.page_title;
    }

    // Populate hero section using data mapping
    const heroTitleElement = document.getElementById('hero-title');
    if (heroTitleElement && hero.hero_title) {
      heroTitleElement.textContent = hero.hero_title;
    }

    const heroSubtitleElement = document.getElementById('hero-subtitle');
    if (heroSubtitleElement && hero.subtitle) {
      // Replace placeholder with actual referrer name
      const subtitle = hero.subtitle.replace('{{referrer_name}}', apiData.referrer_name || this.params.firstname);
      heroSubtitleElement.textContent = subtitle;
    }

    const referralCodeElement = document.getElementById('referral-code');
    if (referralCodeElement && apiData.referral_code) {
      referralCodeElement.textContent = apiData.referral_code;
    }

    const viewReferralsTextElement = document.getElementById('view-referrals-text');
    if (viewReferralsTextElement && hero.quickButtonText) {
      viewReferralsTextElement.textContent = hero.quickButtonText;
    }

    // Populate how it works steps using data mapping
    if (steps.length > 0) {
      steps.forEach((step) => {
        const stepElement = document.getElementById(`step-${step.step}`);
        if (stepElement && step.desc) {
          stepElement.textContent = step.desc;
        }
      });
    }

    // Populate progress section using data mapping
    const progressTitleElement = document.getElementById('progress-title');
    if (progressTitleElement && progress.title) {
      progressTitleElement.textContent = progress.title;
    }

    const progressSubtitleElement = document.getElementById('progress-subtitle');
    if (progressSubtitleElement && progress.subtitle) {
      progressSubtitleElement.textContent = progress.subtitle;
    }

    // Populate benefits cards using data mapping (NOTE: mapping seems reversed in data structure)
    if (benefits.length > 0) {
      benefits.forEach((benefit, index) => {
        const titleElement = document.getElementById(`benefit-${index + 1}-title`);
        const descElement = document.getElementById(`benefit-${index + 1}-desc`);
        // According to mapping: benefit.desc goes to title, benefit.title goes to desc
        if (titleElement && benefit.title) {
          titleElement.textContent = benefit.title;
        }
        if (descElement && benefit.desc) {
          descElement.textContent = benefit.desc;
        }
      });
    }

    // Populate tip using data mapping - randomly select from nudges array
    const tipElement = document.getElementById('tip-text');
    if (tipElement && nudges.length > 0) {
      const randomTip = nudges[Math.floor(Math.random() * nudges.length)];
      tipElement.textContent = randomTip;
    }

    // Populate footer CTA using data mapping
    const primaryCtaElement = document.getElementById('primary-cta');
    if (primaryCtaElement && share.primary_cta) {
      primaryCtaElement.textContent = share.primary_cta;
    }

    // Store share message for later use in sharing functionality
    if (share.messages && share.messages.default) {
      this.shareMessage = share.messages.default
        .replace('{{referrer_name}}', apiData.referrer_name || this.params.firstname)
        .replace('{{referral_link}}', apiData.referral_url || '#');
    }
  }

  hideLoader() {
    const loader = document.getElementById('page-loader');
    const content = document.getElementById('page-content-wrapper');
    
    if (loader) loader.style.display = 'none';
    if (content) content.style.display = 'block';
  }

  initCardStack() {
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
      
      gsap.set(card, {
        zIndex: cards.length - Math.abs(offset),
        x: offset * 20,
        y: offset * 10,
        rotation: offset * 5,
        scale: 1 - Math.abs(offset) * 0.05
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
    // Use the dynamically generated share message with replaced variables
    const shareText = this.shareMessage || `${this.params.firstname} invited you to try this app!`;
    
    const shareData = {
      title: 'Join me on this app!',
      text: shareText,
      url: this.data?.data?.referral_url || window.location.origin
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
    const loader = document.getElementById('page-loader');
    if (loader) {
      loader.innerHTML = `
        <div class="error-state">
          <p class="error-message">${message}</p>
          <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
        </div>
      `;
    }
  }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ReferralPromotePage();
});