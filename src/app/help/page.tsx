import HelpClient from "./HelpClient";

export const metadata = {
    title: "Help Center",
    description: "Answers and guides for buying, selling, learning and managing your Core Creator account.",
    alternates: { canonical: "/help" },
};

export default function Page() {
    return <HelpClient />;
}
