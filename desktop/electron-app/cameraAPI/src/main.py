"""
Photobooth Camera Service - FastAPI application.
Provides 8 endpoints for Canon EDSDK and webcam control.
"""

import io
import os
import sys
import uuid
import time
import logging
import threading
from pathlib import Path
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, Response
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

# Ensure src directory is in path for imports
_src_dir = os.path.dirname(os.path.abspath(__file__))
if _src_dir not in sys.path:
    sys.path.insert(0, os.path.dirname(_src_dir))

try:
    from .camera_manager import CameraManager
except ImportError:
    from camera_manager import CameraManager

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("camera_service")

# ---------------------------------------------------------------------------
# Camera manager singleton
# ---------------------------------------------------------------------------
camera = CameraManager()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    logger.info("Camera service starting...")
    yield
    logger.info("Camera service shutting down...")
    camera.release()


app = FastAPI(title="Photobooth Camera Service", lifespan=lifespan)

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class SetPropertyRequest(BaseModel):
    property: str
    value: int


class GetPropertyRequest(BaseModel):
    property: str


class ToggleWebcamRequest(BaseModel):
    use_webcam: bool
    device_index: int = 0


class ToggleMirrorRequest(BaseModel):
    mirror: bool


class SetSaveDirRequest(BaseModel):
    path: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/options")
async def get_options():
    """Return available camera options for the current mode."""
    try:
        options = camera.get_options()
        return {
            "status": "success",
            "options": options,
            "save_dir": camera.save_dir,
            "use_webcam": camera.mode == "webcam",
        }
    except Exception as e:
        logger.error("Error getting options: %s", e, exc_info=True)
        return {"status": "error", "detail": str(e)}


@app.get("/video_feed")
async def video_feed():
    """MJPEG live view stream."""
    def generate():
        while True:
            try:
                frame = camera.get_frame_bytes()
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n"
                    + frame
                    + b"\r\n"
                )
            except Exception as e:
                logger.debug("video_feed generate error: %s", e)
                # Send minimal placeholder on error
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n"
                    + camera._MINIMAL_JPEG
                    + b"\r\n"
                )
            time.sleep(1.0 / 15)  # ~15 FPS (stable for MJPEG)

    return StreamingResponse(
        generate(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={"Cache-Control": "no-cache", "Pragma": "no-cache"},
    )


@app.post("/capture")
async def capture():
    """Trigger a photo capture."""
    try:
        result = camera.capture_photo()
        return result
    except Exception as e:
        logger.error("Capture error: %s", e, exc_info=True)
        return {"status": "error", "detail": str(e)}


@app.post("/set_save_dir")
async def set_save_dir(req: SetSaveDirRequest):
    """Set the directory where captured photos are saved."""
    try:
        os.makedirs(req.path, exist_ok=True)
        camera.save_dir = req.path
        return {"status": "success", "message": f"Save directory set to {req.path}"}
    except Exception as e:
        logger.error("Set save dir error: %s", e)
        return {"status": "error", "detail": str(e)}


@app.post("/toggle_webcam")
async def toggle_webcam(req: ToggleWebcamRequest):
    """Switch between Canon and webcam mode."""
    try:
        if req.use_webcam:
            result = camera.switch_to_webcam(req.device_index)
        else:
            result = camera.switch_to_canon()
        return result
    except Exception as e:
        logger.error("Toggle webcam error: %s", e, exc_info=True)
        return {"status": "error", "detail": str(e)}


@app.post("/toggle_mirror")
async def toggle_mirror(req: ToggleMirrorRequest):
    """Enable/disable horizontal mirror for live view."""
    camera.mirror = req.mirror
    return {
        "status": "success",
        "mirror_mode": req.mirror,
        "message": f"Mirror {'enabled' if req.mirror else 'disabled'}",
    }


@app.post("/set_property")
async def set_property(req: SetPropertyRequest):
    """Set a camera property (ISO, aperture, shutter, white_balance, etc.)."""
    try:
        result = camera.set_property(req.property, req.value)
        return result
    except Exception as e:
        logger.error("Set property error: %s", e, exc_info=True)
        return {"status": "error", "detail": str(e)}


@app.post("/get_property")
async def get_property(req: GetPropertyRequest):
    """Read a camera property value."""
    try:
        result = camera.get_property(req.property)
        return result
    except Exception as e:
        logger.error("Get property error: %s", e, exc_info=True)
        return {"status": "error", "detail": str(e)}


@app.post("/auto_focus")
async def auto_focus():
    """Trigger auto-focus on Canon camera."""
    try:
        result = camera.auto_focus()
        return result
    except Exception as e:
        logger.error("Auto focus error: %s", e, exc_info=True)
        return {"status": "error", "detail": str(e)}


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
async def health():
    return {
        "status": "running",
        "mode": camera.mode.value,
        "canon_connected": camera.canon_connected,
        "camera_name": camera.edsdk.camera_name if camera.edsdk else "",
        "live_view_active": camera._live_view_active,
    }


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    """Run the camera service."""
    import uvicorn
    uvicorn.run(
        "src.main:app",
        host="127.0.0.1",
        port=5000,
        log_level="info",
        reload=False,
    )


if __name__ == "__main__":
    main()
