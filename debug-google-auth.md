# Google Authentication Debug Guide

## Current Issue

After Google authentication, users are being redirected back to the sign up page instead of being logged in successfully.

## Analysis Results

### ✅ Configuration Status

1. **Environment Variables**: Correctly configured
   - `NEXTAUTH_URL`: "<http://localhost:3000>"
   - `GOOGLE_CLIENT_ID`: Present
   - `GOOGLE_CLIENT_SECRET`: Present

2. **NextAuth Configuration**: Uses open Google OAuth (allows any Google user)
   - Creates new users automatically with 14-day free trial
   - Default role: STUDENT
   - Default subscription: FREE_TRIAL

3. **Redirect URIs**: Fixed to use port 3000 in documentation

### 🔧 Potential Issues & Solutions

#### Issue 1: Google Cloud Console Configuration

**Problem**: Redirect URI mismatch between Google Cloud Console and app
**Solution**: Ensure Google Cloud Console has:

```text
Authorized JavaScript origins: http://localhost:3000
Authorized redirect URIs: http://localhost:3000/api/auth/callback/google
```

#### Issue 2: Database Connection

**Problem**: Database might not be accessible or migration issues
**Solution**:

1. Run `npx prisma db push` to ensure schema is up to date
2. Check database connection in `.env`

#### Issue 3: Session/JWT Issues

**Problem**: Session not being created properly after Google auth
**Solution**: Clear browser cookies and try again

### 🔍 Debug Steps

1. **Check Google Cloud Console**:
   - Verify redirect URIs are exactly: `http://localhost:3000/api/auth/callback/google`
   - Verify JavaScript origins: `http://localhost:3000`

2. **Test Database Connection**:

   ```bash
   npx prisma studio
   ```

3. **Check Browser Console**:
   - Look for authentication errors
   - Check network requests to `/api/auth/callback/google`

4. **Verify NextAuth Pages**:
   - Sign in page: `/auth/signin`
   - Success page: `/auth/success`
   - Callback: `/api/auth/callback/google`

### 🚀 Expected Flow

1. User clicks "Sign in with Google" → `/auth/signin`
2. Google OAuth → `http://localhost:3000/api/auth/callback/google`
3. NextAuth creates/finds user → JWT token created
4. Redirect to → `/auth/success`
5. Success page redirects based on user role/subscription

### ⚠️ Common Issues

- **Port mismatch**: Documentation said 3010, but app uses 3000
- **Cookies**: Clear all localhost cookies
- **Google consent**: May need to re-approve app permissions
- **Database**: User creation might fail due to schema issues

### 📝 Next Steps

1. Fix Google Cloud Console redirect URIs (if not done)
2. Test authentication flow
3. Check browser network tab during auth
4. Verify database user creation
