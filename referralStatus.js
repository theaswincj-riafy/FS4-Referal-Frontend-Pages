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
        <div class="notification-banner" role="alert" aria-live="polite">
          ${this.data.notifications.recent_event_banner.text}
        </div>
      ` : ''}

      <!-- Progress Overview -->
      <section class="progress-section" role="region" aria-labelledby="progress-title">
        <div class="card">
          <h2 id="progress-title">Your Progress</h2>
          
          <div class="progress-bar-container" role="progressbar" 
               aria-valuenow="${currentRedemptions}" 
               aria-valuemin="0" 
               aria-valuemax="${targetRedemptions}"
               aria-label="Referral progress">
            <div class="progress-bar" style="width: ${progressPercentage}%"></div>
          </div>
          
          <p class="progress-text">${this.data.status.progress_text}</p>
          
          <div style="display: flex; justify-content: space-between; margin-top: 1rem; font-size: 0.875rem; color: #718096;">
            <span>Started</span>
            <span><strong>${progressPercentage.toFixed(0)}%</strong> Complete</span>
            <span>Premium Unlocked</span>
          </div>
        </div>
      </section>

      <!-- Level Milestones -->
      <section class="levels-section" role="region" aria-labelledby="levels-title">
        <h2 id="levels-title">Level Milestones</h2>
        <div class="levels">
          ${this.renderLevelCards()}
        </div>
      </section>

      <!-- Tips Section -->
      <section class="tips-section" role="region" aria-labelledby="tips-title">
        <div class="card">
          <h3 id="tips-title">Keep the momentum going</h3>
          <ul class="bullet-list">
            ${this.data.tips.map(tip => `
              <li>${tip}</li>
            `).join('')}
          </ul>
        </div>
      </section>

      <!-- FAQ Section -->
      <section class="faq-section" role="region" aria-labelledby="faq-title">
        <div class="card">
          <h3 id="faq-title">Frequently Asked</h3>
          <div class="faq">
            ${this.data.faq.map(item => `
              <div class="faq-item">
                <div class="faq-question">${item.q}</div>
                <div class="faq-answer">${item.a}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Privacy Note -->
      <div class="privacy-note" role="note">
        ${this.data.privacy_note}
      </div>
    `;
  }

  renderLevelCards() {
    const currentRedemptions = this.params.current_redemptions;
    
    return this.data.milestones.map(milestone => {
      let cardClass = 'level-card';
      let icon = milestone.level;
      
      if (currentRedemptions >= milestone.threshold) {
        cardClass += ' reached';
        icon = '✓';
      } else if (currentRedemptions === milestone.threshold - 1) {
        cardClass += ' current';
      }
      
      return `
        <div class="${cardClass}" role="article">
          <div class="level-icon" aria-hidden="true">${icon}</div>
          <div class="level-details">
            <div class="level-title">${milestone.title}</div>
            <div class="level-message">${milestone.message}</div>
          </div>
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
      // Add visual feedback
      const button = document.getElementById('copy-link');
      const originalBg = button.style.background;
      const originalColor = button.style.color;
      
      button.style.background = '#38a169';
      button.style.color = 'white';
      
      setTimeout(() => {
        button.style.background = originalBg;
        button.style.color = originalColor;
      }, 1000);
    }
  }

  async handleCopyCode() {
    const success = await ReferralUtils.copyToClipboard(
      this.params.referral_code,
      'Referral code copied!'
    );
    
    if (success) {
      // Add visual feedback
      const button = document.getElementById('copy-code');
      const originalBg = button.style.background;
      const originalColor = button.style.color;
      
      button.style.background = '#38a169';
      button.style.color = 'white';
      
      setTimeout(() => {
        button.style.background = originalBg;
        button.style.color = originalColor;
      }, 1000);
    }
  }

  setupKeyboardNavigation() {
    // Add keyboard support for interactive elements
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        }
      });
    });

    // Add keyboard navigation for level cards
    const levelCards = document.querySelectorAll('.level-card');
    levelCards.forEach((card, index) => {
      card.setAttribute('tabindex', '0');
      card.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' && index < levelCards.length - 1) {
          levelCards[index + 1].focus();
        } else if (e.key === 'ArrowUp' && index > 0) {
          levelCards[index - 1].focus();
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
    // Page became visible - could refresh progress data here
    console.log('Status page visible again - could update progress');
  }
});
