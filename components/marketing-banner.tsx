"use client"

import Image from "next/image"
import { Card } from "@/components/ui/card"

interface MarketingBannerProps {
    className?: string
}

export function MarketingBanner({ className = "" }: MarketingBannerProps) {
    return (
        <div className={`w-full bg-gradient-to-r from-indigo-50 via-purple-50 to-blue-50 py-8 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 ${className}`}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <Card className="border-2 border-indigo-200 bg-white/80 p-6 shadow-xl backdrop-blur-sm dark:border-indigo-800 dark:bg-gray-900/80">
                    <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
                        {/* Logo Standard */}
                        <div className="animate-float relative h-20 w-full max-w-md sm:h-24">
                            <Image
                                src="/icons/logo-standard.png"
                                alt="ProfGenie Platform"
                                fill
                                style={{ objectFit: 'contain' }}
                                className="drop-shadow-lg"
                            />
                        </div>

                        {/* Marketing Text */}
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
                                Empowering Smart Learning
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                AI-powered tools for course design, discussion generation, and intelligent grading
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}
