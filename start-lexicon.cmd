@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js 22.12 or newer, then run this file again.
  pause
  exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
  call npm.cmd ci
  if errorlevel 1 goto failed
)
call npm.cmd run build
if errorlevel 1 goto failed
echo.
echo Open http://127.0.0.1:4173/ in your browser.
echo Keep this window open while serving. Press Ctrl+C to stop.
echo.
call npm.cmd run preview -- --port 4173 --strictPort
if errorlevel 1 goto failed
exit /b 0
:failed
echo.
echo Could not start IELTS Lexicon. See the error above.
pause
exit /b 1
