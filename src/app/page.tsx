import HomeClient from "./HomeClient";

// The homepage body is a client component (it uses currency, cart and stats
// hooks), and a client component cannot export metadata - which is why the
// homepage was the only page on the site shipping without a canonical tag.
// This server wrapper supplies the metadata; the markup is unchanged.
export const metadata = {
    title: {
        absolute: "Core Creator - Global Art & Craft eLearning & Marketplace",
    },
    description:
        "Learn art and craft from working creators, and buy original handmade work direct from the artists who made it.",
    alternates: { canonical: "/" },
    openGraph: {
        title: "Core Creator - Global Art & Craft eLearning & Marketplace",
        description:
            "Learn art and craft from working creators, and buy original handmade work direct from the artists who made it.",
        url: "/",
        type: "website",
    },
};

export default function Page() {
    return <HomeClient />;
}
