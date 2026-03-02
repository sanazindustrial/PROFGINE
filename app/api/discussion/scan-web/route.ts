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

// Parse student posts from text content with improved LMS detection
function parseStudentPosts(content: string): StudentPost[] {
    const posts: StudentPost[] = []
    const seenContent = new Set<string>()

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

// Fetch webpage content
async function fetchWebpage(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(15000),
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
        const { url, rawContent } = body

        let content: string
        let html: string = ''

        if (rawContent) {
            // Direct content provided (pasted text)
            content = rawContent
        } else if (url) {
            // Fetch from URL
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
            }

            html = await fetchWebpage(url)
            content = extractTextFromHTML(html)

            // Check if we got a login page instead of discussion content
            if (isLoginPage(html, content)) {
                const lmsName = detectLMS(url)
                return NextResponse.json({
                    error: `Login required`,
                    requiresAuth: true,
                    lmsName,
                    message: `This ${lmsName} discussion page requires authentication. The scanner cannot access protected content directly.`,
                    suggestion: `Please log into ${lmsName}, open the discussion page, select all the student posts (Ctrl+A), copy them (Ctrl+C), and paste them in the "Paste Content" tab instead.`,
                    posts: [],
                    totalFound: 0,
                }, { status: 401 })
            }
        } else {
            return NextResponse.json({ error: "URL or rawContent is required" }, { status: 400 })
        }

        const posts = parseStudentPosts(content)

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
