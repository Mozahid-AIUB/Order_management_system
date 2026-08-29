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

// Preview only - the backend recalculates this authoritatively on submit.
function calculateDiscount(
    promotion: Promotion,
    price: number,
    weight: number,
    quantity: number,
): number {
    if (promotion.type === "PERCENTAGE") {
        return price * quantity * (Number(promotion.percentageValue) / 100);
    }

    if (promotion.type === "FIXED") {
        return Number(promotion.fixedValue) * quantity;
    }

    if (promotion.type === "WEIGHTED") {
        const totalWeight = weight * quantity;
        const slab = promotion.slabs.find(
            (s) =>
                totalWeight >= s.minWeight &&
                (s.maxWeight === null || totalWeight <= s.maxWeight),
        );
        return slab ? Number(slab.discountPerUnit) * quantity : 0;
    }

    return 0;
}

function isActive(promotion: Promotion): boolean {
    const now = new Date();
    return (
        promotion.isEnabled &&
        new Date(promotion.startDate) <= now &&
        new Date(promotion.endDate) >= now
    );
}

export default function OrdersPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [orders, setOrders] = useState<any[]>([]);

    const [customerName, setCustomerName] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [cart, setCart] = useState<CartLine[]>([]);

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
        if (existing) {
            setCart(
                cart.map((line) =>
                    line.productId === productId
                        ? { ...line, quantity: line.quantity + 1 }
                        : line,
                ),
            );
        } else {
            setCart([...cart, { productId, quantity: 1 }]);
        }
    }

    function changeQuantity(productId: string, quantity: number) {
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

    // Build cart rows with per-item discount preview
    const cartRows = cart.map((line) => {
        const product = products.find((p) => p.id === line.productId);
        if (!product) {
            return { line, product: null, lineAmount: 0, discount: 0, lineTotal: 0 };
        }

        const price = Number(product.price);
        const lineAmount = price * line.quantity;

        const promotion = promotions.find(
            (promo) => promo.productId === product.id && isActive(promo),
        );
        const discount = promotion
            ? calculateDiscount(promotion, price, product.weight, line.quantity)
            : 0;

        return { line, product, lineAmount, discount, lineTotal: lineAmount - discount };
    });

    const subtotal = cartRows.reduce((sum, row) => sum + row.lineAmount, 0);
    const totalDiscount = cartRows.reduce((sum, row) => sum + row.discount, 0);
    const grandTotal = subtotal - totalDiscount;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!customerName || !customerPhone) {
            alert("Please enter customer name and phone");
            return;
        }
        if (cart.length === 0) {
            alert("Please add at least one product to the cart");
            return;
        }

        await createOrder({ customerName, customerPhone, items: cart });
        setCustomerName("");
        setCustomerPhone("");
        setCart([]);
        loadData();
    }

    return (
        <div className="mx-auto max-w-4xl p-8">
            <h1 className="mb-6 text-2xl font-semibold">Create Order</h1>

            <div className="mb-8 rounded-lg border p-4">
                <h2 className="mb-3 font-medium">Available Products</h2>
                <div className="flex flex-wrap gap-2">
                    {products.map((p) => (
                        <button
                            key={p.id}
                            onClick={() => addToCart(p.id)}
                            className="rounded border px-3 py-2 text-sm hover:bg-slate-100"
                        >
                            {p.name} — {p.price} tk ({p.weight}g)
                        </button>
                    ))}
                    {products.length === 0 && (
                        <p className="text-sm text-slate-500">No enabled products.</p>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="mb-8 rounded-lg border p-4">
                <h2 className="mb-3 font-medium">Customer Information</h2>
                <div className="mb-4 flex gap-3">
                    <input
                        placeholder="Customer name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="flex-1 rounded border px-3 py-2"
                    />
                    <input
                        placeholder="Phone"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="flex-1 rounded border px-3 py-2"
                    />
                </div>

                <h2 className="mb-3 font-medium">Cart</h2>
                {cart.length === 0 ? (
                    <p className="mb-4 text-sm text-slate-500">Cart is empty.</p>
                ) : (
                    <table className="mb-4 w-full border-collapse text-left text-sm">
                        <thead>
                            <tr className="border-b">
                                <th className="py-2">Product</th>
                                <th className="py-2">Qty</th>
                                <th className="py-2">Amount</th>
                                <th className="py-2">Discount</th>
                                <th className="py-2">Line Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cartRows.map((row) => (
                                <tr key={row.line.productId} className="border-b">
                                    <td className="py-2">{row.product?.name}</td>
                                    <td className="py-2">
                                        <input
                                            type="number"
                                            min={0}
                                            value={row.line.quantity}
                                            onChange={(e) =>
                                                changeQuantity(row.line.productId, Number(e.target.value))
                                            }
                                            className="w-16 rounded border px-2 py-1"
                                        />
                                    </td>
                                    <td className="py-2">{row.lineAmount.toFixed(2)}</td>
                                    <td className="py-2 text-green-600">
                                        -{row.discount.toFixed(2)}
                                    </td>
                                    <td className="py-2">{row.lineTotal.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                <div className="mb-4 flex flex-col items-end gap-1 text-sm">
                    <p>Subtotal: {subtotal.toFixed(2)} tk</p>
                    <p className="text-green-600">
                        Total Discount: -{totalDiscount.toFixed(2)} tk
                    </p>
                    <p className="text-lg font-semibold">
                        Grand Total: {grandTotal.toFixed(2)} tk
                    </p>
                </div>

                <button type="submit" className="w-full rounded bg-blue-600 py-2 text-white">
                    Place Order
                </button>
            </form>

            <h2 className="mb-3 text-xl font-semibold">Past Orders</h2>
            <table className="w-full border-collapse text-left text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="py-2">Customer</th>
                        <th className="py-2">Phone</th>
                        <th className="py-2">Subtotal</th>
                        <th className="py-2">Discount</th>
                        <th className="py-2">Grand Total</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.id} className="border-b">
                            <td className="py-2">{order.customerName}</td>
                            <td className="py-2">{order.customerPhone}</td>
                            <td className="py-2">{order.subtotal}</td>
                            <td className="py-2">{order.totalDiscount}</td>
                            <td className="py-2">{order.grandTotal}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
