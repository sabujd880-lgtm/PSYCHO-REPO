# scripts/start-backend.ps1
# Launch script for Phase 1 TypeScript Backend Foundation
$nodePath = "C:\Users\sabuj\AppData\Local\ms-playwright-go\1.57.0\node.exe"
if (Test-Path $nodePath) {
    Write-Host "Launching Psychology Platform Backend on http://localhost:5000..." -ForegroundColor Cyan
    & $nodePath --experimental-strip-types server/src/server.ts
} else {
    Write-Host "Launching with system node..." -ForegroundColor Cyan
    node --experimental-strip-types server/src/server.ts
}

