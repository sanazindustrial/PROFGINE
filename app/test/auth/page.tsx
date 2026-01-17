"use client"

import { useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthTestPage() {
    const { data: session, status } = useSession()
    const [testResults, setTestResults] = useState<any[]>([])

    const addTestResult = (test: string, result: any) => {
        const timestamp = new Date().toLocaleTimeString()
        setTestResults(prev => [...prev, { timestamp, test, result }])
    }

    const testDatabaseConnection = async () => {
        try {
            const response = await fetch('/api/debug/user')
            const result = await response.json()
            addTestResult('Database Connection', result)
        } catch (error) {
            addTestResult('Database Connection', { error: error instanceof Error ? error.message : 'Unknown error' })
        }
    }

    const testSessionEndpoint = async () => {
        try {
            const response = await fetch('/api/debug/session')
            const result = await response.json()
            addTestResult('Session Endpoint', result)
        } catch (error) {
            addTestResult('Session Endpoint', { error: error instanceof Error ? error.message : 'Unknown error' })
        }
    }

    const testRedirectLogic = async () => {
        try {
            const response = await fetch('/api/redirect')
            const result = await response.json()
            addTestResult('Redirect Logic', result)
        } catch (error) {
            addTestResult('Redirect Logic', { error: error instanceof Error ? error.message : 'Unknown error' })
        }
    }

    const testGoogleAuth = async () => {
        try {
            addTestResult('Google Auth', 'Starting Google sign in...')
            await signIn("google", { callbackUrl: "/auth/success" })
        } catch (error) {
            addTestResult('Google Auth', { error: error instanceof Error ? error.message : 'Unknown error' })
        }
    }

    const clearResults = () => {
        setTestResults([])
    }

    return (
        <div className="container mx-auto space-y-6 p-8">
            <Card>
                <CardHeader>
                    <CardTitle>🧪 Authentication Testing Suite</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">

                    {/* Current Status */}
                    <div className="rounded bg-blue-50 p-4">
                        <h3 className="mb-2 font-semibold">Current Status</h3>
                        <div className="space-y-1 text-sm">
                            <p><strong>Session Status:</strong> {status}</p>
                            <p><strong>Authenticated:</strong> {!!session ? 'Yes' : 'No'}</p>
                            {session && (
                                <>
                                    <p><strong>Email:</strong> {session.user?.email}</p>
                                    <p><strong>Role:</strong> {session.user?.role || 'Not set'}</p>
                                    <p><strong>Subscription:</strong> {session.user?.subscriptionType || 'Not set'}</p>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Test Buttons */}
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                        <Button onClick={testDatabaseConnection} size="sm">
                            Test DB
                        </Button>
                        <Button onClick={testSessionEndpoint} size="sm">
                            Test Session
                        </Button>
                        <Button onClick={testRedirectLogic} size="sm">
                            Test Redirect
                        </Button>
                        {!session ? (
                            <Button onClick={testGoogleAuth} size="sm" className="bg-blue-600">
                                Test Google Auth
                            </Button>
                        ) : (
                            <Button onClick={() => signOut()} size="sm" variant="destructive">
                                Sign Out
                            </Button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={clearResults} variant="outline" size="sm">
                            Clear Results
                        </Button>
                        <Button
                            onClick={() => window.location.href = '/debug/auth'}
                            variant="outline"
                            size="sm"
                        >
                            Advanced Debug
                        </Button>
                    </div>

                    {/* Test Results */}
                    {testResults.length > 0 && (
                        <div className="max-h-96 overflow-auto rounded bg-gray-50 p-4">
                            <h3 className="mb-2 font-semibold">Test Results</h3>
                            <div className="space-y-2 text-sm">
                                {testResults.map((test, index) => (
                                    <div key={index} className="border-l-2 border-blue-200 pl-3">
                                        <div className="font-medium text-gray-600">
                                            [{test.timestamp}] {test.test}
                                        </div>
                                        <pre className="mt-1 overflow-auto rounded bg-white p-2 text-xs">
                                            {JSON.stringify(test.result, null, 2)}
                                        </pre>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="rounded bg-yellow-50 p-4">
                        <h3 className="mb-2 font-semibold">Quick Actions</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => window.location.href = '/'}
                                    variant="outline"
                                    size="sm"
                                >
                                    Go Home (trigger redirect)
                                </Button>
                                <Button
                                    onClick={() => window.location.href = '/trial-dashboard'}
                                    variant="outline"
                                    size="sm"
                                >
                                    Trial Dashboard
                                </Button>
                                <Button
                                    onClick={() => window.location.href = '/dashboard'}
                                    variant="outline"
                                    size="sm"
                                >
                                    Full Dashboard
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}