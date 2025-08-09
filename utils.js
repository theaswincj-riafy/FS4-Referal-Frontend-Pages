// Shared utilities for all referral pages

class ReferralUtils {
  /**
   * Get URL parameters with fallback values
   */
  static getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      userId: params.get('userId') || 'user123',
      appId: params.get('appId') || 'app1',
      language: params.get('language') || 'en',
      firstName: params.get('firstName') || 'John',
      // Legacy support for old parameters with new mapping
      referrer_name: params.get('firstName') || params.get('referrer_name') || 'John',
      referral_code: params.get('referral_code') || `${(params.get('firstName') || 'JOHN').toUpperCase()}1234`,
      referral_link: params.get('referral_link') || 'https://app.example.com/invite',
      current_redemptions: parseInt(params.get('current_redemptions')) || 0,
      pending_redemptions: 5 - (parseInt(params.get('current_redemptions')) || 0),
      target_redemptions: parseInt(params.get('target_redemptions')) || 5,
      show_recent_event: params.get('show_recent_event') === 'true'
    };
  }

  /**
   * Token interpolation helper
   * Replaces {{token}} patterns with actual values
   */
  static interpolateTokens(text, params) {
    if (typeof text !== 'string') return text;
    
    let result = text;
    Object.keys(params).forEach(key => {
      const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(pattern, params[key]);
    });
    return result;
  }

  /**
   * Recursively interpolate tokens in an object
   */
  static interpolateObject(obj, params) {
    if (typeof obj === 'string') {
      return this.interpolateTokens(obj, params);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.interpolateObject(item, params));
    }
    
    if (obj && typeof obj === 'object') {
      const result = {};
      Object.keys(obj).forEach(key => {
        result[key] = this.interpolateObject(obj[key], params);
      });
      return result;
    }
    
    return obj;
  }

  /**
   * Simulate API loading with delay
   */
  static async simulateApiCall(dataKey, delay = 800) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (window.REFERRAL_DATA && window.REFERRAL_DATA[dataKey]) {
          const params = this.getUrlParams();
          const data = this.interpolateObject(window.REFERRAL_DATA[dataKey], params);
          resolve(data);
        } else {
          reject(new Error(`Failed to load ${dataKey} data`));
        }
      }, delay);
    });
  }

  /**
   * Copy text to clipboard and show toast
   */
  static async copyToClipboard(text, successMessage = 'Copied!') {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast(successMessage);
      return true;
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.showToast(successMessage);
        return true;
      } catch (fallbackErr) {
        this.showToast('Failed to copy', 'error');
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  /**
   * Show toast notification
   */
  static showToast(message, type = 'success') {
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    toast.textContent = message;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('toast-show'), 10);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  /**
   * Show loading state
   */
  static showLoading(element) {
    element.innerHTML = `
      <div class="loading-spinner" role="status" aria-label="Loading">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    `;
  }

  /**
   * Show error state
   */
  static showError(element, message) {
    element.innerHTML = `
      <div class="error-state" role="alert">
        <p class="error-message">${message}</p>
        <button class="btn btn-secondary" onclick="location.reload()">Try Again</button>
      </div>
    `;
  }

  /**
   * Generate sharing URLs
   */
  static generateShareUrl(platform, message, url) {
    const encodedMessage = encodeURIComponent(message);
    const encodedUrl = encodeURIComponent(url);

    switch (platform) {
      case 'whatsapp':
        return `https://wa.me/?text=${encodedMessage}`;
      case 'sms':
        return `sms:?body=${encodedMessage}`;
      case 'email':
        return `mailto:?subject=Join this app&body=${encodedMessage}`;
      default:
        return null;
    }
  }

  /**
   * Navigate to another page with parameters
   */
  static navigateWithParams(page, additionalParams = {}) {
    const currentParams = this.getUrlParams();
    const allParams = { ...currentParams, ...additionalParams };
    
    const paramString = Object.keys(allParams)
      .filter(key => allParams[key] !== null && allParams[key] !== undefined)
      .map(key => `${key}=${encodeURIComponent(allParams[key])}`)
      .join('&');
    
    const url = paramString ? `${page}?${paramString}` : page;
    window.location.href = url;
  }

  /**
   * Validate referral code format
   */
  static validateReferralCode(code) {
    if (!code || code.trim().length === 0) {
      return { valid: false, error: 'empty' };
    }
    
    const cleanCode = code.trim().toUpperCase();
    
    // Basic validation: alphanumeric, 4-12 characters
    if (!/^[A-Z0-9]{4,12}$/.test(cleanCode)) {
      return { valid: false, error: 'invalid' };
    }
    
    return { valid: true, code: cleanCode };
  }

  /**
   * Get progress percentage
   */
  static getProgressPercentage(current, target) {
    return Math.min((current / target) * 100, 100);
  }

  /**
   * Format progress text
   */
  static formatProgress(current, target) {
    return `${current} of ${target} completed`;
  }
}

// Make available globally
window.ReferralUtils = ReferralUtils;
