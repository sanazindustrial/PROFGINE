import { NextRequest, NextResponse } from "next/server"

const SUPPORT_EMAIL = "support@profgenie.ai"

// SMTP configuration - add these to your .env file
// SMTP_HOST=smtp.hostinger.com
// SMTP_PORT=465
// SMTP_USER=support@profgenie.ai
// SMTP_PASSWORD=your_email_password

interface ContactFormData {
    name: string
    email: string
    inquiryType: string
    subject: string
    message: string
}

const INQUIRY_LABELS: Record<string, string> = {
    general: "General Inquiry",
    technical: "Technical Support",
    billing: "Billing Question",
    feature: "Feature Request",
    bug: "Bug Report",
    privacy: "Privacy Concern",
    other: "Other",
}

export async function POST(request: NextRequest) {
    try {
        const body: ContactFormData = await request.json()

        // Validate required fields
        if (!body.name || !body.email || !body.subject || !body.message) {
            return NextResponse.json(
                { error: "All fields are required" },
                { status: 400 }
            )
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(body.email)) {
            return NextResponse.json(
                { error: "Invalid email address" },
                { status: 400 }
            )
        }

        const inquiryLabel = INQUIRY_LABELS[body.inquiryType] || body.inquiryType
        const timestamp = new Date().toISOString()

        // Format the email content
        const emailContent = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  NEW SUPPORT REQUEST - ProfGenie Platform
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 TICKET DETAILS
─────────────────
Inquiry Type: ${inquiryLabel}
Subject:      ${body.subject}
Submitted:    ${timestamp}

👤 CONTACT INFORMATION
──────────────────────
Name:  ${body.name}
Email: ${body.email}

💬 MESSAGE
──────────
${body.message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This message was sent from the ProfGenie contact form.
Please respond to: ${body.email}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`

        // Try to send email via SMTP if configured
        const smtpHost = process.env.SMTP_HOST
        const smtpPort = process.env.SMTP_PORT
        const smtpUser = process.env.SMTP_USER
        const smtpPassword = process.env.SMTP_PASSWORD

        if (smtpHost && smtpPort && smtpUser && smtpPassword) {
            // Dynamic import nodemailer only when SMTP is configured
            try {
                const nodemailer = await import("nodemailer")

                const transporter = nodemailer.default.createTransport({
                    host: smtpHost,
                    port: parseInt(smtpPort),
                    secure: parseInt(smtpPort) === 465,
                    auth: {
                        user: smtpUser,
                        pass: smtpPassword,
                    },
                })

                await transporter.sendMail({
                    from: `"ProfGenie Support" <${smtpUser}>`,
                    to: SUPPORT_EMAIL,
                    replyTo: body.email,
                    subject: `[${inquiryLabel}] ${body.subject}`,
                    text: emailContent,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <div style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 20px; border-radius: 8px 8px 0 0;">
                                <h1 style="color: white; margin: 0; font-size: 24px;">New Support Request</h1>
                                <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">ProfGenie Platform</p>
                            </div>
                            <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
                                <table style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280; width: 120px;">Inquiry Type:</td>
                                        <td style="padding: 8px 0; font-weight: 600;">${inquiryLabel}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280;">Subject:</td>
                                        <td style="padding: 8px 0; font-weight: 600;">${body.subject}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280;">From:</td>
                                        <td style="padding: 8px 0;">${body.name} &lt;${body.email}&gt;</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 8px 0; color: #6b7280;">Submitted:</td>
                                        <td style="padding: 8px 0;">${new Date().toLocaleString()}</td>
                                    </tr>
                                </table>
                                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                                <h3 style="margin: 0 0 10px; color: #374151;">Message:</h3>
                                <div style="background: #f9fafb; padding: 15px; border-radius: 6px; white-space: pre-wrap;">${body.message}</div>
                                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                                    Reply directly to this email to respond to ${body.name}.
                                </p>
                            </div>
                        </div>
                    `,
                })

                console.log(`Support email sent successfully from ${body.email}`)

                return NextResponse.json({
                    success: true,
                    message: "Your message has been sent successfully. We'll respond within 24-48 hours.",
                })
            } catch (emailError) {
                console.error("Failed to send email via SMTP:", emailError)
                // Fall through to save to database/log
            }
        }

        // If SMTP is not configured or failed, log the request and respond success
        // In production, you would save this to a database table for support tickets
        console.log("═══════════════════════════════════════════════════")
        console.log("NEW SUPPORT REQUEST (SMTP not configured)")
        console.log("═══════════════════════════════════════════════════")
        console.log(emailContent)
        console.log("═══════════════════════════════════════════════════")

        // Still return success - the request is logged and can be retrieved from server logs
        return NextResponse.json({
            success: true,
            message: "Your message has been received. We'll respond within 24-48 hours.",
        })
    } catch (error) {
        console.error("Contact form error:", error)
        return NextResponse.json(
            { error: "Failed to process your request. Please try again." },
            { status: 500 }
        )
    }
}
