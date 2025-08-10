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
        this.debugHowItWorksSection(); // Add debug function
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
      console.log('[HOW IT WORKS DEBUG] Processing steps:', steps);
      steps.forEach((step) => {
        const stepElement = document.getElementById(`step-${step.step}`);
        const stepRow = stepElement?.closest('.step-row');
        
        console.log(`[HOW IT WORKS DEBUG] Step ${step.step}:`, {
          stepElement: stepElement,
          stepRow: stepRow,
          stepRowClasses: stepRow?.className,
          stepDesc: step.desc
        });
        
        if (stepElement && step.desc) {
          stepElement.textContent = replaceVariables(step.desc);
        }
      });
      
      // Debug all step rows to see their classes
      const allStepRows = document.querySelectorAll('.step-row');
      console.log('[HOW IT WORKS DEBUG] All step rows and their classes:');
      allStepRows.forEach((row, index) => {
        console.log(`Row ${index + 1}:`, {
          element: row,
          classes: row.className,
          isLeft: row.classList.contains('step-left'),
          isRight: row.classList.contains('step-right')
        });
      });
    }

    // Populate progress section using data mapping
    const progressTitleElement = document.getElementById('progress-title');
    if (progressTitleElement && progress.title) {
      let titleText = replaceVariables(progress.title);
      // Add line break for better formatting if text is long
      const words = titleText.split(' ');
      if (words.length > 4) {
        const midPoint = Math.ceil(words.length / 2);
        titleText = words.slice(0, midPoint).join(' ') + '<br>' + words.slice(midPoint).join(' ');
      }
      progressTitleElement.innerHTML = titleText;
    }

    const progressSubtitleElement = document.getElementById('progress-subtitle');
    if (progressSubtitleElement && progress.subtitle) {
      progressSubtitleElement.textContent = replaceVariables(progress.subtitle);
    }

    // Populate benefits cards using data mapping (NOTE: mapping seems reversed in data structure)
    if (benefits.length > 0) {
      const usedColorIndices = new Set();
      
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
        
        // Apply dynamic color combination to each card (ensure unique colors)
        if (cardElement) {
          let colorIndex;
          do {
            colorIndex = Math.floor(Math.random() * COLOR_COMBOS.length);
          } while (usedColorIndices.has(colorIndex) && usedColorIndices.size < COLOR_COMBOS.length);
          
          usedColorIndices.add(colorIndex);
          const colorCombo = COLOR_COMBOS[colorIndex];
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
      let tipText = replaceVariables(randomTip);
      // Add line break for better formatting if text is long
      const words = tipText.split(' ');
      if (words.length > 6) {
        const midPoint = Math.ceil(words.length / 2);
        tipText = words.slice(0, midPoint).join(' ') + '<br>' + words.slice(midPoint).join(' ');
      }
      tipElement.innerHTML = tipText;
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
    console.log('[CARD SWIPER] Initializing simple card swiper with', cards.length, 'cards');

    // Handle single card case
    if (cards.length <= 1) {
      const card = cards[0];
      if (card) {
        const waitForSingleCard = () => {
          const containerWidth = container.offsetWidth;
          if (containerWidth && containerWidth > 0) {
            const cardWidth = 180;
            const centerX = (containerWidth - cardWidth) / 2;
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

    let currentIndex = 0;
    let isAnimating = false;

    // Calculate card positions
    function calculatePositions() {
      const containerWidth = container.offsetWidth;
      if (!containerWidth || containerWidth <= 0) return null;

      const cardWidth = 180;
      const centerX = (containerWidth - cardWidth) / 2;
      const centerY = 40;
      const baseOffset = Math.min(60, Math.max(35, containerWidth * 0.12));
      const sideCardOffset = Math.min(20, Math.max(10, containerWidth * 0.035));
      const sideCardRotation = 18;

      return {
        center: { x: centerX, y: centerY, rotation: 0, zIndex: 100, scale: 1, opacity: 1 },
        right: { x: centerX + baseOffset, y: centerY + sideCardOffset, rotation: sideCardRotation, zIndex: 50, scale: 0.92, opacity: 0.8 },
        left: { x: centerX - baseOffset, y: centerY + sideCardOffset, rotation: -sideCardRotation, zIndex: 50, scale: 0.92, opacity: 0.8 },
        hidden: { x: centerX, y: centerY + Math.min(25, containerWidth * 0.05), rotation: 0, zIndex: 1, scale: 0.88, opacity: 0.5 }
      };
    }

    // Position cards based on current index
    function positionCards(animate = false) {
      const positions = calculatePositions();
      if (!positions) return;

      cards.forEach((card, index) => {
        const relativeIndex = (index - currentIndex + cards.length) % cards.length;
        let position;

        if (relativeIndex === 0) {
          position = positions.center;
        } else if (relativeIndex === 1) {
          position = positions.right;
        } else if (relativeIndex === cards.length - 1) {
          position = positions.left;
        } else {
          position = positions.hidden;
        }

        if (animate) {
          gsap.to(card, {
            ...position,
            duration: 0.4,
            ease: "power2.out"
          });
        } else {
          gsap.set(card, position);
        }
      });
    }

    // Rotate to next card
    function rotateNext() {
      if (isAnimating) return;
      isAnimating = true;
      currentIndex = (currentIndex + 1) % cards.length;
      console.log('[CARD SWIPER] Rotating to next - currentIndex:', currentIndex);
      positionCards(true);
      setTimeout(() => { isAnimating = false; }, 400);
    }

    // Rotate to previous card
    function rotatePrev() {
      if (isAnimating) return;
      isAnimating = true;
      currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      console.log('[CARD SWIPER] Rotating to previous - currentIndex:', currentIndex);
      positionCards(true);
      setTimeout(() => { isAnimating = false; }, 400);
    }

    // Setup simple interactions
    function setupInteractions() {
      cards.forEach((card, index) => {
        // Clean up existing listeners
        card.onclick = null;
        card.removeEventListener('touchstart', card._touchStartHandler);
        card.removeEventListener('touchend', card._touchEndHandler);

        // Click handler based on card position
        card.style.cursor = 'pointer';
        card.onclick = (e) => {
          e.stopPropagation();
          
          const relativeIndex = (index - currentIndex + cards.length) % cards.length;
          
          if (relativeIndex === 0) {
            // Center card - rotate left (to next)
            rotateNext();
          } else if (relativeIndex === 1) {
            // Right card - rotate left (to next)
            rotateNext();
          } else if (relativeIndex === cards.length - 1) {
            // Left card - rotate right (to previous)
            rotatePrev();
          }
        };

        // Simple swipe detection
        let startX = 0;
        let startTime = 0;
        
        const handleTouchStart = (e) => {
          startX = e.touches[0].clientX;
          startTime = Date.now();
        };

        const handleTouchEnd = (e) => {
          const endX = e.changedTouches[0].clientX;
          const deltaX = endX - startX;
          const deltaTime = Date.now() - startTime;
          
          // Only consider swipes that are fast enough and long enough
          if (Math.abs(deltaX) > 30 && deltaTime < 300) {
            if (deltaX > 0) {
              rotatePrev(); // Swipe right = previous
            } else {
              rotateNext(); // Swipe left = next
            }
          } else {
            rotateNext(); // Default to next on tap/slow swipe
          }
        };

        // Store handlers for cleanup
        card._touchStartHandler = handleTouchStart;
        card._touchEndHandler = handleTouchEnd;

        // Add touch event listeners
        card.addEventListener('touchstart', handleTouchStart, { passive: true });
        card.addEventListener('touchend', handleTouchEnd, { passive: true });
      });
    }

    // Initialize
    function initialize() {
      const containerWidth = container.offsetWidth;
      if (containerWidth && containerWidth > 0) {
        console.log('[CARD SWIPER] Initializing with container width:', containerWidth);
        
        // Set initial positions
        positionCards(false);
        
        // Animate cards in
        cards.forEach((card, index) => {
          gsap.from(card, {
            opacity: 0,
            scale: 0.8,
            duration: 0.6,
            delay: index * 0.1,
            ease: "back.out(1.7)",
            onComplete: () => {
              if (index === cards.length - 1) {
                setupInteractions();
                console.log('[CARD SWIPER] Simple swiper initialization complete');
              }
            }
          });
        });
      } else {
        setTimeout(initialize, 50);
      }
    }

    // Handle resize
    window.addEventListener('resize', () => {
      setTimeout(() => positionCards(false), 200);
    });

    // Start initialization
    requestAnimationFrame(() => setTimeout(initialize, 10));

    // Store methods for external access
    this.rotateNext = rotateNext;
    this.rotatePrev = rotatePrev;
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

  debugHowItWorksSection() {
    console.log('[HOW IT WORKS DEBUG] Starting section debug...');
    
    // Check if steps container exists
    const stepsContainer = document.getElementById('steps-container');
    console.log('[HOW IT WORKS DEBUG] Steps container:', stepsContainer);
    
    // Check all step rows
    const stepRows = document.querySelectorAll('.step-row');
    console.log('[HOW IT WORKS DEBUG] Found step rows:', stepRows.length);
    
    stepRows.forEach((row, index) => {
      const stepNumber = index + 1;
      const img = row.querySelector('.step-number-image');
      const card = row.querySelector('.step-card');
      const description = row.querySelector('.step-description');
      
      console.log(`[HOW IT WORKS DEBUG] Step ${stepNumber}:`, {
        row: row,
        classes: row.className,
        image: img,
        imageSrc: img?.src,
        card: card,
        description: description,
        descriptionText: description?.textContent,
        computedStyle: window.getComputedStyle(row),
        flexDirection: window.getComputedStyle(row).flexDirection
      });
    });
    
    // Check step elements by ID
    for (let i = 1; i <= 5; i++) {
      const stepElement = document.getElementById(`step-${i}`);
      console.log(`[HOW IT WORKS DEBUG] Step ${i} element:`, {
        element: stepElement,
        text: stepElement?.textContent,
        parentRow: stepElement?.closest('.step-row'),
        parentClasses: stepElement?.closest('.step-row')?.className
      });
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