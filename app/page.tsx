import Link from "next/link"
import { getServerSession } from "next-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BookOpen,
  GraduationCap,
  MessageSquare,
  Zap,
  Users,
  ArrowRight,
  CheckCircle,
  Star
} from "lucide-react"

export default async function IndexPage() {
  let session = null
  try {
    session = await getServerSession()
  } catch (error) {
    // Handle JWT decryption errors from old sessions
    console.log('Session error (likely old cookie):', error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative px-6 lg:px-8">
        <div className="mx-auto max-w-4xl pb-32 pt-20 sm:pb-40 sm:pt-32">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
              The Future of Course Design & Grading is Here
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
              Professor GENIE is an AI-powered platform that helps professors streamline course
              creation, design insightful assignments, and grade more efficiently.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              {!session ? (
                <>
                  <Link
                    href="/login"
                    className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    Get Started For Free
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href="/login"
                    className="text-sm font-semibold leading-6 text-gray-900 hover:text-blue-600 dark:text-white"
                  >
                    Sign In
                  </Link>
                </>
              ) : (
                <div className="flex gap-4">
                  <Link
                    href="/discussion"
                    className="flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    <MessageSquare className="size-4" />
                    Discussion Response Generator
                  </Link>
                  <Link
                    href="/grade"
                    className="flex items-center gap-2 rounded-md bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                  >
                    <GraduationCap className="size-4" />
                    Grading Assistant
                  </Link>
                </div>
              )}
            </div>

            {/* AI Provider Badges */}
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
                <Star className="size-3 text-yellow-500" />
                8 AI Providers
              </span>
              <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
                Free Options Available
              </span>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                Smart Failover
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-24 dark:bg-gray-900 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Powerful Features for Educators
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
              Everything you need to build and manage your courses effectively.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-6xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Feature 1 */}
              <Card className="relative overflow-hidden border-0 shadow-lg transition-shadow hover:shadow-xl">
                <CardHeader className="pb-4 text-center">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <BookOpen className="size-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-xl">AI-Powered Syllabus & Course Design</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Create comprehensive syllabi and design engaging courses in minutes.
                    Our AI helps you outline course structure, learning objectives, and content.
                  </CardDescription>
                  <Button variant="link" className="mt-4 p-0" asChild>
                    <Link href="/discussion">
                      Try Discussion Generator <ArrowRight className="ml-1 size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="relative overflow-hidden border-0 shadow-lg transition-shadow hover:shadow-xl">
                <CardHeader className="pb-4 text-center">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                    <MessageSquare className="size-8 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-xl">Intelligent Assignment Design</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Design effective assignments with AI-suggested rubrics and criteria,
                    tailored to your course goals and student learning outcomes.
                  </CardDescription>
                  <Button variant="link" className="mt-4 p-0" asChild>
                    <Link href="/discussion">
                      Create Assignments <ArrowRight className="ml-1 size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="relative overflow-hidden border-0 shadow-lg transition-shadow hover:shadow-xl">
                <CardHeader className="pb-4 text-center">
                  <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/20">
                    <GraduationCap className="size-8 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-xl">Automated Grading Assistance</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600 dark:text-gray-300">
                    Save time with AI-powered grading suggestions. Get insights into student
                    performance and provide faster, more consistent feedback.
                  </CardDescription>
                  <Button variant="link" className="mt-4 p-0" asChild>
                    <Link href="/grade">
                      Start Grading <ArrowRight className="ml-1 size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-gray-50 py-24 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Why Choose Professor GENIE?
            </h2>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
              <div className="flex items-start gap-4">
                <CheckCircle className="mt-1 size-6 shrink-0 text-green-500" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Multi-AI Reliability</h3>
                  <p className="text-gray-600 dark:text-gray-300">8 AI providers with automatic failover ensure you always have working AI assistance.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="mt-1 size-6 shrink-0 text-green-500" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Cost Optimized</h3>
                  <p className="text-gray-600 dark:text-gray-300">Smart provider selection prioritizes your paid APIs and falls back to free alternatives.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="mt-1 size-6 shrink-0 text-green-500" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Academic Focus</h3>
                  <p className="text-gray-600 dark:text-gray-300">Purpose-built for educators with features designed specifically for course management.</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="mt-1 size-6 shrink-0 text-green-500" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Easy to Use</h3>
                  <p className="text-gray-600 dark:text-gray-300">Intuitive interface designed for professors, not technical experts.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!session && (
        <section className="bg-blue-600 py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to transform your teaching?
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-blue-100">
                Join educators who are already using AI to create better courses and save time on grading.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link
                  href="/auth/signup"
                  className="rounded-md bg-white px-6 py-3 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Get Started For Free
                </Link>
                <Link
                  href="/auth/signin"
                  className="text-sm font-semibold leading-6 text-white hover:text-blue-100"
                >
                  Already have an account? Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
