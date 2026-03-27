/**
 * File Extraction Service
 * Extracts structured content from uploaded files (PDF, DOCX, PPTX, XLSX, CSV, TXT, MD)
 * Enables content extraction from uploads for AI processing and database storage
 */

import fs from 'fs'
import path from 'path'
import mammoth from 'mammoth'
import { parse as csvParse } from 'csv-parse/sync'
import ExcelJS from 'exceljs'

export interface ExtractedContent {
    text: string
    title: string
    sections: Array<{ title: string; content: string }>
    metadata: {
        fileName: string
        fileType: string
        size: number
        pages?: number
        sheets?: string[]
        extractedAt: string
    }
}

class FileExtractionService {
    /**
     * Extract content from any supported file
     */
    async extractFromFile(filePath: string, fileName: string): Promise<ExtractedContent> {
        const ext = path.extname(fileName).toLowerCase()
        const stats = fs.statSync(filePath)

        switch (ext) {
            case '.txt':
            case '.md':
            case '.markdown':
                return this.extractText(filePath, fileName, stats.size)
            case '.csv':
            case '.tsv':
                return this.extractCsv(filePath, fileName, stats.size, ext === '.tsv' ? '\t' : ',')
            case '.doc':
            case '.docx':
                return this.extractDocx(filePath, fileName, stats.size)
            case '.xlsx':
            case '.xls':
                return this.extractXlsx(filePath, fileName, stats.size)
            case '.html':
            case '.htm':
                return this.extractHtml(filePath, fileName, stats.size)
            case '.json':
                return this.extractJson(filePath, fileName, stats.size)
            case '.pptx':
            case '.ppt':
                return this.extractPptx(filePath, fileName, stats.size)
            default:
                // Try as plain text
                return this.extractText(filePath, fileName, stats.size)
        }
    }

    /**
     * Extract content from a buffer with known type
     */
    async extractFromBuffer(buffer: Buffer, fileName: string, mimeType: string): Promise<ExtractedContent> {
        const tempDir = path.join(process.cwd(), 'public', 'uploads', 'temp')
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true })
        }

        const tempPath = path.join(tempDir, `extract-${Date.now()}-${fileName}`)
        fs.writeFileSync(tempPath, new Uint8Array(buffer))

        try {
            const result = await this.extractFromFile(tempPath, fileName)
            return result
        } finally {
            // Clean up temp file
            try { fs.unlinkSync(tempPath) } catch { /* ignore */ }
        }
    }

    private async extractText(filePath: string, fileName: string, size: number): Promise<ExtractedContent> {
        const text = fs.readFileSync(filePath, 'utf-8')
        const sections = this.parseMarkdownSections(text)
        const title = this.extractTitle(text, fileName)

        return {
            text,
            title,
            sections,
            metadata: {
                fileName,
                fileType: path.extname(fileName).slice(1),
                size,
                extractedAt: new Date().toISOString(),
            }
        }
    }

    private async extractCsv(filePath: string, fileName: string, size: number, delimiter: string): Promise<ExtractedContent> {
        const raw = fs.readFileSync(filePath, 'utf-8')

        try {
            const records = csvParse(raw, {
                delimiter,
                columns: true,
                skip_empty_lines: true,
                relax_column_count: true,
            })

            const headers = records.length > 0 ? Object.keys(records[0] as Record<string, unknown>) : []
            let text = `Table: ${fileName}\n\nColumns: ${headers.join(', ')}\n\nRows: ${records.length}\n\n`

            // Convert to readable text (first 100 rows for AI context)
            const sampleRecords = records.slice(0, 100) as Array<Record<string, string>>
            text += sampleRecords.map((r) =>
                headers.map(h => `${h}: ${r[h]}`).join(' | ')
            ).join('\n')

            return {
                text,
                title: fileName.replace(/\.(csv|tsv)$/i, ''),
                sections: [{ title: 'Data', content: text }],
                metadata: {
                    fileName,
                    fileType: delimiter === '\t' ? 'tsv' : 'csv',
                    size,
                    extractedAt: new Date().toISOString(),
                }
            }
        } catch {
            return {
                text: raw,
                title: fileName,
                sections: [{ title: 'Raw Data', content: raw }],
                metadata: { fileName, fileType: 'csv', size, extractedAt: new Date().toISOString() }
            }
        }
    }

    private async extractDocx(filePath: string, fileName: string, size: number): Promise<ExtractedContent> {
        try {
            const result = await mammoth.extractRawText({ path: filePath })
            const text = result.value
            const sections = this.parseMarkdownSections(text)
            const title = this.extractTitle(text, fileName)

            return {
                text,
                title,
                sections,
                metadata: {
                    fileName,
                    fileType: 'docx',
                    size,
                    extractedAt: new Date().toISOString(),
                }
            }
        } catch (error) {
            return {
                text: `[Could not extract content from ${fileName}]`,
                title: fileName,
                sections: [],
                metadata: { fileName, fileType: 'docx', size, extractedAt: new Date().toISOString() }
            }
        }
    }

    private async extractXlsx(filePath: string, fileName: string, size: number): Promise<ExtractedContent> {
        try {
            const workbook = new ExcelJS.Workbook()
            await workbook.xlsx.readFile(filePath)

            const sheets: string[] = []
            const sections: Array<{ title: string; content: string }> = []
            let fullText = ''

            workbook.eachSheet((worksheet) => {
                sheets.push(worksheet.name)
                let sheetText = `## ${worksheet.name}\n\n`

                const rows: string[] = []
                worksheet.eachRow((row, rowNumber) => {
                    const values = row.values as (string | number | null)[]
                    // ExcelJS row.values is 1-indexed, index 0 is undefined
                    const cells = values.slice(1).map(v => String(v ?? ''))
                    if (rowNumber === 1) {
                        rows.push(`| ${cells.join(' | ')} |`)
                        rows.push(`| ${cells.map(() => '---').join(' | ')} |`)
                    } else {
                        rows.push(`| ${cells.join(' | ')} |`)
                    }
                })

                sheetText += rows.join('\n')
                fullText += sheetText + '\n\n'
                sections.push({ title: worksheet.name, content: sheetText })
            })

            return {
                text: fullText,
                title: fileName.replace(/\.xlsx?$/i, ''),
                sections,
                metadata: {
                    fileName,
                    fileType: 'xlsx',
                    size,
                    sheets,
                    extractedAt: new Date().toISOString(),
                }
            }
        } catch (error) {
            return {
                text: `[Could not extract content from ${fileName}]`,
                title: fileName,
                sections: [],
                metadata: { fileName, fileType: 'xlsx', size, extractedAt: new Date().toISOString() }
            }
        }
    }

    private async extractHtml(filePath: string, fileName: string, size: number): Promise<ExtractedContent> {
        const html = fs.readFileSync(filePath, 'utf-8')
        // Simple HTML to text: strip tags
        const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
        const titleMatch = html.match(/<title>(.*?)<\/title>/i)
        const title = titleMatch ? titleMatch[1] : fileName

        return {
            text,
            title,
            sections: [{ title: 'Content', content: text }],
            metadata: { fileName, fileType: 'html', size, extractedAt: new Date().toISOString() }
        }
    }

    private async extractJson(filePath: string, fileName: string, size: number): Promise<ExtractedContent> {
        const raw = fs.readFileSync(filePath, 'utf-8')
        const text = raw.substring(0, 50000) // Limit for AI context

        return {
            text,
            title: fileName.replace(/\.json$/i, ''),
            sections: [{ title: 'JSON Data', content: text }],
            metadata: { fileName, fileType: 'json', size, extractedAt: new Date().toISOString() }
        }
    }

    private async extractPptx(filePath: string, fileName: string, size: number): Promise<ExtractedContent> {
        // Basic PPTX extraction - pptxgenjs is for writing, not reading
        // We use a simple approach: read as buffer and extract text from XML parts
        try {
            const JSZip = (await import('jszip')).default
            const buffer = fs.readFileSync(filePath)
            const zip = await JSZip.loadAsync(buffer as never)

            const slides: Array<{ title: string; content: string }> = []
            let fullText = ''
            let slideNum = 0

            // PPTX files contain slide XML in ppt/slides/
            const slideFiles = Object.keys(zip.files)
                .filter(name => name.match(/ppt\/slides\/slide\d+\.xml$/))
                .sort()

            for (const slideFile of slideFiles) {
                slideNum++
                const xml = await zip.files[slideFile].async('string')
                // Extract text from XML (simple regex approach)
                const texts: string[] = []
                const textMatches = xml.matchAll(/<a:t>(.*?)<\/a:t>/g)
                for (const match of textMatches) {
                    if (match[1].trim()) texts.push(match[1].trim())
                }

                const slideContent = texts.join('\n')
                const slideTitle = texts[0] || `Slide ${slideNum}`
                fullText += `## Slide ${slideNum}: ${slideTitle}\n${slideContent}\n\n`
                slides.push({ title: `Slide ${slideNum}: ${slideTitle}`, content: slideContent })
            }

            return {
                text: fullText,
                title: fileName.replace(/\.pptx?$/i, ''),
                sections: slides,
                metadata: {
                    fileName,
                    fileType: 'pptx',
                    size,
                    pages: slideNum,
                    extractedAt: new Date().toISOString(),
                }
            }
        } catch {
            return {
                text: `[Could not extract content from ${fileName}. PPTX parsing unavailable.]`,
                title: fileName,
                sections: [],
                metadata: { fileName, fileType: 'pptx', size, extractedAt: new Date().toISOString() }
            }
        }
    }

    private parseMarkdownSections(text: string): Array<{ title: string; content: string }> {
        const sections: Array<{ title: string; content: string }> = []
        const lines = text.split('\n')
        let currentTitle = 'Introduction'
        let currentContent: string[] = []

        for (const line of lines) {
            const headerMatch = line.match(/^#{1,3}\s+(.+)/)
            if (headerMatch) {
                if (currentContent.length > 0) {
                    sections.push({ title: currentTitle, content: currentContent.join('\n').trim() })
                }
                currentTitle = headerMatch[1]
                currentContent = []
            } else {
                currentContent.push(line)
            }
        }

        if (currentContent.length > 0) {
            sections.push({ title: currentTitle, content: currentContent.join('\n').trim() })
        }

        return sections
    }

    private extractTitle(text: string, fileName: string): string {
        // Try to find a title from the first header
        const headerMatch = text.match(/^#\s+(.+)/m)
        if (headerMatch) return headerMatch[1]
        // Use filename without extension
        return fileName.replace(/\.[^/.]+$/, '')
    }
}

export const fileExtractionService = new FileExtractionService()
