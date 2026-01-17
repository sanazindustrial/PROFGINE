import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import crypto from "crypto"

const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY || "default-encryption-key-change-in-production"

function encrypt(text: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
}

function decrypt(encryptedText: string): string {
    try {
        const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
        let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        return decrypted
    } catch (error) {
        return encryptedText // Return as-is if decryption fails (backwards compatibility)
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await requireSession()
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const configs = await prisma.adminConfig.findMany({
            orderBy: { category: 'asc' }
        })

        // Decrypt values before returning (but mask sensitive keys)
        const decryptedConfigs = configs.map(config => ({
            ...config,
            value: config.value ?
                (config.key.includes('SECRET') || config.key.includes('KEY')) ?
                    decrypt(config.value).substring(0, 8) + '...' : // Show only first 8 chars for keys
                    decrypt(config.value) :
                null
        }))

        return NextResponse.json({ configs: decryptedConfigs })
    } catch (error) {
        console.error('GET /api/admin/config error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await requireSession()
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const { key, value, category, description, isRequired = false } = await request.json()

        if (!key || !category) {
            return NextResponse.json({ error: "Key and category are required" }, { status: 400 })
        }

        const encryptedValue = value ? encrypt(value) : null

        const config = await prisma.adminConfig.upsert({
            where: { key },
            update: {
                value: encryptedValue,
                description,
                category,
                isRequired,
                updatedAt: new Date(),
                createdBy: session.user.id
            },
            create: {
                key,
                value: encryptedValue,
                description,
                category,
                isRequired,
                createdBy: session.user.id
            }
        })

        // Update environment variable for immediate use
        if (value) {
            process.env[key] = value
        }

        return NextResponse.json({ config: { ...config, value: null } }) // Don't return the actual value
    } catch (error) {
        console.error('POST /api/admin/config error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await requireSession()
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const key = searchParams.get('key')

        if (!key) {
            return NextResponse.json({ error: "Key is required" }, { status: 400 })
        }

        await prisma.adminConfig.delete({
            where: { key }
        })

        // Remove from environment
        delete process.env[key]

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/admin/config error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}