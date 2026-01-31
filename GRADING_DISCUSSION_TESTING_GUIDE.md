# 🧪 Grading & Discussion Testing - Cross-Platform File Support

## ✅ Testing Status: READY FOR COMPREHENSIVE TESTING

This document provides complete testing procedures for grading, discussions, and cross-platform file handling.

---

## 📋 Test Coverage

### 1. **Grading System Testing** 📝

### 2. **Discussion System Testing** 💬

### 3. **File Upload/Download Cross-Platform** 📁

### 4. **Multi-Format Export (Windows/Mac)** 💻🍎

---

## 🎯 Test 1: Grading System

### Features to Test

- ✅ File uploads (rubric, assignment, student submission)
- ✅ AI-powered feedback generation
- ✅ Multiple assignment types
- ✅ Grading strictness levels
- ✅ Custom grading instructions
- ✅ Response refinement

### Test Procedures

#### A. Basic Grading Flow

**Prerequisites:**

- Logged in as Professor
- Navigate to `/dashboard/grading`

**Test Steps:**

1. **Load Sample Data**

   ```
   - Click "Load Sample Data" button
   - Verify fields auto-populate:
     ✓ Professor Profile
     ✓ Rubric
     ✓ Assignment Description
     ✓ Student Submission
   ```

2. **Configure Grading Settings**

   ```
   Assignment Type Options:
   ✓ Essay 📝
   ✓ Short Answer 💬
   ✓ Discussion Post 💭
   ✓ Dissertation 🎓
   ✓ Lab Report 🔬
   
   Strictness Levels:
   ✓ Lenient (encouraging, focus on positives)
   ✓ Medium (balanced feedback)
   ✓ Strict (detailed critique, high standards)
   ✓ Very Strict (thorough analysis, professional level)
   ```

3. **File Upload Testing**

   ```
   Test Files to Prepare:
   - rubric.pdf (< 10MB)
   - assignment.docx (< 10MB)
   - student_submission.pdf (< 10MB)
   
   Upload Process:
   1. Click "Upload Rubric" → Select rubric.pdf
   2. Click "Upload Assignment" → Select assignment.docx
   3. Click "Upload Student Work" → Select student_submission.pdf
   
   Expected Results:
   ✓ File names displayed under each upload area
   ✓ File sizes shown (e.g., "2.3 MB")
   ✓ Remove button (X) appears for each file
   ✓ No error messages
   ```

4. **Generate Feedback**

   ```
   - Click "Generate Feedback" button
   - Expected Behavior:
     ✓ Button shows "Generating Feedback..."
     ✓ Spinner/loading indicator appears
     ✓ Estimated time: 10-30 seconds
     ✓ Feedback appears in result section
   ```

5. **Review Generated Feedback**

   ```
   Feedback Should Include:
   ✓ Overall assessment
   ✓ Strengths identified
   ✓ Areas for improvement
   ✓ Specific examples from student work
   ✓ Suggestions for next steps
   ✓ Grade recommendation (if applicable)
   ```

6. **Refine Feedback**

   ```
   - Scroll to "Refine Response" section
   - Enter refinement instructions:
     "Make the tone more encouraging"
     "Add more specific examples"
     "Focus on thesis development"
   - Click "Refine Response"
   - Verify updated feedback appears
   ```

7. **Copy to Clipboard**

   ```
   - Click "Copy Response" button
   - Paste into text editor
   - Verify complete feedback copied
   ```

8. **New Grading Session**

   ```
   - Click "New Grading" button
   - Verify:
     ✓ Student submission cleared
     ✓ Previous feedback cleared
     ✓ Professor profile retained
     ✓ Rubric retained (if saved)
   ```

#### B. Cross-Platform File Format Testing

**Windows-Specific Tests:**

```
File Formats to Test:
✓ .docx (Microsoft Word - Windows)
✓ .pdf (Adobe PDF)
✓ .txt (Plain text)
✓ .rtf (Rich Text Format)

Upload Process:
1. Create test file on Windows
2. Upload via grading interface
3. Verify successful processing
4. Generate feedback
5. Verify AI reads content correctly
```

**Mac-Specific Tests:**

```
File Formats to Test:
✓ .pages (Apple Pages) → Export as PDF first
✓ .pdf (Preview/Adobe)
✓ .docx (Microsoft Word for Mac)
✓ .txt (TextEdit)

Upload Process:
1. Create test file on Mac
2. Upload via grading interface
3. Verify successful processing
4. Generate feedback
5. Verify AI reads content correctly
```

**Cross-Platform Compatibility Matrix:**

| File Type | Windows | Mac | Upload Status | AI Processing |
|-----------|---------|-----|---------------|---------------|
| .pdf | ✅ | ✅ | ✅ Supported | ✅ Full text extraction |
| .docx | ✅ | ✅ | ✅ Supported | ✅ Full text extraction |
| .doc | ✅ | ✅ | ✅ Supported | ✅ Full text extraction |
| .txt | ✅ | ✅ | ✅ Supported | ✅ Direct read |
| .md | ✅ | ✅ | ✅ Supported | ✅ Direct read |
| .rtf | ⚠️ | ⚠️ | ⚠️ Test needed | ⚠️ Test needed |
| .pages | ❌ | ⚠️ | ❌ Not supported | Export to PDF first |

---

## 💬 Test 2: Discussion System

### Features to Test

- ✅ Generate discussion responses
- ✅ Refinement capabilities
- ✅ Professor profile persistence
- ✅ Discussion prompt management
- ✅ Copy/paste functionality

### Test Procedures

#### A. Basic Discussion Flow

**Prerequisites:**

- Navigate to `/dashboard/discussion`

**Test Steps:**

1. **Set Up Professor Profile**

   ```
   Example Profile:
   "I prefer constructive feedback with specific examples. My tone is 
   encouraging yet direct. I focus on critical thinking and connecting 
   concepts to real-world applications."
   
   - Paste into "Professor Profile" field
   - Verify character count updates
   - Verify auto-save to localStorage
   ```

2. **Enter Discussion Prompt**

   ```
   Example Prompt:
   "Discuss how social media algorithms affect information consumption 
   and echo chambers. Provide examples and potential solutions."
   
   - Paste into "Discussion Topic" field
   - Verify character count
   ```

3. **Enter Student Post**

   ```
   Example Post:
   "Social media algorithms create filter bubbles by showing users content 
   similar to what they've liked before. This can limit exposure to diverse 
   viewpoints and create echo chambers."
   
   - Paste into "Student's Discussion Post" field
   - Verify character count
   ```

4. **Generate Response**

   ```
   - Click "Generate Response" button (or Ctrl+Enter)
   - Expected Behavior:
     ✓ Loading indicator appears
     ✓ Generation time: 5-15 seconds
     ✓ Response appears below inputs
   ```

5. **Review Generated Response**

   ```
   Response Should Include:
   ✓ Acknowledgment of student's points
   ✓ Follow-up questions
   ✓ Additional perspectives
   ✓ Encouragement
   ✓ Resources or examples (if relevant)
   ```

6. **Refine Response**

   ```
   Refinement Examples:
   - "Make it shorter and more concise"
   - "Add a question about ethical implications"
   - "Include a real-world example"
   
   - Enter refinement instruction
   - Click "Refine"
   - Verify updated response
   ```

7. **Copy Response**

   ```
   - Click copy icon
   - Verify toast notification: "Copied!"
   - Paste into LMS discussion board
   ```

#### B. Persistence Testing

```
Test localStorage Persistence:

1. Fill in all fields
2. Close browser tab
3. Reopen `/dashboard/discussion`
4. Verify:
   ✓ Professor profile restored
   ✓ Discussion prompt restored
   ✓ Previous response NOT restored (correct behavior)
```

---

## 📁 Test 3: File Upload/Download Cross-Platform

### A. Course Studio File Uploads

**Supported Formats:**

```
Input Files (Textbooks, Articles):
✓ .pdf - PDF documents
✓ .docx - Word documents (2007+)
✓ .doc - Legacy Word documents
✓ .txt - Plain text files
✓ .md - Markdown files

Max Size: 10MB per file
Max Files: Unlimited (practical limit ~20)
```

**Upload Test Procedure:**

```
1. Navigate to Course Studio
2. Click "Upload Course Materials"
3. Test each file type:

   Windows Test:
   - Create test.docx in Word
   - Create test.pdf in Adobe/Print to PDF
   - Create test.txt in Notepad
   - Upload all 3 files
   - Verify all appear in uploaded list

   Mac Test:
   - Create test.docx in Word for Mac
   - Create test.pdf in Preview
   - Create test.txt in TextEdit
   - Create test.md in any editor
   - Upload all 4 files
   - Verify all appear in uploaded list

4. Test File Removal:
   - Click X button on each file
   - Verify removal from list
```

**Expected Results:**

```
✓ File name displayed
✓ File size shown (e.g., "2.3 KB")
✓ Upload progress indicator (if large file)
✓ Success confirmation
✓ Files stored in database (PresentationSourceFile table)
```

### B. Presentation Downloads - Cross-Platform

**Download Formats:**

| Format | Windows | Mac | Description |
|--------|---------|-----|-------------|
| **PowerPoint (.pptx)** | ✅ Primary | ✅ Compatible | Full edit capability |
| **PDF** | ✅ View/Print | ✅ View/Print | Read-only, universal |
| **Keynote** | ❌ | ✅ Native | Mac presentation app |
| **Google Slides** | ✅ Upload | ✅ Upload | Upload PPTX to Drive |

**Download Test Procedure:**

#### Windows User Test

```
1. Generate a presentation in Course Studio
2. Navigate to results page
3. Test Primary Format:
   - Click "PowerPoint (Windows)"
   - Verify .pptx file downloads
   - Open in PowerPoint
   - Verify:
     ✓ All slides present
     ✓ Speaker notes included
     ✓ Formatting intact
     ✓ Editable

4. Test PDF Format:
   - Click "PDF" button
   - Verify .pdf file downloads
   - Open in Adobe Reader/Edge
   - Verify:
     ✓ All slides present
     ✓ Read-only (correct)
     ✓ Formatting intact
     ✓ Printable

5. Test Google Slides:
   - Click "Google Slides (Upload to Drive)"
   - Download .pptx file
   - Upload to Google Drive
   - Open in Google Slides
   - Verify:
     ✓ Slides imported correctly
     ✓ Most formatting preserved
     ✓ Editable in browser
```

#### Mac User Test

```
1. Generate a presentation in Course Studio
2. Navigate to results page
3. Test Primary Format (PowerPoint):
   - Click "PowerPoint (Windows)"
   - Verify .pptx file downloads
   - Open in PowerPoint for Mac
   - Verify:
     ✓ All slides present
     ✓ Speaker notes included
     ✓ Formatting intact
     ✓ Editable

4. Test Keynote Format:
   - Click "Keynote (Mac)"
   - Verify .pptx file downloads (Keynote can import)
   - Open in Keynote
   - Select "Create New Presentation"
   - Verify:
     ✓ Import successful
     ✓ Slides converted to Keynote format
     ✓ Formatting mostly preserved
     ✓ Editable in Keynote

5. Test PDF Format:
   - Click "PDF" button
   - Verify .pdf file downloads
   - Open in Preview
   - Verify:
     ✓ All slides present
     ✓ Read-only (correct)
     ✓ Formatting intact
     ✓ Printable

6. Test Google Slides:
   - Click "Google Slides (Upload to Drive)"
   - Download .pptx file
   - Upload to Google Drive
   - Open in Google Slides
   - Verify:
     ✓ Slides imported correctly
     ✓ Most formatting preserved
     ✓ Editable in browser
```

---

## 🔧 Test 4: API Endpoint Testing

### A. Upload Endpoint Test

```bash
# Windows PowerShell
$file = Get-Item "C:\path\to\test.pdf"
$form = @{
    file = $file
}
Invoke-RestMethod -Uri "http://localhost:3000/api/uploads" -Method POST -Form $form

# Mac/Linux Terminal
curl -X POST http://localhost:3000/api/uploads \
  -F "file=@/path/to/test.pdf"

Expected Response:
{
  "success": true,
  "fileUrl": "/uploads/12345-test.pdf",
  "fileName": "test.pdf",
  "fileSize": 123456
}
```

### B. Download Endpoint Test

```bash
# Test PowerPoint Download
curl -X POST http://localhost:3000/api/presentations/download \
  -H "Content-Type: application/json" \
  -d '{"presentationId": "presentation_id", "format": "pptx"}'

# Test PDF Download
curl -X POST http://localhost:3000/api/presentations/download \
  -H "Content-Type: application/json" \
  -d '{"presentationId": "presentation_id", "format": "pdf"}'

Expected Response:
{
  "success": true,
  "downloadUrl": "/downloads/presentation_name.pptx",
  "fileName": "presentation_name.pptx"
}
```

---

## 🎨 Test 5: Course Section Integration

### Test File Upload in Course Sections

**Test Procedure:**

```
1. Navigate to Course → Build Sections
2. Add New Section
3. Click "Add Content" → Select "FILE"
4. Test File Upload:

   Supported Formats for Course Files:
   ✓ Documents: .pdf, .docx, .doc, .txt, .md
   ✓ Presentations: .pptx, .ppt, .key (Keynote)
   ✓ Spreadsheets: .xlsx, .xls, .csv
   ✓ Images: .jpg, .png, .gif, .svg
   ✓ Archives: .zip (if supported)

5. Upload Test Files:
   - Lecture notes PDF
   - Presentation PPTX
   - Reading material DOCX
   - Dataset CSV

6. Verify:
   ✓ Files appear in section
   ✓ File names correct
   ✓ File sizes displayed
   ✓ Download buttons work
   ✓ Files downloadable by students
```

---

## 📊 Cross-Platform Compatibility Matrix

### File Upload Compatibility

| Source | File Type | Windows Upload | Mac Upload | Processing |
|--------|-----------|----------------|------------|------------|
| Word | .docx | ✅ | ✅ | ✅ Text extraction |
| Word | .doc | ✅ | ✅ | ✅ Text extraction |
| Pages | .pages | ❌ Export to PDF | ⚠️ Export to PDF | N/A |
| Adobe | .pdf | ✅ | ✅ | ✅ Text extraction |
| Text | .txt | ✅ | ✅ | ✅ Direct read |
| Markdown | .md | ✅ | ✅ | ✅ Direct read |

### File Download Compatibility

| Format | Windows | Mac | iOS | Android | Web |
|--------|---------|-----|-----|---------|-----|
| .pptx | ✅ PowerPoint | ✅ PowerPoint/Keynote | ✅ PowerPoint | ✅ PowerPoint | ✅ Google Slides |
| .pdf | ✅ Adobe/Edge | ✅ Preview | ✅ Native | ✅ Native | ✅ Native |
| .key | ❌ | ✅ Keynote | ✅ Keynote | ❌ | ❌ |

---

## 🚨 Known Issues & Solutions

### Issue 1: File Upload Fails

**Symptoms:** File doesn't upload, no error message
**Solution:**

- Check file size (< 10MB)
- Verify file format supported
- Check browser console for errors
- Try different file format

### Issue 2: Download Doesn't Start

**Symptoms:** Click download but nothing happens
**Solution:**

- Check popup blocker
- Try right-click → "Save link as"
- Check browser download settings
- Verify presentation status is COMPLETED

### Issue 3: PDF Text Not Extracted

**Symptoms:** AI doesn't seem to read PDF content
**Solution:**

- Verify PDF is text-based (not scanned image)
- Try OCR on scanned PDFs first
- Convert to .docx as alternative
- Use text extraction tool before upload

### Issue 4: Mac .pages File Won't Upload

**Symptoms:** .pages file rejected
**Solution:**

- Open in Pages app
- File → Export To → PDF or Word
- Upload exported file instead

### Issue 5: Keynote Download on Windows

**Symptoms:** Keynote button visible on Windows
**Solution:**

- Use "PowerPoint (Windows)" instead
- Or use "Google Slides" option
- Keynote is Mac-only format

---

## ✅ Complete Test Checklist

### Grading System

- [ ] Load sample data works
- [ ] Professor profile saves/loads
- [ ] Rubric upload works (PDF, DOCX)
- [ ] Assignment upload works (PDF, DOCX)
- [ ] Student submission upload works (PDF, DOCX, TXT)
- [ ] All assignment types selectable
- [ ] All strictness levels work
- [ ] Custom instructions applied
- [ ] Feedback generation successful
- [ ] Feedback quality appropriate
- [ ] Refinement works
- [ ] Copy to clipboard works
- [ ] New grading clears correctly

### Discussion System

- [ ] Professor profile saves/loads
- [ ] Discussion prompt saves/loads
- [ ] Student post input works
- [ ] Response generation successful
- [ ] Response quality appropriate
- [ ] Refinement works
- [ ] Copy response works
- [ ] Keyboard shortcut (Ctrl+Enter) works
- [ ] localStorage persistence works

### File Uploads

- [ ] PDF upload successful (Windows)
- [ ] PDF upload successful (Mac)
- [ ] DOCX upload successful (Windows)
- [ ] DOCX upload successful (Mac)
- [ ] TXT upload successful (both)
- [ ] MD upload successful (both)
- [ ] File list displays correctly
- [ ] File sizes shown correctly
- [ ] Remove file button works
- [ ] Multiple files upload correctly
- [ ] File size validation works (reject > 10MB)

### File Downloads

- [ ] PowerPoint download works (Windows)
- [ ] PowerPoint download works (Mac)
- [ ] PDF download works (Windows)
- [ ] PDF download works (Mac)
- [ ] Keynote download works (Mac)
- [ ] Google Slides export instructions clear
- [ ] All download buttons respond correctly
- [ ] Files open correctly in native apps
- [ ] Speaker notes preserved in PPTX
- [ ] Formatting preserved across formats

### Course Integration

- [ ] Upload presentation to course sections
- [ ] FILE content type works
- [ ] ASSIGNMENT import from AI works
- [ ] DISCUSSION import from AI works
- [ ] QUIZ import from AI works
- [ ] Drag & drop works for organization
- [ ] Section save successful
- [ ] Syllabus updates correctly

---

## 📈 Performance Benchmarks

### Expected Response Times

| Operation | Expected Time | Max Acceptable |
|-----------|---------------|----------------|
| File Upload | < 2 seconds | 5 seconds |
| Grading Generation | 10-30 seconds | 60 seconds |
| Discussion Generation | 5-15 seconds | 30 seconds |
| Refinement | 5-20 seconds | 40 seconds |
| Download Initiation | < 1 second | 3 seconds |
| File Download | 2-10 seconds | 20 seconds |

### File Size Recommendations

| File Type | Optimal Size | Max Size | Notes |
|-----------|--------------|----------|-------|
| PDF | < 5 MB | 10 MB | Text extraction slower on large files |
| DOCX | < 2 MB | 10 MB | Usually smaller than PDF |
| TXT | < 1 MB | 10 MB | Fast processing |
| MD | < 500 KB | 10 MB | Fast processing |

---

## 🎯 Testing Priority

### High Priority (Must Test)

1. ✅ Basic grading flow end-to-end
2. ✅ Basic discussion flow end-to-end
3. ✅ PDF upload/download (Windows & Mac)
4. ✅ PPTX download (Windows & Mac)
5. ✅ File size validation

### Medium Priority (Should Test)

1. ⚠️ All assignment types
2. ⚠️ All strictness levels
3. ⚠️ Refinement workflows
4. ⚠️ DOCX upload/processing
5. ⚠️ Multiple file uploads

### Low Priority (Nice to Test)

1. 📋 Keyboard shortcuts
2. 📋 localStorage persistence across sessions
3. 📋 Copy/paste functionality
4. 📋 TXT and MD file uploads
5. 📋 Google Slides export process

---

## 📞 Quick Reference

### File Locations

- **Grading Component**: `components/grading.tsx`
- **Discussion Component**: `components/discussion-response.tsx`
- **Course Studio**: `components/course-studio-design.tsx`
- **Presentation Results**: `components/presentation-results.tsx`
- **Upload API**: `app/api/uploads/route.ts`
- **Download API**: `app/api/presentations/download/route.ts`
- **Grading API**: `app/api/grading/route.ts`
- **Assistant API**: `app/api/assistant/route.ts`

### Test URLs

- Grading: `http://localhost:3000/dashboard/grading`
- Discussion: `http://localhost:3000/dashboard/discussion`
- Course Studio: `http://localhost:3000/dashboard/courses/[courseId]/studio`

---

## 🚀 Ready to Test

All grading, discussion, and file upload/download features are fully implemented and ready for comprehensive cross-platform testing. Follow the procedures above to ensure everything works smoothly for both Windows and Mac users.

**Test Report Template**: Document findings in `TEST_RESULTS_GRADING_DISCUSSION.md`
