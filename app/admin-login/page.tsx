"use client";

import { signIn, getProviders } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";

export default function AdminLoginPage() {
    const [providers, setProviders] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadProviders = async () => {
            const res = await getProviders();
            setProviders(res);
        };
        loadProviders();
    }, []);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            await signIn("google", {
                callbackUrl: "/user-management"  // Redirect to admin panel after login
            });
        } catch (error) {
            console.error("Sign in error:", error);
            alert("Sign in failed. Please try again or contact an administrator.");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-bold">Login to Professor GENIE Platform</CardTitle>
                    <CardDescription className="text-center">
                        Sign in with your Google account to access admin features
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="rounded-lg border bg-blue-50 p-4">
                            <h3 className="font-semibold text-blue-900">Admin Access:</h3>
                            <p className="text-sm text-blue-700">Use your Google account (sanazindustrial@gmail.com) to access admin features</p>
                        </div>

                        {providers?.google ? (
                            <Button
                                onClick={handleGoogleSignIn}
                                disabled={loading}
                                variant="outline"
                                className="h-12 w-full border-gray-300 hover:bg-gray-50"
                                size="lg"
                            >
                                <Icons.google className="mr-2 size-4" />
                                {loading ? "Signing in..." : "Sign in with Google"}
                            </Button>
                        ) : (
                            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4">
                                <p className="text-sm text-yellow-800">
                                    Google authentication is not configured. Please contact the administrator.
                                </p>
                            </div>
                        )}

                        <div className="text-center text-sm text-gray-600">
                            <p>This will give you access to:</p>
                            <ul className="mt-2 space-y-1 text-xs">
                                <li>• User Management</li>
                                <li>• AI Management</li>
                                <li>• Subscription Management</li>
                                <li>• Invite Users</li>
                                <li>• Full features available</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}