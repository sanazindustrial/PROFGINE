# 🚀 Quick Start Guide - New Features

## What's New

1. **Top Navigation Bar** - Global navigation on all dashboard pages
2. **Admin Dashboard** - Complete platform management for app owners
3. **User Management** - Manage all users, roles, and permissions
4. **Multi-Format Downloads** - Download presentations in PowerPoint, PDF, Keynote, and Google Slides formats

---

## Getting Started

### 1. Install Dependencies

```bash
pnpm install
```

The new `@radix-ui/react-avatar` package is already added to package.json.

### 2. Start Development Server

```bash
pnpm dev
```

### 3. Create an Admin User

```bash
node scripts/setup-admin.js
```

This creates an admin account with:

- Email: <admin@profgenie.com>
- Role: ADMIN

---

## Testing the Features

### Top Navigation

1. Login to the app
2. See the new top navigation bar with:
   - Logo (click to go to dashboard)
   - Quick links (Dashboard, Courses, Studio)
   - Search button
   - Notifications bell
   - User avatar menu

3. Click your avatar to see:
   - Profile link
   - Billing link
   - Settings link
   - Log out button
   - **Admin Dashboard** (if you're an admin)

### Admin Dashboard

1. Login as admin user
2. Click the purple "Admin" button in top nav
3. You'll see:
   - Platform statistics (users, courses, presentations, enrollments)
   - Admin feature cards
   - Recent users list

4. Click "User Management" to manage users

### User Management

1. From admin dashboard, go to User Management
2. You can:
   - Search users by name or email
   - Filter by role (All, Admin, Professor, Student)
   - View user statistics
   - Change user roles (click ⋮ menu)
   - Delete users (click ⋮ menu)

**Role Changes:**

- Make Admin: Gives full platform access
- Make Professor: Can create courses and content
- Make Student: Can enroll in courses

### Multi-Format Downloads

1. Generate a presentation in Course Studio
2. On the results page, you'll see:

**Primary Formats:**

- PowerPoint (Windows) - .pptx for Windows users
- PDF - For viewing/printing only

**Additional Formats:**

- Keynote (Mac) - .key for Mac users
- Google Slides - Instructions to upload to Drive

1. Click any format button to download

---

## File Structure

```
app/
├── admin/
│   ├── layout.tsx              # Admin pages layout
│   ├── page.tsx                # Admin dashboard
│   └── users/
│       └── page.tsx            # User management page
├── api/
│   ├── admin/
│   │   └── users/
│   │       ├── role/
│   │       │   └── route.ts    # Change user role
│   │       └── [userId]/
│   │           └── route.ts    # Delete user
│   └── presentations/
│       └── download/
│           └── route.ts        # Generate format downloads
└── dashboard/
    └── layout.tsx              # Dashboard layout with TopNav

components/
├── admin/
│   └── user-management.tsx     # User management component
├── top-nav.tsx                 # Top navigation bar
├── sidebar.tsx                 # Sidebar (existing)
├── presentation-results.tsx    # Updated with multi-format downloads
└── ui/
    ├── avatar.tsx              # Avatar component (new)
    └── table.tsx               # Table component (new)
```

---

## Key URLs

| Page | URL | Access |
|------|-----|--------|
| Dashboard | `/dashboard` | All users |
| Courses | `/dashboard/courses` | All users |
| Course Studio | `/dashboard/course-design-studio` | Professors |
| Admin Dashboard | `/admin` | ADMIN only |
| User Management | `/admin/users` | ADMIN only |
| Profile | `/dashboard/profile` | All users |
| Billing | `/dashboard/billing` | All users |

---

## Role Permissions

### ADMIN (App Owner)

- ✅ All dashboard features
- ✅ Admin dashboard access
- ✅ User management
- ✅ Change user roles
- ✅ Delete users
- ✅ View platform statistics
- ✅ Access all admin tools

### PROFESSOR (Instructor)

- ✅ Dashboard access
- ✅ Create courses
- ✅ Generate presentations
- ✅ Manage enrollments
- ✅ Grade assignments
- ❌ No admin features

### STUDENT

- ✅ Dashboard access
- ✅ Enroll in courses
- ✅ Submit assignments
- ✅ View grades
- ❌ No course creation
- ❌ No admin features

---

## API Endpoints

### Admin APIs

```typescript
// Change user role
PATCH /api/admin/users/role
Body: { userId: string, role: "ADMIN" | "PROFESSOR" | "STUDENT" }

// Delete user
DELETE /api/admin/users/[userId]
```

### Presentation APIs

```typescript
// Generate format download
POST /api/presentations/download
Body: { 
  presentationId: string, 
  format: "pptx" | "pdf" | "keynote" | "google-slides" 
}
```

---

## Security Notes

1. **Admin pages** are protected - only users with `role: "ADMIN"` can access
2. **API endpoints** verify user role before processing requests
3. **Admins cannot delete themselves** to prevent lockout
4. **All downloads** require authentication and ownership verification

---

## Troubleshooting

### Top Nav Not Showing

- Make sure you're on a page under `/dashboard`
- Check that `app/dashboard/layout.tsx` exists
- Verify session is active

### Admin Menu Not Visible

- Check your user role: `console.log(session.user.role)`
- Run `node scripts/setup-admin.js` to create admin user
- Login with admin credentials

### Download Buttons Not Working

- Verify presentation has `fileUrl` and `pdfUrl`
- Check browser console for errors
- Ensure download API endpoint is accessible

### User Management Not Loading

- Check database connection
- Verify Prisma schema is up to date
- Run `pnpm prisma generate` if needed

---

## Next Steps

1. ✅ Test all features in development
2. ✅ Create admin user for your platform
3. ✅ Set up user roles appropriately
4. ✅ Test multi-format downloads
5. ✅ Deploy to production

---

## Need Help?

- Check the full documentation: `NAVIGATION_ADMIN_IMPLEMENTATION_COMPLETE.md`
- Review the code in each component
- Check API routes for endpoint details
- Look at the Prisma schema for data models

Enjoy your new admin features! 🎉
