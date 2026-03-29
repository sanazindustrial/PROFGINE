"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import {
    Bell,
    BellOff,
    Check,
    CheckCheck,
    ChevronLeft,
    BookOpen,
    GraduationCap,
    FileText,
    AlertCircle,
    Info,
    Megaphone,
    Loader2,
} from "lucide-react"

interface Notification {
    id: string
    type: string
    title: string
    message: string
    isRead: boolean
    priority: string
    courseId?: string | null
    assignmentId?: string | null
    createdAt: string
    data?: string | null
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
    ASSIGNMENT_CREATED: { icon: FileText, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    ASSIGNMENT_DUE_SOON: { icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
    ASSIGNMENT_DUE_TODAY: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
    ASSIGNMENT_OVERDUE: { icon: AlertCircle, color: "text-red-700", bg: "bg-red-50 dark:bg-red-950/30" },
    GRADE_POSTED: { icon: GraduationCap, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
    FEEDBACK_AVAILABLE: { icon: GraduationCap, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
    SUBMISSION_RECEIVED: { icon: FileText, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
    SUBMISSION_GRADED: { icon: GraduationCap, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
    COURSE_PUBLISHED: { icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
    SYLLABUS_UPDATED: { icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
    MODULE_PUBLISHED: { icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
    AI_CONTENT_READY: { icon: Info, color: "text-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
    ENROLLMENT_CONFIRMED: { icon: Check, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/30" },
    SYSTEM_ANNOUNCEMENT: { icon: Megaphone, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/30" },
}

const defaultType = { icon: Bell, color: "text-gray-600", bg: "bg-gray-50 dark:bg-gray-900/30" }

function priorityBadge(priority: string) {
    switch (priority) {
        case "URGENT": return <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-950 dark:text-red-400">Urgent</span>
        case "HIGH": return <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700 dark:bg-orange-950 dark:text-orange-400">High</span>
        default: return null
    }
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return "Just now"
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(dateStr).toLocaleDateString()
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"all" | "unread">("all")

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch("/api/notifications?limit=50")
            if (res.ok) {
                const data = await res.json()
                setNotifications(data.notifications || [])
            }
        } catch (err) {
            console.error("Failed to fetch notifications:", err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchNotifications() }, [fetchNotifications])

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ notificationId: id }),
            })
            if (res.ok) {
                setNotifications(prev =>
                    prev.map(n => n.id === id ? { ...n, isRead: true } : n)
                )
            }
        } catch (err) {
            console.error("Failed to mark as read:", err)
        }
    }

    const markAllAsRead = async () => {
        try {
            const res = await fetch("/api/notifications", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ markAllRead: true }),
            })
            if (res.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
            }
        } catch (err) {
            console.error("Failed to mark all as read:", err)
        }
    }

    const filtered = filter === "unread"
        ? notifications.filter(n => !n.isRead)
        : notifications

    const unreadCount = notifications.filter(n => !n.isRead).length

    return (
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard"
                        className="flex size-9 items-center justify-center rounded-lg border bg-background transition-colors hover:bg-muted"
                    >
                        <ChevronLeft className="size-4" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-semibold sm:text-2xl">Notifications</h1>
                        {unreadCount > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {unreadCount} unread
                            </p>
                        )}
                    </div>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                        <CheckCheck className="size-4" />
                        Mark all read
                    </button>
                )}
            </div>

            {/* Filter tabs */}
            <div className="mb-4 flex gap-1 rounded-lg bg-muted/50 p-1">
                <button
                    onClick={() => setFilter("all")}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        filter === "all"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    All ({notifications.length})
                </button>
                <button
                    onClick={() => setFilter("unread")}
                    className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        filter === "unread"
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    Unread ({unreadCount})
                </button>
            </div>

            {/* Notifications list */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Loader2 className="mb-3 size-8 animate-spin" />
                    <p className="text-sm">Loading notifications...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
                    <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-muted">
                        <BellOff className="size-6 text-muted-foreground" />
                    </div>
                    <p className="font-medium">
                        {filter === "unread" ? "All caught up!" : "No notifications yet"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {filter === "unread"
                            ? "You've read all your notifications."
                            : "Notifications about courses, assignments, and grades will appear here."}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((notification) => {
                        const config = typeConfig[notification.type] || defaultType
                        const Icon = config.icon
                        return (
                            <button
                                key={notification.id}
                                onClick={() => !notification.isRead && markAsRead(notification.id)}
                                className={`group relative flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all hover:shadow-sm ${
                                    notification.isRead
                                        ? "border-transparent bg-background opacity-70"
                                        : "border-border/50 bg-card shadow-sm"
                                }`}
                            >
                                {/* Unread dot */}
                                {!notification.isRead && (
                                    <span className="absolute left-1.5 top-1.5 size-2 rounded-full bg-primary" />
                                )}

                                {/* Icon */}
                                <div className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${config.bg}`}>
                                    <Icon className={`size-4 ${config.color}`} />
                                </div>

                                {/* Content */}
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className={`truncate text-sm ${notification.isRead ? "font-normal" : "font-semibold"}`}>
                                            {notification.title}
                                        </h3>
                                        {priorityBadge(notification.priority)}
                                    </div>
                                    <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">
                                        {notification.message}
                                    </p>
                                    <p className="mt-1.5 text-xs text-muted-foreground/70">
                                        {timeAgo(notification.createdAt)}
                                    </p>
                                </div>

                                {/* Read indicator */}
                                {!notification.isRead && (
                                    <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                                        <span className="text-xs text-muted-foreground">Mark read</span>
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
