import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"

// System settings keys
const SYSTEM_SETTINGS_KEYS = [
    "ENABLE_AI_GRADING",
    "ENABLE_LMS_INTEGRATIONS",
    "ENABLE_BULK_OPERATIONS",
    "ENABLE_EMAIL_NOTIFICATIONS"
]

export async function GET(request: NextRequest) {
    try {
        const session = await requireSession()
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        // Fetch all system settings
        const configs = await prisma.adminConfig.findMany({
            where: {
                key: { in: SYSTEM_SETTINGS_KEYS }
            }
        })

        // Convert to settings object with boolean values
        const settings: Record<string, boolean> = {}
        for (const key of SYSTEM_SETTINGS_KEYS) {
            const config = configs.find(c => c.key === key)
            settings[key] = config?.value === "true"
        }

        return NextResponse.json({ settings })
    } catch (error) {
        console.error('GET /api/admin/system-settings error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await requireSession()
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const { settings } = await request.json()

        if (!settings || typeof settings !== 'object') {
            return NextResponse.json({ error: "Settings object is required" }, { status: 400 })
        }

        // Upsert each setting
        const updates = await Promise.all(
            Object.entries(settings).map(async ([key, value]) => {
                if (!SYSTEM_SETTINGS_KEYS.includes(key)) {
                    return null // Skip unknown keys
                }

                return prisma.adminConfig.upsert({
                    where: { key },
                    update: {
                        value: String(value),
                        updatedAt: new Date(),
                        createdBy: session.user.id
                    },
                    create: {
                        key,
                        value: String(value),
                        description: getSettingDescription(key),
                        category: "SYSTEM",
                        isRequired: false,
                        createdBy: session.user.id
                    }
                })
            })
        )

        return NextResponse.json({
            success: true,
            message: "System settings saved successfully",
            updatedCount: updates.filter(Boolean).length
        })
    } catch (error) {
        console.error('POST /api/admin/system-settings error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

function getSettingDescription(key: string): string {
    const descriptions: Record<string, string> = {
        "ENABLE_AI_GRADING": "Enable AI feedback generation for all professors",
        "ENABLE_LMS_INTEGRATIONS": "Allow professors to connect external learning management systems",
        "ENABLE_BULK_OPERATIONS": "Enable mass student enrollment and batch grading",
        "ENABLE_EMAIL_NOTIFICATIONS": "Send automatic emails for grades, enrollments, and system updates"
    }
    return descriptions[key] || key
}
