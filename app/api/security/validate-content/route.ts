import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"

export async function POST(request: NextRequest) {
    try {
        const user = await requireSession()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { content, submissionId, securityLevel } = await request.json()

        // Content validation results
        const validationResults = {
            status: "SECURE" as "SECURE" | "WARNING" | "CRITICAL",
            issues: [] as string[],
            recommendations: [] as string[]
        }

        // Basic security checks
        const securityChecks = [
            {
                pattern: /script\s*>/i,
                severity: "CRITICAL",
                issue: "JavaScript injection detected"
            },
            {
                pattern: /javascript:/i,
                severity: "CRITICAL",
                issue: "JavaScript protocol handler detected"
            },
            {
                pattern: /on\w+\s*=/i,
                severity: "WARNING",
                issue: "Event handler attributes detected"
            },
            {
                pattern: /<iframe/i,
                severity: "WARNING",
                issue: "Embedded iframe detected"
            },
            {
                pattern: /eval\s*\(/i,
                severity: "CRITICAL",
                issue: "Dynamic code evaluation detected"
            },
            {
                pattern: /document\.write/i,
                severity: "WARNING",
                issue: "Document manipulation detected"
            },
            {
                pattern: /\.\.\//g,
                severity: "WARNING",
                issue: "Directory traversal pattern detected"
            }
        ]

        // Run security checks
        securityChecks.forEach(check => {
            if (check.pattern.test(content)) {
                validationResults.issues.push(check.issue)
                if (check.severity === "CRITICAL" && validationResults.status !== "CRITICAL") {
                    validationResults.status = "CRITICAL"
                } else if (check.severity === "WARNING" && validationResults.status === "SECURE") {
                    validationResults.status = "WARNING"
                }
            }
        })

        // Enhanced security checks for ENHANCED level
        if (securityLevel === "ENHANCED") {
            const enhancedChecks = [
                {
                    pattern: /data:/i,
                    issue: "Data URI scheme detected"
                },
                {
                    pattern: /vbscript:/i,
                    issue: "VBScript protocol detected"
                },
                {
                    pattern: /expression\s*\(/i,
                    issue: "CSS expression detected"
                },
                {
                    pattern: /import\s*\(/i,
                    issue: "Dynamic import detected"
                }
            ]

            enhancedChecks.forEach(check => {
                if (check.pattern.test(content)) {
                    validationResults.issues.push(check.issue)
                    if (validationResults.status === "SECURE") {
                        validationResults.status = "WARNING"
                    }
                }
            })
        }

        // Generate recommendations
        if (validationResults.issues.length > 0) {
            validationResults.recommendations.push(
                "Review content for potential security issues",
                "Consider sanitizing user input",
                "Validate all content before processing"
            )
        } else {
            validationResults.recommendations.push(
                "Content appears secure",
                "Continue with normal processing"
            )
        }

        return NextResponse.json(validationResults)

    } catch (error) {
        console.error("Security validation error:", error)
        return NextResponse.json(
            {
                status: "CRITICAL",
                error: "Security validation failed",
                issues: ["Validation system error"]
            },
            { status: 500 }
        )
    }
}