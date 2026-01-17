"use client"

import { useSession, signOut } from "next-auth/react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthDebugPage() {
  const { data: session, status } = useSession()
  const [debugData, setDebugData] = useState(null)
  const [userStatus, setUserStatus] = useState(null)

  useEffect(() => {
    // Fetch debug session data from API
    fetch('/api/debug/session')
      .then(res => res.json())
      .then(data => setDebugData(data))
      .catch(err => console.error('Debug fetch error:', err))

    // Fetch user status from database
    fetch('/api/debug/user')
      .then(res => res.json())
      .then(data => setUserStatus(data))
      .catch(err => console.error('User status fetch error:', err))
  }, [session])

  if (status === "loading") {
    return (
      <div className="container mx-auto p-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center">
              <div className="size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-8">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Authentication Debug Panel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="mb-2 font-semibold">Session Status</h3>
            <p className="rounded bg-gray-100 p-2 text-sm">
              Status: <span className="font-mono">{status}</span>
            </p>
          </div>

          {session && (
            <div>
              <h3 className="mb-2 font-semibold">Client Session Data</h3>
              <pre className="max-h-96 overflow-auto rounded bg-gray-100 p-4 text-xs">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          )}

          {debugData && (
            <div>
              <h3 className="mb-2 font-semibold">Server Session Data</h3>
              <pre className="max-h-96 overflow-auto rounded bg-blue-50 p-4 text-xs">
                {JSON.stringify(debugData, null, 2)}
              </pre>
            </div>
          )}

          {userStatus && (
            <div>
              <h3 className="mb-2 font-semibold">Database User Status</h3>
              <pre className="max-h-96 overflow-auto rounded bg-green-50 p-4 text-xs">
                {JSON.stringify(userStatus, null, 2)}
              </pre>
            </div>
          )}

          <div className="space-x-2">
            {session ? (
              <Button onClick={() => signOut({ callbackUrl: '/' })}>
                Sign Out
              </Button>
            ) : (
              <Button onClick={() => window.location.href = '/auth/signin'}>
                Sign In
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
            >
              Go Home
            </Button>

            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </div>

          {session && (
            <div className="mt-6 rounded border border-yellow-200 bg-yellow-50 p-4">
              <h4 className="font-semibold text-yellow-800">Expected Redirect Logic:</h4>
              <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                <li>• <strong>ADMIN role:</strong> Should redirect to /user-management</li>
                <li>• <strong>FREE_TRIAL (active):</strong> Should redirect to /trial-dashboard</li>
                <li>• <strong>FREE_TRIAL (expired):</strong> Should redirect to /subscription/upgrade</li>
                <li>• <strong>PAID (Basic/Premium/Enterprise):</strong> Should redirect to /dashboard</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}