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
    const hero = pageData.hero || {};
    const status = pageData.status || {};
    const milestones = pageData.milestones || [];
    const faqs = pageData.faq || pageData.faqs || [];
    const progress = pageData.progress_teaser || pageData.progress || {};
    const benefits = pageData.benefits || [];
    const tips = pageData.nudges || pageData.tips || [];

    // Populate header
    document.getElementById('header-title').textContent = hero.page_title || pageData.page_title || 'My Referrals';

    // Populate hero section with level information
    const currentLevel = status.current || pageData.current_redemptions || 1;
    const targetLevel = status.target || pageData.target_redemptions || 5;
    const currentMilestone = milestones.find(m => m.level === currentLevel) || milestones[0];

    if (currentMilestone) {
      document.getElementById('level-title').textContent = `Level ${currentLevel}`;
      document.getElementById('level-subtitle').textContent = currentMilestone.title || 'Progress';
      const capitalizedName = ReferralUtils.capitalizeName(this.params.firstname);
      document.getElementById('level-message').textContent = currentMilestone.message || `Great work, ${capitalizedName}! Keep going.`;
    }

    document.getElementById('progress-display').textContent = `${currentLevel} of ${targetLevel} Completed`;

    // Populate milestones
    if (milestones.length > 0) {
      milestones.forEach((milestone, index) => {
        const milestoneElement = document.getElementById(`milestone-${index + 1}`);
        if (milestoneElement) {
          const iconElement = milestoneElement.querySelector('.milestone-icon');
          const contentElement = milestoneElement.querySelector('.milestone-content');
          
          if (milestone.level <= currentLevel) {
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
              statusElement.textContent = milestone.level <= currentLevel ? 
                (milestone.achievedOn ? `Achieved on ${milestone.achievedOn}` : 'Achieved') : 'Not Yet';
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
    const remaining = targetLevel - currentLevel;
    document.getElementById('progress-title').textContent = progress.title || `Only ${remaining} more levels to go!`;
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
    const cards = document.querySelectorAll('.benefit-card');
    if (cards.length === 0) return;

    this.positionCards(cards);
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
    let isDragging = false;

    container.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    }, { passive: true });

    container.addEventListener('touchend', (e) => {
      if (!isDragging) return;
      
      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - startX;

      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          this.rotateCards('prev');
        } else {
          this.rotateCards('next');
        }
      }
      
      isDragging = false;
    }, { passive: true });

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