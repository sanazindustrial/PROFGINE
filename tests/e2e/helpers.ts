/**
 * Shared E2E Test Infrastructure
 * Reusable helpers for all feature test suites
 */

import { PrismaClient } from "@prisma/client"

export const prisma = new PrismaClient()

export interface TestResult {
    name: string
    phase: string
    passed: boolean
    duration: number
    error?: string
    details?: string
}

export const results: TestResult[] = []

export const colors = {
    green: "\x1b[32m",
    red: "\x1b[31m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m",
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
}

export function log(msg: string) {
    console.log(msg)
}

export function logPhase(phase: string) {
    log(`\n${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
    log(`${colors.bold}${colors.blue}  ${phase}${colors.reset}`)
    log(`${colors.bold}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
}

export function logSection(title: string) {
    log(`\n${colors.bold}${colors.cyan}  ── ${title} ──${colors.reset}`)
}

export async function runTest(
    name: string,
    phase: string,
    fn: () => Promise<string | void>
): Promise<boolean> {
    const start = Date.now()
    try {
        const details = await fn()
        const duration = Date.now() - start
        results.push({ name, phase, passed: true, duration, details: details || undefined })
        log(`  ${colors.green}✓${colors.reset} ${name} ${colors.dim}(${duration}ms)${colors.reset}`)
        return true
    } catch (err) {
        const duration = Date.now() - start
        const errorMsg = err instanceof Error ? err.message : String(err)
        results.push({ name, phase, passed: false, duration, error: errorMsg })
        log(`  ${colors.red}✗${colors.reset} ${name} ${colors.dim}(${duration}ms)${colors.reset}`)
        log(`    ${colors.red}Error: ${errorMsg}${colors.reset}`)
        return false
    }
}

export function assert(condition: boolean, message: string) {
    if (!condition) throw new Error(`Assertion failed: ${message}`)
}

export function assertDefined<T>(value: T | null | undefined, name: string): asserts value is T {
    if (value === null || value === undefined) {
        throw new Error(`Expected ${name} to be defined, got ${value}`)
    }
}

export function assertEqual<T>(actual: T, expected: T, name: string) {
    if (actual !== expected) {
        throw new Error(`Expected ${name} to be ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`)
    }
}

export function assertIncludes<T>(arr: T[], value: T, name: string) {
    if (!arr.includes(value)) {
        throw new Error(`Expected ${name} to include ${JSON.stringify(value)}`)
    }
}

export function assertGreaterThan(actual: number, expected: number, name: string) {
    if (actual <= expected) {
        throw new Error(`Expected ${name} (${actual}) to be greater than ${expected}`)
    }
}

export function printReport(suiteName: string) {
    log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}`)
    log(`${colors.bold}${colors.cyan}  ${suiteName} — TEST REPORT${colors.reset}`)
    log(`${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`)

    const passed = results.filter(r => r.passed)
    const failed = results.filter(r => !r.passed)
    const phases = [...new Set(results.map(r => r.phase))]
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

    for (const phase of phases) {
        const phaseResults = results.filter(r => r.phase === phase)
        const phasePassed = phaseResults.filter(r => r.passed).length
        const phaseTotal = phaseResults.length
        const status = phasePassed === phaseTotal
            ? `${colors.green}ALL PASSED${colors.reset}`
            : `${colors.red}${phaseTotal - phasePassed} FAILED${colors.reset}`

        log(`  ${colors.bold}${phase}${colors.reset}: ${phasePassed}/${phaseTotal} ${status}`)
    }

    log("")
    if (failed.length > 0) {
        log(`${colors.red}  FAILED TESTS:${colors.reset}`)
        for (const f of failed) {
            log(`    ${colors.red}✗ [${f.phase}] ${f.name}: ${f.error}${colors.reset}`)
        }
        log("")
    }

    log(`  Total: ${passed.length}/${results.length} tests passed`)
    log(`  Duration: ${totalDuration}ms`)
    log(`\n${colors.bold}${colors.cyan}═══════════════════════════════════════════════════════════════${colors.reset}\n`)

    if (failed.length === 0) {
        log(`  ${colors.green}${colors.bold}✓ ALL TESTS PASSED${colors.reset}\n`)
    } else {
        log(`  ${colors.red}${colors.bold}✗ ${failed.length} TEST(S) FAILED${colors.reset}\n`)
    }

    return failed.length === 0
}

/** Unique suffix for this test run — prevents collisions */
export const RUN_ID = Date.now().toString(36)
export const TEST_EMAIL_PREFIX = `e2e-${RUN_ID}`
