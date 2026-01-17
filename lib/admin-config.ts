import { prisma } from "@/lib/prisma"
import crypto from "crypto"

const ENCRYPTION_KEY = process.env.CONFIG_ENCRYPTION_KEY || "default-encryption-key-change-in-production"

function encrypt(text: string): string {
    const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
}

export async function initializeAdminConfigs() {
    console.log("🔧 Initializing admin configurations...")

    const configTemplates = [
        // AI Services
        { key: "OPENAI_API_KEY", category: "AI", description: "OpenAI API key for GPT models", isRequired: true },
        { key: "ANTHROPIC_API_KEY", category: "AI", description: "Anthropic API key for Claude models", isRequired: false },
        { key: "GEMINI_API_KEY", category: "AI", description: "Google Gemini API key", isRequired: false },
        { key: "GROQ_API_KEY", category: "AI", description: "Groq API key for fast inference", isRequired: false },
        { key: "PERPLEXITY_API_KEY", category: "AI", description: "Perplexity API key", isRequired: false },
        { key: "COHERE_API_KEY", category: "AI", description: "Cohere API key", isRequired: false },
        { key: "HUGGINGFACE_API_KEY", category: "AI", description: "HuggingFace API key", isRequired: false },

        // OAuth
        { key: "GOOGLE_CLIENT_ID", category: "OAUTH", description: "Google OAuth Client ID", isRequired: true },
        { key: "GOOGLE_CLIENT_SECRET", category: "OAUTH", description: "Google OAuth Client Secret", isRequired: true },
        { key: "NEXTAUTH_SECRET", category: "OAUTH", description: "NextAuth secret for JWT encryption", isRequired: true },
        { key: "NEXTAUTH_URL", category: "OAUTH", description: "NextAuth base URL", isRequired: true },

        // Stripe
        { key: "STRIPE_PUBLISHABLE_KEY", category: "STRIPE", description: "Stripe publishable key", isRequired: true },
        { key: "STRIPE_SECRET_KEY", category: "STRIPE", description: "Stripe secret key", isRequired: true },
        { key: "STRIPE_WEBHOOK_SECRET", category: "STRIPE", description: "Stripe webhook endpoint secret", isRequired: true },
    ]

    let initialized = 0
    let updated = 0

    for (const template of configTemplates) {
        try {
            const envValue = process.env[template.key]
            const encryptedValue = envValue && !envValue.includes("REPLACE") ? encrypt(envValue) : null

            const existing = await prisma.adminConfig.findUnique({
                where: { key: template.key }
            })

            if (existing) {
                // Update description and category if they've changed
                await prisma.adminConfig.update({
                    where: { key: template.key },
                    data: {
                        description: template.description,
                        category: template.category,
                        isRequired: template.isRequired,
                        // Only update value if we have a new one and it's not a placeholder
                        ...(encryptedValue && { value: encryptedValue })
                    }
                })
                updated++
            } else {
                // Create new config
                await prisma.adminConfig.create({
                    data: {
                        key: template.key,
                        value: encryptedValue,
                        description: template.description,
                        category: template.category,
                        isRequired: template.isRequired,
                        isActive: true
                    }
                })
                initialized++
            }
        } catch (error) {
            console.error(`Failed to initialize config ${template.key}:`, error)
        }
    }

    console.log(`✅ Admin configs initialized: ${initialized} created, ${updated} updated`)
}

export async function initializeHealthChecks() {
    console.log("🏥 Initializing health checks...")

    const services = [
        "openai",
        "anthropic",
        "gemini",
        "groq",
        "perplexity",
        "cohere",
        "huggingface",
        "stripe",
        "google"
    ]

    for (const service of services) {
        try {
            await prisma.systemHealth.upsert({
                where: { service },
                update: {},
                create: {
                    service,
                    status: "not_configured"
                }
            })
        } catch (error) {
            console.error(`Failed to initialize health check for ${service}:`, error)
        }
    }

    console.log(`✅ Health checks initialized for ${services.length} services`)
}

// Function to run both initializations
export async function initializeAdminSystem() {
    try {
        await initializeAdminConfigs()
        await initializeHealthChecks()
        console.log("🎉 Admin system initialization complete")
    } catch (error) {
        console.error("❌ Admin system initialization failed:", error)
    }
}

// Helper function to get decrypted config value
export async function getConfigValue(key: string): Promise<string | null> {
    try {
        const config = await prisma.adminConfig.findUnique({
            where: { key, isActive: true }
        })

        if (!config?.value) {
            return process.env[key] || null
        }

        // Try to decrypt
        try {
            const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
            let decrypted = decipher.update(config.value, 'hex', 'utf8')
            decrypted += decipher.final('utf8')
            return decrypted
        } catch {
            return config.value // Return as-is if decryption fails
        }
    } catch (error) {
        console.error(`Failed to get config value for ${key}:`, error)
        return process.env[key] || null
    }
}

// Helper function to update environment from database
export async function syncEnvironmentFromDatabase() {
    try {
        const configs = await prisma.adminConfig.findMany({
            where: { isActive: true, value: { not: null } }
        })

        for (const config of configs) {
            if (config.value) {
                try {
                    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY)
                    let decrypted = decipher.update(config.value, 'hex', 'utf8')
                    decrypted += decipher.final('utf8')
                    process.env[config.key] = decrypted
                } catch {
                    process.env[config.key] = config.value
                }
            }
        }

        console.log(`✅ Environment synced from database (${configs.length} configs)`)
    } catch (error) {
        console.error("❌ Failed to sync environment from database:", error)
    }
}