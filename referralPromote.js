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
        const cardElement = document.querySelector(`[data-index="${index}"]`);
        
        // According to mapping: benefit.desc goes to title, benefit.title goes to desc
        if (titleElement && benefit.title) {
          titleElement.textContent = replaceVariables(benefit.title);
        }
        if (descElement && benefit.desc) {
          descElement.textContent = replaceVariables(benefit.desc);
        }
        
        // Apply dynamic color combination to each card
        if (cardElement) {
          const colorCombo = getRandomColorCombo();
          const gradientBG = colorCombo.gradientBG;
          const textColor = colorCombo.textColor;
          
          cardElement.style.background = `linear-gradient(135deg, ${gradientBG[0]}, ${gradientBG[1]})`;
          cardElement.style.color = textColor;
          
          // Also apply color to child elements
          if (titleElement) titleElement.style.color = textColor;
          if (descElement) descElement.style.color = textColor;
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
    console.log('[CARD SWIPER] Initializing card swiper for container:', container, 'with cards:', cards.length);

    // Handle single card case immediately
    if (cards.length <= 1) {
      console.log('[CARD SWIPER] Single card case detected');
      const card = cards[0];
      if (card) {
        // Wait for container to have dimensions then position single card
        const waitForSingleCard = () => {
          const containerWidth = container.offsetWidth;
          if (containerWidth && containerWidth > 0) {
            const cardWidth = 180;
            const centerX = (containerWidth - cardWidth) / 2;
            console.log('[CARD SWIPER] Single card positioning - containerWidth:', containerWidth, 'centerX:', centerX);
            gsap.set(card, {
              x: centerX,
              y: 40,
              rotation: 0,
              scale: 1,
              zIndex: 3,
              opacity: 0
            });
            gsap.to(card, {
              opacity: 1,
              duration: 0.6,
              ease: "back.out(1.7)"
            });
          } else {
            setTimeout(waitForSingleCard, 50);
          }
        };
        requestAnimationFrame(() => setTimeout(waitForSingleCard, 10));
      }
      return;
    }

    // Multi-card setup with improved initialization
    let currentIndex = 0;
    let isAnimating = false;
    let isInitialized = false;
    let containerWidth = 0;
    let cardPositions = {};
    let lastContainerWidth = 0;

    // Calculate fixed positions once container is ready
    function calculatePositions() {
      containerWidth = container.offsetWidth;
      if (!containerWidth || containerWidth <= 0) return false;

      const cardWidth = 180;
      const centerX = (containerWidth - cardWidth) / 2; // Properly center the card in container
      const centerY = 40;
      const maxOffset = Math.min(60, (containerWidth - cardWidth) / 3); // Increased offset for better separation
      const baseOffset = Math.min(maxOffset, Math.max(35, containerWidth * 0.12)); // Increased base offset
      const sideCardOffset = Math.min(20, Math.max(10, containerWidth * 0.035)); // Increased vertical offset
      const sideCardRotation = 18; // 18 degrees for better visibility

      cardPositions = {
        center: { x: centerX, y: centerY, rotation: 0, zIndex: 100, scale: 1, opacity: 1 },
        right: { x: centerX + baseOffset, y: centerY + sideCardOffset, rotation: sideCardRotation, zIndex: 50, scale: 0.92, opacity: 0.8 },
        left: { x: centerX - baseOffset, y: centerY + sideCardOffset, rotation: -sideCardRotation, zIndex: 50, scale: 0.92, opacity: 0.8 },
        hidden: { x: centerX, y: centerY + Math.min(25, containerWidth * 0.05), rotation: 0, zIndex: 1, scale: 0.88, opacity: 0.5 }
      };

      console.log('[CARD SWIPER] Positions calculated for width:', containerWidth, cardPositions);
      return true;
    }

    // Core positioning function - stable and precise
    function positionCards(animate = false) {
      if (isAnimating && animate) {
        console.log('[CARD SWIPER] positionCards() blocked - animation in progress');
        return;
      }

      if (!calculatePositions()) {
        console.log('[CARD SWIPER] Container dimensions not ready, skipping positioning');
        return;
      }

      console.log('[CARD SWIPER] positionCards() called - currentIndex:', currentIndex, 'animate:', animate);

      cards.forEach((card, index) => {
        const relativeIndex = (index - currentIndex + cards.length) % cards.length;
        let position;

        if (relativeIndex === 0) {
          position = cardPositions.center;
        } else if (relativeIndex === 1) {
          position = cardPositions.right;
        } else if (relativeIndex === cards.length - 1) {
          position = cardPositions.left;
        } else {
          position = cardPositions.hidden;
        }

        if (animate) {
          gsap.to(card, {
            ...position,
            duration: 0.4,
            ease: "power2.out",
            onComplete: () => {
              if (index === cards.length - 1) {
                setupDraggable();
              }
            }
          });
        } else {
          gsap.set(card, position);
        }

        console.log(`[CARD SWIPER] Card ${index} (rel: ${relativeIndex}) animating to:`, position);
      });
    }

    function animateToPosition() {
      if (isAnimating) {
        console.log('[CARD SWIPER] animateToPosition() blocked - animation already in progress');
        return;
      }

      console.log('[CARD SWIPER] Starting animation to new position');
      isAnimating = true;

      positionCards(true);

      // Reset animation flag after duration
      setTimeout(() => {
        console.log('[CARD SWIPER] Animation completed, resetting flag');
        isAnimating = false;
      }, 400);
    }

    function swipeToNext() {
      console.log('[CARD SWIPER] swipeToNext() called - currentIndex:', currentIndex);
      if (isAnimating) {
        console.log('[CARD SWIPER] swipeToNext() blocked - animation in progress');
        return;
      }

      currentIndex = (currentIndex + 1) % cards.length;
      console.log('[CARD SWIPER] New currentIndex:', currentIndex);
      animateToPosition();
    }

    function swipeToPrev() {
      console.log('[CARD SWIPER] swipeToPrev() called - currentIndex:', currentIndex);
      if (isAnimating) {
        console.log('[CARD SWIPER] swipeToPrev() blocked - animation in progress');
        return;
      }

      currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      console.log('[CARD SWIPER] New currentIndex:', currentIndex);
      animateToPosition();
    }

    function setupDraggable() {
      if (!isInitialized) {
        console.log('[CARD SWIPER] setupDraggable() skipped - not initialized:', isInitialized);
        return;
      }

      console.log('[CARD SWIPER] Setting up gesture detection for currentIndex:', currentIndex);

      // Clean up previous event listeners
      cards.forEach(card => {
        // Reset interactions
        card.style.cursor = 'default';
        card.onclick = null;
        // Remove any existing touch/mouse listeners
        card.removeEventListener('touchstart', card._touchStartHandler);
        card.removeEventListener('touchmove', card._touchMoveHandler);
        card.removeEventListener('touchend', card._touchEndHandler);
        card.removeEventListener('mousedown', card._mouseDownHandler);
        card.removeEventListener('mousemove', card._mouseMoveHandler);
        card.removeEventListener('mouseup', card._mouseUpHandler);
      });

      // Setup interactions based on current card positions
      cards.forEach((card, index) => {
        const relativeIndex = (index - currentIndex + cards.length) % cards.length;

        if (relativeIndex === 0) {
          // Center card - setup gesture detection
          card.style.cursor = 'grab';
          
          let startX = 0, startY = 0, isDragging = false;
          const swipeThreshold = 50;

          const handleStart = (e) => {
            if (isAnimating) return;
            
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            
            if (clientX === undefined || clientY === undefined) return;
            
            startX = clientX;
            startY = clientY;
            isDragging = true;
            card.style.cursor = 'grabbing';
            card.classList.add('dragging');
            
            console.log('[CARD SWIPER] Drag started at:', { startX, startY });
            e.preventDefault();
          };

          const handleMove = (e) => {
            if (!isDragging || isAnimating) return;
            
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);
            
            if (clientX === undefined || clientY === undefined) return;
            
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            
            // Only track horizontal movement with some tolerance for vertical
            if (Math.abs(deltaX) > Math.abs(deltaY) || Math.abs(deltaX) > 10) {
              gsap.set(card, {
                x: cardPositions.center.x + deltaX * 0.3,
                rotation: deltaX * 0.05 // Subtle rotation based on drag
              });
              e.preventDefault();
            }
          };

          const handleEnd = (e) => {
            if (!isDragging) return;
            
            const clientX = e.clientX || e.changedTouches[0].clientX;
            const deltaX = clientX - startX;
            
            isDragging = false;
            card.style.cursor = 'grab';
            card.classList.remove('dragging');
            
            console.log('[CARD SWIPER] Drag ended with deltaX:', deltaX);
            
            if (Math.abs(deltaX) > swipeThreshold) {
              if (deltaX > 0) {
                console.log('[CARD SWIPER] Swiping to previous (right swipe)');
                swipeToPrev();
              } else {
                console.log('[CARD SWIPER] Swiping to next (left swipe)');
                swipeToNext();
              }
            } else {
              console.log('[CARD SWIPER] Snap back to center');
              gsap.to(card, {
                x: cardPositions.center.x,
                rotation: cardPositions.center.rotation,
                duration: 0.3,
                ease: "power2.out"
              });
            }
          };

          // Store handlers for cleanup
          card._touchStartHandler = handleStart;
          card._touchMoveHandler = handleMove;
          card._touchEndHandler = handleEnd;
          card._mouseDownHandler = handleStart;
          card._mouseMoveHandler = handleMove;
          card._mouseUpHandler = handleEnd;

          // Touch events
          card.addEventListener('touchstart', handleStart, { passive: false });
          card.addEventListener('touchmove', handleMove, { passive: false });
          card.addEventListener('touchend', handleEnd, { passive: true });

          // Mouse events
          card.addEventListener('mousedown', handleStart);
          document.addEventListener('mousemove', handleMove);
          document.addEventListener('mouseup', handleEnd);

        } else if (relativeIndex === 1) {
          // Right card - click to go to next
          card.style.cursor = 'pointer';
          card.onclick = (e) => {
            e.stopPropagation();
            console.log('[CARD SWIPER] Right card clicked - going to next');
            swipeToNext();
          };
        } else if (relativeIndex === cards.length - 1) {
          // Left card - click to go to previous
          card.style.cursor = 'pointer';
          card.onclick = (e) => {
            e.stopPropagation();
            console.log('[CARD SWIPER] Left card clicked - going to previous');
            swipeToPrev();
          };
        }
      });
    }

    // Debounced resize handler to prevent drift
    let resizeTimeout;
    function handleResize() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const currentWidth = container.offsetWidth;
        if (currentWidth && currentWidth !== lastContainerWidth) {
          lastContainerWidth = currentWidth;
          console.log('[CARD SWIPER] Handling resize to width:', currentWidth);
          // Force recalculation to prevent drift
          containerWidth = 0;
          cardPositions = {};
          positionCards(false);
          setupDraggable(); // Re-setup after resize
        }
      }, 200);
    }

    window.addEventListener('resize', handleResize);

    // Initialize cards with proper timing and single positioning call
    function initialize() {
      const currentWidth = container.offsetWidth;
      if (currentWidth && currentWidth > 0) {
        console.log('[CARD SWIPER] Initializing with container width:', currentWidth);
        lastContainerWidth = currentWidth;

        // Calculate positions and set initial state (no animation)
        if (calculatePositions()) {
          positionCards(false);

          // Animate cards in with entrance effect
          console.log('[CARD SWIPER] Starting entrance animations');
          cards.forEach((card, index) => {
            gsap.from(card, {
              opacity: 0,
              scale: 0.8,
              duration: 0.6,
              delay: index * 0.1,
              ease: "back.out(1.7)",
              onComplete: () => {
                if (index === cards.length - 1) {
                  isInitialized = true;
                  setupDraggable();
                  console.log('[CARD SWIPER] Initialization complete');
                }
              }
            });
          });
        }
      } else {
        console.log('[CARD SWIPER] Container not ready, waiting...');
        setTimeout(initialize, 50);
      }
    }

    // Start initialization with a single call
    requestAnimationFrame(() => {
      setTimeout(initialize, 10);
    });

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