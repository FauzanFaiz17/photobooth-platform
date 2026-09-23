"""
Canon EDSDK ctypes wrapper for Python.
Values and signatures match the official EDSDK v13.20 headers.
"""

import ctypes
import ctypes.util
import os
import sys
import logging
from typing import Optional, List, Tuple

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Load EDSDK.dll
# ---------------------------------------------------------------------------

def _load_edsdk() -> ctypes.CDLL:
    if getattr(sys, "frozen", False):
        base = os.path.dirname(sys.executable)
    else:
        base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    for candidate in [
        os.path.join(base, "EDSDK.dll"),
        os.path.join(os.path.dirname(base), "EDSDK.dll"),
        os.path.join(base, "bin", "EDSDK.dll"),
        ctypes.util.find_library("EDSDK"),
    ]:
        if candidate and os.path.isfile(candidate):
            return ctypes.CDLL(candidate)
    raise OSError("EDSDK.dll not found.")


try:
    _edsdk = _load_edsdk()
except OSError as exc:
    logger.warning("EDSDK.dll not available: %s", exc)
    _edsdk = None  # type: ignore

# ---------------------------------------------------------------------------
# Types (EDSDKTypes.h)
# ---------------------------------------------------------------------------

EdsError = ctypes.c_uint32
EdsUInt32 = ctypes.c_uint32
EdsInt32 = ctypes.c_int32
EdsUInt64 = ctypes.c_uint64
EdsInt64 = ctypes.c_int64
EdsBool = ctypes.c_int
EdsChar = ctypes.c_char
EdsBaseRef = ctypes.c_void_p          # struct __EdsObject*
EdsCameraRef = EdsBaseRef
EdsCameraListRef = EdsBaseRef
EdsStreamRef = EdsBaseRef
EdsEvfImageRef = EdsBaseRef
EdsDirectoryItemRef = EdsBaseRef
EdsPropertyID = EdsUInt32
EdsDataType = EdsUInt32
EdsCameraCommand = EdsUInt32
EdsCameraStatusCommand = EdsUInt32

# EdsInt32 on Windows MSVC is `long` = 32-bit
# EdsUInt32 on Windows MSVC is `unsigned long` = 32-bit
# EdsInt64 / EdsUInt64 = __int64 = 64-bit

# ---------------------------------------------------------------------------
# Constants — from EDSDKErrors.h
# ---------------------------------------------------------------------------

EDS_ERR_OK = 0x00000000
EDS_ERR_DEVICE_BUSY = 0x00000081
EDS_ERR_OBJECT_NOTREADY = 0x0000A102
EDS_ERR_SESSION_NOT_OPEN = 0x00002003
EDS_ERR_DEVICE_NOT_FOUND = 0x00000080

# ---------------------------------------------------------------------------
# Constants — from EDSDKTypes.h
# ---------------------------------------------------------------------------

# Data types
kEdsDataType_Unknown = 0
kEdsDataType_Bool = 1
kEdsDataType_String = 2
kEdsDataType_Int8 = 3
kEdsDataType_Int16 = 4
kEdsDataType_UInt8 = 6
kEdsDataType_UInt16 = 7
kEdsDataType_Int32 = 8
kEdsDataType_UInt32 = 9
kEdsDataType_Int64 = 10
kEdsDataType_UInt64 = 11
kEdsDataType_Float = 12
kEdsDataType_Double = 13
kEdsDataType_ByteBlock = 14
kEdsDataType_Rational = 20
kEdsDataType_PictureStyleDesc = 102

# Property IDs
kEdsPropID_ProductName = 0x00000002
kEdsPropID_BatteryLevel = 0x00000008
kEdsPropID_SaveTo = 0x0000000B
kEdsPropID_ImageQuality = 0x00000100
kEdsPropID_WhiteBalance = 0x00000106
kEdsPropID_ColorTemperature = 0x00000107
kEdsPropID_PictureStyle = 0x00000114
kEdsPropID_PictureStyleDesc = 0x00000115
kEdsPropID_AEMode = 0x00000400
kEdsPropID_DriveMode = 0x00000401
kEdsPropID_ISOSpeed = 0x00000402
kEdsPropID_MeteringMode = 0x00000403
kEdsPropID_AFMode = 0x00000404
kEdsPropID_Av = 0x00000405
kEdsPropID_Tv = 0x00000406
kEdsPropID_ExposureCompensation = 0x00000407
kEdsPropID_FocalLength = 0x00000409
kEdsPropID_AvailableShots = 0x0000040A
kEdsPropID_LensName = 0x0000040D
kEdsPropID_Evf_OutputDevice = 0x00000500
kEdsPropID_Evf_Mode = 0x00000501
kEdsPropID_Evf_AFMode = 0x0000050E
kEdsPropID_Record = 0x00000510

# Camera commands
kEdsCameraCommand_TakePicture = 0x00000000
kEdsCameraCommand_ExtendShutDownTimer = 0x00000001
kEdsCameraCommand_PressShutterButton = 0x00000004
kEdsCameraCommand_DoEvfAf = 0x00000102
kEdsCameraCommand_DriveLensEvf = 0x00000103

# Shutter button params
kEdsCameraCommand_ShutterButton_OFF = 0x00000000
kEdsCameraCommand_ShutterButton_Halfway = 0x00000001
kEdsCameraCommand_ShutterButton_Completely = 0x00000003
kEdsCameraCommand_ShutterButton_Halfway_NonAF = 0x00010001
kEdsCameraCommand_ShutterButton_Completely_NonAF = 0x00010003

# EVF AF
kEdsCameraCommand_EvfAf_OFF = 0
kEdsCameraCommand_EvfAf_ON = 1

# Status commands
kEdsCameraStatusCommand_UILock = 0x00000000
kEdsCameraStatusCommand_UIUnLock = 0x00000001

# SaveTo
kEdsSaveTo_Camera = 1
kEdsSaveTo_Host = 2
kEdsSaveTo_Both = 3

# EVF Output Device
kEdsEvfOutputDevice_TFT = 1
kEdsEvfOutputDevice_PC = 2
kEdsEvfOutputDevice_PC_Small = 8

# White Balance
kEdsWhiteBalance_Auto = 0
kEdsWhiteBalance_Daylight = 1
kEdsWhiteBalance_Cloudy = 2
kEdsWhiteBalance_Tungsten = 3
kEdsWhiteBalance_Fluorescent = 4
kEdsWhiteBalance_Strobe = 5
kEdsWhiteBalance_WhitePaper = 6
kEdsWhiteBalance_Shade = 8
kEdsWhiteBalance_ColorTemp = 9
kEdsWhiteBalance_PCSet1 = 10
kEdsWhiteBalance_PCSet2 = 11
kEdsWhiteBalance_PCSet3 = 12

# Picture Style
kEdsPictureStyle_Standard = 0x0081
kEdsPictureStyle_Portrait = 0x0082
kEdsPictureStyle_Landscape = 0x0083
kEdsPictureStyle_Neutral = 0x0084
kEdsPictureStyle_Faithful = 0x0085
kEdsPictureStyle_Monochrome = 0x0086
kEdsPictureStyle_Auto = 0x0087
kEdsPictureStyle_FineDetail = 0x0088
kEdsPictureStyle_User1 = 0x0021
kEdsPictureStyle_User2 = 0x0022
kEdsPictureStyle_User3 = 0x0023

# File access / disposition
kEdsAccess_Read = 0
kEdsAccess_Write = 1
kEdsAccess_ReadWrite = 2
kEdsFileCreateDisposition_CreateNew = 0
kEdsFileCreateDisposition_CreateAlways = 1
kEdsFileCreateDisposition_OpenExisting = 2
kEdsFileCreateDisposition_OpenAlways = 3
kEdsFileCreateDisposition_TruncateExsisting = 4

# Object format
kEdsObjectFormat_Jpeg = 0x3801
kEdsObjectFormat_CR2 = 0xB103
kEdsObjectFormat_CR3 = 0xB108

# Seek origin
kEdsSeek_Cur = 0
kEdsSeek_Begin = 1
kEdsSeek_End = 2


# ---------------------------------------------------------------------------
# Structures (EDSDKTypes.h, #pragma pack(push, 8))
# ---------------------------------------------------------------------------

EDS_MAX_NAME = 256


class EdsDeviceInfo(ctypes.Structure):
    _pack_ = 8
    _fields_ = [
        ("szPortName", EdsChar * EDS_MAX_NAME),
        ("szDeviceDescription", EdsChar * EDS_MAX_NAME),
        ("deviceSubType", EdsUInt32),
        ("reserved", EdsUInt32),
    ]


class EdsDirectoryItemInfo(ctypes.Structure):
    _pack_ = 8
    _fields_ = [
        ("size", EdsUInt64),
        ("isFolder", EdsBool),
        ("groupID", EdsUInt32),
        ("option", EdsUInt32),
        ("szFileName", EdsChar * EDS_MAX_NAME),
        ("format", EdsUInt32),
        ("dateTime", EdsUInt32),
    ]


class EdsPropertyDesc(ctypes.Structure):
    _pack_ = 8
    _fields_ = [
        ("form", EdsInt32),
        ("access", EdsInt32),
        ("numElements", EdsInt32),
        ("propDesc", EdsInt32 * 128),
    ]


class EdsPictureStyleDesc(ctypes.Structure):
    _pack_ = 8
    _fields_ = [
        ("contrast", EdsInt32),
        ("sharpness", EdsUInt32),
        ("saturation", EdsInt32),
        ("colorTone", EdsInt32),
        ("filterEffect", EdsUInt32),
        ("toningEffect", EdsUInt32),
        ("sharpFineness", EdsUInt32),
        ("sharpThreshold", EdsUInt32),
    ]


class EdsCapacity(ctypes.Structure):
    _pack_ = 8
    _fields_ = [
        ("numberOfFreeClusters", EdsInt32),
        ("bytesPerSector", EdsInt32),
        ("reset", EdsBool),
    ]


class EdsSize(ctypes.Structure):
    _pack_ = 8
    _fields_ = [
        ("width", EdsInt32),
        ("height", EdsInt32),
    ]


class EdsPoint(ctypes.Structure):
    _pack_ = 8
    _fields_ = [
        ("x", EdsInt32),
        ("y", EdsInt32),
    ]


class EdsRect(ctypes.Structure):
    _pack_ = 8
    _fields_ = [
        ("point", EdsPoint),
        ("size", EdsSize),
    ]


# Callback types (for EdsSetCameraAddedHandler etc.)
CAMERA_ADDED_HANDLER = ctypes.CFUNCTYPE(
    EdsError, ctypes.c_void_p  # EdsError (EDSCALLBACK*)(EdsVoid*)
)
PROPERTY_EVENT_HANDLER = ctypes.CFUNCTYPE(
    EdsError, EdsUInt32, EdsPropertyID, EdsUInt32, ctypes.c_void_p
)
OBJECT_EVENT_HANDLER = ctypes.CFUNCTYPE(
    EdsError, EdsUInt32, EdsBaseRef, ctypes.c_void_p
)
STATE_EVENT_HANDLER = ctypes.CFUNCTYPE(
    EdsError, EdsUInt32, EdsUInt32, ctypes.c_void_p
)
PROGRESS_CALLBACK = ctypes.CFUNCTYPE(
    EdsError, EdsUInt32, ctypes.c_void_p, ctypes.POINTER(EdsBool)
)

# ---------------------------------------------------------------------------
# Function signatures
# ---------------------------------------------------------------------------

if _edsdk:
    # Basic
    _edsdk.EdsInitializeSDK.restype = EdsError
    _edsdk.EdsInitializeSDK.argtypes = []
    _edsdk.EdsTerminateSDK.restype = EdsError
    _edsdk.EdsTerminateSDK.argtypes = []
    _edsdk.EdsGetEvent.restype = EdsError
    _edsdk.EdsGetEvent.argtypes = []

    # Reference counting
    _edsdk.EdsRetain.restype = EdsUInt32
    _edsdk.EdsRetain.argtypes = [EdsBaseRef]
    _edsdk.EdsRelease.restype = EdsUInt32
    _edsdk.EdsRelease.argtypes = [EdsBaseRef]

    # Item tree
    _edsdk.EdsGetChildCount.restype = EdsError
    _edsdk.EdsGetChildCount.argtypes = [EdsBaseRef, ctypes.POINTER(EdsUInt32)]
    _edsdk.EdsGetChildAtIndex.restype = EdsError
    _edsdk.EdsGetChildAtIndex.argtypes = [
        EdsBaseRef, EdsInt32, ctypes.POINTER(EdsBaseRef)
    ]

    # Properties
    _edsdk.EdsGetPropertySize.restype = EdsError
    _edsdk.EdsGetPropertySize.argtypes = [
        EdsBaseRef, EdsPropertyID, EdsInt32,
        ctypes.POINTER(EdsDataType), ctypes.POINTER(EdsUInt32),
    ]
    _edsdk.EdsGetPropertyData.restype = EdsError
    _edsdk.EdsGetPropertyData.argtypes = [
        EdsBaseRef, EdsPropertyID, EdsInt32, EdsUInt32, ctypes.c_void_p,
    ]
    _edsdk.EdsSetPropertyData.restype = EdsError
    _edsdk.EdsSetPropertyData.argtypes = [
        EdsBaseRef, EdsPropertyID, EdsInt32, EdsUInt32, ctypes.c_void_p,
    ]
    _edsdk.EdsGetPropertyDesc.restype = EdsError
    _edsdk.EdsGetPropertyDesc.argtypes = [
        EdsBaseRef, EdsPropertyID, ctypes.POINTER(EdsPropertyDesc),
    ]

    # Camera
    _edsdk.EdsGetCameraList.restype = EdsError
    _edsdk.EdsGetCameraList.argtypes = [ctypes.POINTER(EdsCameraListRef)]
    _edsdk.EdsGetDeviceInfo.restype = EdsError
    _edsdk.EdsGetDeviceInfo.argtypes = [
        EdsCameraRef, ctypes.POINTER(EdsDeviceInfo)
    ]
    _edsdk.EdsOpenSession.restype = EdsError
    _edsdk.EdsOpenSession.argtypes = [EdsCameraRef]
    _edsdk.EdsCloseSession.restype = EdsError
    _edsdk.EdsCloseSession.argtypes = [EdsCameraRef]
    _edsdk.EdsSendCommand.restype = EdsError
    _edsdk.EdsSendCommand.argtypes = [
        EdsCameraRef, EdsCameraCommand, EdsInt32
    ]
    _edsdk.EdsSendStatusCommand.restype = EdsError
    _edsdk.EdsSendStatusCommand.argtypes = [
        EdsCameraRef, EdsCameraStatusCommand, EdsInt32
    ]
    _edsdk.EdsSetCapacity.restype = EdsError
    _edsdk.EdsSetCapacity.argtypes = [EdsCameraRef, EdsCapacity]

    # Streams
    _edsdk.EdsCreateMemoryStream.restype = EdsError
    _edsdk.EdsCreateMemoryStream.argtypes = [
        EdsUInt64, ctypes.POINTER(EdsStreamRef)
    ]
    _edsdk.EdsCreateFileStream.restype = EdsError
    _edsdk.EdsCreateFileStream.argtypes = [
        ctypes.c_char_p, ctypes.c_uint32, ctypes.c_uint32,
        ctypes.POINTER(EdsStreamRef),
    ]
    _edsdk.EdsGetPointer.restype = EdsError
    _edsdk.EdsGetPointer.argtypes = [
        EdsStreamRef, ctypes.POINTER(ctypes.c_void_p)
    ]
    _edsdk.EdsGetLength.restype = EdsError
    _edsdk.EdsGetLength.argtypes = [
        EdsStreamRef, ctypes.POINTER(EdsUInt64)
    ]
    _edsdk.EdsRead.restype = EdsError
    _edsdk.EdsRead.argtypes = [
        EdsStreamRef, EdsUInt64, ctypes.c_void_p, ctypes.POINTER(EdsUInt64)
    ]
    _edsdk.EdsSeek.restype = EdsError
    _edsdk.EdsSeek.argtypes = [
        EdsStreamRef, EdsInt64, ctypes.c_uint32
    ]
    _edsdk.EdsGetPosition.restype = EdsError
    _edsdk.EdsGetPosition.argtypes = [
        EdsStreamRef, ctypes.POINTER(EdsUInt64)
    ]

    # Download
    _edsdk.EdsGetDirectoryItemInfo.restype = EdsError
    _edsdk.EdsGetDirectoryItemInfo.argtypes = [
        EdsDirectoryItemRef, ctypes.POINTER(EdsDirectoryItemInfo)
    ]
    _edsdk.EdsDownload.restype = EdsError
    _edsdk.EdsDownload.argtypes = [
        EdsDirectoryItemRef, EdsUInt64, EdsStreamRef
    ]
    _edsdk.EdsDownloadComplete.restype = EdsError
    _edsdk.EdsDownloadComplete.argtypes = [EdsDirectoryItemRef]
    _edsdk.EdsDownloadCancel.restype = EdsError
    _edsdk.EdsDownloadCancel.argtypes = [EdsDirectoryItemRef]
    _edsdk.EdsDeleteDirectoryItem.restype = EdsError
    _edsdk.EdsDeleteDirectoryItem.argtypes = [EdsDirectoryItemRef]

    # EVF (live view)
    _edsdk.EdsCreateEvfImageRef.restype = EdsError
    _edsdk.EdsCreateEvfImageRef.argtypes = [
        EdsStreamRef, ctypes.POINTER(EdsEvfImageRef)
    ]
    _edsdk.EdsDownloadEvfImage.restype = EdsError
    _edsdk.EdsDownloadEvfImage.argtypes = [
        EdsCameraRef, EdsEvfImageRef
    ]

    # Event handlers
    _edsdk.EdsSetCameraAddedHandler.restype = EdsError
    _edsdk.EdsSetCameraAddedHandler.argtypes = [
        CAMERA_ADDED_HANDLER, ctypes.c_void_p
    ]
    _edsdk.EdsSetPropertyEventHandler.restype = EdsError
    _edsdk.EdsSetPropertyEventHandler.argtypes = [
        EdsCameraRef, EdsUInt32, PROPERTY_EVENT_HANDLER, ctypes.c_void_p
    ]
    _edsdk.EdsSetObjectEventHandler.restype = EdsError
    _edsdk.EdsSetObjectEventHandler.argtypes = [
        EdsCameraRef, EdsUInt32, OBJECT_EVENT_HANDLER, ctypes.c_void_p
    ]
    _edsdk.EdsSetCameraStateEventHandler.restype = EdsError
    _edsdk.EdsSetCameraStateEventHandler.argtypes = [
        EdsCameraRef, EdsUInt32, STATE_EVENT_HANDLER, ctypes.c_void_p
    ]
    _edsdk.EdsSetProgressCallback.restype = EdsError
    _edsdk.EdsSetProgressCallback.argtypes = [
        EdsBaseRef, PROGRESS_CALLBACK, ctypes.c_uint32, ctypes.c_void_p
    ]


# ---------------------------------------------------------------------------
# Callbacks (keep references so they aren't garbage-collected)
# ---------------------------------------------------------------------------

_pending_downloads: List[EdsBaseRef] = []   # dir-item refs waiting to be downloaded
_camera_shutdown = [False]


def _on_object_event(event: int, ref: EdsBaseRef, ctx) -> EdsError:
    # kEdsObjectEvent_DirItemRequestTransfer = 0x208
    # kEdsObjectEvent_DirItemCreated = 0x204
    if event in (0x00000208, 0x00000204, 0x00000209) and ref:
        _pending_downloads.append(ref)
    return EDS_ERR_OK


def _on_state_event(event: int, data: int, ctx) -> EdsError:
    if event == 0x00000301:  # kEdsStateEvent_Shutdown
        _camera_shutdown[0] = True
    return EDS_ERR_OK


def _on_property_event(event: int, prop_id: int, data: int, ctx) -> EdsError:
    return EDS_ERR_OK


_cb_object = OBJECT_EVENT_HANDLER(_on_object_event)
_cb_state = STATE_EVENT_HANDLER(_on_state_event)
_cb_property = PROPERTY_EVENT_HANDLER(_on_property_event)


# ---------------------------------------------------------------------------
# High-level wrapper
# ---------------------------------------------------------------------------

class EDSDKWrapper:

    def __init__(self):
        self._initialized = False
        self._camera_ref: Optional[EdsBaseRef] = None
        self._session_open = False
        self._live_view_started = False
        self._camera_name = ""

    @property
    def available(self) -> bool:
        return _edsdk is not None

    @property
    def session_open(self) -> bool:
        return self._session_open

    @property
    def camera_name(self) -> str:
        return self._camera_name

    # -- Lifecycle --

    def initialize(self) -> bool:
        if not self.available:
            return False
        err = _edsdk.EdsInitializeSDK()
        self._initialized = err == EDS_ERR_OK
        if not self._initialized:
            logger.error("EdsInitializeSDK failed: 0x%08X", err)
        return self._initialized

    def terminate(self):
        if self._session_open:
            self.close_session()
        if self._initialized and self.available:
            _edsdk.EdsTerminateSDK()
            self._initialized = False

    # -- Events --

    def process_events(self):
        if self._initialized:
            _edsdk.EdsGetEvent()

    # -- Camera discovery --

    def get_camera_list(self) -> List[EdsBaseRef]:
        if not self._initialized:
            return []
        cam_list = EdsCameraListRef()
        err = _edsdk.EdsGetCameraList(ctypes.byref(cam_list))
        if err != EDS_ERR_OK or not cam_list:
            return []
        count = EdsUInt32(0)
        err = _edsdk.EdsGetChildCount(cam_list, ctypes.byref(count))
        refs: List[EdsBaseRef] = []
        if err == EDS_ERR_OK:
            for i in range(count.value):
                cam = EdsBaseRef()
                if _edsdk.EdsGetChildAtIndex(
                    cam_list, EdsInt32(i), ctypes.byref(cam)
                ) == EDS_ERR_OK and cam:
                    refs.append(cam)
        _edsdk.EdsRelease(cam_list)
        return refs

    def open_first_camera(self) -> bool:
        refs = self.get_camera_list()
        if not refs:
            logger.warning("No Canon cameras found")
            return False

        cam = refs[0]

        # Read device info first
        info = EdsDeviceInfo()
        if _edsdk.EdsGetDeviceInfo(cam, ctypes.byref(info)) == EDS_ERR_OK:
            self._camera_name = info.szDeviceDescription.decode(
                "ascii", errors="replace"
            )
            logger.info("Camera: %s", self._camera_name)

        err = _edsdk.EdsOpenSession(cam)
        if err != EDS_ERR_OK:
            logger.error("EdsOpenSession failed: 0x%08X", err)
            _edsdk.EdsRelease(cam)
            return False

        self._camera_ref = cam
        self._session_open = True

        # Register event handlers
        _edsdk.EdsSetObjectEventHandler(cam, 0x00000200, _cb_object, None)
        _edsdk.EdsSetCameraStateEventHandler(cam, 0x00000300, _cb_state, None)
        _edsdk.EdsSetPropertyEventHandler(cam, 0x00000100, _cb_property, None)

        # Set SaveTo = Host so captured images come to PC
        save_to = EdsUInt32(kEdsSaveTo_Host)
        _edsdk.EdsSetPropertyData(
            cam, kEdsPropID_SaveTo, 0, ctypes.sizeof(save_to),
            ctypes.byref(save_to)
        )

        # Notify camera of host capacity
        _edsdk.EdsSendStatusCommand(cam, kEdsCameraStatusCommand_UILock, 0)
        capacity = EdsCapacity(0x7FFFFFFF, 0x1000, 1)
        _edsdk.EdsSetCapacity(cam, capacity)
        _edsdk.EdsSendStatusCommand(cam, kEdsCameraStatusCommand_UIUnLock, 0)

        logger.info("Camera session opened: %s", self._camera_name)
        return True

    def close_session(self):
        if self._camera_ref and self._session_open:
            self.stop_live_view()
            # Download any pending files
            self._drain_pending_downloads()
            _edsdk.EdsCloseSession(self._camera_ref)
            _edsdk.EdsRelease(self._camera_ref)
            self._camera_ref = None
            self._session_open = False
            logger.info("Camera session closed")

    # -- Properties --

    def get_property_size(
        self, prop_id: int, param: int = 0
    ) -> Tuple[int, int]:
        data_type = EdsDataType(0)
        size = EdsUInt32(0)
        err = _edsdk.EdsGetPropertySize(
            self._camera_ref, prop_id, param,
            ctypes.byref(data_type), ctypes.byref(size),
        )
        if err != EDS_ERR_OK:
            return (0, 0)
        return (data_type.value, size.value)

    def get_property_value(
        self, prop_id: int, param: int = 0
    ) -> Optional[int]:
        data_type, size = self.get_property_size(prop_id, param)
        if data_type == 0 or size == 0:
            return None

        if data_type == kEdsDataType_UInt32 and size >= 4:
            val = EdsUInt32(0)
            err = _edsdk.EdsGetPropertyData(
                self._camera_ref, prop_id, param, 4, ctypes.byref(val)
            )
            return val.value if err == EDS_ERR_OK else None
        elif data_type == kEdsDataType_Int32 and size >= 4:
            val = EdsInt32(0)
            err = _edsdk.EdsGetPropertyData(
                self._camera_ref, prop_id, param, 4, ctypes.byref(val)
            )
            return val.value if err == EDS_ERR_OK else None
        elif data_type == kEdsDataType_UInt16 and size >= 2:
            val = ctypes.c_uint16(0)
            err = _edsdk.EdsGetPropertyData(
                self._camera_ref, prop_id, param, 2, ctypes.byref(val)
            )
            return val.value if err == EDS_ERR_OK else None
        elif data_type == kEdsDataType_Int16 and size >= 2:
            val = ctypes.c_int16(0)
            err = _edsdk.EdsGetPropertyData(
                self._camera_ref, prop_id, param, 2, ctypes.byref(val)
            )
            return val.value if err == EDS_ERR_OK else None
        return None

    def set_property_value(
        self, prop_id: int, value: int, param: int = 0
    ) -> bool:
        if not self._session_open:
            return False
        data = EdsUInt32(value & 0xFFFFFFFF)
        err = _edsdk.EdsSetPropertyData(
            self._camera_ref, prop_id, param, ctypes.sizeof(data),
            ctypes.byref(data)
        )
        if err != EDS_ERR_OK:
            logger.debug(
                "SetPropertyData(0x%X, %d) failed: 0x%08X",
                prop_id, value, err,
            )
            return False
        return True

    def get_available_values(self, prop_id: int) -> List[int]:
        """Get list of settable values via EdsGetPropertyDesc."""
        if not self._session_open:
            return []
        desc = EdsPropertyDesc()
        err = _edsdk.EdsGetPropertyDesc(
            self._camera_ref, prop_id, ctypes.byref(desc)
        )
        if err != EDS_ERR_OK:
            return []
        n = max(0, min(desc.numElements, 128))
        return [desc.propDesc[i] for i in range(n)]

    # -- Picture Style description (contrast / saturation / etc.) --

    def get_picture_style_desc(self) -> Optional[EdsPictureStyleDesc]:
        if not self._session_open:
            return None
        desc = EdsPictureStyleDesc()
        err = _edsdk.EdsGetPropertyData(
            self._camera_ref, kEdsPropID_PictureStyleDesc, 0,
            ctypes.sizeof(desc), ctypes.byref(desc),
        )
        if err != EDS_ERR_OK:
            return None
        return desc

    def get_picture_style_param(self, field: str) -> Optional[int]:
        desc = self.get_picture_style_desc()
        if desc is None:
            return None
        return getattr(desc, field, None)

    def set_picture_style_param(self, field: str, value: int) -> bool:
        """Set one field of PictureStyleDesc (contrast/saturation/etc.)."""
        desc = self.get_picture_style_desc()
        if desc is None:
            return False
        if not hasattr(desc, field):
            return False
        setattr(desc, field, value)
        err = _edsdk.EdsSetPropertyData(
            self._camera_ref, kEdsPropID_PictureStyleDesc, 0,
            ctypes.sizeof(desc), ctypes.byref(desc),
        )
        if err != EDS_ERR_OK:
            logger.debug("SetPictureStyleDesc.%s failed: 0x%08X", field, err)
            return False
        return True

    # -- Live View (EVF) --

    def start_live_view(self) -> bool:
        """Start live view per official sample: set Evf_Mode=1, OR PC bit."""
        if not self._session_open:
            return False

        # Step 1: enable EVF mode
        evf_mode = EdsUInt32(1)
        err = _edsdk.EdsSetPropertyData(
            self._camera_ref, kEdsPropID_Evf_Mode, 0,
            ctypes.sizeof(evf_mode), ctypes.byref(evf_mode),
        )
        if err != EDS_ERR_OK:
            logger.debug("Set Evf_Mode failed: 0x%08X", err)

        # Step 2: OR PC output bit
        for attempt in range(3):
            current = EdsUInt32(0)
            _edsdk.EdsGetPropertyData(
                self._camera_ref, kEdsPropID_Evf_OutputDevice, 0,
                ctypes.sizeof(current), ctypes.byref(current),
            )
            device = EdsUInt32(current.value | kEdsEvfOutputDevice_PC)
            err = _edsdk.EdsSetPropertyData(
                self._camera_ref, kEdsPropID_Evf_OutputDevice, 0,
                ctypes.sizeof(device), ctypes.byref(device),
            )
            if err == EDS_ERR_OK:
                self._live_view_started = True
                logger.info("Live view started")
                return True
            if err == EDS_ERR_DEVICE_BUSY:
                import time
                time.sleep(0.1)
                continue
            logger.error("Start live view failed: 0x%08X", err)
            return False
        return False

    def stop_live_view(self):
        if not self._session_open or not self._live_view_started:
            return
        current = EdsUInt32(0)
        _edsdk.EdsGetPropertyData(
            self._camera_ref, kEdsPropID_Evf_OutputDevice, 0,
            ctypes.sizeof(current), ctypes.byref(current),
        )
        device = EdsUInt32(current.value & ~kEdsEvfOutputDevice_PC)
        _edsdk.EdsSetPropertyData(
            self._camera_ref, kEdsPropID_Evf_OutputDevice, 0,
            ctypes.sizeof(device), ctypes.byref(device),
        )
        self._live_view_started = False
        logger.info("Live view stopped")

    def get_live_view_frame(self) -> Optional[bytes]:
        """Download one EVF JPEG frame.
        Flow: CreateMemoryStream → CreateEvfImageRef → DownloadEvfImage
              → GetPointer/GetLength → Release
        """
        if not self._session_open:
            return None

        stream = EdsStreamRef()
        err = _edsdk.EdsCreateMemoryStream(2 * 1024 * 1024, ctypes.byref(stream))
        if err != EDS_ERR_OK:
            logger.debug("CreateMemoryStream failed: 0x%08X", err)
            return None

        evf = EdsEvfImageRef()
        err = _edsdk.EdsCreateEvfImageRef(stream, ctypes.byref(evf))
        if err != EDS_ERR_OK:
            logger.debug("CreateEvfImageRef failed: 0x%08X", err)
            _edsdk.EdsRelease(stream)
            return None

        err = _edsdk.EdsDownloadEvfImage(self._camera_ref, evf)
        if err != EDS_ERR_OK:
            _edsdk.EdsRelease(evf)
            _edsdk.EdsRelease(stream)
            if err == EDS_ERR_OBJECT_NOTREADY:
                return None  # frame not ready yet — retry next tick
            logger.debug("DownloadEvfImage failed: 0x%08X", err)
            return None

        # JPEG data is in the memory stream
        data_ptr = ctypes.c_void_p()
        data_len = EdsUInt64(0)
        err1 = _edsdk.EdsGetPointer(stream, ctypes.byref(data_ptr))
        err2 = _edsdk.EdsGetLength(stream, ctypes.byref(data_len))

        jpeg: Optional[bytes] = None
        if err1 == EDS_ERR_OK and err2 == EDS_ERR_OK and data_ptr and data_len.value > 0:
            jpeg = ctypes.string_at(data_ptr, int(data_len.value))

        _edsdk.EdsRelease(evf)
        _edsdk.EdsRelease(stream)
        return jpeg

    # -- Capture --

    def take_picture(self) -> bool:
        """Take a picture using PressShutterButton (official sample flow)."""
        if not self._session_open:
            return False
        err = _edsdk.EdsSendCommand(
            self._camera_ref,
            kEdsCameraCommand_PressShutterButton,
            kEdsCameraCommand_ShutterButton_Completely,
        )
        if err != EDS_ERR_OK:
            logger.error("PressShutterButton(Completely) failed: 0x%08X", err)
            # Fallback: simple TakePicture
            err = _edsdk.EdsSendCommand(
                self._camera_ref, kEdsCameraCommand_TakePicture, 0
            )
            if err != EDS_ERR_OK:
                logger.error("TakePicture failed: 0x%08X", err)
                return False

        # Release shutter
        import time
        time.sleep(0.05)
        _edsdk.EdsSendCommand(
            self._camera_ref,
            kEdsCameraCommand_PressShutterButton,
            kEdsCameraCommand_ShutterButton_OFF,
        )
        return True

    def auto_focus(self) -> bool:
        """Trigger AF via DoEvfAf."""
        if not self._session_open:
            return False
        err = _edsdk.EdsSendCommand(
            self._camera_ref,
            kEdsCameraCommand_DoEvfAf,
            kEdsCameraCommand_EvfAf_ON,
        )
        if err != EDS_ERR_OK:
            logger.debug("DoEvfAf(ON) failed: 0x%08X", err)
            return False
        return True

    # -- Download pending files --

    def _drain_pending_downloads(self):
        """Download any directory items that arrived via object events."""
        while _pending_downloads:
            ref = _pending_downloads.pop(0)
            try:
                self._download_dir_item(ref)
            except Exception as e:
                logger.error("Download failed: %s", e)
            finally:
                _edsdk.EdsRelease(ref)

    def _download_dir_item(self, dir_item: EdsBaseRef) -> Optional[str]:
        info = EdsDirectoryItemInfo()
        err = _edsdk.EdsGetDirectoryItemInfo(
            dir_item, ctypes.byref(info)
        )
        if err != EDS_ERR_OK:
            return None
        if info.isFolder:
            return None

        fname = info.szFileName.decode("ascii", errors="replace")
        save_dir = self._save_dir or "."
        path = os.path.join(save_dir, fname)

        stream = EdsStreamRef()
        err = _edsdk.EdsCreateFileStream(
            path.encode("utf-8"),
            kEdsFileCreateDisposition_CreateAlways,
            kEdsAccess_Write,
            ctypes.byref(stream),
        )
        if err != EDS_ERR_OK:
            logger.error("CreateFileStream failed: 0x%08X", err)
            return None

        # Optional progress callback
        _edsdk.EdsSetProgressCallback(
            stream, _cb_progress, 1, None  # kEdsProgressOption_Done = 1
        )

        err = _edsdk.EdsDownload(dir_item, info.size, stream)
        if err != EDS_ERR_OK:
            logger.error("EdsDownload failed: 0x%08X", err)
            _edsdk.EdsRelease(stream)
            return None

        _edsdk.EdsDownloadComplete(dir_item)
        _edsdk.EdsRelease(stream)
        logger.info("Downloaded: %s", path)
        return path

    _save_dir: str = ""

    # Process pending downloads periodically
    def poll_downloads(self) -> List[str]:
        paths = []
        while _pending_downloads:
            ref = _pending_downloads.pop(0)
            try:
                p = self._download_dir_item(ref)
                if p:
                    paths.append(p)
            except Exception as e:
                logger.error("Download error: %s", e)
            finally:
                if ref:
                    _edsdk.EdsRelease(ref)
        return paths


def _on_progress(percent: int, ctx, cancel) -> EdsError:
    return EDS_ERR_OK


_cb_progress = PROGRESS_CALLBACK(_on_progress)


# ---------------------------------------------------------------------------
# Value name tables (for human-readable display)
# ---------------------------------------------------------------------------

# ISO: value is typically the ISO number itself, or a Canon-specific code.
# EdsGetPropertyDesc returns the actual available codes from the camera.
# Map known codes; unknown codes display as raw value.
ISO_VALUES = {
    0x00000000: "Auto",
    0x00000064: "100",
    0x000000C8: "200",
    0x00000190: "400",
    0x00000320: "800",
    0x00000640: "1600",
    0x00000C80: "3200",
    0x00001900: "6400",
    0x00003200: "12800",
    0x00006400: "25600",
    0x0000C800: "51200",
    # Alternate encodings used by some bodies
    0x00000050: "50",
    0x00000078: "125",
    0x000000A0: "160",
    0x000000DC: "250",
    0x00000104: "320",
    0x0000012C: "500",
    0x00000168: "640",
    0x000001F4: "1000",
    0x00000258: "1250",
    0x000003E8: "2000",
    0x000004B0: "2500",
    0x000007D0: "4000",
    0x00000BB8: "5000",
    0x00000FA0: "6400",
    0x00001388: "8000",
    0x00001B58: "10000",
    0x00001F40: "12800",
    0x00002710: "16000",
    0x000032C8: "20000",
    0x00003E80: "25600",
}

# Av (aperture) — value ≈ round(log2(fnum²) * 8) i.e. APEX * 8
# Common Canon codes:
AV_VALUES = {
    0x00: "Auto",
    0x08: "f/1.0",
    0x0B: "f/1.1",
    0x0C: "f/1.2",
    0x0D: "f/1.2",
    0x10: "f/1.4",
    0x13: "f/1.6",
    0x14: "f/1.8",
    0x15: "f/1.8",
    0x18: "f/2.0",
    0x1B: "f/2.2",
    0x1C: "f/2.5",
    0x20: "f/2.8",
    0x23: "f/3.2",
    0x24: "f/3.5",
    0x25: "f/3.5",
    0x28: "f/4.0",
    0x2B: "f/4.5",
    0x2C: "f/4.5",
    0x2D: "f/5.0",
    0x30: "f/5.6",
    0x33: "f/6.3",
    0x34: "f/6.3",
    0x35: "f/7.1",
    0x38: "f/8.0",
    0x3B: "f/9.0",
    0x3C: "f/9.5",
    0x40: "f/10",
    0x43: "f/11",
    0x44: "f/13",
    0x48: "f/14",
    0x4B: "f/16",
    0x4C: "f/18",
    0x50: "f/19",
    0x53: "f/20",
    0x54: "f/22",
    0x57: "f/25",
    0x58: "f/29",
    0x5B: "f/32",
    0x5C: "f/36",
    0x60: "f/38",
    0x63: "f/40",
}

# Tv (shutter speed) — APEX*8 encoding
TV_VALUES = {
    0x00: "Auto",
    0x0C: "Bulb",
    0x10: "30\"",
    0x13: "25\"",
    0x14: "20\"",
    0x15: "15\"",
    0x18: "13\"",
    0x19: "10\"",
    0x1C: "8\"",
    0x1D: "6\"",
    0x20: "5\"",
    0x21: "4\"",
    0x22: "3.2\"",
    0x23: "2.5\"",
    0x24: "2\"",
    0x25: "1.6\"",
    0x26: "1.3\"",
    0x27: "1\"",
    0x28: "0.8\"",
    0x29: "0.7\"",
    0x2A: "0.6\"",
    0x2B: "0.5\"",
    0x2C: "0.4\"",
    0x2D: "1/3",
    0x2E: "1/4",
    0x2F: "1/5",
    0x30: "1/6",
    0x31: "1/8",
    0x32: "1/10",
    0x33: "1/13",
    0x34: "1/15",
    0x35: "1/20",
    0x36: "1/25",
    0x37: "1/30",
    0x38: "1/40",
    0x39: "1/50",
    0x3A: "1/60",
    0x3B: "1/80",
    0x3C: "1/100",
    0x3D: "1/125",
    0x3E: "1/160",
    0x3F: "1/200",
    0x40: "1/250",
    0x41: "1/320",
    0x42: "1/400",
    0x43: "1/500",
    0x44: "1/640",
    0x45: "1/800",
    0x46: "1/1000",
    0x47: "1/1250",
    0x48: "1/1600",
    0x49: "1/2000",
    0x4A: "1/2500",
    0x4B: "1/3200",
    0x4C: "1/4000",
    0x4D: "1/5000",
    0x4E: "1/6400",
    0x4F: "1/8000",
}

WB_VALUES = {
    0: "Auto",
    1: "Daylight",
    2: "Cloudy",
    3: "Tungsten",
    4: "Fluorescent",
    5: "Flash",
    6: "White Paper",
    8: "Shade",
    9: "Color Temp",
    10: "Custom 1",
    11: "Custom 2",
    12: "Custom 3",
}

PS_VALUES = {
    0x0081: "Standard",
    0x0082: "Portrait",
    0x0083: "Landscape",
    0x0084: "Neutral",
    0x0085: "Faithful",
    0x0086: "Monochrome",
    0x0087: "Auto",
    0x0088: "Fine Detail",
    0x0021: "User Def. 1",
    0x0022: "User Def. 2",
    0x0023: "User Def. 3",
    0x0041: "PC 1",
    0x0042: "PC 2",
    0x0043: "PC 3",
}

EXPOSURE_COMP_VALUES = {
    # Canon ExposureCompensation: 0x0C = 0, steps of 1/3 EV
    # Positive = brighter. Range typically ±3 or ±5.
    # Common encoding: value = 0x0C + steps_of_1/3  (where 0x0C = 0 EV)
    # Some cameras use signed; display dynamically.
}


def get_property_options(
    edsdk: "EDSDKWrapper", prop_id: int, value_names: dict
) -> list:
    """Build [{name, value}] from EdsGetPropertyDesc + name table."""
    if not edsdk.session_open:
        return []
    available = edsdk.get_available_values(prop_id)
    options = []
    for val in available:
        name = value_names.get(val)
        if name is None:
            # Try as signed 32-bit for properties like ExposureComp
            sval = val if val < 0x80000000 else val - 0x100000000
            name = value_names.get(sval, f"0x{val & 0xFFFFFFFF:X}")
        options.append({"name": name, "value": val & 0xFFFFFFFF})
    return options


def get_psparam_options() -> list:
    """Picture style sub-parameters are typically -4..+4."""
    return [{"name": f"{i:+d}" if i else "0", "value": i}
            for i in range(-4, 5)]
