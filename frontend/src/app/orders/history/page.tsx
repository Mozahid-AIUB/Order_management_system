"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getOrders, getProducts } from "@/lib/api";

type Product = { id: string; name: string };

type OrderItem = {
    id: string;
    productId: string;
    quantity: number;
    unitPrice: string;
    discountApplied: string;
    lineTotal: string;
};

type Order = {
    id: string;
    customerName: string;
    customerPhone: string;
    subtotal: string;
    totalDiscount: string;
    grandTotal: string;
    createdAt: string;
    items: OrderItem[];
};

const tk = (v: string | number) =>
    Number(v).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

export default function OrderHistoryPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [query, setQuery] = useState("");
    const [openOrder, setOpenOrder] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.push("/login");
            return;
        }
        load();
    }, []);

    async function load() {
        const [ords, prods] = await Promise.all([getOrders(), getProducts()]);
        setOrders(ords);
        setProducts(prods);
    }

    const nameOf = (productId: string) =>
        products.find((p) => p.id === productId)?.name ?? "Removed product";

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return orders;
        return orders.filter(
            (o) =>
                o.customerName.toLowerCase().includes(q) ||
                o.customerPhone.includes(q),
        );
    }, [orders, query]);

    const totals = useMemo(
        () => ({
            revenue: visible.reduce((s, o) => s + Number(o.grandTotal), 0),
            discount: visible.reduce((s, o) => s + Number(o.totalDiscount), 0),
        }),
        [visible],
    );

    return (
        <main className="mx-auto w-full max-w-5xl px-6 py-8">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="label mb-1">Ledger</p>
                    <h1 className="text-xl font-semibold tracking-tight">Orders</h1>
                    <p className="mt-1 text-sm text-ink-soft">
                        Open a row to see what was in the basket and how each discount landed.
                    </p>
                </div>

                <Link href="/orders" className="btn btn-primary">
                    Take a new order
                </Link>
            </header>

            <div className="mb-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-rule bg-card px-4 py-3">
                    <p className="label">Orders</p>
                    <p className="tnum mt-1 text-lg font-semibold">{visible.length}</p>
                </div>
                <div className="rounded-lg border border-rule bg-card px-4 py-3">
                    <p className="label">Discount given</p>
                    <p className="tnum mt-1 text-lg font-semibold text-stamp">
                        {tk(totals.discount)}
                    </p>
                </div>
                <div className="rounded-lg border border-rule bg-card px-4 py-3">
                    <p className="label">Collected</p>
                    <p className="tnum mt-1 text-lg font-semibold">{tk(totals.revenue)}</p>
                </div>
            </div>

            <input
                type="search"
                placeholder="Search by customer name or phone…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="field mb-4 max-w-sm"
            />

            <div className="overflow-hidden rounded-lg border border-rule bg-card">
                <div className="max-h-[60vh] overflow-auto">
                    <table className="w-full min-w-[40rem] text-sm">
                        <thead className="sticky top-0 z-10 bg-card">
                            <tr className="border-b border-rule text-left">
                                <th className="label px-4 py-3 font-semibold">Customer</th>
                                <th className="label px-4 py-3 font-semibold">Placed</th>
                                <th className="label px-4 py-3 text-right font-semibold">Subtotal</th>
                                <th className="label px-4 py-3 text-right font-semibold">Discount</th>
                                <th className="label px-4 py-3 text-right font-semibold">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((order) => {
                                const open = openOrder === order.id;
                                return (
                                    <Fragment key={order.id}>
                                        <tr
                                            onClick={() => setOpenOrder(open ? null : order.id)}
                                            className="cursor-pointer border-b border-rule transition-colors hover:bg-paper"
                                        >
                                            <td className="px-4 py-3">
                                                <span className="mr-2 inline-block w-3 text-ink-soft">
                                                    {open ? "−" : "+"}
                                                </span>
                                                <span className="font-medium">{order.customerName}</span>
                                                <span className="tnum ml-2 text-xs text-ink-soft">
                                                    {order.customerPhone}
                                                </span>
                                            </td>
                                            <td className="tnum px-4 py-3 text-xs text-ink-soft">
                                                {new Date(order.createdAt).toLocaleDateString()}{" "}
                                                {new Date(order.createdAt).toLocaleTimeString([], {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </td>
                                            <td className="tnum px-4 py-3 text-right">{order.subtotal}</td>
                                            <td className="tnum px-4 py-3 text-right text-stamp">
                                                {Number(order.totalDiscount) > 0
                                                    ? `−${order.totalDiscount}`
                                                    : "—"}
                                            </td>
                                            <td className="tnum px-4 py-3 text-right font-medium">
                                                {order.grandTotal}
                                            </td>
                                        </tr>

                                        {open && (
                                            <tr className="border-b border-rule bg-paper">
                                                <td colSpan={5} className="px-4 py-3">
                                                    <table className="tnum w-full text-xs">
                                                        <thead>
                                                            <tr className="text-left text-ink-soft">
                                                                <th className="pb-1 font-normal">Product</th>
                                                                <th className="pb-1 text-right font-normal">Qty</th>
                                                                <th className="pb-1 text-right font-normal">Unit</th>
                                                                <th className="pb-1 text-right font-normal">
                                                                    Discount
                                                                </th>
                                                                <th className="pb-1 text-right font-normal">Line</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {order.items.map((item) => (
                                                                <tr key={item.id}>
                                                                    <td className="py-0.5 font-sans">
                                                                        {nameOf(item.productId)}
                                                                    </td>
                                                                    <td className="py-0.5 text-right">
                                                                        {item.quantity}
                                                                    </td>
                                                                    <td className="py-0.5 text-right">
                                                                        {item.unitPrice}
                                                                    </td>
                                                                    <td className="py-0.5 text-right text-stamp">
                                                                        {Number(item.discountApplied) > 0
                                                                            ? `−${item.discountApplied}`
                                                                            : "—"}
                                                                    </td>
                                                                    <td className="py-0.5 text-right">
                                                                        {item.lineTotal}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </td>
                                            </tr>
                                        )}
                                    </Fragment>
                                );
                            })}

                            {visible.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-ink-soft">
                                        {orders.length === 0
                                            ? "No orders yet."
                                            : "No customer matches that search."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}
