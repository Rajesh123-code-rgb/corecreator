import ArtistsClient from "./ArtistsClient";
import { getArtists } from "@/lib/artistSearch";

export const metadata = {
    title: "Featured Artists & Creators",
    description: "Browse the artists and instructors selling original work and teaching craft skills on Core Creator.",
    alternates: { canonical: "/artists" },
};

// Reads from the database at request time. The build has no MONGODB_URI, so
// this must not be statically collected.
export const dynamic = "force-dynamic";

export default async function Page() {
    const artists = await getArtists({ limit: 50, sort: "rating" });
    return <ArtistsClient initialArtists={JSON.parse(JSON.stringify(artists))} />;
}
