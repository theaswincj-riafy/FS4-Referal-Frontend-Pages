// Referral Download Page Logic
class ReferralDownloadPage {
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
      const endpoint = `/share/${this.params.referralCode}`;
      
      console.log('Making API call to:', endpoint);
      
      this.data = await ReferralUtils.makeApiCall(endpoint, 'GET');
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
    const app = pageData.app || {};
    const invitation = pageData.invitation || {};
    const steps = pageData.how_it_works || pageData.steps || [];

    // Populate app title
    document.getElementById('app-title').textContent = app.name || app.title || 'Dance Workouts For Weight Loss';

    // Populate invitation section
    const capitalizedName = ReferralUtils.capitalizeName(this.params.firstname);
    document.getElementById('invitation-title').textContent = 
      invitation.title || `${capitalizedName} Invited You To Try This App`;
    
    document.getElementById('invitation-subtitle').textContent = 
      invitation.subtitle || 'Download the app to claim your invite and get 1 week of Premium features for Free!';
    
    document.getElementById('referral-code').textContent = 
      invitation.referral_code || pageData.referral_code || this.params.referralCode;

    // Populate how it works steps
    if (steps.length > 0) {
      steps.forEach((step, index) => {
        const stepElement = document.getElementById(`step-${index + 1}`);
        if (stepElement) {
          let stepText = step.desc || step.description || step.text;
          // Replace placeholder with actual referrer name
          stepText = stepText.replace(/\{referrer_name\}/g, capitalizedName);
          stepElement.textContent = stepText;
        }
      });
    } else {
      // Default steps if API doesn't provide them
      const defaultSteps = [
        'Download the app from Google Play or Apple App Store',
        'Open the app and click on Redeem Referral Code',
        `Paste ${capitalizedName}'s referral code and hit redeem to unlock a week of Premium features for yourself!`
      ];
      
      defaultSteps.forEach((stepText, index) => {
        const stepElement = document.getElementById(`step-${index + 1}`);
        if (stepElement) {
          stepElement.textContent = stepText;
        }
      });
    }
  }

  hideLoader() {
    const loader = document.getElementById('page-loader');
    const content = document.getElementById('page-content-wrapper');
    
    if (loader) loader.style.display = 'none';
    if (content) content.style.display = 'block';
  }

  bindEvents() {
    // Copy to clipboard button
    const copyBtn = document.getElementById('copy-clipboard');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const referralCode = document.getElementById('referral-code').textContent;
        this.copyToClipboard(referralCode);
      });
    }

    // Download buttons
    const googlePlayBtn = document.getElementById('download-google');
    const appStoreBtn = document.getElementById('download-appstore');
    
    if (googlePlayBtn) {
      googlePlayBtn.addEventListener('click', () => {
        // Extract package name or use default Play Store search
        const packageName = this.params.app_package_name;
        const playStoreUrl = `https://play.google.com/store/apps/details?id=${packageName}`;
        window.open(playStoreUrl, '_blank');
      });
    }

    if (appStoreBtn) {
      appStoreBtn.addEventListener('click', () => {
        // For App Store, we'd need the app ID, so we'll use a search instead
        const appName = document.getElementById('app-title').textContent;
        const appStoreUrl = `https://apps.apple.com/search?term=${encodeURIComponent(appName)}`;
        window.open(appStoreUrl, '_blank');
      });
    }
  }

  copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        ReferralUtils.showToast('Code copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy: ', err);
        this.fallbackCopyTextToClipboard(text);
      });
    } else {
      this.fallbackCopyTextToClipboard(text);
    }
  }

  fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        ReferralUtils.showToast('Code copied to clipboard!');
      } else {
        console.error('Fallback: Copying text command was unsuccessful');
      }
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }

    document.body.removeChild(textArea);
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
  new ReferralDownloadPage();
});