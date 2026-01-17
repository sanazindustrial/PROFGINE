# Google OAuth Setup - Production Ready

## Required for Any Google User to Sign In

### 1. Go to Google Cloud Console

Visit: <https://console.cloud.google.com/>

### 2. Create/Select Project

- Click "Select a project" → "New Project"  
- Name it: "ProfGini Platform"

### 3. Enable APIs

- Go to "APIs & Services" → "Library"
- Search and enable: **"Google+ API"**

### 4. Configure OAuth Consent Screen

- Go to "APIs & Services" → "OAuth consent screen"
- Choose **"External"** (allows any Google user)
- Fill required fields:
  - App name: `ProfGini Platform`
  - User support email: Your email
  - Developer contact: Your email

### 5. Create OAuth Credentials

- Go to "APIs & Services" → "Credentials"  
- Click "+ CREATE CREDENTIALS" → "OAuth 2.0 Client IDs"
- Application type: **Web application**
- Name: `ProfGini Web Client`
- **Authorized JavaScript origins**: `http://localhost:3000`
- **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`

### 6. Update .env File

Replace these lines in your `.env`:

```
GOOGLE_CLIENT_ID="566060212460-silnanpv9eh7pt2qi04jqv48j8k6ib5c.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_actual_client_secret_from_step_5"
```

### 7. For Production  

Update redirect URIs to:

- `https://yourdomain.com`
- `https://yourdomain.com/api/auth/callback/google`

## ✅ Done

Any Google user can now sign in to your app.
