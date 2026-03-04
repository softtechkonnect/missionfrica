# MissionaryConnect - Web Platform

A secure, scalable missionary sponsorship marketplace connecting verified missionaries with donors worldwide.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **UI Components**: Radix UI + shadcn/ui patterns
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe Connect (Express accounts)
- **Storage**: Supabase Storage

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account with Connect enabled

## Getting Started

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Fill in your environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_PLATFORM_FEE_PERCENT=10
NEXT_PUBLIC_WITHDRAWAL_HOLD_DAYS=7
```

### 3. Database Setup

Run the Supabase migrations in order:

```bash
# Using Supabase CLI
supabase db push

# Or manually run in Supabase SQL Editor:
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/migrations/002_rls_policies.sql
# 3. supabase/migrations/003_storage_buckets.sql
```

### 4. Stripe Webhook Setup

For local development, use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret to your `.env.local`.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin dashboard
│   ├── api/                # API routes
│   │   └── stripe/         # Stripe endpoints
│   ├── auth/               # Authentication pages
│   ├── dashboard/          # User dashboard router
│   ├── missionaries/       # Public missionary listings
│   ├── missionary/         # Missionary-specific pages
│   └── page.tsx            # Home page
├── components/
│   └── ui/                 # Reusable UI components
├── lib/
│   ├── supabase/           # Supabase clients
│   ├── validations/        # Zod schemas
│   ├── database.types.ts   # TypeScript types
│   └── utils.ts            # Utility functions
└── middleware.ts           # Route protection
```

## Features

### User Roles

- **Admin**: Full platform management, missionary verification, post approval
- **Missionary**: Profile management, post creation, withdrawal requests
- **Donor**: Browse missionaries, make donations, view history

### Missionary Verification

1. User registers as missionary
2. Completes profile with organization details
3. Uploads registration certificate
4. Admin reviews and approves/rejects
5. Upon approval, profile becomes public

### Donation Flow

1. Donor selects missionary
2. Enters donation amount and optional message
3. Redirected to Stripe Checkout
4. Payment processed with platform fee
5. Donation recorded with 7-day hold
6. Missionary can withdraw available balance

### Security

- Row Level Security (RLS) on all tables
- Role-based access control
- Signed URLs for private documents
- Secure webhook validation
- Email verification required

## Database Schema

### Main Tables

- `users` - User accounts extending Supabase auth
- `missionary_profiles` - Missionary-specific data
- `posts` - Missionary updates (max 10 approved per missionary)
- `donations` - All donation records
- `withdrawals` - Withdrawal requests
- `audit_logs` - System audit trail

### Key Enums

- `account_status`: email_unverified, pending, under_review, approved, rejected, suspended
- `user_role`: admin, missionary, donor
- `post_status`: pending_review, approved, rejected
- `donation_status`: pending, completed, refunded, failed
- `withdrawal_status`: pending, approved, rejected, completed

## API Endpoints

### Stripe

- `POST /api/stripe/create-checkout` - Create Stripe Checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhooks

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Ensure all environment variables are set in your deployment platform:

- All Supabase keys
- All Stripe keys (use production keys)
- Update `NEXT_PUBLIC_APP_URL` to production URL

## Development Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

Private - All rights reserved.
