# SSO (Single Sign-On) Setup Guide

This document explains how SSO authentication works in Core Creator and how to configure OAuth providers.

---

## How SSO Works

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   User      │     │  Core       │     │  OAuth      │     │  MongoDB    │
│   Browser   │     │  Creator    │     │  Provider   │     │  Database   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │ 1. Click "Sign   │                   │                   │
       │    in with       │                   │                   │
       │    Google"       │                   │                   │
       │──────────────────>                   │                   │
       │                   │                   │                   │
       │                   │ 2. Redirect to   │                   │
       │                   │    Google OAuth  │                   │
       │<──────────────────>──────────────────>                   │
       │                   │                   │                   │
       │ 3. User grants   │                   │                   │
       │    permission    │                   │                   │
       │──────────────────────────────────────>                   │
       │                   │                   │                   │
       │                   │ 4. OAuth returns │                   │
       │                   │    auth code     │                   │
       │<──────────────────<──────────────────│                   │
       │                   │                   │                   │
       │                   │ 5. Exchange code │                   │
       │                   │    for tokens    │                   │
       │                   │──────────────────>                   │
       │                   │<──────────────────│                   │
       │                   │                   │                   │
       │                   │ 6. Create/Update │                   │
       │                   │    user account  │                   │
       │                   │──────────────────────────────────────>
       │                   │<──────────────────────────────────────│
       │                   │                   │                   │
       │ 7. JWT session   │                   │                   │
       │    created       │                   │                   │
       │<──────────────────│                   │                   │
       │                   │                   │                   │
       │ 8. Redirect to   │                   │                   │
       │    dashboard     │                   │                   │
       │<──────────────────│                   │                   │
```

### Key Features

1. **Account Linking**: If a user signs up with email and later uses SSO with the same email, accounts are automatically linked.

2. **Multiple Providers**: Users can link multiple SSO providers to one account.

3. **JWT Sessions**: After authentication, a JWT token is created (valid for 30 days).

4. **Role Assignment**: New SSO users are assigned "learner" role by default.

---

## Supported Providers

| Provider | User/Learner | Artist/Instructor | Vendor/Seller |
|----------|--------------|-------------------|---------------|
| Google   | ✅           | ✅                | ✅            |
| Facebook | ✅           | ❌                | ✅            |
| Apple    | ✅           | ✅                | ❌            |
| GitHub   | ❌           | ✅                | ❌            |

---

## Environment Variables

Add these to your `.env.local` file:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret

# Apple OAuth
APPLE_CLIENT_ID=your-apple-service-id
APPLE_CLIENT_SECRET=your-apple-secret-key

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

---

## Provider Setup Instructions

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth Client ID**
5. Select **Web Application**
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy Client ID and Client Secret to `.env.local`

### Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app (Consumer type)
3. Add **Facebook Login** product
4. In Settings → Basic, copy App ID and App Secret
5. Add redirect URI: `http://localhost:3000/api/auth/callback/facebook`

### Apple OAuth

1. Go to [Apple Developer](https://developer.apple.com/)
2. Create a **Services ID** (this becomes your Client ID)
3. Enable **Sign in with Apple**
4. Add return URL: `http://localhost:3000/api/auth/callback/apple`
5. Create a **Key** for Sign in with Apple
6. Generate client secret using the key

### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Add callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and generate Client Secret

---

## User Data Stored

When a user signs in via SSO, we store:

```javascript
{
  email: "user@example.com",
  name: "John Doe",
  avatar: "https://...",
  role: "learner",
  isVerified: true,
  isActive: true,
  accounts: [
    {
      provider: "google",
      providerAccountId: "123456789"
    }
  ],
  lastLoginAt: Date,
  createdAt: Date
}
```

---

## Security Considerations

- **Email Verification**: SSO users are automatically marked as verified
- **Account Linking**: Uses `allowDangerousEmailAccountLinking` for convenience (can be disabled for stricter security)
- **Session Expiry**: JWT sessions expire after 30 days
- **HTTPS Required**: Production must use HTTPS for OAuth callbacks
