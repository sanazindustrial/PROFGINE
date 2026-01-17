"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

export default function AuthSuccess() {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        console.log('🚀 Auth Success Page - Session Status:', { status, session })

        if (status === "loading") {
            console.log("⏳ Session loading...")
            return
        }

        if (status === "unauthenticated") {
            console.log("❌ Not authenticated, redirecting to signin")
            router.push("/auth/signin")
            return
        }

        if (session) {
            console.log("✅ Session found, checking redirect destination...")

            // Use the redirect API to determine where to go
            fetch('/api/redirect')
                .then(res => res.json())
                .then(data => {
                    console.log('📍 Redirect API response:', data)
                    if (data.redirectUrl) {
                        console.log('🎯 Redirecting to:', data.redirectUrl)
                        router.push(data.redirectUrl)
                    } else {
                        console.log('🏠 No specific redirect, going to home')
                        router.push('/')
                    }
                })
                .catch(err => {
                    console.error('❌ Redirect API error:', err)
                    // Fallback to home page
                    router.push('/')
                })
        }
    }, [session, status, router])

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="space-y-4 text-center">
                    <div className="mx-auto size-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
                    <p className="text-gray-600">Setting up your account...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="space-y-4 text-center">
                <div className="animate-pulse">
                    <div className="mx-auto mb-2 h-4 w-48 rounded bg-gray-300"></div>
                    <div className="mx-auto h-4 w-32 rounded bg-gray-300"></div>
                </div>
                <p className="text-gray-600">Redirecting to your dashboard...</p>
            </div>
        </div>
    )
}