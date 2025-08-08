
// Referral Status Page Logic
class ReferralStatusPage {
  constructor() {
    this.data = null;
    this.params = ReferralUtils.getUrlParams();
    this.init();
  }

  async init() {
    try {
      await this.loadPageData();
      this.renderPage();
      this.bindEvents();
    } catch (error) {
      console.error('Failed to load page:', error);
      this.showError('Failed to load progress data. Please try again.');
    }
  }

  async loadPageData() {
    // Show loading state
    const mainContent = document.getElementById('main-content');
    ReferralUtils.showLoading(mainContent);

    try {
      // Simulate API call
      this.data = await ReferralUtils.simulateApiCall('page2_referralStatus');
    } catch (error) {
      throw new Error('API call failed');
    }
  }

  renderPage() {
    this.renderHero();
    this.renderMainContent();
    this.renderFooter();
  }

  renderHero() {
    document.getElementById('hero-title').textContent = this.data.header.title;
    document.getElementById('hero-subtitle').textContent = this.data.header.subtitle;
  }

  renderMainContent() {
    const mainContent = document.getElementById('main-content');
    const currentRedemptions = this.params.current_redemptions;
    const targetRedemptions = this.params.target_redemptions;
    const progressPercentage = ReferralUtils.getProgressPercentage(currentRedemptions, targetRedemptions);
    
    mainContent.innerHTML = `
      <!-- Recent Event Banner -->
      ${this.params.show_recent_event ? `
        <div class="success-banner" role="alert" aria-live="polite">
          <div class="banner-icon">🎉</div>
          <div class="banner-content">
            <div class="banner-title">Great news!</div>
            <div class="banner-text">${this.data.notifications.recent_event_banner.text}</div>
          </div>
        </div>
      ` : ''}

      <!-- Progress Overview Card -->
      <section class="progress-overview" role="region" aria-labelledby="progress-title">
        <div class="progress-card">
          <div class="progress-header">
            <h2 id="progress-title">Your Progress</h2>
            <div class="progress-badge">${progressPercentage.toFixed(0)}% Complete</div>
          </div>
          
          <!-- Circular Progress -->
          <div class="circular-progress-container">
            <div class="circular-progress" style="--progress: ${progressPercentage}%">
              <div class="progress-inner">
                <div class="progress-number">${currentRedemptions}</div>
                <div class="progress-label">of ${targetRedemptions}</div>
              </div>
            </div>
          </div>
          
          <p class="progress-description">${this.data.status.progress_text}</p>
          
          <!-- Progress Bar Alternative -->
          <div class="linear-progress-container" role="progressbar" 
               aria-valuenow="${currentRedemptions}" 
               aria-valuemin="0" 
               aria-valuemax="${targetRedemptions}"
               aria-label="Referral progress">
            <div class="linear-progress-track">
              <div class="linear-progress-fill" style="width: ${progressPercentage}%"></div>
            </div>
            <div class="progress-markers">
              <span class="marker-start">Started</span>
              <span class="marker-end">Premium Unlocked</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Achievement Levels -->
      <section class="achievements-section" role="region" aria-labelledby="achievements-title">
        <h2 id="achievements-title">Achievement Levels</h2>
        <div class="achievements-grid">
          ${this.renderAchievementCards()}
        </div>
      </section>

      <!-- Quick Actions -->
      <section class="quick-actions">
        <div class="action-card share-card">
          <div class="action-icon">📤</div>
          <div class="action-content">
            <h3>Keep Sharing</h3>
            <p>Share your link to reach your goal faster</p>
          </div>
          <button class="action-btn" id="quick-share">Share Now</button>
        </div>
        
        <div class="action-grid">
          <button class="quick-action-btn" id="copy-link-quick">
            <div class="quick-action-icon">🔗</div>
            <span>Copy Link</span>
          </button>
          <button class="quick-action-btn" id="copy-code-quick">
            <div class="quick-action-icon">📋</div>
            <span>Copy Code</span>
          </button>
        </div>
      </section>

      <!-- Tips & Strategies -->
      <section class="tips-section" role="region" aria-labelledby="tips-title">
        <div class="tips-card">
          <div class="tips-header">
            <div class="tips-icon">💡</div>
            <h3 id="tips-title">Pro Tips to Reach Your Goal</h3>
          </div>
          <div class="tips-grid">
            ${this.data.tips.map((tip, index) => `
              <div class="tip-item">
                <div class="tip-number">${index + 1}</div>
                <div class="tip-text">${tip}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- FAQ Expandable -->
      <section class="faq-section" role="region" aria-labelledby="faq-title">
        <div class="faq-card">
          <div class="faq-header">
            <h3 id="faq-title">Frequently Asked Questions</h3>
          </div>
          <div class="faq-list">
            ${this.data.faq.map((item, index) => `
              <div class="faq-item" data-index="${index}">
                <button class="faq-question" aria-expanded="false">
                  <span>${item.q}</span>
                  <div class="faq-toggle">+</div>
                </button>
                <div class="faq-answer">
                  <p>${item.a}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Privacy & Security -->
      <div class="privacy-card">
        <div class="privacy-icon">🔒</div>
        <div class="privacy-content">
          <h4>Privacy Protected</h4>
          <p>${this.data.privacy_note}</p>
        </div>
      </div>
    `;

    // Initialize FAQ toggles
    this.initializeFAQ();
  }

  renderAchievementCards() {
    const currentRedemptions = this.params.current_redemptions;
    
    return this.data.milestones.map((milestone, index) => {
      let cardClass = 'achievement-card';
      let iconClass = 'achievement-icon';
      let icon = milestone.level;
      
      if (currentRedemptions >= milestone.threshold) {
        cardClass += ' completed';
        iconClass += ' completed';
        icon = '✓';
      } else if (currentRedemptions === milestone.threshold - 1) {
        cardClass += ' next';
        iconClass += ' next';
      }
      
      return `
        <div class="${cardClass}" role="article">
          <div class="${iconClass}">${icon}</div>
          <div class="achievement-details">
            <div class="achievement-title">${milestone.title}</div>
            <div class="achievement-message">${milestone.message}</div>
            <div class="achievement-progress">
              ${currentRedemptions >= milestone.threshold ? 'Completed!' : 
                currentRedemptions === milestone.threshold - 1 ? 'Almost there!' : 
                `${milestone.threshold - currentRedemptions} more to go`}
            </div>
          </div>
          ${currentRedemptions >= milestone.threshold ? 
            '<div class="achievement-badge">✨</div>' : ''}
        </div>
      `;
    }).join('');
  }

  renderFooter() {
    document.getElementById('share-again').textContent = this.data.actions.share_cta;
    document.getElementById('share-again').disabled = false;

    document.getElementById('copy-link').textContent = this.data.actions.copy_link_cta;
    document.getElementById('copy-link').disabled = false;

    document.getElementById('copy-code').textContent = this.data.actions.copy_code_cta;
    document.getElementById('copy-code').disabled = false;
  }

  initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
      const question = item.querySelector('.faq-question');
      const answer = item.querySelector('.faq-answer');
      const toggle = item.querySelector('.faq-toggle');
      
      question.addEventListener('click', () => {
        const isExpanded = question.getAttribute('aria-expanded') === 'true';
        
        // Close all other FAQ items
        faqItems.forEach(otherItem => {
          if (otherItem !== item) {
            const otherQuestion = otherItem.querySelector('.faq-question');
            const otherAnswer = otherItem.querySelector('.faq-answer');
            const otherToggle = otherItem.querySelector('.faq-toggle');
            
            otherQuestion.setAttribute('aria-expanded', 'false');
            otherAnswer.style.maxHeight = '0';
            otherToggle.textContent = '+';
          }
        });
        
        // Toggle current item
        if (!isExpanded) {
          question.setAttribute('aria-expanded', 'true');
          answer.style.maxHeight = answer.scrollHeight + 'px';
          toggle.textContent = '−';
        } else {
          question.setAttribute('aria-expanded', 'false');
          answer.style.maxHeight = '0';
          toggle.textContent = '+';
        }
      });
    });
  }

  bindEvents() {
    // Share again button
    document.getElementById('share-again').addEventListener('click', () => {
      this.handleShareAgain();
    });

    // Copy link button
    document.getElementById('copy-link').addEventListener('click', () => {
      this.handleCopyLink();
    });

    // Copy code button
    document.getElementById('copy-code').addEventListener('click', () => {
      this.handleCopyCode();
    });

    // Quick action buttons
    document.getElementById('quick-share').addEventListener('click', () => {
      this.handleShareAgain();
    });

    document.getElementById('copy-link-quick').addEventListener('click', () => {
      this.handleCopyLink();
    });

    document.getElementById('copy-code-quick').addEventListener('click', () => {
      this.handleCopyCode();
    });

    // Keyboard navigation
    this.setupKeyboardNavigation();
  }

  handleShareAgain() {
    // Navigate back to promote page
    ReferralUtils.navigateWithParams('referralPromote.html');
  }

  async handleCopyLink() {
    const success = await ReferralUtils.copyToClipboard(
      this.params.referral_link,
      'Invite link copied!'
    );
    
    if (success) {
      // Add visual feedback to all copy link buttons
      const buttons = document.querySelectorAll('#copy-link, #copy-link-quick');
      this.addButtonFeedback(buttons, '🔗 Copied!');
    }
  }

  async handleCopyCode() {
    const success = await ReferralUtils.copyToClipboard(
      this.params.referral_code,
      'Referral code copied!'
    );
    
    if (success) {
      // Add visual feedback to all copy code buttons
      const buttons = document.querySelectorAll('#copy-code, #copy-code-quick');
      this.addButtonFeedback(buttons, '📋 Copied!');
    }
  }

  addButtonFeedback(buttons, text) {
    buttons.forEach(button => {
      const originalText = button.textContent;
      const originalBg = button.style.background;
      
      button.textContent = text;
      button.style.background = '#38a169';
      button.style.color = 'white';
      
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = originalBg;
        button.style.color = '';
      }, 2000);
    });
  }

  setupKeyboardNavigation() {
    // Add keyboard support for interactive elements
    const buttons = document.querySelectorAll('.btn, .action-btn, .quick-action-btn');
    buttons.forEach(button => {
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        }
      });
    });

    // Add keyboard navigation for achievement cards
    const achievementCards = document.querySelectorAll('.achievement-card');
    achievementCards.forEach((card, index) => {
      card.setAttribute('tabindex', '0');
      card.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' && index < achievementCards.length - 1) {
          achievementCards[index + 1].focus();
        } else if (e.key === 'ArrowUp' && index > 0) {
          achievementCards[index - 1].focus();
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
  new ReferralStatusPage();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    console.log('Page visible again');
  }
});
