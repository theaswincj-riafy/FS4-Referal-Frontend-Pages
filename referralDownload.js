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
      // Use the referralCode from URL params for the API call
      const referralCode = this.params.referralCode;
      if (!referralCode) {
        throw new Error('No referral code provided');
      }
      
      const endpoint = `/share/${referralCode}`;
      
      console.log('ReferralDownloadPage: Making API call to:', endpoint);
      console.log('Using referralCode:', referralCode);
      
      this.data = await ReferralUtils.makeApiCall(endpoint, 'GET');
      console.log('ReferralDownloadPage: Loaded API data:', this.data);
      
      // Validate that we received the expected page3_referralDownload data
      if (!this.data.data?.page3_referralDownload) {
        console.warn('ReferralDownloadPage: No page3_referralDownload found in API response');
      }
      
    } catch (error) {
      console.error('ReferralDownloadPage: API call error:', error);
      this.data = null;
      throw new Error('API call failed');
    }
  }

  populateContent() {
    if (!this.data) {
      console.error('No data available for rendering');
      return;
    }

    console.log('ReferralDownloadPage: Populating content with API data');
    
    // Extract data from API response structure
    const apiData = this.data.data || this.data;
    const downloadData = apiData.page3_referralDownload || {};
    const heroData = downloadData.hero || {};
    const howItWorksData = downloadData.how_it_works || [];
    const storeCtas = downloadData.store_ctas || {};
    
    console.log('Download page data:', downloadData);
    console.log('Hero data:', heroData);
    console.log('How it works data:', howItWorksData);
    console.log('Store CTAs:', storeCtas);

    // Populate app title using page_title
    const appTitleElement = document.getElementById('app-title');
    if (appTitleElement && heroData.page_title) {
      appTitleElement.textContent = heroData.page_title;
    }

    // Populate invitation title, replacing {{referrer_name}} with actual referrer name
    const invitationTitleElement = document.getElementById('invitation-title');
    if (invitationTitleElement && heroData.hero_title) {
      let heroTitle = heroData.hero_title;
      if (apiData.referrer_name) {
        heroTitle = heroTitle.replace(/\{\{referrer_name\}\}/g, apiData.referrer_name);
      }
      invitationTitleElement.textContent = heroTitle;
    }
    
    // Populate invitation subtitle
    const invitationSubtitleElement = document.getElementById('invitation-subtitle');
    if (invitationSubtitleElement && heroData.subtitle) {
      invitationSubtitleElement.textContent = heroData.subtitle;
    }
    
    // Populate referral code
    const referralCodeElement = document.getElementById('referral-code');
    if (referralCodeElement && heroData.referral_code) {
      referralCodeElement.textContent = heroData.referral_code;
    }
    
    // Populate copy button text
    const copyButtonElement = document.getElementById('copy-clipboard');
    if (copyButtonElement && heroData.quickButtonText) {
      copyButtonElement.textContent = heroData.quickButtonText;
    }

    // Populate how it works steps
    if (howItWorksData.length > 0) {
      howItWorksData.forEach((stepData, index) => {
        const stepElement = document.getElementById(`step-${stepData.step || index + 1}`);
        if (stepElement && stepData.desc) {
          let stepText = stepData.desc;
          // Replace {{referrer_name}} placeholder with actual referrer name
          if (apiData.referrer_name) {
            stepText = stepText.replace(/\{\{referrer_name\}\}/g, apiData.referrer_name);
          }
          stepElement.textContent = stepText;
        }
      });
    }
    
    // Populate download button texts and store links
    const googlePlayBtn = document.getElementById('download-google');
    const appStoreBtn = document.getElementById('download-appstore');
    
    if (googlePlayBtn && storeCtas.play_store_button) {
      googlePlayBtn.textContent = storeCtas.play_store_button;
    }
    
    if (appStoreBtn && storeCtas.app_store_button) {
      appStoreBtn.textContent = storeCtas.app_store_button;
    }
    
    // Store the download links for event binding
    this.playStoreLink = storeCtas.play_store_link || apiData.play_store_link;
    this.appStoreLink = storeCtas.app_store_link || apiData.app_store_link;
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
    
    if (googlePlayBtn && this.playStoreLink) {
      googlePlayBtn.addEventListener('click', () => {
        console.log('Opening Play Store link:', this.playStoreLink);
        window.open(this.playStoreLink, '_blank');
      });
    }
    
    if (appStoreBtn && this.appStoreLink) {
      appStoreBtn.addEventListener('click', () => {
        console.log('Opening App Store link:', this.appStoreLink);
        window.open(this.appStoreLink, '_blank');
      });
    }
    
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