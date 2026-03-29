import Link from "next/link"
import {
    Shield,
    ShieldCheck,
    Scale,
    FileCheck,
    BookOpen,
    CreditCard,
    AlertTriangle,
    UserCheck,
    Lock,
    Globe,
    Clock,
    Mail,
    CheckCircle2,
    Accessibility,
    Server,
    Eye,
} from "lucide-react"

export const metadata = {
    title: "Terms of Service | ProfGENIE",
    description:
        "Terms of Service for ProfGENIE — the AI-powered education platform for professors.",
}

/* ── Compliance badge row (matches privacy page) ─────────── */
const complianceBadges = [
    { name: "FERPA", icon: BookOpen, color: "text-blue-400" },
    { name: "COPPA", icon: UserCheck, color: "text-green-400" },
    { name: "ADA §508", icon: Accessibility, color: "text-purple-400" },
    { name: "DMCA", icon: FileCheck, color: "text-orange-400" },
]

/* ── Section data ────────────────────────────────────────── */
const sections = [
    {
        id: "acceptance",
        icon: ShieldCheck,
        title: "1. Acceptance of Terms",
        content: [
            'By accessing or using ProfGENIE ("the Platform"), operated by Versora Business LLC ("we", "us", "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, you must not use the Platform.',
            "These Terms apply to all users, including professors, administrators, students, and any individual granted access through an invitation or institutional arrangement.",
            "We reserve the right to update these Terms at any time. Continued use of the Platform after changes are posted constitutes acceptance of the updated Terms. Material changes will be communicated via email or in-app notification at least 30 days in advance.",
        ],
    },
    {
        id: "description",
        icon: Globe,
        title: "2. Platform Description",
        content: [
            "ProfGENIE is an AI-powered education platform designed to help professors generate discussion responses, provide assignment feedback, build course syllabi, create rubrics, and manage coursework through an integrated Learning Management System (LMS).",
            "The Platform provides AI-assisted tools using multiple providers (including OpenAI, Anthropic, Google Gemini, and others) with automatic fallback to ensure service continuity. AI-generated content is advisory and must be reviewed by the instructor before publication.",
            "Features include course design studio, assignment management, AI grading engine, student enrollment, discussion forums, presentation generation, rubric builder, and analytics dashboards.",
        ],
    },
    {
        id: "accounts",
        icon: UserCheck,
        title: "3. User Accounts & Authentication",
        content: [
            "Access to ProfGENIE requires authentication via Google OAuth. By signing in, you authorize us to receive your name, email address, and profile image from Google for account creation and session management.",
            "Account eligibility is determined by email domain (institutional .edu addresses) or explicit invitation. Student accounts are invitation-only. Professors and administrators may register with approved institutional emails.",
            "You are responsible for all activity under your account. You must not share your credentials, allow unauthorized access, or use another person's account. If you suspect unauthorized access, contact us immediately.",
            "We enforce role-based access control (ADMIN, PROFESSOR, STUDENT). Platform owners receive elevated privileges. Role assignments are determined at sign-up and may be modified by administrators.",
        ],
    },
    {
        id: "subscriptions",
        icon: CreditCard,
        title: "4. Subscriptions, Credits & Billing",
        content: [
            "ProfGENIE offers tiered subscription plans: Free Trial, Basic, Premium, and Enterprise. Each tier grants different feature access, usage limits, and credit allocations as described on our pricing page.",
            "AI-powered features consume credits. Credit costs are configurable by administrators and vary by feature (AI grading, content generation, plagiarism detection, etc.). Your remaining credits are displayed in your dashboard.",
            "Paid subscriptions are processed through Stripe. By subscribing, you agree to Stripe's Terms of Service. Subscription fees are billed in advance on a recurring basis. You may cancel at any time, and access continues until the end of the current billing period.",
            "Free Trial accounts include limited credits and feature access. Trial periods are non-renewable. Unused trial credits do not carry over. We reserve the right to modify pricing, credit costs, and plan features with 30 days' notice.",
            "Refunds are handled on a case-by-case basis. Contact support@profgenie.ai for billing disputes.",
        ],
    },
    {
        id: "acceptable-use",
        icon: Shield,
        title: "5. Acceptable Use Policy",
        content: [
            "You agree to use ProfGENIE only for lawful educational purposes. You must not:",
        ],
        list: [
            "Upload malicious files, malware, or content that exploits platform vulnerabilities",
            "Attempt to access another user's data, courses, or account without authorization",
            "Use AI-generated content to facilitate academic dishonesty or plagiarism",
            "Submit content that is defamatory, obscene, discriminatory, or violates any law",
            "Reverse-engineer, decompile, or attempt to extract source code from the Platform",
            "Use automated bots, scrapers, or tools to access the Platform without written consent",
            "Circumvent rate limits, credit systems, or feature restrictions",
            "Resell, redistribute, or sublicense access to the Platform or its AI outputs",
        ],
        extraContent: [
            "Violation of this policy may result in immediate suspension or termination of your account without refund.",
        ],
    },
    {
        id: "intellectual-property",
        icon: Scale,
        title: "6. Intellectual Property & Content Ownership",
        content: [
            "You retain full ownership of all content you upload or create on ProfGENIE, including course materials, assignments, rubrics, syllabi, and discussion prompts.",
            "AI-generated content (feedback, grading suggestions, discussion responses, lecture notes) is provided as a tool output. You are responsible for reviewing, editing, and approving all AI-generated content before use. We do not claim ownership of AI outputs generated in response to your prompts.",
            "The Platform itself — including its design, code, logos, trademarks, and documentation — is the exclusive property of Versora Business LLC and is protected by copyright and intellectual property laws.",
            "By uploading content, you grant ProfGENIE a limited, non-exclusive license to process, store, and display your content solely for the purpose of providing the Platform's services. This license terminates when you delete your content or account.",
        ],
    },
    {
        id: "data-privacy",
        icon: Lock,
        title: "7. Data Privacy & FERPA Compliance",
        content: [
            "ProfGENIE is designed to comply with the Family Educational Rights and Privacy Act (FERPA) and the Children's Online Privacy Protection Act (COPPA).",
            "We process personal data only as necessary to provide educational services. Student education records are treated as confidential and are never shared with third parties without consent or legal requirement.",
            "All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Sessions are limited to 8 hours with automatic expiration. We implement role-based access control to ensure users can only access their own data.",
            "AI providers process prompts in real-time and do not retain your data for model training. We select providers that offer zero-data-retention agreements for educational content.",
            "For complete details on data collection, processing, and your rights, please review our Privacy Policy.",
        ],
        link: { href: "/privacy", label: "Read our full Privacy Policy →" },
    },
    {
        id: "ai-disclosure",
        icon: Eye,
        title: "8. AI Usage Disclosure & Limitations",
        content: [
            "ProfGENIE uses artificial intelligence to assist with educational tasks including grading, feedback generation, content creation, and course design. AI outputs are probabilistic and may contain errors, biases, or inaccuracies.",
            "All AI-generated content is clearly labeled and requires human review before publication. Professors maintain full control over grading decisions, feedback delivery, and course content. AI suggestions do not constitute final academic judgments.",
            "We employ multiple AI providers with automatic fallback mechanisms. If all providers are unavailable, the system falls back to a mock provider with limited functionality. Provider availability is monitored and logged.",
            "You acknowledge that AI technology has inherent limitations and that ProfGENIE does not guarantee the accuracy, completeness, or fitness for purpose of any AI-generated content.",
        ],
    },
    {
        id: "availability",
        icon: Server,
        title: "9. Service Availability & Modifications",
        content: [
            "We strive to maintain 99.9% uptime but do not guarantee uninterrupted service. The Platform may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control.",
            "We reserve the right to modify, suspend, or discontinue any feature or service at any time. Material changes affecting paid subscribers will be communicated at least 30 days in advance.",
            "We perform regular backups and maintain disaster recovery procedures. However, you are responsible for maintaining your own copies of critical course materials.",
        ],
    },
    {
        id: "termination",
        icon: AlertTriangle,
        title: "10. Account Termination",
        content: [
            "You may request account deletion at any time through your Profile settings or by contacting support@profgenie.ai. Upon deletion, all personal data will be permanently removed within 30 days, subject to legal retention requirements.",
            "We may suspend or terminate your account for violation of these Terms, non-payment, extended inactivity (12+ months), or at our discretion with reasonable notice. Institutional accounts may be terminated at the institution's request.",
            "Upon termination, your right to access the Platform ceases immediately. You may request a data export before account deletion. Certain anonymized usage data may be retained for analytics purposes.",
        ],
    },
    {
        id: "liability",
        icon: ShieldCheck,
        title: "11. Limitation of Liability",
        content: [
            'THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.',
            "IN NO EVENT SHALL VERSORA BUSINESS LLC, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM.",
            "OUR TOTAL LIABILITY FOR ANY CLAIM ARISING FROM THESE TERMS SHALL NOT EXCEED THE AMOUNT YOU PAID FOR THE PLATFORM IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.",
            "You agree to indemnify and hold harmless Versora Business LLC from any claims, damages, or expenses arising from your use of the Platform, your content, or your violation of these Terms.",
        ],
    },
    {
        id: "governing-law",
        icon: Scale,
        title: "12. Governing Law & Dispute Resolution",
        content: [
            "These Terms are governed by the laws of the State of California, United States, without regard to conflict of law provisions.",
            "Any dispute arising from these Terms shall first be resolved through good-faith negotiation. If negotiation fails, disputes shall be submitted to binding arbitration under the American Arbitration Association (AAA) rules in Los Angeles County, California.",
            "You agree to waive any right to participate in class-action lawsuits or class-wide arbitration. Small claims court actions are exempt from the arbitration requirement.",
        ],
    },
    {
        id: "contact",
        icon: Mail,
        title: "13. Contact Information",
        content: ["For questions about these Terms, contact us at:"],
        contactInfo: {
            company: "Versora Business LLC",
            email: "support@profgenie.ai",
            website: "https://profgenie.ai",
            address: "Los Angeles, California, United States",
        },
    },
]

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-gray-100">
            {/* ── Hero Banner ─────────────────────────────────────── */}
            <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-r from-blue-950 via-slate-900 to-purple-950 px-6 py-20 text-center">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.15),transparent_50%)]" />
                <div className="relative mx-auto max-w-4xl">
                    <div className="mb-6 flex items-center justify-center gap-3">
                        <Scale className="size-10 text-blue-400" />
                        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                            Terms of Service
                        </h1>
                    </div>
                    <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
                        The legal agreement governing your use of ProfGENIE — the
                        AI-powered education platform for professors.
                    </p>
                    <p className="mt-4 text-sm text-gray-400">
                        Effective Date: January 1, 2025 &nbsp;|&nbsp; Last Updated:{" "}
                        {new Date().toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                        })}
                    </p>

                    {/* Compliance badges row */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                        {complianceBadges.map((b) => (
                            <div
                                key={b.name}
                                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium backdrop-blur-sm"
                            >
                                <b.icon className={`size-4 ${b.color}`} />
                                <span className="text-gray-200">{b.name}</span>
                                <CheckCircle2 className="size-3.5 text-green-400" />
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Table of contents ──────────────────────────────── */}
            <nav className="mx-auto max-w-4xl px-6 py-10">
                <h2 className="mb-4 text-lg font-semibold text-gray-300">
                    Table of Contents
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                    {sections.map((s) => (
                        <a
                            key={s.id}
                            href={`#${s.id}`}
                            className="group flex items-center gap-2 rounded-lg border border-white/5 bg-white/[.02] px-4 py-2.5 text-sm text-gray-400 transition hover:border-blue-500/30 hover:bg-white/[.04] hover:text-blue-300"
                        >
                            <s.icon className="size-4 shrink-0 text-blue-400/70 transition group-hover:text-blue-400" />
                            {s.title}
                        </a>
                    ))}
                </div>
            </nav>

            {/* ── Sections ───────────────────────────────────────── */}
            <div className="mx-auto max-w-4xl space-y-12 px-6 pb-20">
                {sections.map((s) => (
                    <section
                        key={s.id}
                        id={s.id}
                        className="scroll-mt-24 rounded-xl border border-white/10 bg-white/[.02] p-8 backdrop-blur-sm"
                    >
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
                                <s.icon className="size-5 text-blue-400" />
                            </div>
                            <h2 className="text-xl font-semibold text-white">{s.title}</h2>
                        </div>

                        <div className="space-y-4 text-gray-300 leading-relaxed">
                            {s.content.map((p, i) => (
                                <p key={i}>{p}</p>
                            ))}

                            {s.list && (
                                <ul className="ml-4 space-y-2 list-none">
                                    {s.list.map((item, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-blue-400" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {s.extraContent?.map((p, i) => (
                                <p key={`extra-${i}`} className="font-medium text-yellow-300/90">
                                    {p}
                                </p>
                            ))}

                            {s.link && (
                                <Link
                                    href={s.link.href}
                                    className="mt-2 inline-flex items-center gap-1 text-blue-400 transition hover:text-blue-300 hover:underline"
                                >
                                    {s.link.label}
                                </Link>
                            )}

                            {s.contactInfo && (
                                <div className="mt-4 rounded-lg border border-white/10 bg-white/[.03] p-6 space-y-2 text-sm">
                                    <p className="font-semibold text-white">
                                        {s.contactInfo.company}
                                    </p>
                                    <p>
                                        Email:{" "}
                                        <a
                                            href={`mailto:${s.contactInfo.email}`}
                                            className="text-blue-400 hover:underline"
                                        >
                                            {s.contactInfo.email}
                                        </a>
                                    </p>
                                    <p>
                                        Web:{" "}
                                        <a
                                            href={s.contactInfo.website}
                                            className="text-blue-400 hover:underline"
                                        >
                                            {s.contactInfo.website}
                                        </a>
                                    </p>
                                    <p>{s.contactInfo.address}</p>
                                </div>
                            )}
                        </div>
                    </section>
                ))}

                {/* ── Footer note ────────────────────────────────── */}
                <div className="rounded-xl border border-white/10 bg-gradient-to-r from-blue-950/40 to-purple-950/40 p-8 text-center">
                    <Clock className="mx-auto mb-3 size-6 text-blue-400" />
                    <p className="text-sm text-gray-400">
                        These Terms were last reviewed on{" "}
                        {new Date().toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                        })}
                        . For the latest version, visit this page or contact{" "}
                        <a
                            href="mailto:support@profgenie.ai"
                            className="text-blue-400 hover:underline"
                        >
                            support@profgenie.ai
                        </a>
                        .
                    </p>
                    <div className="mt-4 flex justify-center gap-4">
                        <Link
                            href="/privacy"
                            className="text-sm text-blue-400 hover:underline"
                        >
                            Privacy Policy
                        </Link>
                        <Link
                            href="/contact"
                            className="text-sm text-blue-400 hover:underline"
                        >
                            Contact Us
                        </Link>
                        <Link
                            href="/dashboard"
                            className="text-sm text-blue-400 hover:underline"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    )
}
