import { Apple, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { desktopDownload } from "@/constants";

type DesktopOs = "windows" | "macos" | "other";

function detectDesktopOs(): DesktopOs {
  if (typeof navigator === "undefined") return "other";

  const ua = navigator.userAgent;
  if (/windows/i.test(ua)) return "windows";
  if (/mac os x|macintosh/i.test(ua)) return "macos";
  return "other";
}

const downloadTargets: Array<{
  key: Exclude<DesktopOs, "other">;
  label: string;
  hint: string;
  icon: typeof Monitor;
}> = [
  {
    key: "windows",
    label: "Windows",
    hint: "Windows 10/11 (64-bit) — kamera Canon didukung",
    icon: Monitor,
  },
  {
    key: "macos",
    label: "macOS",
    hint: "macOS — kamera webcam (Canon hanya di Windows)",
    icon: Apple,
  },
];

export default function DownloadPage() {
  const detectedOs = detectDesktopOs();
  const { version } = desktopDownload;

  return (
    <div className="h-full bg-background text-slate-900 font-sans bg-[linear-gradient(to_right,var(--secondary)_1px,transparent_1px),linear-gradient(to_bottom,var(--secondary)_1px,transparent_1px)] bg-size-[30px_30px] selection:text-emerald-900 flex flex-col items-center justify-center overflow-x-hidden relative p-4">
      <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-10 md:py-10 relative  rounded-3xl">
        <div className="max-w-4xl mx-auto relative z-10 my-4 text-center">
          {/* Green Design Canvas Bounding Box Frame (Exact Replica from open-design.ai) */}
          <div className="relative border-2 border-[#22c55e] p-6 sm:p-10 md:p-12 bg-transparent">
           
            {/* 8 Bounding Box Selection Handle Nodes */}
            <div className="selection-handle -top-1.25 -left-1.25"></div>
            <div className="selection-handle -top-1.25 -right-1.25"></div>
            <div className="selection-handle -bottom-1.25 -left-1.25"></div>
            <div className="selection-handle -bottom-1.25 -right-1.25"></div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-foreground tracking-tight leading-[1.12] mb-4 sm:mb-6">
              Download Dekstop App for Management Photobooth.
            </h1>

            {/* Subtitle with green marker highlight */}
            <p className="text-base sm:text-xl md:text-2xl text-primary/80 font-semibold max-w-3xl mx-auto leading-relaxed">
              <span className="marker-highlight font-bold text-secondary-foreground mr-1.5">
                One design Apps.
              </span>
              <span>
                Every photo, settings, frame photo, video, and dashboard
                stays on-brand.
              </span>
            </p>
          </div>

          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5">
            {downloadTargets.map((target) => {
              const Icon = target.icon;
              const url = desktopDownload[target.key];
              const isDetected = detectedOs === target.key;
              const disabled = url.length === 0;

              return (
                <Button
                  key={target.key}
                  title={target.hint}
                  aria-label={`Download aplikasi desktop untuk ${target.label}`}
                  disabled={disabled}
                  render={
                    disabled ? undefined : (
                      <a href={url} target="_blank" rel="noreferrer" />
                    )
                  }
                  className={`flex items-center gap-3 px-8 py-6 bg-background text-foreground border border-border shadow-[0_4px_0_var(--border)] hover:bg-background cursor-pointer hover:shadow-none hover:translate-y-1 transition duration-200 ${
                    isDetected ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <Icon aria-hidden="true" /> Download {target.label}
                </Button>
              );
            })}
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            Versi {version}
            {detectedOs !== "other" ? " · perangkat Anda terdeteksi" : ""}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            macOS pertama kali dibuka: klik kanan aplikasi lalu pilih Open.
          </p>
        </div>
      </section>
    </div>
  );
}
