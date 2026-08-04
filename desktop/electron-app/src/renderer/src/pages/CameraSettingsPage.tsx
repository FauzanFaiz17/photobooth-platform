import React, { useState, useEffect } from "react";

const API_BASE_URL = "http://127.0.0.1:5000";

// Helper to route through Electron IPC bridge or fall back to native fetch
const apiCall = async (endpoint: string, method = "GET", body: any = null) => {
  if (window.api?.request) {
    return await window.api.request(endpoint, method, body);
  }

  // Web Browser Fallback
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : null,
  });
  return await res.json();
};

interface CameraOption {
  name: string;
  value: number;
}

interface CameraOptionsMap {
  iso: CameraOption[];
  aperture: CameraOption[];
  shutter: CameraOption[];
  white_balance: CameraOption[];
}

export const CameraSettingsPage: React.FC = () => {
  const [options, setOptions] = useState<CameraOptionsMap>({
    iso: [],
    aperture: [],
    shutter: [],
    white_balance: [],
  });

  const [selectedIso, setSelectedIso] = useState<number | string>("");
  const [selectedAv, setSelectedAv] = useState<number | string>("");
  const [selectedTv, setSelectedTv] = useState<number | string>("");
  const [selectedWb, setSelectedWb] = useState<number | string>("");
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const [useWebcam, setUseWebcam] = useState<boolean>(false);
  
  const [saveDir, setSaveDir] = useState<string>("");
  const [currentSavePath, setCurrentSavePath] = useState<string>("");
  
  const [statusMessage, setStatusMessage] = useState<string>("Initializing...");
  const [isCapturing, setIsCapturing] = useState<boolean>(false);

  useEffect(() => {
    fetchCameraOptions();
  }, []);

  const fetchCameraOptions = async () => {
    try {
      setStatusMessage("Connecting to camera server...");
      const data = await apiCall("/options", "GET");

      if (data.status === "success") {
        setOptions(data.options);
        setSaveDir(data.save_dir);
        setCurrentSavePath(data.save_dir);
        setUseWebcam(!!data.use_webcam);

        if (data.options.iso.length > 0) setSelectedIso(data.options.iso[0].value);
        if (data.options.aperture.length > 0) setSelectedAv(data.options.aperture[0].value);
        if (data.options.shutter.length > 0) setSelectedTv(data.options.shutter[0].value);
        if (data.options.white_balance.length > 0) setSelectedWb(data.options.white_balance[0].value);

        setStatusMessage("Ready");
      } else {
        setStatusMessage(data.detail || "Error connecting to camera server");
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Error connecting to camera server");
    }
  };

  const toggleWebcamSource = async (enabled: boolean) => {
    setUseWebcam(enabled);
    setStatusMessage(`Switching source to ${enabled ? "Webcam" : "EDSDK"}...`);

    try {
      const data = await apiCall("/toggle_webcam", "POST", {
        use_webcam: enabled,
        device_index: 0,
      });

      if (data.status === "error") {
        setStatusMessage(data.detail || "Error toggling source");
      } else {
        setStatusMessage(data.message || "Source updated");
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Error toggling camera source");
    }
  };

  const updateCameraSetting = async (property: string, value: string) => {
    const numValue = parseInt(value, 10);
    setStatusMessage(`Updating ${property}...`);

    try {
      const data = await apiCall("/set_property", "POST", {
        property,
        value: numValue,
      });

      if (data.status === "error") {
        setStatusMessage(data.detail || `Error updating ${property}`);
      } else {
        setStatusMessage(data.message || `${property} updated`);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage(`Error updating ${property}`);
    }
  };

  const toggleMirror = async (enabled: boolean) => {
    setIsMirrored(enabled);
    setStatusMessage(`Setting mirror mode to ${enabled ? "On" : "Off"}...`);

    try {
      const data = await apiCall("/toggle_mirror", "POST", { mirror: enabled });
      
      if (data.status === "error") {
        setStatusMessage(data.detail || "Error toggling mirror mode");
      } else {
        setStatusMessage(`Mirror mode ${data.mirror_mode ? "enabled" : "disabled"}`);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Error toggling mirror mode");
    }
  };

  const triggerCapture = async () => {
    setIsCapturing(true);
    setStatusMessage("Capturing full-resolution frame...");

    try {
      const data = await apiCall("/capture", "POST");
      
      if (data.status === "error") {
        setStatusMessage(data.detail || "Capture failed");
      } else {
        setStatusMessage(data.message || "Capture triggered");
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Error triggering capture");
    } finally {
      setTimeout(() => {
        setIsCapturing(false);
      }, 2000);
    }
  };

  const updateSaveDir = async () => {
    setStatusMessage("Updating save directory...");

    try {
      const data = await apiCall("/set_save_dir", "POST", { path: saveDir });

      if (data.status === "error") {
        setStatusMessage(data.detail || "Error setting save directory");
      } else {
        setStatusMessage(data.message);
        if (data.status === "success") {
          const cleanPath = data.message.replace("Host save folder set to: ", "");
          setCurrentSavePath(cleanPath);
        }
      }
    } catch (err) {
      console.error(err);
      setStatusMessage("Error setting save directory");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans p-6">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => console.log("Back clicked")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 text-sm font-medium"
          >
            ← Back
          </button>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Camera Controller
          </h1>
        </div>
        <div className="text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
          {statusMessage}
        </div>
      </header>

      {/* Main 2-Column Section */}
      <main className="grid grid-cols-12 gap-8 flex-1 items-start">
        
        {/* Left Column: Live Feed (Direct http URL for video stream) */}
        <section className="col-span-12 lg:col-span-7 flex flex-col items-center justify-center bg-slate-950/50 rounded-2xl p-6 border border-slate-800/80 min-h-[480px]">
          <div 
            className={`relative w-full max-w-lg aspect-video rounded-xl overflow-hidden bg-black shadow-2xl border border-slate-800 flex items-center justify-center transition-transform duration-300 ${
              isMirrored ? "scale-x-[-1]" : ""
            }`}
          >
            <img
              src={`${API_BASE_URL}/video_feed`}
              alt="Camera Stream"
              className="w-full h-full object-contain pointer-events-none"
            />
          </div>
          <p className="text-xs text-slate-500 mt-3 font-mono">
            LIVE VIEW STREAM [{useWebcam ? "WEBCAM" : "EDSDK"}] {isMirrored ? "(MIRRORED)" : ""}
          </p>
        </section>

        {/* Right Column: Settings Panel */}
        <section className="col-span-12 lg:col-span-5 flex flex-col gap-5 bg-slate-800/40 p-6 rounded-2xl border border-slate-800">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Camera Controls
          </h2>

          <div className="flex flex-col gap-4">
            
            {/* Camera Source Selector */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sourceSelect" className="text-xs font-medium text-slate-300">
                Camera Source
              </label>
              <select
                id="sourceSelect"
                value={useWebcam ? "webcam" : "edsdk"}
                onChange={(e) => toggleWebcamSource(e.target.value === "webcam")}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              >
                <option value="edsdk">Canon EDSDK Camera</option>
                <option value="webcam">Webcam</option>
              </select>
            </div>

            {/* ISO */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="isoSelect" className={`text-xs font-medium ${useWebcam ? "text-slate-500" : "text-slate-300"}`}>
                ISO {useWebcam && "(EDSDK Only)"}
              </label>
              <select
                id="isoSelect"
                disabled={useWebcam}
                value={selectedIso}
                onChange={(e) => {
                  setSelectedIso(e.target.value);
                  updateCameraSetting("iso", e.target.value);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {options.iso.map((iso) => (
                  <option key={iso.value} value={iso.value}>
                    {iso.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Aperture */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="apertureSelect" className={`text-xs font-medium ${useWebcam ? "text-slate-500" : "text-slate-300"}`}>
                Aperture (Av) {useWebcam && "(EDSDK Only)"}
              </label>
              <select
                id="apertureSelect"
                disabled={useWebcam}
                value={selectedAv}
                onChange={(e) => {
                  setSelectedAv(e.target.value);
                  updateCameraSetting("aperture", e.target.value);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {options.aperture.map((av) => (
                  <option key={av.value} value={av.value}>
                    {av.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Shutter Speed */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="shutterSelect" className={`text-xs font-medium ${useWebcam ? "text-slate-500" : "text-slate-300"}`}>
                Shutter Speed {useWebcam && "(EDSDK Only)"}
              </label>
              <select
                id="shutterSelect"
                disabled={useWebcam}
                value={selectedTv}
                onChange={(e) => {
                  setSelectedTv(e.target.value);
                  updateCameraSetting("shutter", e.target.value);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {options.shutter.map((tv) => (
                  <option key={tv.value} value={tv.value}>
                    {tv.name}
                  </option>
                ))}
              </select>
            </div>

            {/* White Balance */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="whiteBalanceSelect" className={`text-xs font-medium ${useWebcam ? "text-slate-500" : "text-slate-300"}`}>
                White Balance {useWebcam && "(EDSDK Only)"}
              </label>
              <select
                id="whiteBalanceSelect"
                disabled={useWebcam}
                value={selectedWb}
                onChange={(e) => {
                  setSelectedWb(e.target.value);
                  updateCameraSetting("white_balance", e.target.value);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {options.white_balance.map((wb) => (
                  <option key={wb.value} value={wb.value}>
                    {wb.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Mirror Feed */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="mirrorSelect" className="text-xs font-medium text-slate-300">
                Mirror Feed
              </label>
              <select
                id="mirrorSelect"
                value={isMirrored ? "true" : "false"}
                onChange={(e) => toggleMirror(e.target.value === "true")}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              >
                <option value="false">Off</option>
                <option value="true">On</option>
              </select>
            </div>

            {/* Directory Input & Action */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-700/50">
              <label htmlFor="saveDir" className="text-xs font-medium text-slate-300">
                Target Save Directory
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="saveDir"
                  value={saveDir}
                  onChange={(e) => setSaveDir(e.target.value)}
                  placeholder="Host Target Directory"
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
                <button
                  onClick={updateSaveDir}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-white text-sm font-medium rounded-lg transition"
                >
                  Set
                </button>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-1">
                Active: <span className="font-mono text-slate-300">{currentSavePath || "Not set"}</span>
              </p>
            </div>

            {/* Capture Action */}
            <button
              id="captureBtn"
              disabled={isCapturing || useWebcam}
              onClick={triggerCapture}
              className="mt-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 text-white font-medium rounded-xl shadow-lg transition duration-150 flex items-center justify-center gap-2"
            >
              {isCapturing ? "Capturing..." : useWebcam ? "Capture Disabled (Webcam)" : "Capture Frame"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default CameraSettingsPage;