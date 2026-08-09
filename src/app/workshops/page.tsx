import WorkshopsClient from "./WorkshopsClient";

export const metadata = {
    title: "Live & Online Art Workshops",
    description: "Join live and in-person art and craft workshops led by professional creators — hands-on sessions across painting, ceramics, resin art and more.",
    alternates: { canonical: "/workshops" },
};

export default function Page() {
    return <WorkshopsClient />;
}
