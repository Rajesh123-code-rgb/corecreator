import BlogClient from "./BlogClient";

export const metadata = {
    title: "Blog",
    description: "Tutorials, technique guides and stories from the Core Creator art and craft community.",
    alternates: { canonical: "/blog" },
};

export default function Page() {
    return <BlogClient />;
}
