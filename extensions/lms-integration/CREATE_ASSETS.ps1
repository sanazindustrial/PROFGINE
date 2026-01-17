# Professor GENIE Chrome Extension - Asset Creation Script (PowerShell)
# This script helps organize the asset creation process for Chrome Web Store submission

Write-Host "🎓 Professor GENIE Chrome Extension - Asset Creation Helper" -ForegroundColor Blue
Write-Host "============================================================" -ForegroundColor Blue

# Create directories for assets
Write-Host "📁 Creating asset directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "store-assets\icons" | Out-Null
New-Item -ItemType Directory -Force -Path "store-assets\screenshots" | Out-Null
New-Item -ItemType Directory -Force -Path "store-assets\promotional" | Out-Null  
New-Item -ItemType Directory -Force -Path "store-assets\marketing" | Out-Null

Write-Host "✅ Directory structure created:" -ForegroundColor Green
Write-Host "   store-assets/"
Write-Host "   ├── icons/"
Write-Host "   ├── screenshots/"
Write-Host "   ├── promotional/"
Write-Host "   └── marketing/"
Write-Host ""

# Icon creation checklist
Write-Host "🎨 ICON CREATION CHECKLIST" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host "Required PNG files with transparent backgrounds:"
Write-Host ""
Write-Host "📐 Extension Icons (for manifest.json):"
Write-Host "   ☐ icon16.png  (16x16px)   - Toolbar icon"
Write-Host "   ☐ icon48.png  (48x48px)   - Extensions page" 
Write-Host "   ☐ icon128.png (128x128px) - Web Store listing"
Write-Host ""
Write-Host "🎨 Design Requirements:"
Write-Host "   • Graduation cap as primary element"
Write-Host "   • Professor GENIE blue theme (#2563eb)"
Write-Host "   • Professional academic appearance"
Write-Host "   • Clear visibility at smallest size (16px)"
Write-Host "   • Consistent branding across all sizes"
Write-Host ""

# Screenshot requirements
Write-Host "📸 SCREENSHOT REQUIREMENTS" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host "Required: 1280x800px PNG format"
Write-Host ""
Write-Host "   ☐ screenshot1.png - Extension on Canvas LMS"
Write-Host "      • Show Professor GENIE overlay panel"
Write-Host "      • Highlight Extract → Generate → Apply → Submit workflow"
Write-Host "      • Include actual LMS interface in background"
Write-Host ""
Write-Host "   ☐ screenshot2.png - Options/Settings page"
Write-Host "      • Display domain configuration interface"
Write-Host "      • Show security features"
Write-Host "      • Highlight universal LMS compatibility"
Write-Host ""
Write-Host "   ☐ screenshot3.png (optional) - Different LMS platform"
Write-Host "      • Show extension working on Moodle or D2L"
Write-Host "      • Demonstrate universal compatibility"
Write-Host ""

# Promotional assets
Write-Host "🚀 PROMOTIONAL ASSETS" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host "   ☐ promotional-tile.png (440x280px) - Featured placement"
Write-Host "   ☐ store-banner.png (1400x560px) - Optional banner"
Write-Host ""

# AI Generation prompts
Write-Host "🤖 AI GENERATION PROMPTS" -ForegroundColor Magenta
Write-Host "========================" -ForegroundColor Magenta
Write-Host ""
Write-Host "For Icons:"
Write-Host "'Professional graduation cap icon for Professor GENIE AI teaching"
Write-Host "assistant, modern flat design, blue gradient #2563eb to #764ba2,"
Write-Host "subtle tech elements, academic theme, clean minimal, transparent"
Write-Host "background, suitable for Chrome extension'"
Write-Host ""
Write-Host "For Screenshots:"
Write-Host "'Chrome extension interface screenshot, Professor GENIE overlay"
Write-Host "on Canvas LMS, professional blue UI, grading workflow, academic"
Write-Host "software, clean modern design, 1280x800 resolution'"
Write-Host ""

# Tools recommendation
Write-Host "🛠️  RECOMMENDED TOOLS" -ForegroundColor Yellow
Write-Host "=====================" -ForegroundColor Yellow
Write-Host "Professional: Figma, Adobe Illustrator, Sketch"
Write-Host "Free Options: GIMP, Inkscape, Canva Free"
Write-Host "AI Generation: Midjourney, DALL-E, Stable Diffusion"
Write-Host "Screenshots: Browser developer tools, Snagit, Lightshot"
Write-Host ""

# File organization
Write-Host "📋 FILE ORGANIZATION" -ForegroundColor Yellow
Write-Host "====================" -ForegroundColor Yellow
Write-Host "Once created, organize files as:"
Write-Host ""
Write-Host "extensions/lms-integration/"
Write-Host "├── icons/"
Write-Host "│   ├── icon16.png"
Write-Host "│   ├── icon48.png"
Write-Host "│   └── icon128.png"
Write-Host "└── store-assets/"
Write-Host "    ├── screenshots/"
Write-Host "    │   ├── screenshot1.png"
Write-Host "    │   ├── screenshot2.png"
Write-Host "    │   └── screenshot3.png"
Write-Host "    └── promotional/"
Write-Host "        ├── promotional-tile.png"
Write-Host "        └── store-banner.png"
Write-Host ""

# Quality checklist
Write-Host "✅ QUALITY CHECKLIST" -ForegroundColor Green
Write-Host "=====================" -ForegroundColor Green
Write-Host "Before submission, verify:"
Write-Host "   ☐ All icons have transparent backgrounds"
Write-Host "   ☐ Icons are clearly visible at 16px size"
Write-Host "   ☐ Consistent Professor GENIE branding"
Write-Host "   ☐ High resolution and crisp edges"
Write-Host "   ☐ Professional academic appearance"
Write-Host "   ☐ Screenshots show actual extension functionality"
Write-Host "   ☐ All required dimensions are correct"
Write-Host "   ☐ Files are properly named and formatted"
Write-Host ""

Write-Host "🎯 NEXT STEPS" -ForegroundColor Green
Write-Host "=============" -ForegroundColor Green
Write-Host "1. Create icons using design tool or AI generation"
Write-Host "2. Take screenshots of extension in real LMS environments"
Write-Host "3. Replace placeholder files with actual assets"
Write-Host "4. Review CHROME_WEB_STORE_SUBMISSION.md for full process"
Write-Host "5. Zip extension files for Chrome Web Store upload"
Write-Host ""

Write-Host "🌟 Your Professor GENIE extension is ready for the Chrome Web Store!" -ForegroundColor Green
Write-Host "Visit the Chrome Web Store Developer Dashboard to begin submission." -ForegroundColor Green
Write-Host ""

# Pause to show output
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")