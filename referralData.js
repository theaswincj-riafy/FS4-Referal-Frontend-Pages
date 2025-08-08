
window.REFERRAL_DATA = {
  page1_referralPromote: {
    page_id: "referral-promote",
    personalization: {
      referrer_name: "{{referrer_name}}",
      referral_code: "{{referral_code}}",
      target_redemptions: 5
    },
    hero: {
      title: "Share & Unlock 1 Month Premium",
      subtitle: "{{referrer_name}}, invite friends and get 1 month of Premium when 5 people redeem your code.",
      badge: "Only {{target_redemptions}} redemptions needed"
    },
    benefits: [
      { title: "Premium Access", desc: "Ad-free experience, pro features, and priority support for 1 month." },
      { title: "Win Together", desc: "Your friends get an exclusive newcomer perk when they join via your link." },
      { title: "Fast & Simple", desc: "Share your link; they download and redeem. You progress instantly." }
    ],
    progress_teaser: {
      label: "Your current progress",
      value: "{{current_redemptions}}/{{target_redemptions}}",
      hint: "Keep sharing—each redemption brings you closer to Premium!"
    },
    share: {
      section_title: "Share your invite",
      primary_cta: "Share Invite",
      copy_code_cta: "Copy Code: {{referral_code}}",
      copy_link_cta: "Copy Link",
      success_toast: "Copied! Now paste it anywhere.",
      messages: {
        whatsapp: "Hey! I'm using this app and it's awesome. Use my code {{referral_code}} or link {{referral_link}} to join—helps me unlock 1 month Premium!",
        sms: "Check out this app! Use code {{referral_code}} to get started: {{referral_link}}",
        generic: "Join me on this app! Use referral code {{referral_code}} or this link: {{referral_link}}"
      }
    },
    actions: {
      view_status: "View Progress"
    },
    privacy_note: "We never share personal info. Only you see your progress; your friends just see the invite."
  },

  page2_referralStatus: {
    page_id: "referral-status",
    personalization: {
      referrer_name: "{{referrer_name}}",
      referral_code: "{{referral_code}}",
      target_redemptions: 5
    },
    header: {
      title: "Your Referral Progress",
      subtitle: "Great work, {{referrer_name}}. Keep it going!"
    },
    status: {
      current: "{{current_redemptions}}",
      target: "{{target_redemptions}}",
      progress_text: "{{current_redemptions}} of {{target_redemptions}} completed"
    },
    notifications: {
      recent_event_banner: {
        visible: "{{show_recent_event}}",
        text: "Nice! Someone redeemed your code. Your progress just moved to {{current_redemptions}}/{{target_redemptions}}."
      }
    },
    milestones: [
      { level: 1, threshold: 1, title: "Level 1 – The Kickoff", message: "Your first referral is in! You've started your Premium journey." },
      { level: 2, threshold: 2, title: "Level 2 – Building Momentum", message: "Two friends on board! You're warming up nicely." },
      { level: 3, threshold: 3, title: "Level 3 – Halfway Hero", message: "Three redemptions—more than halfway to your goal!" },
      { level: 4, threshold: 4, title: "Level 4 – Almost There", message: "Four done! Just one more to unlock Premium." },
      { level: 5, threshold: 5, title: "Level 5 – Premium Unlocked 🎉", message: "Congratulations! You've completed your referral goal and earned 1 month of Premium." }
    ],
    tips: [
      "Reshare your link with different friend groups",
      "Post on social media with a personal message",
      "Send to family members who might be interested",
      "Share in group chats where it's appropriate"
    ],
    faq: [
      { 
        q: "How long do I have to reach my goal?", 
        a: "There's no time limit! Your progress is saved and you can continue anytime." 
      },
      { 
        q: "What happens after I unlock Premium?", 
        a: "You'll get 1 month of Premium access with all features unlocked immediately." 
      },
      { 
        q: "Can I see who used my code?", 
        a: "For privacy, we only show your progress count, not individual details." 
      }
    ],
    actions: {
      share_cta: "Share Again",
      copy_link_cta: "Copy Link",
      copy_code_cta: "Copy Code"
    },
    privacy_note: "🔒 Your privacy matters. We track progress but never reveal who redeemed your codes."
  },

  page3_referralDownload: {
    page_id: "referral-download",
    personalization: {
      referrer_name: "{{referrer_name}}",
      referral_code: "{{referral_code}}"
    },
    header: {
      title: "{{referrer_name}} invited you!",
      subtitle: "Join thousands using the app and get exclusive perks."
    },
    benefits: [
      { title: "Exclusive Welcome Bonus", desc: "Special perks just for invited users like you." },
      { title: "Join Your Friend", desc: "{{referrer_name}} will get closer to unlocking Premium too." },
      { title: "Premium Features", desc: "Experience the full app with advanced capabilities." }
    ],
    download: {
      section_title: "Download & Redeem",
      primary_cta: "Download App",
      ios_link: "https://apps.apple.com/app/example",
      android_link: "https://play.google.com/store/apps/details?id=com.example",
      steps: [
        "Download the app from your app store",
        "Create your account or sign in",
        "Enter code {{referral_code}} when prompted",
        "Enjoy your welcome bonus!"
      ]
    },
    actions: {
      secondary_cta: "I already have the app"
    },
    footer_smallprint: "By downloading, you agree to our Terms of Service and Privacy Policy."
  },

  page4_referralRedeem: {
    page_id: "referral-redeem",
    personalization: {
      referrer_name: "{{referrer_name}}",
      referral_code: "{{referral_code}}"
    },
    header: {
      title: "Almost there!",
      subtitle: "Enter your referral code to unlock exclusive perks."
    },
    form: {
      code_label: "Referral Code",
      code_placeholder: "Enter your code here",
      submit_cta: "Redeem Code",
      success_title: "Welcome aboard!",
      success_message: "Your code has been redeemed successfully. {{referrer_name}} just got one step closer to Premium!",
      error_invalid: "This code isn't valid. Double-check and try again.",
      error_used: "This code has already been used on your account.",
      error_expired: "This referral code has expired."
    },
    actions: {
      continue_cta: "Continue to App",
      back_cta: "Back to Download"
    }
  }
};
