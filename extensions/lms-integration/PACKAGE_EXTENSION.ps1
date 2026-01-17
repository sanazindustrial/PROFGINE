# Professor GENIE Chrome Extension - Packaging Script
# Creates a clean zip file ready for Chrome Web Store submission

param(
    [string]$OutputPath = "professor-genie-extension.zip",
    [switch]$Validate = $false
)

Write-Host "📦 Professor GENIE Extension Packaging Script" -ForegroundColor Blue
Write-Host "=============================================" -ForegroundColor Blue

$extensionPath = Get-Location

# Files to include in the Chrome Web Store package
$requiredFiles = @(
    "manifest.json",
    "background.js",
    "contentScript.js",
    "popup.html",
    "popup.js",
    "options.html",
    "options.js",
    "overlay.css"
)

$requiredDirectories = @(
    "icons",
    "src",
    "adapters"
)

# Files to exclude from the package
$excludeFiles = @(
    "*.md",
    "*.sh",
    "*.ps1",
    ".git*",
    "node_modules",
    "store-assets",
    "*.placeholder",
    "CREATE_ASSETS.*",
    "CHROME_WEB_STORE_SUBMISSION.md",
    "ICON_SPECIFICATIONS.md",
    "DEPLOYMENT.md"
)

Write-Host "🔍 Validating extension files..." -ForegroundColor Yellow

# Check for required files
$missingFiles = @()
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

# Check for required directories
$missingDirectories = @()
foreach ($dir in $requiredDirectories) {
    if (-not (Test-Path $dir -PathType Container)) {
        $missingDirectories += $dir
    }
}

# Report missing files/directories
if ($missingFiles.Count -gt 0 -or $missingDirectories.Count -gt 0) {
    Write-Host "❌ Missing required files/directories:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "   ❌ $file" -ForegroundColor Red
    }
    foreach ($dir in $missingDirectories) {
        Write-Host "   ❌ $dir/" -ForegroundColor Red
    }
    Write-Host ""
    Write-Host "Please ensure all required files are present before packaging." -ForegroundColor Red
    exit 1
}

# Check for placeholder icon files
$iconPlaceholders = Get-ChildItem -Path "icons" -Filter "*.placeholder" -ErrorAction SilentlyContinue
if ($iconPlaceholders.Count -gt 0) {
    Write-Host "[!] WARNING: Placeholder icon files found:" -ForegroundColor Yellow
    foreach ($placeholder in $iconPlaceholders) {
        Write-Host "   [!] $($placeholder.Name)" -ForegroundColor Yellow
    }
    Write-Host "   Replace placeholders with actual PNG icons before submission!" -ForegroundColor Yellow
    Write-Host ""
}

# Validate manifest.json
if (Test-Path "manifest.json") {
    try {
        $manifest = Get-Content "manifest.json" | ConvertFrom-Json
        Write-Host "✅ Manifest validation:" -ForegroundColor Green
        Write-Host "   Name: $($manifest.name)" -ForegroundColor Green
        Write-Host "   Version: $($manifest.version)" -ForegroundColor Green
        Write-Host "   Manifest Version: $($manifest.manifest_version)" -ForegroundColor Green
        
        if ($manifest.manifest_version -ne 3) {
            Write-Host "   ⚠️  Not using Manifest V3!" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "❌ Invalid manifest.json format!" -ForegroundColor Red
        exit 1
    }
}

if ($Validate) {
    Write-Host ""
    Write-Host "✅ Validation complete. Extension structure is valid." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "📦 Creating Chrome Web Store package..." -ForegroundColor Yellow

# Remove existing zip file
if (Test-Path $OutputPath) {
    Remove-Item $OutputPath -Force
    Write-Host "   Removed existing $OutputPath" -ForegroundColor Gray
}

# Create temporary directory for clean packaging
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "professor-genie-extension-$(Get-Random)"
New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

try {
    # Copy required files
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Copy-Item $file -Destination $tempDir
            Write-Host "   [OK] $file" -ForegroundColor Green
        }
    }

    # Copy required directories
    foreach ($dir in $requiredDirectories) {
        if (Test-Path $dir) {
            Copy-Item $dir -Destination $tempDir -Recurse
            Write-Host "   [OK] $dir/" -ForegroundColor Green
            
            # Remove placeholder files from icons
            if ($dir -eq "icons") {
                Get-ChildItem -Path (Join-Path $tempDir $dir) -Filter "*.placeholder" | Remove-Item -Force
            }
        }
    }

    # Create zip file
    $zipPath = Join-Path (Get-Location) $OutputPath
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $zipPath)

    Write-Host ""
    Write-Host "🎉 Package created successfully!" -ForegroundColor Green
    Write-Host "   📁 File: $OutputPath" -ForegroundColor Green
    Write-Host "   📏 Size: $([math]::Round((Get-Item $OutputPath).Length / 1KB, 2)) KB" -ForegroundColor Green

}
finally {
    # Cleanup temporary directory
    if (Test-Path $tempDir) {
        Remove-Item $tempDir -Recurse -Force
    }
}

Write-Host ""
Write-Host "🚀 CHROME WEB STORE SUBMISSION CHECKLIST" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   [ ] Replace icon placeholder files with actual PNG icons"
Write-Host "   [ ] Test extension functionality on multiple LMS platforms"
Write-Host "   [ ] Create required screenshots (1280x800px)"
Write-Host "   [ ] Prepare promotional assets (optional)"
Write-Host "   [ ] Review CHROME_WEB_STORE_SUBMISSION.md for complete process"
Write-Host "   [ ] Set up Chrome Web Store Developer account (`$5 fee)"
Write-Host "   [ ] Upload $OutputPath to Chrome Web Store Dashboard"
Write-Host ""
Write-Host "📖 For detailed submission instructions, see:" -ForegroundColor Yellow
Write-Host "   CHROME_WEB_STORE_SUBMISSION.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "🌟 Professor GENIE Extension is ready for the Chrome Web Store!" -ForegroundColor Green