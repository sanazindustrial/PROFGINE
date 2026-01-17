# Course Studio Design - Implementation Guide

## 🎯 Overview

The Course Studio Design feature is now implemented in the Professor GENIE application. This feature enables professors to generate professional PowerPoint presentations from textbooks, lecture notes, and other educational resources using AI.

## 📦 What Was Added

### 1. Database Schema (`prisma/schema.prisma`)

Three new models:

- **Presentation**: Stores presentation metadata
- **PresentationSlide**: Individual slides with content
- **PresentationSourceFile**: Source files used for generation

Two new enums:

- **PresentationSource**: TEXTBOOK, LECTURE_NOTES, RESEARCH_PAPER, WEB_CONTENT, MIXED
- **PresentationStatus**: DRAFT, PROCESSING, COMPLETED, FAILED, EXPORTED

### 2. API Routes

#### `/api/course-studio/generate` (POST)

Generates a new presentation from provided sources and settings.

**Request Body:**

```json
{
  "courseId": "course_id",
  "title": "Lecture Title",
  "sources": [
    {
      "fileName": "textbook_chapter.pdf",
      "fileType": "pdf",
      "fileUrl": "/uploads/...",
      "pages": "1-10"
    }
  ],
  "settings": {
    "description": "Optional description",
    "templateStyle": "modern-minimalist",
    "targetSlides": 25,
    "targetDuration": 50,
    "difficultyLevel": "intermediate",
    "includeQuizzes": true,
    "includeDiscussions": true
  }
}
```

**Response:**

```json
{
  "presentationId": "pres_123",
  "status": "completed",
  "slideCount": 24,
  "downloadUrl": "/downloads/presentation.pptx",
  "previewUrl": "/preview/presentation"
}
```

#### `/api/course-studio/presentations/[courseId]` (GET)

Lists all presentations for a specific course.

### 3. Service Layer (`lib/services/course-studio.ts`)

**CourseStudioService** handles:

- Content extraction from source files
- AI-powered outline generation using multiAI
- Slide content generation
- PowerPoint file creation with pptxgenjs
- Database persistence

### 4. UI Components

#### `components/course-studio-design.tsx`

Main UI component with:

- Title and description input
- Template selection (4 templates)
- Settings configuration (slides, duration, difficulty)
- Interactive elements toggles (quizzes, discussions)
- File upload area (prepared for implementation)
- Generation button with loading state
- Result display with download links

#### `app/dashboard/courses/[courseId]/studio/page.tsx`

Course Studio page with:

- Main studio panel
- Sidebar with recent presentations
- Tips and features information

### 5. Dependencies

Added `pptxgenjs@^3.12.0` for PowerPoint generation.

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Run Database Migration

```bash
# Local development
pnpm run migration:postgres:local

# Production
pnpm run migrate:deploy
```

### 3. Generate Prisma Client

```bash
pnpm run prisma:generate
```

### 4. Start Development Server

```bash
pnpm dev
```

## 📍 Access the Feature

Navigate to:

```
/dashboard/courses/[courseId]/studio
```

Or add a link in your course navigation to the studio page.

## 🔧 Configuration

### Template Styles

Currently supported:

- `modern-minimalist` - Clean, contemporary design (default)
- `academic-classic` - Traditional academic style
- `corporate-professional` - Business-appropriate
- `creative-dynamic` - Bold and engaging

### AI Provider

The service uses the multi-AI provider system (`@/adaptors/multi-ai.adaptor`), which automatically falls back through available providers:

1. OpenAI GPT-4
2. Anthropic Claude
3. Google Gemini
4. Groq
5. Free providers
6. Mock provider (development)

## 📝 Usage Example

```typescript
import { CourseStudioService } from "@/lib/services/course-studio"

const studioService = new CourseStudioService()

const result = await studioService.generatePresentation({
  presentationId: "pres_123",
  sources: [
    {
      fileName: "chapter5.pdf",
      fileType: "pdf",
      fileUrl: "/uploads/chapter5.pdf",
      content: "Chapter 5 content...",
    }
  ],
  settings: {
    title: "Introduction to Algorithms",
    templateStyle: "modern-minimalist",
    targetSlides: 25,
    targetDuration: 50,
    difficultyLevel: "intermediate",
    includeQuizzes: true,
    includeDiscussions: true,
  },
})

console.log(`Generated ${result.slideCount} slides`)
console.log(`Download: ${result.fileUrl}`)
```

## 🔜 Next Steps for Full Implementation

### File Upload Integration

Currently, the file upload is a placeholder. To implement:

1. **Add file upload handler** in `/api/course-studio/upload`
2. **Store files** in cloud storage (S3, Azure Blob, etc.)
3. **Parse file content** using:
   - PDF: `pdf-parse` or `pdfjs-dist`
   - Word: `mammoth` (already installed)
   - Text: direct reading

Example upload handler:

```typescript
// app/api/course-studio/upload/route.ts
import formidable from "formidable"
import { readFile } from "fs/promises"

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get("file") as File
  
  // Save to storage
  const fileUrl = await saveToStorage(file)
  
  // Extract content based on file type
  const content = await extractContent(file)
  
  return NextResponse.json({
    fileName: file.name,
    fileType: file.type,
    fileUrl,
    content,
  })
}
```

### PowerPoint Export

The `CourseStudioService.createPowerPoint()` method creates the PPTX structure but needs:

1. **File system or cloud storage** to save generated files
2. **Download endpoint** to serve files

Example:

```typescript
// Save to file system
await pptx.writeFile({ fileName: `./public/downloads/${fileName}` })

// Or save to S3
const buffer = await pptx.write({ outputType: "nodebuffer" })
await s3.upload({ Bucket: "...", Key: fileName, Body: buffer })
```

### Background Job Processing

For better UX, implement background processing:

```typescript
// Using a job queue (e.g., BullMQ, pg-boss)
import { Queue } from "bullmq"

const presentationQueue = new Queue("presentations")

// Add job
await presentationQueue.add("generate", {
  presentationId,
  sources,
  settings,
})

// Process job
presentationQueue.process("generate", async (job) => {
  const studioService = new CourseStudioService()
  return await studioService.generatePresentation(job.data)
})
```

### Content Parsing Enhancements

Implement robust content extraction:

```typescript
// For PDFs
import pdfParse from "pdf-parse"

async function extractPdfContent(buffer: Buffer) {
  const data = await pdfParse(buffer)
  return data.text
}

// For images in PDFs (OCR)
import Tesseract from "tesseract.js"

async function extractImageText(image: Buffer) {
  const { data: { text } } = await Tesseract.recognize(image, "eng")
  return text
}
```

## 🔒 Security Considerations

1. **Validate file types** before processing
2. **Limit file sizes** (e.g., max 50MB)
3. **Scan for malware** in uploaded files
4. **Rate limit** presentation generation
5. **Check user permissions** before allowing generation

## 📊 Database Indexes

Consider adding these indexes for performance:

```sql
CREATE INDEX idx_presentations_course ON "Presentation"("courseId");
CREATE INDEX idx_presentations_user ON "Presentation"("userId");
CREATE INDEX idx_presentations_status ON "Presentation"("status");
CREATE INDEX idx_slides_presentation ON "PresentationSlide"("presentationId");
```

## 🧪 Testing

Create tests for:

1. **API endpoints** - Request/response validation
2. **Service layer** - Content extraction and generation
3. **UI components** - User interactions
4. **Database operations** - CRUD operations

## 📈 Monitoring

Track these metrics:

- Presentation generation success rate
- Average generation time
- File upload success rate
- Template usage distribution
- AI provider performance

## 🆘 Troubleshooting

### Issue: AI generation fails

- Check AI provider API keys in environment
- Verify multiAI adaptor is configured
- Review error logs for specific provider errors

### Issue: PowerPoint export fails

- Ensure pptxgenjs is installed
- Check file system write permissions
- Verify storage configuration

### Issue: File upload fails

- Check file size limits
- Verify storage service is accessible
- Review formidable configuration

## 📚 Resources

- [pptxgenjs Documentation](https://gitbrent.github.io/PptxGenJS/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [COURSE_STUDIO_DESIGN.md](../COURSE_STUDIO_DESIGN.md) - Feature documentation

## 🤝 Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on extending this feature.

---

**Course Studio Design is ready to transform educational content creation!** 🎓✨
