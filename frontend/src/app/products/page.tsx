"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getProducts, createProduct, updateProduct } from "@/lib/api";

type Product = {
    id: string;
    name: string;
    description: string | null;
    price: string;
    weight: number;
    isEnabled: boolean;
};

type Draft = {
    name: string;
    description: string;
    price: string;
    weight: string;
};

const emptyDraft: Draft = { name: "", description: "", price: "", weight: "" };

/** Descriptions follow "Category - detail", so the catalogue groups itself. */
function categoryOf(description: string | null): string {
    if (!description) return "Uncategorised";
    const [head, ...rest] = description.split(" - ");
    return rest.length > 0 ? head.trim() : "Uncategorised";
}

function detailOf(description: string | null): string {
    if (!description) return "";
    const parts = description.split(" - ");
    return parts.length > 1 ? parts.slice(1).join(" - ") : description;
}

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [draft, setDraft] = useState<Draft>(emptyDraft);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);
    const [formOpen, setFormOpen] = useState(false);

    const [query, setQuery] = useState("");
    const [category, setCategory] = useState("All");
    const [showHidden, setShowHidden] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.push("/login");
            return;
        }
        loadProducts();
    }, []);

    async function loadProducts() {
        setProducts(await getProducts());
    }

    const categories = useMemo(() => {
        const seen = new Set(products.map((p) => categoryOf(p.description)));
        return ["All", ...Array.from(seen).sort()];
    }, [products]);

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return products.filter((p) => {
            if (!showHidden && !p.isEnabled) return false;
            if (category !== "All" && categoryOf(p.description) !== category) return false;
            if (!q) return true;
            return (
                p.name.toLowerCase().includes(q) ||
                (p.description ?? "").toLowerCase().includes(q)
            );
        });
    }, [products, query, category, showHidden]);

    const hiddenCount = products.filter((p) => !p.isEnabled).length;

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!draft.name || !draft.price || !draft.weight) {
            alert("Name, price, and weight are required.");
            return;
        }
        await createProduct({
            name: draft.name,
            description: draft.description,
            price: Number(draft.price),
            weight: Number(draft.weight),
        });
        setDraft(emptyDraft);
        setFormOpen(false);
        loadProducts();
    }

    function startEdit(product: Product) {
        setEditingId(product.id);
        setEditDraft({
            name: product.name,
            description: product.description ?? "",
            price: product.price,
            weight: String(product.weight),
        });
    }

    async function saveEdit(id: string) {
        await updateProduct(id, {
            name: editDraft.name,
            description: editDraft.description,
            price: Number(editDraft.price),
            weight: Number(editDraft.weight),
        });
        setEditingId(null);
        loadProducts();
    }

    async function toggle(product: Product) {
        await updateProduct(product.id, { isEnabled: !product.isEnabled });
        loadProducts();
    }

    return (
        <main className="mx-auto w-full max-w-5xl px-6 py-8">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="label mb-1">Catalogue</p>
                    <h1 className="text-xl font-semibold tracking-tight">Products</h1>
                    <p className="mt-1 text-sm text-ink-soft">
                        <span className="tnum">{products.length}</span> items ·{" "}
                        <span className="tnum">{hiddenCount}</span> hidden from the counter
                    </p>
                </div>

                <button
                    onClick={() => setFormOpen((v) => !v)}
                    className="btn btn-primary"
                    aria-expanded={formOpen}
                >
                    {formOpen ? "Close" : "Add product"}
                </button>
            </header>

            {formOpen && (
                <form
                    onSubmit={handleCreate}
                    className="mb-6 rounded-lg border border-rule bg-card p-5"
                >
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <input
                            placeholder="Name"
                            value={draft.name}
                            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                            className="field"
                            autoFocus
                        />
                        <input
                            placeholder="Category - detail"
                            value={draft.description}
                            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                            className="field"
                        />
                        <input
                            placeholder="Price (tk)"
                            inputMode="decimal"
                            value={draft.price}
                            onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                            className="field tnum"
                        />
                        <input
                            placeholder="Weight (g)"
                            inputMode="numeric"
                            value={draft.weight}
                            onChange={(e) => setDraft({ ...draft, weight: e.target.value })}
                            className="field tnum"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary mt-4">
                        Save product
                    </button>
                </form>
            )}

            {/* Filters */}
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <input
                    type="search"
                    placeholder="Search products…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="field max-w-xs"
                />

                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="field w-auto"
                >
                    {categories.map((c) => (
                        <option key={c} value={c}>
                            {c === "All" ? "All categories" : c}
                        </option>
                    ))}
                </select>

                <label className="flex items-center gap-2 text-sm text-ink-soft">
                    <input
                        type="checkbox"
                        checked={showHidden}
                        onChange={(e) => setShowHidden(e.target.checked)}
                        className="accent-stamp"
                    />
                    Show hidden
                </label>

                <span className="tnum ml-auto text-sm text-ink-soft">
                    {visible.length} shown
                </span>
            </div>

            {/* The catalogue runs long, so the table scrolls under a pinned header. */}
            <div className="overflow-hidden rounded-lg border border-rule bg-card">
                <div className="max-h-[60vh] overflow-auto">
                    <table className="w-full min-w-[44rem] text-sm">
                        <thead className="sticky top-0 z-10 bg-card">
                            <tr className="border-b border-rule text-left">
                                <th className="label px-4 py-3 font-semibold">Product</th>
                                <th className="label px-4 py-3 text-right font-semibold">Price</th>
                                <th className="label px-4 py-3 text-right font-semibold">Weight</th>
                                <th className="label px-4 py-3 font-semibold">Status</th>
                                <th className="label px-4 py-3 text-right font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visible.map((product) =>
                                editingId === product.id ? (
                                    <tr key={product.id} className="border-b border-rule">
                                        <td className="px-4 py-3">
                                            <input
                                                value={editDraft.name}
                                                onChange={(e) =>
                                                    setEditDraft({ ...editDraft, name: e.target.value })
                                                }
                                                className="field mb-2"
                                            />
                                            <input
                                                value={editDraft.description}
                                                onChange={(e) =>
                                                    setEditDraft({ ...editDraft, description: e.target.value })
                                                }
                                                placeholder="Category - detail"
                                                className="field"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                value={editDraft.price}
                                                inputMode="decimal"
                                                onChange={(e) =>
                                                    setEditDraft({ ...editDraft, price: e.target.value })
                                                }
                                                className="field tnum"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                value={editDraft.weight}
                                                inputMode="numeric"
                                                onChange={(e) =>
                                                    setEditDraft({ ...editDraft, weight: e.target.value })
                                                }
                                                className="field tnum"
                                            />
                                        </td>
                                        <td className="px-4 py-3 text-ink-soft">—</td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => saveEdit(product.id)}
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
                                        </td>
                                    </tr>
                                ) : (
                                    <tr
                                        key={product.id}
                                        className="border-b border-rule transition-colors last:border-0 hover:bg-paper"
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-medium">{product.name}</p>
                                            <p className="mt-0.5 text-xs text-ink-soft">
                                                <span className="uppercase tracking-wide">
                                                    {categoryOf(product.description)}
                                                </span>
                                                {detailOf(product.description) && (
                                                    <> · {detailOf(product.description)}</>
                                                )}
                                            </p>
                                        </td>
                                        <td className="tnum px-4 py-3 text-right">{product.price}</td>
                                        <td className="tnum px-4 py-3 text-right text-ink-soft">
                                            {product.weight.toLocaleString()} g
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${product.isEnabled
                                                    ? "bg-stamp-soft text-stamp"
                                                    : "bg-flag-soft text-flag"
                                                    }`}
                                            >
                                                {product.isEnabled ? "On sale" : "Hidden"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => startEdit(product)}
                                                    className="btn btn-quiet"
                                                >
                                                    Edit
                                                </button>
                                                <button onClick={() => toggle(product)} className="btn btn-quiet">
                                                    {product.isEnabled ? "Hide" : "Show"}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ),
                            )}
                            {visible.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-ink-soft">
                                        {products.length === 0
                                            ? "No products yet. Add your first one above."
                                            : "Nothing matches those filters."}
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
