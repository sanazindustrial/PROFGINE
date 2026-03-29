"use client"

import { useEffect } from 'react'

export function SourceProtection() {
    useEffect(() => {
        // Disable right-click context menu
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault()
            return false
        }

        // Block developer tools keyboard shortcuts
        const handleKeyDown = (e: KeyboardEvent) => {
            // F12
            if (e.key === 'F12') {
                e.preventDefault()
                return false
            }
            // Ctrl+Shift+I (Inspect Element)
            if (e.ctrlKey && e.shiftKey && e.key === 'I') {
                e.preventDefault()
                return false
            }
            // Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && e.key === 'J') {
                e.preventDefault()
                return false
            }
            // Ctrl+Shift+C (Element picker)
            if (e.ctrlKey && e.shiftKey && e.key === 'C') {
                e.preventDefault()
                return false
            }
            // Ctrl+U (View Source)
            if (e.ctrlKey && e.key === 'u') {
                e.preventDefault()
                return false
            }
            // Ctrl+S (Save)
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault()
                return false
            }
        }

        // Disable copy
        const handleCopy = (e: ClipboardEvent) => {
            e.preventDefault()
            return false
        }

        // Disable paste
        const handlePaste = (e: ClipboardEvent) => {
            // Allow paste in input/textarea elements
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return true
            }
            e.preventDefault()
            return false
        }

        // Disable drag
        const handleDragStart = (e: DragEvent) => {
            e.preventDefault()
            return false
        }

        // Disable text selection on non-input elements
        const handleSelectStart = (e: Event) => {
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                return true
            }
            e.preventDefault()
            return false
        }

        // Console warning
        const warningStyle = 'color: red; font-size: 24px; font-weight: bold;'
        const infoStyle = 'color: #333; font-size: 14px;'
        console.log('%c⚠️ STOP!', warningStyle)
        console.log(
            '%cThis is a protected application. Unauthorized access, copying, or reverse engineering of this software is strictly prohibited under applicable intellectual property laws including the Digital Millennium Copyright Act (DMCA), Computer Fraud and Abuse Act (CFAA), and FERPA regulations for educational data protection.',
            infoStyle
        )
        console.log(
            '%c© Professor GENIE Platform - All Rights Reserved. Unauthorized use is subject to legal action.',
            infoStyle
        )

        document.addEventListener('contextmenu', handleContextMenu)
        document.addEventListener('keydown', handleKeyDown)
        document.addEventListener('copy', handleCopy)
        document.addEventListener('paste', handlePaste)
        document.addEventListener('dragstart', handleDragStart)
        document.addEventListener('selectstart', handleSelectStart)

        // Add CSS-based protection
        document.body.style.setProperty('-webkit-user-select', 'none')
        document.body.style.setProperty('-moz-user-select', 'none')
        document.body.style.setProperty('-ms-user-select', 'none')
        document.body.style.setProperty('user-select', 'none')

        // Allow text selection in form inputs
        const style = document.createElement('style')
        style.textContent = `
            input, textarea, [contenteditable="true"] {
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                user-select: text !important;
            }
        `
        document.head.appendChild(style)

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu)
            document.removeEventListener('keydown', handleKeyDown)
            document.removeEventListener('copy', handleCopy)
            document.removeEventListener('paste', handlePaste)
            document.removeEventListener('dragstart', handleDragStart)
            document.removeEventListener('selectstart', handleSelectStart)
            document.body.style.removeProperty('-webkit-user-select')
            document.body.style.removeProperty('-moz-user-select')
            document.body.style.removeProperty('-ms-user-select')
            document.body.style.removeProperty('user-select')
            if (style.parentNode) {
                style.parentNode.removeChild(style)
            }
        }
    }, [])

    return null
}
