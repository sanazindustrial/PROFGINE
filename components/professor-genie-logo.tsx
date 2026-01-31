// Professor GENIE Logo Component
// This component handles different logo variations for the platform

import Image from 'next/image'

interface LogoProps {
    variant?: 'icon' | 'text' | 'badge'
    className?: string
    width?: number
    height?: number
}

export function ProfessorGenieLogo({
    variant = 'icon',
    className = '',
    width,
    height
}: LogoProps) {
    // Icon variant - lamp with graduation cap
    if (variant === 'icon') {
        return (
            <div className={className} style={{ width: width || '100%', height: height || '100%', position: 'relative' }}>
                <Image
                    src="/logos/genie-icon.png"
                    alt="Professor GENIE"
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                />
            </div>
        )
    }

    // Text variant - stylized text logo
    if (variant === 'text') {
        return (
            <div className={className} style={{ width: width || '100%', height: height || '100%', position: 'relative' }}>
                <Image
                    src="/logos/genie-text.png"
                    alt="Professor GENIE Platform"
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                />
            </div>
        )
    }

    // Badge variant - circular badge with full branding
    if (variant === 'badge') {
        return (
            <div className={className} style={{ width: width || '100%', height: height || '100%', position: 'relative' }}>
                <Image
                    src="/logos/genie-badge.png"
                    alt="Professor GENIE Platform - Empowering Smart Learning"
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                />
            </div>
        )
    }

    return null
}
