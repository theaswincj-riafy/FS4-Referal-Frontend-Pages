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

    // Helper function to replace all variables in text
    const replaceVariables = (text) => {
      if (!text) return text;
      return text
        .replace(/\{\{referrer_name\}\}/g, apiData.referrer_name || this.params.firstname)
        .replace(/\{\{referral_link\}\}/g, apiData.referral_url || '#')
        .replace(/\{\{pending_redemptions\}\}/g, apiData.pending_redemptions || '0')
        .replace(/\{\{current_redemptions\}\}/g, apiData.current_redemptions || '0');
    };

    // Populate header using data mapping
    const headerElement = document.getElementById('header-title');
    if (headerElement && hero.page_title) {
      headerElement.textContent = replaceVariables(hero.page_title);
    }

    // Populate hero section using data mapping
    const heroTitleElement = document.getElementById('hero-title');
    if (heroTitleElement && hero.hero_title) {
      heroTitleElement.textContent = replaceVariables(hero.hero_title);
    }

    const heroSubtitleElement = document.getElementById('hero-subtitle');
    if (heroSubtitleElement && hero.subtitle) {
      heroSubtitleElement.textContent = replaceVariables(hero.subtitle);
    }

    const referralCodeElement = document.getElementById('referral-code');
    if (referralCodeElement && apiData.referral_code) {
      referralCodeElement.textContent = replaceVariables(apiData.referral_code);
    }

    const viewReferralsTextElement = document.getElementById('view-referrals-text');
    if (viewReferralsTextElement && hero.quickButtonText) {
      viewReferralsTextElement.textContent = replaceVariables(hero.quickButtonText);
    }

    // Populate how it works steps using data mapping
    if (steps.length > 0) {
      steps.forEach((step) => {
        const stepElement = document.getElementById(`step-${step.step}`);
        if (stepElement && step.desc) {
          stepElement.textContent = replaceVariables(step.desc);
        }
      });
    }

    // Populate progress section using data mapping
    const progressTitleElement = document.getElementById('progress-title');
    if (progressTitleElement && progress.title) {
      progressTitleElement.textContent = replaceVariables(progress.title);
    }

    const progressSubtitleElement = document.getElementById('progress-subtitle');
    if (progressSubtitleElement && progress.subtitle) {
      progressSubtitleElement.textContent = replaceVariables(progress.subtitle);
    }

    // Populate benefits cards using data mapping (NOTE: mapping seems reversed in data structure)
    if (benefits.length > 0) {
      benefits.forEach((benefit, index) => {
        const titleElement = document.getElementById(`benefit-${index + 1}-title`);
        const descElement = document.getElementById(`benefit-${index + 1}-desc`);
        // According to mapping: benefit.desc goes to title, benefit.title goes to desc
        if (titleElement && benefit.title) {
          titleElement.textContent = replaceVariables(benefit.title);
        }
        if (descElement && benefit.desc) {
          descElement.textContent = replaceVariables(benefit.desc);
        }
      });
    }

    // Populate tip using data mapping - randomly select from nudges array
    const tipElement = document.getElementById('tip-text');
    if (tipElement && nudges.length > 0) {
      const randomTip = nudges[Math.floor(Math.random() * nudges.length)];
      tipElement.textContent = replaceVariables(randomTip);
    }

    // Populate footer CTA using data mapping
    const primaryCtaElement = document.getElementById('primary-cta');
    if (primaryCtaElement && share.primary_cta) {
      primaryCtaElement.textContent = replaceVariables(share.primary_cta);
    }

    // Store share message for later use in sharing functionality
    if (share.messages && share.messages.default) {
      this.shareMessage = replaceVariables(share.messages.default);
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

    // Initial card setup with fade-in animation
    this.setupInitialCards(cards);

    // Add touch/swipe support
    this.addTouchSupport();
  }

  setupInitialCards(cards) {
    // Set initial properties and animate in
    cards.forEach((card, index) => {
      // Set initial state (invisible and slightly scaled down)
      gsap.set(card, {
        opacity: 0,
        scale: 0.98
      });
      
      // Animate in with stagger
      gsap.to(card, {
        opacity: 1,
        scale: 1,
        duration: 0.4,
        delay: index * 0.08,
        ease: "power2.out"
      });
    });
  }

  swipeCard(direction) {
    const topCard = document.querySelector('.benefit-card.top-card');
    if (!topCard) return;

    // Animate the top card out
    const swipeDistance = direction === 'left' ? -400 : 400;
    const tiltAngle = direction === 'left' ? -10 : 10;
    
    gsap.to(topCard, {
      x: swipeDistance,
      y: -20,
      rotation: tiltAngle,
      opacity: 0,
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => {
        // Promote cards and add new back card
        this.promoteCards();
      }
    });
  }

  promoteCards() {
    const cards = document.querySelectorAll('.benefit-card');
    if (cards.length < 3) return;

    // Get current cards
    const topCard = document.querySelector('.benefit-card.top-card');
    const middleCard = document.querySelector('.benefit-card.middle-card');
    const backCard = document.querySelector('.benefit-card.back-card');

    if (!topCard || !middleCard || !backCard) return;

    // Reset the swiped card and move to back
    gsap.set(topCard, {
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1
    });

    // Change classes to promote cards
    topCard.className = topCard.className.replace('top-card', 'back-card');
    middleCard.className = middleCard.className.replace('middle-card', 'top-card');
    backCard.className = backCard.className.replace('back-card', 'middle-card');

    // Update the data-index to maintain card cycling
    const newTopIndex = parseInt(middleCard.dataset.index);
    const newMiddleIndex = parseInt(backCard.dataset.index);
    const newBackIndex = parseInt(topCard.dataset.index);
    
    document.querySelector('.benefit-card.top-card').dataset.index = newTopIndex;
    document.querySelector('.benefit-card.middle-card').dataset.index = newMiddleIndex;
    document.querySelector('.benefit-card.back-card').dataset.index = newBackIndex;
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
          this.swipeCard('right');
        } else {
          this.swipeCard('left');
        }
      }
      
      isDragging = false;
    }, { passive: true });

    // Click events for cards - advance to next card on tap
    container.addEventListener('click', (e) => {
      const card = e.target.closest('.benefit-card');
      if (card && card.classList.contains('top-card')) {
        // Tap on top card to advance
        this.swipeCard('left');
      }
    });

    // Add press effect for top card
    const topCard = document.querySelector('.benefit-card.top-card');
    if (topCard) {
      topCard.addEventListener('mousedown', this.addPressEffect);
      topCard.addEventListener('touchstart', this.addPressEffect, { passive: true });
      topCard.addEventListener('mouseup', this.removePressEffect);
      topCard.addEventListener('touchend', this.removePressEffect, { passive: true });
    }
  }

  addPressEffect = (e) => {
    const card = e.target.closest('.benefit-card.top-card');
    if (card) {
      gsap.to(card, {
        y: -2,
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.18)",
        duration: 0.1,
        ease: "power2.out"
      });
    }
  }

  removePressEffect = (e) => {
    const card = e.target.closest('.benefit-card.top-card');
    if (card) {
      gsap.to(card, {
        y: 0,
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        duration: 0.1,
        ease: "power2.out"
      });
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

    // View All Cards link in bottom pill
    const viewAllLink = document.getElementById('view-all-cards');
    if (viewAllLink) {
      viewAllLink.addEventListener('click', (e) => {
        e.preventDefault();
        // Cycle through cards quickly to show all of them
        this.showAllCards();
      });
    }
  }

  showAllCards() {
    // Quick demonstration of all cards
    let cycleCount = 0;
    const maxCycles = 3; // Show 3 cards
    
    const cycleInterval = setInterval(() => {
      this.swipeCard('left');
      cycleCount++;
      
      if (cycleCount >= maxCycles) {
        clearInterval(cycleInterval);
      }
    }, 800); // 800ms between each card
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