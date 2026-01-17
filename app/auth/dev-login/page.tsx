"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DevLoginPage() {
    const [email, setEmail] = useState("sanazindustrial@gmail.com");
    const [name, setName] = useState("Sanaz Industrial");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDevLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch("/api/auth/dev-login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, name }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log("Dev login successful:", result);

                // Create a session-like cookie for development
                document.cookie = `dev-user=${encodeURIComponent(JSON.stringify(result.user))}; path=/; max-age=86400`;

                // Redirect to dashboard
                router.push("/dashboard");
                router.refresh();
            } else {
                alert("Dev login failed");
            }
        } catch (error) {
            console.error("Dev login error:", error);
            alert("Dev login failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-bold">Development Login</CardTitle>
                    <CardDescription className="text-center text-red-600">
                        ⚠️ For development only - while Google OAuth is being configured
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleDevLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Name
                            </label>
                            <Input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="mt-1"
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={loading}
                        >
                            {loading ? "Signing in..." : "Sign in (Development Mode)"}
                        </Button>
                    </form>
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            This bypasses Google OAuth for development purposes.
                            <br />
                            <a href="/auth/signin" className="text-blue-600 hover:text-blue-500">
                                Try Google OAuth instead
                            </a>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}