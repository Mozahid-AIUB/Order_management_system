"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginRequest } from "@/lib/api";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");
        setBusy(true);

        try {
            const data = await loginRequest(email, password);
            localStorage.setItem("accessToken", data.accessToken);
            router.push("/orders");
        } catch {
            setError("That email and password don't match an account.");
            setBusy(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center px-6">
            <div className="w-full max-w-sm">
                <div className="mb-8">
                    <p className="label mb-2">Counter terminal</p>
                    <h1 className="text-2xl font-semibold tracking-tight">Order Desk</h1>
                    <p className="mt-1 text-sm text-ink-soft">
                        Sign in to take orders and manage promotions.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="rounded-lg border border-rule bg-card p-6"
                >
                    <div className="mb-4">
                        <label htmlFor="email" className="label mb-1.5 block">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="field"
                        />
                    </div>

                    <div className="mb-5">
                        <label htmlFor="password" className="label mb-1.5 block">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="field"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={busy}
                        className="btn btn-primary w-full disabled:opacity-60"
                    >
                        {busy ? "Signing in…" : "Sign in"}
                    </button>

                    {error && (
                        <p className="mt-4 rounded border border-flag/30 bg-flag-soft px-3 py-2 text-sm text-flag">
                            {error}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
