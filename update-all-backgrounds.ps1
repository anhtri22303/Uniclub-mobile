# Script to update ALL bg-gray-50 backgrounds to #E2E2EF recursively

Write-Host " Finding all .tsx files with bg-gray-50..." -ForegroundColor Cyan

# Find all tsx files in src directory
$allFiles = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse -File

$updatedCount = 0
$skippedCount = 0

foreach ($file in $allFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8 -ErrorAction SilentlyContinue
    
    if ($null -eq $content) {
        continue
    }
    
    $originalContent = $content
    
    # Replace SafeAreaView with bg-gray-50
    $content = $content -replace 'SafeAreaView className="flex-1 bg-gray-50"', 'SafeAreaView className="flex-1" style={{ backgroundColor: ''#E2E2EF'' }}'
    
    # Replace View with bg-gray-50
    $content = $content -replace 'View className="flex-1 bg-gray-50"', 'View className="flex-1" style={{ backgroundColor: ''#E2E2EF'' }}'
    
    # Replace gradient backgrounds
    $content = $content -replace 'SafeAreaView className="flex-1 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50"', 'SafeAreaView className="flex-1" style={{ backgroundColor: ''#E2E2EF'' }}'
    $content = $content -replace 'View className="flex-1 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50"', 'View className="flex-1" style={{ backgroundColor: ''#E2E2EF'' }}'
    
    # Replace bg-emerald-50
    $content = $content -replace 'SafeAreaView className="flex-1 bg-emerald-50"', 'SafeAreaView className="flex-1" style={{ backgroundColor: ''#E2E2EF'' }}'
    $content = $content -replace 'View className="flex-1 bg-emerald-50"', 'View className="flex-1" style={{ backgroundColor: ''#E2E2EF'' }}'
    
    # Only write if content changed
    if ($content -ne $originalContent) {
        Set-Content $file.FullName $content -Encoding UTF8 -NoNewline
        Write-Host "✓ Updated: $($file.FullName.Replace((Get-Location).Path, '.'))" -ForegroundColor Green
        $updatedCount++
    } else {
        $skippedCount++
    }
}

Write-Host "`n Summary:" -ForegroundColor Cyan
Write-Host "    Updated: $updatedCount files" -ForegroundColor Green
Write-Host "  ⏭️  Skipped: $skippedCount files (no changes needed)" -ForegroundColor Yellow
Write-Host "`n🎉 Background update complete!" -ForegroundColor Green
