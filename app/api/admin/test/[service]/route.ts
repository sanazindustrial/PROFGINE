import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import OpenAI from "openai"

async function updateHealthStatus(
    service: string,
    status: string,
    responseTime?: number,
    error?: string,
    version?: string
) {
    await prisma.systemHealth.upsert({
        where: { service },
        update: {
            status,
            lastTested: new Date(),
            lastError: error,
            responseTime,
            version,
            updatedAt: new Date()
        },
        create: {
            service,
            status,
            lastTested: new Date(),
            lastError: error,
            responseTime,
            version
        }
    })
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ service: string }> }
) {
    const resolvedParams = await params
    const service = resolvedParams.service
    
    try {
        const session = await requireSession()
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const startTime = Date.now()

        let success = false
        let message = ""
        let version = ""
        let error = ""

        switch (service) {
            case "openai": {
                try {
                    const apiKey = process.env.OPENAI_API_KEY
                    if (!apiKey || apiKey.includes("REPLACE")) {
                        throw new Error("OpenAI API key not configured")
                    }

                    const openai = new OpenAI({ apiKey })
                    const response = await openai.chat.completions.create({
                        model: "gpt-3.5-turbo",
                        messages: [{ role: "user", content: "Test connection" }],
                        max_tokens: 5
                    })

                    success = true
                    message = "OpenAI connection successful"
                    version = response.model || "gpt-3.5-turbo"
                } catch (err: any) {
                    error = err.message
                    message = `OpenAI test failed: ${err.message}`
                }
                break
            }

            case "anthropic": {
                try {
                    const apiKey = process.env.ANTHROPIC_API_KEY
                    if (!apiKey || apiKey.includes("REPLACE")) {
                        throw new Error("Anthropic API key not configured")
                    }

                    const response = await fetch("https://api.anthropic.com/v1/messages", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-api-key": apiKey,
                            "anthropic-version": "2023-06-01"
                        },
                        body: JSON.stringify({
                            model: "claude-3-haiku-20240307",
                            max_tokens: 5,
                            messages: [{ role: "user", content: "Test" }]
                        })
                    })

                    if (response.ok) {
                        success = true
                        message = "Anthropic connection successful"
                        version = "claude-3-haiku-20240307"
                    } else {
                        const errorData = await response.json()
                        throw new Error(errorData.error?.message || "API request failed")
                    }
                } catch (err: any) {
                    error = err.message
                    message = `Anthropic test failed: ${err.message}`
                }
                break
            }

            case "gemini": {
                try {
                    const apiKey = process.env.GEMINI_API_KEY
                    if (!apiKey || apiKey.includes("REPLACE")) {
                        throw new Error("Gemini API key not configured")
                    }

                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: "Test" }] }]
                        })
                    })

                    if (response.ok) {
                        success = true
                        message = "Gemini connection successful"
                        version = "gemini-pro"
                    } else {
                        const errorData = await response.json()
                        throw new Error(errorData.error?.message || "API request failed")
                    }
                } catch (err: any) {
                    error = err.message
                    message = `Gemini test failed: ${err.message}`
                }
                break
            }

            case "groq": {
                try {
                    const apiKey = process.env.GROQ_API_KEY
                    if (!apiKey || apiKey.includes("REPLACE")) {
                        throw new Error("Groq API key not configured")
                    }

                    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${apiKey}`
                        },
                        body: JSON.stringify({
                            model: "llama3-8b-8192",
                            messages: [{ role: "user", content: "Test" }],
                            max_tokens: 5
                        })
                    })

                    if (response.ok) {
                        success = true
                        message = "Groq connection successful"
                        version = "llama3-8b-8192"
                    } else {
                        const errorData = await response.json()
                        throw new Error(errorData.error?.message || "API request failed")
                    }
                } catch (err: any) {
                    error = err.message
                    message = `Groq test failed: ${err.message}`
                }
                break
            }

            case "stripe": {
                try {
                    const secretKey = process.env.STRIPE_SECRET_KEY
                    if (!secretKey || secretKey.includes("REPLACE")) {
                        throw new Error("Stripe secret key not configured")
                    }

                    const response = await fetch("https://api.stripe.com/v1/account", {
                        headers: {
                            "Authorization": `Bearer ${secretKey}`
                        }
                    })

                    if (response.ok) {
                        const account = await response.json()
                        success = true
                        message = `Stripe connection successful (${account.business_profile?.name || account.id})`
                        version = "2023-10-16"
                    } else {
                        const errorData = await response.json()
                        throw new Error(errorData.error?.message || "API request failed")
                    }
                } catch (err: any) {
                    error = err.message
                    message = `Stripe test failed: ${err.message}`
                }
                break
            }

            case "google": {
                try {
                    const clientId = process.env.GOOGLE_CLIENT_ID
                    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

                    if (!clientId || !clientSecret || clientId.includes("REPLACE") || clientSecret.includes("REPLACE")) {
                        throw new Error("Google OAuth credentials not configured")
                    }

                    // Test by making a request to Google's OAuth2 discovery document
                    const response = await fetch("https://accounts.google.com/.well-known/openid_configuration")

                    if (response.ok) {
                        success = true
                        message = "Google OAuth configuration valid"
                        version = "OAuth 2.0"
                    } else {
                        throw new Error("Failed to verify Google OAuth configuration")
                    }
                } catch (err: any) {
                    error = err.message
                    message = `Google OAuth test failed: ${err.message}`
                }
                break
            }

            default:
                return NextResponse.json({ error: "Unknown service" }, { status: 400 })
        }

        const responseTime = Date.now() - startTime

        await updateHealthStatus(
            service,
            success ? "active" : "error",
            responseTime,
            error,
            version
        )

        return NextResponse.json({
            success,
            message,
            responseTime,
            version: success ? version : undefined
        })

    } catch (error) {
        console.error(`Test ${service} error:`, error)
        return NextResponse.json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 })
    }
}