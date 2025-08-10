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
        this.loadThemeColors();
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
      // Try API first, then fall back to local data
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
      } catch (apiError) {
        console.warn('API call failed, using fallback data:', apiError);
        // Fallback to the provided API structure
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
        page4_referralRedeem: {
          hero: {
            hero_title: "Redeem Referral Invite Code",
            page_title: "Redeem Referral Code",
            quickButtonText: "Paste from Clipboard",
            referral_code: "Enter Code",
            subtitle: "Your friend wants you to enjoy Book Summaries App Premium! Enter or paste their invite code below."
          },
          how_it_works: [
            {
              desc: "Find the referral invitation sent to you by your friend.",
              step: 1
            },
            {
              desc: "Paste the referral code using the button, or type it in.",
              step: 2
            },
            {
              desc: "Unlock a week of Premium access to Book Summaries App!",
              step: 3
            }
          ],
          redeem: {
            primary_cta: "Redeem Code"
          }
        }
      }
    };
  }

  populateContent() {
    if (!this.data) {
      console.error('No data available for rendering');
      return;
    }

    // Extract data from API response structure
    const pageData = this.data.data?.page4_referralRedeem || this.data.data || this.data;
    const hero = pageData.hero || {};
    const steps = pageData.how_it_works || pageData.steps || [];
    const redeem = pageData.redeem || {};

    // Populate header - use page_title for header-title
    document.getElementById('header-title').textContent = hero.page_title || 'This is a placeholder';

    // Populate hero section - use hero_title for hero-title
    document.getElementById('hero-title').textContent = hero.hero_title || 'This is a placeholder';
    
    // Use subtitle for hero-subtitle
    document.getElementById('hero-subtitle').textContent = hero.subtitle || 'This is a placeholder';
    
    // Update input placeholder - use referral_code as placeholder value
    const redeemInput = document.getElementById('redeem-input');
    if (redeemInput) {
      redeemInput.placeholder = hero.referral_code || 'This is a placeholder';
    }

    // Update paste button text - use quickButtonText for paste-btn
    const pasteBtn = document.getElementById('paste-btn');
    if (pasteBtn) {
      pasteBtn.textContent = hero.quickButtonText || 'This is a placeholder';
    }

    // Update primary CTA button - use primary_cta for primary-cta
    const primaryCta = document.getElementById('primary-cta');
    if (primaryCta) {
      primaryCta.textContent = redeem.primary_cta || 'This is a placeholder';
    }

    // Store validation messages for later use
    this.validationMessages = redeem.validation || {};

    // Populate how it works steps (only 3 steps as per API)
    if (steps.length > 0) {
      steps.forEach((step, index) => {
        const stepElement = document.getElementById(`step-${index + 1}`);
        if (stepElement && index < 3) {
          stepElement.textContent = step.desc || step.description || step.text || 'This is a placeholder';
        }
      });
    }
  }

  loadThemeColors() {
    if (typeof THEME_ONE !== 'undefined') {
      console.log('Loading THEME_ONE colors:', THEME_ONE);
      
      // Apply theme colors to paste button
      const pasteBtn = document.getElementById('paste-btn');
      if (pasteBtn) {
        pasteBtn.style.background = `linear-gradient(135deg, ${THEME_ONE.gradientBG[0]}, ${THEME_ONE.gradientBG[1]})`;
        pasteBtn.style.color = THEME_ONE.textColor;
      }

      // Apply theme colors to redeem input
      const redeemInput = document.getElementById('redeem-input');
      if (redeemInput) {
        redeemInput.style.borderColor = THEME_ONE.border;
        redeemInput.style.backgroundColor = THEME_ONE.pastelBGFill;
      }
    }
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
    
    // Use validation messages from API
    if (!input || !input.value.trim()) {
      const emptyMessage = this.validationMessages?.empty || 'Please enter a referral code';
      ReferralUtils.showToast(emptyMessage);
      return;
    }

    const code = input.value.trim();
    
    // Disable button during processing
    if (redeemBtn) {
      redeemBtn.disabled = true;
      redeemBtn.textContent = 'Redeeming...';
    }

    try {
      // Call the checkredeem API
      const endpoint = `/api/checkredeem?lang=${this.params.language}`;
      const body = {
        app_package_name: this.params.app_package_name,
        user_id: this.params.userId,
        code: code
      };

      const result = await ReferralUtils.makeApiCall(endpoint, 'POST', body);
      
      if (result.success || result.status === 'success') {
        this.showSuccessState(result);
      } else {
        // Handle different validation states
        let errorMessage = result.message;
        if (result.validation_state === 'expired') {
          errorMessage = this.validationMessages?.expired || errorMessage;
        } else if (result.validation_state === 'invalid') {
          errorMessage = this.validationMessages?.invalid || errorMessage;
        }
        throw new Error(errorMessage || 'Failed to redeem code');
      }
    } catch (error) {
      console.error('Redeem error:', error);
      ReferralUtils.showToast(error.message || 'Failed to redeem code. Please try again.');
    } finally {
      // Re-enable button
      if (redeemBtn) {
        redeemBtn.disabled = false;
        const pageData = this.data.data?.page4_referralRedeem || this.data.data || this.data;
        const redeem = pageData.redeem || {};
        redeemBtn.textContent = redeem.primary_cta || 'This is a placeholder';
      }
    }
  }

  showSuccessState(result) {
    // Extract success data from API response
    const pageData = this.data.data?.page4_referralRedeem || this.data.data || this.data;
    const successData = pageData.redeem?.redemptionSuccess || {};
    
    // Update hero-title with redemptionSuccess.hero_title
    const heroTitle = document.getElementById('hero-title');
    if (heroTitle) {
      heroTitle.textContent = successData.hero_title || 'This is a placeholder';
    }
    
    // Update hero-subtitle with redemptionSuccess.subtitle
    const heroSubtitle = document.getElementById('hero-subtitle');
    if (heroSubtitle) {
      heroSubtitle.textContent = successData.subtitle || 'This is a placeholder';
    }
    
    // Get content wrapper and add success nudge if it doesn't exist
    const contentWrapper = document.getElementById('page-content-wrapper');
    if (contentWrapper && !contentWrapper.querySelector('.success-nudge')) {
      const heroSection = contentWrapper.querySelector('.hero-section');
      if (heroSection) {
        const successNudge = document.createElement('div');
        successNudge.className = 'success-nudge';
        successNudge.innerHTML = `
          <div class="nudge-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="nudge-text">${(successData.nudges && successData.nudges[0]) || "This is a placeholder"}</span>
        `;
        heroSection.appendChild(successNudge);
      }
    } else if (contentWrapper) {
      // Update existing nudge text
      const nudgeText = contentWrapper.querySelector('.nudge-text');
      if (nudgeText) {
        nudgeText.textContent = (successData.nudges && successData.nudges[0]) || "This is a placeholder";
      }
    }
    
    // Update footer CTA with redemptionSuccess.primary_cta
    const footerCTA = document.getElementById('primary-cta');
    if (footerCTA) {
      footerCTA.textContent = successData.primary_cta || 'This is a placeholder';
      footerCTA.disabled = false;
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
  new ReferralRedeemPage();
});