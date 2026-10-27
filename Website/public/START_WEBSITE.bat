@echo off
setlocal
title DoBu Martial Arts Website
cd /d "%~dp0.."

where node >nul 2>nul
if errorlevel 1 (
    echo Node.js is required. Install Node.js 20 or later, then run this file again.
    pause
    exit /b 1
)

node -e "process.exit(Number(process.versions.node.split('.')[0]) >= 20 ? 0 : 1)"
if errorlevel 1 (
    echo Please update Node.js to version 20 or later, then run this file again.
    pause
    exit /b 1
)

echo Starting DoBu Martial Arts version 1.2.1. Your membership page will open when the server is ready.
echo Keep this window open while using the website. Press Ctrl+C to stop it.
echo.
node server.js --open
if errorlevel 1 pause
