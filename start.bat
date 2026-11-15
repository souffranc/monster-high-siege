@echo off
setlocal
cd /d "%~dp0"

set "PORT=%~1"
if defined PORT goto run

rem Find a free port starting from 8081
for /f %%p in ('powershell -NoProfile -Command "$p=8081; while($p -lt 8500 -and (Get-NetTCPConnection -State Listen -LocalPort $p -ErrorAction SilentlyContinue)){$p++}; $p"') do set "PORT=%%p"
if not defined PORT set "PORT=8081"

:run
echo Starting server at http://localhost:%PORT%
start "" http://localhost:%PORT%
where py >nul 2>nul
if %errorlevel%==0 (
  py -m http.server %PORT%
) else (
  echo Python was not found. Install Python or run: npx serve . -l %PORT%
  pause
)
