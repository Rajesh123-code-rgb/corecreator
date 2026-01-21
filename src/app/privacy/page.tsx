import { Header, Footer } from "@/components/organisms";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <section className="bg-[var(--muted)] pt-32 pb-20">
                <div className="container-app text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">Privacy <span className="text-gradient">Policy</span></h1>
                    <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
                        How Core Creator (a brand of Digital Boostup) collects, uses, and protects your personal information.
                    </p>
                </div>
            </section>

            <section className="py-20">
                <div className="container-app max-w-3xl">
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <p className="text-sm text-[var(--muted-foreground)] mb-8">Last Updated: January 1, 2026</p>

                        <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
                        <p className="mb-6 text-[var(--muted-foreground)]">
                            We collect information you provide directly to us, such as when you create an account, make a purchase, or communicate with us. This may include your name, email address, payment information, and shipping address.
                        </p>

                        <h2 className="text-2xl font-bold mb-4">2. How We Use Your Information</h2>
                        <p className="mb-6 text-[var(--muted-foreground)]">
                            We use your information to facilitate orders, process payments, provide customer support, and improve our services. We may also send you promotional emails if you have opted in.
                        </p>

                        <h2 className="text-2xl font-bold mb-4">3. Data Sharing</h2>
                        <p className="mb-6 text-[var(--muted-foreground)]">
                            We do not sell your personal data. We share data only with third-party service providers (like payment processors and shipping partners) essential to our operations.
                        </p>

                        <h2 className="text-2xl font-bold mb-4">4. Security</h2>
                        <p className="mb-6 text-[var(--muted-foreground)]">
                            We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, or misuse.
                        </p>

                        <h2 className="text-2xl font-bold mb-4">5. Your Rights</h2>
                        <p className="mb-6 text-[var(--muted-foreground)]">
                            You have the right to access, correct, or delete your personal data. You can manage your account settings or contact us to exercise these rights.
                        </p>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
