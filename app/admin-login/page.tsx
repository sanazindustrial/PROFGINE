"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";

export default function AdminLoginPage() {
    const [loading, setLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        setLoading(true);
        try {
            await signIn("google", {
                callbackUrl: "/auth/success"
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
                    <CardTitle className="text-center text-2xl font-bold">Login to ProfGenie Platform</CardTitle>
                    <CardDescription className="text-center">
                        Sign in with your Google account to access admin features
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="rounded-lg border bg-blue-50 p-4">
                            <h3 className="font-semibold text-blue-900">Admin Access:</h3>
                            <p className="text-sm text-blue-700">Use an invited admin Google account to access admin features</p>
                        </div>

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