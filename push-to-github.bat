@echo off
echo ==============================================================
echo   Pushing to GitHub: https://github.com/sabujd880-lgtm/PSYCHO-REPO.git
echo ==============================================================
echo.

set GIT_CMD="C:\Program Files\PsychoPy\MinGit\cmd\git.exe"

where git >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    git push -u origin main
) else if exist %GIT_CMD% (
    %GIT_CMD% push -u origin main
) else (
    echo Git binary not found.
    pause
    exit /b 1
)

echo.
pause

