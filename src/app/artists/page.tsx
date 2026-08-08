import ArtistsClient from "./ArtistsClient";

export const metadata = {
    title: "Featured Artists & Creators | Core Creator",
    description: "Browse the artists and instructors selling original work and teaching craft skills on Core Creator.",
    alternates: { canonical: "/artists" },
};

export default function Page() {
    return <ArtistsClient />;
}
