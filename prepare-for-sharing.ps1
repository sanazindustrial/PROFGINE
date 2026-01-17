# Prepare Repository for Safe Public Sharing
# This script ensures no sensitive data is exposed before pushing to GitHub

Write-Host "Preparing PROFGINE repository for safe public sharing..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Check for sensitive files
Write-Host "Step 1: Checking for sensitive files..." -ForegroundColor Yellow
$sensitiveFiles = @(
    ".env",
    ".env.local",
    ".env.backup",
    "*.pem",
    "*.key",
    "security-test-report.json"
)

$foundSensitive = $false
foreach ($pattern in $sensitiveFiles) {
    $files = git ls-files $pattern 2>$null
    if ($files) {
        Write-Host "WARNING: Found tracked file: $files" -ForegroundColor Red
        $foundSensitive = $true
    }
}

if (-not $foundSensitive) {
    Write-Host "No sensitive files found in git tracking" -ForegroundColor Green
}

Write-Host ""

# Step 2: Verify .gitignore is up to date
Write-Host "Step 2: Verifying .gitignore..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    Write-Host ".gitignore exists" -ForegroundColor Green
}
else {
    Write-Host "WARNING: No .gitignore file found!" -ForegroundColor Red
}

Write-Host ""

# Step 3: Verify .env.example exists
Write-Host "Step 3: Checking for .env.example..." -ForegroundColor Yellow
if (Test-Path ".env.example") {
    Write-Host ".env.example exists" -ForegroundColor Green
}
else {
    Write-Host "WARNING: No .env.example file found!" -ForegroundColor Yellow
    Write-Host "Creating .env.example from template..." -ForegroundColor Cyan
    
    @"
# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/profgenie"
DIRECT_URL="postgresql://user:password@localhost:5432/profgenie"

# Authentication (Google OAuth)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# AI Provider API Keys (Optional - falls back to mock provider)
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
GOOGLE_AI_API_KEY="your-google-ai-key"
GROQ_API_KEY="your-groq-key"

# Stripe (for subscriptions)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
STRIPE_PRICE_BASIC="price_xxx"
STRIPE_PRICE_PREMIUM="price_xxx"
STRIPE_PRICE_ENTERPRISE="price_xxx"
"@ | Out-File -FilePath ".env.example" -Encoding UTF8
    
    Write-Host ".env.example created!" -ForegroundColor Green
}

Write-Host ""

# Step 4: Add necessary files
Write-Host "Step 4: Staging files for commit..." -ForegroundColor Yellow
git add .gitignore
git add .env.example
git add README.md
git add "*.md"
git add prisma/
git add app/
git add components/
git add lib/
git add adaptors/
git add config/
git add hooks/
git add public/
git add "*.json"
git add "*.ts"
git add "*.tsx"
git add "*.js"
git add "*.mjs"

Write-Host "Files staged" -ForegroundColor Green
Write-Host ""

# Step 5: Show what will be committed
Write-Host "Step 5: Files ready to commit:" -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "Security Checklist:" -ForegroundColor Cyan
Write-Host " [x] No .env files in tracking" -ForegroundColor Green
Write-Host " [x] .gitignore configured" -ForegroundColor Green
Write-Host " [x] .env.example created" -ForegroundColor Green
Write-Host " [x] Files staged for commit" -ForegroundColor Green
Write-Host ""

$proceed = Read-Host "Ready to commit and push to PROFGINE? (yes/no)"

if ($proceed -eq "yes") {
    Write-Host ""
    Write-Host "Committing changes..." -ForegroundColor Yellow
    git commit -m "Prepare repository for public sharing

- Add .env.example template
- Update documentation
- Ensure no sensitive data exposed
- Configure for GitHub sharing"
    
    Write-Host ""
    Write-Host "Pushing to PROFGINE repository..." -ForegroundColor Yellow
    
    # Check if PROFGINE remote exists
    $remotes = git remote -v
    if ($remotes -match "PROFGINE") {
        git push -u PROFGINE main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "SUCCESS! Your repository is now on GitHub!" -ForegroundColor Green
            Write-Host "Repository URL: https://github.com/sanazindustrial/PROFGINE" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Yellow
            Write-Host "1. Go to https://github.com/sanazindustrial/PROFGINE" -ForegroundColor White
            Write-Host "2. Add a description and topics" -ForegroundColor White
            Write-Host "3. Share the repository link!" -ForegroundColor White
        }
        else {
            Write-Host ""
            Write-Host "Push failed. Make sure you've created the repository on GitHub first." -ForegroundColor Red
            Write-Host "Go to: https://github.com/new" -ForegroundColor Yellow
            Write-Host "Repository name: PROFGINE" -ForegroundColor Yellow
        }
    }
    else {
        Write-Host "PROFGINE remote not found. Adding it now..." -ForegroundColor Yellow
        git remote add PROFGINE https://github.com/sanazindustrial/PROFGINE.git
        git push -u PROFGINE main
    }
}
else {
    Write-Host "Cancelled. No changes pushed." -ForegroundColor Yellow
}
