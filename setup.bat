@echo off
echo ================================
echo   Void Notes - Installer
echo ================================
echo.

echo [1/3] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed!
    pause
    exit /b 1
)
echo [1/3] OK
echo.

echo [2/3] Building...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)
echo [2/3] OK
echo.

echo [3/3] Launching app...
call npm start
