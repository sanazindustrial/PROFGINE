"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EyeOff, Loader2, CheckCircle } from "lucide-react";

export function SignOutAllSessionsButton() {
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleClick() {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/invalidate-sessions", {
                method: "POST",
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Failed to invalidate sessions");
            }
            setDone(true);
        } catch (e: any) {
            setError(e.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        return (
            <Button variant="outline" className="w-full" disabled>
                <CheckCircle className="mr-2 size-4 text-green-500" />
                All Other Sessions Signed Out
            </Button>
        );
    }

    return (
        <>
            <Button
                variant="outline"
                className="w-full"
                onClick={handleClick}
                disabled={loading}
            >
                {loading ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                    <EyeOff className="mr-2 size-4" />
                )}
                Sign Out All Other Sessions
            </Button>
            {error && (
                <p className="mt-1 text-xs text-red-500">{error}</p>
            )}
        </>
    );
}
