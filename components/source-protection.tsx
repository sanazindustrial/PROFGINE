"use client"

import { useEffect } from "react"

/**
 * Client-side source code protection:
 * - Disables right-click context menu
 * - Blocks dev-tools keyboard shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U)
 * - Disables text selection & copy/paste on the page
 * - Prevents drag events on content
 */
export function SourceProtection() {
    useEffect(() => {
        // Disable right-click context menu
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault()
            return false
        }

        // Block dev-tools and view-source shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // F12
            if (e.key === "F12") {
                e.preventDefault()
                return false
            }
            // Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Elements)
            if (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) {
                e.preventDefault()
                return false
            }
            // Ctrl+U (View Source)
            if (e.ctrlKey && e.key.toUpperCase() === "U") {
                e.preventDefault()
                return false
            }
            // Ctrl+S (Save page)
            if (e.ctrlKey && e.key.toUpperCase() === "S") {
                e.preventDefault()
                return false
            }
            // Ctrl+A (Select all) on non-input elements
            if (
                e.ctrlKey &&
                e.key.toUpperCase() === "A" &&
                !(e.target instanceof HTMLInputElement) &&
                !(e.target instanceof HTMLTextAreaElement)
            ) {
                e.preventDefault()
                return false
            }
            // Ctrl+C / Ctrl+X copy/cut on non-input elements
            if (
                e.ctrlKey &&
                ["C", "X"].includes(e.key.toUpperCase()) &&
                !(e.target instanceof HTMLInputElement) &&
                !(e.target instanceof HTMLTextAreaElement)
            ) {
                e.preventDefault()
                return false
            }
        }

        // Disable copy event
        const handleCopy = (e: ClipboardEvent) => {
            if (
                !(e.target instanceof HTMLInputElement) &&
                !(e.target instanceof HTMLTextAreaElement)
            ) {
                e.preventDefault()
                return false
            }
        }

        // Disable drag
        const handleDragStart = (e: DragEvent) => {
            e.preventDefault()
            return false
        }

        // Disable text selection via selectstart
        const handleSelectStart = (e: Event) => {
            if (
                !(e.target instanceof HTMLInputElement) &&
                !(e.target instanceof HTMLTextAreaElement)
            ) {
                e.preventDefault()
                return false
            }
        }

        // Disable print-screen detection (limited)
        const handleBeforePrint = () => {
            document.body.style.visibility = "hidden"
        }
        const handleAfterPrint = () => {
            document.body.style.visibility = "visible"
        }

        document.addEventListener("contextmenu", handleContextMenu)
        document.addEventListener("keydown", handleKeyDown)
        document.addEventListener("copy", handleCopy)
        document.addEventListener("dragstart", handleDragStart)
        document.addEventListener("selectstart", handleSelectStart)
        window.addEventListener("beforeprint", handleBeforePrint)
        window.addEventListener("afterprint", handleAfterPrint)

        // Add CSS to disable selection globally (except inputs)
        const style = document.createElement("style")
        style.textContent = `
      body {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      @media print {
        body { display: none !important; }
      }
    `
        document.head.appendChild(style)

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu)
            document.removeEventListener("keydown", handleKeyDown)
            document.removeEventListener("copy", handleCopy)
            document.removeEventListener("dragstart", handleDragStart)
            document.removeEventListener("selectstart", handleSelectStart)
            window.removeEventListener("beforeprint", handleBeforePrint)
            window.removeEventListener("afterprint", handleAfterPrint)
            document.head.removeChild(style)
        }
    }, [])

    return null
}
