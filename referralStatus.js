// Referral Status Page Logic
class ReferralStatusPage {
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
      // Try API first, then fall back to local data
      try {
        const endpoint = `/api/referral-status?lang=${this.params.language}`;
        const body = {
          app_package_name: this.params.app_package_name,
          username: this.params.firstname,
          user_id: this.params.userId
        };

        console.log('Making API call to:', endpoint);
        console.log('Request body:', body);
        
        this.data = await ReferralUtils.makeApiCall(endpoint, 'POST', body);
        console.log('Loaded API data:', this.data);
      } catch (apiError) {
        console.warn('API call failed, using fallback data:', apiError);
        // Fallback to local mock data
        this.data = this.getMockData();
      }
    } catch (error) {
      console.error('All data loading failed:', error);
      this.data = this.getMockData();
    }
  }

  getMockData() {
    return {
      data: {
        page_title: 'My Referrals',
        hero: {
          page_title: 'My Referrals'
        },
        status: {
          current: 1,
          target: 5
        },
        milestones: [
          { 
            level: 1, 
            title: 'The Kickoff', 
            message: `Your first referral is in! Great work, ${ReferralUtils.capitalizeName(this.params.firstname)}! You've started your Premium journey.`,
            achievedOn: '9 August'
          },
          { level: 2, title: 'Building Momentum', message: 'Two friends on board! You\'re warming up nicely.' },
          { level: 3, title: 'Halfway Hero', message: 'Three redemptions—more than halfway to your goal!' },
          { level: 4, title: 'Almost There', message: 'Four done! Just one more to unlock Premium.' },
          { level: 5, title: 'Premium Unlocked 🎉', message: 'Congratulations! You\'ve completed your referral goal and earned 1 month of Premium.' }
        ],
        faq: [
          { a: 'No—only totals. We don\'t store redeemer identities.' },
          { a: 'Instantly after 5 redemptions. You\'ll get an in-app confirmation.' }
        ],
        progress_teaser: {
          title: 'Only 4 more levels to go!',
          subtitle: 'Each redemption brings you closer to Premium!'
        },
        benefits: [
          { title: 'Premium Access', desc: 'Ad-free experience, pro features, and priority support for 1 month.' },
          { title: 'Win Together', desc: 'Your friends get an exclusive newcomer perk when they join via your link.' },
          { title: 'Fast & Simple', desc: 'Share your link; they download and redeem. You progress instantly.' }
        ],
        tips: [
          { text: 'Remind friends it takes less than a minute to redeem.' }
        ]
      }
    };
  }

  populateContent() {
    if (!this.data) {
      console.error('No data available for rendering');
      return;
    }

    // Extract data from API response structure
    const pageData = this.data.data || this.data;
    const referralStatusData = pageData.page2_referralStatus || {};
    const hero = referralStatusData.hero || {};
    const status = referralStatusData.status || {};
    const milestones = referralStatusData.milestones || [];
    const faqs = referralStatusData.faq || pageData.faqs || [];
    const progress = referralStatusData.progress_teaser || pageData.progress || {};
    const benefits = referralStatusData.benefits || [];
    const tips = referralStatusData.nudges || pageData.tips || [];

    // Populate header
    document.getElementById('header-title').textContent = hero.page_title || 'My Referrals';

    // Get current redemptions from the API
    const currentRedemptions = pageData.current_redemptions || 0;
    const targetLevel = pageData.target_redemptions || 5;
    
    // Find the milestone that matches current redemptions
    const currentMilestone = milestones.find(m => m.level === currentRedemptions) || milestones[0];

    if (currentMilestone) {
      // For level 0, don't show "Level 0", just show the title
      if (currentRedemptions === 0) {
        document.getElementById('level-title').textContent = currentMilestone.title || 'Let\'s Start';
      } else {
        document.getElementById('level-title').textContent = `Level ${currentRedemptions}`;
      }
      document.getElementById('level-subtitle').textContent = currentMilestone.title || 'Progress';
      const capitalizedName = ReferralUtils.capitalizeName(this.params.firstname);
      document.getElementById('level-message').textContent = currentMilestone.message || `Great work, ${capitalizedName}! Keep going.`;
    }

    document.getElementById('progress-display').textContent = `${currentRedemptions} of ${targetLevel} Completed`;

    // Populate milestones - filter out level 0 for the progress section
    const progressMilestones = milestones.filter(m => m.level > 0);
    if (progressMilestones.length > 0) {
      progressMilestones.forEach((milestone, index) => {
        const milestoneElement = document.getElementById(`milestone-${index + 1}`);
        if (milestoneElement) {
          const iconElement = milestoneElement.querySelector('.milestone-icon');
          const contentElement = milestoneElement.querySelector('.milestone-content');
          
          // Check if this level is completed based on current_redemptions
          if (milestone.level <= currentRedemptions) {
            milestoneElement.classList.add('completed');
            if (iconElement) iconElement.textContent = '✓';
          } else {
            milestoneElement.classList.remove('completed');
            if (iconElement) iconElement.textContent = milestone.level;
          }
          
          if (contentElement) {
            const titleElement = contentElement.querySelector('h3');
            const statusElement = contentElement.querySelector('p');
            if (titleElement) titleElement.textContent = `Level ${milestone.level} - ${milestone.title}`;
            if (statusElement) {
              if (milestone.level <= currentRedemptions) {
                // Show achievedOn if available and not "Pending"
                const achievedText = milestone.achievedOn && milestone.achievedOn !== "Pending" ? 
                  milestone.achievedOn : 'Achieved';
                statusElement.textContent = achievedText;
              } else {
                statusElement.textContent = 'Not Level';
              }
            }
          }
        }
      });
    }

    // Populate FAQs
    if (faqs.length > 0) {
      faqs.forEach((faq, index) => {
        const faqElement = document.getElementById(`faq-${index + 1}`);
        if (faqElement) {
          faqElement.textContent = faq.a || faq.answer;
        }
      });
    }

    // Populate progress section
    const remaining = targetLevel - currentRedemptions;
    let progressTitle = progress.title || `Only ${remaining} more levels to go!`;
    // Replace template variables
    progressTitle = progressTitle.replace(/\{\{pending_redemptions\}\}/g, remaining);
    document.getElementById('progress-title').textContent = progressTitle;
    document.getElementById('progress-subtitle').textContent = progress.subtitle || 'Each redemption brings you closer to Premium!';

    // Populate benefits cards
    if (benefits.length > 0) {
      benefits.forEach((benefit, index) => {
        const titleElement = document.getElementById(`benefit-${index + 1}-title`);
        const descElement = document.getElementById(`benefit-${index + 1}-desc`);
        if (titleElement) titleElement.textContent = benefit.title;
        if (descElement) descElement.textContent = benefit.desc || benefit.description;
      });
    }

    // Populate tip
    if (tips.length > 0) {
      document.getElementById('tip-text').textContent = tips[0].text || tips[0];
    }

    // Update footer CTA
    document.getElementById('primary-cta').textContent = 'Invite Friends & Family';
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

    // Apply dynamic colors to cards and adjust heights
    this.applyCardColors();
    this.adjustCardHeights();

    // Initialize the new card swiper system
    this.initReferralCardSwiper(container);
  }

  applyCardColors() {
    const cards = document.querySelectorAll('.benefit-card');
    const usedColorIndices = new Set();

    cards.forEach((cardElement, index) => {
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
        const titleElement = cardElement.querySelector('.benefit-card-title');
        const descElement = cardElement.querySelector('.benefit-card-desc');
        if (titleElement) titleElement.style.color = textColor;
        if (descElement) descElement.style.color = textColor;
      }
    });
  }

  adjustCardHeights() {
    // Wait for next frame to ensure content is rendered
    requestAnimationFrame(() => {
      const cards = document.querySelectorAll('.benefit-card');
      if (cards.length === 0) return;

      // First, adjust font sizes for titles that are too long
      cards.forEach(card => {
        this.adjustCardTitleFontSize(card);
      });

      // Remove text truncation temporarily to measure natural content height
      cards.forEach(card => {
        const descElement = card.querySelector('.benefit-card-desc');
        if (descElement) {
          descElement.style.webkitLineClamp = 'unset';
          descElement.style.display = 'block';
          descElement.style.overflow = 'visible';
        }
        card.style.height = 'auto';
      });

      // Find the tallest card with full content
      let maxHeight = 0;
      cards.forEach(card => {
        const cardHeight = card.scrollHeight;
        if (cardHeight > maxHeight) {
          maxHeight = cardHeight;
        }
      });

      // Ensure minimum height for visual consistency
      const minHeight = 200;
      maxHeight = Math.max(maxHeight, minHeight);

      // Apply the max height to all cards and restore proper text display
      cards.forEach(card => {
        card.style.height = `${maxHeight}px`;
        const descElement = card.querySelector('.benefit-card-desc');
        if (descElement) {
          // Remove the line clamp restriction since we now have enough space
          descElement.style.webkitLineClamp = 'unset';
          descElement.style.display = 'block';
          descElement.style.overflow = 'visible';
        }
      });
    });
  }

  adjustCardTitleFontSize(card) {
    const titleElement = card.querySelector('.benefit-card-title');
    if (!titleElement) return;

    // Reset to initial font size first
    titleElement.style.fontSize = '';
    
    const maxWidth = card.offsetWidth - 40; // Account for padding (20px each side)
    const maxHeight = 60; // Maximum height for title area
    
    // Start with the default font size from CSS (1.5rem = 24px)
    let fontSize = 24;
    const minFontSize = 18; // Minimum readable size
    
    titleElement.style.fontSize = fontSize + 'px';
    
    // Check if title overflows and reduce font size if needed
    while ((titleElement.scrollWidth > maxWidth || titleElement.scrollHeight > maxHeight) && fontSize > minFontSize) {
      fontSize -= 1;
      titleElement.style.fontSize = fontSize + 'px';
    }
    
    // If still overflowing at minimum size, try line clamping
    if (titleElement.scrollHeight > maxHeight && fontSize === minFontSize) {
      titleElement.style.display = '-webkit-box';
      titleElement.style.webkitLineClamp = '2';
      titleElement.style.webkitBoxOrient = 'vertical';
      titleElement.style.overflow = 'hidden';
      titleElement.style.lineHeight = '1.2';
    }
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

    // Next/previous functions
    function nextCard() {
      if (isAnimating) return;
      isAnimating = true;
      currentIndex = (currentIndex + 1) % cards.length;
      positionCards(true);
      setTimeout(() => { isAnimating = false; }, 400);
    }

    function prevCard() {
      if (isAnimating) return;
      isAnimating = true;
      currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      positionCards(true);
      setTimeout(() => { isAnimating = false; }, 400);
    }

    // Click handlers for side cards
    cards.forEach((card, index) => {
      card.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const relativeIndex = (index - currentIndex + cards.length) % cards.length;
        if (relativeIndex === 1) {
          nextCard();
        } else if (relativeIndex === cards.length - 1) {
          prevCard();
        }
      });
    });

    // Touch/swipe support for container
    let startX = 0;
    let isDragging = false;
    let dragCard = null;

    container.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
      dragCard = cards[currentIndex];
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (!isDragging || !dragCard) return;
      
      const currentX = e.touches[0].clientX;
      const deltaX = currentX - startX;
      const maxDrag = 50;
      const clampedDelta = Math.max(-maxDrag, Math.min(maxDrag, deltaX));
      
      if (dragCard) {
        const positions = calculatePositions();
        if (positions) {
          gsap.set(dragCard, {
            x: positions.center.x + clampedDelta,
            rotation: clampedDelta * 0.3
          });
        }
      }
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      isDragging = false;
      
      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - startX;
      const threshold = 50;

      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
          prevCard();
        } else {
          nextCard();
        }
      } else {
        // Return card to center position
        positionCards(true);
      }
      
      dragCard = null;
      isDragging = false;
    }, { passive: true });

    // Initial positioning
    const waitForInitialPosition = () => {
      const containerWidth = container.offsetWidth;
      if (containerWidth && containerWidth > 0) {
        positionCards(false);
      } else {
        setTimeout(waitForInitialPosition, 50);
      }
    };
    
    requestAnimationFrame(() => setTimeout(waitForInitialPosition, 10));
  }

  bindEvents() {
    // Back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.history.back();
      });
    }

    // Invite friends button
    const inviteBtn = document.getElementById('invite-friends');
    if (inviteBtn) {
      inviteBtn.addEventListener('click', () => {
        window.location.href = `referralPromote.html?${new URLSearchParams(this.params).toString()}`;
      });
    }

    // Primary CTA button
    const primaryCta = document.getElementById('primary-cta');
    if (primaryCta) {
      primaryCta.addEventListener('click', () => {
        window.location.href = `referralPromote.html?${new URLSearchParams(this.params).toString()}`;
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
  new ReferralStatusPage();
});