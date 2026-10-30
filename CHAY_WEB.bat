@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo WEB DIEU HANH XE - Khoi dong...
where node >nul 2>&1
if errorlevel 1 (
 echo Chua cai Node.js. Cai Node.js LTS tu https://nodejs.org/
 pause
 exit /b 1
)
if not exist "node_modules\vite\bin\vite.js" (
 echo Dang cai cac thu vien...
 call npm install
 if errorlevel 1 (echo Loi npm install. & pause & exit /b 1)
)
start "" "http://localhost:5173"
call npm run dev
pause
