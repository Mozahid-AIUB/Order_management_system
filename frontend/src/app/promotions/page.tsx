"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    getProducts,
    getPromotions,
    createPromotion,
    updatePromotion,
} from "@/lib/api";

type Product = { id: string; name: string; weight: number };

type Slab = {
    id: string;
    minWeight: number;
    maxWeight: number | null;
    discountPerUnit: string;
    unitWeight: number;
};

type Promotion = {
    id: string;
    title: string;
    type: "PERCENTAGE" | "FIXED" | "WEIGHTED";
    productId: string;
    startDate: string;
    endDate: string;
    isEnabled: boolean;
    percentageValue: string | null;
    fixedValue: string | null;
    slabs: Slab[];
};

type SlabDraft = { minWeight: string; maxWeight: string; discountPerUnit: string };

const emptySlab: SlabDraft = { minWeight: "", maxWeight: "", discountPerUnit: "" };

function describeReward(promo: Promotion): string {
    if (promo.type === "PERCENTAGE") return `${promo.percentageValue}% off`;
    if (promo.type === "FIXED") return `${promo.fixedValue} tk per unit`;
    return `${promo.slabs.length} weight slabs`;
}

type Status = "running" | "paused" | "scheduled" | "expired";

/** Paused beats dates: an admin switching it off is the clearer signal. */
function statusOf(promo: Promotion): Status {
    if (!promo.isEnabled) return "paused";
    const now = new Date();
    if (new Date(promo.startDate) > now) return "scheduled";
    if (new Date(promo.endDate) < now) return "expired";
    return "running";
}

const STATUS_STYLE: Record<Status, string> = {
    running: "bg-stamp-soft text-stamp",
    paused: "bg-flag-soft text-flag",
    scheduled: "bg-paper text-ink-soft",
    expired: "bg-paper text-ink-soft",
};

export default function PromotionsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [promotions, setPromotions] = useState<Promotion[]>([]);

    const [title, setTitle] = useState("");
    const [type, setType] = useState<Promotion["type"]>("PERCENTAGE");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [productId, setProductId] = useState("");
    const [percentageValue, setPercentageValue] = useState("");
    const [fixedValue, setFixedValue] = useState("");
    const [slabs, setSlabs] = useState<SlabDraft[]>([{ ...emptySlab }]);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editStart, setEditStart] = useState("");
    const [editEnd, setEditEnd] = useState("");

    const [formOpen, setFormOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.push("/login");
            return;
        }
        loadData();
    }, []);

    async function loadData() {
        const [prods, promos] = await Promise.all([getProducts(), getPromotions()]);
        setProducts(prods);
        setPromotions(promos);
    }

    function addSlabRow() {
        setSlabs([...slabs, { ...emptySlab }]);
    }

    function removeSlabRow(index: number) {
        setSlabs(slabs.filter((_, i) => i !== index));
    }

    function updateSlab(index: number, field: keyof SlabDraft, value: string) {
        setSlabs(slabs.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();

        if (!title || !startDate || !endDate || !productId) {
            alert("Title, product, start date, and end date are required.");
            return;
        }

        const payload: Record<string, unknown> = {
            title,
            type,
            startDate,
            endDate,
            productId,
        };

        if (type === "PERCENTAGE") payload.percentageValue = Number(percentageValue);
        if (type === "FIXED") payload.fixedValue = Number(fixedValue);
        if (type === "WEIGHTED") {
            payload.slabs = slabs
                .filter((s) => s.minWeight && s.discountPerUnit)
                .map((s) => ({
                    minWeight: Number(s.minWeight),
                    maxWeight: s.maxWeight ? Number(s.maxWeight) : undefined,
                    discountPerUnit: Number(s.discountPerUnit),
                }));
        }

        await createPromotion(payload);
        setTitle("");
        setStartDate("");
        setEndDate("");
        setPercentageValue("");
        setFixedValue("");
        setSlabs([{ ...emptySlab }]);
        loadData();
    }

    function startEdit(promo: Promotion) {
        setEditingId(promo.id);
        setEditTitle(promo.title);
        setEditStart(promo.startDate.slice(0, 10));
        setEditEnd(promo.endDate.slice(0, 10));
    }

    async function saveEdit(id: string) {
        await updatePromotion(id, {
            title: editTitle,
            startDate: editStart,
            endDate: editEnd,
        });
        setEditingId(null);
        loadData();
    }

    async function toggle(promo: Promotion) {
        await updatePromotion(promo.id, { isEnabled: !promo.isEnabled });
        loadData();
    }

    const productName = (id: string) =>
        products.find((p) => p.id === id)?.name ?? "Unknown product";

    return (
        <main className="mx-auto w-full max-w-5xl px-6 py-8">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="label mb-1">Pricing rules</p>
                    <h1 className="text-xl font-semibold tracking-tight">Promotions</h1>
                    <p className="mt-1 text-sm text-ink-soft">
                        Once a promotion is running, only its title and dates can change.
                    </p>
                </div>

                <button
                    onClick={() => setFormOpen((v) => !v)}
                    className="btn btn-primary"
                    aria-expanded={formOpen}
                >
                    {formOpen ? "Close" : "New promotion"}
                </button>
            </header>

            <form
                onSubmit={handleCreate}
                className={`mb-6 rounded-lg border border-rule bg-card p-5 ${formOpen ? "" : "hidden"}`}
            >
                <p className="label mb-3">Create a promotion</p>

                <div className="grid gap-3 sm:grid-cols-2">
                    <input
                        placeholder="Title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="field"
                    />
                    <select
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                        className="field"
                    >
                        <option value="">Select product</option>
                        {products.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div>
                        <label className="label mb-1.5 block">Discount type</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as Promotion["type"])}
                            className="field"
                        >
                            <option value="PERCENTAGE">Percentage</option>
                            <option value="FIXED">Fixed per unit</option>
                            <option value="WEIGHTED">Weighted slabs</option>
                        </select>
                    </div>
                    <div>
                        <label className="label mb-1.5 block">Starts</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="field tnum"
                        />
                    </div>
                    <div>
                        <label className="label mb-1.5 block">Ends</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="field tnum"
                        />
                    </div>
                </div>

                {type === "PERCENTAGE" && (
                    <div className="mt-3 max-w-xs">
                        <label className="label mb-1.5 block">Percentage off</label>
                        <input
                            placeholder="10"
                            inputMode="decimal"
                            value={percentageValue}
                            onChange={(e) => setPercentageValue(e.target.value)}
                            className="field tnum"
                        />
                    </div>
                )}

                {type === "FIXED" && (
                    <div className="mt-3 max-w-xs">
                        <label className="label mb-1.5 block">Taka off per unit</label>
                        <input
                            placeholder="50"
                            inputMode="decimal"
                            value={fixedValue}
                            onChange={(e) => setFixedValue(e.target.value)}
                            className="field tnum"
                        />
                    </div>
                )}

                {type === "WEIGHTED" && (
                    <div className="mt-4 rounded border border-rule bg-paper p-4">
                        <p className="label mb-1">Weight slabs</p>
                        <p className="mb-3 text-xs text-ink-soft">
                            The cart&rsquo;s total weight for this product picks one slab. Leave the
                            maximum blank on the last slab to mean unlimited.
                        </p>

                        <div className="flex flex-col gap-2">
                            {slabs.map((slab, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <span className="tnum w-6 shrink-0 text-xs text-ink-soft">
                                        {i + 1}
                                    </span>
                                    <input
                                        placeholder="Min g"
                                        inputMode="numeric"
                                        value={slab.minWeight}
                                        onChange={(e) => updateSlab(i, "minWeight", e.target.value)}
                                        className="field tnum"
                                    />
                                    <input
                                        placeholder="Max g"
                                        inputMode="numeric"
                                        value={slab.maxWeight}
                                        onChange={(e) => updateSlab(i, "maxWeight", e.target.value)}
                                        className="field tnum"
                                    />
                                    <input
                                        placeholder="tk / 500g"
                                        inputMode="decimal"
                                        value={slab.discountPerUnit}
                                        onChange={(e) =>
                                            updateSlab(i, "discountPerUnit", e.target.value)
                                        }
                                        className="field tnum"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeSlabRow(i)}
                                        disabled={slabs.length === 1}
                                        aria-label={`Remove slab ${i + 1}`}
                                        className="shrink-0 rounded px-2 py-1 text-sm text-ink-soft hover:text-flag disabled:opacity-30"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={addSlabRow}
                            className="btn btn-quiet mt-3"
                        >
                            Add slab
                        </button>
                    </div>
                )}

                <button type="submit" className="btn btn-primary mt-4">
                    Create promotion
                </button>
            </form>

            {/* Filter by lifecycle - paused and expired rules stay visible but out of the way. */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
                {(["all", "running", "paused", "scheduled", "expired"] as const).map((s) => {
                    const count =
                        s === "all"
                            ? promotions.length
                            : promotions.filter((p) => statusOf(p) === s).length;
                    return (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`rounded px-3 py-1.5 text-sm capitalize transition-colors ${statusFilter === s
                                ? "bg-stamp text-white"
                                : "border border-rule bg-card text-ink-soft hover:text-ink"
                                }`}
                        >
                            {s} <span className="tnum opacity-70">{count}</span>
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col gap-3">
                {promotions
                    .filter((p) => statusFilter === "all" || statusOf(p) === statusFilter)
                    .map((promo) => (
                    <article
                        key={promo.id}
                        className="rounded-lg border border-rule bg-card p-5"
                    >
                        {editingId === promo.id ? (
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="sm:col-span-3">
                                    <label className="label mb-1.5 block">Title</label>
                                    <input
                                        value={editTitle}
                                        onChange={(e) => setEditTitle(e.target.value)}
                                        className="field"
                                    />
                                </div>
                                <div>
                                    <label className="label mb-1.5 block">Starts</label>
                                    <input
                                        type="date"
                                        value={editStart}
                                        onChange={(e) => setEditStart(e.target.value)}
                                        className="field tnum"
                                    />
                                </div>
                                <div>
                                    <label className="label mb-1.5 block">Ends</label>
                                    <input
                                        type="date"
                                        value={editEnd}
                                        onChange={(e) => setEditEnd(e.target.value)}
                                        className="field tnum"
                                    />
                                </div>
                                <div className="flex items-end gap-2">
                                    <button
                                        onClick={() => saveEdit(promo.id)}
                                        className="btn btn-primary"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="btn btn-quiet"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="font-medium">{promo.title}</h2>
                                            <span
                                                className={`rounded px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[statusOf(promo)]}`}
                                            >
                                                {statusOf(promo)}
                                            </span>
                                            <span className="label">{promo.type.toLowerCase()}</span>
                                        </div>
                                        <p className="mt-1 text-sm text-ink-soft">
                                            {productName(promo.productId)} · {describeReward(promo)}
                                        </p>
                                        <p className="tnum mt-1 text-xs text-ink-soft">
                                            {promo.startDate.slice(0, 10)} → {promo.endDate.slice(0, 10)}
                                        </p>
                                    </div>

                                    <div className="flex gap-2">
                                        <button onClick={() => startEdit(promo)} className="btn btn-quiet">
                                            Edit
                                        </button>
                                        <button onClick={() => toggle(promo)} className="btn btn-quiet">
                                            {promo.isEnabled ? "Pause" : "Resume"}
                                        </button>
                                    </div>
                                </div>

                                {promo.slabs.length > 0 && (
                                    <div className="mt-4 border-t border-rule pt-3">
                                        <table className="tnum w-full text-xs">
                                            <thead>
                                                <tr className="text-left text-ink-soft">
                                                    <th className="pb-1 font-normal">Slab</th>
                                                    <th className="pb-1 font-normal">Weight range</th>
                                                    <th className="pb-1 text-right font-normal">
                                                        Discount / 500g
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {promo.slabs.map((slab, i) => (
                                                    <tr key={slab.id}>
                                                        <td className="py-0.5 text-ink-soft">{i + 1}</td>
                                                        <td className="py-0.5">
                                                            {slab.minWeight.toLocaleString()} g –{" "}
                                                            {slab.maxWeight
                                                                ? `${slab.maxWeight.toLocaleString()} g`
                                                                : "unlimited"}
                                                        </td>
                                                        <td className="py-0.5 text-right text-stamp">
                                                            {slab.discountPerUnit} tk
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </>
                        )}
                    </article>
                ))}

                {promotions.length === 0 && (
                    <p className="rounded-lg border border-rule bg-card px-4 py-12 text-center text-sm text-ink-soft">
                        No promotions yet. Create one above.
                    </p>
                )}

                {promotions.length > 0 &&
                    promotions.filter(
                        (p) => statusFilter === "all" || statusOf(p) === statusFilter,
                    ).length === 0 && (
                        <p className="rounded-lg border border-rule bg-card px-4 py-12 text-center text-sm text-ink-soft">
                            Nothing {statusFilter} right now.
                        </p>
                    )}
            </div>
        </main>
    );
}
