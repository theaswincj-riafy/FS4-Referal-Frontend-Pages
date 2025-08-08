# Referral System

## Overview

A mobile-first referral system built with vanilla HTML, CSS, and JavaScript that enables users to share referral codes, track progress, and redeem invitations. The system consists of four interconnected pages that provide a complete referral flow from promotion to redemption, with personalized content and progress tracking capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: Pure vanilla HTML, CSS, and JavaScript with no frameworks or build tools required. This approach ensures minimal dependencies and maximum compatibility across devices.

**Page Structure**: Four-page system with camelCase naming convention:
- `referralPromote.html` - Main sharing page for referrers
- `referralStatus.html` - Progress tracking dashboard
- `referralDownload.html` - App download landing page
- `referralRedeem.html` - Code redemption interface

**Data Management**: Centralized JSON configuration in `referralData.js` that serves as a single source of truth for all page content, eliminating content duplication and ensuring consistency across pages.

**Responsive Design**: Mobile-first approach with progressive enhancement for desktop. On mobile devices, pages render full-screen for native app-like experience. On desktop, content is centered in a mobile container (430-480px width) with decorative background.

### Component Architecture

**Class-based Structure**: Each page implements a dedicated JavaScript class (`ReferralPromotePage`, `ReferralStatusPage`, etc.) that handles initialization, data loading, rendering, and event binding.

**Shared Utilities**: `ReferralUtils` class provides common functionality including URL parameter parsing, token interpolation, progress calculations, and API simulation methods.

**Token Interpolation System**: Dynamic content personalization using `{{token}}` syntax that replaces placeholders with actual values from URL parameters or fallback defaults.

### Data Flow

**URL Parameter Driven**: Personalization relies on URL parameters (`referrer_name`, `referral_code`, `current_redemptions`, etc.) with sensible fallbacks to ensure pages function without parameters.

**Simulated API Layer**: `simulateApiCall` method mimics backend integration, making it easy to replace with actual API calls when backend is available.

**Privacy-First Design**: System only displays referrer information and aggregate statistics, never storing or revealing individual redeemer identities for GDPR compliance.

### User Experience Design

**Progressive Loading**: Pages show loading states during data fetch, then render complete content to prevent layout shifts and improve perceived performance.

**Accessibility Focus**: Implements proper ARIA roles, keyboard navigation support, high contrast ratios, and large touch targets for mobile usability.

**Toast Notifications**: Non-blocking success messages for actions like copying codes/links, providing immediate user feedback without disrupting flow.

## External Dependencies

**Image Assets**: Uses Pixabay CDN for placeholder images across all pages. These should be replaced with branded assets in production.

**Web APIs**: 
- Clipboard API for copy-to-clipboard functionality
- URLSearchParams for parsing query parameters
- Native sharing APIs (when available) for enhanced sharing experience

**No External Libraries**: Deliberately avoids external JavaScript libraries or CSS frameworks to maintain simplicity, reduce load times, and eliminate dependency management concerns.

**Backend Integration Ready**: Architecture designed to easily integrate with REST APIs by replacing the `simulateApiCall` method with actual HTTP requests to backend services.