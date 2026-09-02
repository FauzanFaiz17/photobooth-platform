#include <cstring>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <iterator>
#include <list>
#include <map>
#include <memory>
#include <regex>
#include <string>
#include <vector>
#include <thread>
#include <sstream>
#include "EDSDK.h"
#include "EDSDKTypes.h"
#include "CameraModel.h"
#include "utility.h"
#include <iomanip>
#include <ctime>
#include <chrono>
#include <unordered_map>
#include <unordered_set>
namespace fs = std::filesystem;

static time_t timegm_safe(std::tm* tm) {
#if defined(_WIN32) || defined(_WIN64)
	return _mkgmtime(tm); // Windows
#else
	return timegm(tm);   // POSIX
#endif
}

EdsError CameraModel::UILock()
{
	EdsError err = EDS_ERR_OK;
	if (_lockCount == 0)
	{
		err = EdsSendStatusCommand(_camera, kEdsCameraStatusCommand_UILock, 1); // inParam = 0:TFT ON, 1:TFT OFF
	}
	if (err == EDS_ERR_OK)
	{
		//		std::cout << "Cam No." << _bodyID << ":" << _modelName << " UI locked" << std::endl;
		_lockCount += 1;
	}
	else
	{
		std::cout << "Cam No." << _bodyID << ":" << _modelName << " UI lock error !!" << std::endl;
	}
	return err;
}

EdsError CameraModel::UIUnLock()
{
	EdsError err = EDS_ERR_OK;
	if (_lockCount > 0)
	{
		err = EdsSendStatusCommand(_camera, kEdsCameraStatusCommand_UIUnLock, 0);
	}
	if (err == EDS_ERR_OK)
	{
		//		std::cout << "Cam No." << _bodyID << ":" << _modelName << " UI Unlocked" << std::endl;
		_lockCount -= 1;
	}
	else
	{
		std::cout << "Cam No." << _bodyID << ":" << _modelName << " UI Unlock error !!" << std::endl;
	}
	return err;
}

bool CameraModel::OpenSessionCommand()
{
	EdsError err = EDS_ERR_OK;
	bool locked = false;

	std::cout << "Cam No." << _bodyID << ":" << _modelName << " -> session openning" << std::endl;

	// enable property
	err = EdsSetPropertyData(_camera, 0x01000000, 0x51DD2696, sizeof(EdsUInt32), &PropID_UTCTime);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x00FA71F7, sizeof(EdsUInt32), &PropID_TimeZone);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x09780670, sizeof(EdsUInt32), &PropID_SummerTimeSetting);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x20DD3609, sizeof(EdsUInt32), &PropID_ManualWhiteBalanceData);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x14840DF1, sizeof(EdsUInt32), &PropID_TempStatus);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x00E13499, sizeof(EdsUInt32), &PropID_MirrorLockUpState);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x17AF25B1, sizeof(EdsUInt32), &PropID_FixedMovie);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x2A0C1274, sizeof(EdsUInt32), &PropID_MovieParam);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x3FB1718B, sizeof(EdsUInt32), &PropID_Aspect);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x517F095D, sizeof(EdsUInt32), &PropID_MirrorUpSetting);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x1C31565B, sizeof(EdsUInt32), &PropID_AutoPowerOffSetting);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x707571DF, sizeof(EdsUInt32), &PropID_FocusShiftSetting);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x44396197, sizeof(EdsUInt32), &PropID_MovieHFRSetting);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x5B960B1C, sizeof(EdsUInt32), &PropID_RegisterFocusEdge);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x5AB16AAC, sizeof(EdsUInt32), &PropID_DriveFocusToEdge);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x5F745B48, sizeof(EdsUInt32), &PropID_FocusPosition);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x1EDD16B6, sizeof(EdsUInt32), &PropID_StillMovieDivideSetting);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x4FB44E3C, sizeof(EdsUInt32), &PropID_CardExtension);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x5C6C20B2, sizeof(EdsUInt32), &PropID_MovieCardExtension);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x139E4D1D, sizeof(EdsUInt32), &PropID_StillCurrentMedia);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x00D50906, sizeof(EdsUInt32), &PropID_MovieCurrentMedia);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x7DE61188, sizeof(EdsUInt32), &PropID_ApertureLockSetting);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x2532744B, sizeof(EdsUInt32), &PropID_LensIsSetting);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x2472666C, sizeof(EdsUInt32), &PropID_ScreenDimmerTime);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x27B64F45, sizeof(EdsUInt32), &PropID_ScreenOffTime);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x18F75F17, sizeof(EdsUInt32), &PropID_ViewfinderOffTime);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x653048A9, sizeof(EdsUInt32), &PropID_Evf_ClickWBCoeffs);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x05B3740D, sizeof(EdsUInt32), &PropID_Evf_RollingPitching);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x4D2879F3, sizeof(EdsUInt32), &PropID_Evf_VisibleRect);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x7CBD2BB7, sizeof(EdsUInt32), &PropID_Evf_ViewType);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x54D820D3, sizeof(EdsUInt32), &PropID_MovieRecVolume_IntMic);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x20DD3087, sizeof(EdsUInt32), &PropID_MovieRecVolume_ExtMic);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x703F0EAA, sizeof(EdsUInt32), &PropID_MovieRecVolume_Acc);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x57E66AD7, sizeof(EdsUInt32), &PropID_MovieParamEx);
	err = EdsSetPropertyData(_camera, 0x01000000, 0x2FEF13CD, sizeof(EdsUInt32), &PropID_SlowFastMode);

	// The communication with the camera begins
	err = EdsOpenSession(_camera);

	// for powershot
	// err = EdsSendCommand(_camera, kEdsCameraCommand_SetRemoteShootingMode, kDcRemoteShootingModeStart);

	if (err == EDS_ERR_OK)
	{
		err = EdsSetPropertyData(_camera, kEdsPropID_SaveTo, 0, sizeof(_saveTo), &_saveTo);
	}

	// UI lock
	UILock();

	if (err == EDS_ERR_OK)
	{
		locked = true;
	}

	if (err == EDS_ERR_OK)
	{
		EdsCapacity capacity = { 0x7FFFFFFF, 0x1000, 1 };
		err = EdsSetCapacity(_camera, capacity);
	}

	// It releases it when locked
	UIUnLock();

	// Notification of error
	if (err != EDS_ERR_OK)
	{
		// It retries it at device busy
		if (err == EDS_ERR_DEVICE_BUSY)
		{
			std::cout << "Error Cam No." << _bodyID << ":" << _modelName << "DeviceBusy" << std::endl;
		}
		std::cout << "Error Cam No." << _bodyID << ":" << _modelName << std::endl;
	}
	return true;
}

bool CameraModel::CloseSessionCommand()
{
	EdsError err = EDS_ERR_OK;

	std::cout << "session closing" << std::endl;
	// The communication with the camera is ended
	err = EdsCloseSession(_camera);
	// Notification of error
	if (err != EDS_ERR_OK)
	{
		// It retries it at device busy
		if (err == EDS_ERR_DEVICE_BUSY)
		{
			std::cout << "Error Cam No." << _bodyID << ":" << _modelName << "DeviceBusy" << std::endl;
		}
		std::cout << "Error Cam No." << _bodyID << ":" << _modelName << std::endl;
	}
	return true;
}

EdsError CameraModel::TakePicture(EdsShutterButton shuttertype)
{
	EdsError err = EDS_ERR_OK;
	std::cout << "shooting cam" << _bodyID << std::endl;
	err = PressShutter(shuttertype);
	if (err != EDS_ERR_OK)
	{
		PressShutter(kEdsCameraCommand_ShutterButton_OFF);
		err = EDS_ERR_INTERNAL_ERROR;
	}
	else
	{
		err = PressShutter(kEdsCameraCommand_ShutterButton_OFF);
	}
	return err;
}

EdsError CameraModel::PressShutter(EdsUInt32 _status)
{
	EdsError err = EDS_ERR_OK;
	err = EdsSendCommand(_camera, kEdsCameraCommand_PressShutterButton, _status);
	// Notification of error
	if (err != EDS_ERR_OK)
	{
		// It retries it at device busy
		if (err == EDS_ERR_DEVICE_BUSY)
		{
			std::cout << "Error Cam No." << _bodyID << ":" << _modelName << "DeviceBusy" << std::endl;
		}
		std::cout << "Error Cam No." << _bodyID << ":" << _modelName << std::endl;
	}
	return err;
}

EdsError CameraModel::SendCommand(EdsUInt32 _command, EdsUInt32 _status)
{
	EdsError err = EDS_ERR_OK;
	err = EdsSendCommand(_camera, _command, _status);
	return err;
}

bool CameraModel::DoEvfAFCommand(EdsUInt32 _status)

{
	EdsError err = EDS_ERR_OK;
	// EvfAFON
	if (err == EDS_ERR_OK)
	{
		err = EdsSendCommand(_camera, kEdsCameraCommand_DoEvfAf, _status);
	}

	// Notification of error
	if (err != EDS_ERR_OK)
	{
		// It retries it at device busy
		if (err == EDS_ERR_DEVICE_BUSY)
		{
			std::cout << "Error Cam No." << _bodyID << ":" << _modelName << "DeviceBusy" << std::endl;
		}
		std::cout << "Error Cam No." << _bodyID << ":" << _modelName << std::endl;
	}

	return true;
}

EdsError CameraModel::GetPropertyvalue(EdsPropertyID propertyID)
{
	EdsError err = EDS_ERR_OK;
	EdsDataType dataType = EdsDataType::kEdsDataType_Unknown;
	EdsUInt32 dataSize = 0;
	err = EdsGetPropertySize(_camera,
		propertyID,
		0,
		&dataType,
		&dataSize);
	if (err != EDS_ERR_OK)
	{
		std::cout << "camera" << _bodyID << " : err " << std::hex << err << "\n" << std::endl;
		return err;
	}

	if (dataType == EdsDataType::kEdsDataType_UInt32 || dataType == EdsDataType::kEdsDataType_Int32)
	{
		EdsUInt32 data = 0;
		err = EdsGetPropertyData(_camera,
			propertyID,
			0,
			dataSize,
			&data);

		if (err == EDS_ERR_OK)
		{
			if (propertyID == kEdsPropID_SummerTimeSetting) 
			{
				std::string str(64, 0);
				if (data == 0) { str = "OFF"; } else { str = "ON"; };
				std::cout << "camera" << _bodyID << " : current Setting is " << str << "\n";
			}
			else 
			{
				std::cout << "camera" << _bodyID << " : current value is " << data ;
			}
		}
	}
	else if (dataType == EdsDataType::kEdsDataType_String)
	{
		EdsChar str[EDS_MAX_NAME] = {};
		err = EdsGetPropertyData(_camera,
			propertyID,
			0,
			dataSize,
			str);

		if (err == EDS_ERR_OK)
		{
			std::cout << "camera" << _bodyID << " : current value is " << str;
		}
	}
	else if (dataType == EdsDataType::kEdsDataType_ByteBlock)
	{
		if (propertyID == kEdsPropID_FocusShiftSetting)
		{
			EdsFocusShiftSet fssData;
			err = EdsGetPropertyData(_camera,
				propertyID,
				0,
				dataSize,
				&fssData);

			if (err == EDS_ERR_OK)
			{
				std::cout
					<< "Version : " << fssData.version << "\n"
					<< "FocusShiftFunction : " << fssData.focusShiftFunction << "\n"
					<< "ShootingNumber : " << fssData.shootingNumber << "\n"
					<< "StepWidth : " << fssData.stepWidth << "\n"
					<< "ExposureSmoothing : " << fssData.exposureSmoothing << std::endl;
				if (fssData.version >= 3)
				{
					std::cout
						<< "FocusStackingFunction : " << fssData.focusStackingFunction << "\n"
						<< "FocusStackingTrimming : " << fssData.focusStackingTrimming << "\n"
						<< "FlashInterval( Available only for supported models) : " << fssData.flashInterval << std::endl;
				}
			}
		}
		else if (propertyID == kEdsPropID_MovieFileNameReelNo || propertyID == kEdsPropID_MovieFileNameClipNo)
		{
			EdsMovieFileNoSet noset = { 0 };
			err = EdsGetPropertyData(_camera,
				propertyID,
				0,
				dataSize,
				&noset);

			if (err == EDS_ERR_OK)
			{
				std::cout << "camera" << _bodyID << " : current value is " << noset.number;
			}
		}
		else
		{
			// Generic byteblock fallback: read as buffer if needed
			std::vector<unsigned char> buf(dataSize);
			err = EdsGetPropertyData(_camera, propertyID, 0, dataSize, buf.data());
			if (err == EDS_ERR_OK)
			{
				std::cout << "camera" << _bodyID << " : current byteblock size=" << dataSize;
			}
		}
	}
	else if (dataType == EdsDataType::kEdsDataType_PictureStyleDesc)
	{
		EdsPictureStyleDesc psdData;
		err = EdsGetPropertyData(_camera,
			propertyID,
			0,
			dataSize,
			&psdData);

		if (err == EDS_ERR_OK)
		{
			std::cout
				<< "contrast       : " << psdData.contrast << "\n"
				<< "sharpness      : " << psdData.sharpness << "\n"
				<< "saturation     : " << psdData.saturation << "\n"
				<< "colorTone      : " << psdData.colorTone << "\n"
				<< "filterEffect   : " << psdData.filterEffect << "\n"
				<< "toningEffect   : " << psdData.toningEffect << "\n"
				<< "sharpFineness  : " << psdData.sharpFineness << "\n"
				<< "sharpThreshold : " << psdData.sharpThreshold << std::endl;
		}
	}
	else if (dataType == EdsDataType::kEdsDataType_Time)
	{
		EdsTime utcTime;
		err = EdsGetPropertyData(_camera,
			propertyID,
			0,
			dataSize,
			&utcTime);

		if (err == EDS_ERR_OK)
		{
			// Converts the acquired UTC time to local time using the camera's time zone/DST and displays it.
			EdsUInt32 cameraTimeZone = 0;
			EdsUInt32 summerSetting = 0;
			EdsError tzErr = EdsGetPropertyData(_camera, kEdsPropID_TimeZone, 0, sizeof(cameraTimeZone), &cameraTimeZone);
			EdsError stErr = EdsGetPropertyData(_camera, kEdsPropID_SummerTimeSetting, 0, sizeof(summerSetting), &summerSetting);
			if (tzErr != EDS_ERR_OK) cameraTimeZone = 0;
			if (stErr != EDS_ERR_OK) summerSetting = 0;

			// EdsTime(UTC) -> time_t (UTC)
			std::tm tmUtc = {};
			tmUtc.tm_year = utcTime.year - 1900;
			tmUtc.tm_mon = utcTime.month - 1;
			tmUtc.tm_mday = utcTime.day;
			tmUtc.tm_hour = utcTime.hour;
			tmUtc.tm_min = utcTime.minute;
			tmUtc.tm_sec = utcTime.second;

			time_t t_utc = timegm_safe(&tmUtc);
			if (t_utc == (time_t)-1) {
				// If conversion is not possible, fallback to raw UTC representation
				std::cout << "camera" << _bodyID << " : current value is " << EdsTime2StrTime(utcTime) << std::endl;
			}
			else
			{
				// The lower 16 bits are in minutes
				short timeDiffMinutes = static_cast<short>(cameraTimeZone & 0x0000ffff);
				int dstMinutes = (summerSetting == 0x01) ? 60 : 0;
				long long offsetSeconds = static_cast<long long>(timeDiffMinutes + dstMinutes) * 60LL;

				time_t t_local = static_cast<time_t>(static_cast<long long>(t_utc) + offsetSeconds);

				std::tm tmLocal{};
#if defined(_WIN32) || defined(_WIN64)
				if (gmtime_s(&tmLocal, &t_local) != 0) {
					std::cerr << "gmtime_s failed\n";
					std::cout << "camera" << _bodyID << " : current value is " << EdsTime2StrTime(utcTime) << std::endl;
				}
				else {
#else
				if (!gmtime_r(&t_local, &tmLocal)) {
					std::cerr << "gmtime_r failed\n";
					std::cout << "camera" << _bodyID << " : current value is " << EdsTime2StrTime(utcTime) << std::endl;
				}
				else {
#endif
					std::ostringstream oss;
					oss << std::setw(4) << std::setfill('0') << (tmLocal.tm_year + 1900) << '/'
						<< std::setw(2) << std::setfill('0') << (tmLocal.tm_mon + 1) << '/'
						<< std::setw(2) << std::setfill('0') << tmLocal.tm_mday << ' '
						<< std::setw(2) << std::setfill('0') << tmLocal.tm_hour << ':'
						<< std::setw(2) << std::setfill('0') << tmLocal.tm_min;
					std::cout << "camera" << _bodyID << " : current value is " << oss.str() << std::endl;
				} // gmtime_r/_s else
				} // t_utc valid else
			} // EdsGetPropertyData OK
		else
		{
			std::cout << "camera" << _bodyID << " : err " << std::hex << err << "\n" << std::endl;
		}
		}
	else
	{
		// Unsupported data type notification
		std::cout << "camera" << _bodyID << " : unsupported property data type." << std::endl;
	}

	// Common error display (only once at the end)
	if (err != EDS_ERR_OK)
	{
		std::cout << "camera" << _bodyID << " : err " << std::hex << err << "\n" << std::endl;
	}

	return err;
	}

std::string CameraModel::EdsTime2StrTime(EdsTime edsTime)
{
	std::ostringstream oss;
	oss << std::setw(4) << std::setfill('0') << edsTime.year << '/'
		<< std::setw(2) << std::setfill('0') << edsTime.month << '/'
		<< std::setw(2) << std::setfill('0') << edsTime.day << ' '
		<< std::setw(2) << std::setfill('0') << edsTime.hour << ':'
		<< std::setw(2) << std::setfill('0') << edsTime.minute << '\n';
	std::string strTime = oss.str();
	return strTime;
}


bool CameraModel::tryParseExact(const std::string & inputTime, std::tm & outputTime) {
	std::istringstream ss(inputTime);
	ss.imbue(std::locale::classic());
	ss >> std::get_time(&outputTime, "%Y/%m/%d %H:%M");
	return !ss.fail();
}


EdsError CameraModel::GetProperty(EdsPropertyID propertyID, std::map<EdsUInt32, const char*> table)
{
	EdsError err = EDS_ERR_OK;
	EdsDataType dataType = EdsDataType::kEdsDataType_Unknown;
	EdsUInt32 dataSize = 0;
	err = EdsGetPropertySize(_camera,
		propertyID,
		0,
		&dataType,
		&dataSize);
	if (err == EDS_ERR_OK)
	{
		if (dataType == EdsDataType::kEdsDataType_UInt32 || dataType == EdsDataType::kEdsDataType_Int32)
		{
			EdsUInt32 data = 0;

			// Acquisition of the property
			err = EdsGetPropertyData(_camera,
				propertyID,
				0,
				dataSize,
				&data);

			if (propertyID == kEdsPropID_TimeZone) {
				uint32_t key = data >> 16; // Extract the upper 16 bits
				auto it = table.find(key);
				if (it != table.end())
				{
					std::string timeZoneStr = it->second;
					std::cout << "camera" << _bodyID << " : current value is " << timeZoneStr << "\n"
						<< std::endl;
				}
			}
			else {
				std::map<EdsUInt32, const char*>::iterator itr = table.find(data);
				if (itr != table.end())
				{
					// Set String combo box
					std::cout << "camera" << _bodyID << " : current setting is ";
					std::cout << itr->second << "\n"
						<< std::endl;
					//					std::cout << "distance=" << std::distance(table.begin(), itr) << std::endl;
				}
			}
		}

		if (dataType == EdsDataType::kEdsDataType_ByteBlock)
		{
			EdsUInt64 data = 0;

			// Acquisition of the property
			err = EdsGetPropertyData(_camera,
				propertyID,
				0,
				dataSize,
				&data);

			std::map<EdsUInt32, const char*>::iterator itr = table.find(data);
			if (itr != table.end())
			{
				// Set String combo box
				std::cout << "camera" << _bodyID << " : current setting is ";
				std::cout << itr->second << "\n"
					<< std::endl;
			}
		}

		if (dataType == EdsDataType::kEdsDataType_String)
		{
			EdsChar str[EDS_MAX_NAME] = {};
			// Acquisition of the property
			err = EdsGetPropertyData(_camera,
				propertyID,
				0,
				dataSize,
				str);

			// Acquired property value is set
			if (err == EDS_ERR_OK)
			{
				std::cout << "camera" << _bodyID << " : current setting is ";
				std::cout << str << "\n"
					<< std::endl;
			}
		}
	}
	else
	{
		std::cout << "camera" << _bodyID << " : err " << std::hex << err << "\n"
			<< std::endl;
	}
	return err;
}

EdsError CameraModel::GetPropertyEx(EdsPropertyID propertyID, std::map<EdsUInt64, const char*> table)
{
	EdsError err = EDS_ERR_OK;
	EdsDataType dataType = EdsDataType::kEdsDataType_Unknown;
	EdsUInt32 dataSize = 0;
	err = EdsGetPropertySize(_camera,
		propertyID,
		0,
		&dataType,
		&dataSize);
	if (err == EDS_ERR_OK)
	{
		if (dataType == EdsDataType::kEdsDataType_ByteBlock)
		{
			EdsUInt64 data = 0;

			// Acquisition of the property
			err = EdsGetPropertyData(_camera,
				propertyID,
				0,
				dataSize,
				&data);

			std::map<EdsUInt64, const char*>::iterator itr = table.find(data);
			if (itr != table.end())
			{
				// Set String combo box
				std::cout << "camera" << _bodyID << " : current setting is ";
				std::cout << itr->second << "\n"
					<< std::endl;
			}
		}

	}
	else
	{
		std::cout << "camera" << _bodyID << " : err " << std::hex << err << "\n"
			<< std::endl;
	}
	return err;
}

EdsError CameraModel::GetPropertyDesc(EdsPropertyID propertyID, std::map<EdsUInt32, const char*> prop_table)
{
	EdsError err = EDS_ERR_OK;
	EdsPropertyDesc propertyDesc = { 0 };
	// Get property description
	err = EdsGetPropertyDesc(_camera, propertyID, &propertyDesc);
	if (err != EDS_ERR_OK) {
		std::cout << "camera" << _bodyID << " : err " << std::hex << err << std::dec << "\n" << std::endl;
		return err;
	}

	std::unordered_set<EdsUInt32> seen; // Check for duplicates of displayed keys
	std::cout << "camera" << _bodyID << "'s \t available settings are...";

	int displayIndex = -1; // Internal count (starting from 0). Displayed as +1.

	for (int propDescNum = 0; propDescNum < propertyDesc.numElements; ++propDescNum)
	{
		if (((displayIndex + 1) % 4) == 0) { // Make it look like every 4 columns are on a new line (matching the original layout)
			std::cout << std::endl;
		}

		EdsInt32 rawSigned = propertyDesc.propDesc[propDescNum];
		EdsUInt32 raw = static_cast<EdsUInt32>(rawSigned);

		// Key for display label search (TimeZone is the upper 16 bits)
		EdsUInt32 lookupKey = (propertyID == kEdsPropID_TimeZone) ? ((raw >> 16) & 0xFFFFu) : raw;

		// Skip duplicates (same as display side)
		if (seen.find(lookupKey) != seen.end()) continue;

		auto itr = prop_table.find(lookupKey);
		if (itr == prop_table.end()) {
			// If it's not in the prop_table, it won't be displayed (matching the original behavior)
			seen.insert(lookupKey);
			continue;
		}

		// Skip "unknown" indication
		if (itr->second && std::string(itr->second) == "unknown") {
			seen.insert(lookupKey);
			continue;
		}

		// Add this entry to the display list (increments an internal count)
		++displayIndex;
		int userNumber = displayIndex + 1; // The display starts from 1

		// Output (numbered 1-based)
		std::cout << std::dec << std::setw(4) << std::right << userNumber << ":";
		std::cout << std::setw(7) << std::right << itr->second << "      ";
		std::cout << std::left;

		seen.insert(lookupKey);
	}

	std::cout << "\n" << std::endl;
	return err;
}

EdsError CameraModel::GetPropertyDescEx(EdsPropertyID propertyID, std::map<EdsUInt64, const char*> prop_table)
{
	EdsError err = EDS_ERR_OK;
	EdsPropertyDescEx propertyDesc = { 0 };
	std::vector<EdsInt32> duplicate_check;
	// Get property
	if (err == EDS_ERR_OK)
	{
		err = EdsGetPropertyDescEx(_camera,
			propertyID,
			&propertyDesc);
	}
	if (err == EDS_ERR_OK)
	{
		std::cout << "camera" << _bodyID << "'s \t available settings are...";
		for (int propDescNum = 0; propDescNum < propertyDesc.numElements; propDescNum++)
		{
			if ((propDescNum % 4) == 0)
			{
				std::cout << std::endl;
			}
			EdsInt32 key = propertyDesc.propDesc[propDescNum];
			auto insert = std::find(duplicate_check.begin(), duplicate_check.end(), key);
			if (insert == duplicate_check.end()) // check for dupulicate
			{
				duplicate_check.insert(insert, key);
				std::map<EdsUInt64, const char*>::iterator itr = prop_table.find(propertyDesc.propDesc[propDescNum]);
				if (itr != prop_table.end())
				{
					std::cout << std::setw(4) << std::right << std::distance(prop_table.begin(), itr) << ":";
					std::cout << std::setw(7) << std::right << itr->second << "      ";
					std::cout << std::left;
				}
			}
		}
		std::cout << "\n"
			<< std::endl;
	}
	return err;
}

EdsError CameraModel::SetPropertyValue(EdsPropertyID propertyID, std::string data)
{
	EdsError err = EDS_ERR_OK;
	EdsDataType dataType = EdsDataType::kEdsDataType_Unknown;
	EdsUInt32 dataSize = 0;
	err = EdsGetPropertySize(_camera,
		propertyID,
		0,
		&dataType,
		&dataSize);
	if (err == EDS_ERR_OK)
	{
		if (dataType == EdsDataType::kEdsDataType_UInt32 || dataType == EdsDataType::kEdsDataType_Int32)
		{
			// Acquisition of the property
			err = EdsSetPropertyData(_camera,
				propertyID,
				0,
				dataSize,
				&data);

			if (err == EDS_ERR_OK)
			{
				std::cout << "camera" << _bodyID << " : property changed "
					<< "\n"
					<< std::endl;
			}
			else
			{
				std::cout << "camera" << _bodyID << " : err " << std::hex << err << "\n"
					<< std::endl;
			}
		}

		if (dataType == EdsDataType::kEdsDataType_String)
		{
			EdsUInt32 size = (EdsUInt32)data.size();
			// std::cout << cstr << std::endl;
			// Acquisition of the property

			//In the case of kEdsPropID_StillFileName setting, null characters are not needed, so distinguish between the cases.
			if (propertyID == kEdsPropID_StillFileNameUserSet1 || propertyID == kEdsPropID_StillFileNameUserSet2
				|| propertyID == kEdsPropID_MovieFileNameIndex || propertyID == kEdsPropID_MovieFileNameUserDef
				|| propertyID == kEdsPropID_StillFolderName)
			{
				EdsChar* cstr = new char[size];
				data.copy(cstr, size);
				cstr[size] = '\0';
				err = EdsSetPropertyData(_camera,
					propertyID,
					0,
					size,
					cstr);
			}
			else
			{
				EdsChar* cstr = new char[size + 1];
				data.copy(cstr, size);
				cstr[size] = '\0';
				err = EdsSetPropertyData(_camera,
					propertyID,
					0,
					size + 1,
					cstr);
			}

			if (err == EDS_ERR_OK)
			{
				std::cout << "camera" << _bodyID << " : property changed "
					<< "\n"
					<< std::endl;
				;
			}
			else
			{
				std::cout << "camera" << _bodyID << " : err " << std::hex << err << "\n"
					<< std::endl;
			}
		}

		if (dataType == EdsDataType::kEdsDataType_Time)
		{
			// data is expected "yyyy/MM/dd HH:mm"
			std::tm tmInput{};
			if (!tryParseExact(data, tmInput)) {
				std::cerr << "Enter in the \"yyyy/MM/dd HH:mm\" format." << std::endl;
				return EDS_ERR_INVALID_PARAMETER; // Please choose appropriately
			}

			// 1) Get the camera's TimeZone and SummerTimeSetting
			EdsUInt32 cameraTimeZone = 0;
			EdsUInt32 summerSetting = 0;
			EdsError e1 = EdsGetPropertyData(_camera, kEdsPropID_TimeZone, 0, sizeof(cameraTimeZone), &cameraTimeZone);
			if (e1 != EDS_ERR_OK) {
				std::cerr << "Failed to get TimeZone property. err=" << std::hex << e1 << std::endl;
				// Use default 0 to continue
				cameraTimeZone = 0;
			}
			EdsError e2 = EdsGetPropertyData(_camera, kEdsPropID_SummerTimeSetting, 0, sizeof(summerSetting), &summerSetting);
			if (e2 != EDS_ERR_OK) {
				// Treat as 0 even if acquisition fails
				summerSetting = 0;
			}

			// 2) Scale user input tm and convert it to time_t
			//    Input is considered to be "camera local time" (assuming the user inputs it while looking at the display)
			//    Pass tm directly to convert it to time_t (UTC) using timegm_safe
			std::tm tmCopy = tmInput;
			time_t t_input_as_utc = timegm_safe(&tmCopy); // Temporarily convert input date and time to seconds

			// 3) Time zone difference (lower 16 bits are minutes)
			short timeDiffMinutes = static_cast<short>(cameraTimeZone & 0x0000ffff);

			// 4) 60 minutes if DST (summer time) is in effect
			int dstMinutes = (summerSetting == 0x01) ? 60 : 0;

			// 5) UTC = local - (timeDiffMinutes + dstMinutes)
			long long totalOffsetSeconds = static_cast<long long>(timeDiffMinutes + dstMinutes) * 60LL;
			time_t t_utc = static_cast<time_t>(static_cast<long long>(t_input_as_utc) - totalOffsetSeconds);

			// 6) Convert t_utc to gmtime and pack it into EdsTime
			std::tm tmUtc{};

#if defined(_WIN32) || defined(_WIN64)
			if (gmtime_s(&tmUtc, &t_utc) != 0) {
				std::cerr << "gmtime_s failed\n";
				// Time conversion failed, so the camera will not be set and the menu will be returned
				std::cout << "camera" << _bodyID << " : failed to convert time; operation cancelled.\n";
				return EDS_ERR_OK;
			}
#else
			if (gmtime_r(&t_utc, &tmUtc) == NULL) {
				std::cerr << "gmtime_r failed\n";
				// Time conversion failed, so do not set it on the camera and return to the menu
				std::cout << "camera" << _bodyID << " : failed to convert time; operation cancelled.\n";
				return EDS_ERR_OK;
			}
#endif
			EdsTime edsDateTime{};
			edsDateTime.year = tmUtc.tm_year + 1900;
			edsDateTime.month = tmUtc.tm_mon + 1;
			edsDateTime.day = tmUtc.tm_mday;
			edsDateTime.hour = tmUtc.tm_hour;
			edsDateTime.minute = tmUtc.tm_min;
			edsDateTime.second = tmUtc.tm_sec;
			edsDateTime.milliseconds = 0; // as needed

			// 7) Set on camera
			EdsError setErr = EdsSetPropertyData(_camera, kEdsPropID_UTCTime, 0, sizeof(EdsTime), &edsDateTime);
			if (setErr != EDS_ERR_OK) {
				std::cerr << "Enter in the \"yyyy/MM/dd HH:mm\" format." << std::endl;
			}
			else {
				std::cout << "camera" << _bodyID << " : time property set successfully.\n";
			}
		}
	}
	return err;
}

EdsError CameraModel::SetPropertyValue(EdsPropertyID propertyID, const EdsVoid * data)
{
	EdsError err = EDS_ERR_OK;
	EdsUInt32 dataSize = 0;
	EdsDataType dataType = EdsDataType::kEdsDataType_Unknown;

	err = EdsGetPropertySize(_camera,
		propertyID,
		0,
		&dataType,
		&dataSize);

	if (err == EDS_ERR_OK)
	{
		// Acquisition of the property
		err = EdsSetPropertyData(_camera,
			propertyID,
			0,
			dataSize,
			(EdsVoid*)data);

		if (err == EDS_ERR_OK)
		{
			std::cout << "camera" << _bodyID << " : property changed "
				<< "\n"
				<< std::endl;
		}
		else
		{
			std::cout << "camera" << _bodyID << " : err " << std::hex << err << "\n"
				<< std::endl;
		}
	}
	return err;
}

EdsError CameraModel::SetPropertyEx(EdsPropertyID propertyID, EdsInt32 data, std::map<EdsUInt64, const char*> prop_table)
{
	EdsError err = EDS_ERR_OK;
	EdsDataType dataType = EdsDataType::kEdsDataType_Unknown;
	EdsUInt32 dataSize = 0; // Set property

	EdsPropertyDescEx propertyDesc = { 0 };
	// Get property
	err = EdsGetPropertyDescEx(_camera,
		propertyID,
		&propertyDesc);

	EdsUInt64 input_prop;
	if (err == EDS_ERR_OK)
	{
		//auto iter = prop_table.begin();
		auto iter = prop_table.begin();
		std::advance(iter, (EdsUInt64)data); // Advance the iterator to the datath map
		input_prop = iter->first;
		bool exists = std::find(propertyDesc.propDesc, propertyDesc.propDesc + propertyDesc.numElements, input_prop) != propertyDesc.propDesc + propertyDesc.numElements;
		if (exists)
		{
			err = EdsGetPropertySize(_camera,
				propertyID,
				0,
				&dataType,
				&dataSize);
			if (err == EDS_ERR_OK)
			{
				err = EdsSetPropertyData(_camera,
					propertyID,
					0,
					dataSize,
					&input_prop);
			}
			// Notification of error
			if (err == EDS_ERR_OK)
			{
				std::cout << "camera" << _bodyID << " : property changed." << std::endl;
			}
			else
			{
				// It retries it at device busy
				if (err == EDS_ERR_DEVICE_BUSY)
				{
					std::cout << "DeviceBusy";
				}
				else
				{
					std::cout << "error invalid setting." << std::endl;
				}
			}
		}
		else
		{
			std::cout << "error invalid setting." << std::endl;
		}
	}

	return err;
}

EdsError CameraModel::SetProperty(EdsPropertyID propertyID, EdsInt32 data, std::map<EdsUInt32, const char*> prop_table)
{
	EdsError err = EDS_ERR_OK;
	// User input is expected to start with 1, so minimum value check
	if (data <= 0)
	{
		std::cout << "camera" << _bodyID << " : invalid input (" << data << "). Please enter a number from 1 to the displayed count." << std::endl;
		return EDS_ERR_INVALID_PARAMETER;
	}

	// Convert to internal zero-based index
	EdsInt32 targetIndexZero = data - 1;

	// Get property descriptions (to perform the same traversal as display)
	EdsPropertyDesc propertyDesc = { 0 };
	err = EdsGetPropertyDesc(_camera, propertyID, &propertyDesc);
	if (err != EDS_ERR_OK)
	{
		std::cout << "camera" << _bodyID << " : EdsGetPropertyDesc err " << std::hex << err << std::dec << std::endl;
		return err;
	}

	// Reproduce the same filter/deduplication logic as when displaying and find the targetIndexZero
	int displayCount = -1;
	EdsUInt32 selectedTableKey = 0;
	std::unordered_set<EdsUInt32> seen;

	for (int propDescNum = 0; propDescNum < propertyDesc.numElements; ++propDescNum)
	{
		EdsInt32 rawSigned = propertyDesc.propDesc[propDescNum];
		EdsUInt32 raw = static_cast<EdsUInt32>(rawSigned);

		EdsUInt32 lookupKey = (propertyID == kEdsPropID_TimeZone) ? ((raw >> 16) & 0xFFFFu) : raw;

		if (seen.find(lookupKey) != seen.end()) continue;

		auto itr = prop_table.find(lookupKey);
		if (itr == prop_table.end())
		{
			seen.insert(lookupKey);
			continue;
		}
		if (itr->second && std::string(itr->second) == "unknown")
		{
			seen.insert(lookupKey);
			continue;
		}

		++displayCount;

		if (displayCount == targetIndexZero)
		{
			selectedTableKey = itr->first;
			seen.insert(lookupKey);
			break;
		}

		seen.insert(lookupKey);
	}

	if (displayCount < targetIndexZero)
	{
		std::cout << "camera" << _bodyID << " : invalid selection (" << data << "). max displayed = " << (displayCount >= 0 ? displayCount + 1 : 0) << std::endl;
		return EDS_ERR_INVALID_PARAMETER;
	}

	// Find the raw value corresponding to the selectedTableKey from the propertyDesc (taking into account TimeZone packing)
	bool foundRaw = false;
	EdsUInt32 raw_to_set = 0;
	for (int i = 0; i < propertyDesc.numElements; ++i)
	{
		EdsInt32 rawSigned = propertyDesc.propDesc[i];
		EdsUInt32 raw = static_cast<EdsUInt32>(rawSigned);

		if (propertyID == kEdsPropID_TimeZone)
		{
			EdsUInt32 lookupKey = (raw >> 16) & 0xFFFFu;
			if (lookupKey == selectedTableKey)
			{
				raw_to_set = raw;
				foundRaw = true;
				break;
			}
		}
		else
		{
			if (raw == selectedTableKey)
			{
				raw_to_set = raw;
				foundRaw = true;
				break;
			}
		}
	}

	if (!foundRaw)
	{
		std::cout << "camera" << _bodyID << " : selected key 0x" << std::hex << selectedTableKey << " not present in propertyDesc for property 0x" << propertyID << std::dec << std::endl;
		return EDS_ERR_INVALID_PARAMETER;
	}

	// Take size and set
	EdsDataType dataType = EdsDataType::kEdsDataType_Unknown;
	EdsUInt32 dataSize = 0;
	err = EdsGetPropertySize(_camera, propertyID, 0, &dataType, &dataSize);
	if (err != EDS_ERR_OK)
	{
		std::cout << "camera" << _bodyID << " : EdsGetPropertySize err " << std::hex << err << std::dec << std::endl;
		return err;
	}

	err = EdsSetPropertyData(_camera, propertyID, 0, dataSize, &raw_to_set);
	if (err == EDS_ERR_OK)
	{
		std::cout << "camera" << _bodyID << " : property changed." << std::endl;
		setTv(raw_to_set);
	}
	else
	{
		if (err == EDS_ERR_DEVICE_BUSY)
		{
			std::cout << "camera" << _bodyID << " : DeviceBusy" << std::endl;
		}
		else
		{
			std::cout << "camera" << _bodyID << " : error setting property. err=" << std::hex << err << std::dec << std::endl;
		}
	}

	return err;
}

EdsError CameraModel::SetPropertyValue_NoSizeChk(EdsPropertyID propertyID, const EdsVoid * data)
{
	EdsError err = EDS_ERR_OK;
	uintptr_t Uint32_data = (uintptr_t)data;
	// Acquisition of the property
	err = EdsSetPropertyData(_camera,
		propertyID,
		0,
		sizeof(EdsUInt32),
		&Uint32_data);

	if (err == EDS_ERR_OK)
	{
		std::cout << "camera" << _bodyID << " : property changed "
			<< "\n"
			<< std::endl;
	}
	else
	{
		std::cout << "camera" << _bodyID << " : err " << std::hex << err << "\n"
			<< std::endl;
	}
	return err;
}



// ----------------------------
// Helper function (gets raw values ​​in the same order as the AV appears)
// - table: Map of (raw code -> description)
// - desc: Descriptor of the AV's propertyDesc
// - userIndex1Based: The number entered by the user in the UI (1-based)
// - outRaw: Stores the raw code if found
// ----------------------------
static bool AvIndexToRawKey(const std::map<EdsUInt32, const char*>& table,
	const EdsPropertyDesc& desc,
	int userIndex1Based,
	EdsUInt32* outRaw)
{
	if (userIndex1Based <= 0) return false;

	std::unordered_set<EdsUInt32> seen;
	int displayIdx = -1; // 0-based display order count

	for (int i = 0; i < desc.numElements; ++i)
	{
		EdsInt32 rawSigned = desc.propDesc[i];
		EdsUInt32 raw = static_cast<EdsUInt32>(rawSigned);
		EdsUInt32 key = raw;

		if (seen.find(key) != seen.end()) continue;

		auto it = table.find(key);
		if (it == table.end()) { seen.insert(key); continue; }
		if (it->second && std::string(it->second) == "unknown") {
			seen.insert(key);
			continue;
		}

		++displayIdx;
		if (displayIdx == userIndex1Based - 1)
		{
			*outRaw = key;
			return true;
		}

		seen.insert(key);
	}

	return false;
}

EdsError CameraModel::SetApertureLock(const EdsApertureLockSetting* data,
	std::map<EdsUInt32, const char*> prop_table)
{
	if (!data) return EDS_ERR_INVALID_PARAMETER;

	// ① If the lock status is anything other than 0/1, an error occurs.
	if (data->apertureLockStatus != 0 && data->apertureLockStatus != 1) {
		std::cout << "camera" << _bodyID << " : invalid lock status.\n";
		return EDS_ERR_INVALID_PARAMETER;
	}

	EdsApertureLockSetting apldata = { 0 };
	apldata.apertureLockStatus = data->apertureLockStatus;

	// ② Lock OFF → Send the current Av as is
	if (apldata.apertureLockStatus == 0) {
		EdsUInt32 curAv = 0;
		EdsError err = EdsGetPropertyData(_camera,
			kEdsPropID_Av,
			0,
			sizeof(EdsUInt32),
			&curAv);
		if (err != EDS_ERR_OK) return err;
		apldata.avValue = curAv;
	}
	// ③ Lock ON → Convert "index" received in UI to raw
	else {
		// Get propertyDesc of Av
		EdsPropertyDesc avDesc = { 0 };
		EdsError err = EdsGetPropertyDesc(_camera, kEdsPropID_Av, &avDesc);
		if (err != EDS_ERR_OK) return err;

		// data->avValue is the 0-based index passed by the UI.
		// Convert it to 1-based and pass it to the helper.
		EdsUInt32 raw = 0;
		bool ok = AvIndexToRawKey(prop_table,
			avDesc,
			static_cast<int>(data->avValue) + 1,
			&raw);
		if (!ok) {
			std::cout << "camera" << _bodyID << " : invalid aperture index.\n";
			return EDS_ERR_INVALID_PARAMETER;
		}
		apldata.avValue = raw;
	}

	// ④ Send settings to the camera
	EdsError err = EdsSetPropertyData(_camera,
		kEdsPropID_ApertureLockSetting,
		0,
		sizeof(EdsApertureLockSetting),
		&apldata);
	if (err == EDS_ERR_OK)
		std::cout << "camera" << _bodyID << " : property changed.\n";
	else
		std::cout << "camera" << _bodyID << " : err " << std::hex << err << std::dec << "\n";

	return err;
}

EdsError CameraModel::SetMovieFileName(EdsPropertyID propertyID, std::string data)
{
	EdsError err = EDS_ERR_OK;
	EdsUInt32 strsize = (EdsUInt32)data.size();
	EdsUInt32 datasize = sizeof(EdsMovieFileNoSet);
	EdsUInt32 intdata = 0;
	EdsMovieFileNoSet noset = { 0 };

	std::stringstream(data) >> intdata;
	std::stringstream ss;
	ss << std::hex;
	ss << intdata;
	std::string hexString = ss.str();
	noset.number = static_cast<EdsUInt16>(std::stoul(hexString, nullptr, 16));

	err = EdsSetPropertyData(_camera,
		propertyID,
		0,
		datasize,
		&noset);

	if (err == EDS_ERR_OK)
	{
		std::cout << "camera" << _bodyID << " : property changed "
			<< "\n"
			<< std::endl;
	}
	else
	{
		std::cout << "camera" << _bodyID << " : err " << std::hex << err << "\n"
			<< std::endl;
	}
	return err;

}


EdsError CameraModel::RecModeOn()
{
	EdsError err = EDS_ERR_OK;
	EdsUInt32 saveTo = kEdsSaveTo_Camera;
	err = EdsSetPropertyData(_camera, kEdsPropID_SaveTo, 0, sizeof(saveTo), &saveTo);
	// movieMode 0 : Disable , 1 : Enable
	EdsUInt32 movieMode;
	// Get movie mode.
	err = EdsGetPropertyData(_camera, kEdsPropID_FixedMovie, 0, sizeof(movieMode), &movieMode);
	if (movieMode == 0)
	{ // movieMode 0 : Disable , 1 : Enable
		// Set movie mode ON.
		err = EdsSendCommand(_camera, kEdsCameraCommand_MovieSelectSwON, 0);
	}
	// Notification of error
	if (err != EDS_ERR_OK)
	{
		// It doesn't retry it at device busy
		if (err == EDS_ERR_DEVICE_BUSY)
		{
			std::cout << "DeviceBusy" << std::endl;
		}
		return false;
	}
	return true;
}

EdsError CameraModel::RecModeOff()
{
	EdsError err = EDS_ERR_OK;
	// movieMode 0 : Disable , 1 : Enable
	EdsUInt32 movieMode;
	// Get movie mode.
	err = EdsGetPropertyData(_camera, kEdsPropID_FixedMovie, 0, sizeof(movieMode), &movieMode);
	if (movieMode == 1)
	{ // movieMode 0 : Disable , 1 : Enable
		// Set movie mode ON.
		err = EdsSendCommand(_camera, kEdsCameraCommand_MovieSelectSwOFF, 0);
	}
	// Notification of error
	if (err != EDS_ERR_OK)
	{
		// It doesn't retry it at device busy
		if (err == EDS_ERR_DEVICE_BUSY)
		{
			std::cout << "DeviceBusy" << std::endl;
		}
		return false;
	}
	return true;
}

EdsError CameraModel::RecStart()
{
	EdsError err = EDS_ERR_OK;
	EdsUInt32 saveto;

	saveto = kEdsSaveTo_Camera;

	// Set kEdsPropID_SaveTo property to kEdsSaveTo_Camera before changing Movie mode to ON
	err = EdsSetPropertyData(_camera, kEdsPropID_SaveTo, 0, sizeof(EdsUInt32), &saveto);
	EdsUInt32 record_start = 4; // Begin movie shooting
	err = EdsSetPropertyData(_camera, kEdsPropID_Record, 0, sizeof(record_start), &record_start);
	// Notification of error
	if (err != EDS_ERR_OK)
	{
		// It doesn't retry it at device busy
		if (err == EDS_ERR_DEVICE_BUSY)
		{
			std::cout << "DeviceBusy" << std::endl;
		}
		return false;
	}
	return true;
}

EdsError CameraModel::RecEnd()
{
	EdsError err = EDS_ERR_OK;
	EdsUInt32 saveto;

	saveto = kEdsSaveTo_Camera;

	EdsUInt32 record_stop = 0; // End movie shooting
	err = EdsSetPropertyData(_camera, kEdsPropID_Record, 0, sizeof(record_stop), &record_stop);
	// Notification of error
	if (err != EDS_ERR_OK)
	{
		// It doesn't retry it at device busy
		if (err == EDS_ERR_DEVICE_BUSY)
		{
			std::cout << "DeviceBusy" << std::endl;
		}
		return false;
	}
	return true;
}

EdsError CameraModel::StartEvfCommand()
{
	EdsError err = EDS_ERR_OK;
	/// Change settings because live view cannot be started
	/// when camera settings are set to do not perform live view.
	EdsUInt32 evfMode = 0;

	// Acquisition of the property
	err = EdsGetPropertyData(_camera,
		kEdsPropID_Evf_Mode,
		0,
		sizeof(evfMode),
		&evfMode);

	if (evfMode == 0)
	{
		evfMode = 1;

		// Set to the camera.
		err = EdsSetPropertyData(_camera, kEdsPropID_Evf_Mode, 0, sizeof(evfMode), &evfMode);
	}

	// Notification of error
	if (err != EDS_ERR_OK)
	{
		// It doesn't retry it at device busy
		if (err == EDS_ERR_DEVICE_BUSY)
		{
			std::cout << "DeviceBusy" << std::endl;
		}
		return false;
	}
	return true;
}

EdsError CameraModel::DownloadEvfCommand()
{

	EdsError err = EDS_ERR_OK;

	EdsEvfImageRef evfImage = NULL;
	EdsStreamRef stream = NULL;
	EdsUInt32 orgdevice = 0, device = 0;
	EdsUInt32 retry = 0;

	err = StartEvfCommand();

	err = EdsGetPropertyData(_camera, kEdsPropID_Evf_OutputDevice, 0, sizeof(orgdevice), &orgdevice);
	device = orgdevice;
	device |= kEdsEvfOutputDevice_PC;

	// Set to the Host.
	if (err == EDS_ERR_OK)
	{
		err = EdsSetPropertyData(_camera, kEdsPropID_Evf_OutputDevice, 0, sizeof(device), &device);
	}

	// Notification of error
	if (err != EDS_ERR_OK)
	{
		// It doesn't retry it at device busy
		if (err == EDS_ERR_DEVICE_BUSY)
		{
			std::cout << "DeviceBusy" << std::endl;
		}
		return false;
	}

	// create folder  ex) cam1
	EdsUInt32 camid;
	camid = (EdsUInt32)_bodyID;
	std::string directory_tree = "cam" + std::to_string(camid);
	if (fs::exists(directory_tree) == FALSE)
	{
		std::filesystem::create_directories(directory_tree);
	}

	std::string tmp;
	tmp = directory_tree + "/evf.jpg";
	char* filename = new char[tmp.size() + 1];
	strcpy(filename, tmp.c_str());

	// When creating to a file.
	err = EdsCreateFileStream(filename, kEdsFileCreateDisposition_CreateAlways, kEdsAccess_ReadWrite, &stream);

	// Create EvfImageRef.
	if (err == EDS_ERR_OK)
	{
		err = EdsCreateEvfImageRef(stream, &evfImage);
	}

	std::this_thread::sleep_for(1500ms);
	for (retry = 0; retry < 3; retry++)
	{
		// Download live view image data.
		if (err == EDS_ERR_OK)
		{
			std::this_thread::sleep_for(500ms);
			err = EdsDownloadEvfImage(_camera, evfImage);
		}

		// Get meta data for live view image data.
		if (err == EDS_ERR_OK)
		{
			_EVF_DATASET dataSet = { 0 };

			dataSet.stream = stream;

			// Get magnification ratio (x1, x5, or x10).
			EdsGetPropertyData(evfImage, kEdsPropID_Evf_Zoom, 0, sizeof(dataSet.zoom), &dataSet.zoom);

			// Get position of image data. (when enlarging)
			// Upper left coordinate using JPEG Large size as a reference.
			EdsGetPropertyData(evfImage, kEdsPropID_Evf_ImagePosition, 0, sizeof(dataSet.imagePosition), &dataSet.imagePosition);

			// Get histogram (RGBY).
			EdsGetPropertyData(evfImage, kEdsPropID_Evf_Histogram, 0, sizeof(dataSet.histogram), dataSet.histogram);

			// Get rectangle of the focus border.
			EdsGetPropertyData(evfImage, kEdsPropID_Evf_ZoomRect, 0, sizeof(dataSet.zoomRect), &dataSet.zoomRect);

			// Get the size as a reference of the coordinates of rectangle of the focus border.
			EdsGetPropertyData(evfImage, kEdsPropID_Evf_CoordinateSystem, 0, sizeof(dataSet.sizeJpegLarge), &dataSet.sizeJpegLarge);

			/*
						// Live view image transfer complete notification.
						if (err == EDS_ERR_OK)
						{
							CameraEvent e("EvfDataChanged", &dataSet);
							_model->notifyObservers(&e);
						}
			*/
		}
		// Notification of error
		if (err != EDS_ERR_OK)
		{
			// Retry getting image data if EDS_ERR_OBJECT_NOTREADY is returned
			// when the image data is not ready yet.
			if (err == EDS_ERR_OBJECT_NOTREADY)
			{
				std::cout << "Object not ready" << std::endl;
				std::this_thread::sleep_for(500ms);
				continue;
			}
			// It doesn't retry it at device busy
			if (err == EDS_ERR_DEVICE_BUSY)
			{
				std::cout << "DeviceBusy" << std::endl;
				break;
			}
		}
		else
		{
			break;
		}
	}

	if (stream != NULL)
	{
		EdsRelease(stream);
		stream = NULL;
	}

	if (evfImage != NULL)
	{
		EdsRelease(evfImage);
		evfImage = NULL;
	}

	// Restore the previous setting .
	device = orgdevice;
	EdsSetPropertyData(_camera, kEdsPropID_Evf_OutputDevice, 0, sizeof(device), &device);

	EndEvfCommand();

	return true;
}

EdsError CameraModel::EndEvfCommand()
{
	EdsError err = EDS_ERR_OK;

	// Get the current output device.
	EdsUInt32 device = 0;
	err = EdsGetPropertyData(_camera, kEdsPropID_Evf_OutputDevice, 0, sizeof(device), &device);

	// Do nothing if the remote live view has already ended.
	if ((device & kEdsEvfOutputDevice_PC) == 0)
	{
		return true;
	}

	// Get depth of field status.
	EdsUInt32 depthOfFieldPreview = 0;
	err = EdsGetPropertyData(_camera, kEdsPropID_Evf_DepthOfFieldPreview, 0, sizeof(depthOfFieldPreview), &depthOfFieldPreview);

	// Release depth of field in case of depth of field status.
	if (depthOfFieldPreview != 0)
	{
		depthOfFieldPreview = 0;
		err = EdsSetPropertyData(_camera, kEdsPropID_Evf_DepthOfFieldPreview, 0, sizeof(depthOfFieldPreview), &depthOfFieldPreview);

		// Standby because commands are not accepted for awhile when the depth of field has been released.
		if (err == EDS_ERR_OK)
		{
			std::this_thread::sleep_for(500ms);
		}
	}

	// Change the output device.
	if (err == EDS_ERR_OK)
	{
		device &= ~kEdsEvfOutputDevice_PC;
		err = EdsSetPropertyData(_camera, kEdsPropID_Evf_OutputDevice, 0, sizeof(device), &device);
	}

	// Notification of error
	if (err != EDS_ERR_OK)
	{
		// It retries it at device busy
		if (err == EDS_ERR_DEVICE_BUSY)
		{
			std::cout << "Error Cam No." << _bodyID << ":" << _modelName << "DeviceBusy" << std::endl;
		}
		std::cout << "Error Cam No." << _bodyID << ":" << _modelName << std::endl;
	}

	EdsUInt32 evfMode = 0;
	err = EdsGetPropertyData(_camera,
		kEdsPropID_Evf_Mode,
		0,
		sizeof(evfMode),
		&evfMode);

	if (evfMode == 1)
	{
		evfMode = 0;

		// Set to the camera.
		err = EdsSetPropertyData(_camera, kEdsPropID_Evf_Mode, 0, sizeof(evfMode), &evfMode);
	}

	// Notification of error
	if (err != EDS_ERR_OK)
	{
		// It doesn't retry it at device busy
		if (err == EDS_ERR_DEVICE_BUSY)
		{
			std::cout << "DeviceBusy" << std::endl;
		}
		return false;
	}
	return true;
}

EdsUInt32 CameraModel::GetVolume()
{
	EdsUInt32 slot_count = 0, volume_count = 0;
	EdsBaseRef volumes[2] = {};
	EdsError err = EDS_ERR_OK;
	EdsVolumeInfo outVolumeInfo;
	err = EdsGetChildCount(_camera, &slot_count);
	if (slot_count > 0)
	{
		for (EdsUInt32 j = 0; j < slot_count; j++)
		{
			err = EdsGetChildAtIndex(_camera, j, &volumes[j]);
			err = EdsGetVolumeInfo(volumes[j], &outVolumeInfo);
			if (outVolumeInfo.storageType != kEdsStorageType_Non)
			{
				std::cout << "slot " << j + 1 << " " << outVolumeInfo.szVolumeLabel << " card" << std::endl;
				volume_count++;
			}
			else
			{
				std::cout << "slot " << j + 1 << " is empty" << std::endl;
			}
		}
	}
	return volume_count;
}

EdsError CameraModel::FormatVolume(EdsUInt32 volume_number)
{
	EdsUInt32 volume_count;
	EdsBaseRef volume;
	EdsError err = EDS_ERR_OK;
	UILock();
	err = EdsGetChildCount(_camera, &volume_count);

	if (volume_number <= volume_count)
	{
		err = EdsGetChildAtIndex(_camera, volume_number - 1, &volume);
		err = EdsFormatVolume(volume);
		UIUnLock();
		if (err == EDS_ERR_OK)
		{
			std::cout << "Format Card " << volume_number << " : succeeded" << std::endl;
		}
		else
		{
			std::cout << "Format Card " << volume_number << " : failed" << std::endl;
		}
	}
	else
	{
		std::cout << "failed number" << std::endl;
	}
	return err;
}


EdsError CameraModel::CreateFolder()
{
	EdsError err = EDS_ERR_OK;
	UILock();
	err = EdsCreateFolder(_camera);

	UIUnLock();
	if (err == EDS_ERR_OK)
	{
		std::cout << "Create Folder : succeeded" << std::endl;
	}
	else
	{
		std::cout << "Create Folder : failed" << std::endl;
	}

	return err;
}


EdsError CameraModel::SetCapacity(EdsCapacity _capacity)
{
	// It is a function only of the model since 30D.
	EdsError err = EDS_ERR_OK;

	// Acquisition of the number of sheets that can be taken a picture
	err = EdsSetCapacity(_camera, _capacity);

	// Notification of error
	if (err != EDS_ERR_OK)
	{
		std::cout << "failed" << std::endl;
	}

	return err;
}

EdsError CameraModel::ZoomToTele()
{
	EdsError err = EDS_ERR_OK;
	err = EdsSendCommand(_camera, kEdsCameraCommand_DrivePowerZoom, kEdsDrivePowerZoom_LimitOff_Tele);
	// Notification of error
	if (err != EDS_ERR_OK)
	{
		// It retries it at device busy
		if (err == EDS_ERR_DEVICE_BUSY)
		{
			std::cout << "Error Cam No." << _bodyID << ":" << _modelName << "DeviceBusy" << std::endl;
		}
		std::cout << "Error Cam No." << _bodyID << ":" << _modelName << std::endl;
	}
	return err;
}

EdsError CameraModel::ZoomToWide()
{
	EdsError err = EDS_ERR_OK;
	err = EdsSendCommand(_camera, kEdsCameraCommand_DrivePowerZoom, kEdsDrivePowerZoom_LimitOff_Wide);
	// Notification of error
	if (err != EDS_ERR_OK)
	{
		// It retries it at device busy
		if (err == EDS_ERR_DEVICE_BUSY)
		{
			std::cout << "Error Cam No." << _bodyID << ":" << _modelName << "DeviceBusy" << std::endl;
		}
		std::cout << "Error Cam No." << _bodyID << ":" << _modelName << std::endl;
	}
	return err;
}

EdsError CameraModel::ZoomStop()
{
	EdsError err = EDS_ERR_OK;
	err = EdsSendCommand(_camera, kEdsCameraCommand_DrivePowerZoom, kEdsDrivePowerZoom_Stop);
	// Notification of error
	if (err != EDS_ERR_OK)
	{
		// It retries it at device busy
		if (err == EDS_ERR_DEVICE_BUSY)
		{
			std::cout << "Error Cam No." << _bodyID << ":" << _modelName << "DeviceBusy" << std::endl;
		}
		std::cout << "Error Cam No." << _bodyID << ":" << _modelName << std::endl;
	}
	return err;
}

EdsError CameraModel::GetZoomPosition()
{
	EdsError err = EDS_ERR_OK;

	EdsEvfImageRef evfImage = NULL;
	EdsStreamRef stream = NULL;
	EdsUInt32 orgdevice = 0, device = 0, data;
	EdsUInt32 retry = 0;

	err = StartEvfCommand();

	err = EdsGetPropertyData(_camera, kEdsPropID_Evf_OutputDevice, 0, sizeof(orgdevice), &orgdevice);
	device = orgdevice;
	device |= kEdsEvfOutputDevice_PC;

	// Set to the Host.
	if (err == EDS_ERR_OK)
	{
		err = EdsSetPropertyData(_camera, kEdsPropID_Evf_OutputDevice, 0, sizeof(device), &device);
	}

	// Notification of error
	if (err != EDS_ERR_OK)
	{
		// It doesn't retry it at device busy
		if (err == EDS_ERR_DEVICE_BUSY)
		{
			std::cout << "DeviceBusy" << std::endl;
		}
		return false;
	}

	// create folder  ex) cam1
	EdsUInt32 camid;
	camid = (EdsUInt32)_bodyID;
	std::string directory_tree = "cam" + std::to_string(camid);
	if (fs::exists(directory_tree) == FALSE)
	{
		std::filesystem::create_directories(directory_tree);
	}

	std::string tmp;
	tmp = directory_tree + "/evf.jpg";
	char* filename = new char[tmp.size() + 1];
	strcpy(filename, tmp.c_str());

	// When creating to a file.
	err = EdsCreateFileStream(filename, kEdsFileCreateDisposition_CreateAlways, kEdsAccess_ReadWrite, &stream);

	// Create EvfImageRef.
	if (err == EDS_ERR_OK)
	{
		err = EdsCreateEvfImageRef(stream, &evfImage);
	}

	std::this_thread::sleep_for(1500ms);
	for (retry = 0; retry < 3; retry++)
	{
		// Download live view image data.
		if (err == EDS_ERR_OK)
		{
			std::this_thread::sleep_for(500ms);
			err = EdsDownloadEvfImage(_camera, evfImage);
		}

		// Get meta data for live view image data.
		if (err == EDS_ERR_OK)
		{
			err = EdsGetPropertyData(evfImage, kEdsPropID_Evf_PowerZoom_CurPosition, 0, sizeof(data), &data);

		}
		if (err == EDS_ERR_OK)
		{
			std::cout << "camera" << _bodyID << " : Current Position is " << data << "\n";
		}
		else
		{
			return err;
		}

		if (err == EDS_ERR_OK)
		{
			err = EdsGetPropertyData(evfImage, kEdsPropID_Evf_PowerZoom_MaxPosition, 0, sizeof(data), &data);

		}
		if (err == EDS_ERR_OK)
		{
			std::cout << "camera" << _bodyID << " : Max Positio is " << data << "\n";
		}
		else
		{
			return err;
		}

		if (err == EDS_ERR_OK)
		{
			err = EdsGetPropertyData(evfImage, kEdsPropID_Evf_PowerZoom_MinPosition, 0, sizeof(data), &data);

		}
		if (err == EDS_ERR_OK)
		{
			std::cout << "camera" << _bodyID << " : Min Positio is " << data << "\n";
		}
		else
		{
			return err;
		}

		// Notification of error
		if (err != EDS_ERR_OK)
		{
			// Retry getting image data if EDS_ERR_OBJECT_NOTREADY is returned
			// when the image data is not ready yet.
			if (err == EDS_ERR_OBJECT_NOTREADY)
			{
				std::cout << "Object not ready" << std::endl;
				std::this_thread::sleep_for(500ms);
				continue;
			}
			// It doesn't retry it at device busy
			if (err == EDS_ERR_DEVICE_BUSY)
			{
				std::cout << "DeviceBusy" << std::endl;
				break;
			}
		}
		else
		{
			break;
		}
	}

	if (stream != NULL)
	{
		EdsRelease(stream);
		stream = NULL;
	}

	if (evfImage != NULL)
	{
		EdsRelease(evfImage);
		evfImage = NULL;
	}

	// Restore the previous setting .
	device = orgdevice;
	EdsSetPropertyData(_camera, kEdsPropID_Evf_OutputDevice, 0, sizeof(device), &device);

	EndEvfCommand();

	return true;
}


EdsError CameraModel::GetFocalLength()
{
	EdsError err = EDS_ERR_OK;

	EdsEvfImageRef evfImage = NULL;
	EdsStreamRef stream = NULL;
	EdsUInt32 orgdevice = 0, device = 0, data;
	EdsUInt32 retry = 0;

	err = StartEvfCommand();

	err = EdsGetPropertyData(_camera, kEdsPropID_Evf_OutputDevice, 0, sizeof(orgdevice), &orgdevice);
	device = orgdevice;
	device |= kEdsEvfOutputDevice_PC;

	// Set to the Host.
	if (err == EDS_ERR_OK)
	{
		err = EdsSetPropertyData(_camera, kEdsPropID_Evf_OutputDevice, 0, sizeof(device), &device);
	}

	// Notification of error
	if (err != EDS_ERR_OK)
	{
		// It doesn't retry it at device busy
		if (err == EDS_ERR_DEVICE_BUSY)
		{
			std::cout << "DeviceBusy" << std::endl;
		}
		return false;
	}

	// create folder  ex) cam1
	EdsUInt32 camid;
	camid = (EdsUInt32)_bodyID;
	std::string directory_tree = "cam" + std::to_string(camid);
	if (fs::exists(directory_tree) == FALSE)
	{
		std::filesystem::create_directories(directory_tree);
	}

	std::string tmp;
	tmp = directory_tree + "/evf.jpg";
	char* filename = new char[tmp.size() + 1];
	strcpy(filename, tmp.c_str());

	// When creating to a file.
	err = EdsCreateFileStream(filename, kEdsFileCreateDisposition_CreateAlways, kEdsAccess_ReadWrite, &stream);

	// Create EvfImageRef.
	if (err == EDS_ERR_OK)
	{
		err = EdsCreateEvfImageRef(stream, &evfImage);
	}

	std::this_thread::sleep_for(1500ms);
	for (retry = 0; retry < 3; retry++)
	{
		// Download live view image data.
		if (err == EDS_ERR_OK)
		{
			std::this_thread::sleep_for(500ms);
			err = EdsDownloadEvfImage(_camera, evfImage);
		}

		// Get meta data for live view image data.
		if (err == EDS_ERR_OK)
		{
			_EVF_DATASET dataSet = { 0 };

			dataSet.stream = stream;


			// Get the size as a reference of the coordinates of rectangle of the focus border.
			err = EdsGetPropertyData(evfImage, kEdsPropID_Evf_FocalLength, 0, sizeof(dataSet.focalLength), &dataSet.focalLength);

			if (err == EDS_ERR_OK)
			{
				std::cout << "camera" << _bodyID << " : focal length is " << dataSet.focalLength << " mm. \n"
					<< std::endl;

			}
			else {
				std::cout << "camera" << _bodyID << " : Failed to get the focal length.\n"
					<< std::endl;
			}

		}

		// Notification of error
		if (err != EDS_ERR_OK)
		{
			// Retry getting image data if EDS_ERR_OBJECT_NOTREADY is returned
			// when the image data is not ready yet.
			if (err == EDS_ERR_OBJECT_NOTREADY)
			{
				std::cout << "Object not ready" << std::endl;
				std::this_thread::sleep_for(500ms);
				continue;
			}
			// It doesn't retry it at device busy
			if (err == EDS_ERR_DEVICE_BUSY)
			{
				std::cout << "DeviceBusy" << std::endl;
				break;
			}
		}
		else
		{
			break;
		}
	}

	if (stream != NULL)
	{
		EdsRelease(stream);
		stream = NULL;
	}

	if (evfImage != NULL)
	{
		EdsRelease(evfImage);
		evfImage = NULL;
	}

	// Restore the previous setting .
	device = orgdevice;
	EdsSetPropertyData(_camera, kEdsPropID_Evf_OutputDevice, 0, sizeof(device), &device);

	EndEvfCommand();

	return true;
}

EdsError CameraModel::GetCsdFileData()
{
    EdsError err = EDS_ERR_OK;
    EdsStreamRef stream = NULL; // Get csdfile data

    std::string tmp;
    std::string modelName;
    std::string fileName;

    // create folder  ex) csd
    std::string directory_tree = "csd";
    if (fs::exists(directory_tree) == FALSE)
    {
        std::filesystem::create_directories(directory_tree);
    }
	modelName = getModelName();

    EdsChar str[EDS_MAX_NAME] = {};

    // Get BodyIDEx.
    err = EdsGetPropertyData(_camera, kEdsPropID_BodyIDEx, 0, sizeof(str), &str);
	fileName = std::string(str) + ".CSD";
    std::replace(modelName.begin(), modelName.end(), ' ', '_');

    // create folder  ex) modelName
    directory_tree = "csd/" + modelName;
    if (fs::exists(directory_tree) == FALSE)
    {
        std::filesystem::create_directories(directory_tree);
    }

	// full path of CSD file
    tmp = directory_tree + "/" + fileName;

    char* fullPath = new char[tmp.size() + 1];
    strcpy(fullPath, tmp.c_str());

	std::cout << "[INFO] Export to folder: " << directory_tree << std::endl;
    // Create file stream for transfer destination
    if (err == EDS_ERR_OK)
    {
        err = EdsCreateFileStream(fullPath, kEdsFileCreateDisposition_CreateAlways, kEdsAccess_ReadWrite, &stream);
    }

    //Exportt CSD file
    if (err == EDS_ERR_OK)
    {
        err = EdsGetCsdFileData(_camera, stream);
    }

    // Release stream
    if (stream != NULL)
    {
        EdsRelease(stream);
        stream = NULL;
    }
    if (err == EDS_ERR_OK)
    {
        std::cout << "CSD file export completed successfully. : " << fileName << std::endl;
    }
	else
	{
		std::cout << "CSD file export failed. " << std::endl;
		fs::remove(fullPath);
	}

    return err;
}


EdsError CameraModel::SetCsdFileData()
{

    std::string directory_tree = "./csd";
    EdsError err = EDS_ERR_OK;
    EdsStreamRef stream; // Get csdfile data
    EdsUInt64 tmpReadSize = 0;
    EdsUInt64 actuallyReadSize = 0;
    EdsChar str[EDS_MAX_NAME] = {};

    std::string tmp;
    std::string modelName;
    modelName = getModelName();

    std::replace(modelName.begin(), modelName.end(), ' ', '_');
    tmp = directory_tree + "/" + modelName + "/";

    char* dirname = new char[tmp.size() + 1];

    strcpy(dirname, tmp.c_str());
    if (fs::exists(dirname) == TRUE)
    {
		std::cout << "[INFO] Read-from folder: " << dirname << std::endl;
        std::vector<fs::directory_entry> files;
        int idx = 1;
        for (const auto& entry : fs::directory_iterator(dirname)) {
            if (entry.is_regular_file()) {
                files.push_back(entry);
                std::cout << "[" << idx << "] " << entry.path().filename().string() << std::endl;
                idx++;
            }
        }
        if (files.empty()) {
			std::cout << "No files found in the folder." << std::endl;
		} else {
			std::cout << "Please select a file number: ";
			int sel = getvalue();
            if (sel >= 1 && sel <= files.size()) {
                std::cout << "You selected: " << files[sel - 1].path().filename().string() << std::endl;
                // Combine dirname and the selected file name to create filename
                std::string filename_str = dirname + files[sel - 1].path().filename().string();
                
                char* filename = new char[filename_str.size() + 1];
                strcpy(filename, filename_str.c_str());
                
                if (fs::exists(filename) == TRUE)
                {
                    // Open CSD file
                    err = EdsCreateFileStream(filename, kEdsFileCreateDisposition_OpenExisting, kEdsAccess_Read, &stream);
        			err = EdsSeek(stream, 0, kEdsSeek_Begin);
        			err = EdsGetLength(stream, &tmpReadSize);

       				 unsigned char* csdData = (unsigned char*)malloc(int(tmpReadSize) * sizeof(unsigned char));
        			if (csdData == NULL) {
            			// Error handling for memory allocation failure
        			}
					err = EdsRead(stream, tmpReadSize, csdData, &actuallyReadSize);
					
        			// Import CSD file
        			std::cout << "Import CSD file from " << filename << std::endl;
        			err = EdsSetCsdFileData(_camera, (EdsUInt32)actuallyReadSize, csdData);
        			free(csdData);
					// Release stream
					if (stream != NULL)
					{
						EdsRelease(stream);
						stream = NULL;
					}
					if (err == EDS_ERR_OK)
					{
						std::cout << "CSD file import completed successfully." << std::endl;
					}
					else {
						std::cout << "CSD file import failed." << std::endl;
					}					
      			}
                else {
                    std::cout << "CSD file not found" << std::endl;
                }
    		}
    		else {
                std::cout << "Invalid selection." << std::endl;
    		}
		}
	}
	else {
		std::cout << "CSD folder not found" << std::endl;
	}
    return err;
}
