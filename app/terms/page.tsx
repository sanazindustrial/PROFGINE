import Link from "next/link"

export default function TermsPage() {
    return (
        <div className="container mx-auto max-w-4xl px-4 py-12">
            <h1 className="mb-4 text-3xl font-bold">Terms of Service</h1>
            <p className="mb-6 text-sm text-gray-600">Last updated: February 6, 2026</p>

            <div className="space-y-6 text-sm leading-6 text-gray-800">
                <section>
                    <h2 className="mb-2 text-lg font-semibold">1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using ProfGenie Platform, you agree to these Terms of Service.
                        If you do not agree, do not use the platform.
                    </p>
                </section>

                <section>
                    <h2 className="mb-2 text-lg font-semibold">2. Accounts and Access</h2>
                    <ul className="list-inside list-disc space-y-1">
                        <li>You are responsible for maintaining the confidentiality of your account.</li>
                        <li>You agree to provide accurate and up-to-date information.</li>
                        <li>Admin/Owner access is invite-only.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="mb-2 text-lg font-semibold">3. Acceptable Use</h2>
                    <ul className="list-inside list-disc space-y-1">
                        <li>Do not misuse, disrupt, or attempt to gain unauthorized access.</li>
                        <li>Do not upload unlawful or harmful content.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="mb-2 text-lg font-semibold">4. Intellectual Property</h2>
                    <p>
                        The platform and its content are owned by ProfGenie Platform and its licensors.
                        You may not copy or redistribute without permission.
                    </p>
                </section>

                <section>
                    <h2 className="mb-2 text-lg font-semibold">5. Disclaimer</h2>
                    <p>
                        The platform is provided “as is” without warranties of any kind.
                        We do not guarantee uninterrupted or error-free service.
                    </p>
                </section>

                <section>
                    <h2 className="mb-2 text-lg font-semibold">6. Limitation of Liability</h2>
                    <p>
                        To the maximum extent permitted by law, ProfGenie Platform is not liable
                        for any indirect or consequential damages.
                    </p>
                </section>

                <section>
                    <h2 className="mb-2 text-lg font-semibold">7. Changes</h2>
                    <p>
                        We may update these terms from time to time. Continued use constitutes acceptance.
                    </p>
                </section>

                <section>
                    <h2 className="mb-2 text-lg font-semibold">8. Contact</h2>
                    <p>
                        For questions, contact
                        {" "}
                        <a className="text-blue-600 hover:text-blue-500" href="mailto:support@profgenie.ai">
                            support@profgenie.ai
                        </a>.
                    </p>
                </section>
            </div>

            <div className="mt-8">
                <Link className="text-blue-600 hover:text-blue-500" href="/">
                    Back to home
                </Link>
            </div>
        </div>
    )
}
