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
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
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

  populateContent() {
    if (!this.data) {
      console.error('No data available for rendering');
      return;
    }

    // Populate header
    document.getElementById('header-title').textContent = this.data.hero?.page_title || 'Invite Friends';

    // Populate hero section
    document.getElementById('hero-title').textContent = this.data.hero?.hero_title || 'Invite & Unlock 1 Month Premium';
    document.getElementById('hero-subtitle').textContent = this.data.hero?.subtitle || 'Loading...';
    document.getElementById('referral-code').textContent = this.data.hero?.referral_code || 'CODE123';
    document.getElementById('view-referrals-text').textContent = this.data.hero?.quickButtonText || 'View my referrals';

    // Populate how it works steps
    if (this.data.how_it_works) {
      this.data.how_it_works.forEach((step, index) => {
        const stepElement = document.getElementById(`step-${step.step}`);
        if (stepElement) {
          stepElement.textContent = step.desc;
        }
      });
    }

    // Populate progress section
    document.getElementById('progress-title').textContent = this.data.progress_teaser?.title || 'Almost there!';
    document.getElementById('progress-subtitle').textContent = this.data.progress_teaser?.subtitle || 'Keep sharing!';

    // Populate benefits cards
    if (this.data.benefits) {
      this.data.benefits.forEach((benefit, index) => {
        const titleElement = document.getElementById(`benefit-${index + 1}-title`);
        const descElement = document.getElementById(`benefit-${index + 1}-desc`);
        if (titleElement) titleElement.textContent = benefit.title;
        if (descElement) descElement.textContent = benefit.desc;
      });
    }

    // Populate tip
    if (this.data.nudges && this.data.nudges.length > 0) {
      document.getElementById('tip-text').textContent = this.data.nudges[0];
    }

    // Populate footer CTA
    document.getElementById('primary-cta').textContent = this.data.share?.primary_cta || 'Invite Friends & Family';
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