"use client"

import { useEffect, useState } from 'react'
import { RoleSwitcher } from '@/components/admin/role-switcher'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Crown, Shield, AlertTriangle, RefreshCw } from 'lucide-react'

type UserRole = 'OWNER' | 'ADMIN' | 'PROFESSOR' | 'STUDENT'

interface UserData {
  id: string
  email: string
  name: string
  role: UserRole
  isOwner: boolean
  isPremium: boolean
  subscriptionType: string
  creditBalance: number
  monthlyCredits: number
  maxConcurrentSessions: number
}

interface RoleManagementClientProps {
  isOwner: boolean
}

export default function RoleManagementClient({ isOwner: serverIsOwner }: RoleManagementClientProps) {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [isOwner, setIsOwner] = useState(serverIsOwner)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [switchStatus, setSwitchStatus] = useState<string | null>(null)

  const fetchUserData = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/role-switch')
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data')
      }
      
      const data = await response.json()
      setUserData(data.user)
      setIsOwner(data.isOwner)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  const handleRoleSwitch = async (targetRole: UserRole) => {
    try {
      setSwitchStatus('Switching role...')
      
      const response = await fetch('/api/admin/role-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole, testMode: false })
      })
      
      if (!response.ok) {
        throw new Error('Failed to switch role')
      }
      
      const data = await response.json()
      setSwitchStatus(`Successfully switched to ${targetRole}`)
      
      // Refresh user data
      await fetchUserData()
      
      // Clear status after 3 seconds
      setTimeout(() => setSwitchStatus(null), 3000)
    } catch (err) {
      setSwitchStatus(`Error: ${err instanceof Error ? err.message : 'Failed to switch role'}`)
      setTimeout(() => setSwitchStatus(null), 5000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading role management...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="size-4" />
          <AlertDescription>
            {error}. Please try refreshing the page or contact support.
          </AlertDescription>
        </Alert>
        <Button onClick={fetchUserData} className="mt-4">
          <RefreshCw className="size-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Alert>
          <AlertTriangle className="size-4" />
          <AlertDescription>
            Unable to load user data. Please sign in again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            {isOwner ? (
              <Crown className="size-8 text-amber-500" />
            ) : (
              <Shield className="size-8 text-purple-500" />
            )}
            Role & Permission Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View and test role permissions across the platform
          </p>
        </div>
        <Button variant="outline" onClick={fetchUserData}>
          <RefreshCw className="size-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status message */}
      {switchStatus && (
        <Alert className={switchStatus.includes('Error') ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'}>
          <AlertDescription className={switchStatus.includes('Error') ? 'text-red-700' : 'text-green-700'}>
            {switchStatus}
          </AlertDescription>
        </Alert>
      )}

      {/* Owner badge */}
      {isOwner && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Crown className="size-6 text-amber-500" />
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-400">
                  Platform Owner Access
                </p>
                <p className="text-sm text-amber-600 dark:text-amber-500">
                  You have full access to all platform features, billing, user management, and can switch roles for testing.
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <Badge className="bg-amber-500 text-white">Premium</Badge>
                <Badge variant="outline" className="border-amber-500 text-amber-700">
                  {userData.creditBalance.toLocaleString()} Credits
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current user info */}
      <Card>
        <CardHeader>
          <CardTitle>Your Account</CardTitle>
          <CardDescription>Current account information and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{userData.email}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Current Role</p>
              <p className="font-medium">{userData.role}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Subscription</p>
              <p className="font-medium">{userData.subscriptionType}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Max Sessions</p>
              <p className="font-medium">{userData.maxConcurrentSessions}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Switcher Component */}
      <RoleSwitcher
        currentUserRole={userData.role}
        currentUserEmail={userData.email}
        isOwner={isOwner}
        onRoleSwitch={handleRoleSwitch}
      />
    </div>
  )
}
