import { Header, Footer } from "@/components/organisms";

export default function AccessibilityPage() {
    return (
        <div className="min-h-screen bg-[var(--background)]">
            <Header />

            <section className="bg-[var(--muted)] pt-32 pb-20">
                <div className="container-app text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold mb-6">Accessibility <span className="text-gradient">Statement</span></h1>
                    <p className="text-lg text-[var(--muted-foreground)] max-w-2xl mx-auto">
                        We are committed to making our platform accessible to everyone.
                    </p>
                </div>
            </section>

            <section className="py-20">
                <div className="container-app max-w-3xl">
                    <div className="prose prose-lg dark:prose-invert max-w-none">

                        <h2 className="text-2xl font-bold mb-4">Our Commitment</h2>
                        <p className="mb-6 text-[var(--muted-foreground)]">
                            Core Creator (a brand of Digital Boostup) believes that creativity is for everyone. We strive to ensure our digital marketplace and learning platform are accessible to people of all abilities.
                        </p>

                        <h2 className="text-2xl font-bold mb-4">Standards</h2>
                        <p className="mb-6 text-[var(--muted-foreground)]">
                            We aim to adhere to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. We regularly test our site features, color contrast, and keyboard navigation to meet these standards.
                        </p>

                        <h2 className="text-2xl font-bold mb-4">Features</h2>
                        <ul className="list-disc pl-6 space-y-2 text-[var(--muted-foreground)] mb-6">
                            <li>Compatible with screen readers.</li>
                            <li>Full keyboard navigation support.</li>
                            <li>Alt text for product images and course materials.</li>
                            <li>Resizable text and clean layout structure.</li>
                        </ul>

                        <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
                        <p className="mb-6 text-[var(--muted-foreground)]">
                            If you encounter any accessibility barriers on our site, please let us know. We welcome your feedback and will work to address any issues promptly.
                        </p>
                        <p className="font-bold">Email: accessibility@corecreator.com</p>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
