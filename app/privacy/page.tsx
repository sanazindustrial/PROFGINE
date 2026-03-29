import Link from "next/link"
import {
    Shield,
    ShieldCheck,
    Lock,
    Eye,
    EyeOff,
    FileCheck,
    UserCheck,
    Server,
    Key,
    MonitorSmartphone,
    ShieldOff,
    Fingerprint,
    Database,
    Clock,
    Trash2,
    CheckCircle2,
    Scale,
    Accessibility,
    BookOpen,
    Globe,
} from "lucide-react"

/* ── Compliance badge data ─────────────────────────────────── */
const complianceBadges = [
    {
        name: "FERPA",
        full: "Family Educational Rights and Privacy Act",
        icon: BookOpen,
        color: "bg-blue-600",
        description:
            "Student education records are protected. Only authorized instructors access their own students\u2019 data.",
    },
    {
        name: "COPPA",
        full: "Children\u2019s Online Privacy Protection Act",
        icon: UserCheck,
        color: "bg-green-600",
        description:
            "Platform is designed for higher-education users 18+. No data is knowingly collected from children under 13.",
    },
    {
        name: "SOC 2",
        full: "Service Organization Control 2",
        icon: ShieldCheck,
        color: "bg-purple-600",
        description:
            "Infrastructure follows SOC 2 Trust Service Criteria for security, availability, and confidentiality.",
    },
    {
        name: "ADA §508",
        full: "ADA Section 508 / WCAG 2.1 AA",
        icon: Accessibility,
        color: "bg-orange-500",
        description:
            "Platform meets accessibility standards so all users, including those with disabilities, can participate fully.",
    },
    {
        name: "NIST 800-171",
        full: "NIST SP 800-171 CUI Protection",
        icon: Server,
        color: "bg-red-600",
        description:
            "Controls aligned with NIST 800-171 for protecting Controlled Unclassified Information in non-federal systems.",
    },
    {
        name: "DMCA",
        full: "Digital Millennium Copyright Act",
        icon: FileCheck,
        color: "bg-yellow-600",
        description:
            "Copyright-protected content is safeguarded. We respond to valid DMCA takedown requests promptly.",
    },
    {
        name: "Google API",
        full: "Google API Services User Data Policy",
        icon: Globe,
        color: "bg-sky-600",
        description:
            "Compliant with Google\u2019s Limited Use requirements. OAuth data is used solely for authentication, never sold or shared.",
    },
]

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            {/* ── Hero ───────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 px-4 py-16 text-white">
                <div className="container mx-auto max-w-5xl text-center">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                        <Shield className="size-4" />
                        Enterprise-Grade Privacy &amp; Security
                    </div>
                    <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
                        Privacy Policy &amp; Compliance
                    </h1>
                    <p className="mx-auto max-w-2xl text-lg text-blue-100">
                        ProfGenie is built for education. We protect student data, instructor
                        content, and institutional trust with industry-leading security
                        standards.
                    </p>
                    <p className="mt-3 text-sm text-blue-200">Last updated: March 29, 2026</p>
                </div>
            </div>

            <div className="container mx-auto max-w-5xl px-4 py-12">
                {/* ── Compliance Badges ────────────────────────── */}
                <section className="mb-14">
                    <h2 className="mb-2 text-center text-2xl font-bold text-gray-900">
                        Regulatory &amp; Industry Compliance
                    </h2>
                    <p className="mb-8 text-center text-sm text-gray-500">
                        ProfGenie aligns with the following frameworks to protect your data
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {complianceBadges.map((badge) => (
                            <div
                                key={badge.name}
                                className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md"
                            >
                                <div className="mb-3 flex items-center gap-3">
                                    <span
                                        className={`inline-flex size-10 items-center justify-center rounded-lg text-white ${badge.color}`}
                                    >
                                        <badge.icon className="size-5" />
                                    </span>
                                    <div>
                                        <span className="block text-sm font-bold text-gray-900">
                                            {badge.name}
                                        </span>
                                        <span className="block text-[11px] leading-tight text-gray-400">
                                            {badge.full}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-xs leading-relaxed text-gray-600">
                                    {badge.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── Advanced Client Security ────────────────── */}
                <section className="mb-14 overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-blue-50">
                    <div className="px-6 py-8 sm:px-10">
                        <div className="mb-6 flex items-center gap-3">
                            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-white">
                                <Lock className="size-6" />
                            </span>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Advanced Client Security
                                </h2>
                                <p className="text-sm text-gray-500">
                                    In-browser protections active on every page
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {[
                                {
                                    icon: ShieldOff,
                                    title: "Source Code Protection",
                                    text: "Right-click, View Source, and developer-tool shortcuts are disabled to prevent content scraping.",
                                },
                                {
                                    icon: EyeOff,
                                    title: "Copy / Paste Blocked",
                                    text: "Clipboard operations are restricted outside input fields to protect proprietary course content.",
                                },
                                {
                                    icon: MonitorSmartphone,
                                    title: "DevTools Detection",
                                    text: "F12, Ctrl+Shift+I/J/C keyboard shortcuts are intercepted to deter unauthorized inspection.",
                                },
                                {
                                    icon: Fingerprint,
                                    title: "Anti-Print Shield",
                                    text: "Print and Save-Page shortcuts are blocked, and print stylesheets are suppressed in protected views.",
                                },
                                {
                                    icon: Shield,
                                    title: "Security Headers",
                                    text: "CSP, HSTS (preload), X-Frame-Options DENY, and strict Referrer-Policy headers on every response.",
                                },
                                {
                                    icon: Clock,
                                    title: "Session Expiry",
                                    text: "Authenticated sessions auto-expire after 8 hours to minimize risk from unattended devices.",
                                },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="flex gap-3 rounded-lg bg-white/70 p-4 backdrop-blur-sm"
                                >
                                    <item.icon className="mt-0.5 size-5 shrink-0 text-indigo-600" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            {item.title}
                                        </h3>
                                        <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
                                            {item.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Data Control Features ────────────────────── */}
                <section className="mb-14 overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50">
                    <div className="px-6 py-8 sm:px-10">
                        <div className="mb-6 flex items-center gap-3">
                            <span className="inline-flex size-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                                <Database className="size-6" />
                            </span>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    Data Control &amp; Ownership
                                </h2>
                                <p className="text-sm text-gray-500">
                                    You own your data — here&apos;s how we enforce it
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            {[
                                {
                                    icon: Eye,
                                    title: "Strict Data Isolation",
                                    text: "Every professor sees only their own courses, students, and content. No cross-account data leakage — ever.",
                                },
                                {
                                    icon: Key,
                                    title: "Role-Based Access Control",
                                    text: "Admin, Professor, and Student roles enforce least-privilege access at every API endpoint.",
                                },
                                {
                                    icon: Trash2,
                                    title: "Right to Deletion",
                                    text: "Request full account and data deletion at any time. We honor deletion requests within 30 days.",
                                },
                                {
                                    icon: CheckCircle2,
                                    title: "Consent-Based Processing",
                                    text: "AI features only process content you explicitly submit. No background data mining or model training on your data.",
                                },
                            ].map((item) => (
                                <div
                                    key={item.title}
                                    className="flex gap-3 rounded-lg bg-white/70 p-4 backdrop-blur-sm"
                                >
                                    <item.icon className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900">
                                            {item.title}
                                        </h3>
                                        <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
                                            {item.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── Google API Limited Use Disclosure ────────── */}
                <section className="mb-14 rounded-2xl border border-sky-100 bg-sky-50 p-6 sm:p-8">
                    <div className="mb-4 flex items-center gap-3">
                        <Globe className="size-6 text-sky-700" />
                        <h2 className="text-lg font-bold text-gray-900">
                            Google API Services &mdash; Limited Use Disclosure
                        </h2>
                    </div>
                    <div className="space-y-3 text-sm leading-relaxed text-gray-700">
                        <p>
                            ProfGenie&apos;s use and transfer of information received from Google APIs
                            adheres to the{" "}
                            <a
                                className="font-medium text-sky-700 underline hover:text-sky-600"
                                href="https://developers.google.com/terms/api-services-user-data-policy"
                                rel="noopener noreferrer"
                                target="_blank"
                            >
                                Google API Services User Data Policy
                            </a>
                            , including the Limited Use requirements.
                        </p>
                        <ul className="list-inside list-disc space-y-1 text-gray-600">
                            <li>We only request scopes necessary for authentication (email, profile).</li>
                            <li>Google user data is never sold, rented, or shared with third parties for advertising.</li>
                            <li>Data obtained via Google OAuth is used solely to create and maintain your account.</li>
                            <li>You may revoke access at any time through your Google Account security settings.</li>
                        </ul>
                    </div>
                </section>

                {/* ── Full Privacy Policy Text ────────────────── */}
                <section className="mb-10">
                    <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-900">
                        <Scale className="size-6" />
                        Full Privacy Policy
                    </h2>

                    <div className="space-y-6 rounded-xl border border-gray-100 bg-white p-6 text-sm leading-6 text-gray-800 shadow-sm sm:p-8">
                        <div>
                            <h3 className="mb-2 text-base font-semibold">1. Overview</h3>
                            <p>
                                ProfGenie Platform respects your privacy. This policy explains what
                                data we collect, how we use it, and the choices you have.
                            </p>
                        </div>

                        <div>
                            <h3 className="mb-2 text-base font-semibold">2. Data We Collect</h3>
                            <ul className="list-inside list-disc space-y-1">
                                <li>Account data: name, email, and profile image via Google OAuth.</li>
                                <li>Course content you create (syllabi, assignments, discussion prompts).</li>
                                <li>AI interaction logs for the features you explicitly use.</li>
                                <li>Usage analytics (page views, feature usage) to improve reliability.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="mb-2 text-base font-semibold">3. How We Use Data</h3>
                            <ul className="list-inside list-disc space-y-1">
                                <li>Provide, personalize, and improve platform features.</li>
                                <li>Authenticate users securely via Google OAuth.</li>
                                <li>Generate AI-powered responses only when you request them.</li>
                                <li>Support, troubleshooting, and service communications.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="mb-2 text-base font-semibold">4. Data Sharing</h3>
                            <p>
                                We do <strong>not</strong> sell personal data. We may share data with
                                trusted infrastructure providers (hosting, database, payment
                                processing) strictly to operate the platform under contractual
                                safeguards.
                            </p>
                        </div>

                        <div>
                            <h3 className="mb-2 text-base font-semibold">5. Data Retention &amp; Deletion</h3>
                            <p>
                                We retain account data while your account is active. You may request
                                full deletion at any time — we will purge all personally identifiable
                                information within 30 days of a verified request.
                            </p>
                        </div>

                        <div>
                            <h3 className="mb-2 text-base font-semibold">6. Security Measures</h3>
                            <ul className="list-inside list-disc space-y-1">
                                <li>TLS 1.3 encryption for all data in transit.</li>
                                <li>AES-256 encryption for data at rest in our database provider.</li>
                                <li>Strict Content Security Policy and security headers on every response.</li>
                                <li>Role-based access control at every API endpoint.</li>
                                <li>8-hour session expiry with secure, HttpOnly cookies.</li>
                                <li>Client-side source code and content protection.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="mb-2 text-base font-semibold">7. Your Rights &amp; Choices</h3>
                            <ul className="list-inside list-disc space-y-1">
                                <li>Access and export your data at any time.</li>
                                <li>Update your profile information in account settings.</li>
                                <li>Request complete account and data deletion.</li>
                                <li>Revoke Google OAuth access from your Google Account.</li>
                                <li>Opt out of non-essential communications.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="mb-2 text-base font-semibold">8. Children&apos;s Privacy (COPPA)</h3>
                            <p>
                                ProfGenie is intended for higher-education professionals and students
                                aged 18 and older. We do not knowingly collect personal information
                                from children under 13. If we learn we have collected data from a
                                child under 13, we will delete it promptly.
                            </p>
                        </div>

                        <div>
                            <h3 className="mb-2 text-base font-semibold">9. FERPA Compliance</h3>
                            <p>
                                ProfGenie supports institutional FERPA compliance. Student education
                                records are accessible only to the instructor who created the course.
                                We act as a &ldquo;school official&rdquo; with a legitimate
                                educational interest under FERPA and do not disclose student records
                                without consent.
                            </p>
                        </div>

                        <div>
                            <h3 className="mb-2 text-base font-semibold">10. DMCA &amp; Copyright</h3>
                            <p>
                                We respect intellectual property rights and respond to valid DMCA
                                takedown notices. To report copyright infringement, contact us at{" "}
                                <span className="font-medium">support@profgenie.ai</span> with the
                                required DMCA notice elements.
                            </p>
                        </div>

                        <div>
                            <h3 className="mb-2 text-base font-semibold">11. Changes to This Policy</h3>
                            <p>
                                We may update this policy periodically. Material changes will be
                                communicated via the platform or email. Continued use after changes
                                constitutes acceptance.
                            </p>
                        </div>

                        <div>
                            <h3 className="mb-2 text-base font-semibold">12. Contact</h3>
                            <p>
                                For privacy questions or data requests, please use our{" "}
                                <Link
                                    className="font-medium text-blue-600 underline hover:text-blue-500"
                                    href="/contact"
                                >
                                    contact form
                                </Link>{" "}
                                or email us at{" "}
                                <span className="font-medium">support@profgenie.ai</span>.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ── Back link ────────────────────────────────── */}
                <div className="text-center">
                    <Link
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500"
                        href="/"
                    >
                        &larr; Back to home
                    </Link>
                </div>
            </div>
        </div>
    )
}
