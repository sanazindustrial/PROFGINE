import { NextRequest, NextResponse } from "next/server"

// Using Node.js runtime for better compatibility
export const runtime = "nodejs"

interface StudentPost {
    id: string
    studentName: string
    content: string
    timestamp?: string
}

// Extract text content from HTML
function extractTextFromHTML(html: string): string {
    // Remove script and style tags
    let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    // Replace common block elements with newlines
    text = text.replace(/<\/(div|p|br|li|h[1-6]|tr)>/gi, '\n')
    // Remove remaining HTML tags
    text = text.replace(/<[^>]+>/g, ' ')
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ')
    text = text.replace(/&amp;/g, '&')
    text = text.replace(/&lt;/g, '<')
    text = text.replace(/&gt;/g, '>')
    text = text.replace(/&quot;/g, '"')
    text = text.replace(/&#39;/g, "'")
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ')
    return text.trim()
}

// Parse Moodle HTML structure to extract posts
function parseMoodleHTML(html: string): StudentPost[] {
    const posts: StudentPost[] = []
    const seenContent = new Set<string>()

    // Moodle forum post patterns - look for common class structures
    // Pattern 1: forumpost class with author and content sections
    const forumPostRegex = /<article[^>]*class="[^"]*forum-post[^"]*"[^>]*>([\s\S]*?)<\/article>/gi
    let matches = Array.from(html.matchAll(forumPostRegex))

    // Pattern 2: Older Moodle with div.forumpost
    if (matches.length === 0) {
        const oldForumRegex = /<div[^>]*class="[^"]*forumpost[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*forumpost|$)/gi
        matches = Array.from(html.matchAll(oldForumRegex))
    }

    // Pattern 3: Table-based forum (very old Moodle)
    if (matches.length === 0) {
        const tableRegex = /<tr[^>]*class="[^"]*discussion[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi
        matches = Array.from(html.matchAll(tableRegex))
    }

    matches.forEach((match, index) => {
        const postHtml = match[1] || match[0]

        // Extract author name - look for various patterns
        let authorName = `Student ${index + 1}`
        const authorPatterns = [
            // Moodle 4.x author element
            /<a[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/a>/i,
            // User profile link
            /<a[^>]*href="[^"]*user\/view\.php[^"]*"[^>]*>([^<]+)<\/a>/i,
            // Author info div
            /<div[^>]*class="[^"]*author[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/i,
            // Username span
            /<span[^>]*class="[^"]*username[^"]*"[^>]*>([^<]+)<\/span>/i,
            // Fullname link
            /<a[^>]*title="[^"]*"[^>]*>([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)<\/a>/i,
        ]

        for (const pattern of authorPatterns) {
            const authorMatch = postHtml.match(pattern)
            if (authorMatch && authorMatch[1]) {
                const name = authorMatch[1].trim()
                if (name.length > 2 && name.length < 60) {
                    authorName = name
                    break
                }
            }
        }

        // Extract post content
        const contentPatterns = [
            // Moodle 4.x content
            /<div[^>]*class="[^"]*post-content-container[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]*class="[^"]*attachments|$)/i,
            // Post content div
            /<div[^>]*class="[^"]*posting[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            // Content body
            /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?:<div[^>]*class="[^"]*footer|$)/i,
            // Message text
            /<div[^>]*class="[^"]*message[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            // Text content
            /<div[^>]*class="[^"]*text_to_html[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        ]

        let postContent = ''
        for (const pattern of contentPatterns) {
            const contentMatch = postHtml.match(pattern)
            if (contentMatch && contentMatch[1]) {
                postContent = extractTextFromHTML(contentMatch[1])
                if (postContent.length > 20) break
            }
        }

        // Fallback: extract all text from the post
        if (postContent.length < 20) {
            postContent = extractTextFromHTML(postHtml)
        }

        // Skip if content is too short or duplicate
        if (postContent.length > 30) {
            const contentHash = postContent.substring(0, 100).toLowerCase()
            if (!seenContent.has(contentHash)) {
                seenContent.add(contentHash)
                posts.push({
                    id: `moodle-${index}-${Date.now()}`,
                    studentName: authorName,
                    content: cleanContent(postContent.substring(0, 3000)),
                })
            }
        }
    })

    return posts
}

// Parse Canvas HTML structure to extract posts
function parseCanvasHTML(html: string): StudentPost[] {
    const posts: StudentPost[] = []
    const seenContent = new Set<string>()

    // Canvas discussion entry patterns
    const entryPatterns = [
        // Canvas discussion entry
        /<div[^>]*class="[^"]*discussion-entry[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*discussion-entry|$)/gi,
        // Canvas entry content
        /<article[^>]*class="[^"]*discussion_entry[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
        // Reply container
        /<div[^>]*id="entry-[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*id="entry-|$)/gi,
    ]

    let matches: RegExpMatchArray[] = []
    for (const pattern of entryPatterns) {
        matches = Array.from(html.matchAll(pattern))
        if (matches.length > 0) break
    }

    matches.forEach((match, index) => {
        const postHtml = match[1] || match[0]

        // Extract author
        let authorName = `Student ${index + 1}`
        const authorPatterns = [
            /<span[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/span>/i,
            /<a[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/a>/i,
            /<span[^>]*class="[^"]*display_name[^"]*"[^>]*>([^<]+)<\/span>/i,
            /<a[^>]*href="[^"]*\/users\/[^"]*"[^>]*>([^<]+)<\/a>/i,
        ]

        for (const pattern of authorPatterns) {
            const authorMatch = postHtml.match(pattern)
            if (authorMatch && authorMatch[1]) {
                const name = authorMatch[1].trim()
                if (name.length > 2 && name.length < 60) {
                    authorName = name
                    break
                }
            }
        }

        // Extract content
        let postContent = ''
        const contentPatterns = [
            /<div[^>]*class="[^"]*message[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            /<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            /<div[^>]*class="[^"]*user_content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        ]

        for (const pattern of contentPatterns) {
            const contentMatch = postHtml.match(pattern)
            if (contentMatch && contentMatch[1]) {
                postContent = extractTextFromHTML(contentMatch[1])
                if (postContent.length > 20) break
            }
        }

        if (postContent.length < 20) {
            postContent = extractTextFromHTML(postHtml)
        }

        if (postContent.length > 30) {
            const contentHash = postContent.substring(0, 100).toLowerCase()
            if (!seenContent.has(contentHash)) {
                seenContent.add(contentHash)
                posts.push({
                    id: `canvas-${index}-${Date.now()}`,
                    studentName: authorName,
                    content: cleanContent(postContent.substring(0, 3000)),
                })
            }
        }
    })

    return posts
}

// Parse Blackboard HTML structure to extract posts
function parseBlackboardHTML(html: string): StudentPost[] {
    const posts: StudentPost[] = []
    const seenContent = new Set<string>()

    const entryPatterns = [
        // Blackboard Ultra discussion
        /<div[^>]*class="[^"]*js-post[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*js-post|$)/gi,
        // Classic Blackboard
        /<li[^>]*class="[^"]*dbThread[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
        // Discussion message
        /<div[^>]*class="[^"]*vtbegenerated[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
        // Post container
        /<div[^>]*id="message_[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*id="message_|$)/gi,
    ]

    let matches: RegExpMatchArray[] = []
    for (const pattern of entryPatterns) {
        matches = Array.from(html.matchAll(pattern))
        if (matches.length > 0) break
    }

    matches.forEach((match, index) => {
        const postHtml = match[1] || match[0]

        let authorName = `Student ${index + 1}`
        const authorPatterns = [
            /<span[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/span>/i,
            /<a[^>]*class="[^"]*username[^"]*"[^>]*>([^<]+)<\/a>/i,
            /<span[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/span>/i,
            /<strong[^>]*>([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)<\/strong>/i,
        ]

        for (const pattern of authorPatterns) {
            const authorMatch = postHtml.match(pattern)
            if (authorMatch && authorMatch[1]) {
                const name = authorMatch[1].trim()
                if (name.length > 2 && name.length < 60) {
                    authorName = name
                    break
                }
            }
        }

        let postContent = ''
        const contentPatterns = [
            /<div[^>]*class="[^"]*vtbegenerated[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            /<div[^>]*class="[^"]*postBody[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
            /<div[^>]*class="[^"]*message-content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
        ]

        for (const pattern of contentPatterns) {
            const contentMatch = postHtml.match(pattern)
            if (contentMatch && contentMatch[1]) {
                postContent = extractTextFromHTML(contentMatch[1])
                if (postContent.length > 20) break
            }
        }

        if (postContent.length < 20) {
            postContent = extractTextFromHTML(postHtml)
        }

        if (postContent.length > 30) {
            const contentHash = postContent.substring(0, 100).toLowerCase()
            if (!seenContent.has(contentHash)) {
                seenContent.add(contentHash)
                posts.push({
                    id: `blackboard-${index}-${Date.now()}`,
                    studentName: authorName,
                    content: cleanContent(postContent.substring(0, 3000)),
                })
            }
        }
    })

    return posts
}

// Parse Brightspace/D2L HTML structure to extract posts
function parseBrightspaceHTML(html: string): StudentPost[] {
    const posts: StudentPost[] = []
    const seenContent = new Set<string>()

    const entryPatterns = [
        // D2L discussion post
        /<div[^>]*class="[^"]*d2l-htmlblock[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*d2l-htmlblock|$)/gi,
        // Discussion thread
        /<div[^>]*class="[^"]*d2l-discussion-post[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
        // Post wrapper
        /<article[^>]*class="[^"]*d2l-post[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
    ]

    let matches: RegExpMatchArray[] = []
    for (const pattern of entryPatterns) {
        matches = Array.from(html.matchAll(pattern))
        if (matches.length > 0) break
    }

    matches.forEach((match, index) => {
        const postHtml = match[1] || match[0]

        let authorName = `Student ${index + 1}`
        const authorPatterns = [
            /<span[^>]*class="[^"]*d2l-username[^"]*"[^>]*>([^<]+)<\/span>/i,
            /<a[^>]*class="[^"]*d2l-link[^"]*"[^>]*>([^<]+)<\/a>/i,
            /<span[^>]*class="[^"]*poster-name[^"]*"[^>]*>([^<]+)<\/span>/i,
        ]

        for (const pattern of authorPatterns) {
            const authorMatch = postHtml.match(pattern)
            if (authorMatch && authorMatch[1]) {
                const name = authorMatch[1].trim()
                if (name.length > 2 && name.length < 60) {
                    authorName = name
                    break
                }
            }
        }

        let postContent = extractTextFromHTML(postHtml)

        if (postContent.length > 30) {
            const contentHash = postContent.substring(0, 100).toLowerCase()
            if (!seenContent.has(contentHash)) {
                seenContent.add(contentHash)
                posts.push({
                    id: `brightspace-${index}-${Date.now()}`,
                    studentName: authorName,
                    content: cleanContent(postContent.substring(0, 3000)),
                })
            }
        }
    })

    return posts
}

// Parse Schoology HTML structure to extract posts
function parseSchoologyHTML(html: string): StudentPost[] {
    const posts: StudentPost[] = []
    const seenContent = new Set<string>()

    const entryPatterns = [
        // Schoology discussion
        /<div[^>]*class="[^"]*discussion-card[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*discussion-card|$)/gi,
        // Comment/reply
        /<div[^>]*class="[^"]*comment[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*comment|$)/gi,
        // Post wrapper
        /<article[^>]*class="[^"]*s-post[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
    ]

    let matches: RegExpMatchArray[] = []
    for (const pattern of entryPatterns) {
        matches = Array.from(html.matchAll(pattern))
        if (matches.length > 0) break
    }

    matches.forEach((match, index) => {
        const postHtml = match[1] || match[0]

        let authorName = `Student ${index + 1}`
        const authorPatterns = [
            /<span[^>]*class="[^"]*s-user-name[^"]*"[^>]*>([^<]+)<\/span>/i,
            /<a[^>]*class="[^"]*sAuthorLink[^"]*"[^>]*>([^<]+)<\/a>/i,
            /<span[^>]*class="[^"]*name[^"]*"[^>]*>([^<]+)<\/span>/i,
        ]

        for (const pattern of authorPatterns) {
            const authorMatch = postHtml.match(pattern)
            if (authorMatch && authorMatch[1]) {
                const name = authorMatch[1].trim()
                if (name.length > 2 && name.length < 60) {
                    authorName = name
                    break
                }
            }
        }

        let postContent = extractTextFromHTML(postHtml)

        if (postContent.length > 30) {
            const contentHash = postContent.substring(0, 100).toLowerCase()
            if (!seenContent.has(contentHash)) {
                seenContent.add(contentHash)
                posts.push({
                    id: `schoology-${index}-${Date.now()}`,
                    studentName: authorName,
                    content: cleanContent(postContent.substring(0, 3000)),
                })
            }
        }
    })

    return posts
}

// Generic HTML parser for unknown LMS systems
function parseGenericHTML(html: string): StudentPost[] {
    const posts: StudentPost[] = []
    const seenContent = new Set<string>()

    // Generic patterns that work across many platforms
    const entryPatterns = [
        // Article elements (common pattern)
        /<article[^>]*>([\s\S]*?)<\/article>/gi,
        // Post/comment class patterns
        /<div[^>]*class="[^"]*(?:post|comment|reply|message|entry)[^"]*"[^>]*>([\s\S]*?)<\/div>\s*(?=<div[^>]*class="[^"]*(?:post|comment|reply|message|entry)|$)/gi,
        // List items for threaded discussions
        /<li[^>]*class="[^"]*(?:post|thread|message)[^"]*"[^>]*>([\s\S]*?)<\/li>/gi,
    ]

    let matches: RegExpMatchArray[] = []
    for (const pattern of entryPatterns) {
        matches = Array.from(html.matchAll(pattern))
        if (matches.length > 1) break  // Need at least 2 to be meaningful
    }

    matches.forEach((match, index) => {
        const postHtml = match[1] || match[0]

        let authorName = `Student ${index + 1}`
        // Generic author patterns
        const authorPatterns = [
            /<[^>]*class="[^"]*(?:author|user|name|poster)[^"]*"[^>]*>([^<]+)<\/[^>]+>/i,
            /<a[^>]*href="[^"]*(?:user|profile|member)[^"]*"[^>]*>([^<]+)<\/a>/i,
            /<strong[^>]*>([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)<\/strong>/i,
        ]

        for (const pattern of authorPatterns) {
            const authorMatch = postHtml.match(pattern)
            if (authorMatch && authorMatch[1]) {
                const name = authorMatch[1].trim()
                if (name.length > 2 && name.length < 60 && /[A-Z]/.test(name)) {
                    authorName = name
                    break
                }
            }
        }

        let postContent = extractTextFromHTML(postHtml)

        if (postContent.length > 50) {
            const contentHash = postContent.substring(0, 100).toLowerCase()
            if (!seenContent.has(contentHash)) {
                seenContent.add(contentHash)
                posts.push({
                    id: `generic-${index}-${Date.now()}`,
                    studentName: authorName,
                    content: cleanContent(postContent.substring(0, 3000)),
                })
            }
        }
    })

    return posts
}

// Detect LMS type from HTML content
function detectLMSFromHTML(html: string): string {
    const htmlLower = html.toLowerCase()
    
    if (htmlLower.includes('moodle') || htmlLower.includes('/mod/forum/') || htmlLower.includes('forumpost')) {
        return 'moodle'
    }
    if (htmlLower.includes('canvas') || htmlLower.includes('instructure') || htmlLower.includes('ic-app')) {
        return 'canvas'
    }
    if (htmlLower.includes('blackboard') || htmlLower.includes('bb-') || htmlLower.includes('learn.bb')) {
        return 'blackboard'
    }
    if (htmlLower.includes('brightspace') || htmlLower.includes('d2l') || htmlLower.includes('desire2learn')) {
        return 'd2l'
    }
    if (htmlLower.includes('schoology') || htmlLower.includes('sgy-')) {
        return 'schoology'
    }
    return 'generic'
}

// Parse student posts from text content with improved LMS detection
function parseStudentPosts(content: string, html?: string): StudentPost[] {
    const posts: StudentPost[] = []
    const seenContent = new Set<string>()

    // First: Try HTML-based parsing if HTML is available
    if (html) {
        const lmsType = detectLMSFromHTML(html)
        console.log(`Detected LMS type: ${lmsType}`)

        let htmlPosts: StudentPost[] = []

        // Try LMS-specific parser first
        switch (lmsType) {
            case 'moodle':
                htmlPosts = parseMoodleHTML(html)
                break
            case 'canvas':
                htmlPosts = parseCanvasHTML(html)
                break
            case 'blackboard':
                htmlPosts = parseBlackboardHTML(html)
                break
            case 'd2l':
                htmlPosts = parseBrightspaceHTML(html)
                break
            case 'schoology':
                htmlPosts = parseSchoologyHTML(html)
                break
            default:
                htmlPosts = parseGenericHTML(html)
        }

        if (htmlPosts.length > 0) {
            console.log(`Parsed ${htmlPosts.length} posts from ${lmsType} HTML structure`)
            return htmlPosts
        }

        // If LMS-specific parser failed, try generic parser
        if (lmsType !== 'generic') {
            htmlPosts = parseGenericHTML(html)
            if (htmlPosts.length > 0) {
                console.log(`Parsed ${htmlPosts.length} posts from generic HTML structure`)
                return htmlPosts
            }
        }
    }

    // First: Check for bookmarklet format (posts separated by ---)
    if (content.includes('---')) {
        const sections = content.split(/\n*-{3,}\n*/g).filter(s => s.trim().length > 20)

        if (sections.length > 1) {
            sections.forEach((section, index) => {
                const trimmed = section.trim()
                if (trimmed.length > 20 && !isNavigationText(trimmed)) {
                    // Try to extract name from "Name - Date" format at start
                    const headerMatch = trimmed.match(/^([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,3})\s*[-–]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|[A-Za-z]+\s+\d)/i)
                    let studentName = `Student ${index + 1}`
                    let postContent = trimmed

                    if (headerMatch) {
                        studentName = headerMatch[1].trim()
                        // Remove the header line from content
                        postContent = trimmed.replace(/^[^\n]+\n?/, '').trim()
                    }

                    const contentHash = postContent.substring(0, 100).toLowerCase()
                    if (!seenContent.has(contentHash) && postContent.length > 10) {
                        seenContent.add(contentHash)
                        posts.push({
                            id: `post-${index}-${Date.now()}`,
                            studentName,
                            content: cleanContent(postContent.substring(0, 3000)),
                        })
                    }
                }
            })

            if (posts.length > 0) return posts
        }
    }

    // Common LMS patterns for detecting student posts
    const postDelimiters = [
        // Moodle patterns
        /(?:Re:|Reply\s+to\s+|In\s+reply\s+to\s+)/gi,
        // Canvas patterns
        /(?:Posted\s+by|Author:|From:)\s*/gi,
        // Blackboard patterns
        /(?:Student\s+Response|Discussion\s+Post)\s*[:\-]/gi,
        // Generic patterns
        /(?:Response\s+\d+|Post\s+\d+|Student\s+\d+)\s*[:\-]/gi,
        // Name followed by timestamp pattern (e.g., "John Smith - Mar 1, 2024")
        /\n([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*[-–]\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/gi,
    ]

    // Try to split by student name patterns first
    const namePatterns = [
        // "Name - timestamp" format (Moodle style)
        /\n([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s*[-–]\s*\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/g,
        // "by Name" format
        /(?:by|By|BY)\s+([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})(?:\s|,|\n)/g,
        // "Name wrote:" format
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s+(?:wrote|said|posted|replied)[:\s]/gi,
        // "Posted by Name" format (Canvas style)
        /(?:Posted\s+by|Author)\s*[:\s]*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})/gi,
        // "From: Name" format
        /From\s*:\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})/gi,
        // "Name:" at start of line
        /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s*:/gm,
        // "Student Name" in discussion format
        /(?:Student|Learner)\s*[:\-]?\s*([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){1,3})/gi,
    ]

    // First pass: Try to extract named posts using patterns
    let foundPosts: Array<{ name: string; content: string; index: number }> = []

    for (const pattern of namePatterns) {
        let match
        const regex = new RegExp(pattern.source, pattern.flags)
        while ((match = regex.exec(content)) !== null) {
            const name = match[1]?.trim()
            if (name && name.length > 2 && name.length < 50) {
                foundPosts.push({
                    name,
                    content: '',
                    index: match.index
                })
            }
        }
    }

    // Sort by index and extract content between posts
    foundPosts.sort((a, b) => a.index - b.index)

    for (let i = 0; i < foundPosts.length; i++) {
        const start = foundPosts[i].index
        const end = i < foundPosts.length - 1 ? foundPosts[i + 1].index : content.length
        let postContent = content.substring(start, end).trim()

        // Remove the name/header part from the content
        postContent = postContent.replace(/^[^\n]*\n/, '').trim()

        // Skip if content is too short or is navigation/UI text
        if (postContent.length > 30 && !isNavigationText(postContent)) {
            const contentHash = postContent.substring(0, 100).toLowerCase()
            if (!seenContent.has(contentHash)) {
                seenContent.add(contentHash)
                posts.push({
                    id: `post-${posts.length}-${Date.now()}`,
                    studentName: foundPosts[i].name,
                    content: cleanContent(postContent.substring(0, 3000)),
                })
            }
        }
    }

    // If no named posts found, try splitting by common delimiters
    if (posts.length === 0) {
        // Try splitting by "Re:" or "Reply"
        const sections = content.split(/(?:\n\s*(?:Re:|Reply(?:\s+to)?:)\s*)/i)

        sections.forEach((section, index) => {
            const trimmed = section.trim()
            if (trimmed.length > 50 && !isNavigationText(trimmed)) {
                let studentName = `Student ${index + 1}`

                // Try to extract name from the section
                const nameMatch = trimmed.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2})/)
                if (nameMatch) {
                    studentName = nameMatch[1]
                }

                const contentHash = trimmed.substring(0, 100).toLowerCase()
                if (!seenContent.has(contentHash)) {
                    seenContent.add(contentHash)
                    posts.push({
                        id: `post-${index}-${Date.now()}`,
                        studentName,
                        content: cleanContent(trimmed.substring(0, 3000)),
                    })
                }
            }
        })
    }

    // If still no posts found, treat entire content as one post
    if (posts.length === 0 && content.length > 50) {
        posts.push({
            id: `post-0-${Date.now()}`,
            studentName: 'Student 1',
            content: cleanContent(content.substring(0, 3000)),
        })
    }

    return posts
}

// Check if text is navigation/UI text that should be skipped
function isNavigationText(text: string): boolean {
    const navPatterns = [
        /^(skip to|jump to|log in|sign in|menu|home|back|next|previous)/i,
        /^(username|password|email|password log)/i,
        /copyright|all rights reserved/i,
        /^(loading|please wait)/i,
        /^\s*(click here|read more|view more|show more)\s*$/i,
    ]

    const lowerText = text.toLowerCase().substring(0, 200)
    return navPatterns.some(pattern => pattern.test(lowerText))
}

// Detect if the fetched content is a login/auth page
function isLoginPage(html: string, text: string): boolean {
    const htmlLower = html.toLowerCase()
    const textLower = text.toLowerCase()

    // Check for common login page indicators in HTML
    const loginIndicators = [
        // Form-based indicators
        /name=["']?password["']?/i,
        /type=["']?password["']?/i,
        /name=["']?username["']?/i,
        /id=["']?login/i,
        /class=["']?[^"']*login[^"']*["']?/i,
        // Moodle specific
        /loginform/i,
        /loginerrormessage/i,
        /lost.*password/i,
        // Canvas specific
        /ic-Login/i,
        // Blackboard specific
        /loginPage/i,
        /bb-login/i,
        // Generic LMS
        /authentication.*required/i,
        /session.*expired/i,
        /access.*denied/i,
    ]

    const htmlHasLoginIndicator = loginIndicators.some(pattern => pattern.test(htmlLower))

    // Check text content for login messages
    const loginTextPatterns = [
        /log\s*in\s*to\s*(the\s*)?(site|course|account)/i,
        /sign\s*in\s*to\s*continue/i,
        /username\s*(or\s*email)?\s*password/i,
        /enter\s*(your\s*)?(username|credentials)/i,
        /you\s*(must|need\s*to)\s*(be\s*)?(logged\s*in|sign\s*in)/i,
        /please\s*(log\s*in|sign\s*in|authenticate)/i,
        /session\s*has\s*expired/i,
        /access\s*denied/i,
        /not\s*authorized/i,
        /login\s*required/i,
    ]

    const textHasLoginMessage = loginTextPatterns.some(pattern => pattern.test(textLower))

    // Check if content is suspiciously short with login indicators
    const isSuspiciouslyShort = text.length < 1500 && (htmlHasLoginIndicator || textHasLoginMessage)

    // Check for lack of discussion content
    const hasDiscussionContent = /(?:reply|response|post|discussion|student|wrote|said)/i.test(textLower)

    return (htmlHasLoginIndicator && textHasLoginMessage) ||
        (isSuspiciouslyShort && !hasDiscussionContent) ||
        (textHasLoginMessage && !hasDiscussionContent)
}

// Get specific LMS name from URL
function detectLMS(url: string): string {
    const urlLower = url.toLowerCase()
    if (urlLower.includes('moodle') || urlLower.includes('/mod/forum/')) return 'Moodle'
    if (urlLower.includes('canvas')) return 'Canvas'
    if (urlLower.includes('blackboard') || urlLower.includes('bb-')) return 'Blackboard'
    if (urlLower.includes('brightspace') || urlLower.includes('d2l')) return 'Brightspace/D2L'
    if (urlLower.includes('schoology')) return 'Schoology'
    return 'your LMS'
}

// Clean content by removing common artifacts
function cleanContent(content: string): string {
    return content
        .replace(/\s+/g, ' ')
        .replace(/^\s*[-–—]\s*/, '')
        .replace(/\s*[-–—]\s*$/, '')
        .trim()
}

// Fetch webpage content with optional cookies for authenticated requests
async function fetchWebpage(url: string, cookies?: string): Promise<string> {
    const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    }

    // If cookies provided, add them to the request for authenticated access
    if (cookies) {
        headers['Cookie'] = cookies
    }

    const response = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(15000),
        redirect: 'follow',
    })

    if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`)
    }

    return response.text()
}

export async function POST(request: NextRequest) {
    try {
        // Public API - no auth required for discussion tools
        const body = await request.json()
        const { url, rawContent, cookies } = body

        let content: string
        let html: string = ''

        if (rawContent) {
            // Direct content provided from bookmarklet (HTML content)
            content = rawContent
            // If rawContent looks like HTML, set it as html for parsing
            if (rawContent.trim().startsWith('<') || rawContent.includes('<html') || rawContent.includes('<body')) {
                html = rawContent
                content = extractTextFromHTML(rawContent)
            }
        } else if (url) {
            // Fetch from URL
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return NextResponse.json({ error: "Invalild URL format" }, { status: 400 })
            }

            // Use cookies if provided for authenticated LMS access
            html = await fetchWebpage(url, cookies)
            content = extractTextFromHTML(html)

            // Check if we got a login page instead of discussion content
            if (isLoginPage(html, content)) {
                const lmsName = detectLMS(url)

                // If cookies were provided but still got login page, session may be expired
                if (cookies) {
                    return NextResponse.json({
                        error: `Session expired`,
                        requiresAuth: true,
                        lmsName,
                        message: `Your ${lmsName} session appears to have expired. Please refresh the LMS page in your browser and try again.`,
                        suggestion: `Go back to ${lmsName}, refresh the page to restore your session, then use the bookmarklet again.`,
                        posts: [],
                        totalFound: 0,
                    }, { status: 401 })
                }

                return NextResponse.json({
                    error: `Login required`,
                    requiresAuth: true,
                    lmsName,
                    message: `This ${lmsName} discussion page requires authentication. Use the bookmarklet to scan with your login session.`,
                    suggestion: `Use the "Authenticated Scan" bookmarklet while logged into ${lmsName} to capture your session and scan the page.`,
                    supportsCookies: true,
                    posts: [],
                    totalFound: 0,
                }, { status: 401 })
            }
        } else {
            return NextResponse.json({ error: "URL or rawContent is required" }, { status: 400 })
        }

        const posts = parseStudentPosts(content, html)

        // If posts found but they look like navigation/UI text, warn the user
        if (posts.length === 1 && posts[0].studentName === 'Student 1') {
            const postContent = posts[0].content.toLowerCase()
            if (postContent.includes('log in') || postContent.includes('sign in') ||
                postContent.includes('username') || postContent.includes('password')) {
                const lmsName = url ? detectLMS(url) : 'your LMS'
                return NextResponse.json({
                    error: `Could not find student posts`,
                    requiresAuth: true,
                    lmsName,
                    message: `The page content appears to be a login page or navigation content, not student discussions.`,
                    suggestion: `Please log into ${lmsName}, copy the actual discussion posts manually, and paste them in the "Paste Content" tab.`,
                    posts: [],
                    totalFound: 0,
                }, { status: 200 })
            }
        }

        return NextResponse.json({
            success: true,
            posts,
            totalFound: posts.length,
            rawContentLength: content.length,
        })
    } catch (error) {
        console.error("Web scan error:", error)

        // Provide helpful error messages for common issues
        const errorMessage = error instanceof Error ? error.message : "Failed to scan web content"

        if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('timeout')) {
            return NextResponse.json({
                error: "Could not access the URL",
                message: "The website might be blocking automated access, or there could be a network issue.",
                suggestion: "Please copy the discussion content manually and use the 'Paste Content' option instead.",
            }, { status: 500 })
        }

        return NextResponse.json({
            error: errorMessage,
        }, { status: 500 })
    }
}
