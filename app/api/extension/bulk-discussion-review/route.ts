import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { chromeExtensionConfig } from "@/lib/config/services";
import { multiAI } from "@/adaptors/multi-ai.adaptor";
import { UserRole } from "@prisma/client";

interface ScannedPost {
    index: number;
    studentId: string | null;
    studentName: string | null;
    studentEmail: string | null;
    content: string | null;
    timestamp: string | null;
    isReply: boolean;
    parentId: string | null;
    wordCount: number;
    uniqueId: string;
}

interface BulkReviewRequest {
    threadTitle: string;
    threadPrompt: string;
    posts: ScannedPost[];
    tone: "supportive" | "direct" | "detailed";
    lms: string;
    metadata: {
        extractedAt: string;
        totalPosts: number;
        uniqueStudents: number;
    };
    courseId?: string;
}

// POST /api/extension/bulk-discussion-review
// Receives scanned discussion posts from extension and generates AI feedback
export async function POST(req: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Validate origin
        const origin = req.headers.get("origin");
        const isValidOrigin = chromeExtensionConfig.allowedOrigins.some(allowedOrigin => {
            if (allowedOrigin.includes("*")) {
                const pattern = allowedOrigin.replace("*", ".*");
                return new RegExp(pattern).test(origin || "");
            }
            return origin === allowedOrigin;
        });

        // Allow localhost for development
        const isLocalhost = origin?.includes("localhost") || origin?.includes("127.0.0.1");

        if (!isValidOrigin && !isLocalhost && origin) {
            console.warn("🚫 Invalid origin:", origin);
            return NextResponse.json({ error: "Forbidden origin" }, { status: 403 });
        }

        const body: BulkReviewRequest = await req.json();
        const { threadTitle, threadPrompt, posts, tone, lms, metadata, courseId } = body;

        if (!posts || posts.length === 0) {
            return NextResponse.json({ error: "No posts provided" }, { status: 400 });
        }

        console.log(`📨 Extension bulk review: ${posts.length} posts from ${lms}`);

        // Get professor (current user)
        const professor = await prisma.user.findUnique({
            where: { email: session.user.email! },
            include: {
                professorStyle: true
            }
        });

        if (!professor || professor.role === UserRole.STUDENT) {
            return NextResponse.json({ error: "Only professors can use this feature" }, { status: 403 });
        }

        // Get or create a discussion thread in our database
        let thread = await prisma.discussionThread.findFirst({
            where: {
                title: threadTitle || "Imported Discussion",
                course: {
                    instructorId: professor.id
                }
            }
        });

        // If no matching thread, find or create a default course and thread
        if (!thread) {
            // Find professor's course or create one
            let course = await prisma.course.findFirst({
                where: { instructorId: professor.id }
            });

            if (!course) {
                course = await prisma.course.create({
                    data: {
                        title: "Imported LMS Course",
                        code: `LMS-${Date.now()}`,
                        instructorId: professor.id,
                        description: `Course imported from ${lms}`,
                        isPublic: false
                    }
                });
            }

            // Create the discussion thread
            thread = await prisma.discussionThread.create({
                data: {
                    title: threadTitle || `Discussion from ${lms}`,
                    prompt: threadPrompt || "",
                    courseId: course.id,
                    isActive: true
                }
            });
        }

        // Get professor style settings
        const style = professor.professorStyle;
        const gradingDifficulty = style?.gradingDifficulty || "MEDIUM";
        const feedbackDepth = style?.feedbackDepth || "MODERATE";
        const personality = style?.personality || "ENCOURAGING";

        // Generate toneAdjustment based on selected tone
        const toneMap: Record<string, string> = {
            supportive: "Be encouraging and highlight strengths while gently suggesting improvements",
            direct: "Be clear and straightforward about what works and what needs improvement",
            detailed: "Provide comprehensive feedback with specific examples and detailed suggestions"
        };

        const results: any[] = [];
        let successCount = 0;
        let errorCount = 0;

        // Process each post
        for (const post of posts) {
            if (!post.content || post.content.trim().length < 10) {
                errorCount++;
                continue;
            }

            try {
                // Find or create student user
                let student = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { name: post.studentName || undefined },
                            { email: post.studentEmail || undefined }
                        ]
                    }
                });

                if (!student && post.studentName) {
                    // Create placeholder student
                    student = await prisma.user.create({
                        data: {
                            name: post.studentName,
                            email: `${post.studentName.toLowerCase().replace(/\s+/g, ".")}@imported.lms`,
                            role: UserRole.STUDENT
                        }
                    });
                }

                // Create discussion post in database
                const discussionPost = await prisma.discussionPost.create({
                    data: {
                        threadId: thread.id,
                        authorId: student?.id || professor.id,
                        body: post.content
                    }
                });

                // Generate AI feedback
                const systemPrompt = `You are an expert teaching assistant helping a professor provide feedback on student discussion posts.

Professor Style:
- Grading Difficulty: ${gradingDifficulty}
- Feedback Depth: ${feedbackDepth}  
- Personality: ${personality}

Tone: ${toneMap[tone] || toneMap.supportive}

Discussion Topic: ${threadPrompt || threadTitle || "General Discussion"}

Analyze the student's post and provide:
1. A score from 0-100
2. Constructive feedback (2-3 paragraphs)
3. 2-3 specific strengths
4. 2-3 areas for improvement

Format your response as JSON:
{
  "score": <number>,
  "feedback": "<string>",
  "strengths": ["<string>", ...],
  "improvements": ["<string>", ...]
}`;

                const userMessage = `Student: ${post.studentName || "Anonymous"}
Word Count: ${post.wordCount}
Post Content:
${post.content}`;

                let aiFeedback: any = null;
                let aiScore: number | null = null;
                let aiStrengths: string[] = [];
                let aiImprovements: string[] = [];
                let aiProvider = "multi-ai";

                try {
                    const { stream, provider } = await multiAI.streamChat([
                        { role: "system", content: systemPrompt },
                        { role: "user", content: userMessage }
                    ]);
                    aiProvider = provider;

                    const reader = stream.getReader();
                    let responseText = "";
                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        responseText += new TextDecoder().decode(value);
                    }

                    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

                    if (jsonMatch) {
                        const parsed = JSON.parse(jsonMatch[0]);
                        aiScore = parsed.score;
                        aiFeedback = parsed.feedback;
                        aiStrengths = parsed.strengths || [];
                        aiImprovements = parsed.improvements || [];
                    } else {
                        aiFeedback = responseText;
                        aiScore = 75; // Default score
                    }
                } catch (aiError) {
                    console.error("AI generation error:", aiError);
                    aiFeedback = `Post from ${post.studentName || "student"} received. Manual review required.`;
                    aiScore = null;
                }

                // Save feedback to database (not approved yet)
                const feedback = await prisma.discussionFeedback.create({
                    data: {
                        postId: discussionPost.id,
                        professorId: professor.id,
                        aiFeedback: aiFeedback || "Feedback generation failed",
                        aiScore: aiScore,
                        aiStrengths: aiStrengths,
                        aiImprovements: aiImprovements,
                        aiProvider,
                        gradingDifficulty,
                        feedbackDepth,
                        personality,
                        isApproved: false
                    }
                });

                results.push({
                    studentName: post.studentName,
                    postId: discussionPost.id,
                    feedbackId: feedback.id,
                    score: aiScore,
                    success: true
                });

                successCount++;

            } catch (postError: any) {
                console.error(`Error processing post ${post.index}:`, postError);
                results.push({
                    studentName: post.studentName,
                    error: postError.message,
                    success: false
                });
                errorCount++;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${successCount} posts, ${errorCount} errors`,
            reviewedCount: successCount,
            errorCount,
            threadId: thread.id,
            results,
            dashboardUrl: `/dashboard/discussions/review?thread=${thread.id}`
        });

    } catch (error: any) {
        console.error("❌ Extension bulk review error:", error);
        return NextResponse.json({
            success: false,
            error: error.message || "Internal server error"
        }, { status: 500 });
    }
}

// GET /api/extension/bulk-discussion-review
// Get status of bulk review capability
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json({
            enabled: true,
            features: {
                bulkScan: true,
                aiReview: true,
                professorStyleIntegration: true,
                approvalWorkflow: true
            },
            supportedLMS: [
                "canvas",
                "moodle",
                "blackboard",
                "d2l",
                "schoology",
                "google_classroom"
            ],
            limits: {
                maxPostsPerRequest: 50,
                maxContentLength: 10000
            }
        });

    } catch (error: any) {
        console.error("❌ Extension status error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
