# PowerShell script to setup UniClub logo
# Run this script after placing the UniClub logo in the project

Write-Host "Setting up UniClub logo..." -ForegroundColor Green

# Check if uniclub-logo.png exists
if (Test-Path "assets\images\uniclub-logo.png") {
    Write-Host "✅ Found uniclub-logo.png" -ForegroundColor Green
    
    # Copy to required locations
    Copy-Item "assets\images\uniclub-logo.png" "assets\images\icon.png" -Force
    Copy-Item "assets\images\uniclub-logo.png" "assets\images\adaptive-icon.png" -Force
    Copy-Item "assets\images\uniclub-logo.png" "assets\images\favicon.png" -Force
    Copy-Item "assets\images\uniclub-logo.png" "assets\images\splash-icon.png" -Force
    
    Write-Host "✅ Logo copied to all required locations" -ForegroundColor Green
    Write-Host "🚀 Ready to build with UniClub branding!" -ForegroundColor Yellow
} else {
    Write-Host "❌ Please place your UniClub logo as 'assets\images\uniclub-logo.png'" -ForegroundColor Red
    Write-Host "📝 Logo should be:" -ForegroundColor Yellow
    Write-Host "   - Square format (recommended: 512x512px)" -ForegroundColor White
    Write-Host "   - PNG format" -ForegroundColor White
    Write-Host "   - Transparent background preferred" -ForegroundColor White
}