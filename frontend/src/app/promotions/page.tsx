"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProducts, getPromotions, createPromotion, updatePromotion } from "@/lib/api";

type Slab = { minWeight: string; maxWeight: string; discountPerUnit: string };

export default function PromotionsPage() {
    const router = useRouter();
    const [products, setProducts] = useState<any[]>([]);
    const [promotions, setPromotions] = useState<any[]>([]);

    const [title, setTitle] = useState("");
    const [type, setType] = useState("PERCENTAGE");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [productId, setProductId] = useState("");
    const [percentageValue, setPercentageValue] = useState("");
    const [fixedValue, setFixedValue] = useState("");
    const [slabs, setSlabs] = useState<Slab[]>([{ minWeight: "", maxWeight: "", discountPerUnit: "" }]);

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            router.push("/login");
            return;
        }
        loadData();
    }, []);

    async function loadData() {
        const [p, promos] = await Promise.all([getProducts(), getPromotions()]);
        setProducts(p);
        setPromotions(promos);
    }

    function addSlabRow() {
        setSlabs([...slabs, { minWeight: "", maxWeight: "", discountPerUnit: "" }]);
    }

    function updateSlab(index: number, field: keyof Slab, value: string) {
        const updated = [...slabs];
        updated[index][field] = value;
        setSlabs(updated);
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();

        if (!title || !startDate || !endDate || !productId) {
            alert("Please fill in Title, Product, Start Date, and End Date");
            return;
        }

        const payload: any = {
            title,
            type,
            startDate,
            endDate,
            productId,
        };

        if (type === "PERCENTAGE") payload.percentageValue = Number(percentageValue);
        if (type === "FIXED") payload.fixedValue = Number(fixedValue);
        if (type === "WEIGHTED") {
            payload.slabs = slabs.map((s) => ({
                minWeight: Number(s.minWeight),
                maxWeight: s.maxWeight ? Number(s.maxWeight) : undefined,
                discountPerUnit: Number(s.discountPerUnit),
            }));
        }

        await createPromotion(payload);
        setTitle("");
        setStartDate("");
        setEndDate("");
        setSlabs([{ minWeight: "", maxWeight: "", discountPerUnit: "" }]);
        loadData();
    }

    async function handleToggle(id: string, current: boolean) {
        await updatePromotion(id, { isEnabled: !current });
        loadData();
    }

    return (
        <div className="mx-auto max-w-3xl p-8">
            <h1 className="mb-6 text-2xl font-semibold">Promotions</h1>

            <form onSubmit={handleCreate} className="mb-8 flex flex-col gap-3 rounded-lg border p-4">
                <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border px-3 py-2" />

                <select value={productId} onChange={(e) => setProductId(e.target.value)} className="rounded border px-3 py-2">
                    <option value="">Select Product</option>
                    {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>

                <select value={type} onChange={(e) => setType(e.target.value)} className="rounded border px-3 py-2">
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed</option>
                    <option value="WEIGHTED">Weighted</option>
                </select>

                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded border px-3 py-2" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded border px-3 py-2" />

                {type === "PERCENTAGE" && (
                    <input placeholder="Percentage (e.g. 10)" value={percentageValue} onChange={(e) => setPercentageValue(e.target.value)} className="rounded border px-3 py-2" />
                )}

                {type === "FIXED" && (
                    <input placeholder="Fixed amount" value={fixedValue} onChange={(e) => setFixedValue(e.target.value)} className="rounded border px-3 py-2" />
                )}

                {type === "WEIGHTED" && (
                    <div className="flex flex-col gap-2">
                        <p className="font-medium">Slabs (weight in grams)</p>
                        {slabs.map((slab, i) => (
                            <div key={i} className="flex gap-2">
                                <input placeholder="Min weight" value={slab.minWeight} onChange={(e) => updateSlab(i, "minWeight", e.target.value)} className="rounded border px-2 py-1" />
                                <input placeholder="Max weight (optional)" value={slab.maxWeight} onChange={(e) => updateSlab(i, "maxWeight", e.target.value)} className="rounded border px-2 py-1" />
                                <input placeholder="Discount per 500g" value={slab.discountPerUnit} onChange={(e) => updateSlab(i, "discountPerUnit", e.target.value)} className="rounded border px-2 py-1" />
                            </div>
                        ))}
                        <button type="button" onClick={addSlabRow} className="w-fit rounded bg-slate-200 px-3 py-1 text-sm">
                            + Add Slab
                        </button>
                    </div>
                )}

                <button type="submit" className="rounded bg-blue-600 py-2 text-white">
                    Create Promotion
                </button>
            </form>

            <table className="w-full border-collapse text-left">
                <thead>
                    <tr className="border-b">
                        <th className="py-2">Title</th>
                        <th className="py-2">Type</th>
                        <th className="py-2">Dates</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {promotions.map((promo) => (
                        <tr key={promo.id} className="border-b">
                            <td className="py-2">{promo.title}</td>
                            <td className="py-2">{promo.type}</td>
                            <td className="py-2">{promo.startDate?.slice(0, 10)} - {promo.endDate?.slice(0, 10)}</td>
                            <td className="py-2">{promo.isEnabled ? "Enabled" : "Disabled"}</td>
                            <td className="py-2">
                                <button onClick={() => handleToggle(promo.id, promo.isEnabled)} className="rounded bg-slate-200 px-3 py-1">
                                    {promo.isEnabled ? "Disable" : "Enable"}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
