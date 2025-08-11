// Referral Download Page Logic
class ReferralDownloadPage {
  constructor() {
    this.data = null;
    this.params = ReferralUtils.getUrlParams();
    this.preloadedImages = [];
    this.init();
  }

  async init() {
    try {
      // Set dynamic loading text
      const loadingTextElement = document.getElementById('loading-text');
      if (loadingTextElement) {
        loadingTextElement.textContent = ReferralUtils.getRandomLoadingText();
      }
      
      await this.loadPageData();
      if (this.data) {
        await this.preloadAssets();
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

  // Preload images used in this page
  async preloadAssets() {
    try {
      console.log("Preloading assets for referralDownload page...");
      
      // Images used in this page
      const imagesToPreload = [
        'images/downloadapp.png',
        'images/avatar1tp.png',
        'images/avatar2tp.png',
        'images/avatar5tp.png',
        'images/google-play-badge.png',
        'images/app-store-badge.svg'
      ];

      // Preload images
      const imagePromises = imagesToPreload.map(src => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            console.log(`Preloaded image: ${src}`);
            resolve(img);
          };
          img.onerror = () => {
            console.warn(`Failed to preload image: ${src}`);
            resolve(null); // Don't reject, just resolve with null
          };
          img.src = src;
        });
      });

      this.preloadedImages = await Promise.all(imagePromises);
      
      // Preload clipboard copy success audio
      this.clipboardCopyAudio = new Audio('audio/completed1.mp3');
      this.clipboardCopyAudio.preload = 'auto';
      this.clipboardCopyAudio.volume = 0.8;
      
      console.log("Assets preloaded successfully for referralDownload");
    } catch (error) {
      console.error("Error preloading assets:", error);
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

    // Helper function to replace all placeholders in text
    const replacePlaceholders = (text) => {
      if (!text) return text;
      
      // Capitalize first letter of referrer name
      const capitalizedReferrerName = apiData.referrer_name ? 
        apiData.referrer_name.charAt(0).toUpperCase() + apiData.referrer_name.slice(1).toLowerCase() : '';
      
      return text
        .replace(/\{\{referrer_name\}\}/g, capitalizedReferrerName)
        .replace(/\{\{referral_code\}\}/g, (apiData.referral_code || '').toUpperCase())
        .replace(/\{\{app_name\}\}/g, apiData.app_name || '')
        .replace(/\{\{app_store_link\}\}/g, apiData.app_store_link || '')
        .replace(/\{\{play_store_link\}\}/g, apiData.play_store_link || '');
    };

    // Populate app title using page_title
    const appTitleElement = document.getElementById('app-title');
    if (appTitleElement && heroData.page_title) {
      appTitleElement.textContent = replacePlaceholders(heroData.page_title);
    }

    // Populate invitation title
    const invitationTitleElement = document.getElementById('invitation-title');
    if (invitationTitleElement && heroData.hero_title) {
      const titleText = replacePlaceholders(heroData.hero_title);
      // Capitalize first letter of all words
      const capitalizedTitle = titleText.replace(/\b\w/g, letter => letter.toUpperCase());
      invitationTitleElement.textContent = capitalizedTitle;
    }
    
    // Populate invitation subtitle
    const invitationSubtitleElement = document.getElementById('invitation-subtitle');
    if (invitationSubtitleElement && heroData.subtitle) {
      invitationSubtitleElement.textContent = replacePlaceholders(heroData.subtitle);
    }
    
    // Populate referral code with uppercase
    const referralCodeElement = document.getElementById('referral-code');
    if (referralCodeElement && apiData.referral_code) {
      referralCodeElement.textContent = apiData.referral_code.toUpperCase();
    }
    
    // Populate copy button text
    const copyButtonElement = document.getElementById('copy-clipboard');
    if (copyButtonElement && heroData.quickButtonText) {
      copyButtonElement.textContent = replacePlaceholders(heroData.quickButtonText);
    }

    // Populate how it works steps
    if (howItWorksData.length > 0) {
      howItWorksData.forEach((stepData, index) => {
        const stepElement = document.getElementById(`step-${stepData.step || index + 1}`);
        if (stepElement && stepData.desc) {
          stepElement.textContent = replacePlaceholders(stepData.desc);
        }
      });
    }
    
    // Store links are set but don't populate text content since we're using badge images
    const googlePlayBtn = document.getElementById('download-google');
    const appStoreBtn = document.getElementById('download-appstore');
    
    // Use the API response data for store links
    this.playStoreLink = apiData.play_store_link || 'https://play.google.com/store/apps/details?id=keto.weightloss.diet.plan&hl=en_IN&pli=1';
    this.appStoreLink = apiData.app_store_link || 'https://apps.apple.com/in/app/keto-diet-app-recipes/id1499044130';
    
    console.log('Using Play Store link:', this.playStoreLink);
    console.log('Using App Store link:', this.appStoreLink);
    
    // Update hero image using API data
    this.updateHeroImage(apiData);
    
    // Apply theme colors after populating content
    this.applyThemeColors();
  }

  // Update hero image with API data
  updateHeroImage(apiData) {
    const heroImage = document.querySelector('.hero-image');
    if (!heroImage) {
      console.warn('Hero image element not found');
      return;
    }

    // Use app_image from API if available, otherwise fallback to default
    const appImageUrl = apiData.app_image;
    const fallbackImage = 'images/downloadapp.png';
    
    if (appImageUrl) {
      console.log('Using app image from API:', appImageUrl);
      
      // Test if the image loads successfully
      const testImage = new Image();
      testImage.onload = () => {
        heroImage.src = appImageUrl;
        console.log('App image loaded successfully, updating hero image');
      };
      testImage.onerror = () => {
        console.warn('App image failed to load, using fallback:', fallbackImage);
        heroImage.src = fallbackImage;
      };
      testImage.src = appImageUrl;
    } else {
      console.log('No app_image in API response, using fallback:', fallbackImage);
      heroImage.src = fallbackImage;
    }
  }

  // Play clipboard copy success sound
  playClipboardCopyAudio() {
    try {
      if (this.clipboardCopyAudio && this.clipboardCopyAudio.readyState >= 2) {
        this.clipboardCopyAudio.currentTime = 0;
        this.clipboardCopyAudio.play().catch(e => console.log("Audio play failed:", e));
      }
    } catch (error) {
      console.error("Error playing clipboard copy sound:", error);
    }
  }

  // Apply theme colors from appTheme.js
  applyThemeColors() {
    console.log('ReferralDownloadPage: Applying theme colors');
    
    if (typeof THEME_ONE === 'undefined') {
      console.warn('THEME_ONE not available, skipping theme application');
      return;
    }
    
    console.log('Using THEME_ONE colors:', THEME_ONE);
    
    // Hero section background
    const heroSection = document.getElementById('hero-section');
    if (heroSection) {
      heroSection.style.backgroundColor = THEME_ONE.pastelBG;
      heroSection.style.padding = '4rem 20px';
    }
    
    // Referral code display styling
    const referralCodeDisplay = document.getElementById('referral-code');
    if (referralCodeDisplay) {
      referralCodeDisplay.style.border = '2px dashed rgb(255, 165, 0)';
      referralCodeDisplay.style.backgroundColor = THEME_ONE.pastelBGFill;
      referralCodeDisplay.style.color = THEME_ONE.textColor;
    }
    
    // Invitation subtitle color
    const invitationSubtitle = document.getElementById('invitation-subtitle');
    if (invitationSubtitle) {
      invitationSubtitle.style.color = THEME_ONE.secondaryTextColor;
    }
    
    // Copy clipboard button styling
    const copyButton = document.getElementById('copy-clipboard');
    if (copyButton) {
      copyButton.style.background = `linear-gradient(135deg, ${THEME_ONE.gradientBG[0]}, ${THEME_ONE.gradientBG[1]})`;
      copyButton.style.color = THEME_ONE.textColor;
    }
    
    // Download buttons styling - no background colors applied
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
    
    // Also make referral code itself clickable for copying
    const referralCodeDisplay = document.getElementById('referral-code');
    if (referralCodeDisplay) {
      referralCodeDisplay.style.cursor = 'pointer';
      referralCodeDisplay.addEventListener('click', () => {
        const referralCode = referralCodeDisplay.textContent;
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
    // Convert to lowercase before copying
    const lowercaseText = text.toLowerCase();
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(lowercaseText).then(() => {
        ReferralUtils.showToast('Code copied to clipboard!');
        this.playClipboardCopyAudio();
      }).catch(err => {
        console.error('Failed to copy: ', err);
        this.fallbackCopyTextToClipboard(lowercaseText);
      });
    } else {
      this.fallbackCopyTextToClipboard(lowercaseText);
    }
  }

  fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    // Ensure text is lowercase for fallback method too
    textArea.value = text.toLowerCase();
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
        this.playClipboardCopyAudio();
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