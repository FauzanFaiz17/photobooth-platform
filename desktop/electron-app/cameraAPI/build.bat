@echo off
REM Build camera service into standalone executable using PyInstaller
REM Run this from the cameraAPI directory

echo Installing dependencies...
pip install -r requirements.txt pyinstaller

echo Building main.exe...
pyinstaller ^
    --onefile ^
    --name main ^
    --add-data "EDSDK.dll;." ^
    --add-data "EdsImage.dll;." ^
    --hidden-import uvicorn.logging ^
    --hidden-import uvicorn.loops ^
    --hidden-import uvicorn.loops.auto ^
    --hidden-import uvicorn.protocols ^
    --hidden-import uvicorn.protocols.http ^
    --hidden-import uvicorn.protocols.http.auto ^
    --hidden-import uvicorn.protocols.websockets ^
    --hidden-import uvicorn.protocols.websockets.auto ^
    --hidden-import uvicorn.lifespan ^
    --hidden-import uvicorn.lifespan.on ^
    --noconfirm ^
    src/main.py

echo.
echo Build complete! Output: dist\main.exe
echo Copy dist\main.exe to this directory to replace the old one.
pause
