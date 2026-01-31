# Platform Owner vs Regular Admin Setup

## Overview

The system now differentiates between:

- **Platform Owners** (ADMIN role + isOwner = true) - Can manage ALL users
- **Regular Admins** (ADMIN role + isOwner = false) - Cannot access user management

## Step 1: Apply Database Migration

The `isOwner` field has been added to the User model in `prisma/schema.prisma`.

### Option A: Using Prisma Migrate (Recommended)

```powershell
# From project root
cd C:\Users\Allot\OneDrive\Desktop\profhelp-main

# Run migration
pnpm run migration:postgres:local
# When prompted, enter a name: add_is_owner_flag
```

### Option B: Manual SQL (If migration fails)

```sql
-- Connect to your database and run:
ALTER TABLE "User" ADD COLUMN "isOwner" BOOLEAN NOT NULL DEFAULT false;
```

Then regenerate Prisma Client:

```powershell
pnpm prisma:generate
```

## Step 2: Mark a User as Platform Owner

After the migration is applied, run the setup script:

```powershell
# From project root
node scripts/setup-owner.js
```

This script will:

1. Find all ADMIN users
2. If only one ADMIN exists, automatically make them owner
3. If multiple ADMINs exist, prompt you to choose

### Manual SQL Alternative

```sql
-- Update specific user to be owner
UPDATE "User" 
SET "isOwner" = true 
WHERE email = 'your-email@example.com';
```

## Step 3: Restart the Application

```powershell
# Stop current dev server (Ctrl+C in the terminal)
# Start again
pnpm dev
```

## Access Control Summary

### `/user-management` Route

- ✅ **Allowed**: Users with `role = ADMIN` AND `isOwner = true`
- ❌ **Denied**: Regular admins with `isOwner = false`
- ❌ **Denied**: All PROFESSOR and STUDENT users

### Other Admin Routes

- Most other admin routes only check for ADMIN role
- Only user management is restricted to owners

## User Table Display

The user management page now shows:

- Name
- Email  
- Role (ADMIN/PROFESSOR/STUDENT)
- **Owner Status** (👑 Owner badge for platform owners)
- Joined Date

## Creating Additional Owners

To make more users platform owners:

```powershell
node scripts/setup-owner.js
# Or manually update the database
```

## TypeScript Types

The session types already support this:

- `session.user.role` - Contains the UserRole
- Database queries will include `isOwner` field after migration

## Troubleshooting

### Error: Unknown field `isOwner`

**Cause**: Prisma Client not regenerated after schema change
**Fix**: Run `pnpm prisma:generate`

### Error: Column does not exist

**Cause**: Database migration not applied
**Fix**: Run migration using Option A or B above

### Regular admins can still access

**Cause**: User's `isOwner` flag not set correctly  
**Fix**: Check database - `SELECT email, role, "isOwner" FROM "User" WHERE role = 'ADMIN';`

## Files Modified

1. **prisma/schema.prisma** - Added `isOwner Boolean @default(false)` to User model
2. **app/(admin)/user-management/page.tsx** - Added isOwner check and display
3. **scripts/setup-owner.js** - New script to set platform owners
4. **app/admin/users/page.tsx** - Redirect to /user-management

## Next Steps

After completing this setup:

1. ✅ Verify migration applied: Check database for `isOwner` column
2. ✅ Verify owner set: At least one ADMIN user has `isOwner = true`
3. ✅ Test access: Try accessing /user-management as owner vs regular admin
4. ✅ Update any admin creation scripts to set `isOwner` appropriately
