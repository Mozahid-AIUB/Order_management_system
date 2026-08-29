"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getProducts, getPromotions, getOrders, createOrder } from "@/lib/api";

type Product = {
    id: string;
    name: string;
    description: string | null;
    price: string;
    weight: number;
    isEnabled: boolean;
};

type Slab = {
    minWeight: number;
    maxWeight: number | null;
    discountPerUnit: string;
};

type Promotion = {
    id: string;
    title: string;
    type: "PERCENTAGE" | "FIXED" | "WEIGHTED";
    productId: string;
    isEnabled: boolean;
    startDate: string;
    endDate: string;
    percentageValue: string | null;
    fixedValue: string | null;
    slabs: Slab[];
};

type CartLine = { productId: string; quantity: number };

type Priced = {
    amount: number;
    /** How the discount was reached, shown on the receipt line. */
    trace: string | null;
};

/** A counter order never runs to five figures of one item. */
const MAX_QUANTITY = 9999;

const tk = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function categoryOf(description: string | null): string {
    if (!description) return "";
    const parts = description.split(" - ");
    return parts.length > 1 ? parts[0].trim() : "";
}

function isRunning(promo: Promotion): boolean {
    const now = new Date();
    return (
        promo.isEnabled &&
        new Date(promo.startDate) <= now &&
        new Date(promo.endDate) >= now
    );
}

/**
 * Mirrors the server calculation so the counter shows a live total.
 * The server recalculates from scratch when the order is placed.
 */
function priceDiscount(
    promo: Promotion,
    price: number,
    weight: number,
    quantity: number,
): Priced {
    if (promo.type === "PERCENTAGE") {
        const pct = Number(promo.percentageValue);
        return {
            amount: price * quantity * (pct / 100),
            trace: `${pct}% of ${tk(price * quantity)}`,
        };
    }

    if (promo.type === "FIXED") {
        const flat = Number(promo.fixedValue);
        return { amount: flat * quantity, trace: `${flat} tk × ${quantity}` };
    }

    const totalWeight = weight * quantity;
    const index = promo.slabs.findIndex(
        (s) =>
            totalWeight >= s.minWeight &&
            (s.maxWeight === null || totalWeight <= s.maxWeight),
    );

    if (index === -1) {
        return {
            amount: 0,
            trace: `${totalWeight.toLocaleString()} g — below the first slab`,
        };
    }

    const slab = promo.slabs[index];
    const rate = Number(slab.discountPerUnit);
    return {
        amount: rate * quantity,
        trace: `${totalWeight.toLocaleString()} g → slab ${index + 1} · ${rate} tk × ${quantity}`,
    };
}

export default function OrdersPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [orders, setOrders] = useState<any[]>([]);

    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [cart, setCart] = useState<CartLine[]>([]);
    const [query, setQuery] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.push("/login");
            return;
        }
        loadData();
    }, []);

    async function loadData() {
        const [prods, promos, ords] = await Promise.all([
            getProducts(),
            getPromotions(),
            getOrders(),
        ]);
        setProducts(prods.filter((p: Product) => p.isEnabled));
        setPromotions(promos);
        setOrders(ords);
    }

    const runningFor = useMemo(() => {
        const map = new Map<string, Promotion>();
        promotions.filter(isRunning).forEach((p) => map.set(p.productId, p));
        return map;
    }, [promotions]);

    const searchResults = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return products;
        return products.filter(
            (p) =>
                p.name.toLowerCase().includes(q) ||
                (p.description ?? "").toLowerCase().includes(q),
        );
    }, [products, query]);

    function addToCart(productId: string) {
        const existing = cart.find((line) => line.productId === productId);
        setCart(
            existing
                ? cart.map((line) =>
                    line.productId === productId
                        ? { ...line, quantity: Math.min(line.quantity + 1, MAX_QUANTITY) }
                        : line,
                )
                : [...cart, { productId, quantity: 1 }],
        );
    }

    function setQuantity(productId: string, quantity: number) {
        if (!Number.isFinite(quantity) || quantity <= 0) {
            setCart(cart.filter((line) => line.productId !== productId));
            return;
        }
        const clamped = Math.min(Math.floor(quantity), MAX_QUANTITY);
        setCart(
            cart.map((line) =>
                line.productId === productId ? { ...line, quantity: clamped } : line,
            ),
        );
    }

    const rows = cart.flatMap((line) => {
        const product = products.find((p) => p.id === line.productId);
        if (!product) return [];

        const price = Number(product.price);
        const amount = price * line.quantity;
        const promo = runningFor.get(product.id);
        const priced = promo
            ? priceDiscount(promo, price, product.weight, line.quantity)
            : { amount: 0, trace: null };

        return [
            {
                line,
                product,
                amount,
                discount: priced.amount,
                trace: priced.trace,
                promoTitle: promo?.title ?? null,
            },
        ];
    });

    const subtotal = rows.reduce((sum, row) => sum + row.amount, 0);
    const totalDiscount = rows.reduce((sum, row) => sum + row.discount, 0);
    const grandTotal = subtotal - totalDiscount;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!customerName || !customerPhone) {
            alert("Enter the customer's name and phone.");
            return;
        }
        if (cart.length === 0) {
            alert("Add at least one product to the cart.");
            return;
        }

        setBusy(true);
        await createOrder({ customerName, customerPhone, items: cart });
        setCustomerName("");
        setCustomerPhone("");
        setCart([]);
        setQuery("");
        await loadData();
        setBusy(false);
    }

    return (
        <main className="mx-auto w-full max-w-6xl px-6 py-8">
            <header className="mb-6">
                <p className="label mb-1">Counter</p>
                <h1 className="text-xl font-semibold tracking-tight">New order</h1>
                <p className="mt-1 text-sm text-ink-soft">
                    Tap a product to add it. Discounts update as you change quantities.
                </p>
            </header>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:items-start">
                {/* Product picker */}
                <section className="rounded-lg border border-rule bg-card">
                    <div className="border-b border-rule p-4">
                        <div className="mb-3 flex items-baseline justify-between">
                            <p className="label">On sale</p>
                            <span className="tnum text-xs text-ink-soft">
                                {searchResults.length} of {products.length}
                            </span>
                        </div>
                        <input
                            type="search"
                            placeholder="Search the catalogue…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="field"
                        />
                    </div>

                    {/* Long catalogue, so the list scrolls rather than the page. */}
                    <div className="max-h-[26rem] overflow-auto p-2">
                        {searchResults.length === 0 ? (
                            <p className="px-2 py-10 text-center text-sm text-ink-soft">
                                {products.length === 0
                                    ? "No products are on sale. Enable one under Products."
                                    : "Nothing matches that search."}
                            </p>
                        ) : (
                            <ul className="flex flex-col">
                                {searchResults.map((p) => {
                                    const inCart = cart.find((l) => l.productId === p.id);
                                    const promo = runningFor.get(p.id);
                                    return (
                                        <li key={p.id}>
                                            <button
                                                onClick={() => addToCart(p.id)}
                                                className="w-full rounded px-3 py-2.5 text-left transition-colors hover:bg-stamp-soft"
                                            >
                                                <div className="flex items-baseline justify-between gap-3">
                                                    <span className="truncate text-sm font-medium">
                                                        {p.name}
                                                        {inCart && (
                                                            <span className="tnum ml-2 rounded bg-stamp px-1.5 py-0.5 text-xs text-white">
                                                                {inCart.quantity}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="tnum shrink-0 text-sm">{p.price} tk</span>
                                                </div>
                                                <div className="mt-0.5 flex items-baseline justify-between gap-3">
                                                    <span className="truncate text-xs uppercase tracking-wide text-ink-soft">
                                                        {categoryOf(p.description)}
                                                    </span>
                                                    <span className="tnum shrink-0 text-xs text-ink-soft">
                                                        {p.weight.toLocaleString()} g
                                                    </span>
                                                </div>
                                                {promo && (
                                                    <p className="mt-1 truncate text-xs text-stamp">
                                                        {promo.title}
                                                    </p>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </section>

                {/* Receipt */}
                <form
                    onSubmit={handleSubmit}
                    className="rounded-lg border border-rule bg-card lg:sticky lg:top-6"
                >
                    <div className="border-b border-rule p-5">
                        <p className="label mb-3">Customer</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <input
                                placeholder="Name"
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                className="field"
                            />
                            <input
                                placeholder="Phone"
                                inputMode="tel"
                                value={customerPhone}
                                onChange={(e) => setCustomerPhone(e.target.value)}
                                className="field tnum"
                            />
                        </div>
                    </div>

                    <div className="p-5">
                        <div className="mb-3 flex items-baseline justify-between">
                            <p className="label">Cart</p>
                            {cart.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setCart([])}
                                    className="text-xs text-ink-soft hover:text-flag"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {rows.length === 0 ? (
                            <p className="py-8 text-center text-sm text-ink-soft">
                                Nothing added yet.
                            </p>
                        ) : (
                            <ul className="flex max-h-[20rem] flex-col divide-y divide-rule overflow-auto">
                                {rows.map((row) => (
                                    <li key={row.line.productId} className="py-3 first:pt-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium">
                                                    {row.product.name}
                                                </p>
                                                <p className="tnum text-xs text-ink-soft">
                                                    {row.product.price} tk × {row.line.quantity}
                                                </p>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-3">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    max={MAX_QUANTITY}
                                                    aria-label={`Quantity for ${row.product.name}`}
                                                    value={row.line.quantity}
                                                    onChange={(e) =>
                                                        setQuantity(row.line.productId, Number(e.target.value))
                                                    }
                                                    className="field tnum w-20 text-center"
                                                />
                                                <span className="tnum w-24 text-right text-sm">
                                                    {tk(row.amount)}
                                                </span>
                                            </div>
                                        </div>

                                        {row.discount > 0 && (
                                            <div className="mt-2 flex items-start justify-between gap-3 rounded bg-stamp-soft px-3 py-2">
                                                <div className="min-w-0">
                                                    <p className="truncate text-xs font-medium text-stamp">
                                                        {row.promoTitle}
                                                    </p>
                                                    {row.trace && (
                                                        <p className="tnum mt-0.5 text-xs text-stamp/80">
                                                            {row.trace}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="tnum shrink-0 text-sm text-stamp">
                                                    −{tk(row.discount)}
                                                </span>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}

                        <dl className="tnum mt-5 border-t border-rule pt-4 text-sm">
                            <div className="flex justify-between py-1">
                                <dt className="text-ink-soft">Subtotal</dt>
                                <dd>{tk(subtotal)}</dd>
                            </div>
                            <div className="flex justify-between py-1">
                                <dt className="text-ink-soft">Total discount</dt>
                                <dd className="text-stamp">−{tk(totalDiscount)}</dd>
                            </div>
                            <div className="mt-2 flex items-baseline justify-between border-t border-rule pt-3">
                                <dt className="font-sans text-sm font-medium">Grand total</dt>
                                <dd className="text-xl font-semibold">{tk(grandTotal)} tk</dd>
                            </div>
                        </dl>

                        <button
                            type="submit"
                            disabled={busy}
                            className="btn btn-primary mt-5 w-full disabled:opacity-60"
                        >
                            {busy ? "Placing order…" : "Place order"}
                        </button>
                    </div>
                </form>
            </div>

            <section className="mt-10">
                <div className="mb-3 flex items-baseline justify-between">
                    <h2 className="label">Recent orders</h2>
                    <span className="tnum text-xs text-ink-soft">{orders.length} total</span>
                </div>

                <div className="overflow-hidden rounded-lg border border-rule bg-card">
                    <div className="max-h-[24rem] overflow-auto">
                        <table className="w-full min-w-[36rem] text-sm">
                            <thead className="sticky top-0 z-10 bg-card">
                                <tr className="border-b border-rule text-left">
                                    <th className="label px-4 py-3 font-semibold">Customer</th>
                                    <th className="label px-4 py-3 font-semibold">Phone</th>
                                    <th className="label px-4 py-3 text-right font-semibold">Subtotal</th>
                                    <th className="label px-4 py-3 text-right font-semibold">Discount</th>
                                    <th className="label px-4 py-3 text-right font-semibold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="border-b border-rule transition-colors last:border-0 hover:bg-paper"
                                    >
                                        <td className="px-4 py-3 font-medium">{order.customerName}</td>
                                        <td className="tnum px-4 py-3 text-ink-soft">
                                            {order.customerPhone}
                                        </td>
                                        <td className="tnum px-4 py-3 text-right">{order.subtotal}</td>
                                        <td className="tnum px-4 py-3 text-right text-stamp">
                                            −{order.totalDiscount}
                                        </td>
                                        <td className="tnum px-4 py-3 text-right font-medium">
                                            {order.grandTotal}
                                        </td>
                                    </tr>
                                ))}
                                {orders.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-12 text-center text-sm text-ink-soft"
                                        >
                                            No orders yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </main>
    );
}
