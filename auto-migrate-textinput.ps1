# PowerShell script to automatically migrate TextInput to AppTextInput
# This will update all .tsx files in src folder (excluding AppTextInput.tsx itself)

$ErrorActionPreference = "Stop"
$filesChanged = 0
$totalReplacements = 0

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TextInput → AppTextInput Migration" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Find all .tsx files that contain <TextInput (excluding AppTextInput.tsx)
Write-Host "Scanning for files with TextInput..." -ForegroundColor Yellow

$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse | Where-Object { 
    $_.FullName -notlike "*AppTextInput.tsx" -and 
    (Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue) -match "<TextInput"
}

Write-Host "Found $($files.Count) files to migrate`n" -ForegroundColor Green

foreach ($file in $files) {
    $relativePath = $file.FullName.Replace((Get-Location).Path + "\", "")
    Write-Host "Processing: $relativePath" -ForegroundColor White
    
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $changed = $false
    
    # Count TextInput instances before migration
    $textInputCount = ([regex]::Matches($content, "<TextInput")).Count
    
    # Step 1: Update imports
    # Pattern 1: TextInput in middle of import list
    if ($content -match "import \{([^}]*),\s*TextInput\s*,([^}]*)\} from 'react-native'") {
        $before = $matches[1]
        $after = $matches[2]
        $content = $content -replace "import \{([^}]*),\s*TextInput\s*,([^}]*)\} from 'react-native'", "import {$before,$after} from 'react-native'"
        $changed = $true
    }
    
    # Pattern 2: TextInput at start of import list
    if ($content -match "import \{\s*TextInput\s*,([^}]*)\} from 'react-native'") {
        $after = $matches[1]
        $content = $content -replace "import \{\s*TextInput\s*,([^}]*)\} from 'react-native'", "import {$after} from 'react-native'"
        $changed = $true
    }
    
    # Pattern 3: TextInput at end of import list
    if ($content -match "import \{([^}]*),\s*TextInput\s*\} from 'react-native'") {
        $before = $matches[1]
        $content = $content -replace "import \{([^}]*),\s*TextInput\s*\} from 'react-native'", "import {$before} from 'react-native'"
        $changed = $true
    }
    
    # Pattern 4: Only TextInput imported
    if ($content -match "import \{\s*TextInput\s*\} from 'react-native'") {
        $content = $content -replace "import \{\s*TextInput\s*\} from 'react-native';?", ""
        $changed = $true
    }
    
    # Clean up empty imports or trailing commas
    $content = $content -replace "import \{\s*,", "import {"
    $content = $content -replace ",\s*\} from 'react-native'", "} from 'react-native'"
    $content = $content -replace "import \{\s*\} from 'react-native';?(\r?\n)?", ""
    
    # Step 2: Add AppTextInput import if not already present
    if ($content -notmatch "import.*AppTextInput") {
        # Determine correct import path based on file location
        $depth = ($relativePath -split "\\").Count - 2  # Subtract 2 for "src" and filename
        
        if ($relativePath -like "*src\components\*") {
            $importPath = "./ui"
        }
        elseif ($relativePath -like "*src\app\*") {
            $importPath = "@components/ui"
        }
        else {
            $importPath = "@components/ui"
        }
        
        # Find the last import statement and add AppTextInput import after it
        if ($content -match "(import [^;]+;)(\r?\n)") {
            $lastImport = $matches[0]
            $newImport = "import { AppTextInput } from '$importPath';`n"
            
            # Find position after last import
            $lastImportIndex = $content.LastIndexOf($lastImport) + $lastImport.Length
            $content = $content.Insert($lastImportIndex, $newImport)
            $changed = $true
        }
    }
    
    # Step 3: Replace <TextInput with <AppTextInput
    if ($content -match "<TextInput") {
        $content = $content -replace "<TextInput", "<AppTextInput"
        $changed = $true
    }
    
    # Step 4: Replace </TextInput> with </AppTextInput> (for non-self-closing tags)
    if ($content -match "</TextInput>") {
        $content = $content -replace "</TextInput>", "</AppTextInput>"
        $changed = $true
    }
    
    # Only write if content changed
    if ($changed -and $content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $filesChanged++
        $totalReplacements += $textInputCount
        Write-Host "  ✓ Migrated $textInputCount TextInput(s)" -ForegroundColor Green
    }
    else {
        Write-Host "  - No changes needed" -ForegroundColor Gray
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Migration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Files modified: $filesChanged" -ForegroundColor White
Write-Host "Total TextInputs migrated: $totalReplacements" -ForegroundColor White
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Run: npx tsc --noEmit (to check for TypeScript errors)" -ForegroundColor Gray
Write-Host "2. Test the app on Android emulator" -ForegroundColor Gray
Write-Host "3. Verify soft keyboard appears for all inputs`n" -ForegroundColor Gray
