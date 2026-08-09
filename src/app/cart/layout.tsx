// /cart is a utility page with no content worth ranking. It is a client
// component, so it cannot export metadata itself - hence this thin layout.
export const metadata = {
    title: "Your Cart",
    robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
