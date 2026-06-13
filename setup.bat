@echo off
echo ================================
echo   Void Notes - Instalator
echo ================================
echo.

echo [1/3] Instalowanie zaleznosci...
call npm install
if %errorlevel% neq 0 (
    echo BLAD: npm install nie powiodlo sie!
    pause
    exit /b 1
)
echo [1/3] OK
echo.

echo [2/3] Kompilacja...
call npm run build
if %errorlevel% neq 0 (
    echo BLAD: Kompilacja nie powiodla sie!
    pause
    exit /b 1
)
echo [2/3] OK
echo.

echo [3/3] Uruchamianie aplikacji...
call npm start
