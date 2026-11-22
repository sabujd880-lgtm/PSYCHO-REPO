@echo off
echo Starting Personal Psychology Knowledge & Intelligence Platform...
set "NODE_BIN=C:\Users\sabuj\AppData\Local\ms-playwright-go\1.57.0\node.exe"
if exist "%NODE_BIN%" (
    "%NODE_BIN%" server/server.js
) else (
    node server/server.js
)
pause

