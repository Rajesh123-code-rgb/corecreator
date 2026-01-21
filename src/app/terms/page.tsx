import { Header, Footer } from "@/components/organisms";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <section className="bg-[var(--muted)] pt-32 pb-20">
                <div className="container-app text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">Terms of <span className="text-gradient">Service</span></h1>
                    <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
                        Please read these terms carefully before using our platform.
                    </p>
                </div>
            </section>

            <section className="py-20">
                <div className="container-app max-w-3xl">
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="text-sm text-[var(--muted-foreground)] mb-8">Last Updated: January 1, 2026</p>

                        <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
                        <p className="mb-6 text-[var(--muted-foreground)]">
                            By accessing or using Core Creator ("the Platform"), a brand of Digital Boostup ("the Company"), you agree to be bound by these Terms of Service. If you do not agree to all of these Terms, do not use the Platform.
                        </p>

                        <h2 className="text-2xl font-bold mb-4">2. Eligibility</h2>
                        <p className="mb-6 text-[var(--muted-foreground)]">
                            You must be at least 13 years old to use the Platform. If you are under 18, you may only use the Platform with the supervision of a parent or legal guardian.
                        </p>

                        <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
                        <p className="mb-6 text-[var(--muted-foreground)]">
                            You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.
                        </p>

                        <h2 className="text-2xl font-bold mb-4">4. Selling on Core Creator</h2>
                        <p className="mb-6 text-[var(--muted-foreground)]">
                            Creators must accuracy represent their items and courses. We reserve the right to remove any listing that violates our policies or community standards.
                        </p>

                        <h2 className="text-2xl font-bold mb-4">5. Intellectual Property</h2>
                        <p className="mb-6 text-[var(--muted-foreground)]">
                            Core Creator respects the intellectual property rights of others. Content created and uploaded by users remains their property. By using our services, you grant us a license to display this content on our platform.
                        </p>

                        <h2 className="text-2xl font-bold mb-4">6. Limitation of Liability</h2>
                        <p className="mb-6 text-[var(--muted-foreground)]">
                            Core Creator usage is at your own risk. The platform is provided on an "as is" and "as available" basis.
                        </p>

                        <h2 className="text-2xl font-bold mb-4">7. Contact Us</h2>
                        <p className="mb-6 text-[var(--muted-foreground)]">
                            If you have any questions about these Terms, please contact us at support@corecreator.com.
                        </p>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
