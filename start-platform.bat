@echo off
echo ==============================================================
echo   Personal Psychology Knowledge & Intelligence Platform
echo ==============================================================
echo.

set PLAYWRIGHT_NODE="%LOCALAPPDATA%\ms-playwright-go\1.57.0\node.exe"

where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using system Node.js...
    node --experimental-strip-types server/src/server.ts
) else if exist %PLAYWRIGHT_NODE% (
    echo Using local Node.js engine...
    %PLAYWRIGHT_NODE% --experimental-strip-types server/src/server.ts
) else (
    echo ERROR: Node.js was not found on your system.
    echo Please install Node.js by running: winget install OpenJS.NodeJS.LTS
    echo Or download from: https://nodejs.org
    pause
)

