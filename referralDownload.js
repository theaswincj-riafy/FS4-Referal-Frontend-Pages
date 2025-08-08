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
        this.renderPage();
        this.bindEvents();
      } else {
        throw new Error('No data loaded');
      }
    } catch (error) {
      console.error('Failed to load page:', error);
      this.showError('Failed to load invitation data. Please try again.');
    }
  }

  async loadPageData() {
    // Show loading state
    const mainContent = document.getElementById('main-content');
    ReferralUtils.showLoading(mainContent);

    try {
      // Simulate API call
      this.data = await ReferralUtils.simulateApiCall('page3_referralDownload');
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
      <!-- Feature Highlights -->
      <section class="features-section" role="region" aria-labelledby="features-title">
        <h2 id="features-title">Why you'll love this app</h2>
        <div class="benefits">
          ${this.data.feature_highlights.map(feature => `
            <div class="card">
              <h3 class="card-title">${feature.title}</h3>
              <p class="card-desc">${feature.desc}</p>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Store Download Buttons -->
      <section class="download-section" role="region" aria-labelledby="download-title">
        <div class="card">
          <h2 id="download-title">Download the App</h2>
          <p class="card-desc">${this.data.store_ctas.device_hint}</p>
          
          <div class="store-buttons">
            <a href="#" class="store-btn" id="play-store-btn" role="button" aria-label="Download from Google Play Store">
              <span style="margin-right: 8px;">📱</span>
              ${this.data.store_ctas.play_store_button}
            </a>
            <a href="#" class="store-btn" id="app-store-btn" role="button" aria-label="Download from Apple App Store">
              <span style="margin-right: 8px;">🍎</span>
              ${this.data.store_ctas.app_store_button}
            </a>
          </div>
        </div>
      </section>

      <!-- How It Works -->
      <section class="how-it-works-section" role="region" aria-labelledby="how-it-works-title">
        <div class="card">
          <h2 id="how-it-works-title">${this.data.how_it_works.title}</h2>
          <ol class="steps-list">
            ${this.data.how_it_works.steps.map(step => `
              <li>${step}</li>
            `).join('')}
          </ol>
          
          <!-- Code Display -->
          <div style="background: #f7fafc; padding: 1rem; border-radius: 8px; margin-top: 1rem; border: 2px dashed #cbd5e0;">
            <p style="text-align: center; color: #4a5568; margin-bottom: 0.5rem; font-size: 0.875rem;">Your invite code:</p>
            <p style="text-align: center; font-family: 'Courier New', monospace; font-size: 1.25rem; font-weight: 600; color: #2d3748; letter-spacing: 2px;">${this.params.referral_code}</p>
            <button class="btn btn-secondary" id="copy-code-preview" style="margin-top: 1rem;">
              <span>📋</span> Copy Code
            </button>
          </div>
        </div>
      </section>

      <!-- Additional App Mockups -->
      <section class="app-preview-section" role="region" aria-labelledby="preview-title">
        <div class="card">
          <h3 id="preview-title">See it in action</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; margin-top: 1rem;">
            <img src="https://pixabay.com/get/gc48115f76b9abd1f955781089569abbc7744c613c9d57e33bb411171f5614074416289c336fe12eb1f3f0580312cffed17c86411f3ac8fa6c1eba5d4e5775858_1280.jpg" alt="App interface preview showing clean design" style="width: 100%; height: 140px; object-fit: cover; border-radius: 8px;">
            <img src="https://pixabay.com/get/ga26e3dd718cd12c89401968bb72dea8caa6cb688c5ef8b981f8e40dbffd9b54ab4918fb65e0c88140f8c8f712e348dcdeb79ba6293ce03bb716c223013af8231_1280.jpg" alt="Mobile app features and navigation" style="width: 100%; height: 140px; object-fit: cover; border-radius: 8px;">
          </div>
        </div>
      </section>
    `;
  }

  renderFooter() {
    document.getElementById('footer-smallprint').textContent = this.data.footer.smallprint;
    
    const secondaryCta = document.getElementById('secondary-cta');
    secondaryCta.textContent = this.data.footer.secondary_cta.label;
    secondaryCta.disabled = false;
  }

  bindEvents() {
    // Store buttons
    document.getElementById('play-store-btn').addEventListener('click', (e) => {
      e.preventDefault();
      this.handleStoreDownload('play');
    });

    document.getElementById('app-store-btn').addEventListener('click', (e) => {
      e.preventDefault();
      this.handleStoreDownload('app');
    });

    // Copy code button
    document.getElementById('copy-code-preview').addEventListener('click', () => {
      this.handleCopyCode();
    });

    // Secondary CTA (Already installed)
    document.getElementById('secondary-cta').addEventListener('click', () => {
      this.handleSecondaryAction();
    });

    // Keyboard navigation
    this.setupKeyboardNavigation();

    // Auto-detect platform and highlight appropriate store
    this.detectAndHighlightPlatform();
  }

  handleStoreDownload(store) {
    // In a real app, these would be actual store URLs
    const storeUrls = {
      play: 'https://play.google.com/store/apps/details?id=com.example.app',
      app: 'https://apps.apple.com/app/example-app/id123456789'
    };

    // Show toast with instructions
    ReferralUtils.showToast(`Opening ${store === 'play' ? 'Google Play' : 'App Store'}...`);

    // In a real implementation, this would redirect to actual store
    console.log(`Would redirect to: ${storeUrls[store]}`);
    
    // For demo, just show a message
    setTimeout(() => {
      ReferralUtils.showToast('Remember to use your invite code after installing!');
    }, 2000);
  }

  async handleCopyCode() {
    const success = await ReferralUtils.copyToClipboard(
      this.params.referral_code,
      'Code copied! Use it after installing the app.'
    );
    
    if (success) {
      // Add visual feedback
      const button = document.getElementById('copy-code-preview');
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

  handleSecondaryAction() {
    // Navigate to redeem page
    ReferralUtils.navigateWithParams('referralRedeem.html');
  }

  detectAndHighlightPlatform() {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    
    // Detect iOS
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
      document.getElementById('app-store-btn').style.order = '-1';
      document.getElementById('app-store-btn').style.background = '#007aff';
    }
    // Detect Android
    else if (/android/i.test(userAgent)) {
      document.getElementById('play-store-btn').style.order = '-1';
      document.getElementById('play-store-btn').style.background = '#34a853';
    }
  }

  setupKeyboardNavigation() {
    // Add keyboard support for store buttons
    const storeButtons = document.querySelectorAll('.store-btn');
    storeButtons.forEach(button => {
      button.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          button.click();
        }
      });
    });

    // Regular button keyboard support
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
  new ReferralDownloadPage();
});

// Handle page visibility for potential refresh
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    // Page became visible
    console.log('Download page visible again');
  }
});
