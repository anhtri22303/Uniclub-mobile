# Final comprehensive script to update ALL remaining backgrounds

Write-Host " Scanning for remaining bg-gray-50 backgrounds..." -ForegroundColor Cyan

$pattern = 'className="flex-1 bg-gray-50"'
$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse -File | Where-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    $content -match $pattern
}

$count = 0
foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw -Encoding UTF8
        
        # Replace all variations
        $content = $content -replace 'SafeAreaView className="flex-1 bg-gray-50"', 'SafeAreaView className="flex-1" style={{ backgroundColor: ''#E2E2EF'' }}'
        $content = $content -replace 'View className="flex-1 bg-gray-50"', 'View className="flex-1" style={{ backgroundColor: ''#E2E2EF'' }}'
        
        Set-Content $file.FullName $content -Encoding UTF8
        
        $relativePath = $file.FullName.Replace($PWD.Path + "\", "")
        Write-Host "✓ $relativePath" -ForegroundColor Green
        $count++
    }
    catch {
        Write-Host "⚠ Failed: $($file.Name)" -ForegroundColor Yellow
    }
}

Write-Host "`n  Updated $count files!" -ForegroundColor Green
Write-Host "🎉 All backgrounds now use #E2E2EF" -ForegroundColor Cyan
