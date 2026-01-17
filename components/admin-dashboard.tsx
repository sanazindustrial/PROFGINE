"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/use-toast'
import { Users, Building, CreditCard, Settings, Plus, Trash2, Edit } from 'lucide-react'

interface Organization {
    id: string
    name: string
    domain: string
    subscriptionType: string
    totalMembers: number
    membersByRole: {
        admin: number
        professor: number
        student: number
    }
    settings: any
}

interface Member {
    id: string
    user: {
        id: string
        email: string
        name: string
        role: string
        creditBalance: number
        subscriptionType: string
    }
    role: string
    joinedAt: string
}

interface CreditTransaction {
    id: string
    amount: number
    type: string
    description: string
    createdAt: string
}

export default function AdminDashboard() {
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
    const [members, setMembers] = useState<Member[]>([])
    const [creditTransactions, setCreditTransactions] = useState<CreditTransaction[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false)
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false)

    // Form states
    const [newOrgForm, setNewOrgForm] = useState({
        name: '',
        domain: '',
        subscriptionType: 'FREE'
    })
    const [newMemberForm, setNewMemberForm] = useState({
        email: '',
        role: 'STUDENT'
    })

    useEffect(() => {
        loadOrganizations()
        loadCreditTransactions()
    }, [])

    const loadOrganizations = async () => {
        try {
            const response = await fetch('/api/organizations')
            if (response.ok) {
                const data = await response.json()
                if (data.organization) {
                    setSelectedOrg(data.organization)
                    setMembers(data.members || [])
                }
            }
        } catch (error) {
            console.error('Failed to load organizations:', error)
            toast({
                title: "Error",
                description: "Failed to load organizations",
                variant: "destructive"
            })
        }
    }

    const loadCreditTransactions = async () => {
        try {
            const response = await fetch('/api/credits')
            if (response.ok) {
                const data = await response.json()
                setCreditTransactions(data.recentTransactions || [])
            }
        } catch (error) {
            console.error('Failed to load credit transactions:', error)
        }
        setLoading(false)
    }

    const createOrganization = async () => {
        if (!newOrgForm.name || !newOrgForm.domain) {
            toast({
                title: "Error",
                description: "Name and domain are required",
                variant: "destructive"
            })
            return
        }

        try {
            const response = await fetch('/api/organizations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOrgForm)
            })

            if (response.ok) {
                const data = await response.json()
                toast({
                    title: "Success",
                    description: "Organization created successfully"
                })
                setIsCreateOrgOpen(false)
                setNewOrgForm({ name: '', domain: '', subscriptionType: 'FREE' })
                loadOrganizations()
            } else {
                const error = await response.json()
                throw new Error(error.error)
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to create organization",
                variant: "destructive"
            })
        }
    }

    const addMember = async () => {
        if (!selectedOrg || !newMemberForm.email) {
            toast({
                title: "Error",
                description: "Email is required",
                variant: "destructive"
            })
            return
        }

        try {
            const response = await fetch('/api/organizations/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    organizationId: selectedOrg.id,
                    ...newMemberForm
                })
            })

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Member added successfully"
                })
                setIsAddMemberOpen(false)
                setNewMemberForm({ email: '', role: 'STUDENT' })
                loadOrganizations()
            } else {
                const error = await response.json()
                throw new Error(error.error)
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add member",
                variant: "destructive"
            })
        }
    }

    const removeMember = async (membershipId: string) => {
        if (!confirm('Are you sure you want to remove this member?')) return

        try {
            const response = await fetch(`/api/organizations/members?membershipId=${membershipId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Member removed successfully"
                })
                loadOrganizations()
            } else {
                const error = await response.json()
                throw new Error(error.error)
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to remove member",
                variant: "destructive"
            })
        }
    }

    const updateMemberRole = async (membershipId: string, newRole: string) => {
        try {
            const response = await fetch('/api/organizations/members', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ membershipId, role: newRole })
            })

            if (response.ok) {
                toast({
                    title: "Success",
                    description: "Member role updated successfully"
                })
                loadOrganizations()
            } else {
                const error = await response.json()
                throw new Error(error.error)
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update member role",
                variant: "destructive"
            })
        }
    }

    const resetMonthlyCredits = async (userId: string, monthlyCredits?: number) => {
        try {
            const response = await fetch('/api/credits', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, monthlyCredits })
            })

            if (response.ok) {
                const data = await response.json()
                toast({
                    title: "Success",
                    description: `Monthly credits reset. New balance: ${data.newBalance}`
                })
                loadOrganizations()
            } else {
                const error = await response.json()
                throw new Error(error.error)
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to reset credits",
                variant: "destructive"
            })
        }
    }

    if (loading) {
        return <div className="flex items-center justify-center p-8">Loading...</div>
    }

    return (
        <div className="container mx-auto space-y-6 p-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <Dialog open={isCreateOrgOpen} onOpenChange={setIsCreateOrgOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 size-4" />
                            Create Organization
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Organization</DialogTitle>
                            <DialogDescription>
                                Create a new organization to manage professors and students
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Organization Name</Label>
                                <Input
                                    id="name"
                                    value={newOrgForm.name}
                                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="University of Example"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="domain">Domain</Label>
                                <Input
                                    id="domain"
                                    value={newOrgForm.domain}
                                    onChange={(e) => setNewOrgForm(prev => ({ ...prev, domain: e.target.value }))}
                                    placeholder="example.edu"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="subscriptionType">Subscription Type</Label>
                                <Select value={newOrgForm.subscriptionType} onValueChange={(value) => setNewOrgForm(prev => ({ ...prev, subscriptionType: value }))}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="FREE">Free</SelectItem>
                                        <SelectItem value="BASIC">Basic</SelectItem>
                                        <SelectItem value="PREMIUM">Premium</SelectItem>
                                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOrgOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={createOrganization}>Create Organization</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Tabs defaultValue="organization" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="organization">Organization</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="credits">Credits</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="organization" className="space-y-4">
                    {selectedOrg ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building className="size-5" />
                                    {selectedOrg.name}
                                </CardTitle>
                                <CardDescription>
                                    Domain: {selectedOrg.domain} • {selectedOrg.totalMembers} total members
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {selectedOrg.membersByRole?.admin || 0}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Admins</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600">
                                            {selectedOrg.membersByRole?.professor || 0}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Professors</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-purple-600">
                                            {selectedOrg.membersByRole?.student || 0}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Students</div>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Badge variant={selectedOrg.subscriptionType === 'ENTERPRISE' ? 'default' : 'secondary'}>
                                        {selectedOrg.subscriptionType}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle>No Organization</CardTitle>
                                <CardDescription>Create an organization to get started</CardDescription>
                            </CardHeader>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="members" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold">Organization Members</h2>
                        <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
                            <DialogTrigger asChild>
                                <Button disabled={!selectedOrg}>
                                    <Plus className="mr-2 size-4" />
                                    Add Member
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Member to Organization</DialogTitle>
                                    <DialogDescription>
                                        Add a new member to {selectedOrg?.name}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="memberEmail">Email</Label>
                                        <Input
                                            id="memberEmail"
                                            type="email"
                                            value={newMemberForm.email}
                                            onChange={(e) => setNewMemberForm(prev => ({ ...prev, email: e.target.value }))}
                                            placeholder="professor@university.edu"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="memberRole">Role</Label>
                                        <Select value={newMemberForm.role} onValueChange={(value) => setNewMemberForm(prev => ({ ...prev, role: value }))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="STUDENT">Student</SelectItem>
                                                <SelectItem value="PROFESSOR">Professor</SelectItem>
                                                <SelectItem value="ADMIN">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button onClick={addMember}>Add Member</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid gap-4">
                        {members.map((member) => (
                            <Card key={member.id}>
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1">
                                                <div className="font-semibold">{member.user.name}</div>
                                                <div className="text-sm text-muted-foreground">{member.user.email}</div>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <Badge variant={member.role === 'ADMIN' ? 'default' : member.role === 'PROFESSOR' ? 'secondary' : 'outline'}>
                                                        {member.role}
                                                    </Badge>
                                                    <Badge variant="outline">{member.user.creditBalance} credits</Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Select
                                                value={member.role}
                                                onValueChange={(value) => updateMemberRole(member.id, value)}
                                            >
                                                <SelectTrigger className="w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="STUDENT">Student</SelectItem>
                                                    <SelectItem value="PROFESSOR">Professor</SelectItem>
                                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => resetMonthlyCredits(member.user.id)}
                                            >
                                                <CreditCard className="size-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => removeMember(member.id)}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        {members.length === 0 && (
                            <Card>
                                <CardContent className="pt-6">
                                    <div className="text-center text-muted-foreground">
                                        No members found. Add some members to get started.
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="credits" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="size-5" />
                                Credit Transactions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {creditTransactions.map((transaction) => (
                                    <div key={transaction.id} className="flex items-center justify-between rounded border p-3">
                                        <div>
                                            <div className="font-medium">{transaction.description}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {new Date(transaction.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={transaction.amount > 0 ? 'default' : 'destructive'}>
                                                {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                                            </Badge>
                                            <Badge variant="outline">{transaction.type}</Badge>
                                        </div>
                                    </div>
                                ))}
                                {creditTransactions.length === 0 && (
                                    <div className="py-4 text-center text-muted-foreground">
                                        No credit transactions found
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="size-5" />
                                System Configuration
                            </CardTitle>
                            <CardDescription>
                                Manage API keys, system settings, and platform configuration
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">API Configuration</h4>
                                    <p className="mb-2 text-xs text-muted-foreground">
                                        Configure OpenAI, Anthropic, and other AI provider API keys
                                    </p>
                                    <Button asChild className="w-full">
                                        <a href="/admin/config">
                                            <Settings className="mr-2 size-4" />
                                            Configure APIs
                                        </a>
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">User Management</h4>
                                    <p className="mb-2 text-xs text-muted-foreground">
                                        Manage professor and student accounts and permissions
                                    </p>
                                    <Button asChild variant="outline" className="w-full">
                                        <a href="/admin/users">
                                            <Users className="mr-2 size-4" />
                                            Manage Users
                                        </a>
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold">System Health</h4>
                                    <p className="mb-2 text-xs text-muted-foreground">
                                        Monitor system status and service health
                                    </p>
                                    <Button asChild variant="outline" className="w-full">
                                        <a href="/admin/health">
                                            <CreditCard className="mr-2 size-4" />
                                            View Health
                                        </a>
                                    </Button>
                                </div>
                            </div>

                            <div className="mt-6 rounded-lg bg-muted p-4">
                                <h4 className="mb-2 text-sm font-semibold">System Status</h4>
                                <div className="grid gap-2 text-xs">
                                    <div className="flex justify-between">
                                        <span>Database Connection:</span>
                                        <span className="text-green-600">✓ Connected</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>AI Providers:</span>
                                        <span className="text-yellow-600">⚠ Some Not Configured</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>System Version:</span>
                                        <span>v1.0.0</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}