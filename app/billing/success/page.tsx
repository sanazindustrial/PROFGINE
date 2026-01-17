"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight } from "lucide-react"
import Link from "next/link"

function BillingSuccessContent() {
    const searchParams = useSearchParams()
    const sessionId = searchParams.get('session_id')
    const [loading, setLoading] = useState(true)
    const [sessionData, setSessionData] = useState<any>(null)

    useEffect(() => {
        if (sessionId) {
            // Fetch session details to confirm payment
            fetch(`/api/stripe/session?session_id=${sessionId}`)
                .then(res => res.json())
                .then(data => {
                    setSessionData(data)
                    setLoading(false)
                })
                .catch(err => {
                    console.error('Error fetching session:', err)
                    setLoading(false)
                })
        } else {
            setLoading(false)
        }
    }, [sessionId])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-pulse">Processing your subscription...</div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md space-y-6 p-6">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 size-12 text-green-500">
                            <CheckCircle className="size-full" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-green-900">
                            Subscription Activated!
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2 text-center">
                            <p className="text-gray-600">
                                Thank you for subscribing to Professor GENIE! Your subscription is now active and you have access to all premium features.
                            </p>
                            {sessionData?.subscription && (
                                <p className="text-sm text-gray-500">
                                    Subscription ID: {sessionData.subscription}
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Button asChild className="w-full">
                                <Link href="/dashboard">
                                    Go to Dashboard
                                    <ArrowRight className="ml-2 size-4" />
                                </Link>
                            </Button>

                            <Button variant="outline" asChild className="w-full">
                                <Link href="/subscription/manage">
                                    Manage Subscription
                                </Link>
                            </Button>
                        </div>

                        <div className="text-center text-xs text-gray-500">
                            You will receive a confirmation email shortly. If you have any questions, please contact support.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

export default function BillingSuccess() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <div className="animate-pulse">Loading...</div>
            </div>
        }>
            <BillingSuccessContent />
        </Suspense>
    )
}