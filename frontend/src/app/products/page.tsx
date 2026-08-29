"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProducts, createProduct, toggleProduct } from "@/lib/api";

type Product = {
    id: string;
    name: string;
    description: string | null;
    price: string;
    weight: number;
    isEnabled: boolean;
};

export default function ProductsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [weight, setWeight] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.push("/login");
            return;
        }
        loadProducts();
    }, []);

    async function loadProducts() {
        const data = await getProducts();
        setProducts(data);
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        await createProduct({
            name,
            description,
            price: Number(price),
            weight: Number(weight),
        });
        setName("");
        setDescription("");
        setPrice("");
        setWeight("");
        loadProducts();
    }

    async function handleToggle(id: string, current: boolean) {
        await toggleProduct(id, !current);
        loadProducts();
    }

    return (
        <div className="mx-auto max-w-3xl p-8">
            <h1 className="mb-6 text-2xl font-semibold">Products</h1>

            <form onSubmit={handleCreate} className="mb-8 flex flex-col gap-3 rounded-lg border p-4">
                <input
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded border px-3 py-2"
                />
                <input
                    placeholder="Description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rounded border px-3 py-2"
                />
                <input
                    placeholder="Price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="rounded border px-3 py-2"
                />
                <input
                    placeholder="Weight (gram)"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="rounded border px-3 py-2"
                />
                <button type="submit" className="rounded bg-blue-600 py-2 text-white">
                    Add Product
                </button>
            </form>

            <table className="w-full border-collapse text-left">
                <thead>
                    <tr className="border-b">
                        <th className="py-2">Name</th>
                        <th className="py-2">Price</th>
                        <th className="py-2">Weight</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((p) => (
                        <tr key={p.id} className="border-b">
                            <td className="py-2">{p.name}</td>
                            <td className="py-2">{p.price}</td>
                            <td className="py-2">{p.weight}g</td>
                            <td className="py-2">{p.isEnabled ? "Enabled" : "Disabled"}</td>
                            <td className="py-2">
                                <button
                                    onClick={() => handleToggle(p.id, p.isEnabled)}
                                    className="rounded bg-slate-200 px-3 py-1"
                                >
                                    {p.isEnabled ? "Disable" : "Enable"}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
