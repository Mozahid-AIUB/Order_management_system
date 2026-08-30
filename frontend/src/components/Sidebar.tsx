"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Item = { href: string; label: string; icon: React.ReactNode; exact?: boolean };

const IconCounter = (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2.5" y="4" width="15" height="12" rx="1.5" />
        <path d="M2.5 8h15M7 12h6" />
    </svg>
);

const IconLedger = (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 2.5h10a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1v-13a1 1 0 011-1z" />
        <path d="M7 6.5h6M7 10h6M7 13.5h3" />
    </svg>
);

const IconProducts = (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 2.5l6.5 3.5v8L10 17.5 3.5 14V6z" />
        <path d="M3.5 6L10 9.5 16.5 6M10 9.5v8" />
    </svg>
);

const IconPromotions = (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M10 2.5l2 1.2 2.3-.3.7 2.2 1.9 1.3-1 2.1 1 2.1-1.9 1.3-.7 2.2-2.3-.3-2 1.2-2-1.2-2.3.3-.7-2.2L3.1 11l1-2.1-1-2.1L5 5.5l.7-2.2 2.3.3z" />
        <path d="M8 12l4-4M8.2 8.2h.01M11.8 11.8h.01" />
    </svg>
);

const GROUPS: { title: string; items: Item[] }[] = [
    {
        title: "Sales",
        items: [
            { href: "/orders", label: "Counter", icon: IconCounter, exact: true },
            { href: "/orders/history", label: "Orders", icon: IconLedger },
        ],
    },
    {
        title: "Catalogue",
        items: [
            { href: "/products", label: "Products", icon: IconProducts },
            { href: "/promotions", label: "Promotions", icon: IconPromotions },
        ],
    },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);

    // Read the saved choice once the component is on the client.
    useEffect(() => {
        try {
            setCollapsed(localStorage.getItem("sidebarCollapsed") === "1");
        } catch {
            /* private mode - keep the default */
        }
    }, []);

    // Persisting belongs in an effect, not inside the state updater.
    useEffect(() => {
        try {
            localStorage.setItem("sidebarCollapsed", collapsed ? "1" : "0");
        } catch {
            /* ignore */
        }
    }, [collapsed]);

    if (pathname === "/login") return null;

    function handleLogout() {
        localStorage.removeItem("accessToken");
        router.push("/login");
    }

    return (
        <aside
            className={`sticky top-0 flex h-screen shrink-0 flex-col border-r border-rule bg-card transition-[width] duration-150 ${collapsed ? "w-16" : "w-56"
                }`}
        >
            <div className="flex h-14 items-center gap-2 border-b border-rule px-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded bg-stamp text-xs font-semibold text-white">
                    OD
                </span>
                {!collapsed && (
                    <span className="truncate text-xs uppercase tracking-[0.18em] text-ink-soft">
                        Order Desk
                    </span>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-4">
                {GROUPS.map((group) => (
                    <div key={group.title} className="mb-5 last:mb-0">
                        {!collapsed && (
                            <p className="label px-2 pb-1.5">{group.title}</p>
                        )}
                        <ul className="flex flex-col gap-0.5">
                            {group.items.map((item) => {
                                const active = item.exact
                                    ? pathname === item.href
                                    : pathname.startsWith(item.href);
                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            title={collapsed ? item.label : undefined}
                                            aria-current={active ? "page" : undefined}
                                            className={`flex items-center gap-3 rounded px-2 py-2 text-sm transition-colors ${active
                                                ? "bg-stamp-soft font-medium text-stamp"
                                                : "text-ink-soft hover:bg-paper hover:text-ink"
                                                } ${collapsed ? "justify-center" : ""}`}
                                        >
                                            <span className="h-5 w-5 shrink-0">{item.icon}</span>
                                            {!collapsed && <span className="truncate">{item.label}</span>}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            <div className="border-t border-rule p-2">
                <button
                    onClick={handleLogout}
                    title={collapsed ? "Sign out" : undefined}
                    className={`flex w-full items-center gap-3 rounded px-2 py-2 text-sm text-ink-soft transition-colors hover:bg-paper hover:text-flag ${collapsed ? "justify-center" : ""
                        }`}
                >
                    <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className="h-5 w-5 shrink-0"
                    >
                        <path d="M12 6V4a1 1 0 00-1-1H5a1 1 0 00-1 1v12a1 1 0 001 1h6a1 1 0 001-1v-2" />
                        <path d="M9 10h8m0 0l-2.5-2.5M17 10l-2.5 2.5" />
                    </svg>
                    {!collapsed && <span>Sign out</span>}
                </button>

                <button
                    onClick={() => setCollapsed((c) => !c)}
                    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className={`mt-1 flex w-full items-center gap-3 rounded px-2 py-2 text-sm text-ink-soft transition-colors hover:bg-paper hover:text-ink ${collapsed ? "justify-center" : ""
                        }`}
                >
                    <svg
                        viewBox="0 0 20 20"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        className={`h-5 w-5 shrink-0 transition-transform ${collapsed ? "rotate-180" : ""}`}
                    >
                        <path d="M11.5 5.5L7 10l4.5 4.5" />
                    </svg>
                    {!collapsed && <span>Collapse</span>}
                </button>
            </div>
        </aside>
    );
}
