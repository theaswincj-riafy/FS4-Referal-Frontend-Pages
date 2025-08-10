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
    const container = document.getElementById('card-stack');
    if (!container) return;

    // Initialize the new card swiper system
    this.initReferralCardSwiper(container);
  }

  initReferralCardSwiper(container) {
    const cards = Array.from(container.querySelectorAll('.benefit-card'));
    if (!cards.length) return;

    const cardWidth = 280;
    const sideOffset = 40;
    const sideYOffset = 20;
    const rotationDeg = 18;
    const scaleCenter = 1;
    const scaleSide = 0.92;
    const scaleHidden = 0.88;

    let currentIndex = 0;
    let isAnimating = false;

    const getPositions = () => {
      const centerX = (container.offsetWidth - cardWidth) / 2;
      return {
        center: { x: centerX, y: 0, rotation: 0, scale: scaleCenter, opacity: 1, zIndex: 3 },
        right: { x: centerX + sideOffset, y: sideYOffset, rotation: rotationDeg, scale: scaleSide, opacity: 0.8, zIndex: 2 },
        left: { x: centerX - sideOffset, y: sideYOffset, rotation: -rotationDeg, scale: scaleSide, opacity: 0.8, zIndex: 2 },
        hidden: { x: centerX, y: sideYOffset * 2, rotation: 0, scale: scaleHidden, opacity: 0.5, zIndex: 1 }
      };
    };

    const positionCards = (animate = false) => {
      const positions = getPositions();
      cards.forEach((card, i) => {
        const offset = i - currentIndex;
        let pos;
        if (offset === 0) pos = positions.center;
        else if (offset === 1 || offset === -cards.length + 1) pos = positions.right;
        else if (offset === -1 || offset === cards.length - 1) pos = positions.left;
        else pos = positions.hidden;

        if (animate) {
          gsap.to(card, { ...pos, duration: 0.4, ease: "power2.out" });
        } else {
          gsap.set(card, pos);
        }
      });
    };

    const swipeToNext = () => {
      if (isAnimating) return;
      isAnimating = true;
      currentIndex = (currentIndex + 1) % cards.length;
      positionCards(true);
      setTimeout(() => isAnimating = false, 400);
    };

    const swipeToPrev = () => {
      if (isAnimating) return;
      isAnimating = true;
      currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      positionCards(true);
      setTimeout(() => isAnimating = false, 400);
    };

    const bindGestures = () => {
      // Remove old event listeners by cloning nodes
      cards.forEach(card => {
        const newCard = card.cloneNode(true);
        card.parentNode.replaceChild(newCard, card);
      });
      
      const newCards = Array.from(container.querySelectorAll('.benefit-card'));

      // Add swipe detection to center card
      let startX = 0;
      let isDragging = false;
      let dragCard = null;

      const handleStart = (e) => {
        const centerCard = newCards.find((card, i) => i === currentIndex);
        if (!centerCard || e.target.closest('.benefit-card') !== centerCard) return;
        
        startX = e.clientX || e.touches[0].clientX;
        isDragging = true;
        dragCard = centerCard;
      };

      const handleMove = (e) => {
        if (!isDragging || !dragCard) return;
        e.preventDefault();
        const currentX = e.clientX || e.touches[0].clientX;
        const dx = currentX - startX;
        gsap.set(dragCard, { x: `+=${dx * 0.3}` });
      };

      const handleEnd = (e) => {
        if (!isDragging || !dragCard) return;
        isDragging = false;
        
        const currentX = e.clientX || e.changedTouches[0].clientX;
        const dx = currentX - startX;
        
        if (Math.abs(dx) > 50) {
          if (dx < 0) {
            swipeToNext();
          } else {
            swipeToPrev();
          }
        } else {
          gsap.to(dragCard, { x: 0, duration: 0.3, ease: "power2.out" });
        }
        dragCard = null;
      };

      // Mouse events
      container.addEventListener('mousedown', handleStart);
      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleEnd);

      // Touch events
      container.addEventListener('touchstart', handleStart, { passive: true });
      container.addEventListener('touchmove', handleMove, { passive: false });
      container.addEventListener('touchend', handleEnd, { passive: true });

      // Click events for side cards
      newCards.forEach((card, i) => {
        card.addEventListener('click', (e) => {
          if (i === currentIndex) return; // Center card doesn't need click handler
          
          const offset = i - currentIndex;
          if (offset === 1 || offset === -cards.length + 1) {
            swipeToNext();
          } else if (offset === -1 || offset === cards.length - 1) {
            swipeToPrev();
          }
        });
      });
    };

    // Initial setup
    positionCards(false);
    bindGestures();

    // Entrance animation
    gsap.from(cards, { 
      opacity: 0, 
      scale: 0.8, 
      duration: 0.6, 
      ease: "back.out(1.7)", 
      stagger: 0.1 
    });

    // Handle resize
    window.addEventListener('resize', () => positionCards(false));

    // Store methods for external access if needed
    this.swipeToNext = swipeToNext;
    this.swipeToPrev = swipeToPrev;
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