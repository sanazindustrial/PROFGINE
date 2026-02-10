import crypto from 'crypto'

// Encryption key from environment or generate a secure default
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_SECRET || process.env.NEXTAUTH_SECRET || 'default-encryption-key-change-in-production'

// Use a consistent 32-byte key for AES-256
function getKey(): Uint8Array {
    const hash = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest()
    return new Uint8Array(hash)
}

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16

/**
 * Encrypt a string (like an API key) for secure storage
 */
export function encrypt(text: string): string {
    if (!text) return ''

    const ivBuffer = crypto.randomBytes(IV_LENGTH)
    const iv = new Uint8Array(ivBuffer)
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = new Uint8Array(cipher.getAuthTag())

    // Combine iv + authTag + encrypted data
    return Buffer.from(iv).toString('hex') + ':' + Buffer.from(authTag).toString('hex') + ':' + encrypted
}

/**
 * Decrypt an encrypted string
 */
export function decrypt(encryptedText: string): string {
    if (!encryptedText) return ''

    try {
        const parts = encryptedText.split(':')
        if (parts.length !== 3) {
            throw new Error('Invalid encrypted format')
        }

        const iv = new Uint8Array(Buffer.from(parts[0], 'hex'))
        const authTag = new Uint8Array(Buffer.from(parts[1], 'hex'))
        const encrypted = parts[2]

        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv)
        decipher.setAuthTag(authTag)

        let decrypted = decipher.update(encrypted, 'hex', 'utf8')
        decrypted += decipher.final('utf8')

        return decrypted
    } catch (error) {
        console.error('Decryption failed:', error)
        return ''
    }
}

/**
 * Mask an API key for display (show first 4 and last 4 characters)
 */
export function maskApiKey(key: string): string {
    if (!key || key.length < 12) return '••••••••'
    return key.slice(0, 4) + '••••••••' + key.slice(-4)
}

/**
 * Validate that a string looks like a valid API key format
 */
export function isValidApiKeyFormat(key: string, provider: string): boolean {
    if (!key || key.length < 10) return false

    switch (provider) {
        case 'openai':
            return key.startsWith('sk-') && key.length >= 40
        case 'anthropic':
            return key.startsWith('sk-ant-') && key.length >= 40
        case 'gemini':
            return key.length >= 30
        case 'groq':
            return key.startsWith('gsk_') && key.length >= 40
        case 'perplexity':
            return key.startsWith('pplx-') && key.length >= 40
        case 'cohere':
            return key.length >= 30
        case 'huggingface':
            return key.startsWith('hf_') && key.length >= 30
        default:
            return key.length >= 10
    }
}
