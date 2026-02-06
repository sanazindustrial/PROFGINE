import Image from "next/image"
import Link from "next/link"

export function SiteFooter() {
    return (
        <footer className="border-t bg-gradient-to-br from-gray-50 to-gray-100 py-12 dark:from-gray-900 dark:to-gray-800">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-8 md:grid-cols-3">
                    {/* Logo 1 - Badge */}
                    <div className="flex flex-col items-center md:items-start">
                        <Link href="/" className="mb-4 block">
                            <div className="relative h-32 w-32 transition-transform hover:scale-105">
                                <Image
                                    src="/icons/logo-1.png"
                                    alt="ProfGenie Platform"
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    className="drop-shadow-lg"
                                />
                            </div>
                        </Link>
                        <p className="text-center text-sm text-muted-foreground md:text-left">
                            Empowering Smart Learning
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="flex flex-col items-center md:items-start">
                        <h3 className="mb-4 font-semibold text-foreground">Quick Links</h3>
                        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                            <Link href="/dashboard/course-design-studio" className="hover:text-foreground transition-colors">
                                Course Design Studio
                            </Link>
                            <Link href="/discussion" className="hover:text-foreground transition-colors">
                                Discussion Generator
                            </Link>
                            <Link href="/grade" className="hover:text-foreground transition-colors">
                                Grading Assistant
                            </Link>
                            <Link href="/help" className="hover:text-foreground transition-colors">
                                Help Center
                            </Link>
                        </div>
                    </div>

                    {/* Legal & Support */}
                    <div className="flex flex-col items-center md:items-start">
                        <h3 className="mb-4 font-semibold text-foreground">Resources</h3>
                        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
                            <a href="/docs" className="hover:text-foreground transition-colors">
                                Documentation
                            </a>
                            <a href="/privacy" className="hover:text-foreground transition-colors">
                                Privacy Policy
                            </a>
                            <a href="/terms" className="hover:text-foreground transition-colors">
                                Terms of Service
                            </a>
                            <a href="/contact" className="hover:text-foreground transition-colors">
                                Contact Us
                            </a>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="mt-12 border-t pt-8 text-center text-sm text-muted-foreground">
                    <p>Copyright © 2026 ProfGenie Platform. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}
