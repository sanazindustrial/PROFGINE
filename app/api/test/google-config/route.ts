import { NextResponse } from 'next/server'
import { googleCloudConfig, chromeExtensionConfig } from '@/lib/config/services'

export async function GET() {
    try {
        // Return sanitized config to verify environment variables are loaded
        const config = {
            googleCloud: {
                hasApiKey: !!googleCloudConfig.apiKey,
                apiKeyPrefix: googleCloudConfig.apiKey ? googleCloudConfig.apiKey.substring(0, 10) + '...' : 'NOT SET',
                serviceAccount: googleCloudConfig.serviceAccountEmail,
                projectId: googleCloudConfig.projectId,
            },
            chromeExtension: {
                extensionId: chromeExtensionConfig.extensionId,
                clientName: chromeExtensionConfig.clientName,
                hasOAuthClientId: !!chromeExtensionConfig.oauthClientId,
                oauthClientIdPrefix: chromeExtensionConfig.oauthClientId
                    ? chromeExtensionConfig.oauthClientId.substring(0, 15) + '...'
                    : 'NOT SET',
                allowedOriginsCount: chromeExtensionConfig.allowedOrigins.length
            },
            timestamp: new Date().toISOString()
        }

        return NextResponse.json({
            message: 'Configuration loaded successfully',
            config
        })
    } catch (error) {
        console.error('Error loading configuration:', error)
        return NextResponse.json(
            { error: 'Failed to load configuration' },
            { status: 500 }
        )
    }
}