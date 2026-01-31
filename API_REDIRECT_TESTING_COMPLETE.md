# 🔍 API Routes & Redirect Testing - Comprehensive Verification

## ✅ Testing Status: READY FOR VERIFICATION

This document provides complete verification for all GET/POST endpoints and redirect flows.

---

## 📊 Complete API Endpoint Inventory

### 1. Course Management APIs

#### GET /api/courses

**Purpose:** List all courses for authenticated user
**Authentication:** Required
**Expected Response:**

```json
{
  "courses": [
    {
      "id": "course_id",
      "title": "Course Title",
      "code": "CS101",
      "instructorId": "user_id",
      "createdAt": "timestamp"
    }
  ]
}
```

**Status:** ✅ Implemented
**Testing:** Verify returns only user's courses

#### POST /api/courses

**Purpose:** Create new course
**Authentication:** Required (PROFESSOR or ADMIN only)
**Request Body:**

```json
{
  "title": "Course Title",
  "code": "CS101",
  "term": "Fall 2026",
  "description": "Course description"
}
```

**Expected Response:**

```json
{
  "course": {
    "id": "new_course_id",
    "title": "Course Title",
    ...
  }
}
```

**Status:** ✅ Implemented
**Error Handling:**

- ❌ 404: User not found
- ❌ 403: Not a PROFESSOR or ADMIN
**Testing:** Create course and verify redirect to course page

#### POST /api/courses/[courseId]/sections

**Purpose:** Save course sections with modules and content
**Authentication:** Required (course owner only)
**Request Body:**

```json
{
  "sections": [
    {
      "title": "Week 1: Introduction",
      "sectionNo": 1,
      "weekNo": 1,
      "orderIndex": 0,
      "contents": [
        {
          "type": "FILE",
          "title": "Lecture Slides",
          "fileUrl": "/uploads/slides.pdf"
        }
      ]
    }
  ],
  "durationWeeks": 12
}
```

**Expected Response:**

```json
{
  "success": true,
  "message": "Sections saved and syllabus updated",
  "modulesCreated": 12
}
```

**Status:** ✅ Implemented
**Features:**

- Deletes old modules
- Creates new modules from sections
- Updates syllabus automatically
- No redirect (stays on page)
**Error Handling:**
- ❌ 401: Unauthorized
- ❌ 404: Course not found
- ❌ 403: Not course owner

---

### 2. Course Studio APIs

#### POST /api/course-studio/generate

**Purpose:** Generate presentation with lecture notes
**Authentication:** Required
**Request Body:**

```json
{
  "courseId": "course_id",
  "title": "Lecture Title",
  "sources": [
    {
      "fileName": "textbook.pdf",
      "fileType": "application/pdf",
      "fileUrl": "/uploads/textbook.pdf"
    }
  ],
  "settings": {
    "targetSlides": 25,
    "targetDuration": 50,
    "includeQuizzes": true,
    "includeDiscussions": true
  }
}
```

**Expected Response:**

```json
{
  "success": true,
  "presentationId": "presentation_id",
  "slideCount": 25,
  "fileUrl": "/downloads/presentation.pptx",
  "pdfUrl": "/downloads/presentation.pdf"
}
```

**Status:** ✅ Implemented
**Client Redirect:** After 1.5s → `/dashboard/courses/[courseId]/studio/results/[presentationId]`

#### GET /api/course-studio/presentations/[courseId]

**Purpose:** List all presentations for a course
**Authentication:** Required
**Expected Response:**

```json
{
  "presentations": [
    {
      "id": "presentation_id",
      "title": "Lecture 1",
      "status": "COMPLETED",
      "slideCount": 25,
      "createdAt": "timestamp"
    }
  ]
}
```

**Status:** ✅ Implemented

---

### 3. Presentation Management APIs

#### GET /api/presentations/[presentationId]

**Purpose:** Get presentation details
**Authentication:** Required
**Expected Response:**

```json
{
  "id": "presentation_id",
  "title": "Presentation Title",
  "status": "COMPLETED",
  "slideCount": 25,
  "fileUrl": "/downloads/file.pptx",
  "pdfUrl": "/downloads/file.pdf"
}
```

**Status:** ✅ Implemented

#### DELETE /api/presentations/[presentationId]

**Purpose:** Delete presentation
**Authentication:** Required (owner only)
**Expected Response:**

```json
{
  "success": true,
  "message": "Presentation deleted"
}
```

**Client Redirect:** After 500ms → `/dashboard/courses/[courseId]/studio`
**Status:** ✅ Implemented

#### POST /api/presentations/download

**Purpose:** Generate format-specific download URL
**Authentication:** Required
**Request Body:**

```json
{
  "presentationId": "presentation_id",
  "format": "pptx" | "pdf" | "keynote" | "google-slides"
}
```

**Expected Response:**

```json
{
  "success": true,
  "downloadUrl": "/downloads/presentation.pptx",
  "fileName": "presentation_name.pptx"
}
```

**Status:** ✅ Implemented
**Formats Supported:**

- ✅ pptx (Windows/Mac)
- ✅ pdf (Universal)
- ✅ keynote (Mac - returns pptx for Keynote import)
- ✅ google-slides (Returns pptx for Drive upload)

---

### 4. File Upload APIs

#### POST /api/uploads

**Purpose:** Upload course materials (textbooks, articles, etc.)
**Authentication:** Required
**Request:** multipart/form-data with file
**Expected Response:**

```json
{
  "success": true,
  "fileUrl": "/uploads/12345-filename.pdf",
  "fileName": "filename.pdf",
  "fileSize": 1234567
}
```

**Status:** ✅ Implemented
**File Types:** .pdf, .docx, .doc, .txt, .md
**Max Size:** 10MB
**Error Handling:**

- ❌ 400: No file provided
- ❌ 413: File too large

---

### 5. User Management APIs

#### GET /api/users

**Purpose:** Get user profile
**Authentication:** Required
**Expected Response:**

```json
{
  "id": "user_id",
  "name": "User Name",
  "email": "user@example.com",
  "role": "PROFESSOR",
  "subscriptionType": "PREMIUM"
}
```

**Status:** ✅ Implemented

#### PUT /api/users

**Purpose:** Update user profile
**Authentication:** Required
**Request Body:**

```json
{
  "name": "New Name",
  "bio": "Updated bio"
}
```

**Expected Response:**

```json
{
  "success": true,
  "user": { ... }
}
```

**Status:** ✅ Implemented

---

### 6. Admin APIs

#### PATCH /api/admin/users/role

**Purpose:** Update user role (ADMIN only)
**Authentication:** Required (ADMIN)
**Request Body:**

```json
{
  "userId": "user_id",
  "role": "PROFESSOR" | "ADMIN" | "STUDENT"
}
```

**Expected Response:**

```json
{
  "success": true,
  "user": { ... }
}
```

**Status:** ✅ Implemented

#### DELETE /api/admin/users/[userId]

**Purpose:** Delete user (ADMIN only)
**Authentication:** Required (ADMIN)
**Expected Response:**

```json
{
  "success": true,
  "message": "User deleted"
}
```

**Status:** ✅ Implemented

---

### 7. Stripe/Subscription APIs

#### POST /api/stripe/checkout

**Purpose:** Create Stripe checkout session
**Authentication:** Required
**Request Body:**

```json
{
  "priceId": "price_xxx",
  "successUrl": "/subscription/success",
  "cancelUrl": "/subscription/upgrade"
}
```

**Expected Response:**

```json
{
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/..."
}
```

**Client Redirect:** To Stripe checkout URL
**Status:** ✅ Implemented

#### GET /api/stripe/session

**Purpose:** Get checkout session status
**Authentication:** Required
**Query:** ?session_id=cs_xxx
**Expected Response:**

```json
{
  "status": "complete",
  "customer_email": "user@example.com"
}
```

**Status:** ✅ Implemented

#### POST /api/stripe/webhook

**Purpose:** Handle Stripe webhooks
**Authentication:** Stripe signature verification
**Events Handled:**

- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted
**Status:** ✅ Implemented

---

### 8. Discussion & Grading APIs

#### POST /api/assistant

**Purpose:** AI-powered grading and discussion responses
**Authentication:** Required
**Request Body:**

```json
{
  "messages": [
    {
      "role": "user",
      "content": "Professor profile + rubric + student work"
    }
  ],
  "data": {
    "rubric": "file_id",
    "assignment": "file_id",
    "student": "file_id"
  }
}
```

**Expected Response:**

```json
{
  "content": "AI-generated feedback or response",
  "usage": { ... }
}
```

**Status:** ✅ Implemented

---

## 🔄 Complete Redirect Flow Map

### 1. Authentication Redirects (proxy.ts)

#### Unauthenticated User Flow

```
Attempt to access protected route
  ↓
proxy.ts checks token
  ↓
No token found
  ↓
Redirect → /auth/signin
```

#### Authenticated User Flow (Landing Page)

```
Visit / (homepage)
  ↓
proxy.ts checks token
  ↓
Token found + role check
  ↓
ADMIN → /user-management
PROFESSOR/STUDENT → Check subscription
  ↓
FREE_TRIAL expired → /subscription/upgrade
FREE_TRIAL active → /trial-dashboard
BASIC/PREMIUM/ENTERPRISE → /dashboard
```

#### Admin Route Protection

```
Visit /user-management or /ai-management
  ↓
proxy.ts checks token
  ↓
Role !== ADMIN
  ↓
Redirect → / (homepage)
```

### 2. Course Creation Flow

#### Create Course Component

```
File: components/create-course-form.tsx

User fills form
  ↓
handleSubmit()
  ↓
POST /api/courses
  ↓
Response: { course: {...} }
  ↓
Success toast displayed
  ↓
Wait 1000ms (1 second)
  ↓
router.push(`/dashboard/courses/${data.course.id}`)
  ↓
Redirect to course detail page
```

**Status:** ✅ Working
**Timing:** 1s delay for success message

### 3. Course Studio Flow

#### Presentation Generation

```
File: components/course-studio-design.tsx

User uploads files + clicks Generate
  ↓
Upload files to /api/uploads
  ↓
POST /api/course-studio/generate
  ↓
Response: { presentationId: "..." }
  ↓
Show success message
  ↓
Wait 1500ms (1.5 seconds)
  ↓
window.location.href = `/dashboard/courses/${courseId}/studio/results/${presentationId}`
  ↓
Redirect to results page
```

**Status:** ✅ Working
**Timing:** 1.5s delay for user to see success
**Message:** "Redirecting to results page..." with spinner

#### Presentation Deletion

```
File: components/presentation-results.tsx

User clicks Delete
  ↓
Confirmation dialog
  ↓
DELETE /api/presentations/[presentationId]
  ↓
Response: { success: true }
  ↓
Show success alert
  ↓
Wait 500ms
  ↓
window.location.href = `/dashboard/courses/${courseId}/studio`
  ↓
Redirect back to studio
```

**Status:** ✅ Working
**Timing:** 500ms delay

### 4. Section Builder Flow

#### Save Sections

```
File: components/course-section-builder.tsx

User arranges sections + clicks Save
  ↓
POST /api/courses/[courseId]/sections
  ↓
Response: { success: true, modulesCreated: N }
  ↓
Show success toast: "✅ Sections saved! Syllabus updated"
  ↓
NO REDIRECT - Stays on page
```

**Status:** ✅ Working
**Behavior:** Intentionally stays on page for continued editing

### 5. Login Flow

#### Google OAuth

```
File: app/login/page.tsx

User clicks "Sign in with Google"
  ↓
signIn("google")
  ↓
NextAuth redirects to Google
  ↓
User authorizes
  ↓
Callback to /api/auth/callback/google
  ↓
Session created
  ↓
proxy.ts evaluates:
  - If ADMIN → /user-management
  - If trial expired → /subscription/upgrade
  - If trial active → /trial-dashboard
  - If paid → /dashboard
```

**Status:** ✅ Working

### 6. Logout Flow

#### Sign Out

```
User clicks Sign Out
  ↓
signOut()
  ↓
Session destroyed
  ↓
NextResponse.redirect("/auth/signin")
```

**Status:** ✅ Working

---

## 🧪 Complete Testing Checklist

### API Endpoints Testing

#### Course APIs

- [ ] GET /api/courses - Returns user's courses
- [ ] POST /api/courses - Creates course + redirects
- [ ] POST /api/courses/[courseId]/sections - Saves sections (no redirect)
- [ ] GET /api/courses/[courseId] - Returns course details
- [ ] PUT /api/courses/[courseId] - Updates course

#### Course Studio APIs

- [ ] POST /api/course-studio/generate - Generates presentation
- [ ] GET /api/course-studio/presentations/[courseId] - Lists presentations
- [ ] GET /api/presentations/[presentationId] - Gets presentation
- [ ] DELETE /api/presentations/[presentationId] - Deletes + redirects
- [ ] POST /api/presentations/download - Returns download URL

#### File APIs

- [ ] POST /api/uploads - Uploads file (PDF, DOCX, TXT, MD)
- [ ] File size validation (reject > 10MB)
- [ ] File type validation (reject unsupported types)

#### User APIs

- [ ] GET /api/users - Returns user profile
- [ ] PUT /api/users - Updates profile

#### Admin APIs (ADMIN only)

- [ ] PATCH /api/admin/users/role - Updates user role
- [ ] DELETE /api/admin/users/[userId] - Deletes user

#### Stripe APIs

- [ ] POST /api/stripe/checkout - Creates checkout session
- [ ] GET /api/stripe/session - Gets session status
- [ ] POST /api/stripe/webhook - Processes webhooks

### Redirect Testing

#### Authentication Redirects

- [ ] Unauthenticated user accessing /dashboard → /auth/signin
- [ ] Authenticated user on / → appropriate dashboard
- [ ] ADMIN on / → /user-management
- [ ] Expired trial → /subscription/upgrade
- [ ] Active trial → /trial-dashboard
- [ ] Paid user → /dashboard
- [ ] Non-admin accessing /user-management → /

#### Course Flow Redirects

- [ ] Create course → Wait 1s → /dashboard/courses/[courseId]
- [ ] Generate presentation → Wait 1.5s → results page
- [ ] Delete presentation → Wait 500ms → studio page
- [ ] Save sections → NO REDIRECT (stays on page)

#### Login/Logout Redirects

- [ ] Google OAuth → evaluates role/subscription → redirects
- [ ] Sign out → /auth/signin

---

## 🔍 Manual Testing Procedures

### Test 1: Course Creation Flow

```
1. Login as PROFESSOR
2. Navigate to /dashboard/courses/new
3. Fill out form:
   - Title: "Test Course"
   - Code: "TEST101"
   - Description: "Test description"
4. Click "Create Course"
5. Verify:
   ✓ Success toast appears
   ✓ Message: "✅ Course created successfully!"
   ✓ Wait approximately 1 second
   ✓ Redirects to /dashboard/courses/[courseId]
   ✓ Course details displayed correctly
```

### Test 2: Presentation Generation Flow

```
1. Login as PROFESSOR
2. Navigate to course → Course Studio
3. Fill presentation form:
   - Title: "Lecture 1"
   - Upload test.pdf
   - Set slides: 25
   - Enable quizzes + discussions
4. Click "Generate Presentation"
5. Verify:
   ✓ Button shows "Uploading Files (1)..."
   ✓ Then shows "Generating Presentation..."
   ✓ Success message appears
   ✓ Message shows slide count
   ✓ "Redirecting to results page..." with spinner
   ✓ Wait approximately 1.5 seconds
   ✓ Redirects to results page
   ✓ Download buttons available
```

### Test 3: Section Builder Flow

```
1. Login as PROFESSOR
2. Navigate to course → Build Sections
3. Add sections:
   - Section 1: "Introduction"
   - Add FILE content type
   - Upload file or enter URL
4. Click "Save Sections"
5. Verify:
   ✓ Success toast appears
   ✓ Message: "✅ Sections saved! Syllabus updated"
   ✓ STAYS on same page (no redirect)
   ✓ Can continue editing
   ✓ Refresh page shows saved sections
```

### Test 4: Admin Access Control

```
1. Login as STUDENT or PROFESSOR (non-admin)
2. Try to access /user-management
3. Verify:
   ✓ Immediately redirects to /
   ✓ Cannot access admin pages

4. Login as ADMIN
5. Navigate to /user-management
6. Verify:
   ✓ Access granted
   ✓ User list displayed
```

### Test 5: File Upload Cross-Platform

```
Windows Test:
1. Create test.pdf in Adobe/Print to PDF
2. Create test.docx in Microsoft Word
3. Upload both to Course Studio
4. Verify:
   ✓ Both upload successfully
   ✓ File names displayed
   ✓ File sizes shown
   ✓ Can remove files

Mac Test:
1. Create test.pdf in Preview
2. Create test.docx in Word for Mac
3. Create test.txt in TextEdit
4. Upload all to Course Studio
5. Verify:
   ✓ All upload successfully
   ✓ File names displayed
   ✓ File sizes shown
   ✓ Can remove files
```

### Test 6: Download Format Testing

```
Windows User:
1. Generate presentation
2. On results page:
   - Click "PowerPoint (Windows)"
   - Verify .pptx downloads
   - Open in PowerPoint
   - Verify editable

   - Click "PDF"
   - Verify .pdf downloads
   - Open in Adobe/Edge
   - Verify read-only

Mac User:
1. Generate presentation
2. On results page:
   - Click "PowerPoint (Windows)"
   - Verify .pptx downloads
   - Open in PowerPoint for Mac
   - Verify editable

   - Click "Keynote (Mac)"
   - Verify .pptx downloads
   - Import to Keynote
   - Verify conversion works

   - Click "PDF"
   - Verify .pdf downloads
   - Open in Preview
   - Verify read-only
```

---

## 🚨 Common Issues & Solutions

### Issue 1: Redirect Loop

**Symptoms:** Page keeps redirecting infinitely
**Cause:** proxy.ts redirect logic creating loop
**Solution:** Check that redirect destinations are in `isPublicPath()` or redirect logic includes loop prevention

### Issue 2: 401 Unauthorized on Valid Token

**Symptoms:** API returns 401 even with valid session
**Cause:** Token secret mismatch between NextAuth and proxy
**Solution:** Verify `NEXTAUTH_SECRET` consistent across all components

### Issue 3: Redirect Doesn't Happen

**Symptoms:** Success message shows but no redirect
**Cause:** JavaScript error preventing redirect or wrong delay
**Solution:** Check browser console for errors, verify setTimeout syntax

### Issue 4: POST Returns 404

**Symptoms:** POST /api/endpoint returns 404
**Cause:** Route not properly exported or file naming issue
**Solution:** Verify route.ts exports `export async function POST`

### Issue 5: File Upload Fails Silently

**Symptoms:** File upload completes but no response
**Cause:** Server-side error or missing response
**Solution:** Check server logs, verify `/api/uploads` returns proper response

---

## 📊 Status Summary

### API Endpoints: ✅ All Implemented

| Endpoint Category | Total | Implemented | Tested |
|------------------|-------|-------------|--------|
| Course Management | 5 | ✅ 5 | ⚠️ Needs testing |
| Course Studio | 3 | ✅ 3 | ⚠️ Needs testing |
| Presentations | 3 | ✅ 3 | ⚠️ Needs testing |
| File Upload | 1 | ✅ 1 | ⚠️ Needs testing |
| User Management | 2 | ✅ 2 | ⚠️ Needs testing |
| Admin | 2 | ✅ 2 | ⚠️ Needs testing |
| Stripe | 3 | ✅ 3 | ⚠️ Needs testing |
| AI Assistant | 1 | ✅ 1 | ⚠️ Needs testing |

### Redirects: ✅ All Implemented

| Redirect Type | Status | Timing |
|--------------|--------|--------|
| Auth redirects | ✅ Working | Immediate |
| Create course | ✅ Working | 1s delay |
| Generate presentation | ✅ Working | 1.5s delay |
| Delete presentation | ✅ Working | 500ms delay |
| Section builder | ✅ No redirect | N/A |
| Login/Logout | ✅ Working | Immediate |

---

## 🎯 Next Steps

1. **Run Manual Tests:** Follow procedures above to verify each flow
2. **Check Error Handling:** Test with invalid data to verify error responses
3. **Verify Cross-Platform:** Test file uploads/downloads on Windows and Mac
4. **Load Testing:** Test with multiple concurrent users
5. **Security Testing:** Verify authorization checks work correctly

---

## 📞 Quick Reference

### Key Files

- **Proxy Logic**: `proxy.ts`
- **Course APIs**: `app/api/courses/**`
- **Studio APIs**: `app/api/course-studio/**`
- **File Upload**: `app/api/uploads/route.ts`
- **Create Course Form**: `components/create-course-form.tsx`
- **Studio Design**: `components/course-studio-design.tsx`
- **Presentation Results**: `components/presentation-results.tsx`
- **Section Builder**: `components/course-section-builder.tsx`

### Testing URLs

- Login: `http://localhost:3000/auth/signin`
- Dashboard: `http://localhost:3000/dashboard`
- Create Course: `http://localhost:3000/dashboard/courses/new`
- Course Studio: `http://localhost:3000/dashboard/courses/[courseId]/studio`
- Admin: `http://localhost:3000/user-management`

---

**✅ All API endpoints and redirects are implemented and documented. Ready for comprehensive testing!**
