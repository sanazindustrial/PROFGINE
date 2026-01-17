import { NextRequest, NextResponse } from "next/server"
import { requireSession } from "@/lib/auth"
import crypto from "crypto"
import fs from "fs"
import path from "path"

const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY || "default-encryption-key-change-in-production"
const FALLBACK_CONFIG_FILE = path.join(process.cwd(), '.admin-config-fallback.json')

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

// Fallback file storage for when database is unavailable
function loadFallbackConfig(): any[] {
    try {
        if (fs.existsSync(FALLBACK_CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(FALLBACK_CONFIG_FILE, 'utf-8'))
        }
    } catch (error) {
        console.warn('Error loading fallback config:', error)
    }
    return []
}

function saveFallbackConfig(configs: any[]) {
    try {
        fs.writeFileSync(FALLBACK_CONFIG_FILE, JSON.stringify(configs, null, 2))
    } catch (error) {
        console.warn('Error saving fallback config:', error)
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await requireSession()
        if (session.user.role !== "ADMIN") {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 })
        }

        // Try database first
        let configs: any[] = []
        let usingFallback = false

        try {
            const { prisma } = await import("@/lib/prisma")
            configs = await prisma.adminConfig.findMany({
                orderBy: { category: 'asc' }
            })
        } catch (dbError) {
            console.warn('Database unavailable, using fallback storage:', dbError)
            configs = loadFallbackConfig()
            usingFallback = true
        }

        // Decrypt values before returning (but mask sensitive keys)
        const decryptedConfigs = configs.map(config => ({
            ...config,
            value: config.value ?
                (config.key.includes('SECRET') || config.key.includes('KEY')) ?
                    decrypt(config.value).substring(0, 8) + '...' : // Show only first 8 chars for keys
                    decrypt(config.value) :
                null
        }))

        return NextResponse.json({ 
            configs: decryptedConfigs,
            usingFallback,
            message: usingFallback ? "Using file storage (database unavailable)" : "Using database storage"
        })
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

        const { key, value, description, category, isRequired } = await request.json()

        if (!key || !value) {
            return NextResponse.json({ error: "Key and value are required" }, { status: 400 })
        }

        const encryptedValue = encrypt(value)
        const configData = {
            id: crypto.randomUUID(),
            key,
            value: encryptedValue,
            description: description || null,
            category: category || 'GENERAL',
            isActive: true,
            isRequired: isRequired || false,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: session.user.id
        }

        // Try database first
        let savedConfig
        let usingFallback = false

        try {
            const { prisma } = await import("@/lib/prisma")
            savedConfig = await prisma.adminConfig.upsert({
                where: { key },
                update: {
                    value: encryptedValue,
                    description: description || null,
                    category: category || 'GENERAL',
                    isRequired: isRequired || false,
                    updatedAt: new Date()
                },
                create: configData
            })
        } catch (dbError) {
            console.warn('Database unavailable, using fallback storage:', dbError)
            
            // Use fallback file storage
            const configs = loadFallbackConfig()
            const existingIndex = configs.findIndex(c => c.key === key)
            
            if (existingIndex >= 0) {
                configs[existingIndex] = { ...configs[existingIndex], ...configData }
            } else {
                configs.push(configData)
            }
            
            saveFallbackConfig(configs)
            savedConfig = configData
            usingFallback = true
        }

        return NextResponse.json({ 
            config: {
                ...savedConfig,
                value: savedConfig.value ? savedConfig.value.substring(0, 8) + '...' : '' // Mask the encrypted value
            },
            usingFallback,
            message: usingFallback ? "Saved to file storage (database unavailable)" : "Saved to database"
        })
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

        // Try database first
        let usingFallback = false

        try {
            const { prisma } = await import("@/lib/prisma")
            await prisma.adminConfig.delete({
                where: { key }
            })
        } catch (dbError) {
            console.warn('Database unavailable, using fallback storage:', dbError)
            
            // Use fallback file storage
            const configs = loadFallbackConfig()
            const filteredConfigs = configs.filter(c => c.key !== key)
            saveFallbackConfig(filteredConfigs)
            usingFallback = true
        }

        return NextResponse.json({ 
            success: true,
            usingFallback,
            message: usingFallback ? "Deleted from file storage (database unavailable)" : "Deleted from database"
        })
    } catch (error) {
        console.error('DELETE /api/admin/config error:', error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}