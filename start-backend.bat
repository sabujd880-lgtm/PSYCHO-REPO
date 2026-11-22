@echo off
echo Starting Psychology Platform Backend (Port 5000)...
set "NODE_BIN=C:\Users\sabuj\AppData\Local\ms-playwright-go\1.57.0\node.exe"
if exist "%NODE_BIN%" (
    "%NODE_BIN%" --experimental-strip-types server/src/server.ts
) else (
    node --experimental-strip-types server/src/server.ts
)
pause

