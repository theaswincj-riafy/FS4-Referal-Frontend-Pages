// Referral Redeem Page Logic
class ReferralRedeemPage {
  constructor() {
    this.data = null;
    this.params = ReferralUtils.getUrlParams();
    this.init();
  }

  async init() {
    try {
      await this.loadPageData();
      if (this.data) {
        this.populateContent();
        this.hideLoader();
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
      const endpoint = `/api/referral-redeem?lang=${this.params.language}`;
      const body = {
        app_package_name: this.params.app_package_name,
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

    // Extract data from API response structure
    const pageData = this.data.data || this.data;
    const hero = pageData.hero || {};
    const steps = pageData.how_it_works || pageData.steps || [];

    // Populate header
    document.getElementById('header-title').textContent = hero.page_title || pageData.page_title || 'Redeem Referral Code';

    // Populate hero section
    document.getElementById('hero-title').textContent = hero.hero_title || hero.title || 'Redeem Referral Invite Code';
    document.getElementById('hero-subtitle').textContent = hero.subtitle || 'Enter or paste the invite from your friend to continue.';

    // Populate how it works steps
    if (steps.length > 0) {
      steps.forEach((step, index) => {
        const stepElement = document.getElementById(`step-${index + 1}`);
        if (stepElement) {
          stepElement.textContent = step.desc || step.description || step.text;
        }
      });
    } else {
      // Default steps if API doesn't provide them
      const defaultSteps = [
        'Copy the referral invitation sent by your friends or family',
        'Paste the referral invitation using the button above',
        'If the code is valid, you\'ll unlock a week of Premium'
      ];
      
      defaultSteps.forEach((stepText, index) => {
        const stepElement = document.getElementById(`step-${index + 1}`);
        if (stepElement) {
          stepElement.textContent = stepText;
        }
      });
    }

    // Update footer CTA
    document.getElementById('primary-cta').textContent = 'Redeem Code';
  }

  hideLoader() {
    const loader = document.getElementById('page-loader');
    const content = document.getElementById('page-content-wrapper');
    
    if (loader) loader.style.display = 'none';
    if (content) content.style.display = 'block';
  }

  bindEvents() {
    // Back button
    const backBtn = document.getElementById('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        window.history.back();
      });
    }

    // Paste from clipboard button
    const pasteBtn = document.getElementById('paste-btn');
    if (pasteBtn) {
      pasteBtn.addEventListener('click', () => {
        this.pasteFromClipboard();
      });
    }

    // Redeem code button
    const redeemBtn = document.getElementById('primary-cta');
    if (redeemBtn) {
      redeemBtn.addEventListener('click', () => {
        this.redeemCode();
      });
    }

    // Input field events
    const input = document.getElementById('redeem-input');
    if (input) {
      input.addEventListener('input', () => {
        this.validateInput();
      });
      
      input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.redeemCode();
        }
      });
    }
  }

  async pasteFromClipboard() {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        const input = document.getElementById('redeem-input');
        if (input) {
          input.value = text.trim();
          this.validateInput();
          ReferralUtils.showToast('Code pasted successfully!');
        }
      } else {
        ReferralUtils.showToast('Clipboard access not available. Please paste manually.');
      }
    } catch (err) {
      console.error('Failed to read clipboard: ', err);
      ReferralUtils.showToast('Failed to paste from clipboard. Please paste manually.');
    }
  }

  validateInput() {
    const input = document.getElementById('redeem-input');
    const redeemBtn = document.getElementById('primary-cta');
    
    if (input && redeemBtn) {
      const hasValue = input.value.trim().length > 0;
      redeemBtn.disabled = !hasValue;
      redeemBtn.style.opacity = hasValue ? '1' : '0.5';
    }
  }

  async redeemCode() {
    const input = document.getElementById('redeem-input');
    const redeemBtn = document.getElementById('primary-cta');
    
    if (!input || !input.value.trim()) {
      ReferralUtils.showToast('Please enter a referral code');
      return;
    }

    const code = input.value.trim();
    
    // Disable button during processing
    if (redeemBtn) {
      redeemBtn.disabled = true;
      redeemBtn.textContent = 'Redeeming...';
    }

    try {
      // Call the redeem API
      const endpoint = `/api/referral-redeem?lang=${this.params.language}`;
      const body = {
        app_package_name: this.params.app_package_name,
        user_id: this.params.userId,
        referral_code: code
      };

      const result = await ReferralUtils.makeApiCall(endpoint, 'POST', body);
      
      if (result.success || result.status === 'success') {
        this.showSuccess(result.message || 'Referral code redeemed successfully!');
      } else {
        throw new Error(result.message || 'Failed to redeem code');
      }
    } catch (error) {
      console.error('Redeem error:', error);
      ReferralUtils.showToast(error.message || 'Failed to redeem code. Please try again.');
    } finally {
      // Re-enable button
      if (redeemBtn) {
        redeemBtn.disabled = false;
        redeemBtn.textContent = 'Redeem Code';
      }
    }
  }

  showSuccess(message) {
    // Create success overlay
    const overlay = document.createElement('div');
    overlay.className = 'success-overlay';
    overlay.innerHTML = `
      <div class="success-content">
        <div class="success-icon">🎉</div>
        <h2>Success!</h2>
        <p>${message}</p>
        <button class="btn btn-primary" onclick="this.parentElement.parentElement.remove()">Continue</button>
      </div>
    `;
    
    // Add styles
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;
    
    document.body.appendChild(overlay);
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
  new ReferralRedeemPage();
});