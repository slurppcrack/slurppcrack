@echo off
chcp 65001 >nul
title SLURP
echo Starting SLURP installer... this window will stay open if something fails.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if errorlevel 1 pause
