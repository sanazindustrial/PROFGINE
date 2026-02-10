"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, Users, Lightbulb, Settings, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

interface SystemSettings {
    ENABLE_AI_GRADING: boolean
    ENABLE_LMS_INTEGRATIONS: boolean
    ENABLE_BULK_OPERATIONS: boolean
    ENABLE_EMAIL_NOTIFICATIONS: boolean
}

export default function AdminDashboard() {
    const [inviteForm, setInviteForm] = useState({
        email: "",
        inviterName: "",
        message: ""
    })
    const [isLoading, setIsLoading] = useState(false)

    // System settings state
    const [systemSettings, setSystemSettings] = useState<SystemSettings>({
        ENABLE_AI_GRADING: true,
        ENABLE_LMS_INTEGRATIONS: true,
        ENABLE_BULK_OPERATIONS: true,
        ENABLE_EMAIL_NOTIFICATIONS: true
    })
    const [isLoadingSettings, setIsLoadingSettings] = useState(true)
    const [isSavingSettings, setIsSavingSettings] = useState(false)
    const [settingsMessage, setSettingsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Load system settings on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const response = await fetch("/api/admin/system-settings")
                if (response.ok) {
                    const data = await response.json()
                    setSystemSettings(data.settings)
                }
            } catch (error) {
                console.error("Failed to load system settings:", error)
            } finally {
                setIsLoadingSettings(false)
            }
        }
        loadSettings()
    }, [])

    // Save system settings
    const handleSaveSettings = async () => {
        setIsSavingSettings(true)
        setSettingsMessage(null)

        try {
            const response = await fetch("/api/admin/system-settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ settings: systemSettings })
            })

            if (response.ok) {
                setSettingsMessage({ type: 'success', text: 'System settings saved successfully!' })
            } else {
                const error = await response.json()
                setSettingsMessage({ type: 'error', text: error.error || 'Failed to save settings' })
            }
        } catch (error) {
            setSettingsMessage({ type: 'error', text: 'Failed to save settings' })
        } finally {
            setIsSavingSettings(false)
        }
    }

    const handleAdminInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch("/api/admin/invitations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(inviteForm)
            })

            if (response.ok) {
                alert("Admin invitation sent successfully!")
                setInviteForm({ email: "", inviterName: "", message: "" })
            } else {
                const error = await response.json()
                alert(`Error: ${error.error}`)
            }
        } catch (error) {
            alert("Failed to send invitation")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="container mx-auto p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Manage users, invitations, and system settings</p>
            </div>

            <Tabs defaultValue="invitations" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="invitations">Admin Invitations</TabsTrigger>
                    <TabsTrigger value="professors">Professor Management</TabsTrigger>
                    <TabsTrigger value="students">Student Overview</TabsTrigger>
                    <TabsTrigger value="system">System Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="invitations" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="size-5" />
                                Invite New Administrator
                            </CardTitle>
                            <CardDescription>
                                Send invitation to create a new admin account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleAdminInvite} className="space-y-4">
                                <div>
                                    <Label htmlFor="email">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={inviteForm.email}
                                        onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                                        placeholder="admin@university.edu"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="inviterName">Your Name</Label>
                                    <Input
                                        id="inviterName"
                                        value={inviteForm.inviterName}
                                        onChange={(e) => setInviteForm({ ...inviteForm, inviterName: e.target.value })}
                                        placeholder="John Smith"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="message">Custom Message (Optional)</Label>
                                    <Textarea
                                        id="message"
                                        value={inviteForm.message}
                                        onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                                        placeholder="Welcome to ProfGenie! You've been invited to join as an administrator..."
                                        rows={3}
                                    />
                                </div>

                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? "Sending..." : "Send Admin Invitation"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Pending Admin Invitations</CardTitle>
                            <CardDescription>
                                Track and manage outstanding invitations
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Invitation list component would go here */}
                            <div className="py-8 text-center text-gray-500">
                                <Users className="mx-auto mb-4 size-12 opacity-50" />
                                <p>No pending invitations</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="professors" className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Professors</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">247</div>
                                <p className="text-xs text-muted-foreground">+12% from last month</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">189</div>
                                <p className="text-xs text-muted-foreground">76% conversion rate</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Trial Users</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">58</div>
                                <p className="text-xs text-muted-foreground">Ending in next 7 days: 12</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Professor Management</CardTitle>
                            <CardDescription>
                                View and manage professor accounts and subscriptions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Professor management table would go here */}
                            <div className="py-8 text-center text-gray-500">
                                <FileText className="mx-auto mb-4 size-12 opacity-50" />
                                <p>Professor management interface coming soon</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="students" className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">8,542</div>
                                <p className="text-xs text-muted-foreground">Across all courses</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">326</div>
                                <p className="text-xs text-muted-foreground">This semester</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Assignments Graded</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">15,847</div>
                                <p className="text-xs text-muted-foreground">This month</p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Student Activity Overview</CardTitle>
                            <CardDescription>
                                Monitor student engagement and platform usage
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {/* Student activity dashboard would go here */}
                            <div className="py-8 text-center text-gray-500">
                                <Lightbulb className="mx-auto mb-4 size-12 opacity-50" />
                                <p>Student analytics dashboard coming soon</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="system" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="size-5" />
                                System Configuration
                            </CardTitle>
                            <CardDescription>
                                Configure platform-wide settings and features
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {isLoadingSettings ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="size-6 animate-spin text-gray-400" />
                                    <span className="ml-2 text-gray-500">Loading settings...</span>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-sm font-medium">AI-Assisted Grading</Label>
                                                <p className="text-sm text-muted-foreground">Enable AI feedback generation for all professors</p>
                                            </div>
                                            <Switch
                                                checked={systemSettings.ENABLE_AI_GRADING}
                                                onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, ENABLE_AI_GRADING: checked }))}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-sm font-medium">LMS Integrations</Label>
                                                <p className="text-sm text-muted-foreground">Allow professors to connect external learning management systems</p>
                                            </div>
                                            <Switch
                                                checked={systemSettings.ENABLE_LMS_INTEGRATIONS}
                                                onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, ENABLE_LMS_INTEGRATIONS: checked }))}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-sm font-medium">Bulk Operations</Label>
                                                <p className="text-sm text-muted-foreground">Enable mass student enrollment and batch grading</p>
                                            </div>
                                            <Switch
                                                checked={systemSettings.ENABLE_BULK_OPERATIONS}
                                                onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, ENABLE_BULK_OPERATIONS: checked }))}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div>
                                                <Label className="text-sm font-medium">Email Notifications</Label>
                                                <p className="text-sm text-muted-foreground">Send automatic emails for grades, enrollments, and system updates</p>
                                            </div>
                                            <Switch
                                                checked={systemSettings.ENABLE_EMAIL_NOTIFICATIONS}
                                                onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, ENABLE_EMAIL_NOTIFICATIONS: checked }))}
                                            />
                                        </div>
                                    </div>

                                    {settingsMessage && (
                                        <div className={`flex items-center gap-2 rounded-md border p-3 ${settingsMessage.type === 'success'
                                                ? 'border-green-200 bg-green-50 text-green-700'
                                                : 'border-red-200 bg-red-50 text-red-700'
                                            }`}>
                                            {settingsMessage.type === 'success' ? (
                                                <CheckCircle className="size-4" />
                                            ) : (
                                                <AlertCircle className="size-4" />
                                            )}
                                            <span className="text-sm">{settingsMessage.text}</span>
                                        </div>
                                    )}

                                    <div className="border-t pt-4">
                                        <Button
                                            className="w-full"
                                            onClick={handleSaveSettings}
                                            disabled={isSavingSettings}
                                        >
                                            {isSavingSettings ? (
                                                <>
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                'Save System Settings'
                                            )}
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}