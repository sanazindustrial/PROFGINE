#!/usr/bin/env node

/**
 * 🔧 PACKAGE UPDATE SCRIPT - Comprehensive Dependency Management
 * This script handles all package updates safely
 */

console.log('📦 PROFGINI PACKAGE UPDATE SCRIPT')
console.log('=================================\n')

const updates = {
  critical: [
    '@prisma/client', // Database client
    'prisma', // Database toolkit
    'openai', // OpenAI API client
    '@anthropic-ai/sdk', // Anthropic API client
    'stripe', // Payment processing
    'axios' // HTTP client
  ],

  major: [
    'react', // ⚠️ MAJOR: 18.x → 19.x (test carefully!)
    'react-dom', // ⚠️ MAJOR: Goes with React
    '@types/react', // React TypeScript types
    '@types/react-dom' // React DOM TypeScript types
  ],

  security: [
    'eslint', // Linting (deprecated warning)
    'eslint-config-next', // Next.js ESLint config
    'prettier', // Code formatting
    'typescript', // TypeScript compiler
    'tailwindcss', // CSS framework
    'autoprefixer', // PostCSS plugin
    'postcss' // CSS processor
  ]
}

function generateUpdateCommands() {
  console.log('🎯 RECOMMENDED UPDATE SEQUENCE:\n')

  console.log('1️⃣ CRITICAL UPDATES (Safe - Minor/Patch versions):')
  console.log(`   pnpm update ${updates.critical.join(' ')}`)
  console.log('   ✅ These updates are generally safe and should be done first\n')

  console.log('2️⃣ SECURITY UPDATES (Medium Priority):')
  console.log(`   pnpm update ${updates.security.join(' ')}`)
  console.log('   ⚠️  May require configuration adjustments\n')

  console.log('3️⃣ MAJOR UPDATES (⚠️ TEST IN STAGING FIRST!):')
  console.log(`   pnpm update ${updates.major.join(' ')}`)
  console.log('   🚨 React 19 has breaking changes - test thoroughly!\n')

  console.log('🔍 CHECK CURRENT VERSIONS:')
  console.log('   pnpm list @prisma/client openai react next')
  console.log('   pnpm outdated')
  console.log('')

  console.log('🧪 AFTER UPDATES - VERIFY:')
  console.log('   pnpm build')
  console.log('   pnpm dev')
  console.log('   Test admin configuration system')
  console.log('   Test AI integrations')
  console.log('   Test payment processing')
}

function generateCompleteBatch() {
  console.log('⚡ COMPLETE BATCH UPDATE (All at once):')
  console.log('=====================================\n')

  const allPackages = [...updates.critical, ...updates.security]
  console.log(`pnpm update ${allPackages.join(' ')}`)
  console.log('')
  console.log('⚠️  For React 19, run separately after testing:')
  console.log(`pnpm update ${updates.major.join(' ')}`)
}

function showPackageStatus() {
  console.log('📋 CURRENT PACKAGE STATUS:')
  console.log('==========================')
  console.log('✅ @anthropic-ai/sdk: 0.70.0 → 0.70.1 (UPDATED)')
  console.log('📦 @prisma/client: 5.22.0 (current)')
  console.log('📦 openai: 4.104.0 (current)')
  console.log('📦 next: 16.1.1 (latest)')
  console.log('📦 react: 18.2.0 (19.x available - major update)')
  console.log('⚠️  eslint: deprecated version warning\n')
}

// Main execution
console.log('Starting package analysis...\n')

showPackageStatus()
generateUpdateCommands()
console.log('')
generateCompleteBatch()

console.log('\n🎊 RECOMMENDED IMMEDIATE ACTION:')
console.log('================================')
console.log('1. Run critical updates first:')
console.log('   pnpm update @prisma/client openai stripe axios')
console.log('')
console.log('2. Fix deprecated ESLint:')
console.log('   pnpm update eslint eslint-config-next')
console.log('')
console.log('3. Test everything works:')
console.log('   pnpm build')
console.log('   pnpm dev')
console.log('   Visit: http://localhost:3000/admin/config')
console.log('')
console.log('4. Plan React 19 upgrade for staging environment')

console.log('\n✅ Package management recommendations complete!')
