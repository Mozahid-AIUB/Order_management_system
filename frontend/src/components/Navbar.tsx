"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const links = [
    { href: "/orders", label: "Counter" },
    { href: "/orders/history", label: "Orders" },
    { href: "/products", label: "Products" },
    { href: "/promotions", label: "Promotions" },
];

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();

    // The sign-in screen stands alone.
    if (pathname === "/login") return null;

    function handleLogout() {
        localStorage.removeItem("accessToken");
        router.push("/login");
    }

    return (
        <header className="border-b border-rule bg-card">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-3">
                <div className="flex items-baseline gap-3">
                    <span className="text-sm font-semibold tracking-tight">
                        Order Desk
                    </span>
                    <span className="label hidden sm:inline">Counter terminal</span>
                </div>

                <nav className="flex items-center gap-1">
                    {links.map((link) => {
                        const active = pathname === link.href;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                aria-current={active ? "page" : undefined}
                                className={`rounded px-3 py-1.5 text-sm transition-colors ${active
                                    ? "bg-stamp-soft font-medium text-stamp"
                                    : "text-ink-soft hover:text-ink"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                    <button
                        onClick={handleLogout}
                        className="ml-2 rounded px-3 py-1.5 text-sm text-ink-soft transition-colors hover:text-flag"
                    >
                        Sign out
                    </button>
                </nav>
            </div>
        </header>
    );
}
