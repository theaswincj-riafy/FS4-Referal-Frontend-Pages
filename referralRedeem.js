// Referral Redeem Page Logic
class ReferralRedeemPage {
  constructor() {
    this.data = null;
    this.params = ReferralUtils.getUrlParams();
    this.validationMessages = {};
    this.preloadedImages = [];
    this.completedAudio = null;
    this.confettiInstance = null;
    this.init();
  }

  // Simple encryption using base64 and character shifting
  encrypt(text) {
    try {
      if (!text || typeof text !== "string") {
        console.warn("Invalid text for encryption:", text);
        return btoa(JSON.stringify(text || ""));
      }
      const shifted = text
        .split("")
        .map((char) => String.fromCharCode(char.charCodeAt(0) + 3))
        .join("");
      return btoa(shifted);
    } catch (error) {
      console.error("Encryption error:", error);
      return btoa(text || ""); // Fallback to simple base64
    }
  }

  // Simple decryption
  decrypt(encryptedText) {
    try {
      if (!encryptedText) {
        return "";
      }
      const decoded = atob(encryptedText);
      return decoded
        .split("")
        .map((char) => String.fromCharCode(char.charCodeAt(0) - 3))
        .join("");
    } catch (error) {
      console.error("Decryption failed:", error);
      // Try simple base64 decode as fallback
      try {
        return atob(encryptedText);
      } catch (fallbackError) {
        console.error("Fallback decryption also failed:", fallbackError);
        return "";
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
    localStorage.removeItem(baseKey + "_fallback");
    console.log("Cleaned up localStorage for user:", this.params.userId);
  }

  // Check if user has already redeemed
  checkAlreadyRedeemed() {
    const storageKey = this.getStorageKey();
    const storedData = localStorage.getItem(storageKey);
    console.log("Checking for stored data with key:", storageKey);
    console.log("Found stored data:", !!storedData);

    if (storedData) {
      try {
        // Parse as plain JSON (no encryption needed for this simple case)
        const parsedData = JSON.parse(storedData);
        console.log(
          "Successfully parsed data, alreadyRedeemed:",
          parsedData.alreadyRedeemed,
        );
        return parsedData.alreadyRedeemed === true;
      } catch (error) {
        console.error("Failed to parse stored redemption data:", error);
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
      appName: this.params.app_package_name,
    };

    // Clean up any existing fallback entries first
    const fallbackKey = storageKey + "_fallback";
    localStorage.removeItem(fallbackKey);

    try {
      const jsonString = JSON.stringify(dataToStore);
      console.log(
        "Attempting to save localStorage data with alreadyRedeemed:",
        alreadyRedeemed,
      );

      // Try to save as plain JSON first (simpler and more reliable)
      localStorage.setItem(storageKey, jsonString);
      console.log(
        "Redemption data saved to localStorage with key:",
        storageKey,
      );

      // Verify the save worked
      const verification = localStorage.getItem(storageKey);
      console.log("Verification - stored data exists:", !!verification);
    } catch (error) {
      console.error("Failed to save redemption data:", error);
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
        console.error("Failed to parse stored redemption data:", error);
        // Clean up corrupted data
        localStorage.removeItem(storageKey);
        return null;
      }
    }
    return null;
  }

  // Preload images and audio used in this page
  async preloadAssets() {
    try {
      console.log("Preloading assets for referralRedeem page...");
      
      // Images used in this page
      const imagesToPreload = [
        'images/redeemcode.png',
        'images/avatar1tp.png',
        'images/avatar2tp.png',
        'images/avatar5tp.png',
        'images/crown.png'
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

      // Preload audio file for success state
      this.completedAudio = new Audio('audio/completed3.mp3');
      this.completedAudio.preload = 'auto';
      this.completedAudio.volume = 0.8;
      
      console.log("Assets preloaded successfully for referralRedeem");
    } catch (error) {
      console.error("Error preloading assets:", error);
    }
  }

  // Play completed sound and show confetti
  showSuccessAnimation() {
    try {
      // Play completed sound
      this.playCompletedSound();
      
      // Show confetti animation
      this.createConfettiAnimation();
      
      console.log("Success animation started (audio + confetti)");
    } catch (error) {
      console.error("Error showing success animation:", error);
    }
  }

  // Play completed sound
  playCompletedSound() {
    try {
      if (this.completedAudio && this.completedAudio.readyState >= 2) {
        this.completedAudio.currentTime = 0;
        this.completedAudio.play().catch(e => console.log("Audio play failed:", e));
      }
    } catch (error) {
      console.error("Error playing completed sound:", error);
    }
  }

  // Create confetti animation using react-confetti library with wind effects
  createConfettiAnimation() {
    try {
      console.log("Creating confetti animation with react-confetti...");
      
      // Remove any existing confetti
      this.removeConfettiAnimation();

      // Create confetti container
      const confettiContainer = document.createElement('div');
      confettiContainer.id = 'confetti-container';
      confettiContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 10000;
        overflow: hidden;
      `;
      document.body.appendChild(confettiContainer);

      // Load react-confetti library dynamically
      import('https://cdn.jsdelivr.net/npm/react-confetti@6.1.0/+esm')
        .then(confettiModule => {
          const Confetti = confettiModule.default;
          
          // Create canvas element for confetti
          const canvas = document.createElement('canvas');
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          canvas.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
          `;
          confettiContainer.appendChild(canvas);

          // Initialize confetti with wind effects and simultaneous release
          this.confettiInstance = new Confetti(canvas, {
            particleCount: 200,
            spread: 100,
            startVelocity: 50,
            scalar: 1.2,
            drift: 0.1,
            gravity: 0.8,
            wind: 0.02,
            colors: ['#f43f5e', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'],
            shapes: ['square', 'circle'],
            ticks: 300,
            origin: {
              x: 0.5,
              y: 0
            }
          });

          // Start the animation
          this.confettiInstance.start();

          console.log("React-confetti animation started with wind effects");
        })
        .catch(error => {
          console.error("Failed to load react-confetti, using fallback:", error);
          this.createFallbackConfetti();
        });

      // Auto-remove after 6 seconds
      setTimeout(() => {
        this.removeConfettiAnimation();
      }, 6000);

    } catch (error) {
      console.error("Error creating confetti animation:", error);
      this.createFallbackConfetti();
    }
  }

  // Fallback confetti with wind-like effects using CSS
  createFallbackConfetti() {
    try {
      const confettiContainer = document.getElementById('confetti-container');
      if (!confettiContainer) return;

      // Add CSS animations for wind-scattered confetti
      const style = document.createElement('style');
      style.id = 'confetti-styles';
      style.textContent = `
        @keyframes confetti-fall-wind {
          0% {
            transform: translateY(-20px) translateX(0px) rotate(0deg);
            opacity: 1;
          }
          25% {
            transform: translateY(25vh) translateX(50px) rotate(180deg);
          }
          50% {
            transform: translateY(50vh) translateX(-30px) rotate(360deg);
          }
          75% {
            transform: translateY(75vh) translateX(80px) rotate(540deg);
          }
          100% {
            transform: translateY(100vh) translateX(-20px) rotate(720deg);
            opacity: 0;
          }
        }
        
        .confetti-particle {
          position: absolute;
          animation: confetti-fall-wind 4s ease-out forwards;
        }
      `;
      document.head.appendChild(style);

      const colors = ['#f43f5e', '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];
      
      // Create all particles simultaneously (no stagger)
      for (let i = 0; i < 150; i++) {
        const particle = document.createElement('div');
        particle.className = 'confetti-particle';
        
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 10 + 4;
        const leftPosition = Math.random() * 100;
        const isCircle = Math.random() > 0.5;
        
        particle.style.cssText = `
          left: ${leftPosition}%;
          top: 0;
          width: ${size}px;
          height: ${size}px;
          background-color: ${color};
          border-radius: ${isCircle ? '50%' : '0'};
          opacity: 0.9;
        `;
        
        confettiContainer.appendChild(particle);
      }
      
      console.log("Fallback confetti animation with wind effects started");
    } catch (error) {
      console.error("Error creating fallback confetti:", error);
    }
  }

  // Remove confetti animation
  removeConfettiAnimation() {
    // Stop confetti instance if it exists
    if (this.confettiInstance && typeof this.confettiInstance.stop === 'function') {
      this.confettiInstance.stop();
    }
    
    // Remove DOM elements
    const existing = document.getElementById('confetti-container');
    if (existing) {
      existing.remove();
    }
    const styles = document.getElementById('confetti-styles');
    if (styles) {
      styles.remove();
    }
    this.confettiInstance = null;
  }

  async init() {
    try {
      console.log(
        "ReferralRedeemPage: Starting init with params:",
        this.params,
      );

      // Clean up any old localStorage entries first
      this.cleanupStorageKeys();

      // Check if user has already redeemed
      const alreadyRedeemed = this.checkAlreadyRedeemed();
      console.log(
        "ReferralRedeemPage: Already redeemed check result:",
        alreadyRedeemed,
      );

      if (alreadyRedeemed) {
        // Load stored data and render success state
        const storedData = this.getStoredRedemptionData();
        console.log(
          "ReferralRedeemPage: Stored data found, rendering success state",
        );
        if (storedData) {
          this.data = storedData;
          this.loadThemeColors();
          this.hideLoader();
          this.renderAlreadyRedeemedState();
          // Replace button after rendering
          setTimeout(() => this.replacePrimaryCTAButton(), 100);
          return;
        }
      }

      // Normal flow - load fresh data
      console.log("ReferralRedeemPage: Loading fresh data from API");
      await this.loadPageData();
      if (this.data) {
        await this.preloadAssets();
        // Only save to localStorage if no existing data (don't overwrite alreadyRedeemed=true)
        const existingData = this.getStoredRedemptionData();
        if (!existingData) {
          console.log(
            "ReferralRedeemPage: No existing localStorage data, creating new entry with alreadyRedeemed=false",
          );
          this.data.alreadyRedeemed = false;
          this.saveRedemptionData(false);
        } else {
          console.log(
            "ReferralRedeemPage: Found existing localStorage data, not overwriting",
          );
        }

        this.populateContent();
        this.loadThemeColors();
        this.hideLoader();
        this.bindEvents();
      } else {
        throw new Error("No data loaded");
      }
    } catch (error) {
      console.error("Failed to load page:", error);
      this.showError("Failed to load page data. Please try again.");
    }
  }

  async loadPageData() {
    try {
      // Try API first, then fall back to local data
      try {
        const endpoint = `/api/referral-redeem?lang=${this.params.language}`;
        const body = {
          app_package_name: this.params.app_package_name,
          user_id: this.params.userId,
        };

        console.log("Making API call to:", endpoint);
        console.log("Request body:", body);

        this.data = await ReferralUtils.makeApiCall(endpoint, "POST", body);
        console.log("Loaded API data:", this.data);
      } catch (apiError) {
        console.warn("API call failed, using fallback data:", apiError);
        // Fallback to the provided API structure
        this.data = this.getMockData();
      }
    } catch (error) {
      console.error("All data loading failed:", error);
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
            subtitle:
              "Your friend wants you to enjoy Book Summaries App Premium! Enter or paste their invite code below.",
          },
          how_it_works: [
            {
              desc: "Find the referral invitation sent to you by your friend.",
              step: 1,
            },
            {
              desc: "Paste the referral code using the button, or type it in.",
              step: 2,
            },
            {
              desc: "Unlock a week of Premium access to Book Summaries App!",
              step: 3,
            },
          ],
          redeem: {
            primary_cta: "Redeem Code",
          },
        },
      },
    };
  }

  populateContent() {
    if (!this.data) {
      console.error("No data available for rendering");
      return;
    }

    // Extract data from API response structure
    const pageData =
      this.data.data?.page4_referralRedeem || this.data.data || this.data;
    const hero = pageData.hero || {};
    const steps = pageData.how_it_works || pageData.steps || [];
    const redeem = pageData.redeem || {};

    // Populate header - use page_title for header-title
    document.getElementById("header-title").textContent =
      hero.page_title || "This is a placeholder";

    // Populate hero section - use hero_title for hero-title
    document.getElementById("hero-title").textContent =
      hero.hero_title || "This is a placeholder";

    // Use subtitle for hero-subtitle
    document.getElementById("hero-subtitle").textContent =
      hero.subtitle || "This is a placeholder";

    // Update input placeholder - use referral_code as placeholder value
    const redeemInput = document.getElementById("redeem-input");
    if (redeemInput) {
      redeemInput.placeholder = hero.referral_code || "This is a placeholder";
    }

    // Update paste button text - use quickButtonText for paste-btn
    const pasteBtn = document.getElementById("paste-btn");
    if (pasteBtn) {
      pasteBtn.textContent = hero.quickButtonText || "This is a placeholder";
    }

    // Update primary CTA button - use primary_cta for primary-cta
    const primaryCta = document.getElementById("primary-cta");
    if (primaryCta) {
      primaryCta.textContent = redeem.primary_cta || "This is a placeholder";
    }

    // Store validation messages for later use
    this.validationMessages = redeem.validation || {};

    // Populate how it works steps (only 3 steps as per API)
    if (steps.length > 0) {
      steps.forEach((step, index) => {
        const stepElement = document.getElementById(`step-${index + 1}`);
        if (stepElement && index < 3) {
          stepElement.textContent =
            step.desc ||
            step.description ||
            step.text ||
            "This is a placeholder";
        }
      });
    }
  }

  loadThemeColors() {
    if (typeof THEME_ONE !== "undefined") {
      console.log("Loading THEME_ONE colors:", THEME_ONE);

      // Apply hero section background color
      const heroSection = document.querySelector(".hero-section");
      if (heroSection) {
        heroSection.style.backgroundColor = THEME_ONE.pastelBG;
      }

      // Apply hero subtitle color
      const heroSubtitle = document.getElementById("hero-subtitle");
      if (heroSubtitle) {
        heroSubtitle.style.color = THEME_ONE.secondaryTextColor;
      }

      // Apply theme colors to redeem input
      const redeemInput = document.getElementById("redeem-input");
      if (redeemInput) {
        redeemInput.style.borderColor = THEME_ONE.border;
        redeemInput.style.backgroundColor = THEME_ONE.pastelBGFill;
      }

      // Apply theme colors to paste button
      const pasteBtn = document.getElementById("paste-btn");
      if (pasteBtn) {
        pasteBtn.style.background = `linear-gradient(135deg, ${THEME_ONE.gradientBG[0]}, ${THEME_ONE.gradientBG[1]})`;
        pasteBtn.style.color = THEME_ONE.textColor;
      }

      // Apply theme colors to primary CTA button
      const primaryCta = document.getElementById("primary-cta");
      if (primaryCta) {
        primaryCta.style.background = `linear-gradient(135deg, ${THEME_ONE.gradientBG[0]}, ${THEME_ONE.gradientBG[1]})`;
        primaryCta.style.color = THEME_ONE.textColor;
      }

      // Apply theme colors to premium CTA button if it exists
      const primaryCtaPremium = document.getElementById("primary-cta-premium");
      if (primaryCtaPremium) {
        primaryCtaPremium.style.background = `linear-gradient(135deg, ${THEME_ONE.gradientBG[0]}, ${THEME_ONE.gradientBG[1]})`;
        primaryCtaPremium.style.color = THEME_ONE.textColor;
      }
    }
  }

  hideLoader() {
    const loader = document.getElementById("page-loader");
    const content = document.getElementById("page-content-wrapper");

    if (loader) loader.style.display = "none";
    if (content) content.style.display = "block";
  }

  bindEvents() {
    // Back button
    const backBtn = document.getElementById("back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        console.log("[BACK BUTTON] referralRedeem back button clicked");
        console.log(
          "[BACK BUTTON] alreadyRedeemed state:",
          this.data?.alreadyRedeemed || false,
        );
        console.log("[BACK BUTTON] userId:", this.params.userId);
        console.log("[BACK BUTTON] redirecting to index.html");
        window.location.href = "index.html";
      });
    }

    // Paste from clipboard button
    const pasteBtn = document.getElementById("paste-btn");
    if (pasteBtn) {
      pasteBtn.addEventListener("click", () => {
        this.pasteFromClipboard();
      });
    }

    // Redeem code button
    const redeemBtn = document.getElementById("primary-cta");
    if (redeemBtn) {
      redeemBtn.addEventListener("click", () => {
        this.redeemCode();
      });
    }

    // Input field events
    const input = document.getElementById("redeem-input");
    if (input) {
      input.addEventListener("input", () => {
        this.validateInput();
      });

      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.redeemCode();
        }
      });

      // Test feature: Double-click input to simulate successful redemption
      input.addEventListener("dblclick", () => {
        console.log("Test mode: Simulating successful redemption");
        ReferralUtils.showToast("Test Mode: Simulating success!");
        // Simulate the actual API response format with referrer_name
        this.showSuccessState({
          success: true,
          status: "success",
          message: "Code redeemed successfully",
          referrer_name: "Aswin",
        });
      });
    }
  }

  async pasteFromClipboard() {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        const input = document.getElementById("redeem-input");
        if (input) {
          input.value = text.trim();
          this.validateInput();
          ReferralUtils.showToast("Code pasted successfully!");
        }
      } else {
        ReferralUtils.showToast(
          "Clipboard access not available. Please paste manually.",
        );
      }
    } catch (err) {
      console.error("Failed to read clipboard: ", err);
      ReferralUtils.showToast(
        "Failed to paste from clipboard. Please paste manually.",
      );
    }
  }

  validateInput() {
    const input = document.getElementById("redeem-input");
    const redeemBtn = document.getElementById("primary-cta");

    if (input && redeemBtn) {
      const hasValue = input.value.trim().length > 0;
      redeemBtn.disabled = !hasValue;
      redeemBtn.style.opacity = hasValue ? "1" : "0.5";
    }
  }

  async redeemCode() {
    const input = document.getElementById("redeem-input");
    const redeemBtn = document.getElementById("primary-cta");

    // Use validation messages from API
    if (!input || !input.value.trim()) {
      const emptyMessage =
        this.validationMessages?.empty || "Please enter a referral code";
      ReferralUtils.showToast(emptyMessage);
      return;
    }

    const code = input.value.trim();

    // Disable button during processing
    if (redeemBtn) {
      redeemBtn.disabled = true;
      redeemBtn.textContent = "Redeeming...";
    }

    try {
      // Call the checkredeem API
      const endpoint = `/api/checkredeem?lang=${this.params.language}`;
      const body = {
        app_package_name: this.params.app_package_name,
        user_id: this.params.userId,
        code: code,
      };

      const result = await ReferralUtils.makeApiCall(endpoint, "POST", body);

      if (result.success || result.status === "success") {
        // Mark as redeemed and save to localStorage
        console.log(
          "ReferralRedeemPage: Successful redemption, saving to localStorage",
        );
        this.data.alreadyRedeemed = true;
        this.saveRedemptionData(true);
        this.showSuccessState(result);
      } else {
        // Handle different validation states
        let errorMessage = result.message;
        if (result.validation_state === "expired") {
          errorMessage = this.validationMessages?.expired || errorMessage;
        } else if (result.validation_state === "invalid") {
          errorMessage = this.validationMessages?.invalid || errorMessage;
        }
        throw new Error(errorMessage || "Failed to redeem code");
      }
    } catch (error) {
      console.error("Redeem error:", error);
      ReferralUtils.showToast(
        error.message || "Failed to redeem code. Please try again.",
      );
    } finally {
      // Re-enable button
      if (redeemBtn) {
        redeemBtn.disabled = false;
        const pageData =
          this.data.data?.page4_referralRedeem || this.data.data || this.data;
        const redeem = pageData.redeem || {};
        redeemBtn.textContent = redeem.primary_cta || "This is a placeholder";
      }
    }
  }

  showSuccessState(result) {
    console.log(
      "ReferralRedeemPage: Showing success state and updating localStorage",
    );
    console.log("API result:", result);

    // Extract referrer_name from the API response
    const referrerName = result.referrer_name || "your friend";
    console.log("Referrer name from API:", referrerName);

    // Update localStorage data with personalized referrer_name
    if (referrerName && referrerName !== "your friend") {
      this.personalizeDataWithReferrerName(referrerName);
    }

    // Mark as redeemed and save to localStorage immediately
    this.data.alreadyRedeemed = true;
    this.saveRedemptionData(true);

    // Replace primary CTA button immediately
    this.replacePrimaryCTAButton();

    // Replace the entire page content with success state
    this.renderAlreadyRedeemedState();
  }

  // Personalize data by replacing {{referrer_name}} placeholders
  personalizeDataWithReferrerName(referrerName) {
    console.log("Personalizing data with referrer name:", referrerName);

    const pageData =
      this.data.data?.page4_referralRedeem || this.data.data || this.data;
    const successData = pageData.redeem?.redemptionSuccess;

    if (successData) {
      // Update subtitle
      if (
        successData.subtitle &&
        successData.subtitle.includes("{{referrer_name}}")
      ) {
        const originalSubtitle = successData.subtitle;
        successData.subtitle = successData.subtitle.replace(
          /\{\{referrer_name\}\}/g,
          referrerName,
        );
        console.log(
          "Updated subtitle from:",
          originalSubtitle,
          "to:",
          successData.subtitle,
        );
      }

      // Update nudges array
      if (successData.nudges && Array.isArray(successData.nudges)) {
        successData.nudges = successData.nudges.map((nudge) => {
          if (
            typeof nudge === "string" &&
            nudge.includes("{{referrer_name}}")
          ) {
            const originalNudge = nudge;
            const updatedNudge = nudge.replace(
              /\{\{referrer_name\}\}/g,
              referrerName,
            );
            console.log(
              "Updated nudge from:",
              originalNudge,
              "to:",
              updatedNudge,
            );
            return updatedNudge;
          }
          return nudge;
        });
      }

      console.log("Personalized success data:", successData);
    }
  }

  showError(message) {
    const loader = document.getElementById("page-loader");
    if (loader) {
      loader.innerHTML = `
        <div class="error-state">
          <p class="error-message">${message}</p>
          <button class="btn btn-primary" onclick="location.reload()">Try Again</button>
        </div>
      `;
    }
  }

  // Replace primary CTA button based on redemption status
  replacePrimaryCTAButton() {
    const primaryCta = document.getElementById("primary-cta");
    if (!primaryCta) return;

    const pageData =
      this.data.data?.page4_referralRedeem || this.data.data || this.data;
    const successData = pageData.redeem?.redemptionSuccess || {};

    // Create new premium button
    const premiumButton = document.createElement("button");
    premiumButton.id = "primary-cta-premium";
    premiumButton.className = primaryCta.className; // Copy existing classes
    premiumButton.textContent =
      successData.primary_cta || "Unlock 1 Week Premium 🎉";

    // Copy styles from original button
    premiumButton.style.cssText = primaryCta.style.cssText;

    // Apply theme colors if available
    if (typeof THEME_ONE !== "undefined") {
      premiumButton.style.background = `linear-gradient(135deg, ${THEME_ONE.gradientBG[0]}, ${THEME_ONE.gradientBG[1]})`;
      premiumButton.style.color = THEME_ONE.textColor;
    } else {
      premiumButton.style.background =
        "linear-gradient(135deg, #4fd1c7 0%, #38b2ac 100%)";
      premiumButton.style.color = "white";
    }
    premiumButton.style.fontWeight = "600";

    // Add click handler for deeplink
    premiumButton.addEventListener("click", () => {
      const deeplink = "riafy.me/buy1weekpremium";
      ReferralUtils.showToast(deeplink);
      console.log("Premium button clicked, deeplink:", deeplink);
    });

    // Replace the button
    primaryCta.parentNode.replaceChild(premiumButton, primaryCta);
    console.log("Replaced primary-cta with primary-cta-premium");
  }

  // Render the already redeemed state (success page)
  renderAlreadyRedeemedState() {
    console.log("ReferralRedeemPage: Rendering already redeemed state");

    // Set scrollable-content background color to pastelBG
    const scrollableContent = document.querySelector(".scrollable-content");
    if (scrollableContent && typeof THEME_ONE !== "undefined") {
      scrollableContent.style.backgroundColor = THEME_ONE.pastelBG;
    }

    // Get redemption success data
    const pageData =
      this.data.data?.page4_referralRedeem || this.data.data || this.data;
    const successData = pageData.redeem?.redemptionSuccess || {};

    console.log("Success data for rendering:", successData);

    // Update header title to match the success state
    const headerTitle = document.getElementById("header-title");
    if (headerTitle) {
      headerTitle.textContent = "Redeem Referral Code"; // Keep header consistent
    }

    // Get content wrapper and completely replace with success UI
    const contentWrapper = document.getElementById("page-content-wrapper");
    if (!contentWrapper) return;

    // Replace entire content with success state matching the screenshot
    contentWrapper.innerHTML = `
      <!-- Success State Content -->
      <section class="success-section" style="text-align: center; padding: 0rem 1rem 4rem; min-height: 70vh; display: flex; flex-direction: column; justify-content: center;">

        <!-- Success image with crown -->
        <div class="success-image-container" style="width: 280px; height: 280px; margin: 0 auto 0; border-radius: 16px; display: flex; align-items: center; justify-content: center;">
          <img src="images/crown.png" alt="Success Crown" style="width: 250px; height: 250px; object-fit: contain;" />
        </div>

        <!-- Main success title -->
        <h1 class="success-title" style="font-size: 2rem; font-weight: 700; color: #1a202c; margin-bottom: 1rem; line-height: 1.2;">
          ${successData.hero_title || "You're all set!"}
        </h1>

        <!-- Success subtitle -->
        <p class="success-subtitle" style="font-size: 1rem; color: #718096; line-height: 1.5; margin-bottom: 2.5rem; max-width: 300px; margin-left: auto; margin-right: auto;">
          ${successData.subtitle || "You have redeemed a valid referral code from John!"}
        </p>

        <!-- Info nudge with icon -->
        <div id="info-nudge-component" class="info-nudge" style="background: linear-gradient(135deg, #FEF3E2 0%, #FDE8CC 100%); border: 1px solid #F59E0B; border-radius: 12px; padding: 1.25rem;  display: flex; align-items: flex-start; gap: 0.75rem; max-width: 350px; margin-left: auto; margin-right: auto;">
          <div class="info-icon" style="color: ${typeof THEME_ONE !== "undefined" ? THEME_ONE.secondaryTextColor : "#676767"}; margin-top: 0.125rem; flex-shrink: 0;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <span class="info-text" style="color: ${typeof THEME_ONE !== "undefined" ? THEME_ONE.secondaryTextColor : "#676767"}; font-size: 0.875rem; line-height: 1.4; text-align: left;">
            ${(successData.nudges && successData.nudges[0]) || "Your redemption also helps John progress toward a reward."}
          </span>
        </div>
      </section>
    `;

    // Check if we need to replace the footer CTA button
    const footerCTA = document.getElementById("primary-cta");
    const footerPremiumCTA = document.getElementById("primary-cta-premium");

    if (footerCTA && !footerPremiumCTA) {
      // Replace with premium button if not already replaced
      this.replacePrimaryCTAButton();
    } else if (footerPremiumCTA) {
      // Update existing premium button
      footerPremiumCTA.textContent =
        successData.primary_cta || "Unlock 1 Week Premium 🎉";
      footerPremiumCTA.disabled = false;
    }

    console.log("Successfully rendered already redeemed state");

    // Trigger success animation (confetti + audio) after a short delay
    setTimeout(() => {
      this.showSuccessAnimation();
    }, 500);
  }
}

// Initialize page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ReferralRedeemPage();
});
