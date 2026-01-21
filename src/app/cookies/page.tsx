import { Header, Footer } from "@/components/organisms";

export default function CookiesPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <section className="bg-[var(--muted)] pt-32 pb-20">
                <div className="container-app text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">Cookie <span className="text-gradient">Policy</span></h1>
                    <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
                        Understanding how and why Core Creator (operated by Digital Boostup) uses cookies.
                    </p>
                </div>
            </section>

            <section className="py-20">
                <div className="container-app max-w-3xl">
                    <div className="prose prose-lg dark:prose-invert max-w-none">
                        <h2 className="text-2xl font-bold mb-4">1. What are Cookies?</h2>
                        <p className="mb-6 text-[var(--muted-foreground)]">
                            Cookies are small text files stored on your device when you visit a website. They help us recognize you and remember your preferences.
                        </p>

                        <h2 className="text-2xl font-bold mb-4">2. Types of Cookies We Use</h2>
                        <div className="mb-6">
                            <ul className="list-disc pl-6 space-y-2 text-[var(--muted-foreground)]">
                                <li><strong>Essential Cookies:</strong> Necessary for the website to function (e.g., shopping cart, login).</li>
                                <li><strong>Analytics Cookies:</strong> Help us understand how visitors interact with our site.</li>
                                <li><strong>Functional Cookies:</strong> Remember your choices (like language or region).</li>
                                <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements.</li>
                            </ul>
                        </div>

                        <h2 className="text-2xl font-bold mb-4">3. Managing Cookies</h2>
                        <p className="mb-6 text-[var(--muted-foreground)]">
                            You can control and manage cookies through your browser settings. Please note that blocking essential cookies may impact your experience on our platform.
                        </p>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
