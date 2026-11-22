# scripts/start.ps1
# Convenience launcher for Personal Psychology Platform
$nodePath = "C:\Users\sabuj\AppData\Local\ms-playwright-go\1.57.0\node.exe"
if (Test-Path $nodePath) {
    Write-Host "Launching Psychology Platform on http://localhost:3000..." -ForegroundColor Cyan
    & $nodePath server/server.js
} else {
    Write-Host "Launching with system node..." -ForegroundColor Cyan
    node server/server.js
}

