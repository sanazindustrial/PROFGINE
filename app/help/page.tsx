"use client"

import { useSession } from "next-auth/react"
import Link from "next/link"
import { FeatureLayout } from "@/components/feature-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    BookOpen,
    GraduationCap,
    User,
    Settings,
    Crown,
    Shield,
    MessageSquare,
    FileText,
    Users,
    Zap,
    Star,
    HelpCircle,
    PlayCircle,
    CheckCircle,
    AlertCircle,
    Lightbulb,
    Rocket,
    Camera,
    CreditCard,
    Bell,
    Lock
} from "lucide-react"

export default function HelpPage() {
    const { data: session } = useSession()

    const quickStartSteps = [
        {
            icon: <User className="size-5" />,
            title: "Complete Your Profile",
            description: "Click on your avatar in the top-right corner and select 'Profile Settings'",
            action: "Go to Profile",
            href: "/profile"
        },
        {
            icon: <BookOpen className="size-5" />,
            title: "Create Your First Course",
            description: "Set up your course structure with modules and assignments",
            action: "Create Course",
            href: "/dashboard"
        },
        {
            icon: <MessageSquare className="size-5" />,
            title: "Try AI Assistance",
            description: "Generate discussion responses and grade assignments with AI",
            action: "Start Grading",
            href: "/grade"
        }
    ]

    const features = [
        {
            icon: <GraduationCap className="size-6 text-blue-600" />,
            title: "Course Management",
            description: "Create and organize courses, modules, and assignments",
            items: ["Course creation", "Module organization", "Assignment management", "Student enrollment"]
        },
        {
            icon: <MessageSquare className="size-6 text-green-600" />,
            title: "AI Discussion Responses",
            description: "Generate thoughtful responses to student discussions",
            items: ["Context-aware responses", "Multiple AI models", "Custom prompts", "Style preferences"]
        },
        {
            icon: <FileText className="size-6 text-purple-600" />,
            title: "Intelligent Grading",
            description: "AI-powered grading with custom rubrics and feedback",
            items: ["Automated scoring", "Detailed feedback", "Custom rubrics", "Grade analytics"]
        },
        {
            icon: <Users className="size-6 text-orange-600" />,
            title: "Student Management",
            description: "Track student progress and manage enrollments",
            items: ["Progress tracking", "Enrollment management", "Performance analytics", "Communication tools"]
        }
    ]

    const faqItems = [
        {
            question: "How do I get started with Professor GENIE?",
            answer: "Start by completing your profile, then create your first course. You can immediately begin using AI features to generate discussion responses and grade assignments."
        },
        {
            question: "What AI models are available?",
            answer: "We support multiple AI providers including OpenAI GPT, Anthropic Claude, Google Gemini, Groq, and others. The system automatically falls back to available providers."
        },
        {
            question: "How does the subscription system work?",
            answer: "We offer Free Trial, Basic, Premium, and Enterprise tiers. Each tier includes different numbers of AI credits and features. Admins have unlimited access."
        },
        {
            question: "Can I customize AI responses?",
            answer: "Yes! You can set your teaching style, grading difficulty, feedback depth, and even create custom prompt templates for consistent responses."
        },
        {
            question: "Is my data secure?",
            answer: "Absolutely. We use enterprise-grade encryption, secure database storage, and never share your academic data with third parties."
        },
        {
            question: "How do I invite other professors?",
            answer: "Admins can invite users through the User Management panel. Invited users receive email invitations to join your institution."
        }
    ]

    const troubleshooting = [
        {
            issue: "I can't access certain features",
            solution: "Check your subscription tier and role. Some features require Premium/Enterprise subscriptions or specific roles (Professor/Admin)."
        },
        {
            issue: "AI responses are not generating",
            solution: "Ensure you have available credits in your subscription. The system will show credit usage in your dashboard."
        },
        {
            issue: "Profile changes aren't saving",
            solution: "Make sure all required fields are filled out and you have a stable internet connection. Try refreshing the page."
        },
        {
            issue: "Students can't enroll in my course",
            solution: "Verify the course is published and enrollment settings are configured correctly in your course management panel."
        }
    ]

    return (
        <FeatureLayout
            title="Help & Documentation"
            description="Everything you need to know about using Professor GENIE"
        >
            <div className="space-y-8">
                {/* Quick Start Guide */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Rocket className="size-5" />
                            Quick Start Guide
                        </CardTitle>
                        <CardDescription>
                            Get up and running with Professor GENIE in 3 simple steps
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            {quickStartSteps.map((step, index) => (
                                <div key={index} className="space-y-4 text-center">
                                    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-100">
                                        {step.icon}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{step.title}</h3>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {step.description}
                                        </p>
                                    </div>
                                    <Button asChild size="sm">
                                        <Link href={step.href}>
                                            {step.action}
                                        </Link>
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Feature Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="size-5" />
                            Platform Features
                        </CardTitle>
                        <CardDescription>
                            Discover what you can do with Professor GENIE
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {features.map((feature, index) => (
                                <div key={index} className="flex gap-4">
                                    <div className="shrink-0">
                                        {feature.icon}
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="font-semibold">{feature.title}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {feature.description}
                                        </p>
                                        <ul className="space-y-1 text-sm">
                                            {feature.items.map((item, itemIndex) => (
                                                <li key={itemIndex} className="flex items-center gap-2">
                                                    <CheckCircle className="size-3 shrink-0 text-green-500" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Detailed Documentation */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="size-5" />
                            Detailed Documentation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="profile" className="w-full">
                            <TabsList className="grid w-full grid-cols-4">
                                <TabsTrigger value="profile">Profile</TabsTrigger>
                                <TabsTrigger value="courses">Courses</TabsTrigger>
                                <TabsTrigger value="ai-features">AI Features</TabsTrigger>
                                <TabsTrigger value="admin">Admin</TabsTrigger>
                            </TabsList>

                            <TabsContent value="profile" className="mt-6 space-y-4">
                                <h3 className="text-lg font-semibold">Profile Management</h3>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="flex items-center gap-2 font-medium">
                                            <User className="size-4" />
                                            Basic Information
                                        </h4>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Update your name, bio, and professional information. Your profile helps personalize AI responses and creates a professional presence.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="flex items-center gap-2 font-medium">
                                            <Camera className="size-4" />
                                            Profile Picture
                                        </h4>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Your Google account image is automatically imported. Profile pictures appear in the header and throughout the platform.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="flex items-center gap-2 font-medium">
                                            <GraduationCap className="size-4" />
                                            Professional Details
                                        </h4>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Add your institution, department, and other professional information to help AI responses align with your academic context.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="courses" className="mt-6 space-y-4">
                                <h3 className="text-lg font-semibold">Course Management</h3>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="flex items-center gap-2 font-medium">
                                            <BookOpen className="size-4" />
                                            Creating Courses
                                        </h4>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Set up course structure with title, code, term, and description. Organize content into modules and create assignments.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="flex items-center gap-2 font-medium">
                                            <Users className="size-4" />
                                            Student Enrollment
                                        </h4>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Manage student enrollments, track participation, and monitor progress across all your courses.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="flex items-center gap-2 font-medium">
                                            <FileText className="size-4" />
                                            Assignments
                                        </h4>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Create various assignment types (essays, discussions, projects) with custom rubrics and due dates.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="ai-features" className="mt-6 space-y-4">
                                <h3 className="text-lg font-semibold">AI Features</h3>
                                <div className="space-y-4">
                                    <div>
                                        <h4 className="flex items-center gap-2 font-medium">
                                            <MessageSquare className="size-4" />
                                            Discussion Responses
                                        </h4>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Generate thoughtful responses to student discussions. AI analyzes context and creates responses matching your teaching style.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="flex items-center gap-2 font-medium">
                                            <Zap className="size-4" />
                                            Automated Grading
                                        </h4>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            AI-powered grading with detailed feedback. Upload assignments and receive comprehensive evaluations with rubric scoring.
                                        </p>
                                    </div>
                                    <div>
                                        <h4 className="flex items-center gap-2 font-medium">
                                            <Settings className="size-4" />
                                            Customization
                                        </h4>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            Adjust AI personality, grading difficulty, feedback depth, and create custom prompt templates for consistent results.
                                        </p>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="admin" className="mt-6 space-y-4">
                                <h3 className="text-lg font-semibold">Administrator Features</h3>
                                {session?.user?.role === 'ADMIN' ? (
                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="flex items-center gap-2 font-medium">
                                                <Users className="size-4" />
                                                User Management
                                            </h4>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Invite professors, manage user roles, and oversee institutional accounts and subscriptions.
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="flex items-center gap-2 font-medium">
                                                <Crown className="size-4" />
                                                Subscription Control
                                            </h4>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Manage subscription tiers, allocate credits, and monitor usage across your institution.
                                            </p>
                                        </div>
                                        <div>
                                            <h4 className="flex items-center gap-2 font-medium">
                                                <Settings className="size-4" />
                                                AI Configuration
                                            </h4>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                Configure AI providers, manage API keys, and customize system-wide AI behavior and settings.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="py-8 text-center">
                                        <Shield className="mx-auto mb-4 size-12 text-muted-foreground" />
                                        <p className="text-muted-foreground">
                                            Administrator features are only available to admin users.
                                        </p>
                                        {session?.user?.role === 'PROFESSOR' && (
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                Contact your institution&apos;s administrator for elevated access.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* FAQ Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HelpCircle className="size-5" />
                            Frequently Asked Questions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {faqItems.map((faq, index) => (
                                <div key={index}>
                                    <h3 className="mb-2 text-sm font-semibold">{faq.question}</h3>
                                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Troubleshooting */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <AlertCircle className="size-5" />
                            Troubleshooting
                        </CardTitle>
                        <CardDescription>
                            Common issues and solutions
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {troubleshooting.map((item, index) => (
                                <div key={index} className="border-l-4 border-blue-500 pl-4">
                                    <h3 className="mb-2 text-sm font-semibold">Problem: {item.issue}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        <strong>Solution:</strong> {item.solution}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Contact & Support */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="size-5" />
                            Need More Help?
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-lg border p-4 text-center">
                                <BookOpen className="mx-auto mb-2 size-8 text-blue-600" />
                                <h3 className="mb-2 font-semibold">Documentation</h3>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Comprehensive guides and tutorials
                                </p>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href="/docs">View Docs</Link>
                                </Button>
                            </div>
                            <div className="rounded-lg border p-4 text-center">
                                <Users className="mx-auto mb-2 size-8 text-green-600" />
                                <h3 className="mb-2 font-semibold">Community</h3>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Connect with other educators
                                </p>
                                <Button variant="outline" size="sm" disabled>
                                    Coming Soon
                                </Button>
                            </div>
                            <div className="rounded-lg border p-4 text-center">
                                <MessageSquare className="mx-auto mb-2 size-8 text-purple-600" />
                                <h3 className="mb-2 font-semibold">Support</h3>
                                <p className="mb-4 text-sm text-muted-foreground">
                                    Direct support from our team
                                </p>
                                <Button variant="outline" size="sm" disabled>
                                    Contact Support
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </FeatureLayout>
    )
}