# PowerShell script to find all remaining TextInput usages
# This script will list all files that still need migration

Write-Host "Finding all files with TextInput usage..." -ForegroundColor Cyan

# Find all .tsx files in src that contain TextInput (excluding ui/AppTextInput.tsx itself)
$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse | 
    Where-Object { $_.FullName -notlike "*AppTextInput.tsx" } |
    Where-Object { (Get-Content $_.FullName -Raw) -match "<TextInput" }

Write-Host "`nFiles still containing <TextInput>:" -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Yellow

$totalFiles = 0
$totalInstances = 0

foreach ($file in $files) {
    $content = Get-Content $_.FullName -Raw
    $matches = [regex]::Matches($content, "<TextInput")
    $count = $matches.Count
    
    if ($count -gt 0) {
        $totalFiles++
        $totalInstances += $count
        $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
        Write-Host "$relativePath - $count instance(s)" -ForegroundColor White
    }
}

Write-Host "`n============================================" -ForegroundColor Yellow
Write-Host "Total: $totalFiles files with $totalInstances TextInput instances" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Review the list above" -ForegroundColor White
Write-Host "2. For each file, replace:" -ForegroundColor White
Write-Host "   - Import: Remove TextInput from react-native import" -ForegroundColor Gray
Write-Host "   - Import: Add 'import { AppTextInput } from '@components/ui';'" -ForegroundColor Gray
Write-Host "   - Usage: Replace all <TextInput with <AppTextInput" -ForegroundColor Gray
