"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, ArrowLeft, CreditCard } from "lucide-react"
import Link from "next/link"

export default function BillingCancel() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <div className="w-full max-w-md space-y-6 p-6">
                <Card>
                    <CardHeader className="text-center">
                        <div className="mx-auto mb-4 size-12 text-yellow-500">
                            <XCircle className="size-full" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">
                            Subscription Cancelled
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2 text-center">
                            <p className="text-gray-600">
                                You cancelled your subscription checkout. No charges have been made to your account.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Button asChild className="w-full">
                                <Link href="/subscription/upgrade">
                                    <CreditCard className="mr-2 size-4" />
                                    Try Again
                                </Link>
                            </Button>

                            <Button variant="outline" asChild className="w-full">
                                <Link href="/dashboard">
                                    <ArrowLeft className="mr-2 size-4" />
                                    Back to Dashboard
                                </Link>
                            </Button>
                        </div>

                        <div className="text-center text-xs text-gray-500">
                            Need help? Contact our support team for assistance.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}