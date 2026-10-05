"""
Camera manager: coordinates Canon EDSDK and webcam (OpenCV) modes.
"""

import os
import uuid
import time
import queue
import logging
import threading
from enum import Enum
from typing import Optional, Dict, Any, List
from pathlib import Path

logger = logging.getLogger(__name__)

cv2 = None

# EDS_ERR_INVALID_HANDLE — kamera sempat re-enumerate (boot/power-cycle),
# referensi sesi lama tidak berlaku lagi dan harus dibuka ulang.
_EDS_ERR_INVALID_HANDLE = 0x00000061


def _import_cv2():
    global cv2
    if cv2 is None:
        try:
            import cv2 as _cv2
            cv2 = _cv2
        except ImportError:
            logger.warning("opencv-python not installed. Webcam features disabled.")
    return cv2


class CameraMode(str, Enum):
    CANON = "canon"
    WEBCAM = "webcam"


class CameraManager:

    _MINIMAL_JPEG = (
        b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00'
        b'\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08'
        b'\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e'
        b'\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\x27444444444444'
        b'\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00'
        b'\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00'
        b'\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b'
        b'\xff\xc4\x00\xb5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04'
        b'\x04\x00\x00\x01}\x01\x02\x03\x00\x04\x11\x05\x12!1A\x06\x13Qa'
        b'\x07"q\x142\x81\x91\xa1\x08#B\xb1\xc1\x15R\xd1\xf0$3br\x82\t\n'
        b'\x16\x17\x18\x19\x1a%&\'()*456789:CDEFGHIJSTUVWXYZcdefghijst'
        b'uvwxyz\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94\x95\x96\x97'
        b'\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5'
        b'\xb6\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3'
        b'\xd4\xd5\xd6\xd7\xd8\xd9\xda\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9'
        b'\xea\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa'
        b'\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xfb\xd2\x8a(\x03\xff\xd9'
    )

    # Interval minimum antar percobaan ulang start live view (detik).
    _LIVE_VIEW_RETRY_INTERVAL = 2.0

    def __init__(self):
        self._mode: CameraMode = CameraMode.CANON
        self._mirror: bool = False
        self._save_dir: str = ""
        self._webcam_index: int = 0
        self._webcam_capture = None
        self._webcam_lock = threading.Lock()
        self._live_view_active: bool = False
        self._last_live_view_attempt: float = 0.0
        # EDSDK tidak thread-safe: semua akses kamera harus antri lewat lock ini.
        # RLock karena method sering memanggil method lain di class yang sama.
        self._lock = threading.RLock()

        self._edsdk = None
        self._canon_connected: bool = False

        # EDSDK di Windows hanya aman dipanggil dari SATU thread — thread yang
        # menjalankan EdsInitializeSDK. Panggilan native (mis. EdsDownloadEvfImage)
        # dari thread lain bisa memblokir selamanya (dibuktikan py-spy). Semua
        # akses kamera karena itu dijadikan antrean lewat _submit() ke thread SDK.
        self._sdk_queue: "queue.Queue" = queue.Queue()
        self._sdk_thread = threading.Thread(
            target=self._sdk_loop, name="edsdk-actor", daemon=True
        )
        self._sdk_thread.start()
        try:
            self._submit(self._init_edsdk, timeout=30.0)
        except Exception as e:
            logger.error("EDSDK init failed: %s", e)
            self._edsdk = None

    def _sdk_loop(self):
        """Loop thread SDK: satu-satunya tempat panggilan EDSDK dieksekusi."""
        while True:
            item = self._sdk_queue.get()
            if item is None:
                return
            fn, args, kwargs, done, box = item
            try:
                box["result"] = fn(*args, **kwargs)
            except BaseException as e:  # noqa: BLE001 - diteruskan ke pemanggil
                box["error"] = e
            finally:
                done.set()

    def _submit(self, fn, *args, timeout: float = 15.0, **kwargs):
        """Jalankan fn di thread SDK dan tunggu hasilnya (maks. `timeout` detik).

        Melempar TimeoutError bila thread SDK macet, supaya endpoint membalas
        cepat dengan error alih-alih menggantung.
        """
        if threading.current_thread() is self._sdk_thread:
            return fn(*args, **kwargs)
        done = threading.Event()
        box: Dict[str, Any] = {}
        self._sdk_queue.put((fn, args, kwargs, done, box))
        if not done.wait(timeout):
            raise TimeoutError(
                f"EDSDK actor busy (timeout {timeout:.0f}s: {getattr(fn, '__name__', fn)})"
            )
        if "error" in box:
            raise box["error"]
        return box.get("result")

    def _init_edsdk(self):
        try:
            try:
                from .edsdk_wrapper import EDSDKWrapper
            except ImportError:
                from edsdk_wrapper import EDSDKWrapper
            self._edsdk = EDSDKWrapper()
            if self._edsdk.available:
                if self._edsdk.initialize():
                    if self._edsdk.open_first_camera():
                        self._canon_connected = True
                        # Start live view immediately
                        if self._edsdk.start_live_view():
                            self._live_view_active = True
                        logger.info("Canon camera connected and live view started")
                    else:
                        logger.info("EDSDK initialized but no Canon camera connected")
            else:
                logger.warning("EDSDK not available")
        except Exception as e:
            logger.error("Failed to initialize EDSDK: %s", e)
            self._edsdk = None

    @property
    def mode(self) -> CameraMode:
        return self._mode

    @property
    def mirror(self) -> bool:
        return self._mirror

    @mirror.setter
    def mirror(self, value: bool):
        self._mirror = value

    @property
    def save_dir(self) -> str:
        return self._save_dir

    @save_dir.setter
    def save_dir(self, value: str):
        self._save_dir = value
        if self._edsdk:
            self._edsdk._save_dir = value

    @property
    def canon_connected(self) -> bool:
        return self._canon_connected

    @property
    def edsdk(self):
        return self._edsdk

    def is_webcam_active(self) -> bool:
        return self._mode == CameraMode.WEBCAM and self._webcam_capture is not None

    def get_edsdk(self):
        return self._edsdk

    # -- Mode switching --

    def switch_to_canon(self) -> Dict[str, Any]:
        return self._submit(self._switch_to_canon_impl, timeout=20.0)

    def _switch_to_canon_impl(self) -> Dict[str, Any]:
        with self._lock:
            self._stop_webcam()
            self._mode = CameraMode.CANON

            if self._edsdk and not self._canon_connected:
                if self._edsdk.open_first_camera():
                    self._canon_connected = True

            if self._canon_connected and self._edsdk:
                if not self._live_view_active:
                    # Hanya tandai aktif bila start_live_view benar-benar berhasil.
                    self._live_view_active = self._edsdk.start_live_view()
                    self._last_live_view_attempt = time.monotonic()
                if self._live_view_active:
                    return {"status": "success", "detail": "Canon mode activated"}
                return {
                    "status": "error",
                    "detail": "Canon terhubung tetapi live view gagal dimulai.",
                }
            return {"status": "error", "detail": "Canon camera not connected"}

    def switch_to_webcam(self, device_index: int = 0) -> Dict[str, Any]:
        return self._submit(
            self._switch_to_webcam_impl, device_index, timeout=20.0
        )

    def _switch_to_webcam_impl(self, device_index: int = 0) -> Dict[str, Any]:
        with self._lock:
            self._stop_canon_live_view()
            self._mode = CameraMode.WEBCAM
            self._webcam_index = device_index

            cv2 = _import_cv2()
            if cv2 is None:
                self._mode = CameraMode.CANON
                return {"status": "error", "detail": "opencv-python not installed"}

            self._start_webcam(device_index)
            if self._webcam_capture is None:
                # Gagal buka webcam → kembalikan mode ke Canon supaya
                # preview tidak terjebak mati.
                self._mode = CameraMode.CANON
                if self._edsdk and self._canon_connected:
                    self._live_view_active = self._edsdk.start_live_view()
                return {
                    "status": "error",
                    "detail": f"Webcam {device_index} tidak bisa dibuka",
                }
            return {"status": "success", "detail": f"Webcam {device_index} activated"}

    def _start_webcam(self, device_index: int):
        cv2 = _import_cv2()
        if cv2 is None:
            return
        with self._webcam_lock:
            if self._webcam_capture is not None:
                self._webcam_capture.release()
            self._webcam_capture = cv2.VideoCapture(device_index)
            if not self._webcam_capture.isOpened():
                logger.error("Failed to open webcam %d", device_index)
                self._webcam_capture = None

    def _stop_webcam(self):
        with self._webcam_lock:
            if self._webcam_capture is not None:
                self._webcam_capture.release()
                self._webcam_capture = None

    def _stop_canon_live_view(self):
        if self._edsdk and self._live_view_active:
            self._edsdk.stop_live_view()
            self._live_view_active = False

    def release(self):
        try:
            self._submit(self._release_impl, timeout=10.0)
        except Exception as e:
            logger.warning("release via SDK actor failed: %s", e)

    def _release_impl(self):
        with self._lock:
            self._stop_webcam()
            self._stop_canon_live_view()
            if self._edsdk:
                self._edsdk.close_session()
                self._edsdk.terminate()

    # -- Property access --

    def get_options(self) -> Dict[str, Any]:
        if self._mode == CameraMode.CANON and self._canon_connected and self._edsdk:
            return self._submit(self._get_canon_options, timeout=10.0)
        elif self._mode == CameraMode.WEBCAM:
            return self._get_webcam_options()
        return self._empty_options()

    def _get_canon_options(self) -> Dict[str, Any]:
        try:
            from .edsdk_wrapper import (
                get_property_options, get_psparam_options,
                kEdsPropID_ISOSpeed, kEdsPropID_Av, kEdsPropID_Tv,
                kEdsPropID_WhiteBalance, kEdsPropID_PictureStyle,
                kEdsPropID_ExposureCompensation, kEdsPropID_AFMode,
                kEdsPropID_ImageQuality,
                ISO_VALUES, AV_VALUES, TV_VALUES, WB_VALUES, PS_VALUES,
            )
        except ImportError:
            from edsdk_wrapper import (
                get_property_options, get_psparam_options,
                kEdsPropID_ISOSpeed, kEdsPropID_Av, kEdsPropID_Tv,
                kEdsPropID_WhiteBalance, kEdsPropID_PictureStyle,
                kEdsPropID_ExposureCompensation, kEdsPropID_AFMode,
                kEdsPropID_ImageQuality,
                ISO_VALUES, AV_VALUES, TV_VALUES, WB_VALUES, PS_VALUES,
            )

        edsdk = self._edsdk
        edsdk.process_events()

        # Also check for pending downloads
        edsdk.poll_downloads()

        # Focus mode: 0 = One-shot, 1 = AI Servo, 2 = AI Focus (varies)
        focus_options = [
            {"name": "One Shot", "value": 0},
            {"name": "AI Servo", "value": 1},
            {"name": "AI Focus", "value": 2},
            {"name": "Manual", "value": 3},
        ]

        return {
            "iso": get_property_options(edsdk, kEdsPropID_ISOSpeed, ISO_VALUES),
            "aperture": get_property_options(edsdk, kEdsPropID_Av, AV_VALUES),
            "shutter": get_property_options(edsdk, kEdsPropID_Tv, TV_VALUES),
            "white_balance": get_property_options(
                edsdk, kEdsPropID_WhiteBalance, WB_VALUES
            ),
            "picture_style": get_property_options(
                edsdk, kEdsPropID_PictureStyle, PS_VALUES
            ),
            "exposure": get_property_options(
                edsdk, kEdsPropID_ExposureCompensation, {}
            ),
            "focus_mode": focus_options,
            "contrast": get_psparam_options(),
            "saturation": get_psparam_options(),
        }

    def _get_webcam_options(self) -> Dict[str, Any]:
        return self._empty_options()

    def _empty_options(self) -> Dict[str, Any]:
        return {
            "iso": [],
            "aperture": [],
            "shutter": [],
            "white_balance": [],
            "picture_style": [],
            "exposure": [],
            "focus_mode": [],
            "contrast": [],
            "saturation": [],
        }

    def set_property(self, property_name: str, value: int) -> Dict[str, Any]:
        if self._mode != CameraMode.CANON or not self._canon_connected or not self._edsdk:
            return {"status": "error", "detail": "Canon camera not active"}

        return self._submit(
            self._set_property_locked, property_name, value, timeout=10.0
        )

    def _set_property_locked(self, property_name: str, value: int) -> Dict[str, Any]:
        try:
            from .edsdk_wrapper import (
                kEdsPropID_ISOSpeed, kEdsPropID_Av, kEdsPropID_Tv,
                kEdsPropID_WhiteBalance, kEdsPropID_PictureStyle,
                kEdsPropID_ExposureCompensation, kEdsPropID_AFMode,
            )
        except ImportError:
            from edsdk_wrapper import (
                kEdsPropID_ISOSpeed, kEdsPropID_Av, kEdsPropID_Tv,
                kEdsPropID_WhiteBalance, kEdsPropID_PictureStyle,
                kEdsPropID_ExposureCompensation, kEdsPropID_AFMode,
            )

        prop_map = {
            "iso": kEdsPropID_ISOSpeed,
            "aperture": kEdsPropID_Av,
            "shutter": kEdsPropID_Tv,
            "white_balance": kEdsPropID_WhiteBalance,
            "picture_style": kEdsPropID_PictureStyle,
            "exposure": kEdsPropID_ExposureCompensation,
            "focus_mode": kEdsPropID_AFMode,
        }

        if property_name in prop_map:
            ok = self._edsdk.set_property_value(prop_map[property_name], value)
            detail = f"Set {property_name}={'0x%X' % (value & 0xFFFFFFFF)}"
            if not ok:
                code = int(getattr(self._edsdk, "last_error", 0) or 0)
                detail = f"{detail} gagal (EDSDK 0x{code & 0xFFFFFFFF:08X})"
            return {
                "status": "success" if ok else "error",
                "detail": detail,
            }

        # Picture style sub-parameters via EdsPictureStyleDesc
        psparam_map = {
            "contrast": "contrast",
            "saturation": "saturation",
            "sharpness": "sharpness",
            "color_tone": "colorTone",
        }
        if property_name in psparam_map:
            ok = self._edsdk.set_picture_style_param(
                psparam_map[property_name], value
            )
            detail = f"Set {property_name}={value}"
            if not ok:
                code = int(getattr(self._edsdk, "last_error", 0) or 0)
                detail = f"{detail} gagal (EDSDK 0x{code & 0xFFFFFFFF:08X})"
            return {
                "status": "success" if ok else "error",
                "detail": detail,
            }

        return {"status": "error", "detail": f"Unknown property: {property_name}"}

    def get_property(self, property_name: str) -> Dict[str, Any]:
        if self._mode != CameraMode.CANON or not self._canon_connected or not self._edsdk:
            return {"status": "error", "detail": "Canon camera not active"}

        return self._submit(
            self._get_property_locked, property_name, timeout=10.0
        )

    def _get_property_locked(self, property_name: str) -> Dict[str, Any]:
        try:
            from .edsdk_wrapper import (
                kEdsPropID_ISOSpeed, kEdsPropID_Av, kEdsPropID_Tv,
                kEdsPropID_WhiteBalance, kEdsPropID_PictureStyle,
                kEdsPropID_ExposureCompensation, kEdsPropID_AFMode,
            )
        except ImportError:
            from edsdk_wrapper import (
                kEdsPropID_ISOSpeed, kEdsPropID_Av, kEdsPropID_Tv,
                kEdsPropID_WhiteBalance, kEdsPropID_PictureStyle,
                kEdsPropID_ExposureCompensation, kEdsPropID_AFMode,
            )

        prop_map = {
            "iso": kEdsPropID_ISOSpeed,
            "aperture": kEdsPropID_Av,
            "shutter": kEdsPropID_Tv,
            "white_balance": kEdsPropID_WhiteBalance,
            "picture_style": kEdsPropID_PictureStyle,
            "exposure": kEdsPropID_ExposureCompensation,
            "focus_mode": kEdsPropID_AFMode,
        }

        if property_name in prop_map:
            val = self._edsdk.get_property_value(prop_map[property_name])
            if val is None:
                return {"status": "error", "detail": f"Cannot read {property_name}"}
            return {"status": "success", "property": property_name, "value": val}

        if property_name in ("contrast", "saturation", "sharpness", "color_tone"):
            field = {
                "contrast": "contrast",
                "saturation": "saturation",
                "sharpness": "sharpness",
                "color_tone": "colorTone",
            }[property_name]
            val = self._edsdk.get_picture_style_param(field)
            if val is None:
                return {"status": "error", "detail": f"Cannot read {property_name}"}
            return {"status": "success", "property": property_name, "value": val}

        return {"status": "error", "detail": f"Unknown property: {property_name}"}

    def auto_focus(self) -> Dict[str, Any]:
        if self._mode != CameraMode.CANON or not self._canon_connected or not self._edsdk:
            return {"status": "error", "detail": "Canon camera not active"}
        ok = self._submit(self._edsdk.auto_focus, timeout=10.0)
        return {
            "status": "success" if ok else "error",
            "detail": "Auto focus triggered" if ok else "Auto focus failed",
        }

    # -- Live view --

    def get_frame_bytes(self) -> bytes:
        try:
            if self._mode == CameraMode.CANON:
                frame = self._submit(self._get_canon_frame, timeout=6.0)
                return frame or self._MINIMAL_JPEG
            elif self._mode == CameraMode.WEBCAM:
                return self._get_webcam_frame() or self._MINIMAL_JPEG
        except TimeoutError:
            # Thread SDK sedang sibuk (mis. menunggu capture) — tampilkan
            # placeholder, bukan memblokir stream.
            return self._generate_placeholder_frame("Kamera Canon sibuk...")
        except Exception as e:
            logger.debug("get_frame_bytes error: %s", e)
        return self._MINIMAL_JPEG

    def _get_canon_frame(self) -> Optional[bytes]:
        if not self._edsdk:
            return self._generate_placeholder_frame("EDSDK tidak tersedia")

        if not self._canon_connected:
            # Kamera bisa mati (auto-poweroff) lalu dinyalakan lagi —
            # coba sambung ulang otomatis dengan jeda minimal.
            now = time.monotonic()
            if now - self._last_live_view_attempt >= self._LIVE_VIEW_RETRY_INTERVAL:
                self._last_live_view_attempt = now
                if self._edsdk.open_first_camera():
                    self._canon_connected = True
                    logger.info("Canon camera reconnected on demand")
                    self._live_view_active = self._edsdk.start_live_view()
            if not self._canon_connected:
                return self._generate_placeholder_frame("Menunggu kamera Canon...")

        with self._lock:
            self._edsdk.process_events()

            # Ensure live view is started (dengan throttle agar tidak
            # memanggil EDSDK 15x/detik saat kamera sedang sibuk/gagal).
            if not self._live_view_active:
                now = time.monotonic()
                if now - self._last_live_view_attempt >= self._LIVE_VIEW_RETRY_INTERVAL:
                    self._last_live_view_attempt = now
                    self._live_view_active = self._edsdk.start_live_view()
                    if not self._live_view_active:
                        self._recover_stale_session()

            try:
                frame = self._edsdk.get_live_view_frame()
                if frame:
                    return frame
                if self._edsdk.last_error == _EDS_ERR_INVALID_HANDLE:
                    # Handle basi saat streaming → buka sesi ulang lalu
                    # ambil frame lagi pada tick berikutnya.
                    self._recover_stale_session()
            except Exception as e:
                logger.debug("EDSDK EVF download failed: %s", e)

        return self._generate_placeholder_frame("Canon Live View")

    def _recover_stale_session(self):
        """Buka ulang sesi Canon bila handle EDSDK basi (0x61)."""
        if self._edsdk.last_error != _EDS_ERR_INVALID_HANDLE:
            return
        if self._edsdk.reopen_camera():
            self._canon_connected = True
            self._live_view_active = self._edsdk.start_live_view()
            logger.info(
                "Canon session recovered (live_view=%s)", self._live_view_active
            )
        else:
            self._canon_connected = False
            self._live_view_active = False
            logger.warning("Canon session recovery failed (kamera hilang?)")

    def _get_webcam_frame(self) -> Optional[bytes]:
        cv2 = _import_cv2()
        if cv2 is None:
            return None
        with self._webcam_lock:
            if self._webcam_capture is None or not self._webcam_capture.isOpened():
                return None
            ret, frame = self._webcam_capture.read()
            if not ret or frame is None:
                return None
        if self._mirror:
            frame = cv2.flip(frame, 1)
        ok, buffer = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        return buffer.tobytes() if ok else None

    def _generate_placeholder_frame(self, text: str) -> bytes:
        cv2 = _import_cv2()
        if cv2 is None:
            return self._MINIMAL_JPEG
        try:
            h, w = 480, 640
            img = cv2.zeros((h, w, 3), dtype=cv2.uint8)
            img[:] = (30, 30, 30)
            font = cv2.FONT_HERSHEY_SIMPLEX
            text_size = cv2.getTextSize(text, font, 0.8, 2)[0]
            x = (w - text_size[0]) // 2
            y = (h + text_size[1]) // 2
            cv2.putText(img, text, (x, y), font, 0.8, (200, 200, 200), 2)
            ok, buffer = cv2.imencode(".jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 80])
            if ok:
                return buffer.tobytes()
        except Exception as e:
            logger.debug("Placeholder generation failed: %s", e)
        return self._MINIMAL_JPEG

    # -- Capture --

    def capture_photo(self) -> Dict[str, Any]:
        if self._mode == CameraMode.CANON:
            return self._submit(self._capture_canon, timeout=30.0)
        elif self._mode == CameraMode.WEBCAM:
            return self._capture_webcam()
        return {"status": "error", "detail": "No camera active"}

    def _capture_canon(self) -> Dict[str, Any]:
        if not self._canon_connected or not self._edsdk:
            return {"status": "error", "detail": "Canon not connected"}

        with self._lock:
            ok = self._edsdk.take_picture()
        if not ok:
            return {"status": "error", "detail": "Failed to trigger capture"}

        # Wait for the image to arrive via object event, then download
        downloaded = self._wait_for_download(timeout=8.0)
        if downloaded:
            return {
                "status": "success",
                "message": f"Captured and downloaded to {downloaded}",
                "path": downloaded,
            }
        return {
            "status": "success",
            "message": "Capture triggered (image may be on camera card)",
        }

    def _wait_for_download(self, timeout: float = 8.0) -> Optional[str]:
        """Poll for pending downloads from object events."""
        if not self._edsdk:
            return None
        deadline = time.time() + timeout
        while time.time() < deadline:
            with self._lock:
                paths = self._edsdk.poll_downloads()
                if not paths:
                    self._edsdk.process_events()
            if paths:
                return paths[0]
            time.sleep(0.1)
        # Final check
        with self._lock:
            paths = self._edsdk.poll_downloads()
        return paths[0] if paths else None

    def _capture_webcam(self) -> Dict[str, Any]:
        cv2 = _import_cv2()
        if cv2 is None:
            return {"status": "error", "detail": "opencv-python not installed"}

        frame_bytes = self._get_webcam_frame()
        if frame_bytes is None:
            return {"status": "error", "detail": "Failed to capture frame"}

        if self._save_dir:
            os.makedirs(self._save_dir, exist_ok=True)
            filename = f"capture_{uuid.uuid4().hex[:8]}.jpeg"
            filepath = os.path.join(self._save_dir, filename)
            with open(filepath, "wb") as f:
                f.write(frame_bytes)
            return {"status": "success", "message": f"Saved to {filepath}", "path": filepath}

        return {"status": "success", "message": "Webcam capture OK"}
