# Environment Variables Template

Copy this file to `.env.local` and fill in your values.

## Core Configuration

```env
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/corecreator
# or MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/corecreator
```

## Authentication (NextAuth.js)

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Facebook OAuth
FACEBOOK_CLIENT_ID=
FACEBOOK_CLIENT_SECRET=

```

## Cloud Storage

```env
# Cloudinary (Recommended for images)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# OR AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
AWS_S3_BUCKET=
```

## Payment Gateways

```env
# Stripe (International)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Razorpay (India) - Primary Payment Gateway
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

## Email Services

```env
# SendGrid
SENDGRID_API_KEY=

# OR AWS SES
AWS_SES_REGION=us-east-1
AWS_SES_FROM_EMAIL=noreply@corecreator.com
```

## Video Streaming

```env
# Mux (Video hosting)
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=

# OR Cloudflare Stream
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_STREAM_API_TOKEN=
```

## Search

```env
# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200
# OR Elasticsearch Cloud
ELASTICSEARCH_CLOUD_ID=
ELASTICSEARCH_API_KEY=

# OR Algolia
ALGOLIA_APP_ID=
ALGOLIA_SEARCH_API_KEY=
ALGOLIA_ADMIN_API_KEY=
```

## Analytics & Monitoring

```env
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Sentry (Error tracking)
SENTRY_DSN=
```

---

## Quick Start

1. Copy this template: `cp docs/ENV_TEMPLATE.md .env.local`
2. Fill in MongoDB URI (required)
3. Add NextAuth secret: `openssl rand -base64 32`
4. Configure at least one OAuth provider
5. Run `npm run dev`

## Production Checklist

- [ ] Use MongoDB Atlas with replica set
- [ ] Configure all OAuth callback URLs for production domain
- [ ] Set up Cloudinary/S3 for file storage
- [ ] Configure Stripe/Razorpay with live keys
- [ ] Set up email service (SendGrid/SES)
- [ ] Enable Google Analytics
- [ ] Configure Sentry for error tracking
