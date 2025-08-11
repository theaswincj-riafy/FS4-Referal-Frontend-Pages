// Referral Status Page Logic
class ReferralStatusPage {
  constructor() {
    this.data = null;
    this.params = ReferralUtils.getUrlParams();
    this.currentCardIndex = 0;
    this.preloadedImages = [];
    this.swipeAudio = null;
    this.completedAudio = null;
    this.confettiInstance = null;
    this.init();
  }

  // Simple encryption for localStorage keys (same as referralRedeem)
  encrypt(text) {
    try {
      if (!text) return "";
      const shifted = text
        .toString()
        .split("")
        .map((char) => String.fromCharCode(char.charCodeAt(0) + 3))
        .join("");
      return btoa(shifted);
    } catch (error) {
      console.error("Encryption error:", error);
      return btoa(text.toString());
    }
  }

  // Simple decryption
  decrypt(encryptedText) {
    try {
      if (!encryptedText) return "";
      const decoded = atob(encryptedText);
      return decoded
        .split("")
        .map((char) => String.fromCharCode(char.charCodeAt(0) - 3))
        .join("");
    } catch (error) {
      console.error("Decryption failed:", error);
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
    return `referralStatus_${userId}_${appName}`;
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
        // Parse as plain JSON
        const parsedData = JSON.parse(storedData);
        console.log(
          "Successfully parsed data, alreadyRedeemed:",
          parsedData.alreadyRedeemed,
        );
        return parsedData.alreadyRedeemed === true;
      } catch (error) {
        console.error("Failed to parse stored status data:", error);
        // Clean up corrupted data
        localStorage.removeItem(storageKey);
        return false;
      }
    }
    return false;
  }

  // Save status data to localStorage
  saveStatusData(alreadyRedeemed = false) {
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

      // Try to save as plain JSON
      localStorage.setItem(storageKey, jsonString);
      console.log("Status data saved to localStorage with key:", storageKey);

      // Verify the save worked
      const verification = localStorage.getItem(storageKey);
      console.log("Verification - stored data exists:", !!verification);
    } catch (error) {
      console.error("Failed to save status data:", error);
    }
  }

  // Get stored status data
  getStoredStatusData() {
    const storageKey = this.getStorageKey();
    const storedData = localStorage.getItem(storageKey);

    if (storedData) {
      try {
        // Parse as plain JSON
        const parsedData = JSON.parse(storedData);
        return parsedData.data || parsedData; // Return the actual data part
      } catch (error) {
        console.error("Failed to parse stored status data:", error);
        // Clean up corrupted data
        localStorage.removeItem(storageKey);
        return null;
      }
    }
    return null;
  }

  async init() {
    try {
      console.log(
        "ReferralStatusPage: Starting init with params:",
        this.params,
      );

      // Set dynamic loading text
      const loadingTextElement = document.getElementById("loading-text");
      if (loadingTextElement) {
        loadingTextElement.textContent = ReferralUtils.getRandomLoadingText();
      }

      // Clean up any old localStorage entries first
      this.cleanupStorageKeys();

      // Check if user has already redeemed
      const alreadyRedeemed = this.checkAlreadyRedeemed();
      console.log(
        "ReferralStatusPage: Already redeemed check result:",
        alreadyRedeemed,
      );

      if (alreadyRedeemed) {
        // Load stored data and render success state
        const storedData = this.getStoredStatusData();
        console.log(
          "ReferralStatusPage: Stored data found, rendering success state",
        );
        if (storedData) {
          this.data = storedData;
          this.loadThemeColors();
          this.hideLoader();
          this.renderAlreadyRedeemedState();
          return;
        }
      }

      // Normal flow - load fresh data
      console.log("ReferralStatusPage: Loading fresh data from API");
      await this.loadPageData();
      if (this.data) {
        await this.preloadAssets();
        // Check current_redemptions from API to determine alreadyRedeemed status
        const currentRedemptions = this.data.data?.current_redemptions || 0;
        const shouldBeRedeemed = currentRedemptions >= 5;
        console.log(
          "Current redemptions:",
          currentRedemptions,
          "Should be redeemed:",
          shouldBeRedeemed,
        );

        // Set alreadyRedeemed based on current_redemptions
        this.data.alreadyRedeemed = shouldBeRedeemed;
        this.saveStatusData(shouldBeRedeemed);

        if (shouldBeRedeemed) {
          console.log(
            "ReferralStatusPage: current_redemptions >= 5, showing success state",
          );
          this.loadThemeColors();
          this.hideLoader();
          this.renderAlreadyRedeemedState();
          return;
        }

        this.populateContent();
        this.loadThemeColors();
        this.hideLoader();
        this.initCardStack();
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
        const language = this.params.language || "en";
        const endpoint = `/api/referral-status?lang=${language}`;
        const body = {
          app_package_name: this.params.app_package_name,
          username: this.params.firstname,
          user_id: this.params.userId,
        };

        // Add FCM token to request body if provided via URL parameter
        if (this.params.fb_token) {
          body.fb_token = this.params.fb_token;
          console.log("FCM Token included in request:", this.params.fb_token);
        }

        console.log("Making API call to:", endpoint);
        console.log("Request body:", body);

        this.data = await ReferralUtils.makeApiCall(endpoint, "POST", body);
        console.log("Loaded API data:", this.data);
      } catch (apiError) {
        console.warn("API call failed, using fallback data:", apiError);
        // Fallback to local mock data
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
        page_title: "My Referrals",
        hero: {
          page_title: "My Referrals",
        },
        status: {
          current: 1,
          target: 5,
        },
        milestones: [
          {
            level: 1,
            title: "The Kickoff",
            message: `Your first referral is in! Great work, ${ReferralUtils.capitalizeName(this.params.firstname)}! You've started your Premium journey.`,
            achievedOn: "9 August",
          },
          {
            level: 2,
            title: "Building Momentum",
            message: "Two friends on board! You're warming up nicely.",
          },
          {
            level: 3,
            title: "Halfway Hero",
            message: "Three redemptions—more than halfway to your goal!",
          },
          {
            level: 4,
            title: "Almost There",
            message: "Four done! Just one more to unlock Premium.",
          },
          {
            level: 5,
            title: "Premium Unlocked 🎉",
            message:
              "Congratulations! You've completed your referral goal and earned 1 month of Premium.",
          },
        ],
        faq: [
          { a: "No—only totals. We don't store redeemer identities." },
          {
            a: "Instantly after 5 redemptions. You'll get an in-app confirmation.",
          },
        ],
        progress_teaser: {
          title: "Only 4 more levels to go!",
          subtitle: "Each redemption brings you closer to Premium!",
        },
        benefits: [
          {
            title: "Premium Access",
            desc: "Ad-free experience, pro features, and priority support for 1 month.",
          },
          {
            title: "Win Together",
            desc: "Your friends get an exclusive newcomer perk when they join via your link.",
          },
          {
            title: "Fast & Simple",
            desc: "Share your link; they download and redeem. You progress instantly.",
          },
        ],
        tips: [
          { text: "Remind friends it takes less than a minute to redeem." },
        ],
      },
    };
  }

  // Preload images and audio used in this page
  async preloadAssets() {
    try {
      console.log("Preloading assets for referralStatus page...");

      // Images used in this page - all level images and avatars
      const imagesToPreload = [
        "images/level0tp.png",
        "images/level1tp.png",
        "images/level2tp.png",
        "images/level3tp.png",
        "images/level4tp.png",
        "images/level5tp.png",
        "images/locks1tp.png",
        "images/locks2tp.png",
        "images/locks3tp.png",
        "images/locks4tp.png",
        "images/locks5tp.png",
        "images/avatar1tp.png",
        "images/avatar2tp.png",
        "images/avatar5tp.png",
      ];

      // Preload images
      const imagePromises = imagesToPreload.map((src) => {
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

      // Preload audio files
      this.swipeAudio = new Audio("audio/swipe1.mp3");
      this.swipeAudio.preload = "auto";
      this.swipeAudio.volume = 0.7;

      this.completedAudio = new Audio("audio/completed3.mp3");
      this.completedAudio.preload = "auto";
      this.completedAudio.volume = 0.8;

      console.log("Assets preloaded successfully for referralStatus");
    } catch (error) {
      console.error("Error preloading assets:", error);
    }
  }

  // Play swipe sound
  playSwipeSound() {
    try {
      if (this.swipeAudio && this.swipeAudio.readyState >= 2) {
        this.swipeAudio.currentTime = 0;
        this.swipeAudio
          .play()
          .catch((e) => console.log("Audio play failed:", e));
      }
    } catch (error) {
      console.error("Error playing swipe sound:", error);
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
        this.completedAudio
          .play()
          .catch((e) => console.log("Audio play failed:", e));
      }
    } catch (error) {
      console.error("Error playing completed sound:", error);
    }
  }

  // Create confetti animation using react-confetti library with wind effects
  createConfettiAnimation() {
    try {
      console.log("🎉 [CONFETTI] Starting createConfettiAnimation...");

      // Remove any existing confetti
      this.removeConfettiAnimation();

      // Create confetti container
      const confettiContainer = document.createElement("div");
      confettiContainer.id = "confetti-container";
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
      console.log("🎉 [CONFETTI] Container created and added to DOM");

      // Try canvas-confetti library instead (more reliable)
      console.log(
        "🎉 [CONFETTI] Attempting to import canvas-confetti from CDN...",
      );
      import("https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/+esm")
        .then((confettiModule) => {
          console.log(
            "🎉 [CONFETTI] Canvas-confetti module imported successfully:",
            confettiModule,
          );
          console.log("🎉 [CONFETTI] Module default:", confettiModule.default);
          console.log(
            "🎉 [CONFETTI] Module type:",
            typeof confettiModule.default,
          );

          const confetti = confettiModule.default;

          if (typeof confetti !== "function") {
            console.error(
              "🎉 [CONFETTI] ERROR: confetti is not a function:",
              confetti,
            );
            throw new Error("canvas-confetti is not a function");
          }

          console.log("🎉 [CONFETTI] Starting canvas-confetti animation...");

          // Fire confetti with wind-like effects
          const count = 200;
          const defaults = {
            origin: { y: 0.7 },
            colors: [
              "#f43f5e",
              "#ef4444",
              "#f97316",
              "#eab308",
              "#22c55e",
              "#06b6d4",
              "#3b82f6",
              "#8b5cf6",
              "#ec4899",
            ],
          };

          function fire(particleRatio, opts) {
            confetti(
              Object.assign({}, defaults, opts, {
                particleCount: Math.floor(count * particleRatio),
              }),
            );
          }

          // Fire multiple bursts with different angles for wind effect
          fire(0.25, {
            spread: 26,
            startVelocity: 55,
            drift: -1,
          });
          fire(0.2, {
            spread: 60,
            drift: 1,
          });
          fire(0.35, {
            spread: 100,
            decay: 0.91,
            scalar: 0.8,
            drift: -0.5,
          });
          fire(0.1, {
            spread: 120,
            startVelocity: 25,
            decay: 0.92,
            scalar: 1.2,
            drift: 0.5,
          });
          fire(0.1, {
            spread: 120,
            startVelocity: 45,
            drift: 0,
          });

          console.log(
            "🎉 [CONFETTI] Canvas-confetti animation started successfully!",
          );
        })
        .catch((error) => {
          console.error(
            "🎉 [CONFETTI] ERROR: Failed to load canvas-confetti, using fallback:",
            error,
          );
          console.error(
            "🎉 [CONFETTI] Error details:",
            error.message,
            error.stack,
          );
          this.createFallbackConfetti();
        });

      // Auto-remove after 6 seconds
      setTimeout(() => {
        console.log("🎉 [CONFETTI] Auto-removing confetti after 6 seconds");
        this.removeConfettiAnimation();
      }, 6000);
    } catch (error) {
      console.error(
        "🎉 [CONFETTI] OUTER ERROR creating confetti animation:",
        error,
      );
      this.createFallbackConfetti();
    }
  }

  // Fallback confetti with simple falling animation
  createFallbackConfetti() {
    try {
      console.log("🎉 [FALLBACK] Creating fallback confetti animation...");

      const confettiContainer = document.getElementById("confetti-container");
      if (!confettiContainer) {
        console.error("🎉 [FALLBACK] ERROR: No confetti container found");
        return;
      }

      // Add CSS animations for simple falling confetti
      const style = document.createElement("style");
      style.id = "confetti-styles";
      style.textContent = `
        @keyframes confetti-fall {
          0% {
            transform: translateY(-20px) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        
        .confetti-particle {
          position: absolute;
          animation: confetti-fall 3s linear forwards;
        }
      `;
      document.head.appendChild(style);
      console.log("🎉 [FALLBACK] CSS styles added");

      const colors = [
        "#f43f5e",
        "#ef4444",
        "#f97316",
        "#eab308",
        "#22c55e",
        "#06b6d4",
        "#3b82f6",
        "#8b5cf6",
        "#ec4899",
      ];

      // Create all particles simultaneously falling straight down with varied shapes
      for (let i = 0; i < 150; i++) {
        const particle = document.createElement("div");
        particle.className = "confetti-particle";

        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 8 + 4;
        const leftPosition = Math.random() * 100;
        const animationDelay = Math.random() * 0.5; // Small random delay for natural effect
        const animationDuration = 2 + Math.random() * 2; // 2-4 second fall time

        // Create varied shapes: circle, square, triangle, diamond, star
        const shapeType = Math.floor(Math.random() * 5);
        let shapeCSS = "";

        switch (shapeType) {
          case 0: // Circle
            shapeCSS = `border-radius: 50%;`;
            break;
          case 1: // Square (default)
            shapeCSS = `border-radius: 0;`;
            break;
          case 2: // Triangle
            shapeCSS = `
              width: 0;
              height: 0;
              border-left: ${size / 2}px solid transparent;
              border-right: ${size / 2}px solid transparent;
              border-bottom: ${size}px solid ${color};
              background-color: transparent;
            `;
            break;
          case 3: // Diamond
            shapeCSS = `
              transform: rotate(45deg);
              border-radius: 0;
            `;
            break;
          case 4: // Star
            shapeCSS = `
              clip-path: polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
            `;
            break;
        }

        particle.style.cssText = `
          left: ${leftPosition}%;
          top: -20px;
          width: ${shapeType === 2 ? "0" : size + "px"};
          height: ${shapeType === 2 ? "0" : size + "px"};
          background-color: ${shapeType === 2 ? "transparent" : color};
          ${shapeCSS}
          opacity: 0.9;
          animation-delay: ${animationDelay}s;
          animation-duration: ${animationDuration}s;
          position: absolute;
        `;

        confettiContainer.appendChild(particle);
      }

      console.log(
        "🎉 [FALLBACK] Fallback confetti animation started with 150 particles",
      );
    } catch (error) {
      console.error("🎉 [FALLBACK] ERROR creating fallback confetti:", error);
    }
  }

  // Remove confetti animation
  removeConfettiAnimation() {
    // Stop confetti instance if it exists
    if (
      this.confettiInstance &&
      typeof this.confettiInstance.stop === "function"
    ) {
      this.confettiInstance.stop();
    }

    // Remove DOM elements
    const existing = document.getElementById("confetti-container");
    if (existing) {
      existing.remove();
    }
    const styles = document.getElementById("confetti-styles");
    if (styles) {
      styles.remove();
    }
    this.confettiInstance = null;
  }

  populateContent() {
    if (!this.data) {
      console.error("No data available for rendering");
      return;
    }

    // Extract data from API response structure according to the mapping specification
    const pageData = this.data.data || this.data;
    const referralStatusData = pageData.page2_referralStatus || {};
    const hero = referralStatusData.hero || {};
    const status = referralStatusData.status || {};
    const milestones = referralStatusData.milestones || [];
    const faqs = referralStatusData.faq || [];
    const progress = referralStatusData.progress_teaser || {};
    const benefits = referralStatusData.benefits || [];
    const nudges = referralStatusData.nudges || [];

    // Get template replacement values
    const currentRedemptions = pageData.current_redemptions || 0;
    const pendingRedemptions = pageData.pending_redemptions || 0;
    const referrerName = pageData.referrer_name || "You";

    // 1. Populate header with hero.page_title
    document.getElementById("header-title").textContent =
      hero.page_title || "This is a placeholder";

    // 2. Find current milestone for hero section using milestones array
    const currentMilestone =
      milestones.find((m) => m.level === currentRedemptions) ||
      milestones[0] ||
      {};

    // Use Level + current_redemptions for level-title
    document.getElementById("level-title").textContent =
      `Level ${currentRedemptions}`;

    // Use currentMilestone title and message for subtitle and message
    document.getElementById("level-subtitle").textContent =
      currentMilestone.title || "This is a placeholder";

    let heroMessage =
      hero.subtitle || currentMilestone.message || "This is a placeholder";
    heroMessage = heroMessage
      .replace(/\{\{current_redemptions\}\}/g, currentRedemptions)
      .replace(/\{\{pending_redemptions\}\}/g, pendingRedemptions)
      .replace(/\{\{referrer_name\}\}/g, referrerName);
    document.getElementById("level-message").textContent = heroMessage;

    // Use status.progress_text for progress display with template replacement
    let progressText = status.progress_text || "This is a placeholder";
    progressText = progressText
      .replace(/\{\{current_redemptions\}\}/g, currentRedemptions)
      .replace(/\{\{target_redemptions\}\}/g, 5)
      .replace(/\{\{pending_redemptions\}\}/g, pendingRedemptions);
    document.getElementById("progress-display-status").textContent =
      progressText;

    // Use hero.quickButtonText for invite button
    document
      .getElementById("invite-friends")
      .querySelector("span").textContent =
      "Invite Friends" || "This is a placeholder";

    // Update hero image based on current_redemptions
    const heroImage = document.getElementById("hero-image");
    if (heroImage) {
      const imageMap = {
        0: "images/level0tp.png",
        1: "images/level1tp.png",
        2: "images/level2tp.png",
        3: "images/level3tp.png",
        4: "images/level4tp.png",
        5: "images/level5tp.png",
      };

      const imageSrc = imageMap[currentRedemptions] || "images/level1tp.png";
      heroImage.src = imageSrc;
    }

    // Show/hide level-title based on current_redemptions
    const levelTitle = document.getElementById("level-title");
    if (levelTitle) {
      if (currentRedemptions === 0) {
        levelTitle.style.display = "none";
      } else {
        levelTitle.style.display = "block";
      }
    }

    // Get redeem_dates from API response
    const redeemDates = pageData.redeem_dates || {};

    // 3. Populate milestones (levels 1-5 only, ignore level 0)
    if (milestones.length > 0) {
      milestones
        .filter((milestone) => milestone.level >= 1 && milestone.level <= 5)
        .forEach((milestone) => {
          const milestoneElement = document.getElementById(
            `milestone-${milestone.level}`,
          );
          if (milestoneElement) {
            const iconElement =
              milestoneElement.querySelector(".milestone-icon");
            const contentElement =
              milestoneElement.querySelector(".milestone-content");

            // Check if this level is completed based on current_redemptions
            if (milestone.level <= currentRedemptions) {
              milestoneElement.classList.add("completed");
              if (iconElement) {
                iconElement.innerHTML = `<img src="images/level${milestone.level}tp.png" alt="Level ${milestone.level} Unlocked" style="width: 90px; height: 90px; object-fit: contain; margin-left: 20px;">`;
              }
            } else {
              milestoneElement.classList.remove("completed");
              if (iconElement) {
                iconElement.innerHTML = `<img src="images/locks${milestone.level}tp.png" alt="Level ${milestone.level} Locked" style="width: 100px; height: 100px; object-fit: contain;">`;
              }
            }

            // Add premium class only to milestone-5 if current_redemptions equals 5
            if (milestone.level === 5 && currentRedemptions === 5) {
              milestoneElement.classList.add("premium");
            } else if (milestone.level === 5) {
              milestoneElement.classList.remove("premium");
            }

            if (contentElement) {
              const titleElement = contentElement.querySelector("h3");
              const statusElement = contentElement.querySelector("p");

              // 2b. String combine milestone's current_level + title for h3 tag
              if (titleElement) {
                // Use the actual milestone level, not current_redemptions
                let levelTitle =
                  milestone.current_level || `Level ${milestone.level}`;
                // Replace template variables with actual milestone level, not current_redemptions
                levelTitle = levelTitle.replace(
                  /\{\{current_redemptions\}\}/g,
                  milestone.level,
                );
                titleElement.textContent = `${levelTitle} - ${milestone.title}`;
              }

              // 2c. Use redeem_dates for completed milestones, otherwise use "Pending"
              if (statusElement) {
                let achievementDate = "Pending";

                // If milestone is completed (level <= current_redemptions), try to get date from redeem_dates
                if (milestone.level <= currentRedemptions) {
                  const dateKey = `date_${milestone.level}`;
                  achievementDate = redeemDates[dateKey] || "Pending";
                }

                statusElement.textContent = achievementDate;
              }
            }
          }
        });
    }

    // 4. Populate FAQs with correct mapping (q for h3, a for p)
    if (faqs.length > 0) {
      faqs.forEach((faq, index) => {
        const faqItem = document.querySelectorAll(".faq-item")[index];
        if (faqItem) {
          const questionElement = faqItem.querySelector("h3");
          const answerElement = faqItem.querySelector("p");

          if (questionElement)
            questionElement.textContent = faq.q || "This is a placeholder";
          if (answerElement) {
            let answer = faq.a || "This is a placeholder";
            // Replace template variables in FAQ answers
            answer = answer
              .replace(/\{\{target_redemptions\}\}/g, 5)
              .replace(/\{\{current_redemptions\}\}/g, currentRedemptions)
              .replace(/\{\{pending_redemptions\}\}/g, pendingRedemptions);
            answerElement.textContent = answer;
          }
        }
      });
    }

    // 5. Populate progress section using progress_teaser with template replacement
    let progressTitle = progress.title || "This is a placeholder";
    progressTitle = progressTitle
      .replace(/\{\{pending_redemptions\}\}/g, pendingRedemptions)
      .replace(/\{\{current_redemptions\}\}/g, currentRedemptions);
    document.getElementById("progress-title").textContent = progressTitle;

    let progressSubtitle = progress.subtitle || "This is a placeholder";
    progressSubtitle = progressSubtitle
      .replace(/\{\{pending_redemptions\}\}/g, pendingRedemptions)
      .replace(/\{\{current_redemptions\}\}/g, currentRedemptions);
    document.getElementById("progress-subtitle").textContent = progressSubtitle;

    // 6. Populate benefits cards with correct title/desc mapping
    if (benefits.length > 0) {
      benefits.forEach((benefit, index) => {
        const titleElement = document.getElementById(
          `benefit-${index + 1}-title`,
        );
        const descElement = document.getElementById(
          `benefit-${index + 1}-desc`,
        );

        // Correct mapping: benefit.title goes to title element, benefit.desc goes to desc element
        if (titleElement)
          titleElement.textContent = benefit.title || "This is a placeholder";
        if (descElement)
          descElement.textContent = benefit.desc || "This is a placeholder";
      });
    }

    // 7. Randomly select one nudge for tip text
    if (nudges.length > 0) {
      const randomNudge = nudges[Math.floor(Math.random() * nudges.length)];
      document.getElementById("tip-text").textContent =
        randomNudge || "This is a placeholder";
    }
  }

  hideLoader() {
    const loader = document.getElementById("page-loader");
    const content = document.getElementById("page-content-wrapper");

    if (loader) loader.style.display = "none";
    if (content) content.style.display = "block";
  }

  initCardStack() {
    const container = document.getElementById("card-stack");
    if (!container) return;

    // Apply dynamic colors to cards and adjust heights
    this.applyCardColors();
    this.adjustCardHeights();

    // Initialize the new card swiper system
    this.initReferralCardSwiper(container);
  }

  applyCardColors() {
    const cards = document.querySelectorAll(".benefit-card");
    const usedColorIndices = new Set();

    cards.forEach((cardElement, index) => {
      // Apply dynamic color combination to each card (ensure unique colors)
      if (cardElement) {
        let colorIndex;
        do {
          colorIndex = Math.floor(Math.random() * COLOR_COMBOS.length);
        } while (
          usedColorIndices.has(colorIndex) &&
          usedColorIndices.size < COLOR_COMBOS.length
        );

        usedColorIndices.add(colorIndex);
        const colorCombo = COLOR_COMBOS[colorIndex];
        const gradientBG = colorCombo.gradientBG;
        const textColor = colorCombo.textColor;

        cardElement.style.background = `linear-gradient(135deg, ${gradientBG[0]}, ${gradientBG[1]})`;
        cardElement.style.color = textColor;

        // Also apply color to child elements
        const titleElement = cardElement.querySelector(".benefit-card-title");
        const descElement = cardElement.querySelector(".benefit-card-desc");
        if (titleElement) titleElement.style.color = textColor;
        if (descElement) descElement.style.color = textColor;
      }
    });
  }

  adjustCardHeights() {
    // Wait for next frame to ensure content is rendered
    requestAnimationFrame(() => {
      const cards = document.querySelectorAll(".benefit-card");
      if (cards.length === 0) return;

      // First, adjust font sizes for titles that are too long
      cards.forEach((card) => {
        this.adjustCardTitleFontSize(card);
      });

      // Remove text truncation temporarily to measure natural content height
      cards.forEach((card) => {
        const descElement = card.querySelector(".benefit-card-desc");
        if (descElement) {
          descElement.style.webkitLineClamp = "unset";
          descElement.style.display = "block";
          descElement.style.overflow = "visible";
        }
        card.style.height = "auto";
      });

      // Find the tallest card with full content
      let maxHeight = 0;
      cards.forEach((card) => {
        const cardHeight = card.scrollHeight;
        if (cardHeight > maxHeight) {
          maxHeight = cardHeight;
        }
      });

      // Ensure minimum height for visual consistency
      const minHeight = 200;
      maxHeight = Math.max(maxHeight, minHeight);

      // Apply the max height to all cards and restore proper text display
      cards.forEach((card) => {
        card.style.height = `${maxHeight}px`;
        const descElement = card.querySelector(".benefit-card-desc");
        if (descElement) {
          // Remove the line clamp restriction since we now have enough space
          descElement.style.webkitLineClamp = "unset";
          descElement.style.display = "block";
          descElement.style.overflow = "visible";
        }
      });
    });
  }

  adjustCardTitleFontSize(card) {
    const titleElement = card.querySelector(".benefit-card-title");
    if (!titleElement) return;

    // Reset to initial font size first
    titleElement.style.fontSize = "";

    const maxWidth = card.offsetWidth - 40; // Account for padding (20px each side)
    const maxHeight = 60; // Maximum height for title area

    // Start with the default font size from CSS (1.5rem = 24px)
    let fontSize = 24;
    const minFontSize = 18; // Minimum readable size

    titleElement.style.fontSize = fontSize + "px";

    // Check if title overflows and reduce font size if needed
    while (
      (titleElement.scrollWidth > maxWidth ||
        titleElement.scrollHeight > maxHeight) &&
      fontSize > minFontSize
    ) {
      fontSize -= 1;
      titleElement.style.fontSize = fontSize + "px";
    }

    // If still overflowing at minimum size, try line clamping
    if (titleElement.scrollHeight > maxHeight && fontSize === minFontSize) {
      titleElement.style.display = "-webkit-box";
      titleElement.style.webkitLineClamp = "2";
      titleElement.style.webkitBoxOrient = "vertical";
      titleElement.style.overflow = "hidden";
      titleElement.style.lineHeight = "1.2";
    }
  }

  initReferralCardSwiper(container) {
    const cards = Array.from(container.querySelectorAll(".benefit-card"));
    console.log(
      "[CARD SWIPER] Initializing simple card swiper with",
      cards.length,
      "cards",
    );

    // Handle single card case
    if (cards.length <= 1) {
      const card = cards[0];
      if (card) {
        const waitForSingleCard = () => {
          const containerWidth = container.offsetWidth;
          if (containerWidth && containerWidth > 0) {
            const cardWidth = 180;
            const centerX = (containerWidth - cardWidth) / 2;
            gsap.set(card, {
              x: centerX,
              y: 40,
              rotation: 0,
              scale: 1,
              zIndex: 3,
              opacity: 0,
            });
            gsap.to(card, {
              opacity: 1,
              duration: 0.6,
              ease: "back.out(1.7)",
            });
          } else {
            setTimeout(waitForSingleCard, 50);
          }
        };
        requestAnimationFrame(() => setTimeout(waitForSingleCard, 10));
      }
      return;
    }

    let currentIndex = 0;
    let isAnimating = false;

    // Calculate card positions
    function calculatePositions() {
      const containerWidth = container.offsetWidth;
      if (!containerWidth || containerWidth <= 0) return null;

      const cardWidth = 180;
      const centerX = (containerWidth - cardWidth) / 2;
      const centerY = 40;
      const baseOffset = Math.min(60, Math.max(35, containerWidth * 0.12));
      const sideCardOffset = Math.min(20, Math.max(10, containerWidth * 0.035));
      const sideCardRotation = 18;

      return {
        center: {
          x: centerX,
          y: centerY,
          rotation: 0,
          zIndex: 100,
          scale: 1,
          opacity: 1,
        },
        right: {
          x: centerX + baseOffset,
          y: centerY + sideCardOffset,
          rotation: sideCardRotation,
          zIndex: 50,
          scale: 0.92,
          opacity: 0.8,
        },
        left: {
          x: centerX - baseOffset,
          y: centerY + sideCardOffset,
          rotation: -sideCardRotation,
          zIndex: 50,
          scale: 0.92,
          opacity: 0.8,
        },
        hidden: {
          x: centerX,
          y: centerY + Math.min(25, containerWidth * 0.05),
          rotation: 0,
          zIndex: 1,
          scale: 0.88,
          opacity: 0.5,
        },
      };
    }

    // Position cards based on current index
    function positionCards(animate = false) {
      const positions = calculatePositions();
      if (!positions) return;

      cards.forEach((card, index) => {
        const relativeIndex =
          (index - currentIndex + cards.length) % cards.length;
        let position;

        if (relativeIndex === 0) {
          position = positions.center;
        } else if (relativeIndex === 1) {
          position = positions.right;
        } else if (relativeIndex === cards.length - 1) {
          position = positions.left;
        } else {
          position = positions.hidden;
        }

        if (animate) {
          gsap.to(card, {
            ...position,
            duration: 0.4,
            ease: "power2.out",
          });
        } else {
          gsap.set(card, position);
        }
      });
    }

    // Next/previous functions
    const nextCard = () => {
      if (isAnimating) return;
      isAnimating = true;
      // Play swipe sound
      this.playSwipeSound();
      currentIndex = (currentIndex + 1) % cards.length;
      positionCards(true);
      setTimeout(() => {
        isAnimating = false;
      }, 400);
    };

    const prevCard = () => {
      if (isAnimating) return;
      isAnimating = true;
      // Play swipe sound
      this.playSwipeSound();
      currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      positionCards(true);
      setTimeout(() => {
        isAnimating = false;
      }, 400);
    };

    // Click handlers for side cards with rotation animation
    cards.forEach((card, index) => {
      card.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (isAnimating) return;

        const relativeIndex =
          (index - currentIndex + cards.length) % cards.length;
        if (relativeIndex === 1) {
          // Animate rotation before moving to next
          gsap.to(card, {
            rotation: "+=15",
            duration: 0.1,
            ease: "power2.out",
            onComplete: () => {
              gsap.to(card, {
                rotation: "-=15",
                duration: 0.1,
                ease: "power2.out",
              });
            },
          });
          nextCard();
        } else if (relativeIndex === cards.length - 1) {
          // Animate rotation before moving to previous
          gsap.to(card, {
            rotation: "-=15",
            duration: 0.1,
            ease: "power2.out",
            onComplete: () => {
              gsap.to(card, {
                rotation: "+=15",
                duration: 0.1,
                ease: "power2.out",
              });
            },
          });
          prevCard();
        }
      });
    });

    // Touch/swipe support for container
    let startX = 0;
    let isDragging = false;
    let dragCard = null;

    container.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
        isDragging = true;
        dragCard = cards[currentIndex];
      },
      { passive: true },
    );

    container.addEventListener(
      "touchmove",
      (e) => {
        if (!isDragging || !dragCard) return;

        const currentX = e.touches[0].clientX;
        const deltaX = currentX - startX;
        const maxDrag = 50;
        const clampedDelta = Math.max(-maxDrag, Math.min(maxDrag, deltaX));

        if (dragCard) {
          const positions = calculatePositions();
          if (positions) {
            gsap.set(dragCard, {
              x: positions.center.x + clampedDelta,
              rotation: clampedDelta * 0.3,
            });
          }
        }
      },
      { passive: true },
    );

    container.addEventListener(
      "touchend",
      (e) => {
        if (!isDragging) return;
        isDragging = false;

        const endX = e.changedTouches[0].clientX;
        const deltaX = endX - startX;
        const threshold = 50;

        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0) {
            prevCard();
          } else {
            nextCard();
          }
        } else {
          // Return card to center position
          positionCards(true);
        }

        dragCard = null;
        isDragging = false;
      },
      { passive: true },
    );

    // Initial positioning
    const waitForInitialPosition = () => {
      const containerWidth = container.offsetWidth;
      if (containerWidth && containerWidth > 0) {
        positionCards(false);
      } else {
        setTimeout(waitForInitialPosition, 50);
      }
    };

    requestAnimationFrame(() => setTimeout(waitForInitialPosition, 10));
  }

  bindEvents() {
    console.log("[BIND EVENTS] bindEvents called");

    // Back button
    const backBtn = document.getElementById("back-btn");
    console.log("[BIND EVENTS] backBtn element found:", !!backBtn);

    if (backBtn) {
      // Remove any existing listeners first
      backBtn.replaceWith(backBtn.cloneNode(true));
      const freshBackBtn = document.getElementById("back-btn");

      console.log("[BIND EVENTS] Adding click listener to back button");
      freshBackBtn.addEventListener("click", (e) => {
        console.log("[BACK BUTTON] referralStatus back button clicked");
        console.log(
          "[BACK BUTTON] alreadyRedeemed state:",
          this.data?.alreadyRedeemed || false,
        );
        console.log("[BACK BUTTON] userId:", this.params.userId);
        console.log("[BACK BUTTON] event object:", e);
        console.log("[BACK BUTTON] redirecting to index.html");
        window.location.href = "index.html";
      });

      // Test if element is clickable
      console.log(
        "[BIND EVENTS] Back button styles:",
        window.getComputedStyle(freshBackBtn).pointerEvents,
      );
      console.log(
        "[BIND EVENTS] Back button display:",
        window.getComputedStyle(freshBackBtn).display,
      );
    } else {
      console.error("[BIND EVENTS] Back button not found!");
    }

    // Invite friends button
    const inviteBtn = document.getElementById("invite-friends");
    if (inviteBtn) {
      inviteBtn.addEventListener("click", () => {
        window.location.href = `referralPromote.html?${new URLSearchParams(this.params).toString()}`;
      });
    }
  }

  loadThemeColors() {
    if (typeof THEME_ONE !== "undefined") {
      console.log("Loading THEME_ONE colors:", THEME_ONE);

      // Apply theme colors to hero-section background
      const heroSection = document.querySelector(".hero-section");
      if (heroSection) {
        heroSection.style.backgroundColor = THEME_ONE.pastelBG;
      }

      // Apply theme colors to progress-display
      const progressDisplay = document.getElementById(
        "progress-display-status",
      );
      if (progressDisplay) {
        progressDisplay.style.borderColor = THEME_ONE.border;
        progressDisplay.style.backgroundColor = THEME_ONE.pastelBGFill;
        progressDisplay.style.color = THEME_ONE.textColor;
      }

      // Apply theme colors to invite-friends button
      const inviteFriendsBtn = document.getElementById("invite-friends");
      if (inviteFriendsBtn) {
        inviteFriendsBtn.style.background = `linear-gradient(135deg, ${THEME_ONE.gradientBG[0]}, ${THEME_ONE.gradientBG[1]})`;
        inviteFriendsBtn.style.color = THEME_ONE.textColor;
      }
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

  // Show success state when already redeemed
  showSuccessState() {
    console.log(
      "ReferralStatusPage: Showing success state and updating localStorage",
    );

    // Mark as redeemed and save to localStorage immediately
    this.data.alreadyRedeemed = true;
    this.saveStatusData(true);

    // Replace the entire page content with success state
    this.renderAlreadyRedeemedState();
  }

  // Render the already redeemed state (success page)
  renderAlreadyRedeemedState() {
    console.log("ReferralStatusPage: Rendering already redeemed state");

    // Create mock redemption success data as specified
    const successData = {
      hero_title: "{{firstname}}, you have done it!",
      subtitle:
        "You have succesfully unlocked a whole month of Premium features. Claim your prize now! ",
      nudges: [
        "Follow up on your friends and family to see how much they liked the app!",
      ],
      primary_cta: "Unlock 1 Month Premium 🎉",
    };

    // Replace firstname placeholder with actual value and capitalize first letter
    const firstname = this.params.firstname || "User";
    const capitalizedFirstname =
      firstname.charAt(0).toUpperCase() + firstname.slice(1).toLowerCase();
    successData.hero_title = successData.hero_title.replace(
      "{{firstname}}, you have done it!",
      capitalizedFirstname + ",<br> you have done it!",
    );

    console.log("Success data for rendering:", successData);

    // Update header title to match the success state
    const headerTitle = document.getElementById("header-title");
    if (headerTitle) {
      headerTitle.textContent = "My Referrals"; // Keep header consistent
    }

    // Get content wrapper and completely replace with success UI
    const contentWrapper = document.getElementById("page-content-wrapper");
    if (!contentWrapper) return;

    // Replace entire content with success state matching referralRedeem success screen
    contentWrapper.innerHTML = `
      <!-- Success State Content -->
      <section class="success-section" style="text-align: center; padding: 5rem 1rem; min-height: 70vh; display: flex; flex-direction: column; justify-content: center;">

        <!-- Success image with crown -->
        <div class="success-image-container" style="width: 280px; height: 280px; margin: 0 auto 0; border-radius: 16px; display: flex; align-items: center; justify-content: center;">
          <img src="images/crown.png" alt="Success Crown" style="width: 250px; height: 250px; object-fit: contain;" />
        </div>

        <!-- Main success title -->
        <h1 class="success-title" style="font-size: 2rem; font-weight: 700; color: #1a202c; margin-bottom: 1rem; line-height: 1.2;">
          ${successData.hero_title}
        </h1>

        <!-- Success subtitle -->
        <p class="success-subtitle" style="font-size: 1rem; color: #86868b; line-height: 1.5; margin-bottom: 2.5rem; max-width: 300px; margin-left: auto; margin-right: auto;">
          ${successData.subtitle}
        </p>

        <!-- Bottom Status Pill (converted from info-nudge) -->
        <div class="bottom-status-pill" style="margin-bottom: 4rem; max-width: 350px; margin-left: auto; margin-right: auto;">
          <div class="pill-content">
            <div class="tip-icon"></div>
            <span id="tip-text" style="color: rgb(103, 103, 103);">
              ${successData.nudges[0]}
            </span>
          </div>
        </div>
      </section>

      <!-- Premium CTA Button -->
      <div class="fixed-footer" style="position: fixed; bottom: 0; left: auto; right: auto; padding: 16px 20px 32px; background: white; width: 390px; 
    background: #ffffff;
    border-top: 1px solid #e5e5ea;">
        <button id="primary-cta-premium" class="btn btn-primary" style="width: 100%; padding: 1rem; font-size: 1.125rem; font-weight: 600; border: none; border-radius: 12px; cursor: pointer;">
          ${successData.primary_cta}
        </button>
      </div>
    `;

    // Apply theme colors and bind click event to premium button
    const premiumBtn = document.getElementById("primary-cta-premium");
    if (premiumBtn) {
      // Apply theme colors to premium button
      if (typeof THEME_ONE !== "undefined") {
        premiumBtn.style.background = `linear-gradient(135deg, ${THEME_ONE.gradientBG[0]}, ${THEME_ONE.gradientBG[1]})`;
        premiumBtn.style.color = THEME_ONE.textColor;

        // Update scrollable content background to match referral redeem success state
        const scrollableContent = document.getElementById("main-content");
        if (scrollableContent) {
          scrollableContent.style.backgroundColor = THEME_ONE.pastelBG;
        }

        // Update success section background to match theme
        const successSection = document.querySelector(".success-section");
        if (successSection) {
          successSection.style.backgroundColor = THEME_ONE.pastelBG;
        }

        // Update fixed footer background to match theme
        const fixedFooter = document.querySelector(".fixed-footer");
        if (fixedFooter) {
          fixedFooter.style.backgroundColor = THEME_ONE.pastelBG;
          fixedFooter.style.borderTop = `1px solid ${THEME_ONE.border}`;
        }
      }

      premiumBtn.addEventListener("click", () => {
        console.log(
          "Premium button clicked, deeplink: riafy.me/buy1monthpremium",
        );
        ReferralUtils.showToast("riafy.me/buy1monthpremium");
      });
    }

    console.log(
      "Successfully rendered already redeemed state for referralStatus",
    );

    // Trigger success animation (confetti + audio) after a short delay
    setTimeout(() => {
      this.showSuccessAnimation();
    }, 500);

    // Re-bind events since we replaced content
    console.log("Re-binding events after success state render");
    this.bindEvents();
  }

  // Test function to simulate redemption (for testing purposes)
  simulateRedemption() {
    console.log(
      "Test mode: Simulating successful redemption for referralStatus",
    );
    ReferralUtils.showToast("Test Mode: Setting status to redeemed!");
    this.showSuccessState();
  }

  // Test function to check back button
  testBackButton() {
    const backBtn = document.getElementById("back-btn");
    console.log("[TEST] Back button element:", backBtn);
    console.log(
      "[TEST] Back button visible:",
      backBtn ? window.getComputedStyle(backBtn).display !== "none" : false,
    );
    if (backBtn) {
      console.log("[TEST] Triggering click event programmatically");
      backBtn.click();
    }
  }
}

// Initialize page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.referralStatusPage = new ReferralStatusPage();

  // Add test functions to global scope for easy testing
  window.testStatusRedemption = () => {
    if (window.referralStatusPage) {
      window.referralStatusPage.simulateRedemption();
    }
  };

  window.testBackButton = () => {
    if (window.referralStatusPage) {
      window.referralStatusPage.testBackButton();
    }
  };
});
