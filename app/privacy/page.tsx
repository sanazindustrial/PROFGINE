import Link from "next/link"

export default function PrivacyPage() {
    return (
        <div className="container mx-auto max-w-4xl px-4 py-12">
            <h1 className="mb-4 text-3xl font-bold">Privacy Policy</h1>
            <p className="mb-6 text-sm text-gray-600">Last updated: February 6, 2026</p>

            <div className="space-y-6 text-sm leading-6 text-gray-800">
                <section>
                    <h2 className="mb-2 text-lg font-semibold">1. Overview</h2>
                    <p>
                        ProfGenie Platform respects your privacy. This policy explains what data we collect,
                        how we use it, and the choices you have.
                    </p>
                </section>

                <section>
                    <h2 className="mb-2 text-lg font-semibold">2. Data We Collect</h2>
                    <ul className="list-inside list-disc space-y-1">
                        <li>Account data: name, email, and profile image.</li>
                        <li>Authentication data from Google OAuth.</li>
                        <li>Usage data to improve features and reliability.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="mb-2 text-lg font-semibold">3. How We Use Data</h2>
                    <ul className="list-inside list-disc space-y-1">
                        <li>Provide and improve the platform.</li>
                        <li>Secure authentication and account management.</li>
                        <li>Support, troubleshooting, and communications.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="mb-2 text-lg font-semibold">4. Data Sharing</h2>
                    <p>
                        We do not sell personal data. We may share data with trusted service providers
                        (e.g., hosting, analytics) strictly to operate the platform.
                    </p>
                </section>

                <section>
                    <h2 className="mb-2 text-lg font-semibold">5. Data Retention</h2>
                    <p>
                        We retain account data while your account is active. You may request deletion
                        at any time.
                    </p>
                </section>

                <section>
                    <h2 className="mb-2 text-lg font-semibold">6. Your Choices</h2>
                    <ul className="list-inside list-disc space-y-1">
                        <li>Update your profile information in the account settings.</li>
                        <li>Request account deletion by contacting support.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="mb-2 text-lg font-semibold">7. Contact</h2>
                    <p>
                        For privacy questions, contact us at
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
