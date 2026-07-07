@echo off
title VisionPOS Engine Installer
cd /d "%~dp0"

set "INSTALL_DIR=%USERPROFILE%\VisionPOS-Engine"
set "PYTHON_CMD=python"

echo ======================================================
echo  VisionPOS Engine — One-click Installer
echo ======================================================
echo.
echo This will install the engine in:
echo   %INSTALL_DIR%
echo.

:: Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    where py >nul 2>nul
    if %errorlevel% neq 0 (
        echo Python is not installed.
        echo Download Python 3.10+ from https://www.python.org/downloads/
        echo Make sure to check "Add Python to PATH" during installation.
        pause
        exit /b 1
    )
    set "PYTHON_CMD=py"
)

:: Create install directory
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo Installing to %INSTALL_DIR% ...
echo.

:: Determine the web app base URL
:: If this file was run from the project folder (dev mode), use localhost
if exist "..\..\api.py" (
    set "BASE_URL=http://localhost:3000"
) else (
    :: When downloaded, the URL needs to be configured
    :: Default to localhost for development; change this for production
    set "BASE_URL=http://localhost:3000"
)

:: Download engine files
echo Downloading engine files...
set "FILES=engine_ui.pyw api.py config.py matcher.py embedder.py models.py storage.py barcode_scanner.py video_processor.py frame_extractor.py main.py requirements.txt setup-engine.bat"

for %%f in (%FILES%) do (
    powershell -Command "& {try{$wc=New-Object System.Net.WebClient;$wc.DownloadFile('%BASE_URL%/agent/%%f','%INSTALL_DIR%\%%f')}catch{Write-Host 'Could not download %%f' -ForegroundColor Red;exit 1}}" 2>nul
    if exist "%INSTALL_DIR%\%%f" (
        echo   Downloaded %%f
    ) else (
        echo   FAILED to download %%f
        echo.
        echo Make sure the VisionPOS web app is running at %BASE_URL%
        pause
        exit /b 1
    )
)

:: Set up Python venv
echo.
echo Setting up Python environment...
cd /d "%INSTALL_DIR%"
if exist ".venv" rmdir /s /q ".venv"
"%PYTHON_CMD%" -m venv ".venv"
if %errorlevel% neq 0 (
    echo Failed to create Python virtual environment.
    pause
    exit /b 1
)

echo Installing packages (first download may take a minute)...
call ".venv\Scripts\pip.exe" install --upgrade pip >nul 2>nul
call ".venv\Scripts\pip.exe" install -r requirements.txt
if %errorlevel% neq 0 (
    echo Package installation failed.
    pause
    exit /b 1
)

:: Create desktop shortcut
echo.
echo Creating desktop shortcut...
set "SHORTCUT=%USERPROFILE%\Desktop\VisionPOS Engine.lnk"
set "TARGET=%INSTALL_DIR%\.venv\Scripts\pythonw.exe"
set "ARGS=%INSTALL_DIR%\engine_ui.pyw"
set "ICON=%INSTALL_DIR%\engine_ui.pyw"

powershell -Command "$WS=New-Object -ComObject WScript.Shell;$SC=$WS.CreateShortcut('%SHORTCUT%');$SC.TargetPath='%TARGET:\=\\%';$SC.Arguments='%ARGS:\=\\%';$SC.WorkingDirectory='%INSTALL_DIR:\=\\%';$SC.Description='VisionPOS Engine';$SC.Save()" >nul

echo.
echo ======================================================
echo  Installation complete!
echo.
echo  A shortcut "VisionPOS Engine" has been added to your desktop.
echo  Double-click it to start the engine, then click "Run Engine".
echo ======================================================

:: Launch the engine
echo.
echo Launching VisionPOS Engine...
start "" "%INSTALL_DIR%\.venv\Scripts\pythonw.exe" "%INSTALL_DIR%\engine_ui.pyw"
echo Engine window opened. Close this window.
exit /b 0
