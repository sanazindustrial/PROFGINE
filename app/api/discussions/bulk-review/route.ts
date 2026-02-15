import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { multiAI } from "@/adaptors/multi-ai.adaptor";
import { ChatMessage } from "@/types/ai.types";

interface BulkReviewRequest {
    threadId: string;
    postIds?: string[];           // Optional: specific posts to review (if empty, review all)
    // Professor style settings
    gradingDifficulty?: "EASY" | "MEDIUM" | "HARD";
    feedbackDepth?: "LIGHT" | "MODERATE" | "COMPREHENSIVE" | "DEEP";
    personality?: "ENCOURAGING" | "CRITICAL" | "ANALYTICAL" | "SUPPORTIVE" | "DETAILED" | "CONCISE";
    customInstructions?: string;  // Additional grading instructions
    rubric?: string;              // Rubric criteria
}

interface PostFeedback {
    postId: string;
    studentName: string;
    aiFeedback: string;
    aiScore?: number;
    aiStrengths: string[];
    aiImprovements: string[];
    aiProvider: string;
}

// Generate feedback prompt based on professor style
function generateFeedbackPrompt(
    discussionPrompt: string,
    studentPost: string,
    studentName: string,
    style: {
        gradingDifficulty: string;
        feedbackDepth: string;
        personality: string;
        customInstructions?: string;
        rubric?: string;
    }
): string {
    const difficultyPrompts = {
        EASY: "Be lenient and focus on encouraging participation. Highlight positive aspects first.",
        MEDIUM: "Apply standard academic expectations. Balance praise with constructive criticism.",
        HARD: "Apply rigorous academic standards. Be thorough in identifying areas for improvement."
    };

    const depthPrompts = {
        LIGHT: "Provide brief, focused feedback (2-3 sentences).",
        MODERATE: "Provide balanced feedback covering main strengths and improvements (1-2 paragraphs).",
        COMPREHENSIVE: "Provide detailed feedback addressing multiple aspects of the response (2-3 paragraphs).",
        DEEP: "Provide in-depth analysis covering all aspects comprehensively (3+ paragraphs)."
    };

    const personalityPrompts = {
        ENCOURAGING: "Maintain an encouraging, positive tone. Frame suggestions constructively.",
        CRITICAL: "Be direct and analytical. Focus on areas needing improvement.",
        ANALYTICAL: "Provide systematic, logical analysis of the response.",
        SUPPORTIVE: "Be warm and supportive while providing guidance.",
        DETAILED: "Include specific examples and detailed explanations.",
        CONCISE: "Keep feedback focused and to the point."
    };

    return `You are an AI teaching assistant helping a professor grade discussion board responses.

DISCUSSION PROMPT:
${discussionPrompt}

STUDENT NAME: ${studentName}

STUDENT'S RESPONSE:
${studentPost}

${style.rubric ? `GRADING RUBRIC:\n${style.rubric}\n` : ""}
${style.customInstructions ? `ADDITIONAL INSTRUCTIONS:\n${style.customInstructions}\n` : ""}

GRADING STYLE:
- Difficulty Level: ${style.gradingDifficulty} - ${difficultyPrompts[style.gradingDifficulty as keyof typeof difficultyPrompts] || difficultyPrompts.MEDIUM}
- Feedback Depth: ${style.feedbackDepth} - ${depthPrompts[style.feedbackDepth as keyof typeof depthPrompts] || depthPrompts.MODERATE}
- Tone: ${style.personality} - ${personalityPrompts[style.personality as keyof typeof personalityPrompts] || personalityPrompts.SUPPORTIVE}

Please provide your feedback in the following JSON format:
{
    "feedback": "Your detailed feedback text here",
    "score": 85,
    "strengths": ["Strength 1", "Strength 2"],
    "improvements": ["Improvement 1", "Improvement 2"]
}

The score should be 0-100 based on the quality of the response.
Provide 2-4 strengths and 2-4 areas for improvement.`;
}

// Parse AI response to extract structured feedback
function parseAIResponse(content: string): {
    feedback: string;
    score?: number;
    strengths: string[];
    improvements: string[];
} {
    try {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                feedback: parsed.feedback || content,
                score: typeof parsed.score === 'number' ? parsed.score : undefined,
                strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
                improvements: Array.isArray(parsed.improvements) ? parsed.improvements : []
            };
        }
    } catch {
        // If JSON parsing fails, return the raw content
    }

    return {
        feedback: content,
        strengths: [],
        improvements: []
    };
}

// POST /api/discussions/bulk-review - Generate feedback for multiple posts
export async function POST(req: NextRequest) {
    try {
        const session = await requireSession();

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: {
                id: true,
                role: true,
                professorStyle: true
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Only professors and admins can bulk review
        if (user.role !== UserRole.PROFESSOR && user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Only professors can review discussions" }, { status: 403 });
        }

        const body: BulkReviewRequest = await req.json();
        const { threadId, postIds } = body;

        // Get professor style defaults
        const professorStyle = user.professorStyle;
        const style = {
            gradingDifficulty: body.gradingDifficulty || professorStyle?.gradingDifficulty || "MEDIUM",
            feedbackDepth: body.feedbackDepth || professorStyle?.feedbackDepth || "MODERATE",
            personality: body.personality || professorStyle?.personality || "SUPPORTIVE",
            customInstructions: body.customInstructions || professorStyle?.customPromptTemplate || undefined,
            rubric: body.rubric
        };

        // Get the discussion thread with posts
        const thread = await prisma.discussionThread.findFirst({
            where: {
                id: threadId,
                course: {
                    OR: [
                        { instructorId: user.id },
                        ...(user.role === UserRole.ADMIN ? [{}] : [])
                    ]
                }
            },
            include: {
                course: { select: { title: true } },
                posts: {
                    where: postIds && postIds.length > 0 ? { id: { in: postIds } } : {},
                    include: {
                        author: { select: { id: true, name: true, role: true } },
                        feedback: true
                    },
                    orderBy: { createdAt: "asc" }
                }
            }
        });

        if (!thread) {
            return NextResponse.json({ error: "Discussion thread not found or access denied" }, { status: 404 });
        }

        // Filter to only student posts without existing feedback
        const postsToReview = thread.posts.filter(
            post => post.author.role === UserRole.STUDENT && !post.feedback
        );

        if (postsToReview.length === 0) {
            return NextResponse.json({
                message: "No posts to review",
                reviewed: 0,
                skipped: thread.posts.length
            });
        }

        const results: PostFeedback[] = [];
        const errors: { postId: string; error: string }[] = [];

        // Generate feedback for each post
        for (const post of postsToReview) {
            try {
                const prompt = generateFeedbackPrompt(
                    thread.prompt || thread.title,
                    post.body,
                    post.author.name || "Student",
                    style
                );

                const messages: ChatMessage[] = [
                    { role: "user", content: prompt }
                ];

                // Call AI to generate feedback
                const { stream, provider } = await multiAI.streamChat(messages);

                // Read the stream
                const reader = stream.getReader();
                const decoder = new TextDecoder();
                let content = "";

                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    if (value) content += decoder.decode(value, { stream: true });
                }
                content += decoder.decode();

                const parsed = parseAIResponse(content);

                // Save feedback to database
                await prisma.discussionFeedback.create({
                    data: {
                        postId: post.id,
                        professorId: user.id,
                        aiFeedback: parsed.feedback,
                        aiScore: parsed.score,
                        aiStrengths: parsed.strengths,
                        aiImprovements: parsed.improvements,
                        aiProvider: provider,
                        gradingDifficulty: style.gradingDifficulty,
                        feedbackDepth: style.feedbackDepth,
                        personality: style.personality,
                        isApproved: false
                    }
                });

                results.push({
                    postId: post.id,
                    studentName: post.author.name || "Student",
                    aiFeedback: parsed.feedback,
                    aiScore: parsed.score,
                    aiStrengths: parsed.strengths,
                    aiImprovements: parsed.improvements,
                    aiProvider: provider
                });

            } catch (error: any) {
                console.error(`Error generating feedback for post ${post.id}:`, error);
                errors.push({
                    postId: post.id,
                    error: error.message || "Failed to generate feedback"
                });
            }
        }

        return NextResponse.json({
            success: true,
            threadId: thread.id,
            threadTitle: thread.title,
            courseName: thread.course.title,
            reviewed: results.length,
            failed: errors.length,
            skipped: thread.posts.length - postsToReview.length,
            style,
            results,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error: any) {
        console.error("Bulk review error:", error);
        return NextResponse.json({
            error: error.message || "Bulk review failed"
        }, { status: 500 });
    }
}

// GET /api/discussions/bulk-review - Get discussion threads ready for review
export async function GET(req: NextRequest) {
    try {
        const session = await requireSession();

        const user = await prisma.user.findUnique({
            where: { email: session.user.email! },
            select: { id: true, role: true },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        if (user.role !== UserRole.PROFESSOR && user.role !== UserRole.ADMIN) {
            return NextResponse.json({ error: "Access denied" }, { status: 403 });
        }

        // Get all discussion threads for courses the professor owns
        const threads = await prisma.discussionThread.findMany({
            where: {
                course: {
                    OR: [
                        { instructorId: user.id },
                        ...(user.role === UserRole.ADMIN ? [{}] : [])
                    ]
                }
            },
            include: {
                course: { select: { id: true, title: true, code: true } },
                posts: {
                    include: {
                        author: { select: { name: true, role: true } },
                        feedback: { select: { id: true, isApproved: true } }
                    }
                },
                _count: { select: { posts: true } }
            },
            orderBy: { createdAt: "desc" }
        });

        // Add review statistics
        const threadsWithStats = threads.map(thread => {
            const studentPosts = thread.posts.filter(p => p.author.role === UserRole.STUDENT);
            const reviewedPosts = studentPosts.filter(p => p.feedback);
            const approvedPosts = studentPosts.filter(p => p.feedback?.isApproved);

            return {
                id: thread.id,
                title: thread.title,
                prompt: thread.prompt,
                dueDate: thread.dueDate,
                isActive: thread.isActive,
                course: thread.course,
                totalPosts: thread.posts.length,
                studentPosts: studentPosts.length,
                reviewedCount: reviewedPosts.length,
                approvedCount: approvedPosts.length,
                pendingReview: studentPosts.length - reviewedPosts.length,
                createdAt: thread.createdAt
            };
        });

        return NextResponse.json({
            threads: threadsWithStats,
            total: threads.length
        });

    } catch (error: any) {
        console.error("Get discussions error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
