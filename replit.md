# Referral System

## Overview

A mobile-first referral system built with vanilla HTML, CSS, and JavaScript that connects to live API endpoints for real-time referral data. The system consists of four interconnected pages that provide a complete referral flow from promotion to redemption, with dynamic content from external APIs and real user data.

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

**Data Management**: Real-time API integration with authenticated endpoints that fetch live data for each page, replacing static JSON configuration with dynamic content from external services.

**Responsive Design**: Mobile-first approach with progressive enhancement for desktop. On mobile devices, pages render full-screen for native app-like experience. On desktop, content is centered in a mobile container (430-480px width) with decorative background.

### Component Architecture

**Class-based Structure**: Each page implements a dedicated JavaScript class (`ReferralPromotePage`, `ReferralStatusPage`, etc.) that handles initialization, data loading, rendering, and event binding.

**Card Animation System**: ReferralPromote page features an advanced GSAP-powered card carousel with index-based positioning system. Cards display in center/left/right positions with ±18° rotations, 0.92 scale for side cards, and smooth 0.4s transitions. Supports swipe gestures (50px threshold), drag feedback, and clickable side cards for navigation.

**Shared Utilities**: `ReferralUtils` class provides common functionality including URL parameter parsing, token interpolation, progress calculations, and API simulation methods.

**API Integration System**: Live data fetching from authenticated REST APIs using custom parameters, with intelligent error handling and fallback content for failed requests.

### Data Flow

**URL Parameter Driven**: Personalization relies on URL parameters (`app_package_name`, `firstname`, `userId`, `language`, and `referralCode` for download page) that feed directly into API requests for dynamic content.

**Live API Integration**: Direct integration with authenticated REST endpoints:
- Promote Page: POST /api/referral-promote with app package, username, and user ID
- Status Page: POST /api/referral-status for tracking progress and milestones  
- Download Page: GET /share/{referralCode} for invitation details
- Redeem Page: POST /api/referral-redeem for code redemption functionality

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

**Production API Integration**: Complete integration with live referral system APIs using X-API-Key authentication, with comprehensive error handling and fallback content for network issues or API failures.

**localStorage Redemption Tracking**: Implemented encrypted localStorage-based system to track redemption status per user/app combination. Uses format `referralRedeem_encryptedUserId_encryptedAppName` with fallback unencrypted storage. Successfully prevents duplicate redemptions and persists success state across page refreshes.

**Dynamic Image Sharing**: Implemented client-side share card generation system using offscreen iframe rendering and html-to-image library. Creates personalized 400x600px invite cards with user's firstname, crown imagery, and gradient backgrounds. Features preloading during page initialization for instant sharing, Web Share API Level 2 compatibility, and comprehensive fallback mechanisms including download and clipboard copy.

**Enhanced Audio Feedback**: Added audio feedback for clipboard operations across all referral pages - completed1.mp3 for copy operations in promote/download pages, and transition.mp3 for paste operations in redeem page. All audio files are preloaded for smooth user experience.

**UI Consistency Updates**: Converted info-nudge components in referralRedeem and referralStatus success states to match the bottom-status-pill design from referralPromote, featuring consistent red background (#FFF1F2) and heart emoji (❤️) styling across all success states.