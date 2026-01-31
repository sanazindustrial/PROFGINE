# 🔐 User Management vs Student Enrollment - Clear Separation

## Overview

The platform has **TWO SEPARATE** user management features that serve different purposes and different roles:

---

## 1. User Management (APP Owner Feature)

### Location

- **URL:** `/admin/users`
- **Navigation:** Top nav → "Admin" button (purple) OR User menu → "Admin Dashboard" → "User Management"

### Who Can Access

- **ADMIN role ONLY** (APP Owner)
- Requires `session.user.role === "ADMIN"`
- Non-admins are automatically redirected to `/dashboard`

### Purpose

Platform-wide user administration for the app owner to manage ALL users on the platform.

### Features

- ✅ View ALL platform users (students, professors, admins)
- ✅ Search and filter users by role
- ✅ Change user roles (ADMIN, PROFESSOR, STUDENT)
- ✅ Delete users from the platform
- ✅ View user statistics (courses, enrollments, submissions)
- ✅ Manage subscriptions and access
- ✅ Platform-wide user metrics

### What It Manages

- **Platform Users:** ALL users across the entire application
- **User Roles:** Can change anyone's role (except own account)
- **User Access:** Platform-level access and permissions
- **Accounts:** Complete user account management

### Visual Indicators

- Purple "Admin" badge in UI
- Shield icon (🛡️)
- "ADMIN ACCESS REQUIRED" badge
- Purple accent colors throughout

### Code Reference

```typescript
// app/admin/users/page.tsx
if (session.user.role !== "ADMIN") {
    redirect("/dashboard")
}

// Manages ALL users
const users = await prisma.user.findMany()
```

---

## 2. Student Enrollment (Professor Feature)

### Location

- **URL:** `/dashboard/enrollment`
- **Navigation:** Dashboard sidebar → "Student Enrollment"

### Who Can Access

- **PROFESSORS** with proper subscription/module access
- **STUDENTS** cannot access (course-specific only)
- **ADMIN** can access but it's not their primary tool

### Purpose

For professors to enroll students specifically in THEIR courses.

### Features

- ✅ View students enrolled in YOUR courses
- ✅ Add students to YOUR courses
- ✅ Remove students from YOUR courses
- ✅ Bulk enrollment operations
- ✅ Course-specific enrollment management
- ✅ Student roster management

### What It Manages

- **Course Enrollments:** Only courses the professor teaches
- **Student-Course Relationships:** Enrollment records
- **Course Access:** Who can access which course
- **Course Rosters:** Student lists per course

### Visual Indicators

- Users icon (👥)
- "Professor Feature" label
- Course-specific context
- Blue/green accent colors

### Code Reference

```typescript
// app/dashboard/enrollment/page.tsx
// Only shows courses where instructor = current user
const courses = await prisma.course.findMany({
    where: {
        instructorId: user.id // Professor's courses ONLY
    }
})
```

---

## Key Differences

| Feature | User Management (Admin) | Student Enrollment (Professor) |
|---------|------------------------|-------------------------------|
| **URL** | `/admin/users` | `/dashboard/enrollment` |
| **Access** | ADMIN only | Professors (with subscription) |
| **Scope** | Entire platform | Professor's courses only |
| **Can Change Roles** | ✅ Yes | ❌ No |
| **Can Delete Users** | ✅ Yes (platform-wide) | ❌ No |
| **Can Enroll Students** | ❌ No (not the purpose) | ✅ Yes (in their courses) |
| **View All Users** | ✅ Yes | ❌ No (only their students) |
| **Platform Statistics** | ✅ Yes | ❌ No |
| **Course-Specific** | ❌ No | ✅ Yes |
| **Badge Color** | Purple (Admin) | Blue (Professor) |
| **Icon** | Shield 🛡️ | Users 👥 |

---

## User Roles Explained

### ADMIN (App Owner)

- **Primary Tool:** User Management (`/admin/users`)
- **Purpose:** Manage the entire platform
- **Can:**
  - Access admin dashboard
  - Manage all users
  - Change roles
  - Delete users
  - View platform statistics
  - Configure platform settings

### PROFESSOR (Instructor)

- **Primary Tool:** Student Enrollment (`/dashboard/enrollment`)
- **Purpose:** Manage their courses
- **Can:**
  - Enroll students in their courses
  - Create and manage courses
  - Grade assignments
  - Generate content
  - View their course statistics

### STUDENT

- **Primary Tool:** Course dashboard
- **Purpose:** Participate in courses
- **Can:**
  - View enrolled courses
  - Submit assignments
  - Participate in discussions
  - Cannot enroll themselves (professor does this)
  - Cannot access any management features

---

## Access Control Flow

### User Management (Admin)

```
User Login
    ↓
Check role
    ↓
role === "ADMIN"? 
    ↓
    YES → Allow access to /admin/users
    NO  → Redirect to /dashboard
```

### Student Enrollment (Professor)

```
User Login
    ↓
Check role
    ↓
role === "PROFESSOR"?
    ↓
    YES → Check module access
           ↓
           Has STUDENT_ENROLLMENT module?
              ↓
              YES → Allow access to /dashboard/enrollment
              NO  → Show upgrade prompt
    NO  → Redirect or show error
```

---

## Navigation

### Admin Access

1. **Top Navigation Bar**
   - Click purple "Admin" button
   - OR Click avatar → "Admin Dashboard"
2. **Admin Dashboard** (`/admin`)
   - Click "User Management" card
3. **User Management** (`/admin/users`)
   - Manage all platform users

### Professor Access

1. **Sidebar** (left side of dashboard)
   - Click "Student Enrollment"
2. **Student Enrollment** (`/dashboard/enrollment`)
   - Enroll students in your courses

---

## API Endpoints

### User Management APIs (Admin Only)

```typescript
PATCH /api/admin/users/role
// Change any user's role

DELETE /api/admin/users/[userId]
// Delete any user from platform
```

### Student Enrollment APIs (Professor)

```typescript
POST /api/courses/[courseId]/enrollments
// Enroll student in professor's course

DELETE /api/courses/[courseId]/enrollments/[enrollmentId]
// Remove student from professor's course
```

---

## Security

### User Management

- ✅ Protected by `requireSession()` with role check
- ✅ Only ADMIN role can access
- ✅ Cannot delete own account
- ✅ All actions logged
- ✅ Platform-wide permissions

### Student Enrollment

- ✅ Protected by `requireSession()` with role check
- ✅ Only PROFESSOR role can access
- ✅ Can only modify their own courses
- ✅ Module access check required
- ✅ Course-scoped permissions

---

## Use Cases

### When to Use User Management (Admin)

- ❓ Need to change someone's role to ADMIN
- ❓ Need to delete a user account entirely
- ❓ Need to view all platform users
- ❓ Need platform statistics
- ❓ Need to manage admin accounts
- ❓ Troubleshooting user access issues

### When to Use Student Enrollment (Professor)

- ❓ Starting a new course and need to add students
- ❓ Student requested to join your course
- ❓ Need to remove student from your course
- ❓ Bulk enrolling students from CSV
- ❓ Managing course rosters
- ❓ Checking who's enrolled in your courses

---

## Summary

**User Management** = APP OWNER manages ALL USERS on the platform (admin tool)

**Student Enrollment** = PROFESSORS enroll STUDENTS in THEIR COURSES (professor tool)

They are **completely separate** features with different:

- Access levels (ADMIN vs PROFESSOR)
- Purposes (platform management vs course management)
- Scope (all users vs course-specific)
- Permissions (can change roles vs can only enroll)
- UI locations (admin area vs dashboard)

This separation ensures:

- ✅ Platform security (admins control who's on platform)
- ✅ Course autonomy (professors control their courses)
- ✅ Clear responsibilities (each role has appropriate tools)
- ✅ Proper access control (no privilege escalation)
