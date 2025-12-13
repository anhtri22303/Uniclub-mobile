# Script to update all main container backgrounds to #E2E2EF

$files = @(
    "src\app\(tabs)\index.tsx",
    "src\app\(tabs)\explore.tsx",
    "src\app\club-leader.tsx",
    "src\app\uni-staff.tsx",
    "src\app\student\index.tsx",
    "src\app\club-leader\gift\index.tsx",
    "src\app\club-leader\gift\[id].tsx",
    "src\app\club-leader\events\index.tsx",
    "src\app\club-leader\events\[id].tsx",
    "src\app\club-leader\members.tsx",
    "src\app\uni-staff\clubs.tsx",
    "src\app\uni-staff\tags.tsx",
    "src\app\uni-staff\policies.tsx",
    "src\app\uni-staff\points.tsx",
    "src\app\uni-staff\points-req.tsx",
    "src\app\uni-staff\multiplier-policy.tsx",
    "src\app\uni-staff\majors.tsx",
    "src\app\uni-staff\locations.tsx",
    "src\app\uni-staff\event-requests.tsx",
    "src\app\uni-staff\club-requests\index.tsx",
    "src\app\uni-staff\club-requests\[id].tsx",
    "src\app\student\clubs\index.tsx",
    "src\app\student\clubs\[id].tsx",
    "src\app\student\events\index.tsx",
    "src\app\student\events\[id].tsx",
    "src\app\student\history.tsx",
    "src\app\student\attendances.tsx",
    "src\app\student\members.tsx",
    "src\app\student\gift\index.tsx",
    "src\app\student\gift\[id].tsx",
    "src\app\student\check-in.tsx",
    "src\app\student\events-public\index.tsx",
    "src\app\student\events-public\[id].tsx"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Write-Host "Processing: $file"
        $content = Get-Content $fullPath -Raw -Encoding UTF8
        
        # Replace bg-gray-50 with style prop
        $content = $content -replace 'className="flex-1 bg-gray-50"', 'className="flex-1" style={{ backgroundColor: ''#E2E2EF'' }}'
        $content = $content -replace 'SafeAreaView className="flex-1 bg-gray-50"', 'SafeAreaView className="flex-1" style={{ backgroundColor: ''#E2E2EF'' }}'
        $content = $content -replace 'View className="flex-1 bg-gray-50"', 'View className="flex-1" style={{ backgroundColor: ''#E2E2EF'' }}'
        
        # Replace gradients with style prop (for SafeAreaView)
        $content = $content -replace 'className="flex-1 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50"', 'className="flex-1" style={{ backgroundColor: ''#E2E2EF'' }}'
        $content = $content -replace 'className="flex-1 bg-emerald-50"', 'className="flex-1" style={{ backgroundColor: ''#E2E2EF'' }}'
        
        Set-Content $fullPath $content -Encoding UTF8 -NoNewline
        Write-Host "✓ Updated: $file"
    } else {
        Write-Host "⚠ Not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`n  Background update complete!" -ForegroundColor Green
