@echo off
echo ==============================================================
echo   Running Platform Automated Test Suites (Phase 1, 2, 3)
echo ==============================================================
echo.

set PLAYWRIGHT_NODE="%LOCALAPPDATA%\ms-playwright-go\1.57.0\node.exe"

set NODE_CMD=node
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    if exist %PLAYWRIGHT_NODE% (
        set NODE_CMD=%PLAYWRIGHT_NODE%
    ) else (
        echo ERROR: Node.js was not found. Please install from https://nodejs.org
        pause
        exit /b 1
    )
)

echo [1/3] Running Phase 1 Foundation Tests...
%NODE_CMD% --experimental-strip-types server\tests\runTests.ts
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo.
echo [2/3] Running Phase 2 Document Intelligence Tests...
%NODE_CMD% --experimental-strip-types server\tests\phase2.test.ts
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo.
echo [3/3] Running Phase 3 Knowledge Base & Digital Library Tests...
%NODE_CMD% --experimental-strip-types server\tests\phase3.test.ts
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo.
echo ==============================================================
echo   ALL SUITES PASSED (82/82 TESTS 100%% SUCCESS)
echo ==============================================================
pause

