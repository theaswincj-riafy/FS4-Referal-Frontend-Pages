// Referral Redeem Page Logic
class ReferralRedeemPage {
  constructor() {
    this.data = null;
    this.params = ReferralUtils.getUrlParams();
    this.isRedeemed = false;
    this.init();
  }

  async init() {
    try {
      await this.loadPageData();
      if (this.data) {
        this.renderPage();
        this.bindEvents();
        this.prefillCode();
      } else {
        throw new Error('No data loaded');
      }
    } catch (error) {
      console.error('Failed to load page:', error);
      this.showError('Failed to load redemption form. Please try again.');
    }
  }

  async loadPageData() {
    // Show loading state
    const mainContent = document.getElementById('main-content');
    ReferralUtils.showLoading(mainContent);

    try {
      // Simulate API call
      this.data = await ReferralUtils.simulateApiCall('page4_referralRedeem');
      console.log('Loaded data:', this.data); // Debug log
    } catch (error) {
      console.error('API call error:', error);
      this.data = null;
      throw new Error('API call failed');
    }
  }

  renderPage() {
    this.renderHero();
    this.renderMainContent();
    this.renderFooter();
  }

  renderHero() {
    document.getElementById('hero-title').textContent = this.data.hero.title;
    document.getElementById('hero-subtitle').textContent = this.data.hero.subtitle;
  }

  renderMainContent() {
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
      <!-- Redemption Form -->
      <section class="redeem-form-section" role="region" aria-labelledby="redeem-form-title">
        <div class="card">
          <form id="redeem-form" novalidate>
            <div class="form-group">
              <label for="invite-code" class="form-label">${this.data.form.label}</label>
              <input 
                type="text" 
                id="invite-code" 
                class="form-input" 
                placeholder="${this.data.form.placeholder}"
                aria-describedby="code-error code-help"
                autocomplete="off"
                spellcheck="false"
                maxlength="12"
              >
              <div id="code-error" class="form-error" role="alert" aria-live="polite"></div>
              <div id="code-help" class="sr-only">Enter the invite code you received to redeem your offer</div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="btn btn-primary" id="redeem-btn">
                <span>🎯</span> ${this.data.form.primary_cta}
              </button>
              
              <button type="button" class="btn btn-secondary" id="paste-btn">
                <span>📋</span> ${this.data.form.secondary_cta}
              </button>
            </div>
          </form>
        </div>
      </section>

      <!-- Success State (Hidden Initially) -->
      <section class="success-section" id="success-section" style="display: none;" role="region" aria-labelledby="success-title">
        <div class="success-state">
          <img src="https://pixabay.com/get/g204e11ae4ddf8cfa0f5b73f88bfdde74e10843e4266a21ea64e44f767f4de528b56b01869fb7feff0283ec9d33fcc6c255f1780eb060730efff3959fe1dc2146_1280.jpg" alt="Success confirmation with celebration" class="success-image">
          <h2 class="success-title" id="success-title">${this.data.post_redeem.title}</h2>
          <p class="success-desc" id="success-desc">${this.data.post_redeem.desc}</p>
          
          <div class="privacy-note" style="margin-top: 2rem;">
            ${this.data.privacy_note}
          </div>
        </div>
      </section>

      <!-- Help Section -->
      <section class="help-section" role="region" aria-labelledby="help-title">
        <div class="card">
          <h3 id="help-title">${this.data.help.link_text}</h3>
          <ul class="bullet-list">
            ${this.data.help.items.map(item => `
              <li>${item}</li>
            `).join('')}
          </ul>
        </div>
      </section>
    `;
  }

  renderFooter() {
    const footerContent = document.getElementById('footer-content');
    footerContent.innerHTML = `
      <div class="privacy-note">
        ${this.data.privacy_note}
      </div>
    `;
  }

  bindEvents() {
    // Form submission
    document.getElementById('redeem-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRedemption();
    });

    // Paste button
    document.getElementById('paste-btn').addEventListener('click', () => {
      this.handlePasteFromClipboard();
    });

    // Input field events
    const codeInput = document.getElementById('invite-code');
    
    // Real-time validation
    codeInput.addEventListener('input', (e) => {
      this.handleInputChange(e.target.value);
    });

    // Clear error on focus
    codeInput.addEventListener('focus', () => {
      this.clearError();
    });

    // Auto-uppercase and format
    codeInput.addEventListener('input', (e) => {
      let value = e.target.value.toUpperCase();
      // Remove any non-alphanumeric characters
      value = value.replace(/[^A-Z0-9]/g, '');
      e.target.value = value;
    });

    // Keyboard navigation
    this.setupKeyboardNavigation();
  }

  prefillCode() {
    // Prefill with referral code if provided
    if (this.params.referral_code && this.params.referral_code !== 'WELCOME123') {
      document.getElementById('invite-code').value = this.params.referral_code;
      this.validateInput(this.params.referral_code);
    }
  }

  handleInputChange(value) {
    // Clear previous errors
    this.clearError();
    
    // Validate as user types (but don't show errors until they attempt to submit)
    if (value.length > 0) {
      this.validateInput(value, false); // false = don't show errors yet
    }
  }

  validateInput(value, showErrors = true) {
    const validation = ReferralUtils.validateReferralCode(value);
    
    if (!validation.valid && showErrors) {
      this.showFieldError(this.data.validation[validation.error]);
      return false;
    }
    
    return validation.valid;
  }

  async handleRedemption() {
    const codeInput = document.getElementById('invite-code');
    const code = codeInput.value.trim();
    
    // Validate input
    if (!this.validateInput(code)) {
      codeInput.focus();
      return;
    }
    
    // Disable form during processing
    this.setFormLoading(true);
    
    try {
      // Simulate API call for redemption
      await this.simulateRedemption(code);
      this.showSuccess();
    } catch (error) {
      this.showFieldError(error.message);
      this.setFormLoading(false);
    }
  }

  async simulateRedemption(code) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simple validation logic for demo
    if (code === 'EXPIRED123') {
      throw new Error(this.data.validation.expired);
    } else if (code.length < 4) {
      throw new Error(this.data.validation.invalid);
    }
    
    // Success case
    return { success: true };
  }

  async handlePasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      const cleanText = text.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      if (cleanText) {
        document.getElementById('invite-code').value = cleanText;
        this.validateInput(cleanText, false);
        ReferralUtils.showToast('Code pasted successfully!');
      } else {
        ReferralUtils.showToast('No valid code found in clipboard', 'error');
      }
    } catch (err) {
      // Fallback for browsers without clipboard API
      ReferralUtils.showToast('Paste manually or use Ctrl+V', 'error');
    }
  }

  showSuccess() {
    // Hide form
    document.querySelector('.redeem-form-section').style.display = 'none';
    document.querySelector('.help-section').style.display = 'none';
    
    // Show success state
    document.getElementById('success-section').style.display = 'block';
    document.getElementById('success-section').scrollIntoView({ behavior: 'smooth' });
    
    // Update page state
    this.isRedeemed = true;
    
    // Show success toast
    ReferralUtils.showToast(this.data.validation.success);
    
    // Focus management for screen readers
    document.getElementById('success-title').focus();
  }

  showFieldError(message) {
    const errorElement = document.getElementById('code-error');
    const inputElement = document.getElementById('invite-code');
    
    errorElement.textContent = message;
    inputElement.classList.add('error');
    inputElement.setAttribute('aria-invalid', 'true');
    
    // Focus the input field
    inputElement.focus();
  }

  clearError() {
    const errorElement = document.getElementById('code-error');
    const inputElement = document.getElementById('invite-code');
    
    errorElement.textContent = '';
    inputElement.classList.remove('error');
    inputElement.removeAttribute('aria-invalid');
  }

  setFormLoading(isLoading) {
    const redeemBtn = document.getElementById('redeem-btn');
    const pasteBtn = document.getElementById('paste-btn');
    const codeInput = document.getElementById('invite-code');
    
    redeemBtn.disabled = isLoading;
    pasteBtn.disabled = isLoading;
    codeInput.disabled = isLoading;
    
    if (isLoading) {
      redeemBtn.innerHTML = `
        <div class="spinner" style="width: 20px; height: 20px; margin-right: 8px;"></div>
        Processing...
      `;
    } else {
      redeemBtn.innerHTML = `<span>🎯</span> ${this.data.form.primary_cta}`;
    }
  }

  setupKeyboardNavigation() {
    // Form keyboard handling
    document.getElementById('invite-code').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleRedemption();
      }
    });

    // Button keyboard support
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
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
  new ReferralRedeemPage();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Page became visible
    console.log('Redeem page visible again');
  }
});

// Handle browser back button after successful redemption
window.addEventListener('popstate', () => {
  // Could handle navigation state here
  console.log('Navigation state changed');
});
