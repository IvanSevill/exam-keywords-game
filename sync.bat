@echo off
chcp 65001 >nul
echo.
echo  ====================================
echo   Sincronizando file.csv → data.js
echo  ====================================
echo.

node "%~dp0sync.js"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo  [OK] Abre el navegador y presiona F5 para recargar.
) else (
    echo.
    echo  [ERROR] Asegurate de tener Node.js instalado.
    echo  Descargalo en: https://nodejs.org
)

echo.
pause
