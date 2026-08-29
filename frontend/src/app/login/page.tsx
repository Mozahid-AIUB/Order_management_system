"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginRequest } from "@/lib/api";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        try {
            const data = await loginRequest(email, password);
            localStorage.setItem("accessToken", data.accessToken);
            router.push("/");
        } catch (err) {
            setError("Invalid email or password");
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-100">
            <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
                <h1 className="mb-6 text-center text-2xl font-semibold text-slate-800">
                    Admin Login
                </h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="rounded-md border border-slate-300 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="rounded-md border border-slate-300 px-3 py-2 text-slate-800 focus:border-blue-500 focus:outline-none"
                    />
                    <button
                        type="submit"
                        className="rounded-md bg-blue-600 py-2 font-medium text-white hover:bg-blue-700"
                    >
                        Login
                    </button>
                    {error && (
                        <p className="text-center text-sm text-red-600">{error}</p>
                    )}
                </form>
            </div>
        </div>
    );
}
