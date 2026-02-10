"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Users,
    Shield,
    GraduationCap,
    User as UserCircle,
    MoreVertical,
    Search,
    Crown,
    Trash2,
    Edit
} from "lucide-react"

interface UserManagementProps {
    users: any[]
    stats: {
        totalUsers: number
        admins: number
        professors: number
        students: number
        activeSubscriptions: number
    }
}

export function UserManagement({ users: initialUsers, stats }: UserManagementProps) {
    const [users, setUsers] = useState(initialUsers)
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState<string | null>(null)

    const filteredUsers = users.filter(user => {
        const matchesSearch = !searchTerm ||
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesRole = !roleFilter || user.role === roleFilter

        return matchesSearch && matchesRole
    })

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const response = await fetch("/api/admin/users/role", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, role: newRole })
            })

            if (response.ok) {
                setUsers(users.map(u =>
                    u.id === userId ? { ...u, role: newRole } : u
                ))
                alert("Role updated successfully")
            } else {
                alert("Failed to update role")
            }
        } catch (error) {
            alert("An error occurred")
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            return
        }

        try {
            const response = await fetch(`/api/admin/users/${userId}`, {
                method: "DELETE"
            })

            if (response.ok) {
                setUsers(users.filter(u => u.id !== userId))
                alert("User deleted successfully")
            } else {
                alert("Failed to delete user")
            }
        } catch (error) {
            alert("An error occurred")
        }
    }

    const getRoleColor = (role: string) => {
        switch (role) {
            case "ADMIN":
                return "bg-purple-100 text-purple-800 border-purple-200"
            case "PROFESSOR":
                return "bg-blue-100 text-blue-800 border-blue-200"
            case "STUDENT":
                return "bg-green-100 text-green-800 border-green-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const getRoleIcon = (role: string) => {
        switch (role) {
            case "ADMIN":
                return <Shield className="size-4" />
            case "PROFESSOR":
                return <GraduationCap className="size-4" />
            case "STUDENT":
                return <UserCircle className="size-4" />
            default:
                return null
        }
    }

    return (
        <div className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="size-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Admins</CardTitle>
                        <Shield className="size-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.admins}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Professors</CardTitle>
                        <GraduationCap className="size-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.professors}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Students</CardTitle>
                        <UserCircle className="size-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.students}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Subs</CardTitle>
                        <Crown className="size-4 text-yellow-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>All Users</CardTitle>
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1 md:flex-initial">
                                <Search className="absolute left-2.5 top-2.5 size-4 text-gray-500" />
                                <Input
                                    placeholder="Search users..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-8 md:w-[300px]"
                                />
                            </div>
                            <Button
                                variant={roleFilter === null ? "default" : "outline"}
                                size="sm"
                                onClick={() => setRoleFilter(null)}
                            >
                                All
                            </Button>
                            <Button
                                variant={roleFilter === "ADMIN" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setRoleFilter("ADMIN")}
                            >
                                Admin
                            </Button>
                            <Button
                                variant={roleFilter === "PROFESSOR" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setRoleFilter("PROFESSOR")}
                            >
                                Professor
                            </Button>
                            <Button
                                variant={roleFilter === "STUDENT" ? "default" : "outline"}
                                size="sm"
                                onClick={() => setRoleFilter("STUDENT")}
                            >
                                Student
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>User</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Subscription</TableHead>
                                    <TableHead>Courses</TableHead>
                                    <TableHead>Enrollments</TableHead>
                                    <TableHead>Presentations</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{user.name || "Unnamed User"}</span>
                                                    <span className="text-sm text-muted-foreground">{user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={getRoleColor(user.role)}>
                                                    <span className="mr-1">{getRoleIcon(user.role)}</span>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{user.subscriptionType}</Badge>
                                            </TableCell>
                                            <TableCell>{user._count.courses}</TableCell>
                                            <TableCell>{user._count.enrollments}</TableCell>
                                            <TableCell>{user.presentations?.length || 0}</TableCell>
                                            <TableCell>
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleRoleChange(user.id, "ADMIN")}
                                                            disabled={user.role === "ADMIN"}
                                                        >
                                                            <Shield className="mr-2 size-4" />
                                                            Make Admin
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleRoleChange(user.id, "PROFESSOR")}
                                                            disabled={user.role === "PROFESSOR"}
                                                        >
                                                            <GraduationCap className="mr-2 size-4" />
                                                            Make Professor
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleRoleChange(user.id, "STUDENT")}
                                                            disabled={user.role === "STUDENT"}
                                                        >
                                                            <UserCircle className="mr-2 size-4" />
                                                            Make Student
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 size-4" />
                                                            Delete User
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
