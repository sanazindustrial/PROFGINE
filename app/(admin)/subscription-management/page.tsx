"use client"

import { useState, useEffect } from "react"
import { FeatureLayout } from "@/components/feature-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
    Users,
    Crown,
    Clock,
    Star,
    Zap
} from "lucide-react"

interface User {
    id: string
    name: string
    email: string
    subscriptionType: string
    subscriptionExpiresAt?: Date
    trialExpiresAt?: Date
}

export default function SubscriptionManagement() {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        // Mock users data - in production this would be fetched from API
        const mockUsers: User[] = [
            {
                id: "1",
                name: "Professor Smith",
                email: "smith@university.edu",
                subscriptionType: "FREE_TRIAL",
                trialExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            },
            {
                id: "2",
                name: "Dr. Johnson",
                email: "johnson@college.edu",
                subscriptionType: "PREMIUM",
                subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            {
                id: "3",
                name: "Prof. Davis",
                email: "davis@school.edu",
                subscriptionType: "BASIC",
                subscriptionExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
            }
        ]

        setTimeout(() => {
            setUsers(mockUsers)
            setIsLoading(false)
        }, 1000)
    }, [])

    const updateSubscription = async (userId: string, subscriptionType: string) => {
        // Mock API call
        setUsers(prev => prev.map(user =>
            user.id === userId
                ? {
                    ...user,
                    subscriptionType,
                    subscriptionExpiresAt: subscriptionType !== 'FREE_TRIAL'
                        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                        : undefined
                }
                : user
        ))

        toast({
            title: "Subscription Updated",
            description: `User subscription changed to ${subscriptionType}`,
        })
    }

    const getSubscriptionBadge = (subscriptionType: string) => {
        switch (subscriptionType) {
            case 'FREE_TRIAL':
                return <Badge variant="secondary" className="bg-gray-100">Free Trial</Badge>
            case 'BASIC':
                return <Badge className="bg-blue-100 text-blue-800">Basic</Badge>
            case 'PREMIUM':
                return <Badge className="bg-purple-100 text-purple-800">Premium</Badge>
            case 'ENTERPRISE':
                return <Badge className="bg-yellow-100 text-yellow-800">Enterprise</Badge>
            default:
                return <Badge variant="outline">Unknown</Badge>
        }
    }

    const getTimeRemaining = (date?: Date) => {
        if (!date) return 'N/A'

        const now = new Date()
        const diff = date.getTime() - now.getTime()
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

        if (days < 0) return 'Expired'
        if (days === 0) return 'Today'
        if (days === 1) return '1 day'
        return `${days} days`
    }

    if (isLoading) {
        return (
            <FeatureLayout
                title="Subscription Management"
                description="Manage user subscriptions and access levels"
            >
                <div className="flex h-32 items-center justify-center">
                    <div className="size-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
                </div>
            </FeatureLayout>
        )
    }

    return (
        <FeatureLayout
            title="Subscription Management"
            description="Manage user subscriptions and access levels"
        >
            <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Users className="size-4 text-gray-600" />
                                <span className="text-sm font-medium">Total Users</span>
                            </div>
                            <p className="text-2xl font-bold">{users.length}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Clock className="size-4 text-gray-600" />
                                <span className="text-sm font-medium">Free Trials</span>
                            </div>
                            <p className="text-2xl font-bold">
                                {users.filter(u => u.subscriptionType === 'FREE_TRIAL').length}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Star className="size-4 text-purple-600" />
                                <span className="text-sm font-medium">Premium</span>
                            </div>
                            <p className="text-2xl font-bold">
                                {users.filter(u => u.subscriptionType === 'PREMIUM').length}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Crown className="size-4 text-yellow-600" />
                                <span className="text-sm font-medium">Enterprise</span>
                            </div>
                            <p className="text-2xl font-bold">
                                {users.filter(u => u.subscriptionType === 'ENTERPRISE').length}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* User List */}
                <Card>
                    <CardHeader>
                        <CardTitle>User Subscriptions</CardTitle>
                        <CardDescription>Manage individual user subscription levels</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className="flex items-center justify-between rounded-lg border p-4"
                                >
                                    <div className="space-y-1">
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-sm text-gray-600">{user.email}</div>
                                        <div className="flex items-center gap-2 text-sm">
                                            {getSubscriptionBadge(user.subscriptionType)}
                                            <span className="text-gray-500">
                                                Expires: {getTimeRemaining(
                                                    user.subscriptionType === 'FREE_TRIAL'
                                                        ? user.trialExpiresAt
                                                        : user.subscriptionExpiresAt
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => updateSubscription(user.id, 'BASIC')}
                                            disabled={user.subscriptionType === 'BASIC'}
                                        >
                                            Basic
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => updateSubscription(user.id, 'PREMIUM')}
                                            disabled={user.subscriptionType === 'PREMIUM'}
                                            className="border-purple-300 text-purple-700 hover:bg-purple-50"
                                        >
                                            Premium
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => updateSubscription(user.id, 'ENTERPRISE')}
                                            disabled={user.subscriptionType === 'ENTERPRISE'}
                                            className="border-yellow-300 text-yellow-700 hover:bg-yellow-50"
                                        >
                                            Enterprise
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </FeatureLayout>
    )
}