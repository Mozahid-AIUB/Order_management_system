"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProducts, getPromotions, getOrders, createOrder } from "@/lib/api";

type Product = {
    id: string;
    name: string;
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

const tk = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

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
        return {
            amount: flat * quantity,
            trace: `${flat} tk × ${quantity}`,
        };
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

    function addToCart(productId: string) {
        const existing = cart.find((line) => line.productId === productId);
        setCart(
            existing
                ? cart.map((line) =>
                    line.productId === productId
                        ? { ...line, quantity: line.quantity + 1 }
                        : line,
                )
                : [...cart, { productId, quantity: 1 }],
        );
    }

    function setQuantity(productId: string, quantity: number) {
        if (quantity <= 0) {
            setCart(cart.filter((line) => line.productId !== productId));
            return;
        }
        setCart(
            cart.map((line) =>
                line.productId === productId ? { ...line, quantity } : line,
            ),
        );
    }

    const rows = cart.flatMap((line) => {
        const product = products.find((p) => p.id === line.productId);
        if (!product) return [];

        const price = Number(product.price);
        const amount = price * line.quantity;
        const promo = promotions.find(
            (p) => p.productId === product.id && isRunning(p),
        );
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
                total: amount - priced.amount,
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
        await loadData();
        setBusy(false);
    }

    return (
        <main className="mx-auto w-full max-w-5xl px-6 py-8">
            <header className="mb-6">
                <p className="label mb-1">Counter</p>
                <h1 className="text-xl font-semibold tracking-tight">New order</h1>
                <p className="mt-1 text-sm text-ink-soft">
                    Tap a product to add it. Discounts update as you change quantities.
                </p>
            </header>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
                {/* Product picker */}
                <section className="rounded-lg border border-rule bg-card p-5">
                    <p className="label mb-3">On sale</p>
                    {products.length === 0 ? (
                        <p className="text-sm text-ink-soft">
                            No products are on sale. Enable one under Products.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {products.map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => addToCart(p.id)}
                                    className="flex items-baseline justify-between rounded border border-rule px-3 py-2.5 text-left transition-colors hover:border-stamp hover:bg-stamp-soft"
                                >
                                    <span className="text-sm font-medium">{p.name}</span>
                                    <span className="tnum text-sm text-ink-soft">
                                        {p.price} tk · {p.weight} g
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {/* Receipt */}
                <form onSubmit={handleSubmit} className="rounded-lg border border-rule bg-card">
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
                        <p className="label mb-3">Cart</p>

                        {rows.length === 0 ? (
                            <p className="py-6 text-center text-sm text-ink-soft">
                                Nothing added yet.
                            </p>
                        ) : (
                            <ul className="flex flex-col divide-y divide-rule">
                                {rows.map((row) => (
                                    <li key={row.line.productId} className="py-3 first:pt-0">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium">{row.product.name}</p>
                                                <p className="tnum text-xs text-ink-soft">
                                                    {row.product.price} tk × {row.line.quantity}
                                                </p>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-3">
                                                <input
                                                    type="number"
                                                    min={0}
                                                    aria-label={`Quantity for ${row.product.name}`}
                                                    value={row.line.quantity}
                                                    onChange={(e) =>
                                                        setQuantity(row.line.productId, Number(e.target.value))
                                                    }
                                                    className="field tnum w-16 text-right"
                                                />
                                                <span className="tnum w-20 text-right text-sm">
                                                    {tk(row.amount)}
                                                </span>
                                            </div>
                                        </div>

                                        {row.discount > 0 && (
                                            <div className="mt-2 flex items-start justify-between gap-3 rounded bg-stamp-soft px-3 py-2">
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-stamp">
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
                <h2 className="label mb-3">Recent orders</h2>
                <div className="overflow-x-auto rounded-lg border border-rule bg-card">
                    <table className="w-full min-w-[36rem] text-sm">
                        <thead>
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
                                <tr key={order.id} className="border-b border-rule last:border-0">
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
                                        className="px-4 py-10 text-center text-sm text-ink-soft"
                                    >
                                        No orders yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
