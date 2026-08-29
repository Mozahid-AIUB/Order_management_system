"use client";

import { useEffect, useState } from "react";
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

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [draft, setDraft] = useState<Draft>(emptyDraft);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState<Draft>(emptyDraft);

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
            <header className="mb-6">
                <p className="label mb-1">Catalogue</p>
                <h1 className="text-xl font-semibold tracking-tight">Products</h1>
                <p className="mt-1 text-sm text-ink-soft">
                    Disabled products stay in past orders but never appear at the counter.
                </p>
            </header>

            <form
                onSubmit={handleCreate}
                className="mb-8 rounded-lg border border-rule bg-card p-5"
            >
                <p className="label mb-3">Add a product</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <input
                        placeholder="Name"
                        value={draft.name}
                        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                        className="field"
                    />
                    <input
                        placeholder="Description"
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
                    Add product
                </button>
            </form>

            <div className="overflow-x-auto rounded-lg border border-rule bg-card">
                <table className="w-full min-w-[42rem] text-sm">
                    <thead>
                        <tr className="border-b border-rule text-left">
                            <th className="label px-4 py-3 font-semibold">Product</th>
                            <th className="label px-4 py-3 text-right font-semibold">Price</th>
                            <th className="label px-4 py-3 text-right font-semibold">Weight</th>
                            <th className="label px-4 py-3 font-semibold">Status</th>
                            <th className="label px-4 py-3 text-right font-semibold">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) =>
                            editingId === product.id ? (
                                <tr key={product.id} className="border-b border-rule last:border-0">
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
                                            placeholder="Description"
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
                                <tr key={product.id} className="border-b border-rule last:border-0">
                                    <td className="px-4 py-3">
                                        <p className="font-medium">{product.name}</p>
                                        {product.description && (
                                            <p className="text-xs text-ink-soft">{product.description}</p>
                                        )}
                                    </td>
                                    <td className="tnum px-4 py-3 text-right">{product.price}</td>
                                    <td className="tnum px-4 py-3 text-right text-ink-soft">
                                        {product.weight} g
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
                        {products.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-4 py-10 text-center text-sm text-ink-soft">
                                    No products yet. Add your first one above.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
