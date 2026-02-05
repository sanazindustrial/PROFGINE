"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { GraduationCap, BookOpen, Users, Crown } from "lucide-react"

interface RoleSelectionProps {
    onRoleSelectAction: (role: 'ADMIN' | 'PROF') => void
    isLoading?: boolean
}

export function RoleSelection({ onRoleSelectAction, isLoading = false }: RoleSelectionProps) {
    const [selectedRole, setSelectedRole] = useState<'ADMIN' | 'PROF' | null>(null)

    const roles = [
        {
            id: 'ADMIN' as const,
            title: 'Administrator/Owner',
            description: 'I manage the entire platform and have full system access',
            icon: Crown,
            features: [
                'Full system administration',
                'User and subscription management',
                'Platform analytics and reports',
                'Course oversight across all users',
                'System configuration and settings'
            ],
            color: 'bg-purple-50 border-purple-200 hover:bg-purple-100',
            iconColor: 'text-purple-600'
        },
        {
            id: 'PROF' as const,
            title: 'Professor/Instructor',
            description: 'I teach courses and need to design, grade, and manage educational content',
            icon: GraduationCap,
            features: [
                'Course design and creation',
                'Assignment and discussion creation',
                'Custom rubric development',
                'AI-powered grading assistance',
                'Student progress analytics',
                'Subscription-based feature access'
            ],
            color: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
            iconColor: 'text-blue-600'
        }
    ]

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">Choose Your Role</h2>
                <p className="mt-2 text-gray-600">
                    Select your role to customize your ProfGenie experience
                </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {roles.map((role) => {
                    const Icon = role.icon
                    const isSelected = selectedRole === role.id

                    return (
                        <Card
                            key={role.id}
                            className={`cursor-pointer transition-all ${isSelected
                                ? 'shadow-lg ring-2 ring-blue-500'
                                : role.color
                                }`}
                            onClick={() => setSelectedRole(role.id)}
                        >
                            <CardHeader className="text-center">
                                <div className="mx-auto mb-3 flex size-16 items-center justify-center rounded-full bg-white shadow-sm">
                                    <Icon className={`size-8 ${role.iconColor}`} />
                                </div>
                                <CardTitle className="text-lg">{role.title}</CardTitle>
                                <CardDescription className="text-sm">
                                    {role.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-medium text-gray-900">Key Features:</h4>
                                    <ul className="space-y-1">
                                        {role.features.map((feature, index) => (
                                            <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                                                <div className="size-1.5 rounded-full bg-gray-400" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {selectedRole && (
                <div className="flex justify-center">
                    <Button
                        onClick={() => onRoleSelectAction(selectedRole)}
                        disabled={isLoading}
                        size="lg"
                        className="min-w-48"
                    >
                        {isLoading ? "Setting up your account..." : `Continue as ${selectedRole === 'ADMIN' ? 'Administrator' : 'Professor'}`}
                    </Button>
                </div>
            )}
        </div>
    )
}