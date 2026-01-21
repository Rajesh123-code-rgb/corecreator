import Link from "next/link";
import { Button } from "@/components/atoms";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
            <h1 className="text-9xl font-bold text-gray-200">404</h1>
            <h2 className="text-3xl font-bold text-gray-900 mt-4">Page Not Found</h2>
            <p className="text-gray-500 mt-2 mb-8 max-w-md">
                Sorry, the page you are looking for doesn't exist or has been moved.
            </p>
            <div className="flex gap-4">
                <Link href="/">
                    <Button>Go Home</Button>
                </Link>
                <Link href="/shop">
                    <Button variant="outline">Browse Shop</Button>
                </Link>
            </div>
        </div>
    );
}
