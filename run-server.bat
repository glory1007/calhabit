@echo off
title CalHabit Server and Tunnel
echo ==========================================================
echo       CalHabit Local Server and Cloudflare Tunnel
echo ==========================================================
cd /d "%~dp0"

echo 1. Starting Vite Dev Server...
start "CalHabit-Vite" cmd /c "npm.cmd run dev"

echo 2. Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo 3. Starting Cloudflare Tunnel...
start "CalHabit-Tunnel" cmd /k "npx.cmd --yes cloudflared tunnel --url http://localhost:5173"

echo ==========================================================
echo [Done] Check the Tunnel window for your https:// URL!
echo ==========================================================
