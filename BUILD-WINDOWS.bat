@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul
title SLURP - сборка приложения
cd /d "%~dp0"

echo.
echo   SLURP 0.9.4  -  нативное приложение C# / .NET 8 / WPF
echo   ------------------------------------------------------------------
echo.

set "DOTNET_OK="
where dotnet >nul 2>nul
if not errorlevel 1 (
  set "DOTNET=dotnet"
  set "DOTNET_OK=1"
)

if not defined DOTNET_OK (
  if exist "%ProgramFiles%\dotnet\dotnet.exe" (
    set "DOTNET=%ProgramFiles%\dotnet\dotnet.exe"
    set "DOTNET_OK=1"
  )
)

if not defined DOTNET_OK (
  echo   .NET SDK не найден. Пробую поставить автоматически через winget...
  where winget >nul 2>nul
  if errorlevel 1 goto no_winget
  winget install --id Microsoft.DotNet.SDK.8 -e --accept-source-agreements --accept-package-agreements
  if exist "%ProgramFiles%\dotnet\dotnet.exe" (
    set "DOTNET=%ProgramFiles%\dotnet\dotnet.exe"
    set "DOTNET_OK=1"
  )
)

if not defined DOTNET_OK goto no_winget

echo   Компилирую... первый раз скачиваются пакеты, это 1-3 минуты.
echo.
"%DOTNET%" publish "desktop\Slurp.Desktop\Slurp.Desktop.csproj" -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:EnableCompressionInSingleFile=true -o "build\out"
if errorlevel 1 goto failed

copy /y "build\out\SLURP.exe" "SLURP.exe" >nul
echo.
echo   Готово: %~dp0SLURP.exe
echo   Это отдельное десктоп-приложение на C#/WPF, .NET внутри файла.
echo.
start "" "%~dp0SLURP.exe"
goto end

:no_winget
echo.
echo   Автоматически поставить SDK не получилось.
echo   1. Скачай .NET SDK 8: https://dotnet.microsoft.com/download/dotnet/8.0
echo   2. Установи, закрой это окно и запусти BUILD-WINDOWS.bat снова.
goto end

:failed
echo.
echo   Сборка не прошла - скопируй текст ошибки выше.

:end
echo.
pause
