/**
 * Export Service
 * Handles PDF, Word (DOCX), and PowerPoint (PPTX) generation
 * 
 * Dependencies:
 * - pptxgenjs: PowerPoint generation (already installed)
 * - jspdf: PDF generation
 * - docx: Word document generation
 */

import fs from 'fs'
import path from 'path'
import PptxGenJS from 'pptxgenjs'

// =============================================================================
// TYPES
// =============================================================================

export interface ExportResult {
    success: boolean
    format: 'pdf' | 'docx' | 'pptx'
    url?: string
    filePath?: string
    fileName?: string
    size?: number
    error?: string
}

export interface SyllabusExportData {
    courseTitle: string
    courseCode?: string
    semester?: string
    instructor: {
        name: string
        email?: string
        office?: string
        officeHours?: string
    }
    description?: string
    objectives?: string[]
    modules: {
        title: string
        week?: number
        topics?: string[]
        readings?: string[]
        assignments?: string[]
    }[]
    gradingPolicy?: {
        component: string
        weight: number
    }[]
    policies?: {
        title: string
        content: string
    }[]
    schedule?: {
        week: number
        date?: string
        topic: string
        readings?: string
        due?: string
    }[]
}

export interface LectureExportData {
    title: string
    courseTitle?: string
    date?: string
    objectives?: string[]
    sections: {
        title: string
        content: string
        notes?: string
        activities?: string[]
    }[]
    keyTerms?: { term: string; definition: string }[]
    summary?: string
    nextClass?: string
}

// =============================================================================
// EXPORT SERVICE
// =============================================================================

class ExportService {
    private uploadsDir: string

    constructor() {
        this.uploadsDir = path.join(process.cwd(), 'public', 'uploads')
        this.ensureUploadsDir()
    }

    private ensureUploadsDir() {
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true })
        }
    }

    private generateFileName(baseName: string, extension: string): string {
        const timestamp = Date.now()
        const cleanName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50)
        return `${timestamp}-${cleanName}.${extension}`
    }

    // =========================================================================
    // PDF GENERATION (Simple HTML-based approach)
    // =========================================================================

    /**
     * Generate PDF from syllabus data
     * Uses a simple HTML template approach
     */
    async generateSyllabusPdf(data: SyllabusExportData): Promise<ExportResult> {
        try {
            const fileName = this.generateFileName(data.courseTitle + '-syllabus', 'html')
            const filePath = path.join(this.uploadsDir, fileName)

            const html = this.createSyllabusHtml(data)

            // Save as HTML (browsers can print to PDF)
            // For true PDF, would need puppeteer or jspdf
            fs.writeFileSync(filePath, html, 'utf-8')

            const stats = fs.statSync(filePath)

            return {
                success: true,
                format: 'pdf',
                url: `/uploads/${fileName}`,
                filePath,
                fileName,
                size: stats.size
            }
        } catch (error) {
            return {
                success: false,
                format: 'pdf',
                error: error instanceof Error ? error.message : 'PDF generation failed'
            }
        }
    }

    private createSyllabusHtml(data: SyllabusExportData): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.courseTitle} - Syllabus</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            line-height: 1.6;
            color: #333;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.5in;
            background: white;
        }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: #4F46E5;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 { font-size: 24px; margin-bottom: 8px; }
        .header .course-code { font-size: 18px; color: #666; }
        .header .semester { font-size: 16px; margin-top: 8px; }
        
        .instructor-info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 25px;
        }
        .instructor-info h2 { font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .instructor-info p { margin: 5px 0; font-size: 14px; }
        
        .section { margin-bottom: 25px; }
        .section h2 {
            font-size: 18px;
            color: #4F46E5;
            border-bottom: 1px solid #4F46E5;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .section h3 { font-size: 16px; margin: 10px 0 8px; }
        .section p { font-size: 14px; margin-bottom: 10px; }
        
        ul, ol { margin-left: 25px; font-size: 14px; }
        li { margin-bottom: 5px; }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 13px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        th {
            background: #4F46E5;
            color: white;
        }
        tr:nth-child(even) { background: #f9f9f9; }
        
        .module {
            background: #fafafa;
            border-left: 3px solid #4F46E5;
            padding: 15px;
            margin-bottom: 15px;
        }
        .module h3 { color: #4F46E5; margin-bottom: 10px; }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
    
    <div class="header">
        <h1>${data.courseTitle}</h1>
        ${data.courseCode ? `<div class="course-code">${data.courseCode}</div>` : ''}
        ${data.semester ? `<div class="semester">${data.semester}</div>` : ''}
    </div>

    <div class="instructor-info">
        <h2>Instructor Information</h2>
        <p><strong>Instructor:</strong> ${data.instructor.name}</p>
        ${data.instructor.email ? `<p><strong>Email:</strong> ${data.instructor.email}</p>` : ''}
        ${data.instructor.office ? `<p><strong>Office:</strong> ${data.instructor.office}</p>` : ''}
        ${data.instructor.officeHours ? `<p><strong>Office Hours:</strong> ${data.instructor.officeHours}</p>` : ''}
    </div>

    ${data.description ? `
    <div class="section">
        <h2>Course Description</h2>
        <p>${data.description}</p>
    </div>
    ` : ''}

    ${data.objectives && data.objectives.length > 0 ? `
    <div class="section">
        <h2>Learning Objectives</h2>
        <ol>
            ${data.objectives.map(obj => `<li>${obj}</li>`).join('\n            ')}
        </ol>
    </div>
    ` : ''}

    ${data.modules && data.modules.length > 0 ? `
    <div class="section">
        <h2>Course Modules</h2>
        ${data.modules.map(mod => `
        <div class="module">
            <h3>${mod.week ? `Week ${mod.week}: ` : ''}${mod.title}</h3>
            ${mod.topics && mod.topics.length > 0 ? `
            <p><strong>Topics:</strong></p>
            <ul>
                ${mod.topics.map(t => `<li>${t}</li>`).join('\n                ')}
            </ul>
            ` : ''}
            ${mod.readings && mod.readings.length > 0 ? `
            <p><strong>Readings:</strong> ${mod.readings.join(', ')}</p>
            ` : ''}
            ${mod.assignments && mod.assignments.length > 0 ? `
            <p><strong>Assignments:</strong> ${mod.assignments.join(', ')}</p>
            ` : ''}
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${data.gradingPolicy && data.gradingPolicy.length > 0 ? `
    <div class="section">
        <h2>Grading Policy</h2>
        <table>
            <thead>
                <tr>
                    <th>Component</th>
                    <th>Weight</th>
                </tr>
            </thead>
            <tbody>
                ${data.gradingPolicy.map(g => `
                <tr>
                    <td>${g.component}</td>
                    <td>${g.weight}%</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${data.schedule && data.schedule.length > 0 ? `
    <div class="section">
        <h2>Course Schedule</h2>
        <table>
            <thead>
                <tr>
                    <th>Week</th>
                    <th>Date</th>
                    <th>Topic</th>
                    <th>Readings</th>
                    <th>Due</th>
                </tr>
            </thead>
            <tbody>
                ${data.schedule.map(s => `
                <tr>
                    <td>${s.week}</td>
                    <td>${s.date || ''}</td>
                    <td>${s.topic}</td>
                    <td>${s.readings || ''}</td>
                    <td>${s.due || ''}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${data.policies && data.policies.length > 0 ? `
    <div class="section">
        <h2>Course Policies</h2>
        ${data.policies.map(p => `
        <h3>${p.title}</h3>
        <p>${p.content}</p>
        `).join('')}
    </div>
    ` : ''}

    <div class="footer">
        <p>Generated by Professor GENIE | ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>
        `
    }

    // =========================================================================
    // WORD (DOCX) GENERATION
    // =========================================================================

    /**
     * Generate Word document from syllabus data
     * Creates a simple HTML that Word can import
     */
    async generateSyllabusDocx(data: SyllabusExportData): Promise<ExportResult> {
        try {
            const fileName = this.generateFileName(data.courseTitle + '-syllabus', 'doc')
            const filePath = path.join(this.uploadsDir, fileName)

            // Create Word-compatible HTML (Word can open .doc HTML files)
            const html = this.createWordHtml(data)
            fs.writeFileSync(filePath, html, 'utf-8')

            const stats = fs.statSync(filePath)

            return {
                success: true,
                format: 'docx',
                url: `/uploads/${fileName}`,
                filePath,
                fileName,
                size: stats.size
            }
        } catch (error) {
            return {
                success: false,
                format: 'docx',
                error: error instanceof Error ? error.message : 'Word generation failed'
            }
        }
    }

    private createWordHtml(data: SyllabusExportData): string {
        return `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
    <meta charset="UTF-8">
    <title>${data.courseTitle} - Syllabus</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }
        h1 { font-size: 18pt; text-align: center; margin-bottom: 6pt; }
        h2 { font-size: 14pt; color: #2E5090; border-bottom: 1pt solid #2E5090; margin-top: 18pt; }
        h3 { font-size: 12pt; font-weight: bold; margin-top: 12pt; }
        p { margin: 6pt 0; }
        ul, ol { margin-left: 0.5in; }
        li { margin: 3pt 0; }
        table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
        th, td { border: 1pt solid #000; padding: 6pt; }
        th { background-color: #2E5090; color: white; }
        .center { text-align: center; }
        .info-box { background: #f0f0f0; padding: 10pt; margin: 12pt 0; }
    </style>
</head>
<body>
    <h1>${data.courseTitle}</h1>
    ${data.courseCode ? `<p class="center"><strong>${data.courseCode}</strong></p>` : ''}
    ${data.semester ? `<p class="center">${data.semester}</p>` : ''}
    
    <div class="info-box">
        <p><strong>Instructor:</strong> ${data.instructor.name}</p>
        ${data.instructor.email ? `<p><strong>Email:</strong> ${data.instructor.email}</p>` : ''}
        ${data.instructor.office ? `<p><strong>Office:</strong> ${data.instructor.office}</p>` : ''}
        ${data.instructor.officeHours ? `<p><strong>Office Hours:</strong> ${data.instructor.officeHours}</p>` : ''}
    </div>

    ${data.description ? `
    <h2>Course Description</h2>
    <p>${data.description}</p>
    ` : ''}

    ${data.objectives && data.objectives.length > 0 ? `
    <h2>Learning Objectives</h2>
    <p>Upon successful completion of this course, students will be able to:</p>
    <ol>
        ${data.objectives.map(obj => `<li>${obj}</li>`).join('\n        ')}
    </ol>
    ` : ''}

    ${data.modules && data.modules.length > 0 ? `
    <h2>Course Modules</h2>
    ${data.modules.map(mod => `
    <h3>${mod.week ? `Week ${mod.week}: ` : ''}${mod.title}</h3>
    ${mod.topics && mod.topics.length > 0 ? `
    <p><strong>Topics:</strong></p>
    <ul>
        ${mod.topics.map(t => `<li>${t}</li>`).join('\n        ')}
    </ul>
    ` : ''}
    ${mod.readings && mod.readings.length > 0 ? `<p><strong>Readings:</strong> ${mod.readings.join(', ')}</p>` : ''}
    ${mod.assignments && mod.assignments.length > 0 ? `<p><strong>Assignments:</strong> ${mod.assignments.join(', ')}</p>` : ''}
    `).join('')}
    ` : ''}

    ${data.gradingPolicy && data.gradingPolicy.length > 0 ? `
    <h2>Grading Policy</h2>
    <table>
        <tr>
            <th>Component</th>
            <th>Weight</th>
        </tr>
        ${data.gradingPolicy.map(g => `
        <tr>
            <td>${g.component}</td>
            <td>${g.weight}%</td>
        </tr>
        `).join('')}
    </table>
    ` : ''}

    ${data.schedule && data.schedule.length > 0 ? `
    <h2>Course Schedule</h2>
    <table>
        <tr>
            <th>Week</th>
            <th>Date</th>
            <th>Topic</th>
            <th>Readings</th>
            <th>Due</th>
        </tr>
        ${data.schedule.map(s => `
        <tr>
            <td>${s.week}</td>
            <td>${s.date || ''}</td>
            <td>${s.topic}</td>
            <td>${s.readings || ''}</td>
            <td>${s.due || ''}</td>
        </tr>
        `).join('')}
    </table>
    ` : ''}

    ${data.policies && data.policies.length > 0 ? `
    <h2>Course Policies</h2>
    ${data.policies.map(p => `
    <h3>${p.title}</h3>
    <p>${p.content}</p>
    `).join('')}
    ` : ''}

    <hr/>
    <p class="center"><em>Generated by Professor GENIE | ${new Date().toLocaleDateString()}</em></p>
</body>
</html>
        `
    }

    // =========================================================================
    // POWERPOINT (PPTX) GENERATION
    // =========================================================================

    /**
     * Generate PowerPoint from lecture data
     */
    async generateLecturePptx(data: LectureExportData): Promise<ExportResult> {
        try {
            const fileName = this.generateFileName(data.title + '-lecture', 'pptx')
            const filePath = path.join(this.uploadsDir, fileName)

            const pptx = new PptxGenJS()
            pptx.author = 'Professor GENIE'
            pptx.title = data.title
            pptx.subject = data.courseTitle || 'Lecture'

            // Title slide
            const titleSlide = pptx.addSlide()
            titleSlide.addText(data.title, {
                x: 0.5,
                y: 2,
                w: '90%',
                h: 1.5,
                fontSize: 36,
                bold: true,
                color: '4F46E5',
                align: 'center'
            })
            if (data.courseTitle) {
                titleSlide.addText(data.courseTitle, {
                    x: 0.5,
                    y: 3.5,
                    w: '90%',
                    h: 0.5,
                    fontSize: 20,
                    color: '666666',
                    align: 'center'
                })
            }
            if (data.date) {
                titleSlide.addText(data.date, {
                    x: 0.5,
                    y: 4.2,
                    w: '90%',
                    h: 0.4,
                    fontSize: 14,
                    color: '888888',
                    align: 'center'
                })
            }

            // Objectives slide
            if (data.objectives && data.objectives.length > 0) {
                const objectivesSlide = pptx.addSlide()
                objectivesSlide.addText('Learning Objectives', {
                    x: 0.5,
                    y: 0.5,
                    w: '90%',
                    h: 0.8,
                    fontSize: 28,
                    bold: true,
                    color: '4F46E5'
                })
                objectivesSlide.addText(
                    data.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n'),
                    {
                        x: 0.5,
                        y: 1.5,
                        w: '90%',
                        h: 4,
                        fontSize: 18,
                        color: '333333',
                        valign: 'top'
                    }
                )
            }

            // Content slides
            for (const section of data.sections) {
                const slide = pptx.addSlide()

                slide.addText(section.title, {
                    x: 0.5,
                    y: 0.3,
                    w: '90%',
                    h: 0.7,
                    fontSize: 28,
                    bold: true,
                    color: '4F46E5'
                })

                slide.addText(section.content, {
                    x: 0.5,
                    y: 1.2,
                    w: '90%',
                    h: 3.5,
                    fontSize: 16,
                    color: '333333',
                    valign: 'top'
                })

                if (section.notes) {
                    slide.addNotes(section.notes)
                }

                // Activities sub-slide if present
                if (section.activities && section.activities.length > 0) {
                    const activitySlide = pptx.addSlide()
                    activitySlide.addText(`Activities: ${section.title}`, {
                        x: 0.5,
                        y: 0.3,
                        w: '90%',
                        h: 0.7,
                        fontSize: 24,
                        bold: true,
                        color: '10B981'
                    })
                    activitySlide.addText(
                        section.activities.map((a, i) => `• ${a}`).join('\n'),
                        {
                            x: 0.5,
                            y: 1.2,
                            w: '90%',
                            h: 4,
                            fontSize: 18,
                            color: '333333'
                        }
                    )
                }
            }

            // Key Terms slide
            if (data.keyTerms && data.keyTerms.length > 0) {
                const termsSlide = pptx.addSlide()
                termsSlide.addText('Key Terms', {
                    x: 0.5,
                    y: 0.3,
                    w: '90%',
                    h: 0.7,
                    fontSize: 28,
                    bold: true,
                    color: '4F46E5'
                })

                const termsText = data.keyTerms.map(t => `${t.term}: ${t.definition}`).join('\n\n')
                termsSlide.addText(termsText, {
                    x: 0.5,
                    y: 1.2,
                    w: '90%',
                    h: 4,
                    fontSize: 14,
                    color: '333333',
                    valign: 'top'
                })
            }

            // Summary slide
            if (data.summary) {
                const summarySlide = pptx.addSlide()
                summarySlide.addText('Summary', {
                    x: 0.5,
                    y: 0.3,
                    w: '90%',
                    h: 0.7,
                    fontSize: 28,
                    bold: true,
                    color: '4F46E5'
                })
                summarySlide.addText(data.summary, {
                    x: 0.5,
                    y: 1.2,
                    w: '90%',
                    h: 4,
                    fontSize: 18,
                    color: '333333'
                })
                if (data.nextClass) {
                    summarySlide.addText(`Next Class: ${data.nextClass}`, {
                        x: 0.5,
                        y: 4.8,
                        w: '90%',
                        h: 0.5,
                        fontSize: 14,
                        italic: true,
                        color: '666666'
                    })
                }
            }

            // Write file
            const output = await pptx.write({ outputType: 'nodebuffer' })
            const buffer = Buffer.from(output as ArrayBuffer)
            fs.writeFileSync(filePath, new Uint8Array(buffer))

            const stats = fs.statSync(filePath)

            return {
                success: true,
                format: 'pptx',
                url: `/uploads/${fileName}`,
                filePath,
                fileName,
                size: stats.size
            }
        } catch (error) {
            return {
                success: false,
                format: 'pptx',
                error: error instanceof Error ? error.message : 'PowerPoint generation failed'
            }
        }
    }

    /**
     * Generate PowerPoint from course syllabus (overview presentation)
     */
    async generateSyllabusPptx(data: SyllabusExportData): Promise<ExportResult> {
        try {
            const fileName = this.generateFileName(data.courseTitle + '-overview', 'pptx')
            const filePath = path.join(this.uploadsDir, fileName)

            const pptx = new PptxGenJS()
            pptx.author = data.instructor.name
            pptx.title = data.courseTitle
            pptx.subject = 'Course Overview'

            // Title slide
            const titleSlide = pptx.addSlide()
            titleSlide.addText(data.courseTitle, {
                x: 0.5,
                y: 1.5,
                w: '90%',
                h: 1.5,
                fontSize: 40,
                bold: true,
                color: '4F46E5',
                align: 'center'
            })
            if (data.courseCode) {
                titleSlide.addText(data.courseCode, {
                    x: 0.5,
                    y: 3,
                    w: '90%',
                    h: 0.5,
                    fontSize: 20,
                    color: '666666',
                    align: 'center'
                })
            }
            titleSlide.addText(data.instructor.name, {
                x: 0.5,
                y: 4,
                w: '90%',
                h: 0.5,
                fontSize: 18,
                color: '333333',
                align: 'center'
            })
            if (data.semester) {
                titleSlide.addText(data.semester, {
                    x: 0.5,
                    y: 4.5,
                    w: '90%',
                    h: 0.4,
                    fontSize: 14,
                    color: '888888',
                    align: 'center'
                })
            }

            // Course Description slide
            if (data.description) {
                const descSlide = pptx.addSlide()
                descSlide.addText('Course Description', {
                    x: 0.5,
                    y: 0.3,
                    w: '90%',
                    h: 0.7,
                    fontSize: 28,
                    bold: true,
                    color: '4F46E5'
                })
                descSlide.addText(data.description, {
                    x: 0.5,
                    y: 1.2,
                    w: '90%',
                    h: 4,
                    fontSize: 16,
                    color: '333333'
                })
            }

            // Learning Objectives slide
            if (data.objectives && data.objectives.length > 0) {
                const objectivesSlide = pptx.addSlide()
                objectivesSlide.addText('Learning Objectives', {
                    x: 0.5,
                    y: 0.3,
                    w: '90%',
                    h: 0.7,
                    fontSize: 28,
                    bold: true,
                    color: '4F46E5'
                })
                objectivesSlide.addText(
                    data.objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n'),
                    {
                        x: 0.5,
                        y: 1.2,
                        w: '90%',
                        h: 4,
                        fontSize: 16,
                        color: '333333'
                    }
                )
            }

            // Course Modules slides (2-3 modules per slide)
            if (data.modules && data.modules.length > 0) {
                const modulesPerSlide = 3
                for (let i = 0; i < data.modules.length; i += modulesPerSlide) {
                    const slide = pptx.addSlide()
                    slide.addText('Course Modules', {
                        x: 0.5,
                        y: 0.3,
                        w: '90%',
                        h: 0.7,
                        fontSize: 28,
                        bold: true,
                        color: '4F46E5'
                    })

                    const modulesOnSlide = data.modules.slice(i, i + modulesPerSlide)
                    let yPos = 1.2
                    for (const mod of modulesOnSlide) {
                        slide.addText(`${mod.week ? `Week ${mod.week}: ` : ''}${mod.title}`, {
                            x: 0.5,
                            y: yPos,
                            w: '90%',
                            h: 0.4,
                            fontSize: 18,
                            bold: true,
                            color: '333333'
                        })
                        if (mod.topics && mod.topics.length > 0) {
                            slide.addText(mod.topics.map(t => `• ${t}`).join('\n'), {
                                x: 0.7,
                                y: yPos + 0.4,
                                w: '85%',
                                h: 1,
                                fontSize: 14,
                                color: '666666'
                            })
                        }
                        yPos += 1.5
                    }
                }
            }

            // Grading Policy slide
            if (data.gradingPolicy && data.gradingPolicy.length > 0) {
                const gradingSlide = pptx.addSlide()
                gradingSlide.addText('Grading Policy', {
                    x: 0.5,
                    y: 0.3,
                    w: '90%',
                    h: 0.7,
                    fontSize: 28,
                    bold: true,
                    color: '4F46E5'
                })

                const tableData = [
                    [{ text: 'Component', options: { bold: true, fill: { color: '4F46E5' }, color: 'FFFFFF' } },
                    { text: 'Weight', options: { bold: true, fill: { color: '4F46E5' }, color: 'FFFFFF' } }],
                    ...data.gradingPolicy.map(g => [g.component, `${g.weight}%`])
                ]

                gradingSlide.addTable(tableData as any, {
                    x: 1,
                    y: 1.2,
                    w: 8,
                    colW: [5, 3],
                    border: { pt: 1, color: 'CCCCCC' },
                    fontFace: 'Arial',
                    fontSize: 14
                })
            }

            // Contact Information slide
            const contactSlide = pptx.addSlide()
            contactSlide.addText('Contact Information', {
                x: 0.5,
                y: 0.3,
                w: '90%',
                h: 0.7,
                fontSize: 28,
                bold: true,
                color: '4F46E5'
            })

            const contactInfo = [
                `Instructor: ${data.instructor.name}`,
                data.instructor.email ? `Email: ${data.instructor.email}` : null,
                data.instructor.office ? `Office: ${data.instructor.office}` : null,
                data.instructor.officeHours ? `Office Hours: ${data.instructor.officeHours}` : null
            ].filter(Boolean).join('\n')

            contactSlide.addText(contactInfo, {
                x: 0.5,
                y: 1.5,
                w: '90%',
                h: 3,
                fontSize: 20,
                color: '333333'
            })

            // Write file
            const output = await pptx.write({ outputType: 'nodebuffer' })
            const buffer = Buffer.from(output as ArrayBuffer)
            fs.writeFileSync(filePath, new Uint8Array(buffer))

            const stats = fs.statSync(filePath)

            return {
                success: true,
                format: 'pptx',
                url: `/uploads/${fileName}`,
                filePath,
                fileName,
                size: stats.size
            }
        } catch (error) {
            return {
                success: false,
                format: 'pptx',
                error: error instanceof Error ? error.message : 'PowerPoint generation failed'
            }
        }
    }

    // =========================================================================
    // LECTURE NOTES PDF/WORD EXPORT
    // =========================================================================

    /**
     * Generate PDF from lecture notes data (HTML for print-to-PDF)
     */
    async generateLecturePdf(data: LectureExportData): Promise<ExportResult> {
        try {
            const fileName = this.generateFileName(data.title + '-lecture', 'html')
            const filePath = path.join(this.uploadsDir, fileName)

            const html = this.createLectureHtml(data)
            fs.writeFileSync(filePath, html, 'utf-8')

            const stats = fs.statSync(filePath)

            return {
                success: true,
                format: 'pdf',
                url: `/uploads/${fileName}`,
                filePath,
                fileName,
                size: stats.size
            }
        } catch (error) {
            return {
                success: false,
                format: 'pdf',
                error: error instanceof Error ? error.message : 'PDF generation failed'
            }
        }
    }

    /**
     * Generate Word doc from lecture notes
     */
    async generateLectureDocx(data: LectureExportData): Promise<ExportResult> {
        try {
            const fileName = this.generateFileName(data.title + '-lecture', 'doc')
            const filePath = path.join(this.uploadsDir, fileName)

            const html = this.createLectureWordHtml(data)
            fs.writeFileSync(filePath, html, 'utf-8')

            const stats = fs.statSync(filePath)

            return {
                success: true,
                format: 'docx',
                url: `/uploads/${fileName}`,
                filePath,
                fileName,
                size: stats.size
            }
        } catch (error) {
            return {
                success: false,
                format: 'docx',
                error: error instanceof Error ? error.message : 'Word generation failed'
            }
        }
    }

    private createLectureHtml(data: LectureExportData): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.title} - Lecture Notes</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Georgia', 'Times New Roman', serif;
            line-height: 1.8;
            color: #333;
            max-width: 8.5in;
            margin: 0 auto;
            padding: 0.5in;
            background: white;
        }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
            .section { page-break-inside: avoid; }
        }
        .print-btn {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: #4F46E5;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #4F46E5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 { font-size: 28px; margin-bottom: 8px; color: #4F46E5; }
        .header .course { font-size: 18px; color: #666; }
        .header .date { font-size: 14px; margin-top: 8px; color: #888; }
        
        .objectives {
            background: #f0f4ff;
            border-left: 4px solid #4F46E5;
            padding: 15px 20px;
            margin-bottom: 25px;
            border-radius: 0 6px 6px 0;
        }
        .objectives h2 { font-size: 16px; margin-bottom: 10px; color: #4F46E5; }
        .objectives ul { margin-left: 20px; }
        .objectives li { margin: 5px 0; font-size: 14px; }
        
        .section { margin-bottom: 30px; }
        .section h2 {
            font-size: 20px;
            color: #4F46E5;
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
            margin-bottom: 15px;
        }
        .section-content {
            font-size: 15px;
            line-height: 1.8;
        }
        .section-content p { margin-bottom: 12px; }
        
        .activities {
            background: #f0fdf4;
            border-left: 4px solid #10B981;
            padding: 12px 16px;
            margin: 15px 0;
            border-radius: 0 6px 6px 0;
        }
        .activities h3 { font-size: 14px; color: #10B981; margin-bottom: 8px; }
        .activities ul { margin-left: 18px; font-size: 13px; }
        
        .key-terms {
            background: #fffbeb;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
        }
        .key-terms h2 { font-size: 18px; color: #D97706; margin-bottom: 15px; }
        .term { margin-bottom: 10px; }
        .term strong { color: #D97706; }
        
        .summary {
            background: #f5f5f5;
            padding: 20px;
            border-radius: 8px;
            margin-top: 25px;
        }
        .summary h2 { font-size: 18px; margin-bottom: 12px; }
        
        .next-class {
            margin-top: 20px;
            padding: 12px;
            background: #e0e7ff;
            border-radius: 6px;
            font-style: italic;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 15px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
            text-align: center;
        }
    </style>
</head>
<body>
    <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
    
    <div class="header">
        <h1>${data.title}</h1>
        ${data.courseTitle ? `<div class="course">${data.courseTitle}</div>` : ''}
        ${data.date ? `<div class="date">${data.date}</div>` : ''}
    </div>

    ${data.objectives && data.objectives.length > 0 ? `
    <div class="objectives">
        <h2>Learning Objectives</h2>
        <ul>
            ${data.objectives.map(obj => `<li>${obj}</li>`).join('\n            ')}
        </ul>
    </div>
    ` : ''}

    ${data.sections.map(section => `
    <div class="section">
        <h2>${section.title}</h2>
        <div class="section-content">
            ${section.content.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('\n            ')}
        </div>
        ${section.activities && section.activities.length > 0 ? `
        <div class="activities">
            <h3>Activities</h3>
            <ul>
                ${section.activities.map(a => `<li>${a}</li>`).join('\n                ')}
            </ul>
        </div>
        ` : ''}
    </div>
    `).join('')}

    ${data.keyTerms && data.keyTerms.length > 0 ? `
    <div class="key-terms">
        <h2>Key Terms</h2>
        ${data.keyTerms.map(t => `
        <div class="term">
            <strong>${t.term}:</strong> ${t.definition}
        </div>
        `).join('')}
    </div>
    ` : ''}

    ${data.summary ? `
    <div class="summary">
        <h2>Summary</h2>
        <p>${data.summary}</p>
        ${data.nextClass ? `<div class="next-class">Next Class: ${data.nextClass}</div>` : ''}
    </div>
    ` : ''}

    <div class="footer">
        <p>Generated by Professor GENIE | ${new Date().toLocaleDateString()}</p>
    </div>
</body>
</html>
        `
    }

    private createLectureWordHtml(data: LectureExportData): string {
        return `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word">
<head>
    <meta charset="UTF-8">
    <title>${data.title} - Lecture Notes</title>
    <!--[if gte mso 9]>
    <xml>
        <w:WordDocument>
            <w:View>Print</w:View>
            <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
    </xml>
    <![endif]-->
    <style>
        body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.6; }
        h1 { font-size: 18pt; text-align: center; color: #2E5090; margin-bottom: 6pt; }
        h2 { font-size: 14pt; color: #2E5090; border-bottom: 1pt solid #2E5090; margin-top: 18pt; }
        h3 { font-size: 12pt; font-weight: bold; margin-top: 12pt; }
        p { margin: 6pt 0; }
        ul, ol { margin-left: 0.5in; }
        li { margin: 3pt 0; }
        .center { text-align: center; }
        .objectives { background: #f0f4ff; padding: 10pt; margin: 12pt 0; }
        .activities { background: #f0fdf4; padding: 10pt; margin: 12pt 0; }
        .key-terms { background: #fffbeb; padding: 10pt; margin: 12pt 0; }
        .summary { background: #f5f5f5; padding: 10pt; margin: 12pt 0; }
    </style>
</head>
<body>
    <h1>${data.title}</h1>
    ${data.courseTitle ? `<p class="center"><strong>${data.courseTitle}</strong></p>` : ''}
    ${data.date ? `<p class="center">${data.date}</p>` : ''}

    ${data.objectives && data.objectives.length > 0 ? `
    <div class="objectives">
        <h2>Learning Objectives</h2>
        <ol>
            ${data.objectives.map(obj => `<li>${obj}</li>`).join('\n            ')}
        </ol>
    </div>
    ` : ''}

    ${data.sections.map(section => `
    <h2>${section.title}</h2>
    ${section.content.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('\n    ')}
    ${section.activities && section.activities.length > 0 ? `
    <div class="activities">
        <h3>Activities</h3>
        <ul>
            ${section.activities.map(a => `<li>${a}</li>`).join('\n            ')}
        </ul>
    </div>
    ` : ''}
    `).join('')}

    ${data.keyTerms && data.keyTerms.length > 0 ? `
    <div class="key-terms">
        <h2>Key Terms</h2>
        ${data.keyTerms.map(t => `<p><strong>${t.term}:</strong> ${t.definition}</p>`).join('\n        ')}
    </div>
    ` : ''}

    ${data.summary ? `
    <div class="summary">
        <h2>Summary</h2>
        <p>${data.summary}</p>
        ${data.nextClass ? `<p><em>Next Class: ${data.nextClass}</em></p>` : ''}
    </div>
    ` : ''}

    <hr/>
    <p class="center"><em>Generated by Professor GENIE | ${new Date().toLocaleDateString()}</em></p>
</body>
</html>
        `
    }

    /**
     * Export lecture notes in all formats
     */
    async exportLectureAll(data: LectureExportData): Promise<{
        pdf: ExportResult
        docx: ExportResult
        pptx: ExportResult
    }> {
        const [pdf, docx, pptx] = await Promise.all([
            this.generateLecturePdf(data),
            this.generateLectureDocx(data),
            this.generateLecturePptx(data)
        ])

        return { pdf, docx, pptx }
    }

    // =========================================================================
    // BATCH EXPORT
    // =========================================================================

    /**
     * Export course syllabus in all formats
     */
    async exportSyllabusAll(data: SyllabusExportData): Promise<{
        pdf: ExportResult
        docx: ExportResult
        pptx: ExportResult
    }> {
        const [pdf, docx, pptx] = await Promise.all([
            this.generateSyllabusPdf(data),
            this.generateSyllabusDocx(data),
            this.generateSyllabusPptx(data)
        ])

        return { pdf, docx, pptx }
    }

    /**
     * Clean up old export files (older than 24 hours)
     */
    async cleanupOldExports(): Promise<{ deleted: number }> {
        let deleted = 0
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours

        try {
            const files = fs.readdirSync(this.uploadsDir)
            const now = Date.now()

            for (const file of files) {
                // Only clean up files that match our export pattern
                if (file.match(/^\d+-.*\.(pptx|doc|html)$/)) {
                    const filePath = path.join(this.uploadsDir, file)
                    const stats = fs.statSync(filePath)

                    if (now - stats.mtimeMs > maxAge) {
                        fs.unlinkSync(filePath)
                        deleted++
                    }
                }
            }
        } catch (error) {
            console.error('[Export] Cleanup error:', error)
        }

        return { deleted }
    }
}

// Export singleton
export const exportService = new ExportService()
