"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DirectLoginPage() {
    const [email, setEmail] = useState("sanazindustrial@gmail.com");
    const [name, setName] = useState("Sanaz Industrial");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDirectLogin = async (e: React.FormEvent) => {
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
                console.log("Direct login successful:", result);

                // Set session cookie
                document.cookie = `direct-auth=${btoa(JSON.stringify(result.user))}; path=/; max-age=86400; SameSite=Lax`;

                // Force refresh and redirect
                window.location.href = "/dashboard";
            } else {
                alert("Login failed - please try again");
            }
        } catch (error) {
            console.error("Direct login error:", error);
            alert("Login failed - please try again");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-bold">Login to ProfGenie</CardTitle>
                    <CardDescription className="text-center text-green-600">
                        ✅ Direct login system (Google OAuth disabled)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleDirectLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
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
                                Full Name
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
                            {loading ? "Signing in..." : "Sign in to ProfGenie"}
                        </Button>
                    </form>
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Access your AI-powered professor dashboard
                            <br />
                            <span className="font-medium">✨ Full features available</span>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}