"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2 } from "lucide-react"

function SubscriptionSuccessContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [session, setSession] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const sessionId = searchParams.get('session_id')

    const fetchSession = useCallback(async () => {
        try {
            const response = await fetch(`/api/stripe/session?session_id=${sessionId}`)
            const data = await response.json()
            setSession(data.session)
        } catch (error) {
            console.error('Error fetching session:', error)
        } finally {
            setLoading(false)
        }
    }, [sessionId])

    useEffect(() => {
        if (sessionId) {
            fetchSession()
        }
    }, [sessionId, fetchSession])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="mx-auto mb-4 size-8 animate-spin" />
                    <p>Verifying your subscription...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        <CheckCircle className="size-16 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl text-green-700">
                        Subscription Successful!
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-center">
                    <p className="text-gray-600">
                        Welcome to Professor GENIE! Your subscription has been activated successfully.
                    </p>

                    {session && (
                        <div className="rounded-lg bg-green-50 p-4">
                            <p className="text-sm text-green-700">
                                <strong>Amount paid:</strong> ${(session.amount_total / 100).toFixed(2)}
                            </p>
                            <p className="text-sm text-green-700">
                                <strong>Email:</strong> {session.customer_details?.email}
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Button
                            onClick={() => router.push('/dashboard')}
                            className="w-full"
                        >
                            Go to Dashboard
                        </Button>
                        <Button
                            onClick={() => router.push('/subscription/manage')}
                            variant="outline"
                            className="w-full"
                        >
                            Manage Subscription
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function SubscriptionSuccess() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="mx-auto mb-4 size-8 animate-spin" />
                    <p>Loading...</p>
                </div>
            </div>
        }>
            <SubscriptionSuccessContent />
        </Suspense>
    )
}