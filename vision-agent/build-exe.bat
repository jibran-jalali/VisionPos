@echo off
title VisionPOS Engine Builder
cd /d "%~dp0"

echo ============================================
echo  VisionPOS Engine — Standalone EXE Builder
echo ============================================
echo.

:: Use venv python
set "PYTHON=.venv\Scripts\python.exe"
set "PYINSTALLER=.venv\Scripts\pyinstaller.exe"

if not exist "%PYTHON%" (
    echo Virtual environment not found. Run setup-engine.bat first.
    pause
    exit /b 1
)

echo Cleaning previous build...
if exist "dist\VisionPOS Engine" rmdir /s /q "dist\VisionPOS Engine"
if exist "build" rmdir /s /q "build"
if exist "VisionPOS Engine.spec" del "VisionPOS Engine.spec"

echo Building standalone executable (this takes a few minutes)...
"%PYINSTALLER%" --noconfirm ^
    --onefile ^
    --windowed ^
    --name "VisionPOS Engine" ^
    --icon "engine.ico" ^
    --add-data "engine.ico;." ^
    --add-data "api.py;." ^
    --add-data "config.py;." ^
    --add-data "matcher.py;." ^
    --add-data "embedder.py;." ^
    --add-data "models.py;." ^
    --add-data "storage.py;." ^
    --add-data "barcode_scanner.py;." ^
    --add-data "video_processor.py;." ^
    --add-data "frame_extractor.py;." ^
    --add-data "main.py;." ^
    --hidden-import "uvicorn" ^
    --hidden-import "uvicorn.logging" ^
    --hidden-import "uvicorn.loops" ^
    --hidden-import "uvicorn.loops.auto" ^
    --hidden-import "uvicorn.protocols" ^
    --hidden-import "uvicorn.protocols.http" ^
    --hidden-import "uvicorn.protocols.http.auto" ^
    --hidden-import "uvicorn.protocols.websocket" ^
    --hidden-import "uvicorn.protocols.websocket.auto" ^
    --hidden-import "uvicorn.middleware" ^
    --hidden-import "uvicorn.middleware.wsgi" ^
    --hidden-import "fastapi" ^
    --hidden-import "cv2" ^
    --hidden-import "numpy" ^
    --hidden-import "PIL" ^
    --hidden-import "PIL._tkinter_finder" ^
    --hidden-import "pyzbar" ^
    --hidden-import "pyzbar.pyzbar" ^
    --collect-all "cv2" ^
    --collect-all "uvicorn" ^
    "engine_ui.pyw"

if %errorlevel% neq 0 (
    echo Build failed.
    pause
    exit /b 1
)

echo.
echo ============================================
echo  Build complete!
echo.
echo  Output: dist\VisionPOS Engine.exe
echo  Size: 
for %%f in ("dist\VisionPOS Engine.exe") do echo  %%~zf bytes
echo ============================================

:: Copy the engine into the dist folder for packaging
if exist "dist\VisionPOS Engine.exe" (
    echo.
    echo Executable ready at: dist\VisionPOS Engine.exe
)

pause
