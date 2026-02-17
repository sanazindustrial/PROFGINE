import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export const runtime = "edge"

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

// Parse student posts from text content
function parseStudentPosts(content: string): StudentPost[] {
    const posts: StudentPost[] = []

    // Common patterns for discussion board posts
    // Pattern 1: "Student Name" followed by content
    const namePatterns = [
        /(?:Posted by|From|Author|Student|By)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
        /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:wrote|said|posted|replied)/gi,
    ]

    // Split by common delimiters
    const sections = content.split(/(?:Re:|Reply:|Response:|Post\s+\d+:|Student\s+\d+:)/i)

    sections.forEach((section, index) => {
        const trimmed = section.trim()
        if (trimmed.length > 50) { // Only include substantial posts
            let studentName = `Student ${index + 1}`

            // Try to extract student name
            for (const pattern of namePatterns) {
                const match = trimmed.match(pattern)
                if (match && match[1]) {
                    studentName = match[1].trim()
                    break
                }
            }

            posts.push({
                id: `post-${index}-${Date.now()}`,
                studentName,
                content: trimmed.substring(0, 2000), // Limit content length
            })
        }
    })

    // If no posts found, treat entire content as one post
    if (posts.length === 0 && content.length > 50) {
        posts.push({
            id: `post-0-${Date.now()}`,
            studentName: 'Student 1',
            content: content.substring(0, 2000),
        })
    }

    return posts
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
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { url, rawContent } = body

        let content: string

        if (rawContent) {
            // Direct content provided (pasted text)
            content = rawContent
        } else if (url) {
            // Fetch from URL
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
            }

            const html = await fetchWebpage(url)
            content = extractTextFromHTML(html)
        } else {
            return NextResponse.json({ error: "URL or rawContent is required" }, { status: 400 })
        }

        const posts = parseStudentPosts(content)

        return NextResponse.json({
            success: true,
            posts,
            totalFound: posts.length,
            rawContentLength: content.length,
        })
    } catch (error) {
        console.error("Web scan error:", error)
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Failed to scan web content",
        }, { status: 500 })
    }
}
