import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireSession } from "@/lib/auth"
import crypto from "crypto"

function getEncryptionKey(): Uint8Array {
    const key = process.env.CONFIG_ENCRYPTION_KEY
    if (!key || key.length < 32) {
        throw new Error("CONFIG_ENCRYPTION_KEY must be set and at least 32 characters")
    }
    return new Uint8Array(crypto.scryptSync(key, "profgenie-config-salt", 32))
}

function encrypt(text: string): string {
    const key = getEncryptionKey()
    const iv = new Uint8Array(crypto.randomBytes(16))
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")
    const authTag = cipher.getAuthTag().toString("hex")
    return Buffer.from(iv).toString("hex") + ":" + authTag + ":" + encrypted
}

function decrypt(encryptedText: string): string {
    try {
        const parts = encryptedText.split(":")
        if (parts.length !== 3) {
            return encryptedText // Legacy unencrypted value — backwards compat
        }
        const key = getEncryptionKey()
        const iv = new Uint8Array(Buffer.from(parts[0], "hex"))
        const authTag = new Uint8Array(Buffer.from(parts[1], "hex"))
        const encrypted = parts[2]
        const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
        decipher.setAuthTag(authTag)
        let decrypted = decipher.update(encrypted, "hex", "utf8")
        decrypted += decipher.final("utf8")
        return decrypted
    } catch (error) {
        return "[decryption failed]"
    }
}

// Allowlist of config keys that may be stored
const ALLOWED_CONFIG_KEYS = new Set([
    "OPENAI_API_KEY", "ANTHROPIC_API_KEY", "GEMINI_API_KEY", "GROQ_API_KEY",
    "PERPLEXITY_API_KEY", "COHERE_API_KEY", "HUGGINGFACE_API_KEY",
    "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD",
    "STRIPE_SECRET_KEY", "STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET",
    "AI_PREFERRED_PROVIDER", "AI_FALLBACK_ENABLED", "MAX_TOKENS_PER_REQUEST",
    "PLATFORM_NAME", "SUPPORT_EMAIL",
])

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

        // Validate key against allowlist — prevent arbitrary env var writes
        if (!ALLOWED_CONFIG_KEYS.has(key)) {
            return NextResponse.json({ error: "Configuration key not allowed" }, { status: 400 })
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

        // Config values are read from DB at runtime — no process.env mutation

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

        if (!ALLOWED_CONFIG_KEYS.has(key)) {
            return NextResponse.json({ error: "Configuration key not allowed" }, { status: 400 })
        }

        await prisma.adminConfig.delete({
            where: { key }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('DELETE /api/admin/config error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}