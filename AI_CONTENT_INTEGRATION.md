# AI-Designed Content Integration with Course Sections

## Overview
This feature allows professors to seamlessly integrate AI-designed assignments, quizzes, and discussion topics from the Course Design Studio into flexible course sections. When sections are saved, the system automatically updates the course syllabus and resource listings.

## Key Features

### 1. Import AI-Designed Content
- **Source**: Content created using the "Design Assessments & Assignments" tool in Course Design Studio
- **Supported Types**:
  - Assignments (linked via `assignmentId`)
  - Quizzes
  - Discussion Topics
- **Import Dialog**: Visual selection interface showing all available content with metadata

### 2. Flexible Course Sections
- **Unlimited Sections**: No limit on number of course sections/modules
- **Variable Duration**: 8-16+ weeks course duration
- **7 Content Types**:
  1. FILE - Upload documents, PDFs, presentations
  2. ASSIGNMENT - Link to existing assignments or create inline
  3. LINK - External resources, videos, websites
  4. PAGE - Rich text course pages
  5. VIDEO - Embedded or linked video content
  6. QUIZ - Assessments and quizzes
  7. DISCUSSION - Discussion prompts and topics

### 3. Auto-Updating Syllabus
- **Automatic Generation**: Syllabus regenerates when sections are saved
- **Comprehensive Format**: Includes:
  - Course schedule with weekly breakdown
  - All assignments and due dates
  - Grading breakdown with point totals
  - Discussion topics list
  - Course resources categorized by type
  - Policies and grading scale
- **Markdown Format**: Easy to export and customize

## Technical Architecture

### Database Schema

#### ModuleContent Model
```prisma
model ModuleContent {
  id           String      @id @default(cuid())
  moduleId     String
  type         ContentType // FILE, ASSIGNMENT, LINK, PAGE, VIDEO, QUIZ, DISCUSSION
  title        String
  description  String?
  content      String?     // For pages/text content
  fileUrl      String?     // For file uploads
  linkUrl      String?     // For external links
  assignmentId String?     // Link to existing assignment
  orderIndex   Int         @default(0)
  isRequired   Boolean     @default(true)
  points       Int?        // For gradable content
  dueDate      DateTime?
  module       Module      @relation(fields: [moduleId], references: [id], onDelete: Cascade)
  assignment   Assignment? @relation(fields: [assignmentId], references: [id], onDelete: SetNull)
}
```

#### Assignment Relation
- **One-to-Many**: One Assignment can be linked to multiple ModuleContent items
- **Cascade Behavior**: When assignment deleted, `assignmentId` set to null (doesn't delete module content)
- **Metadata Preservation**: Assignment title, type, points, and due date automatically pulled when linked

### API Endpoints

#### POST /api/courses/[courseId]/sections
**Purpose**: Save course sections and trigger syllabus update

**Request Body**:
```json
{
  "sections": [
    {
      "id": "section-1",
      "title": "Introduction to Web Development",
      "description": "Learn HTML, CSS, and JavaScript basics",
      "sectionNo": 1,
      "weekNo": 1,
      "orderIndex": 0,
      "isPublished": true,
      "contents": [
        {
          "id": "content-1",
          "type": "ASSIGNMENT",
          "title": "HTML Basics Quiz",
          "assignmentId": "existing-assignment-id",
          "points": 100,
          "dueDate": "2026-02-01",
          "isRequired": true
        }
      ]
    }
  ],
  "durationWeeks": 16
}
```

**Response**:
```json
{
  "success": true,
  "message": "Course sections saved successfully. Syllabus updated.",
  "sectionsCreated": 8
}
```

**Process Flow**:
1. Validate user session and course ownership
2. Start database transaction
3. Update course duration
4. Delete existing modules (cascade deletes contents)
5. Create new modules with contents
6. Commit transaction
7. Trigger syllabus regeneration
8. Return success response

### Component Architecture

#### CourseSectionBuilder Component
**File**: `components/course-section-builder.tsx`

**Key Features**:
- Drag-and-drop section ordering
- Expandable/collapsible sections
- Content type buttons (7 types)
- Import dialog for AI-designed content
- Real-time validation
- Loading states during save

**Props**:
```typescript
interface CourseSectionBuilderProps {
    courseId: string
    initialWeeks?: number
    existingAssignments?: ExistingAssignment[]
    existingDiscussions?: ExistingDiscussion[]
    onSave?: (sections: Section[]) => void
}
```

**State Management**:
```typescript
const [sections, setSections] = useState<Section[]>([])
const [selectedWeeks, setSelectedWeeks] = useState(16)
const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
const [isSaving, setIsSaving] = useState(false)
const [showImportDialog, setShowImportDialog] = useState(false)
const [selectedSectionForImport, setSelectedSectionForImport] = useState<string | null>(null)
```

#### Import Functions

**Import Existing Assignment**:
```typescript
const importExistingAssignment = (sectionId: string, assignment: ExistingAssignment) => {
    const newContent: ModuleContent = {
        id: Date.now().toString(),
        type: "ASSIGNMENT",
        title: assignment.title,
        assignmentId: assignment.id, // Links to existing assignment
        points: assignment.points,
        dueDate: assignment.dueAt ? new Date(assignment.dueAt).toISOString().split('T')[0] : undefined,
        isRequired: true
    }
    // Add to section...
}
```

**Import Existing Discussion**:
```typescript
const importExistingDiscussion = (sectionId: string, discussion: ExistingDiscussion) => {
    const newContent: ModuleContent = {
        id: Date.now().toString(),
        type: "DISCUSSION",
        title: discussion.title,
        isRequired: true
    }
    // Add to section...
}
```

### Syllabus Generation Service

**File**: `lib/services/syllabus-updater.ts`

**Main Function**:
```typescript
export async function updateCourseSyllabus(courseId: string): Promise<string>
```

**Generates**:
1. **Course Information** - Code, instructor, duration
2. **Course Description** - Full description from course model
3. **Learning Objectives** - Standard objectives for all courses
4. **Course Schedule** - Weekly breakdown with:
   - Module title and description
   - Readings & materials (files, links, videos)
   - Assignments with points and due dates
   - Quizzes
   - Discussion topics
   - Course pages
5. **Grading & Assessment** - Table with all graded items and total points
6. **Grading Scale** - Standard A-F scale
7. **Course Policies** - Attendance, late work, academic integrity
8. **Course Resources** - Categorized list of all non-graded content

**Output Format**: Markdown with emoji icons for visual appeal

## User Workflow

### Step 1: Design Assessments
1. Navigate to **Course Design Studio**
2. Click **Design Assessments & Assignments**
3. Use AI to generate assignments, quizzes, or discussion topics
4. Review and save to course

### Step 2: Build Course Sections
1. Navigate to **Course Design Studio**
2. Click **Build Course Sections** (New badge)
3. Set course duration (8-16+ weeks)
4. Add sections (unlimited)
5. For each section:
   - Set section number and week number
   - Add title and description
   - Click content type buttons to add content
   - OR click **Import from Course** to add AI-designed content

### Step 3: Import AI Content
1. Click **Import from Course** button
2. View available assignments and discussions in dialog
3. Click any item to add it to the current section
4. Content is linked (not copied), preserving metadata

### Step 4: Save & Auto-Update
1. Click **Save Course Structure**
2. System saves all sections to database
3. Syllabus automatically regenerates with:
   - Updated course schedule
   - All assignments with points and due dates
   - Discussion topics
   - Resource listings
4. Success confirmation shown

## Benefits

### For Professors
- **Time Savings**: Reuse AI-designed content across sections
- **Consistency**: Linked content maintains metadata integrity
- **Flexibility**: Mix AI-designed and manual content
- **Automation**: Syllabus updates automatically, no manual editing

### For Students
- **Clear Structure**: Well-organized weekly breakdown
- **Complete Information**: All assignments, due dates, and resources in one place
- **Updated Syllabus**: Always reflects current course structure

### For Institutions
- **Quality Assurance**: Standardized syllabus format
- **AI Integration**: Leverages AI for content design while maintaining human oversight
- **Scalability**: Easy to create and manage multiple course sections

## Implementation Details

### Files Created/Modified

1. **Database Schema**: `prisma/schema.prisma`
   - Added `assignment` relation to `ModuleContent`
   - Added `moduleContents` reverse relation to `Assignment`

2. **API Route**: `app/api/courses/[courseId]/sections/route.ts`
   - POST endpoint for saving sections
   - Transaction-based updates
   - Syllabus auto-update trigger

3. **Component**: `components/course-section-builder.tsx`
   - Import functionality
   - Dialog UI for content selection
   - Save with loading states

4. **Page**: `app/dashboard/courses/[courseId]/build-sections/page.tsx`
   - Server component with auth
   - Fetches existing assignments and discussions
   - Renders builder with AI content

5. **Service**: `lib/services/syllabus-updater.ts`
   - Syllabus generation logic
   - Markdown formatting
   - Comprehensive course document

### Testing Checklist

- [ ] Create course in Course Design Studio
- [ ] Design 2-3 assignments using AI
- [ ] Design 1-2 discussion topics
- [ ] Navigate to Build Course Sections
- [ ] Verify AI content shows in availability card
- [ ] Create 3-4 sections spanning 8 weeks
- [ ] Import at least one assignment via dialog
- [ ] Import at least one discussion
- [ ] Add manual content (file, link, page)
- [ ] Save course structure
- [ ] Verify success message
- [ ] Check database for created modules and contents
- [ ] Verify `assignmentId` is set for imported assignments
- [ ] Generate syllabus report (future feature)
- [ ] Verify all imported content appears in syllabus

## Future Enhancements

1. **Syllabus Export**
   - PDF generation
   - Word document export
   - HTML preview

2. **Bulk Operations**
   - Import multiple items at once
   - Duplicate sections
   - Reorder via drag-and-drop

3. **Template Library**
   - Save section templates
   - Share templates across courses
   - Community template marketplace

4. **Analytics**
   - Track which AI-designed content performs best
   - Student engagement metrics per section
   - Completion rates by content type

5. **Integration**
   - LMS sync (Canvas, Blackboard, Moodle)
   - Calendar integration for due dates
   - Email notifications for syllabus updates

## Troubleshooting

### Import Dialog Empty
**Issue**: No assignments or discussions show in import dialog
**Solution**: 
- Verify content was created in Course Design Studio
- Check that content belongs to the same course
- Ensure database includes relationships

### Save Fails
**Issue**: Error when saving course sections
**Solution**:
- Check user has instructor role
- Verify course ownership
- Check browser console for detailed error
- Ensure all required fields are filled

### Syllabus Not Updating
**Issue**: Syllabus doesn't reflect new structure
**Solution**:
- Verify save operation completed successfully
- Check server logs for syllabus generation errors
- Ensure `updateCourseSyllabus` function is called after transaction

## Conclusion

This integration provides a powerful, flexible system for building course structures while leveraging AI-designed content. The automatic syllabus updates ensure consistency and save professors significant time, while students benefit from clear, comprehensive course information.

The system is built with scalability in mind, supporting unlimited sections and content items, with room for future enhancements like template libraries and LMS integration.
