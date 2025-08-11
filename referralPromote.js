// Referral Promote Page Logic
class ReferralPromotePage {
  constructor() {
    this.data = null;
    this.params = ReferralUtils.getUrlParams();
    this.currentCardIndex = 0;
    this.appTheme = null;
    this.preloadedImages = [];
    this.swipeAudio = null;
    this.init();
  }

  async init() {
    try {
      await this.loadAppTheme();
      await this.loadPageData();
      if (this.data) {
        await this.preloadAssets();
        this.populateContent();
        this.hideLoader();
        this.initCardStack();
        this.bindEvents();
        
        // Start share card preloading after page is fully loaded (non-blocking)
        setTimeout(() => {
          this.preloadShareCard();
        }, 500);
      } else {
        throw new Error("No data loaded");
      }
    } catch (error) {
      console.error("Failed to load page:", error);
      this.showError("Failed to load page data. Please try again.");
    }
  }

  async loadAppTheme() {
    try {
      // Load the app theme
      if (typeof THEME_ONE !== "undefined") {
        this.appTheme = THEME_ONE;
        console.log("App theme loaded:", this.appTheme);
      } else {
        console.warn("App theme not available, using defaults");
      }
    } catch (error) {
      console.error("Failed to load app theme:", error);
    }
  }

  async loadPageData() {
    try {
      const language = this.params.language || 'en';
      const endpoint = `/api/referral-promote?lang=${language}`;
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
      
      // Immediately start preloading share card after API response (before hiding loader)
      console.log("🔄 Starting share card preload after API response...");
      this.preloadShareCardToLocalStorage();
      
    } catch (error) {
      console.error("API call error:", error);
      this.data = null;
      throw new Error("API call failed");
    }
  }

  // Transform referral URL to netlify format
  transformReferralUrl(originalUrl) {
    if (!originalUrl) return null;
    
    try {
      // Extract referral code from the original URL
      // Expected format: https://referral-system-o0yw.onrender.com/share/aswin2792
      const matches = originalUrl.match(/\/share\/(.+)$/);
      if (matches && matches[1]) {
        const referralCode = matches[1];
        const transformedUrl = `https://referralboost.netlify.app/referralDownload.html?referralCode=${referralCode}`;
        console.log("Transformed URL:", originalUrl, "->", transformedUrl);
        return transformedUrl;
      }
    } catch (error) {
      console.error("Error transforming referral URL:", error);
    }
    
    return originalUrl; // Return original if transformation fails
  }

  // Preload images and audio used in this page
  async preloadAssets() {
    try {
      console.log("Preloading assets for referralPromote page...");
      
      // Images used in this page
      const imagesToPreload = [
        'images/crown.png',
        'images/avatar3tp.png',
        'images/avatardancingtp.png'
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

      // Preload swipe audio
      this.swipeAudio = new Audio('audio/swipe1.mp3');
      this.swipeAudio.preload = 'auto';
      this.swipeAudio.volume = 0.7;
      
      // Preload clipboard copy success audio
      this.clipboardCopyAudio = new Audio('audio/completed1.mp3');
      this.clipboardCopyAudio.preload = 'auto';
      this.clipboardCopyAudio.volume = 0.8;
      
      // Load html-to-image library for share card rendering
      await this.loadHtmlToImageLibrary();
      
      console.log("Assets preloaded successfully");
    } catch (error) {
      console.error("Error preloading assets:", error);
    }
  }

  // Play swipe sound
  playSwipeSound() {
    try {
      if (this.swipeAudio && this.swipeAudio.readyState >= 2) {
        this.swipeAudio.currentTime = 0;
        this.swipeAudio.play().catch(e => console.log("Audio play failed:", e));
      }
    } catch (error) {
      console.error("Error playing swipe sound:", error);
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

  // Load html-to-image library for share card rendering
  async loadHtmlToImageLibrary() {
    try {
      if (!window.htmlToImage) {
        const module = await import('https://cdn.skypack.dev/html-to-image');
        window.htmlToImage = module;
        console.log("html-to-image library loaded successfully");
      }
    } catch (error) {
      console.error("Failed to load html-to-image library:", error);
    }
  }

  // Preload share card to localStorage for instant sharing
  async preloadShareCardToLocalStorage() {
    try {
      console.log("🔄 Starting share card preload to localStorage...");
      
      // Wait for library to be fully loaded
      let attempts = 0;
      while (!window.htmlToImage && attempts < 20) {
        console.log("Waiting for html-to-image library... attempt", attempts + 1);
        await new Promise(resolve => setTimeout(resolve, 300));
        attempts++;
      }
      
      if (!window.htmlToImage) {
        console.warn("html-to-image library failed to load, will generate on demand");
        return;
      }
      
      console.log("html-to-image library ready, generating share card...");
      
      // Generate storage key
      const storageKey = `shareCard_${this.params.userId}_${this.params.app_package_name}`;
      
      // Generate the share card base64
      const base64Data = await this.renderShareCardToBase64(this.params.firstname);
      
      // Store in localStorage with timestamp
      const shareCardData = {
        base64: base64Data,
        timestamp: Date.now(),
        userId: this.params.userId,
        appPackage: this.params.app_package_name
      };
      
      localStorage.setItem(storageKey, JSON.stringify(shareCardData));
      console.log("✅ Share card saved to localStorage with key:", storageKey);
      console.log("Base64 data size:", base64Data.length, "characters");
      
    } catch (error) {
      console.warn("❌ Failed to preload share card to localStorage:", error);
    }
  }

  // Get share card from localStorage
  getShareCardFromLocalStorage() {
    try {
      const storageKey = `shareCard_${this.params.userId}_${this.params.app_package_name}`;
      const storedData = localStorage.getItem(storageKey);
      
      if (!storedData) {
        console.log("No cached share card found for key:", storageKey);
        return null;
      }
      
      const shareCardData = JSON.parse(storedData);
      
      // Check if data is less than 24 hours old
      const isRecent = (Date.now() - shareCardData.timestamp) < (24 * 60 * 60 * 1000);
      
      if (!isRecent) {
        console.log("Cached share card is too old, removing...");
        localStorage.removeItem(storageKey);
        return null;
      }
      
      console.log("✅ Found cached share card:", storageKey);
      return shareCardData.base64;
      
    } catch (error) {
      console.error("Error retrieving share card from localStorage:", error);
      return null;
    }
  }

  // Preload share card for instant sharing (legacy method for fallback)
  async preloadShareCard() {
    try {
      console.log("Starting share card preload process...");
      
      // Wait for library to be fully loaded
      let attempts = 0;
      while (!window.htmlToImage && attempts < 10) {
        console.log("Waiting for html-to-image library... attempt", attempts + 1);
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      if (!window.htmlToImage) {
        throw new Error("html-to-image library failed to load after 5 seconds");
      }
      
      console.log("html-to-image library ready, generating share card...");
      
      // Generate the share card blob and store it as PNG for UI cards with text
      this.shareCardBlob = await this.renderShareCardToBlob(this.params.firstname, 'png');
      this.shareCardFile = new File([this.shareCardBlob], 'share-card.png', { type: 'image/png' });
      
      console.log("✅ Share card preloaded successfully!");
      console.log("File name:", this.shareCardFile.name);
      console.log("File size:", this.shareCardBlob.size, "bytes");
      console.log("File type:", this.shareCardFile.type);
    } catch (error) {
      console.warn("❌ Failed to preload share card:", error);
      this.shareCardFile = null;
      this.shareCardBlob = null;
    }
  }

  // Render share card to blob
  async renderShareCardToBlob(name, format = 'png') {
    try {
      const iframe = document.createElement('iframe');
      // Keep it renderable but invisible (don't use display:none)
      Object.assign(iframe.style, {
        position: 'fixed', 
        left: '-99999px', 
        top: '0', 
        width: '400px', 
        height: '600px', 
        visibility: 'hidden',
        pointerEvents: 'none',
        border: 'none'
      });
      // Get additional parameters from API data
      const pendingRedemptions = this.data?.data?.pending_redemptions || 0;
      const referralCode = this.data?.data?.referral_code || '';
      const appImage = this.data?.data?.app_image || '';
      const appName = this.data?.data?.app_name || '';
      
      iframe.src = `/share-card.html?name=${encodeURIComponent(name)}&pendingredemptions=${pendingRedemptions}&referral_code=${encodeURIComponent(referralCode)}&app_image=${encodeURIComponent(appImage)}&app_name=${encodeURIComponent(appName)}`;
      document.body.appendChild(iframe);

      await new Promise(res => iframe.onload = res);

      // Wait for webfonts/images inside iframe
      if (iframe.contentDocument?.fonts?.ready) {
        try { 
          await iframe.contentDocument.fonts.ready; 
        } catch {}
      }

      // Ensure all images are loaded before taking screenshot
      const images = iframe.contentDocument.querySelectorAll('img');
      if (images.length > 0) {
        console.log(`Waiting for ${images.length} images to load...`);
        const imagePromises = Array.from(images).map(img => {
          return new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
            } else {
              img.onload = resolve;
              img.onerror = resolve; // Still resolve to avoid hanging
              // Timeout after 5 seconds
              setTimeout(resolve, 5000);
            }
          });
        });
        await Promise.all(imagePromises);
        console.log("All images loaded or timed out");
      }

      // Additional wait for layout stabilization
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Pick the element to snapshot
      const root = iframe.contentDocument.querySelector('#card') || iframe.contentDocument.body;
      
      if (!window.htmlToImage) {
        throw new Error('html-to-image library not available');
      }
      
      let blob;
      if (format === 'png') {
        // Use toPng for PNG format (better for UI cards with text/lines)
        const dataUrl = await window.htmlToImage.toPng(root, { 
          pixelRatio: 2,
          width: 400,
          height: 600,
          skipAutoScale: true
        });
        
        // Convert data URL to binary blob properly
        const base64Data = dataUrl.split(',')[1];
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: 'image/png' });
      } else if (format === 'jpeg' || format === 'jpg') {
        // Use toJpeg for JPEG format with quality
        const dataUrl = await window.htmlToImage.toJpeg(root, { 
          pixelRatio: 2,
          width: 400,
          height: 600,
          quality: 0.9,
          backgroundColor: '#ffffff'
        });
        
        // Convert data URL to binary blob properly
        const base64Data = dataUrl.split(',')[1];
        const binaryData = atob(base64Data);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: 'image/jpeg' });
      } else {
        // Default to PNG using toBlob
        blob = await window.htmlToImage.toBlob(root, { 
          pixelRatio: 2,
          width: 400,
          height: 600
        });
      }

      iframe.remove();
      console.log("Generated blob:", blob.type, blob.size, "bytes");
      
      // Verify blob size is under limits (8MB)
      if (blob.size > 8 * 1024 * 1024) {
        console.warn("Blob size exceeds 8MB:", blob.size);
      }
      
      return blob;
    } catch (error) {
      console.error("Error rendering share card:", error);
      throw error;
    }
  }

  // Render share card to base64 for localStorage caching
  async renderShareCardToBase64(name) {
    try {
      const iframe = document.createElement('iframe');
      // Keep it renderable but invisible (don't use display:none)
      Object.assign(iframe.style, {
        position: 'fixed', 
        left: '-99999px', 
        top: '0', 
        width: '400px', 
        height: '600px', 
        visibility: 'hidden',
        pointerEvents: 'none',
        border: 'none'
      });
      
      // Get additional parameters from API data
      const pendingRedemptions = this.data?.data?.pending_redemptions || 0;
      const referralCode = this.data?.data?.referral_code || '';
      const appImage = this.data?.data?.app_image || '';
      const appName = this.data?.data?.app_name || '';
      
      iframe.src = `/share-card.html?name=${encodeURIComponent(name)}&pendingredemptions=${pendingRedemptions}&referral_code=${encodeURIComponent(referralCode)}&app_image=${encodeURIComponent(appImage)}&app_name=${encodeURIComponent(appName)}`;
      document.body.appendChild(iframe);

      await new Promise(res => iframe.onload = res);

      // Wait for webfonts/images inside iframe
      if (iframe.contentDocument?.fonts?.ready) {
        try { 
          await iframe.contentDocument.fonts.ready; 
        } catch {}
      }

      // Ensure all images are loaded before taking screenshot
      const images = iframe.contentDocument.querySelectorAll('img');
      if (images.length > 0) {
        console.log(`Waiting for ${images.length} images to load in base64 generation...`);
        const imagePromises = Array.from(images).map(img => {
          return new Promise((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              resolve();
            } else {
              img.onload = resolve;
              img.onerror = resolve; // Still resolve to avoid hanging
              // Timeout after 8 seconds for base64 generation
              setTimeout(resolve, 8000);
            }
          });
        });
        await Promise.all(imagePromises);
        console.log("All images loaded or timed out for base64 generation");
      }

      // Additional wait for layout stabilization
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Pick the element to snapshot
      const root = iframe.contentDocument.querySelector('#card') || iframe.contentDocument.body;
      
      if (!window.htmlToImage) {
        throw new Error('html-to-image library not available');
      }
      
      // Generate PNG data URL with high quality
      const dataUrl = await window.htmlToImage.toPng(root, { 
        pixelRatio: 2,
        width: 400,
        height: 600,
        skipAutoScale: true
      });

      iframe.remove();
      console.log("Generated base64 data URL for localStorage");
      
      return dataUrl;
    } catch (error) {
      console.error("Error rendering share card to base64:", error);
      throw error;
    }
  }

  // Share image from template with localStorage caching priority
  async shareImageFromTemplate(name, fallbackText) {
    try {
      console.log("🚀 Starting enhanced image share for:", name);
      
      let file = null;
      
      // Priority 1: Try to use cached share card from localStorage
      const cachedBase64 = this.getShareCardFromLocalStorage();
      if (cachedBase64) {
        console.log("✅ Using cached share card from localStorage");
        // Convert base64 to blob
        const response = await fetch(cachedBase64);
        const blob = await response.blob();
        file = new File([blob], 'share-card.png', { type: 'image/png' });
        console.log("✅ Cached share card converted to file");
      }
      
      // Priority 2: Use preloaded share card if available
      if (!file && this.shareCardFile) {
        console.log("✅ Using preloaded share card from memory");
        file = this.shareCardFile;
      }
      
      // Priority 3: Generate on demand as last resort
      if (!file) {
        console.log("⚠️ No cached card available, generating on demand...");
        ReferralUtils.showToast("Preparing your share card...");
        const blob = await this.renderShareCardToBlob(name, 'png');
        file = new File([blob], 'share-card.png', { type: 'image/png' });
        console.log("✅ Share card generated on demand");
      }

      console.log("Share file ready:", file);
      console.log("File name:", file.name);
      console.log("File size:", file.size, "bytes", "(" + (file.size / 1024 / 1024).toFixed(2) + " MB)");
      console.log("File type:", file.type);
      
      // Verify file integrity
      if (file.size === 0) {
        throw new Error("Generated file is empty");
      }
      
      console.log("Checking Web Share API capabilities...");
      console.log("navigator.canShare exists:", !!navigator.canShare);
      console.log("navigator.share exists:", !!navigator.share);
      
      if (navigator.canShare) {
        console.log("Can share files:", navigator.canShare({ files: [file] }));
        console.log("Can share text:", navigator.canShare({ text: fallbackText }));
      }





      // Enhanced sharing approach - ALWAYS try to share text + image first
      if (navigator.share) {
        console.log("🎯 Attempting optimized sharing for mobile compatibility...");
        
        // Get the transformed referral URL and construct proper share text
        const originalUrl = this.data?.data?.referral_url;
        const transformedUrl = this.transformReferralUrl(originalUrl);
        
        // Create comprehensive share text with the transformed URL
        let shareText = fallbackText || `${name} invited you to join this amazing app!`;
        
        // Clean and append URL if available
        if (transformedUrl) {
          // Remove any existing URLs
          shareText = shareText.replace(/https:\/\/[^\s]+/g, '').trim();
          shareText = `${shareText} ${transformedUrl}`;
        }
        
        console.log("Final share text for all approaches:", shareText);
        
        // Priority Approach 1: Image + Text (Best for WhatsApp/Telegram)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            console.log("🔥 Attempt 1: Image + Text (Mobile Optimized)");
            await navigator.share({
              files: [file],
              text: shareText
            });
            console.log("✅ SUCCESS: Share card image with text shared!");
            return;
          } catch (shareError) {
            // Check if user cancelled/dismissed the share dialog
            if (shareError.name === 'AbortError' || shareError.message.includes('cancelled') || shareError.message.includes('dismissed')) {
              console.log("User cancelled sharing");
              return; // Exit silently without toast
            }
            console.log("❌ Image + text share failed:", shareError.message);
          }
        }
        
        // Priority Approach 2: Image + Title + Text (Alternative format)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            console.log("🔥 Attempt 2: Image + Title + Text");
            await navigator.share({
              files: [file],
              title: "Join me on this app!",
              text: shareText
            });
            console.log("✅ SUCCESS: Share card with title shared!");
            return;
          } catch (shareError) {
            // Check if user cancelled/dismissed the share dialog
            if (shareError.name === 'AbortError' || shareError.message.includes('cancelled') || shareError.message.includes('dismissed')) {
              console.log("User cancelled sharing");
              return; // Exit silently without toast
            }
            console.log("❌ Image + title + text failed:", shareError.message);
          }
        }
        
        // Priority Approach 3: Image Only (as backup)
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            console.log("🔥 Attempt 3: Image Only");
            await navigator.share({
              files: [file]
            });
            console.log("✅ SUCCESS: Share card image shared!");
            // Even if only image is shared, show the text for user to copy
            ReferralUtils.showToast(`Image shared! Share this text: ${shareText}`);
            return;
          } catch (shareError) {
            // Check if user cancelled/dismissed the share dialog
            if (shareError.name === 'AbortError' || shareError.message.includes('cancelled') || shareError.message.includes('dismissed')) {
              console.log("User cancelled sharing");
              return; // Exit silently without toast
            }
            console.log("❌ Image-only share failed:", shareError.message);
          }
        }
        
        // Priority Approach 4: Text + URL (Reliable fallback)
        try {
          console.log("🔥 Attempt 4: Text + URL");
          await navigator.share({
            text: shareText,
            url: transformedUrl || this.data?.data?.referral_url || window.location.origin
          });
          console.log("✅ SUCCESS: Text + URL shared!");
          return;
        } catch (shareError) {
          // Check if user cancelled/dismissed the share dialog
          if (shareError.name === 'AbortError' || shareError.message.includes('cancelled') || shareError.message.includes('dismissed')) {
            console.log("User cancelled sharing");
            return; // Exit silently without toast
          }
          console.log("❌ Text + URL failed:", shareError.message);
        }
        
        // Priority Approach 5: Text Only (Last resort)
        try {
          console.log("🔥 Attempt 5: Text Only");
          await navigator.share({
            text: shareText
          });
          console.log("✅ SUCCESS: Text shared!");
          return;
        } catch (shareError) {
          // Check if user cancelled/dismissed the share dialog
          if (shareError.name === 'AbortError' || shareError.message.includes('cancelled') || shareError.message.includes('dismissed')) {
            console.log("User cancelled sharing");
            return; // Exit silently without toast
          }
          console.log("❌ Text-only failed:", shareError.message);
        }
      } else {
        console.log("❌ Native sharing not supported on this device");
        // Direct clipboard fallback when Web Share API is not available
        const originalUrl = this.data?.data?.referral_url;
        const transformedUrl = this.transformReferralUrl(originalUrl);
        let shareText = fallbackText || `${name} invited you to join this amazing app!`;
        
        if (transformedUrl) {
          shareText = shareText.replace(/https:\/\/[^\s]+/g, '').trim();
          shareText = `${shareText} ${transformedUrl}`;
        }
        
        if (navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(shareText);
            ReferralUtils.showToast("Share text copied! Send this message to your friends.");
          } catch (error) {
            console.error("Clipboard copy failed:", error);
            ReferralUtils.showToast("Unable to share. Please try again later.");
          }
        } else {
          ReferralUtils.showToast("Sharing not available on this device");
        }
      }
      
      // Final fallback - Copy to clipboard 
      console.log("🔥 Final Attempt: Copy to clipboard");
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(shareText);
          ReferralUtils.showToast("Share text copied! Paste it anywhere to share.");
          console.log("✅ SUCCESS: Copied to clipboard as final fallback");
        } catch (clipboardError) {
          console.error("❌ Final clipboard fallback failed:", clipboardError);
          ReferralUtils.showToast("Unable to share. Please try again later.");
        }
      } else {
        ReferralUtils.showToast("Sharing not available on this device");
      }
      
    } catch (error) {
      console.error("🚨 Share error:", error);
      ReferralUtils.showToast("Failed to share. Please try again.");
    }
  }

  populateContent() {
    if (!this.data) {
      console.error("No data available for rendering");
      return;
    }

    // Extract data from API response structure according to data mapping
    const apiData = this.data.data || this.data;
    const promoteData = apiData.page1_referralPromote || {};
    const hero = promoteData.hero || {};
    const steps = promoteData.how_it_works || [];
    const progress = promoteData.progress_teaser || {};
    const benefits = promoteData.benefits || [];
    const nudges = promoteData.nudges || [];
    const share = promoteData.share || {};

    // Helper function to replace all variables in text
    const replaceVariables = (text) => {
      if (!text) return text;
      return text
        .replace(
          /\{\{referrer_name\}\}/g,
          apiData.referrer_name || this.params.firstname,
        )
        .replace(/\{\{referral_link\}\}/g, apiData.referral_url || "#")
        .replace(
          /\{\{pending_redemptions\}\}/g,
          apiData.pending_redemptions || "0",
        )
        .replace(
          /\{\{current_redemptions\}\}/g,
          apiData.current_redemptions || "0",
        );
    };

    // Populate header using data mapping
    const headerElement = document.getElementById("header-title");
    if (headerElement && hero.page_title) {
      headerElement.textContent = replaceVariables(hero.page_title);
    }

    // Populate hero section using data mapping
    const heroTitleElement = document.getElementById("hero-title");
    if (heroTitleElement && hero.hero_title) {
      let titleText = replaceVariables(hero.hero_title);
      // Add line break for 2-line titles to split into equal halves
      const words = titleText.split(" ");
      if (words.length >= 4 && words.length <= 8) {
        const midPoint = Math.ceil(words.length / 2);
        titleText =
          words.slice(0, midPoint).join(" ") +
          "<br>" +
          words.slice(midPoint).join(" ");
      }
      heroTitleElement.innerHTML = titleText;
    }

    const heroSubtitleElement = document.getElementById("hero-subtitle");
    if (heroSubtitleElement && hero.subtitle) {
      let subtitleText = replaceVariables(hero.subtitle);

      // Add line break after the middle word
      const words = subtitleText.split(" ");
      const midPoint = Math.ceil(words.length / 2);
      subtitleText =
        words.slice(0, midPoint).join(" ") +
        "<br>" +
        words.slice(midPoint).join(" ");

      heroSubtitleElement.innerHTML = subtitleText;
    }

    const referralCodeElement = document.getElementById("referral-code");
    if (referralCodeElement && apiData.referral_code) {
      referralCodeElement.textContent = replaceVariables(
        apiData.referral_code,
      ).toUpperCase();
    }

    const viewReferralsTextElement = document.getElementById(
      "view-referrals-text",
    );
    if (viewReferralsTextElement && hero.quickButtonText) {
      viewReferralsTextElement.textContent = replaceVariables(
        hero.quickButtonText,
      );
    }

    // Populate how it works steps using data mapping
    if (steps.length > 0) {
      steps.forEach((step) => {
        const stepElement = document.getElementById(`step-${step.step}`);
        if (stepElement && step.desc) {
          stepElement.textContent = replaceVariables(step.desc);
        }
      });
    }

    // Populate progress section using data mapping
    const progressTitleElement = document.getElementById("progress-title");
    if (progressTitleElement && progress.title) {
      let titleText = replaceVariables(progress.title);
      // Add line break for better formatting if text is long
      const words = titleText.split(" ");
      if (words.length > 4) {
        const midPoint = Math.ceil(words.length / 2);
        titleText =
          words.slice(0, midPoint).join(" ") +
          "<br>" +
          words.slice(midPoint).join(" ");
      }
      progressTitleElement.innerHTML = titleText;
    }

    const progressSubtitleElement =
      document.getElementById("progress-subtitle");
    if (progressSubtitleElement && progress.subtitle) {
      progressSubtitleElement.textContent = replaceVariables(progress.subtitle);
    }

    // Populate benefits cards using data mapping (NOTE: mapping seems reversed in data structure)
    if (benefits.length > 0) {
      const usedColorIndices = new Set();

      benefits.forEach((benefit, index) => {
        const titleElement = document.getElementById(
          `benefit-${index + 1}-title`,
        );
        const descElement = document.getElementById(
          `benefit-${index + 1}-desc`,
        );
        const cardElement = document.querySelector(`[data-index="${index}"]`);

        // According to mapping: benefit.desc goes to title, benefit.title goes to desc
        if (titleElement && benefit.title) {
          titleElement.textContent = replaceVariables(benefit.title);
        }
        if (descElement && benefit.desc) {
          descElement.textContent = replaceVariables(benefit.desc);
        }

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
          if (titleElement) titleElement.style.color = textColor;
          if (descElement) descElement.style.color = textColor;
        }
      });

      // Calculate and apply uniform height to all cards after content is populated
      this.adjustCardHeights();
    }

    // Populate tip using data mapping - randomly select from nudges array
    const tipElement = document.getElementById("tip-text");
    if (tipElement && nudges.length > 0) {
      const randomTip = nudges[Math.floor(Math.random() * nudges.length)];
      let tipText = replaceVariables(randomTip);
      // Add line break for better formatting if text is long
      const words = tipText.split(" ");
      if (words.length > 6) {
        const midPoint = Math.ceil(words.length / 2);
        tipText =
          words.slice(0, midPoint).join(" ") +
          "<br>" +
          words.slice(midPoint).join(" ");
      }
      tipElement.innerHTML = tipText;
    }

    // Populate footer CTA using data mapping
    const primaryCtaElement = document.getElementById("primary-cta");
    if (primaryCtaElement && share.primary_cta) {
      primaryCtaElement.textContent = replaceVariables(share.primary_cta);
    }

    // Store share message for later use in sharing functionality
    if (share.messages && share.messages.default) {
      this.shareMessage = replaceVariables(share.messages.default);
    }

    // Apply automatic coloring to buttons using colorCombos
    this.applyButtonColors();

    // Apply app theme colors
    this.applyAppTheme();

    // Hide combined-card-section and adjust padding if pending_redemptions is 0
    this.handlePendingRedemptionsVisibility();
  }

  applyButtonColors() {
    // Select a random color combo for buttons
    const selectedColorCombo =
      COLOR_COMBOS[Math.floor(Math.random() * COLOR_COMBOS.length)];
    const gradientBG = selectedColorCombo.gradientBG;
    const textColor = selectedColorCombo.textColor;

    // Apply color to loading spinners
    const spinners = document.querySelectorAll(".spinner");
    spinners.forEach((spinner) => {
      spinner.style.borderTopColor = gradientBG[0];
    });
  }

  applyAppTheme() {
    if (!this.appTheme) return;

    // Apply hero section background color
    const heroSection = document.querySelector(".hero-section");
    if (heroSection) {
      heroSection.style.backgroundColor = this.appTheme.pastelBG;
    }

    // Apply referral code display styling
    const referralCodeDisplay = document.getElementById("referral-code");
    if (referralCodeDisplay) {
      referralCodeDisplay.style.borderColor = this.appTheme.border;
      referralCodeDisplay.style.backgroundColor = this.appTheme.pastelBGFill;
    }

    // Apply button gradient colors
    const viewReferralsBtn = document.getElementById("view-referrals");
    if (viewReferralsBtn) {
      viewReferralsBtn.style.background = `linear-gradient(135deg, ${this.appTheme.gradientBG[0]}, ${this.appTheme.gradientBG[1]})`;
      viewReferralsBtn.style.color = this.appTheme.textColor;
    }

    const primaryCta = document.getElementById("primary-cta");
    if (primaryCta) {
      primaryCta.style.background = `linear-gradient(135deg, ${this.appTheme.gradientBG[0]}, ${this.appTheme.gradientBG[1]})`;
      primaryCta.style.color = this.appTheme.textColor;
    }

    // Apply secondary text color
    const heroSubtitle = document.getElementById("hero-subtitle");
    if (heroSubtitle) {
      heroSubtitle.style.color = this.appTheme.secondaryTextColor;
    }

    const tipText = document.getElementById("tip-text");
    if (tipText) {
      tipText.style.color = this.appTheme.secondaryTextColor;
    }

    // Apply step card background color
    const stepCards = document.querySelectorAll(".step-card");
    stepCards.forEach((card) => {
      card.style.backgroundColor = this.appTheme.whiteCardBG;
    });
  }

  handlePendingRedemptionsVisibility() {
    // Get pending_redemptions from API data
    const apiData = this.data.data || this.data;
    const pendingRedemptions = apiData.pending_redemptions || 0;

    console.log("Checking pending_redemptions:", pendingRedemptions);

    // Hide combined-card-section if pending_redemptions is 0
    const combinedCardSection = document.querySelector(".combined-card-section");
    const howItWorksSection = document.querySelector(".how-it-works");

    if (pendingRedemptions === 0) {
      console.log("pending_redemptions is 0, hiding combined-card-section and adding padding to how-it-works");
      
      if (combinedCardSection) {
        combinedCardSection.style.visibility = "hidden";
        combinedCardSection.style.display = "none";
      }
      
      if (howItWorksSection) {
        howItWorksSection.style.paddingBottom = "10rem";
      }
    } else {
      console.log("pending_redemptions is not 0, showing combined-card-section");
      
      if (combinedCardSection) {
        combinedCardSection.style.visibility = "visible";
        combinedCardSection.style.display = "block";
      }
      
      if (howItWorksSection) {
        howItWorksSection.style.paddingBottom = "";
      }
    }
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

  hideLoader() {
    const loader = document.getElementById("page-loader");
    const content = document.getElementById("page-content-wrapper");

    if (loader) loader.style.display = "none";
    if (content) content.style.display = "block";
  }

  initCardStack() {
    const container = document.getElementById("card-stack");
    if (!container) return;

    // Initialize the new card swiper system
    this.initReferralCardSwiper(container);
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

    // Rotate to next card
    const rotateNext = () => {
      if (isAnimating) return;
      isAnimating = true;
      // Play swipe sound when rotating cards
      this.playSwipeSound();
      currentIndex = (currentIndex + 1) % cards.length;
      console.log(
        "[CARD SWIPER] Rotating to next - currentIndex:",
        currentIndex,
      );
      positionCards(true);
      setTimeout(() => {
        isAnimating = false;
      }, 400);
    };

    // Rotate to previous card
    const rotatePrev = () => {
      if (isAnimating) return;
      isAnimating = true;
      // Play swipe sound when rotating cards
      this.playSwipeSound();
      currentIndex = (currentIndex - 1 + cards.length) % cards.length;
      console.log(
        "[CARD SWIPER] Rotating to previous - currentIndex:",
        currentIndex,
      );
      positionCards(true);
      setTimeout(() => {
        isAnimating = false;
      }, 400);
    };

    // Setup simple interactions
    function setupInteractions() {
      cards.forEach((card, index) => {
        // Clean up existing listeners
        card.onclick = null;
        card.removeEventListener("touchstart", card._touchStartHandler);
        card.removeEventListener("touchend", card._touchEndHandler);

        // Click handler based on card position
        card.style.cursor = "pointer";
        card.onclick = (e) => {
          e.stopPropagation();

          const relativeIndex =
            (index - currentIndex + cards.length) % cards.length;

          if (relativeIndex === 0) {
            // Center card - rotate left (to next)
            rotateNext();
          } else if (relativeIndex === 1) {
            // Right card - rotate left (to next)
            rotateNext();
          } else if (relativeIndex === cards.length - 1) {
            // Left card - rotate right (to previous)
            rotatePrev();
          }
        };

        // Simple swipe detection
        let startX = 0;
        let startTime = 0;

        const handleTouchStart = (e) => {
          startX = e.touches[0].clientX;
          startTime = Date.now();
        };

        const handleTouchEnd = (e) => {
          const endX = e.changedTouches[0].clientX;
          const deltaX = endX - startX;
          const deltaTime = Date.now() - startTime;

          // Only consider swipes that are fast enough and long enough
          if (Math.abs(deltaX) > 30 && deltaTime < 300) {
            if (deltaX > 0) {
              rotatePrev(); // Swipe right = previous
            } else {
              rotateNext(); // Swipe left = next
            }
          } else {
            rotateNext(); // Default to next on tap/slow swipe
          }
        };

        // Store handlers for cleanup
        card._touchStartHandler = handleTouchStart;
        card._touchEndHandler = handleTouchEnd;

        // Add touch event listeners
        card.addEventListener("touchstart", handleTouchStart, {
          passive: true,
        });
        card.addEventListener("touchend", handleTouchEnd, { passive: true });
      });
    }

    // Initialize
    function initialize() {
      const containerWidth = container.offsetWidth;
      if (containerWidth && containerWidth > 0) {
        console.log(
          "[CARD SWIPER] Initializing with container width:",
          containerWidth,
        );

        // Set initial positions
        positionCards(false);

        // Animate cards in
        cards.forEach((card, index) => {
          gsap.from(card, {
            opacity: 0,
            scale: 0.8,
            duration: 0.6,
            delay: index * 0.1,
            ease: "back.out(1.7)",
            onComplete: () => {
              if (index === cards.length - 1) {
                setupInteractions();
                console.log(
                  "[CARD SWIPER] Simple swiper initialization complete",
                );
              }
            },
          });
        });
      } else {
        setTimeout(initialize, 50);
      }
    }

    // Handle resize
    window.addEventListener("resize", () => {
      setTimeout(() => positionCards(false), 200);
    });

    // Start initialization
    requestAnimationFrame(() => setTimeout(initialize, 10));

    // Store methods for external access
    this.rotateNext = rotateNext;
    this.rotatePrev = rotatePrev;
  }

  bindEvents() {
    // Back button
    const backBtn = document.getElementById("back-btn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        console.log("[BACK BUTTON] referralPromote back button clicked");
        console.log("[BACK BUTTON] userId:", this.params.userId);
        console.log("[BACK BUTTON] redirecting to index.html");
        window.location.href = "index.html";
      });
    }

    // View referrals button
    const viewReferralsBtn = document.getElementById("view-referrals");
    if (viewReferralsBtn) {
      viewReferralsBtn.addEventListener("click", () => {
        window.location.href = `referralStatus.html?${new URLSearchParams(this.params).toString()}`;
      });
    }

    // Primary CTA button
    const primaryCta = document.getElementById("primary-cta");
    if (primaryCta) {
      primaryCta.addEventListener("click", () => {
        this.shareInvite();
      });
    }

    // Referral code copy functionality
    const referralCodeElement = document.getElementById("referral-code");
    if (referralCodeElement) {
      referralCodeElement.style.cursor = "pointer";
      referralCodeElement.addEventListener("click", async () => {
        try {
          const codeText =
            referralCodeElement.textContent || referralCodeElement.innerText;
          const lowercaseCode = codeText.toLowerCase();

          if (navigator.clipboard) {
            await navigator.clipboard.writeText(lowercaseCode);
            ReferralUtils.showToast("Code copied to clipboard!");
            this.playClipboardCopyAudio();
          } else {
            // Fallback for older browsers
            const textArea = document.createElement("textarea");
            textArea.value = lowercaseCode;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
            ReferralUtils.showToast("Code copied to clipboard!");
            this.playClipboardCopyAudio();
          }
        } catch (error) {
          console.error("Failed to copy code:", error);
          ReferralUtils.showToast("Failed to copy code. Please try again.");
        }
      });
    }
  }

  async shareInvite() {
    // Use the dynamically generated share message with replaced variables
    const shareText =
      this.shareMessage ||
      `${this.params.firstname} invited you to try this app!`;

    const shareData = {
      title: "Join me on this app!",
      text: shareText,
      url: this.transformReferralUrl(this.data?.data?.referral_url) || window.location.origin,
    };

    try {
      // Use preloaded share card for instant sharing
      await this.shareImageFromTemplate(this.params.firstname, shareText);
    } catch (error) {
      // Check if user cancelled/dismissed the share dialog
      if (error.name === 'AbortError' || error.message.includes('cancelled') || error.message.includes('dismissed')) {
        console.log("User cancelled sharing");
        return; // Exit silently without toast or fallback
      }
      
      console.log("Image sharing failed, falling back to text sharing:", error);
      
      // Fallback to standard text sharing
      if (navigator.share) {
        try {
          await navigator.share(shareData);
        } catch (shareError) {
          // Check if user cancelled fallback sharing too
          if (shareError.name === 'AbortError' || shareError.message.includes('cancelled') || shareError.message.includes('dismissed')) {
            console.log("User cancelled fallback sharing");
            return; // Exit silently without toast
          }
          
          console.error("Text sharing also failed:", shareError);
          // Final fallback to copying link
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareData.text + " " + shareData.url);
            ReferralUtils.showToast("Link copied to clipboard!");
          }
        }
      } else {
        // Fallback to copying link when sharing is not supported
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareData.text + " " + shareData.url);
          ReferralUtils.showToast("Link copied to clipboard!");
        }
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
}

// Initialize page when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ReferralPromotePage();
});
