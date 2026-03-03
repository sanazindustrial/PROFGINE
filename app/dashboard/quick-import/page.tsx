"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Clipboard, ExternalLink, CheckCircle2, Copy, BookOpen } from "lucide-react"

export default function QuickImportPage() {
    const router = useRouter()
    const [url, setUrl] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [step, setStep] = useState<"input" | "waiting" | "done">("input")
    const [bookmarkletCopied, setBookmarkletCopied] = useState(false)

    // Auto-read clipboard on mount
    useEffect(() => {
        const readClipboard = async () => {
            try {
                const text = await navigator.clipboard.readText()
                // Check if it's a valid URL
                if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
                    setUrl(text)
                }
            } catch {
                // Clipboard permission denied - that's ok
            }
        }
        readClipboard()
    }, [])

    // Listen for messages from popup window
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data.type === "PROFGENIE_DISCUSSION_DATA") {
                const { posts, lmsType } = event.data
                if (posts && posts.length > 0) {
                    // Format and redirect to discussion response page
                    const content = posts.map((p: { studentName?: string; author?: string; content: string }) => {
                        const name = p.studentName || p.author || "Student"
                        return `${name}\n${p.content}`
                    }).join("\n\n---\n\n")

                    // Store in sessionStorage for the discussion page
                    sessionStorage.setItem("importedDiscussion", JSON.stringify({
                        content,
                        lmsType,
                        count: posts.length,
                        url
                    }))

                    setSuccess(`Successfully imported ${posts.length} posts!`)
                    setStep("done")

                    // Redirect to discussion page after a moment
                    setTimeout(() => {
                        router.push("/discussion?imported=true")
                    }, 1500)
                }
            }
        }

        window.addEventListener("message", handleMessage)
        return () => window.removeEventListener("message", handleMessage)
    }, [router, url])

    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText()
            setUrl(text)
        } catch {
            setError("Could not read clipboard. Please paste manually.")
        }
    }

    const handleOpenAndScan = () => {
        if (!url) {
            setError("Please enter a URL first")
            return
        }

        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            setError("Please enter a valid URL starting with http:// or https://")
            return
        }

        setError("")
        setIsLoading(true)
        setStep("waiting")

        // Open URL in new tab - user will click the bookmarklet there
        window.open(url, "_blank")

        setIsLoading(false)
    }

    const getBookmarkletCode = () => {
        return `javascript:(function(){var s=document.createElement('script');s.src='https://profgenie.ai/bookmarklet-auth.js?t='+Date.now();document.body.appendChild(s);})();`
    }

    const copyBookmarklet = () => {
        navigator.clipboard.writeText(getBookmarkletCode())
        setBookmarkletCopied(true)
        setTimeout(() => setBookmarkletCopied(false), 2000)
    }

    return (
        <div className="container mx-auto max-w-2xl py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Quick Import</h1>
                <p className="text-muted-foreground mt-2">
                    Import discussion posts from any LMS with just a URL
                </p>
            </div>

            {step === "input" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Step 1: Enter Discussion URL
                        </CardTitle>
                        <CardDescription>
                            Paste the URL of your LMS discussion page
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                placeholder="https://your-lms.edu/discussion/12345"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={handlePasteFromClipboard}
                                title="Paste from clipboard"
                            >
                                <Clipboard className="h-4 w-4" />
                            </Button>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            onClick={handleOpenAndScan}
                            className="w-full"
                            disabled={isLoading || !url}
                        >
                            {isLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <ExternalLink className="mr-2 h-4 w-4" />
                            )}
                            Open LMS Page
                        </Button>

                        <div className="border-t pt-4 mt-4">
                            <p className="text-sm font-medium mb-2">Step 2: Click the bookmarklet on LMS page</p>
                            <div className="flex items-center gap-2">
                                <a
                                    href={getBookmarkletCode()}
                                    className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        alert("Drag this button to your bookmarks bar!")
                                    }}
                                    draggable="true"
                                >
                                    📚 ProfGenie Grab
                                </a>
                                <span className="text-xs text-muted-foreground">← Drag to bookmarks bar</span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={copyBookmarklet}
                                className="mt-2"
                            >
                                <Copy className="h-3 w-3 mr-1" />
                                {bookmarkletCopied ? "Copied!" : "Copy bookmarklet code"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === "waiting" && (
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center space-y-4">
                            <div className="text-4xl">📚</div>
                            <h2 className="text-xl font-semibold">LMS Page Opened</h2>
                            <p className="text-muted-foreground">
                                Now click the <strong>ProfGenie Grab</strong> bookmarklet on the LMS page
                            </p>
                            <div className="flex items-center justify-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm text-muted-foreground">Waiting for data...</span>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setStep("input")}
                                className="mt-4"
                            >
                                ← Go Back
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === "done" && (
                <Card>
                    <CardContent className="py-8">
                        <div className="text-center space-y-4">
                            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
                            <h2 className="text-xl font-semibold text-green-700 dark:text-green-400">{success}</h2>
                            <p className="text-muted-foreground">Redirecting to discussion page...</p>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="mt-8 p-4 bg-muted rounded-lg">
                <h3 className="font-medium mb-2">💡 How it works</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Copy the discussion URL from your LMS</li>
                    <li>Paste it here (or it auto-fills from clipboard)</li>
                    <li>Click &quot;Open LMS Page&quot;</li>
                    <li>On the LMS page, click the ProfGenie Grab bookmarklet</li>
                    <li>Posts are extracted and you&apos;re redirected here</li>
                </ol>
            </div>
        </div>
    )
}
