// A sign-in page is a utility, not content. /login is already noindex; this
// keeps the creator equivalent consistent rather than having one indexed and
// the other not.
export const metadata = {
    title: "Studio Sign In",
    robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
