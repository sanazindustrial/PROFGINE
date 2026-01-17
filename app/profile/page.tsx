"use client"

import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { FeatureLayout } from "@/components/feature-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { 
    User, 
    Mail, 
    Shield, 
    Crown, 
    GraduationCap, 
    Settings,
    Save,
    Camera
} from "lucide-react"

interface ProfileData {
    name: string
    email: string
    role: string
    image?: string
    bio?: string
    institution?: string
    department?: string
}

export default function ProfilePage() {
    const { data: session, update } = useSession()
    const [profileData, setProfileData] = useState<ProfileData>({
        name: '',
        email: '',
        role: '',
        bio: '',
        institution: '',
        department: ''
    })
    const [isLoading, setIsLoading] = useState(false)
    const [isSaved, setIsSaved] = useState(false)

    useEffect(() => {
        if (session?.user) {
            setProfileData({
                name: session.user.name || '',
                email: session.user.email || '',
                role: session.user.role || '',
                image: session.user.image || '',
                bio: '',
                institution: '',
                department: ''
            })
        }
    }, [session])

    const handleSave = async () => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData),
            })

            if (response.ok) {
                setIsSaved(true)
                // Update the session with new data
                await update({
                    name: profileData.name,
                })
                setTimeout(() => setIsSaved(false), 3000)
            }
        } catch (error) {
            console.error('Error saving profile:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return 'default'
            case 'PROFESSOR':
                return 'secondary'
            case 'STUDENT':
                return 'outline'
            default:
                return 'outline'
        }
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'ADMIN':
                return <Shield className="size-4" />
            case 'PROFESSOR':
                return <GraduationCap className="size-4" />
            case 'STUDENT':
                return <User className="size-4" />
            default:
                return <User className="size-4" />
        }
    }

    if (!session) {
        return (
            <FeatureLayout title="Profile" description="Manage your account settings">
                <div className="flex min-h-[400px] items-center justify-center">
                    <p className="text-muted-foreground">Please sign in to view your profile.</p>
                </div>
            </FeatureLayout>
        )
    }

    return (
        <FeatureLayout 
            title="Profile Settings" 
            description="Manage your account information and preferences"
        >
            <div className="space-y-6">
                {/* Profile Header */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="size-5" />
                            Account Information
                        </CardTitle>
                        <CardDescription>
                            Your basic account details and role information
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Profile Photo & Basic Info */}
                        <div className="flex items-start gap-6">
                            <div className="flex flex-col items-center space-y-2">
                                <div className="relative">
                                    <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xl font-semibold text-white">
                                        {profileData.name ? profileData.name.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="absolute -bottom-2 -right-2 size-8 rounded-full p-0"
                                    >
                                        <Camera className="size-3" />
                                    </Button>
                                </div>
                                <Badge variant={getRoleBadgeVariant(profileData.role)} className="flex items-center gap-1">
                                    {getRoleIcon(profileData.role)}
                                    {profileData.role}
                                </Badge>
                            </div>

                            <div className="flex-1 space-y-4">
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Full Name</Label>
                                        <Input
                                            id="name"
                                            value={profileData.name}
                                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                            placeholder="Enter your full name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <div className="relative">
                                            <Input
                                                id="email"
                                                value={profileData.email}
                                                disabled
                                                className="pr-10"
                                            />
                                            <Mail className="absolute right-3 top-3 size-4 text-muted-foreground" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        value={profileData.bio}
                                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                                        placeholder="Tell us a bit about yourself..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Professional Information */}
                {(profileData.role === 'PROFESSOR' || profileData.role === 'ADMIN') && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GraduationCap className="size-5" />
                                Professional Information
                            </CardTitle>
                            <CardDescription>
                                Your institutional and professional details
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="institution">Institution</Label>
                                    <Input
                                        id="institution"
                                        value={profileData.institution}
                                        onChange={(e) => setProfileData({...profileData, institution: e.target.value})}
                                        placeholder="University or Institution name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Input
                                        id="department"
                                        value={profileData.department}
                                        onChange={(e) => setProfileData({...profileData, department: e.target.value})}
                                        placeholder="Department or Field of study"
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Account Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Crown className="size-5" />
                            Account Status
                        </CardTitle>
                        <CardDescription>
                            Your current subscription and account standing
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between rounded-lg bg-muted p-4">
                            <div className="space-y-1">
                                <p className="font-medium">Account Type</p>
                                <p className="text-sm text-muted-foreground">
                                    {profileData.role === 'ADMIN' ? 'Administrator' : 
                                     profileData.role === 'PROFESSOR' ? 'Professor' : 'Student'}
                                </p>
                            </div>
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                                Active
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end gap-4">
                    <Button 
                        onClick={handleSave} 
                        disabled={isLoading}
                        className="min-w-[120px]"
                    >
                        {isLoading ? (
                            "Saving..."
                        ) : isSaved ? (
                            "Saved!"
                        ) : (
                            <>
                                <Save className="mr-2 size-4" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </FeatureLayout>
    )
}