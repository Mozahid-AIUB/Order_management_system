"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
    { href: "/products", label: "Products" },
    { href: "/promotions", label: "Promotions" },
    { href: "/orders", label: "Orders" },
];

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();

    // The login page has no navigation.
    if (pathname === "/login") return null;

    function handleLogout() {
        localStorage.removeItem("accessToken");
        router.push("/login");
    }

    return (
        <nav className="border-b">
            <div className="mx-auto flex max-w-4xl items-center justify-between px-8 py-4">
                <div className="flex gap-6">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={
                                pathname === link.href
                                    ? "font-semibold underline"
                                    : "hover:underline"
                            }
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
                <button onClick={handleLogout} className="text-sm hover:underline">
                    Logout
                </button>
            </div>
        </nav>
    );
}
