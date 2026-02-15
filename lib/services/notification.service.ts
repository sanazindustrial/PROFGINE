/**
 * Notification Service
 * Handles email notifications and in-app notifications
 * 
 * Supports:
 * - Email via SMTP (nodemailer-compatible)
 * - JSON Server for local development
 * - In-app notification storage
 */

import { prisma } from "@/lib/prisma"

// =============================================================================
// TYPES
// =============================================================================

export type NotificationType =
    | 'COURSE_PUBLISHED'
    | 'GRADE_POSTED'
    | 'NEW_ASSIGNMENT'
    | 'ENROLLMENT_CONFIRMED'
    | 'SYLLABUS_UPDATED'
    | 'FEEDBACK_AVAILABLE'
    | 'SYSTEM_ANNOUNCEMENT'
    | 'ASSIGNMENT_DUE_SOON'
    | 'ASSIGNMENT_DUE_TODAY'
    | 'ASSIGNMENT_OVERDUE'
    | 'PRE_SUBMISSION_REMINDER'
    | 'GRADING_DEADLINE_SOON'
    | 'SUBMISSION_RECEIVED'
    | 'AI_CONTENT_READY'
    | 'AI_CONTENT_APPROVED'
    | 'AI_CONTENT_REJECTED'
    | 'MODULE_PUBLISHED'

export interface NotificationPayload {
    type: NotificationType
    recipientEmail: string
    recipientName?: string
    subject: string
    message: string
    data?: Record<string, any>
    courseId?: string
    userId?: string
}

export interface NotificationResult {
    success: boolean
    notificationId?: string
    email?: {
        sent: boolean
        provider: string
        messageId?: string
    }
    inApp?: {
        saved: boolean
        id?: string
    }
    error?: string
}

export interface BulkNotificationResult {
    total: number
    sent: number
    failed: number
    results: NotificationResult[]
}

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================

const emailTemplates: Record<NotificationType, {
    getSubject: (data: Record<string, any>) => string
    getHtml: (data: Record<string, any>) => string
    getText: (data: Record<string, any>) => string
}> = {
    COURSE_PUBLISHED: {
        getSubject: (data) => `Course Published: ${data.courseTitle}`,
        getHtml: (data) => `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
                    .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
                    .footer { margin-top: 20px; font-size: 12px; color: #6b7280; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Course Published!</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.recipientName || 'Student'},</p>
                        <p>Great news! The course <strong>${data.courseTitle}</strong> has been published and is now available.</p>
                        ${data.courseDescription ? `<p>${data.courseDescription}</p>` : ''}
                        <p><strong>Instructor:</strong> ${data.instructorName || 'Your Professor'}</p>
                        ${data.startDate ? `<p><strong>Start Date:</strong> ${data.startDate}</p>` : ''}
                        <a href="${data.courseUrl || '#'}" class="button">View Course</a>
                        <div class="footer">
                            <p>This is an automated message from Professor GENIE.</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
        getText: (data) => `
Course Published: ${data.courseTitle}

Hello ${data.recipientName || 'Student'},

The course "${data.courseTitle}" has been published and is now available.
${data.courseDescription ? `\n${data.courseDescription}\n` : ''}
Instructor: ${data.instructorName || 'Your Professor'}
${data.startDate ? `Start Date: ${data.startDate}` : ''}

View the course at: ${data.courseUrl || 'the platform'}

This is an automated message from Professor GENIE.
        `
    },
    GRADE_POSTED: {
        getSubject: (data) => `Grade Posted: ${data.assignmentTitle}`,
        getHtml: (data) => `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #10B981; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
                    .grade-box { background: white; padding: 16px; border-radius: 8px; margin: 16px 0; text-align: center; }
                    .grade { font-size: 32px; font-weight: bold; color: #10B981; }
                    .button { display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Grade Posted</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.recipientName || 'Student'},</p>
                        <p>Your grade for <strong>${data.assignmentTitle}</strong> in ${data.courseTitle} has been posted.</p>
                        <div class="grade-box">
                            <p>Your Grade:</p>
                            <p class="grade">${data.grade}${data.maxPoints ? ` / ${data.maxPoints}` : ''}</p>
                        </div>
                        ${data.feedback ? `<p><strong>Feedback:</strong> ${data.feedback}</p>` : ''}
                        <a href="${data.viewUrl || '#'}" class="button">View Details</a>
                    </div>
                </div>
            </body>
            </html>
        `,
        getText: (data) => `
Grade Posted: ${data.assignmentTitle}

Hello ${data.recipientName || 'Student'},

Your grade for "${data.assignmentTitle}" in ${data.courseTitle} has been posted.

Your Grade: ${data.grade}${data.maxPoints ? ` / ${data.maxPoints}` : ''}
${data.feedback ? `\nFeedback: ${data.feedback}` : ''}

View details at: ${data.viewUrl || 'the platform'}
        `
    },
    NEW_ASSIGNMENT: {
        getSubject: (data) => `New Assignment: ${data.assignmentTitle}`,
        getHtml: (data) => `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #F59E0B; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
                    .due-date { background: #FEF3C7; padding: 12px; border-radius: 6px; margin: 12px 0; }
                    .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>New Assignment Posted</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.recipientName || 'Student'},</p>
                        <p>A new assignment has been posted in <strong>${data.courseTitle}</strong>:</p>
                        <h2>${data.assignmentTitle}</h2>
                        ${data.description ? `<p>${data.description}</p>` : ''}
                        ${data.dueDate ? `<div class="due-date"><strong>Due Date:</strong> ${data.dueDate}</div>` : ''}
                        ${data.points ? `<p><strong>Points:</strong> ${data.points}</p>` : ''}
                        <a href="${data.viewUrl || '#'}" class="button">View Assignment</a>
                    </div>
                </div>
            </body>
            </html>
        `,
        getText: (data) => `
New Assignment: ${data.assignmentTitle}

Hello ${data.recipientName || 'Student'},

A new assignment has been posted in "${data.courseTitle}":

${data.assignmentTitle}
${data.description ? `\n${data.description}\n` : ''}
${data.dueDate ? `Due Date: ${data.dueDate}` : ''}
${data.points ? `Points: ${data.points}` : ''}

View at: ${data.viewUrl || 'the platform'}
        `
    },
    ENROLLMENT_CONFIRMED: {
        getSubject: (data) => `Enrollment Confirmed: ${data.courseTitle}`,
        getHtml: (data) => `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #8B5CF6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
                    .button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Enrollment Confirmed!</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.recipientName || 'Student'},</p>
                        <p>You have been successfully enrolled in <strong>${data.courseTitle}</strong>.</p>
                        <p><strong>Instructor:</strong> ${data.instructorName || 'Your Professor'}</p>
                        ${data.startDate ? `<p><strong>Starts:</strong> ${data.startDate}</p>` : ''}
                        <a href="${data.courseUrl || '#'}" class="button">Go to Course</a>
                    </div>
                </div>
            </body>
            </html>
        `,
        getText: (data) => `
Enrollment Confirmed: ${data.courseTitle}

Hello ${data.recipientName || 'Student'},

You have been successfully enrolled in "${data.courseTitle}".

Instructor: ${data.instructorName || 'Your Professor'}
${data.startDate ? `Starts: ${data.startDate}` : ''}

Access the course at: ${data.courseUrl || 'the platform'}
        `
    },
    SYLLABUS_UPDATED: {
        getSubject: (data) => `Syllabus Updated: ${data.courseTitle}`,
        getHtml: (data) => `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #3B82F6; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
                    .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Syllabus Updated</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.recipientName || 'Student'},</p>
                        <p>The syllabus for <strong>${data.courseTitle}</strong> has been updated.</p>
                        ${data.changes ? `<p><strong>Changes:</strong> ${data.changes}</p>` : ''}
                        <a href="${data.syllabusUrl || '#'}" class="button">View Syllabus</a>
                    </div>
                </div>
            </body>
            </html>
        `,
        getText: (data) => `
Syllabus Updated: ${data.courseTitle}

Hello ${data.recipientName || 'Student'},

The syllabus for "${data.courseTitle}" has been updated.
${data.changes ? `\nChanges: ${data.changes}` : ''}

View at: ${data.syllabusUrl || 'the platform'}
        `
    },
    FEEDBACK_AVAILABLE: {
        getSubject: (data) => `Feedback Available: ${data.assignmentTitle}`,
        getHtml: (data) => `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #06B6D4; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
                    .button { display: inline-block; background: #06B6D4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Feedback Available</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.recipientName || 'Student'},</p>
                        <p>New feedback is available for your submission on <strong>${data.assignmentTitle}</strong>.</p>
                        <a href="${data.viewUrl || '#'}" class="button">View Feedback</a>
                    </div>
                </div>
            </body>
            </html>
        `,
        getText: (data) => `
Feedback Available: ${data.assignmentTitle}

Hello ${data.recipientName || 'Student'},

New feedback is available for your submission on "${data.assignmentTitle}".

View at: ${data.viewUrl || 'the platform'}
        `
    },
    SYSTEM_ANNOUNCEMENT: {
        getSubject: (data) => data.subject || 'System Announcement',
        getHtml: (data) => `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #6366F1; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Announcement</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.recipientName || 'User'},</p>
                        <p>${data.message}</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        getText: (data) => `
Announcement

Hello ${data.recipientName || 'User'},

${data.message}
        `
    },
    ASSIGNMENT_DUE_SOON: {
        getSubject: (data) => `Reminder: ${data.assignmentTitle} due in ${data.hoursRemaining} hours`,
        getHtml: (data) => `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #F59E0B; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
                    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
                    .due-box { background: #FEF3C7; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #F59E0B; }
                    .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>⏰ Assignment Due Soon</h1>
                    </div>
                    <div class="content">
                        <p>Hello ${data.recipientName || 'Student'},</p>
                        <p><strong>${data.assignmentTitle}</strong> in ${data.courseTitle} is due soon.</p>
                        <div class="due-box">
                            <p><strong>Due:</strong> ${data.dueDate}</p>
                            <p><strong>Time remaining:</strong> ${data.hoursRemaining} hours</p>
                        </div>
                        <a href="${data.viewUrl || '#'}" class="button">View Assignment</a>
                    </div>
                </div>
            </body>
            </html>
        `,
        getText: (data) => `Assignment Due Soon: ${data.assignmentTitle}\n\n${data.assignmentTitle} in ${data.courseTitle} is due in ${data.hoursRemaining} hours.\nDue: ${data.dueDate}`
    },
    ASSIGNMENT_DUE_TODAY: {
        getSubject: (data) => `Due Today: ${data.assignmentTitle}`,
        getHtml: (data) => `
            <!DOCTYPE html>
            <html><head><style>body{font-family:Arial,sans-serif;}.container{max-width:600px;margin:0 auto;}.header{background:#EF4444;color:white;padding:20px;border-radius:8px 8px 0 0;}.content{background:#f9fafb;padding:20px;}.button{display:inline-block;background:#EF4444;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px;}</style></head>
            <body><div class="container"><div class="header"><h1>🔴 Due Today!</h1></div><div class="content"><p>Hello ${data.recipientName || 'Student'},</p><p><strong>${data.assignmentTitle}</strong> in ${data.courseTitle} is due today!</p><p><strong>Deadline:</strong> ${data.dueDate}</p><a href="${data.viewUrl || '#'}" class="button">Submit Now</a></div></div></body></html>
        `,
        getText: (data) => `DUE TODAY: ${data.assignmentTitle}\n\nDeadline: ${data.dueDate}`
    },
    ASSIGNMENT_OVERDUE: {
        getSubject: (data) => `Overdue: ${data.assignmentTitle}`,
        getHtml: (data) => `
            <!DOCTYPE html>
            <html><head><style>body{font-family:Arial,sans-serif;}.container{max-width:600px;margin:0 auto;}.header{background:#DC2626;color:white;padding:20px;border-radius:8px 8px 0 0;}.content{background:#f9fafb;padding:20px;}.button{display:inline-block;background:#DC2626;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px;}</style></head>
            <body><div class="container"><div class="header"><h1>⚠️ Assignment Overdue</h1></div><div class="content"><p>Hello ${data.recipientName || 'Student'},</p><p><strong>${data.assignmentTitle}</strong> in ${data.courseTitle} is now overdue.</p><p>Original deadline: ${data.dueDate}</p>${data.lateSubmissionAllowed ? '<p>Late submissions may still be accepted with a penalty.</p>' : ''}<a href="${data.viewUrl || '#'}" class="button">Submit Now</a></div></div></body></html>
        `,
        getText: (data) => `OVERDUE: ${data.assignmentTitle}\n\nOriginal deadline: ${data.dueDate}`
    },
    PRE_SUBMISSION_REMINDER: {
        getSubject: (data) => `Pre-submission reminder: ${data.assignmentTitle}`,
        getHtml: (data) => `
            <!DOCTYPE html>
            <html><head><style>body{font-family:Arial,sans-serif;}.container{max-width:600px;margin:0 auto;}.header{background:#8B5CF6;color:white;padding:20px;border-radius:8px 8px 0 0;}.content{background:#f9fafb;padding:20px;}.button{display:inline-block;background:#8B5CF6;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px;}</style></head>
            <body><div class="container"><div class="header"><h1>📝 Draft Submission Reminder</h1></div><div class="content"><p>Hello ${data.recipientName || 'Student'},</p><p>The pre-submission/draft deadline for <strong>${data.assignmentTitle}</strong> is approaching.</p><p><strong>Pre-submission deadline:</strong> ${data.preSubmissionDeadline}</p><p><strong>Final deadline:</strong> ${data.dueDate}</p><a href="${data.viewUrl || '#'}" class="button">Submit Draft</a></div></div></body></html>
        `,
        getText: (data) => `Pre-submission reminder: ${data.assignmentTitle}\n\nPre-submission deadline: ${data.preSubmissionDeadline}\nFinal deadline: ${data.dueDate}`
    },
    GRADING_DEADLINE_SOON: {
        getSubject: (data) => `Grading deadline approaching: ${data.assignmentTitle}`,
        getHtml: (data) => `
            <!DOCTYPE html>
            <html><head><style>body{font-family:Arial,sans-serif;}.container{max-width:600px;margin:0 auto;}.header{background:#0EA5E9;color:white;padding:20px;border-radius:8px 8px 0 0;}.content{background:#f9fafb;padding:20px;}.stats{background:white;padding:16px;border-radius:8px;margin:12px 0;}.button{display:inline-block;background:#0EA5E9;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px;}</style></head>
            <body><div class="container"><div class="header"><h1>📊 Grading Deadline</h1></div><div class="content"><p>Hello ${data.recipientName || 'Instructor'},</p><p>The grading deadline for <strong>${data.assignmentTitle}</strong> is approaching.</p><div class="stats"><p>Grading deadline: ${data.gradingDeadline}</p><p>Submissions to grade: ${data.submissionsCount || 'N/A'}</p><p>Graded: ${data.gradedCount || 0}</p></div><a href="${data.viewUrl || '#'}" class="button">Start Grading</a></div></div></body></html>
        `,
        getText: (data) => `Grading deadline: ${data.assignmentTitle}\n\nDeadline: ${data.gradingDeadline}\nSubmissions to grade: ${data.submissionsCount || 'N/A'}`
    },
    SUBMISSION_RECEIVED: {
        getSubject: (data) => `Submission received: ${data.assignmentTitle}`,
        getHtml: (data) => `
            <!DOCTYPE html>
            <html><head><style>body{font-family:Arial,sans-serif;}.container{max-width:600px;margin:0 auto;}.header{background:#10B981;color:white;padding:20px;border-radius:8px 8px 0 0;}.content{background:#f9fafb;padding:20px;}</style></head>
            <body><div class="container"><div class="header"><h1>✅ Submission Received</h1></div><div class="content"><p>Hello ${data.recipientName || 'Student'},</p><p>Your submission for <strong>${data.assignmentTitle}</strong> has been received.</p><p>Submitted: ${data.submittedAt}</p><p>You will be notified when your grade is posted.</p></div></div></body></html>
        `,
        getText: (data) => `Submission received: ${data.assignmentTitle}\n\nSubmitted: ${data.submittedAt}`
    },
    AI_CONTENT_READY: {
        getSubject: (data) => `AI content ready for review: ${data.contentTitle}`,
        getHtml: (data) => `
            <!DOCTYPE html>
            <html><head><style>body{font-family:Arial,sans-serif;}.container{max-width:600px;margin:0 auto;}.header{background:#6366F1;color:white;padding:20px;border-radius:8px 8px 0 0;}.content{background:#f9fafb;padding:20px;}.button{display:inline-block;background:#6366F1;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px;}</style></head>
            <body><div class="container"><div class="header"><h1>🤖 AI Content Ready</h1></div><div class="content"><p>Hello ${data.recipientName || 'Professor'},</p><p>AI-generated content is ready for your review.</p><p><strong>Content:</strong> ${data.contentTitle}</p><p><strong>Type:</strong> ${data.contentType || 'Lecture Notes'}</p><p><strong>Course:</strong> ${data.courseTitle}</p><a href="${data.viewUrl || '#'}" class="button">Review Content</a></div></div></body></html>
        `,
        getText: (data) => `AI content ready: ${data.contentTitle}\n\nCourse: ${data.courseTitle}\nType: ${data.contentType || 'Lecture Notes'}`
    },
    AI_CONTENT_APPROVED: {
        getSubject: (data) => `AI content approved: ${data.contentTitle}`,
        getHtml: (data) => `
            <!DOCTYPE html>
            <html><head><style>body{font-family:Arial,sans-serif;}.container{max-width:600px;margin:0 auto;}.header{background:#10B981;color:white;padding:20px;border-radius:8px 8px 0 0;}.content{background:#f9fafb;padding:20px;}</style></head>
            <body><div class="container"><div class="header"><h1>✅ Content Approved</h1></div><div class="content"><p>The AI-generated content <strong>${data.contentTitle}</strong> has been approved.</p><p>Approved by: ${data.approvedBy}</p><p>Status: Published</p></div></div></body></html>
        `,
        getText: (data) => `AI content approved: ${data.contentTitle}\n\nApproved by: ${data.approvedBy}`
    },
    AI_CONTENT_REJECTED: {
        getSubject: (data) => `AI content requires revision: ${data.contentTitle}`,
        getHtml: (data) => `
            <!DOCTYPE html>
            <html><head><style>body{font-family:Arial,sans-serif;}.container{max-width:600px;margin:0 auto;}.header{background:#F59E0B;color:white;padding:20px;border-radius:8px 8px 0 0;}.content{background:#f9fafb;padding:20px;}.feedback{background:#FEF3C7;padding:16px;border-radius:8px;margin:12px 0;}.button{display:inline-block;background:#F59E0B;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px;}</style></head>
            <body><div class="container"><div class="header"><h1>📝 Revision Required</h1></div><div class="content"><p>The AI-generated content <strong>${data.contentTitle}</strong> requires revision.</p><div class="feedback"><strong>Feedback:</strong><p>${data.reviewNotes || 'Please review and make necessary changes.'}</p></div><a href="${data.viewUrl || '#'}" class="button">Edit Content</a></div></div></body></html>
        `,
        getText: (data) => `AI content requires revision: ${data.contentTitle}\n\nFeedback: ${data.reviewNotes || 'Please review and make necessary changes.'}`
    },
    MODULE_PUBLISHED: {
        getSubject: (data) => `New module available: ${data.moduleTitle}`,
        getHtml: (data) => `
            <!DOCTYPE html>
            <html><head><style>body{font-family:Arial,sans-serif;}.container{max-width:600px;margin:0 auto;}.header{background:#4F46E5;color:white;padding:20px;border-radius:8px 8px 0 0;}.content{background:#f9fafb;padding:20px;}.button{display:inline-block;background:#4F46E5;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;margin-top:16px;}</style></head>
            <body><div class="container"><div class="header"><h1>📚 New Module Available</h1></div><div class="content"><p>Hello ${data.recipientName || 'Student'},</p><p>A new module is now available in <strong>${data.courseTitle}</strong>:</p><h2>${data.moduleTitle}</h2>${data.description ? `<p>${data.description}</p>` : ''}<a href="${data.viewUrl || '#'}" class="button">View Module</a></div></div></body></html>
        `,
        getText: (data) => `New module: ${data.moduleTitle}\n\nCourse: ${data.courseTitle}`
    }
}

// =============================================================================
// NOTIFICATION SERVICE
// =============================================================================

class NotificationService {
    private jsonServerUrl: string
    private smtpConfig: {
        host: string
        port: number
        secure: boolean
        user: string
        pass: string
    } | null = null

    constructor() {
        this.jsonServerUrl = process.env.JSON_SERVER_URL || 'http://localhost:3001'

        // Check if SMTP is configured
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            this.smtpConfig = {
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS || ''
            }
        }
    }

    /**
     * Send a notification (email + in-app)
     */
    async sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
        const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        try {
            // Store in JSON Server (for local dev) or database
            const inAppResult = await this.saveInAppNotification(notificationId, payload)

            // Send email if configured
            let emailResult = { sent: false, provider: 'none' }

            if (process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true') {
                emailResult = await this.sendEmail(payload)
            }

            return {
                success: true,
                notificationId,
                email: emailResult,
                inApp: inAppResult
            }
        } catch (error) {
            return {
                success: false,
                notificationId,
                error: error instanceof Error ? error.message : 'Notification failed'
            }
        }
    }

    /**
     * Send bulk notifications (e.g., to all enrolled students)
     */
    async sendBulkNotifications(
        recipients: { email: string; name?: string; userId?: string }[],
        type: NotificationType,
        data: Record<string, any>
    ): Promise<BulkNotificationResult> {
        const results: NotificationResult[] = []
        let sent = 0
        let failed = 0

        for (const recipient of recipients) {
            const template = emailTemplates[type]
            const templateData = { ...data, recipientName: recipient.name }

            const result = await this.sendNotification({
                type,
                recipientEmail: recipient.email,
                recipientName: recipient.name,
                subject: template.getSubject(templateData),
                message: template.getText(templateData),
                data: templateData,
                userId: recipient.userId
            })

            results.push(result)
            if (result.success) {
                sent++
            } else {
                failed++
            }

            // Rate limiting - don't overwhelm the server
            await new Promise(resolve => setTimeout(resolve, 100))
        }

        return {
            total: recipients.length,
            sent,
            failed,
            results
        }
    }

    /**
     * Notify enrolled students when a course is published
     */
    async notifyCoursePublished(courseId: string, instructorId: string): Promise<BulkNotificationResult> {
        // Get course details
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                instructor: { select: { name: true, email: true } },
                enrollments: {
                    include: {
                        user: { select: { id: true, email: true, name: true } }
                    }
                }
            }
        })

        if (!course) {
            return { total: 0, sent: 0, failed: 0, results: [] }
        }

        const recipients = course.enrollments.map(e => ({
            email: e.user.email,
            name: e.user.name || undefined,
            userId: e.user.id
        }))

        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

        return this.sendBulkNotifications(recipients, 'COURSE_PUBLISHED', {
            courseTitle: course.title,
            courseDescription: course.description,
            instructorName: course.instructor.name,
            courseUrl: `${baseUrl}/dashboard/courses/${course.id}`,
            startDate: course.startDate?.toLocaleDateString()
        })
    }

    /**
     * Save notification to JSON Server (local dev) or database
     */
    private async saveInAppNotification(
        notificationId: string,
        payload: NotificationPayload
    ): Promise<{ saved: boolean; id?: string }> {
        try {
            // Try JSON Server first (for local development)
            const response = await fetch(`${this.jsonServerUrl}/notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: notificationId,
                    type: payload.type,
                    recipientEmail: payload.recipientEmail,
                    recipientName: payload.recipientName,
                    subject: payload.subject,
                    message: payload.message,
                    data: payload.data,
                    courseId: payload.courseId,
                    userId: payload.userId,
                    read: false,
                    createdAt: new Date().toISOString()
                })
            })

            if (response.ok) {
                return { saved: true, id: notificationId }
            }
        } catch {
            // JSON Server not available, skip in-app storage for now
            console.log('[Notification] JSON Server not available, notification logged only')
        }

        return { saved: false }
    }

    /**
     * Send email via configured provider
     */
    private async sendEmail(payload: NotificationPayload): Promise<{
        sent: boolean
        provider: string
        messageId?: string
    }> {
        const template = emailTemplates[payload.type]
        const templateData = { ...payload.data, recipientName: payload.recipientName }

        try {
            // Try JSON Server email endpoint (for local development with json-server)
            const response = await fetch(`${this.jsonServerUrl}/emails`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: `email_${Date.now()}`,
                    to: payload.recipientEmail,
                    subject: template.getSubject(templateData),
                    html: template.getHtml(templateData),
                    text: template.getText(templateData),
                    type: payload.type,
                    sentAt: new Date().toISOString()
                })
            })

            if (response.ok) {
                const result = await response.json()
                return { sent: true, provider: 'json-server', messageId: result.id }
            }
        } catch {
            console.log('[Notification] Email logging to JSON Server failed')
        }

        // In production, implement real SMTP sending here
        // For now, just log the email
        console.log(`[Email] Would send to: ${payload.recipientEmail}`)
        console.log(`[Email] Subject: ${payload.subject}`)

        return { sent: false, provider: 'mock' }
    }

    /**
     * Get notifications for a user
     */
    async getUserNotifications(userId: string, limit = 20): Promise<any[]> {
        try {
            const response = await fetch(
                `${this.jsonServerUrl}/notifications?userId=${userId}&_sort=createdAt&_order=desc&_limit=${limit}`
            )
            if (response.ok) {
                return await response.json()
            }
        } catch {
            // JSON Server not available
        }
        return []
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.jsonServerUrl}/notifications/${notificationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ read: true, readAt: new Date().toISOString() })
            })
            return response.ok
        } catch {
            return false
        }
    }

    /**
     * Check and send due date reminders
     * Call this periodically (e.g., via cron job or scheduled task)
     */
    async checkAndSendDueDateReminders(): Promise<{ sent: number; errors: number }> {
        let sent = 0
        let errors = 0

        try {
            const now = new Date()
            const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
            const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000)

            // Find assignments due soon
            // Note: After running `prisma generate`, add reminderSent: false to the where clause
            const upcomingAssignments = await prisma.assignment.findMany({
                where: {
                    dueAt: {
                        gte: now,
                        lte: dayAfterTomorrow
                    }
                    // reminderSent: false // Uncomment after schema migration
                },
                include: {
                    course: {
                        include: {
                            enrollments: {
                                include: {
                                    user: true
                                }
                            },
                            instructor: true
                        }
                    }
                }
            })

            for (const assignment of upcomingAssignments) {
                const course = (assignment as any).course
                if (!course) continue

                const hoursUntilDue = Math.round((assignment.dueAt!.getTime() - now.getTime()) / (1000 * 60 * 60))
                const isDueToday = assignment.dueAt!.toDateString() === now.toDateString()

                // Send to all enrolled students
                for (const enrollment of course.enrollments || []) {
                    try {
                        await this.sendNotification({
                            type: isDueToday ? 'ASSIGNMENT_DUE_TODAY' : 'ASSIGNMENT_DUE_SOON',
                            recipientEmail: enrollment.user.email,
                            recipientName: enrollment.user.name || undefined,
                            subject: `${isDueToday ? 'Due Today' : 'Due Soon'}: ${assignment.title}`,
                            message: `Assignment "${assignment.title}" is due ${isDueToday ? 'today' : `in ${hoursUntilDue} hours`}`,
                            courseId: assignment.courseId,
                            userId: enrollment.user.id,
                            data: {
                                assignmentTitle: assignment.title,
                                courseTitle: course.title,
                                dueDate: assignment.dueAt?.toLocaleString(),
                                hoursRemaining: hoursUntilDue,
                                viewUrl: `/dashboard/courses/${assignment.courseId}/assignments/${assignment.id}`
                            }
                        })
                        sent++
                    } catch {
                        errors++
                    }
                }

                // Mark reminder as sent (after schema migration)
                // await prisma.assignment.update({
                //     where: { id: assignment.id },
                //     data: { reminderSent: true }
                // })
            }

            // Check for overdue assignments
            const overdueAssignments = await prisma.assignment.findMany({
                where: {
                    dueAt: {
                        lt: now,
                        gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) // Within last 24 hours
                    }
                },
                include: {
                    course: {
                        include: {
                            enrollments: {
                                include: {
                                    user: true
                                }
                            }
                        }
                    },
                    submissions: true
                }
            })

            for (const assignment of overdueAssignments) {
                // Find students who haven't submitted
                const submittedStudentIds = assignment.submissions.map(s => s.studentId)
                const missingSubmissions = assignment.course.enrollments.filter(
                    e => !submittedStudentIds.includes(e.userId)
                )

                for (const enrollment of missingSubmissions) {
                    try {
                        await this.sendNotification({
                            type: 'ASSIGNMENT_OVERDUE',
                            recipientEmail: enrollment.user.email,
                            recipientName: enrollment.user.name || undefined,
                            subject: `Overdue: ${assignment.title}`,
                            message: `Assignment "${assignment.title}" is now overdue`,
                            courseId: assignment.courseId,
                            userId: enrollment.user.id,
                            data: {
                                assignmentTitle: assignment.title,
                                courseTitle: assignment.course.title,
                                dueDate: assignment.dueAt?.toLocaleString(),
                                lateSubmissionAllowed: true,
                                viewUrl: `/dashboard/courses/${assignment.courseId}/assignments/${assignment.id}`
                            }
                        })
                        sent++
                    } catch {
                        errors++
                    }
                }
            }

        } catch (error) {
            console.error('[Notification] Due date check failed:', error)
        }

        return { sent, errors }
    }

    /**
     * Send grading deadline reminder to instructors
     */
    async sendGradingDeadlineReminder(assignmentId: string): Promise<NotificationResult> {
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: {
                course: {
                    include: {
                        instructor: true
                    }
                },
                submissions: {
                    where: {
                        gradedAt: null
                    }
                }
            }
        })

        if (!assignment) {
            return { success: false, error: 'Assignment not found' }
        }

        // Type assertion for fields that will exist after prisma generate
        const assignmentExt = assignment as typeof assignment & { gradingDeadline?: Date }
        const course = assignment.course

        if (!assignmentExt.gradingDeadline) {
            return { success: false, error: 'No grading deadline set' }
        }

        return this.sendNotification({
            type: 'GRADING_DEADLINE_SOON',
            recipientEmail: course.instructor.email,
            recipientName: course.instructor.name || undefined,
            subject: `Grading deadline approaching: ${assignment.title}`,
            message: `${assignment.submissions.length} submissions awaiting grading`,
            courseId: assignment.courseId,
            userId: course.instructorId,
            data: {
                assignmentTitle: assignment.title,
                courseTitle: course.title,
                gradingDeadline: assignmentExt.gradingDeadline?.toLocaleString(),
                submissionsCount: assignment.submissions.length,
                gradedCount: 0, // This would need actual count
                viewUrl: `/dashboard/courses/${assignment.courseId}/grading/${assignment.id}`
            }
        })
    }

    /**
     * Send AI content review notification
     */
    async sendAIContentReviewNotification(
        contentId: string,
        contentTitle: string,
        contentType: string,
        courseId: string,
        courseTitle: string,
        instructorId: string,
        instructorEmail: string,
        instructorName?: string
    ): Promise<NotificationResult> {
        return this.sendNotification({
            type: 'AI_CONTENT_READY',
            recipientEmail: instructorEmail,
            recipientName: instructorName,
            subject: `AI content ready for review: ${contentTitle}`,
            message: `AI-generated ${contentType} is ready for your review`,
            courseId,
            userId: instructorId,
            data: {
                contentTitle,
                contentType,
                courseTitle,
                viewUrl: `/dashboard/courses/${courseId}/content/${contentId}`
            }
        })
    }

    /**
     * Send AI content approval/rejection notification
     */
    async sendAIContentStatusNotification(
        status: 'approved' | 'rejected',
        contentTitle: string,
        reviewerName: string,
        reviewNotes?: string
    ): Promise<void> {
        // This would typically notify the content creator or course admin
        console.log(`[Notification] AI content ${status}: ${contentTitle} by ${reviewerName}`)
        if (reviewNotes) {
            console.log(`[Notification] Review notes: ${reviewNotes}`)
        }
    }

    /**
     * Send submission confirmation to student
     */
    async sendSubmissionConfirmation(
        studentEmail: string,
        studentName: string | null,
        assignmentTitle: string,
        courseTitle: string,
        submittedAt: Date
    ): Promise<NotificationResult> {
        return this.sendNotification({
            type: 'SUBMISSION_RECEIVED',
            recipientEmail: studentEmail,
            recipientName: studentName || undefined,
            subject: `Submission received: ${assignmentTitle}`,
            message: `Your submission for "${assignmentTitle}" has been received`,
            data: {
                assignmentTitle,
                courseTitle,
                submittedAt: submittedAt.toLocaleString()
            }
        })
    }
}

// Export singleton
export const notificationService = new NotificationService()
