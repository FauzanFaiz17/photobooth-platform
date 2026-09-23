"""Entry point for PyInstaller build."""
import sys
import os

# Ensure src is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from src.main import app
import uvicorn

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5000, log_level="info")
