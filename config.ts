import { ConfigProps } from "./types/config";

const config = {
  // REQUIRED
  appName: "Boreal SEO",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "AI-powered SEO content planning and blog generation tool. Create SEO-optimized content that ranks and drives organic traffic.",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: "borealseo.com",
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file (resend.supportEmail) otherwise customer support won't work.
    id: "",
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on every routes, just remove this below
    onlyShowOnRoutes: ["/"],
  },
  stripe: {
    // Create multiple plans in your Stripe dashboard, then add them here. You can add as many plans as you want, just make sure to add the priceId
    plans: [
      {
        // REQUIRED — we use this to find the plan in the webhook (for instance if you want to update the user's credits based on the plan)
        priceId:
          process.env.STRIPE_MONTHLY_PRICE_ID || "",
        //  REQUIRED - Name of the plan, displayed on the pricing page
        name: "Weekly",
        // A friendly description of the plan, displayed on the pricing page. Tip: explain why this plan and not others
        description: "Perfect for getting started with SEO content",
        // The price you want to display, the one user will be charged on Stripe.
        price: 14.99,
        // If you have an anchor price (i.e. $29) that you want to display crossed out, put it here. Otherwise, leave it empty
        priceAnchor: 29,
        features: [
          {
            name: "AI-powered content generation",
          },
          { name: "Keyword research with DataForSEO" },
          { name: "7-day content calendar" },
          { name: "SEO optimization suggestions" },
          { name: "Unlimited article generations" },
        ],
      },
      {
        priceId:
          process.env.STRIPE_LTD_PRICE_ID || "",
        // This plan will look different on the pricing page, it will be highlighted. You can only have one plan with isFeatured: true
        isFeatured: true,
        name: "Lifetime Deal",
        description: "One-time payment, lifetime access",
        price: 99,
        priceAnchor: 299,
        features: [
          {
            name: "Everything in Weekly",
          },
          { name: "Lifetime access to all features" },
          { name: "Priority support" },
          { name: "Early access to new features" },
          { name: "No recurring fees" },
        ],
      },
    ],
  },
  trial: {
    // Trial period in days
    durationDays: 2,
    // Features available during trial
    features: [
      "Access to current day + next day content",
      "Limited keyword research",
      "Basic article generation",
    ],
  },
  aws: {
    // If you use AWS S3/Cloudfront, put values in here
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  resend: {
    // REQUIRED — Email 'From' field to be used when sending magic login links
    fromNoReply: `Boreal SEO <noreply@seofor.dev>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `Boreal SEO <hey@seofor.dev>`,
    // Email shown to customer if need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: "hey@seofor.dev",
  },
  colors: {
    // REQUIRED — The DaisyUI theme to use (added to the main layout.js). Leave blank for default (light & dark mode). If you any other theme than light/dark, you need to add it in config.tailwind.js in daisyui.themes.
    theme: "dark",
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..). By default it takes the primary color from your DaisyUI theme (make sure to update your the theme name after "data-theme=")
    // OR you can just do this to use a custom color: main: "#f37055". HEX only.
    main: "#14b8a6", // Teal/blue-green for northern lights effect
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/signin",
    // REQUIRED — the path you want to redirect users after successfull login (i.e. /dashboard, /private). This is normally a private page for users to manage their accounts. It's used in apiClient (/libs/api.js) upon 401 errors from our API & in ButtonSignin.js
    callbackUrl: "/dashboard",
  },
} as ConfigProps;

export default config;
