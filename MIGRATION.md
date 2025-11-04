# Boreal SEO Migration Guide

This document outlines the migration from the original Boreal app to the ShipFast-based repository with Supabase.

## What's Been Migrated

### ✅ Core Infrastructure
- **Database**: PostgreSQL schema migrated to Supabase (see `supabase/migrations/20250104000000_initial_schema.sql`)
- **Authentication**: Supabase Auth with Google OAuth + Magic Links
- **Environment Variables**: Updated `.env.example` with all required variables
- **Configuration**: `config.ts` updated with Boreal branding and settings

### ✅ Styling & UI
- **Theme**: Dark theme with blue-green (teal) accent colors inspired by northern lights
- **Components**: shadcn/ui installed and configured
- **Global Styles**: `globals.css` updated with custom color palette and animations
- **Landing Page**: New modern landing page built with shadcn components

### ✅ Payment & Subscription
- **Stripe Integration**: Migrated and updated for Supabase structure
- **Webhook Handler**: Updated to work with new subscription table schema
- **Trial System**: 2-day trial logic implemented in `libs/subscription.ts`
- **Plans**: Weekly ($14.99) and Lifetime Deal ($99) configured

### ✅ API Integrations
- **DataForSEO**: Keyword research client (`libs/dataforseo.ts`)
- **OpenAI**: For content generation and keyword expansion
- **Anthropic**: Available for alternative AI generation
- **Resend**: Email service (already configured in ShipFast)

### ✅ TypeScript Types
- **Database Types**: Complete type definitions in `types/database.ts`
- All entities typed: Users, Websites, Keywords, Articles, ContentPlan, etc.

## Database Schema

The migration includes these main tables:

- `user_profiles` - Extends Supabase auth.users with trial info
- `websites` - User projects
- `pages` - Website page metadata
- `keywords` - Tracked keywords with search volume & difficulty
- `content_plan` - 7-day content calendar
- `articles` - Generated articles
- `content_briefs` - Content brief tracking
- `site_audits` - Historical SEO audits
- `subscriptions` - Stripe subscription management

Row Level Security (RLS) is enabled on all tables for data protection.

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file with these variables:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Resend
RESEND_API_KEY=your_resend_key

# Stripe (use your existing Boreal account)
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_MONTHLY_PRICE_ID=your_weekly_price_id
STRIPE_LTD_PRICE_ID=your_ltd_price_id
STRIPE_LTD_COUPON_ID=your_coupon_id

# AI Services
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
ANTHROPIC_API_KEY=your_anthropic_key

# SEO & Keyword Research
DATAFORSEO_API_KEY=your_dataforseo_key
```

### 2. Supabase Setup

1. Create a new Supabase project
2. Run the migration SQL:
   ```bash
   # Copy the contents of supabase/migrations/20250104000000_initial_schema.sql
   # and run it in the Supabase SQL Editor
   ```

3. Configure Auth Providers in Supabase Dashboard:
   - Enable Google OAuth
   - Enable Email (Magic Link)
   - Set redirect URLs

### 3. Stripe Setup

1. Use your existing Stripe account from Boreal
2. Update webhook endpoint to point to new domain
3. Verify webhook secret is updated in env vars

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the new landing page.

## Key Changes from Original Boreal

### Authentication
- **Before**: NextAuth with MongoDB
- **After**: Supabase Auth with PostgreSQL

### Database
- **Before**: Drizzle ORM with Neon Postgres
- **After**: Supabase PostgreSQL with built-in client

### UI Framework
- **Before**: Some shadcn components
- **After**: Full shadcn/ui setup with dark theme

### Styling
- **Before**: Custom theme
- **After**: Dark theme with teal/blue-green accents, northern lights-inspired gradients

## What's NOT Migrated Yet

The following features from the original Boreal app are ready to be migrated but not yet implemented:

- Dashboard UI and logic
- Onboarding flow
- Website crawler
- Article generation API routes
- Content calendar components
- Keyword research UI
- Site audit functionality

These will be implemented in the next phase as you mentioned you want to focus on foundation first.

## Testing Checklist

Before going to production:

- [ ] Test Google OAuth login
- [ ] Test Magic Link login
- [ ] Verify trial period initialization
- [ ] Test Stripe checkout flow
- [ ] Verify webhook handling (use Stripe CLI)
- [ ] Test subscription status checks
- [ ] Verify RLS policies work correctly
- [ ] Test API integrations (DataForSEO, OpenAI)
- [ ] Mobile responsive testing
- [ ] Dark theme consistency check

## Merging to Main

When ready to merge the `supabase` branch to `main`:

```bash
git checkout main
git merge supabase
git push origin main
```

## Support

If you encounter any issues:
1. Check environment variables are set correctly
2. Verify Supabase migration ran successfully
3. Check Stripe webhook is configured
4. Review browser console for errors

## Next Steps

1. Test all authentication flows
2. Set up production Supabase project
3. Configure production Stripe webhooks
4. Migrate/implement dashboard features
5. Set up CI/CD pipeline
6. Deploy to Vercel
