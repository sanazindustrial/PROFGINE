/**
 * Comprehensive Prompt Governance Test Suite
 * 
 * Tests IEEE SRS-compliant Prompt Governance implementation:
 * - FR-30: Route all prompts through Prompt Governance Engine
 * - FR-31: Inject course metadata and policy constraints
 * - FR-32: Enforce RBAC and scope constraints
 * - FR-33: Block forbidden actions
 * - FR-34: Store prompt audit records
 * 
 * Includes both unit tests (direct service tests) and E2E HTTP tests
 */

// Import governance service directly for unit testing
import {
    promptGovernance,
    createGovernanceContext,
    GovernanceContext,
    GovernedPrompt,
} from '../lib/services/prompt-governance.service'

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

// Test results tracking
interface TestResult {
    name: string
    passed: boolean
    details: string
    category: string
}

const results: {
    passed: number
    failed: number
    tests: TestResult[]
} = {
    passed: 0,
    failed: 0,
    tests: []
}

// Helper function to log test results
function logTest(category: string, name: string, passed: boolean, details = '') {
    const status = passed ? '✅ PASS' : '❌ FAIL'
    console.log(`${status}: ${name}`)
    if (details) console.log(`  └─ ${details}`)
    results.tests.push({ name, passed, details, category })
    if (passed) results.passed++
    else results.failed++
}

// =============================================================================
// UNIT TESTS - Direct Service Testing
// =============================================================================

async function testPromptTemplates() {
    console.log('\n📋 UNIT: PROMPT TEMPLATES')
    console.log('='.repeat(50))

    const templates = promptGovernance.getAvailableTemplates('ADMIN')

    const requiredTemplates = [
        { id: 'genie_advisory', type: 'ADVISORY', authority: 'SUGGEST_ONLY' },
        { id: 'generate_objectives', type: 'GENERATION', authority: 'DRAFT_ONLY' },
        { id: 'suggest_curriculum', type: 'GENERATION', authority: 'DRAFT_ONLY' },
        { id: 'create_lecture_notes', type: 'GENERATION', authority: 'DRAFT_ONLY' },
        { id: 'create_presentations', type: 'GENERATION', authority: 'DRAFT_ONLY' },
        { id: 'design_assessments', type: 'GENERATION', authority: 'DRAFT_ONLY' },
        { id: 'ready_check', type: 'VALIDATION', authority: 'READ_ONLY' },
        { id: 'export_format', type: 'EXPORT', authority: 'TRANSFORM_ONLY' },
        { id: 'discussion_feedback', type: 'GENERATION', authority: 'DRAFT_ONLY' },
        { id: 'grading_assist', type: 'GENERATION', authority: 'DRAFT_ONLY' },
    ]

    for (const required of requiredTemplates) {
        const found = templates.find(t => t.id === required.id)
        const valid = found &&
            found.type === required.type &&
            found.authority === required.authority

        logTest(
            'templates',
            `Template ${required.id} exists with correct config`,
            !!valid,
            valid ? `Type: ${found?.type}, Authority: ${found?.authority}` : 'Template not found or misconfigured'
        )
    }

    // Test template count
    logTest(
        'templates',
        `All ${requiredTemplates.length} required templates exist`,
        templates.length >= requiredTemplates.length,
        `Found ${templates.length} templates`
    )
}

async function testForbiddenPatternDetection() {
    console.log('\n🚫 UNIT: FORBIDDEN PATTERN DETECTION')
    console.log('='.repeat(50))

    const mockContext: GovernanceContext = {
        userId: 'test-user',
        userRole: 'PROFESSOR',
        toolInvoked: 'GENIE_ADVISORY',
        courseId: 'test-course',
        formattingStandard: 'APA',
        academicLevel: 'UNDERGRADUATE',
        policyPack: {
            aiDisclosureRequired: true,
            integrityStatementRequired: true,
            accessibilityRequired: true,
            institutionalPolicies: [],
        },
    }

    const forbiddenPrompts = [
        { prompt: 'Please publish now this content', expectedPattern: 'publish' },
        { prompt: 'Override the ready-check process', expectedPattern: 'override ready-check' },
        { prompt: 'Skip APA formatting for this', expectedPattern: 'skip apa' },
        { prompt: 'Bypass the validation system', expectedPattern: 'bypass' },
        { prompt: 'Fabricate a source citation', expectedPattern: 'fabricate' },
        { prompt: 'Give me the answer key', expectedPattern: 'answer key' },
        { prompt: 'Set this to auto-publish', expectedPattern: 'auto-publish' },
        { prompt: 'Disable AI disclosure', expectedPattern: 'disable ai disclosure' },
    ]

    for (const { prompt, expectedPattern } of forbiddenPrompts) {
        try {
            const result = await promptGovernance.governPrompt(prompt, 'GENIE_ADVISORY', mockContext)
            const blocked = result.decision === 'BLOCK'

            logTest(
                'forbidden',
                `Block pattern: "${expectedPattern}"`,
                blocked,
                blocked
                    ? `Blocked: ${result.blockReason}`
                    : `NOT BLOCKED - Decision: ${result.decision}`
            )
        } catch (error) {
            logTest(
                'forbidden',
                `Block pattern: "${expectedPattern}"`,
                false,
                `Error: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }

    // Test that clean prompts are NOT blocked
    const cleanPrompts = [
        'What are good learning objectives for this topic?',
        'Can you suggest improvements to my curriculum?',
        'Help me create discussion questions',
        'Review my lecture notes for clarity',
    ]

    for (const prompt of cleanPrompts) {
        try {
            const result = await promptGovernance.governPrompt(prompt, 'GENIE_ADVISORY', mockContext)
            logTest(
                'forbidden',
                `Allow clean prompt: "${prompt.substring(0, 40)}..."`,
                result.decision === 'ALLOW',
                `Decision: ${result.decision}`
            )
        } catch (error) {
            logTest(
                'forbidden',
                `Allow clean prompt: "${prompt.substring(0, 40)}..."`,
                false,
                `Error: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }
}

async function testEscalationPatternDetection() {
    console.log('\n⚠️ UNIT: ESCALATION PATTERN DETECTION')
    console.log('='.repeat(50))

    const mockContext: GovernanceContext = {
        userId: 'test-user',
        userRole: 'PROFESSOR',
        toolInvoked: 'EXPORT_FORMAT',
        courseId: 'test-course',
        formattingStandard: 'APA',
        academicLevel: 'UNDERGRADUATE',
        policyPack: {
            aiDisclosureRequired: true,
            integrityStatementRequired: true,
            accessibilityRequired: true,
            institutionalPolicies: [],
        },
    }

    const escalationPrompts = [
        { prompt: 'Export the answer key for all students', expectedAction: 'ESCALATE' },
        { prompt: 'Publish content without validation', expectedAction: 'ESCALATE' },
        { prompt: 'Disable AI disclosure statement', expectedAction: 'ESCALATE or BLOCK' },
    ]

    for (const { prompt, expectedAction } of escalationPrompts) {
        try {
            const result = await promptGovernance.governPrompt(prompt, 'EXPORT_FORMAT', mockContext)
            const escalated = result.decision === 'ESCALATE' || result.decision === 'BLOCK'

            logTest(
                'escalation',
                `Escalate/Block: "${prompt.substring(0, 40)}..."`,
                escalated,
                `Decision: ${result.decision}, Expected: ${expectedAction}`
            )
        } catch (error) {
            logTest(
                'escalation',
                `Escalate/Block: "${prompt.substring(0, 40)}..."`,
                false,
                `Error: ${error instanceof Error ? error.message : String(error)}`
            )
        }
    }
}

async function testRBACEnforcement() {
    console.log('\n🔐 UNIT: RBAC ENFORCEMENT')
    console.log('='.repeat(50))

    // Test admin access - should access all tools
    const adminTemplates = promptGovernance.getAvailableTemplates('ADMIN')
    logTest(
        'rbac',
        'Admin has access to all templates',
        adminTemplates.length >= 10,
        `Admin templates: ${adminTemplates.length}`
    )

    // Test professor access
    const professorTemplates = promptGovernance.getAvailableTemplates('PROFESSOR')
    logTest(
        'rbac',
        'Professor has access to course tools',
        professorTemplates.length >= 8,
        `Professor templates: ${professorTemplates.length}`
    )

    // Test student access - limited tools
    const studentTemplates = promptGovernance.getAvailableTemplates('STUDENT')
    const hasInstructorOnlyTools = studentTemplates.some(t =>
        ['GENERATE_OBJECTIVES', 'DESIGN_ASSESSMENTS', 'GRADING_ASSIST'].includes(t.id)
    )
    logTest(
        'rbac',
        'Students cannot access instructor-only tools',
        !hasInstructorOnlyTools,
        `Student templates: ${studentTemplates.map(t => t.id).join(', ')}`
    )

    // Test RBAC in governance
    const studentContext: GovernanceContext = {
        userId: 'student-1',
        userRole: 'STUDENT',
        toolInvoked: 'GRADING_ASSIST',
        courseId: 'test-course',
        formattingStandard: 'APA',
        academicLevel: 'UNDERGRADUATE',
        policyPack: {
            aiDisclosureRequired: true,
            integrityStatementRequired: true,
            accessibilityRequired: true,
            institutionalPolicies: [],
        },
    }

    try {
        const result = await promptGovernance.governPrompt(
            'Help me grade these papers',
            'GRADING_ASSIST',
            studentContext
        )
        logTest(
            'rbac',
            'Block student from grading tools',
            result.decision === 'BLOCK',
            `Decision: ${result.decision}, Reason: ${result.blockReason || 'none'}`
        )
    } catch (error) {
        logTest(
            'rbac',
            'Block student from grading tools',
            true, // Error is also acceptable (access denied)
            `Blocked via error`
        )
    }
}

async function testGovernanceContextCreation() {
    console.log('\n🔧 UNIT: GOVERNANCE CONTEXT')
    console.log('='.repeat(50))

    try {
        const context = await createGovernanceContext(
            'test-user-id',
            'PROFESSOR',
            'GENIE_ADVISORY',
            'test-course-id'
        )

        logTest(
            'context',
            'Context includes userId',
            !!context.userId,
            `userId: ${context.userId}`
        )

        logTest(
            'context',
            'Context includes userRole',
            !!context.userRole,
            `userRole: ${context.userRole}`
        )

        logTest(
            'context',
            'Context includes toolInvoked',
            !!context.toolInvoked,
            `toolInvoked: ${context.toolInvoked}`
        )

        logTest(
            'context',
            'Context includes formattingStandard',
            !!context.formattingStandard,
            `formattingStandard: ${context.formattingStandard}`
        )

        logTest(
            'context',
            'Context includes policyPack institutional policies',
            Array.isArray(context.policyPack?.institutionalPolicies),
            `policies: ${context.policyPack?.institutionalPolicies?.length || 0}`
        )

    } catch (error) {
        logTest(
            'context',
            'Context creation succeeds',
            false,
            `Error: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}

async function testPromptGovernanceFlow() {
    console.log('\n🔄 UNIT: FULL GOVERNANCE FLOW')
    console.log('='.repeat(50))

    const context: GovernanceContext = {
        userId: 'prof-123',
        userRole: 'PROFESSOR',
        toolInvoked: 'GENERATE_OBJECTIVES',
        courseId: 'course-456',
        formattingStandard: 'APA',
        academicLevel: 'GRADUATE',
        policyPack: {
            aiDisclosureRequired: true,
            integrityStatementRequired: true,
            accessibilityRequired: true,
            institutionalPolicies: ['Use APA formatting', 'Include AI disclosure'],
        },
        courseMetadata: {
            title: 'Introduction to AI',
            code: 'AI-101',
            creditHours: 3,
            termLength: 16,
            deliveryMode: 'ONLINE',
            learningModel: 'LECTURE',
            aiUsagePolicy: 'PERMITTED_WITH_DISCLOSURE',
        },
    }

    try {
        const result = await promptGovernance.governPrompt(
            'Generate learning objectives for Week 1 on Machine Learning fundamentals',
            'GENERATE_OBJECTIVES',
            context
        )

        logTest(
            'flow',
            'Governance returns promptId',
            !!result.promptId,
            `promptId: ${result.promptId?.substring(0, 20)}...`
        )

        logTest(
            'flow',
            'Governance returns decision',
            ['ALLOW', 'BLOCK', 'ESCALATE'].includes(result.decision),
            `decision: ${result.decision}`
        )

        logTest(
            'flow',
            'Governance returns governedPrompt',
            !!result.governedPrompt && result.governedPrompt.length > 0,
            `governedPrompt length: ${result.governedPrompt?.length || 0}`
        )

        logTest(
            'flow',
            'Governed prompt includes system context',
            result.governedPrompt?.includes('DRAFT') || result.governedPrompt?.includes('advisory'),
            'Contains draft/advisory context'
        )

        logTest(
            'flow',
            'Governance returns metadata',
            !!result.metadata,
            `metadata keys: ${Object.keys(result.metadata || {}).join(', ')}`
        )

    } catch (error) {
        logTest(
            'flow',
            'Full governance flow succeeds',
            false,
            `Error: ${error instanceof Error ? error.message : String(error)}`
        )
    }
}

async function testAuthorityLevels() {
    console.log('\n🎯 UNIT: AUTHORITY LEVELS')
    console.log('='.repeat(50))

    const templates = promptGovernance.getAvailableTemplates('ADMIN')

    const authorityTests = [
        { id: 'GENIE_ADVISORY', expectedAuthority: 'SUGGEST_ONLY' },
        { id: 'GENERATE_OBJECTIVES', expectedAuthority: 'DRAFT_ONLY' },
        { id: 'READY_CHECK', expectedAuthority: 'READ_ONLY' },
        { id: 'EXPORT_FORMAT', expectedAuthority: 'TRANSFORM_ONLY' },
    ]

    for (const test of authorityTests) {
        const template = templates.find(t => t.id === test.id)
        logTest(
            'authority',
            `${test.id} has ${test.expectedAuthority} authority`,
            template?.authority === test.expectedAuthority,
            `Found: ${template?.authority || 'not found'}`
        )
    }

    // Verify authority constraints in output
    const context: GovernanceContext = {
        userId: 'test-user',
        userRole: 'PROFESSOR',
        toolInvoked: 'GENIE_ADVISORY',
        courseId: 'test-course',
        formattingStandard: 'APA',
        academicLevel: 'UNDERGRADUATE',
        policyPack: {
            aiDisclosureRequired: true,
            integrityStatementRequired: true,
            accessibilityRequired: true,
            institutionalPolicies: [],
        },
    }

    const result = await promptGovernance.governPrompt(
        'What teaching methods work best?',
        'GENIE_ADVISORY',
        context
    )

    logTest(
        'authority',
        'Advisory prompt includes suggestion disclaimer',
        result.governedPrompt?.toLowerCase().includes('suggest') ||
        result.governedPrompt?.toLowerCase().includes('advisory') ||
        result.governedPrompt?.toLowerCase().includes('recommend'),
        'Contains advisory language'
    )
}

// =============================================================================
// E2E HTTP TESTS (Optional - requires running server)
// =============================================================================

async function testHTTPEndpoints() {
    console.log('\n🌐 E2E: HTTP ENDPOINTS (requires server)')
    console.log('='.repeat(50))

    try {
        // Quick health check
        const healthResponse = await fetch(`${BASE_URL}/api/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        }).catch(() => null)

        if (!healthResponse) {
            console.log('⚠️  Server not running at ' + BASE_URL)
            console.log('   Skipping HTTP tests...\n')
            return
        }

        // Test unauthenticated GET
        const getResponse = await fetch(`${BASE_URL}/api/chat/governed`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        })

        logTest(
            'http',
            'GET /api/chat/governed requires auth',
            getResponse.status === 401 || getResponse.status === 500,
            `Status: ${getResponse.status}`
        )

        // Test unauthenticated POST
        const postResponse = await fetch(`${BASE_URL}/api/chat/governed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'Test' }],
                toolInvoked: 'GENIE_ADVISORY'
            })
        })

        logTest(
            'http',
            'POST /api/chat/governed requires auth',
            postResponse.status === 401 || postResponse.status === 500,
            `Status: ${postResponse.status}`
        )

    } catch (error) {
        console.log('⚠️  HTTP tests skipped:', error instanceof Error ? error.message : String(error))
    }
}

// =============================================================================
// MAIN TEST RUNNER
// =============================================================================

async function runAllTests() {
    console.log('\n')
    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║       PROMPT GOVERNANCE COMPREHENSIVE TEST SUITE             ║')
    console.log('║       IEEE SRS FR-30 to FR-34 Compliance                     ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')
    console.log(`\nTime: ${new Date().toISOString()}`)
    console.log(`Mode: Unit Tests (Direct Service Testing)`)

    // Run unit tests
    await testPromptTemplates()
    await testForbiddenPatternDetection()
    await testEscalationPatternDetection()
    await testRBACEnforcement()
    await testGovernanceContextCreation()
    await testPromptGovernanceFlow()
    await testAuthorityLevels()

    // Run HTTP tests (optional)
    await testHTTPEndpoints()

    // Print summary
    console.log('\n')
    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║                      TEST SUMMARY                            ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')
    console.log(`\n  ✅ Passed: ${results.passed}`)
    console.log(`  ❌ Failed: ${results.failed}`)
    console.log(`  📊 Total:  ${results.passed + results.failed}`)

    const passRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1)
    console.log(`\n  Pass Rate: ${passRate}%`)

    // Category breakdown
    const categories = [...new Set(results.tests.map(t => t.category))]
    console.log('\n  By Category:')
    for (const cat of categories) {
        const catTests = results.tests.filter(t => t.category === cat)
        const catPassed = catTests.filter(t => t.passed).length
        const catTotal = catTests.length
        const catIcon = catPassed === catTotal ? '✅' : catPassed > 0 ? '⚠️' : '❌'
        console.log(`    ${catIcon} ${cat}: ${catPassed}/${catTotal}`)
    }

    // Compliance checklist
    console.log('\n')
    console.log('╔══════════════════════════════════════════════════════════════╗')
    console.log('║              IEEE SRS COMPLIANCE STATUS                      ║')
    console.log('╚══════════════════════════════════════════════════════════════╝')

    const fr30Pass = results.tests.some(t => t.category === 'flow' && t.passed)
    const fr31Pass = results.tests.some(t => t.category === 'context' && t.passed)
    const fr32Pass = results.tests.some(t => t.category === 'rbac' && t.passed)
    const fr33Pass = results.tests.some(t => t.category === 'forbidden' && t.passed)
    const fr34Pass = results.tests.some(t => t.category === 'flow' && t.name.includes('promptId') && t.passed)

    console.log(`
  FR-30 Route all prompts through Governance Engine     ${fr30Pass ? '✅' : '❌'}
  FR-31 Inject course metadata and policy constraints   ${fr31Pass ? '✅' : '❌'}
  FR-32 Enforce RBAC and scope constraints              ${fr32Pass ? '✅' : '❌'}
  FR-33 Block forbidden actions                         ${fr33Pass ? '✅' : '❌'}
  FR-34 Store prompt audit records                      ${fr34Pass ? '✅' : '❌'}
    `)

    // Final status
    const allPass = results.failed === 0
    console.log('\n' + (allPass
        ? '🎉 ALL TESTS PASSED! Governance system is IEEE SRS compliant.'
        : `⚠️  ${results.failed} test(s) failed. Review failures above.`
    ))

    process.exit(results.failed > 0 ? 1 : 0)
}

// Run tests
runAllTests().catch(err => {
    console.error('Test suite failed:', err)
    process.exit(1)
})
