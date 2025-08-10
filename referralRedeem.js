// Referral Redeem Page Logic
class ReferralRedeemPage {
  constructor() {
    this.data = null;
    this.params = ReferralUtils.getUrlParams();
    this.validationMessages = {};
    this.init();
  }

  // Simple encryption using base64 and character shifting
  encrypt(text) {
    try {
      if (!text || typeof text !== 'string') {
        console.warn('Invalid text for encryption:', text);
        return btoa(JSON.stringify(text || ''));
      }
      const shifted = text.split('').map(char => 
        String.fromCharCode(char.charCodeAt(0) + 3)
      ).join('');
      return btoa(shifted);
    } catch (error) {
      console.error('Encryption error:', error);
      return btoa(text || ''); // Fallback to simple base64
    }
  }

  // Simple decryption
  decrypt(encryptedText) {
    try {
      if (!encryptedText) {
        return '';
      }
      const decoded = atob(encryptedText);
      return decoded.split('').map(char => 
        String.fromCharCode(char.charCodeAt(0) - 3)
      ).join('');
    } catch (error) {
      console.error('Decryption failed:', error);
      // Try simple base64 decode as fallback
      try {
        return atob(encryptedText);
      } catch (fallbackError) {
        console.error('Fallback decryption also failed:', fallbackError);
        return '';
      }
    }
  }

  // Generate localStorage key based on user and app (simple base64 encoding)
  getStorageKey() {
    const userId = btoa(this.params.userId);
    const appName = btoa(this.params.app_package_name);
    return `referralRedeem_${userId}_${appName}`;
  }
  
  // Clean up any duplicate localStorage entries for this user
  cleanupStorageKeys() {
    const baseKey = this.getStorageKey();
    // Remove any fallback entries
    localStorage.removeItem(baseKey + '_fallback');
    console.log('Cleaned up localStorage for user:', this.params.userId);
  }

  // Check if user has already redeemed
  checkAlreadyRedeemed() {
    const storageKey = this.getStorageKey();
    const storedData = localStorage.getItem(storageKey);
    console.log('Checking for stored data with key:', storageKey);
    console.log('Found stored data:', !!storedData);
    
    if (storedData) {
      try {
        // Parse as plain JSON (no encryption needed for this simple case)
        const parsedData = JSON.parse(storedData);
        console.log('Successfully parsed data, alreadyRedeemed:', parsedData.alreadyRedeemed);
        return parsedData.alreadyRedeemed === true;
      } catch (error) {
        console.error('Failed to parse stored redemption data:', error);
        // Clean up corrupted data
        localStorage.removeItem(storageKey);
        return false;
      }
    }
    return false;
  }

  // Save redemption data to localStorage
  saveRedemptionData(alreadyRedeemed = false) {
    const storageKey = this.getStorageKey();
    const dataToStore = {
      data: this.data,
      alreadyRedeemed: alreadyRedeemed,
      timestamp: new Date().toISOString(),
      userId: this.params.userId,
      appName: this.params.app_package_name
    };
    
    // Clean up any existing fallback entries first
    const fallbackKey = storageKey + '_fallback';
    localStorage.removeItem(fallbackKey);
    
    try {
      const jsonString = JSON.stringify(dataToStore);
      console.log('Attempting to save localStorage data with alreadyRedeemed:', alreadyRedeemed);
      
      // Try to save as plain JSON first (simpler and more reliable)
      localStorage.setItem(storageKey, jsonString);
      console.log('Redemption data saved to localStorage with key:', storageKey);
      
      // Verify the save worked
      const verification = localStorage.getItem(storageKey);
      console.log('Verification - stored data exists:', !!verification);
    } catch (error) {
      console.error('Failed to save redemption data:', error);
    }
  }

  // Get stored redemption data
  getStoredRedemptionData() {
    const storageKey = this.getStorageKey();
    const storedData = localStorage.getItem(storageKey);
    
    if (storedData) {
      try {
        // Parse as plain JSON
        const parsedData = JSON.parse(storedData);
        return parsedData.data || parsedData; // Return the actual data part
      } catch (error) {
        console.error('Failed to parse stored redemption data:', error);
        // Clean up corrupted data
        localStorage.removeItem(storageKey);
        return null;
      }
    }
    return null;
  }

  async init() {
    try {
      console.log('ReferralRedeemPage: Starting init with params:', this.params);
      
      // Clean up any old localStorage entries first
      this.cleanupStorageKeys();
      
      // Check if user has already redeemed
      const alreadyRedeemed = this.checkAlreadyRedeemed();
      console.log('ReferralRedeemPage: Already redeemed check result:', alreadyRedeemed);
      
      if (alreadyRedeemed) {
        // Load stored data and render success state
        const storedData = this.getStoredRedemptionData();
        console.log('ReferralRedeemPage: Stored data found, rendering success state');
        if (storedData) {
          this.data = storedData;
          this.loadThemeColors();
          this.hideLoader();
          this.renderAlreadyRedeemedState();
          return;
        }
      }
      
      // Normal flow - load fresh data
      console.log('ReferralRedeemPage: Loading fresh data from API');
      await this.loadPageData();
      if (this.data) {
        // Only save to localStorage if no existing data (don't overwrite alreadyRedeemed=true)
        const existingData = this.getStoredRedemptionData();
        if (!existingData) {
          console.log('ReferralRedeemPage: No existing localStorage data, creating new entry with alreadyRedeemed=false');
          this.data.alreadyRedeemed = false;
          this.saveRedemptionData(false);
        } else {
          console.log('ReferralRedeemPage: Found existing localStorage data, not overwriting');
        }
        
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
      
      // Test feature: Double-click input to simulate successful redemption
      input.addEventListener('dblclick', () => {
        console.log('Test mode: Simulating successful redemption');
        ReferralUtils.showToast('Test Mode: Simulating success!');
        this.showSuccessState({ success: true, message: 'Test redemption successful' });
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
        // Mark as redeemed and save to localStorage
        console.log('ReferralRedeemPage: Successful redemption, saving to localStorage');
        this.data.alreadyRedeemed = true;
        this.saveRedemptionData(true);
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
    console.log('ReferralRedeemPage: Showing success state and updating localStorage');
    
    // Mark as redeemed and save to localStorage immediately
    this.data.alreadyRedeemed = true;
    this.saveRedemptionData(true);
    
    // Update the primary CTA button immediately before rendering
    const primaryCta = document.getElementById('primary-cta');
    if (primaryCta) {
      const pageData = this.data.data?.page4_referralRedeem || this.data.data || this.data;
      const successData = pageData.redeem?.redemptionSuccess || {};
      primaryCta.textContent = successData.primary_cta || 'Unlock 1 Week Premium 🎉';
      console.log('Updated primary CTA button text to:', primaryCta.textContent);
    }
    
    // Replace the entire page content with success state
    this.renderAlreadyRedeemedState();
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

  // Render the already redeemed state (success page)
  renderAlreadyRedeemedState() {
    console.log('ReferralRedeemPage: Rendering already redeemed state');
    
    // Get redemption success data
    const pageData = this.data.data?.page4_referralRedeem || this.data.data || this.data;
    const successData = pageData.redeem?.redemptionSuccess || {};
    
    console.log('Success data for rendering:', successData);
    
    // Update header title to match the success state
    const headerTitle = document.getElementById('header-title');
    if (headerTitle) {
      headerTitle.textContent = 'Redeem Referral Code'; // Keep header consistent
    }
    
    // Get content wrapper and completely replace with success UI
    const contentWrapper = document.getElementById('page-content-wrapper');
    if (!contentWrapper) return;
    
    // Replace entire content with success state matching the screenshot
    contentWrapper.innerHTML = `
      <!-- Success State Content -->
      <section class="success-section" style="text-align: center; padding: 2rem 1rem; min-height: 70vh; display: flex; flex-direction: column; justify-content: center;">
        
        <!-- Success image with crown -->
        <div class="success-image-container" style="width: 280px; height: 280px; margin: 0 auto 2rem; border-radius: 16px; display: flex; align-items: center; justify-content: center;">
          <img src="images/crown.png" alt="Success Crown" style="width: 280px; height: 280px; object-fit: contain;" />
        </div>
        
        <!-- Main success title -->
        <h1 class="success-title" style="font-size: 2rem; font-weight: 700; color: #1a202c; margin-bottom: 1rem; line-height: 1.2;">
          ${successData.hero_title || "You're all set!"}
        </h1>
        
        <!-- Success subtitle -->
        <p class="success-subtitle" style="font-size: 1rem; color: #718096; line-height: 1.5; margin-bottom: 2.5rem; max-width: 300px; margin-left: auto; margin-right: auto;">
          ${successData.subtitle || 'You have redeemed a valid referral code from John!'}
        </p>
        
        <!-- Info nudge with icon -->
        <div class="info-nudge" style="background: #f7fafc; border-radius: 12px; padding: 1.25rem; margin-bottom: 4rem; display: flex; align-items: flex-start; gap: 0.75rem; max-width: 350px; margin-left: auto; margin-right: auto; border: 1px solid #e2e8f0;">
          <div class="info-icon" style="color: #4a5568; margin-top: 0.125rem; flex-shrink: 0;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="info-text" style="color: #4a5568; font-size: 0.875rem; line-height: 1.4; text-align: left;">
            ${(successData.nudges && successData.nudges[0]) || 'Your redemption also helps John progress toward a reward.'}
          </span>
        </div>
      </section>
    `;
    
    // Update footer CTA with success button text and styling
    const footerCTA = document.getElementById('primary-cta');
    if (footerCTA) {
      footerCTA.textContent = successData.primary_cta || 'Unlock 1 Week Premium 🎉';
      footerCTA.disabled = false;
      
      // Update button style for success state
      footerCTA.style.background = 'linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%)';
      footerCTA.style.color = 'white';
      footerCTA.style.fontWeight = '600';
      
      // Add click handler for the CTA in success state
      footerCTA.onclick = () => {
        ReferralUtils.showToast('Premium access activated!');
      };
    }
    
    console.log('Successfully rendered already redeemed state');
  }
}

// Initialize page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ReferralRedeemPage();
});